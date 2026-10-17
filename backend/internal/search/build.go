package search

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"fmt"
	"log/slog"
	"net/url"
	"strings"

	"github.com/SergiuszN/grupa_b/backend/internal/catalog"
)

// Embedder turns texts into vectors (one per input, in order).
type Embedder func(ctx context.Context, inputs []string) ([][]float32, error)

type doc struct {
	eventID int64
	lang    string
	title   string
	body    string
	hash    string
	vec     []byte
}

// maxEmbedChars keeps documents well below the embedding model's token limit.
const maxEmbedChars = 8000

// Build (re)creates the index at indexPath from the catalog database. Embeddings
// of documents whose text did not change are reused, so rebuilding is cheap.
func Build(ctx context.Context, catalogPath, indexPath, model string, embed Embedder) error {
	src, err := sql.Open("sqlite", "file:"+(&url.URL{Path: catalogPath}).EscapedPath()+"?mode=ro&_pragma=query_only(1)")
	if err != nil {
		return err
	}
	defer src.Close()

	docs, err := collectDocs(ctx, src)
	if err != nil {
		return fmt.Errorf("read catalog: %w", err)
	}

	dst, err := sql.Open("sqlite", "file:"+(&url.URL{Path: indexPath}).EscapedPath()+"?_pragma=journal_mode(delete)")
	if err != nil {
		return err
	}
	defer dst.Close()
	dst.SetMaxOpenConns(1)
	if _, err := dst.ExecContext(ctx, schema); err != nil {
		return fmt.Errorf("create schema: %w", err)
	}

	// Reuse vectors of unchanged documents built with the same model.
	var oldModel string
	_ = dst.QueryRowContext(ctx, "SELECT value FROM meta WHERE key = 'embedding_model'").Scan(&oldModel)
	cached := map[string][]byte{}
	if oldModel == model {
		rows, err := dst.QueryContext(ctx, "SELECT hash, embedding FROM docs WHERE embedding IS NOT NULL")
		if err != nil {
			return err
		}
		for rows.Next() {
			var h string
			var v []byte
			if err := rows.Scan(&h, &v); err != nil {
				rows.Close()
				return err
			}
			cached[h] = v
		}
		rows.Close()
	}

	var todo []int
	for i := range docs {
		if v, ok := cached[docs[i].hash]; ok {
			docs[i].vec = v
		} else {
			todo = append(todo, i)
		}
	}
	slog.Info("search index", "documents", len(docs), "to_embed", len(todo), "model", model)

	const batch = 50
	for start := 0; start < len(todo); start += batch {
		part := todo[start:min(start+batch, len(todo))]
		inputs := make([]string, len(part))
		for j, i := range part {
			inputs[j] = truncate(docs[i].title+"\n\n"+docs[i].body, maxEmbedChars)
		}
		vecs, err := embed(ctx, inputs)
		if err != nil {
			return fmt.Errorf("embed: %w", err)
		}
		for j, i := range part {
			docs[i].vec = encodeVector(vecs[j])
		}
		slog.Info("embedded", "done", min(start+batch, len(todo)), "of", len(todo))
	}

	tx, err := dst.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	for _, q := range []string{"DELETE FROM docs", "DELETE FROM docs_fts"} {
		if _, err := tx.ExecContext(ctx, q); err != nil {
			return err
		}
	}
	for _, d := range docs {
		res, err := tx.ExecContext(ctx, `INSERT INTO docs (event_id, language_code, title, body, hash, embedding)
			VALUES (?, ?, ?, ?, ?, ?)`, d.eventID, d.lang, d.title, d.body, d.hash, d.vec)
		if err != nil {
			return err
		}
		id, _ := res.LastInsertId()
		if _, err := tx.ExecContext(ctx, "INSERT INTO docs_fts (rowid, title, body) VALUES (?, ?, ?)",
			id, catalog.Fold(d.title), catalog.Fold(d.body)); err != nil {
			return err
		}
	}
	if _, err := tx.ExecContext(ctx, `INSERT INTO meta (key, value) VALUES ('embedding_model', ?)
		ON CONFLICT (key) DO UPDATE SET value = excluded.value`, model); err != nil {
		return err
	}
	if err := tx.Commit(); err != nil {
		return err
	}
	_, err = dst.ExecContext(ctx, "INSERT INTO docs_fts (docs_fts) VALUES ('optimize'); VACUUM")
	return err
}

// collectDocs builds one text document per published event and translation.
func collectDocs(ctx context.Context, db *sql.DB) ([]doc, error) {
	rows, err := db.QueryContext(ctx, `SELECT e.id, t.language_code, e.kind, t.title,
			COALESCE(t.subtitle, ''), COALESCE(t.summary, ''), COALESCE(t.description, ''), COALESCE(t.why_attend, ''),
			COALESCE(t.audience_note, ''), COALESCE(t.programme_notes, '')
		FROM events e JOIN event_translations t ON t.event_id = e.id
		WHERE e.published = 1 ORDER BY e.id, t.language_code`)
	if err != nil {
		return nil, err
	}
	var docs []doc
	var kinds []string
	for rows.Next() {
		var d doc
		var kind, subtitle, summary, description, why, audience, programme string
		if err := rows.Scan(&d.eventID, &d.lang, &kind, &d.title, &subtitle, &summary, &description, &why, &audience, &programme); err != nil {
			rows.Close()
			return nil, err
		}
		d.body = joinNonEmpty("\n", subtitle, summary, description, why, audience, programme)
		docs = append(docs, d)
		kinds = append(kinds, kind)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return nil, err
	}

	for i := range docs {
		d := &docs[i]
		facts, err := eventFacts(ctx, db, d.eventID, d.lang)
		if err != nil {
			return nil, err
		}
		d.body = joinNonEmpty("\n", d.body, kindLabels[kinds[i]], facts)
		sum := sha256.Sum256([]byte(d.title + "\x00" + d.body))
		d.hash = hex.EncodeToString(sum[:])
	}
	return docs, nil
}

// eventFacts lists performers, programme, series, venues and audiences of an event.
func eventFacts(ctx context.Context, db *sql.DB, id int64, lang string) (string, error) {
	queries := []struct {
		label string
		query string
		args  []any
	}{
		{"Wykonawcy / Performers", `SELECT a.display_name || ' (' || ea.role || ')' FROM event_artists ea
			JOIN artists a ON a.id = ea.artist_id WHERE ea.event_id = ? ORDER BY ea.position`, []any{id}},
		{"Program / Programme", `SELECT COALESCE(c.display_name || ': ', '') || COALESCE(
				(SELECT title FROM work_translations WHERE work_id = w.id AND language_code = ?), w.default_title)
			FROM event_works ew JOIN works w ON w.id = ew.work_id LEFT JOIN artists c ON c.id = w.composer_id
			WHERE ew.event_id = ? ORDER BY ew.position`, []any{lang, id}},
		{"Cykl / Series", `SELECT COALESCE((SELECT name FROM series_translations WHERE series_id = s.id AND language_code = ?),
				(SELECT name FROM series_translations WHERE series_id = s.id AND language_code = 'pl'), s.slug)
			FROM event_series es JOIN series s ON s.id = es.series_id WHERE es.event_id = ?`, []any{lang, id}},
		{"Miejsce / Venue", `SELECT DISTINCT v.name FROM performances p JOIN venues v ON v.id = p.venue_id
			WHERE p.event_id = ?`, []any{id}},
		{"Dla kogo / Audience", `SELECT ag.slug FROM event_audiences ea JOIN audience_groups ag ON ag.id = ea.audience_id
			WHERE ea.event_id = ?`, []any{id}},
	}
	var parts []string
	for _, q := range queries {
		rows, err := db.QueryContext(ctx, q.query, q.args...)
		if err != nil {
			return "", err
		}
		var vals []string
		for rows.Next() {
			var v sql.NullString
			if err := rows.Scan(&v); err != nil {
				rows.Close()
				return "", err
			}
			if v.Valid && v.String != "" {
				vals = append(vals, v.String)
			}
		}
		rows.Close()
		if len(vals) > 0 {
			parts = append(parts, q.label+": "+strings.Join(vals, "; "))
		}
	}
	return strings.Join(parts, "\n"), nil
}

// kindLabels add searchable words for the event kind in all languages.
var kindLabels = map[string]string{
	"symphonic":  "Rodzaj: koncert symfoniczny, orkiestra / symphonic concert, orchestra / Sinfoniekonzert",
	"chamber":    "Rodzaj: koncert kameralny / chamber music / Kammermusik",
	"jazz":       "Rodzaj: koncert jazzowy, jazz / Jazzkonzert",
	"concert":    "Rodzaj: koncert / concert / Konzert",
	"education":  "Rodzaj: edukacja, dla dzieci i młodzieży / education, kids / Bildung, Kinder",
	"exhibition": "Rodzaj: wystawa, sztuka, galeria / exhibition, art / Ausstellung",
	"tour":       "Rodzaj: zwiedzanie budynku / guided tour / Führung",
	"festival":   "Rodzaj: festiwal / festival / Festival",
	"external":   "Rodzaj: wydarzenie zewnętrzne / external event / Gastveranstaltung",
	"other":      "Rodzaj: inne wydarzenie / other event",
}

func joinNonEmpty(sep string, parts ...string) string {
	out := parts[:0:0]
	for _, p := range parts {
		if p = strings.TrimSpace(p); p != "" {
			out = append(out, p)
		}
	}
	return strings.Join(out, sep)
}

func truncate(s string, n int) string {
	r := []rune(s)
	if len(r) <= n {
		return s
	}
	return string(r[:n])
}
