// Package search keeps a side index of the catalog for the voice assistant:
// one document per event and language, searchable with SQLite FTS5 (BM25) and
// with embedding vectors stored as float32 BLOBs. Queries combine both rankings
// with reciprocal rank fusion.
package search

import (
	"context"
	"database/sql"
	"encoding/binary"
	"fmt"
	"math"
	"net/url"
	"sort"
	"strings"
	"unicode"

	"github.com/SergiuszN/grupa_b/backend/internal/catalog"
)

const schema = `
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS docs (
	id INTEGER PRIMARY KEY,
	event_id INTEGER NOT NULL,
	language_code TEXT NOT NULL,
	title TEXT NOT NULL,
	body TEXT NOT NULL,
	hash TEXT NOT NULL,
	embedding BLOB,
	UNIQUE (event_id, language_code)
);
-- Text is folded (lowercase, no diacritics) before indexing, like catalog.Fold.
CREATE VIRTUAL TABLE IF NOT EXISTS docs_fts USING fts5(title, body, tokenize = 'unicode61');
`

// Hit is an event found by a query; a higher Score is better.
type Hit struct {
	EventID int64
	Score   float64
}

type docVec struct {
	eventID int64
	vec     []float32
}

// Index is the read-only search index loaded by the API.
type Index struct {
	db    *sql.DB
	model string
	vecs  []docVec
}

// Open opens the index read-only and loads all embeddings into memory.
func Open(path string) (*Index, error) {
	dsn := "file:" + (&url.URL{Path: path}).EscapedPath() + "?mode=ro&_pragma=query_only(1)"
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, err
	}
	ix := &Index{db: db}
	if err := db.QueryRow("SELECT value FROM meta WHERE key = 'embedding_model'").Scan(&ix.model); err != nil {
		db.Close()
		return nil, fmt.Errorf("open search index %s: %w", path, err)
	}
	rows, err := db.Query("SELECT event_id, embedding FROM docs WHERE embedding IS NOT NULL")
	if err != nil {
		db.Close()
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var d docVec
		var blob []byte
		if err := rows.Scan(&d.eventID, &blob); err != nil {
			db.Close()
			return nil, err
		}
		d.vec = decodeVector(blob)
		ix.vecs = append(ix.vecs, d)
	}
	if err := rows.Err(); err != nil {
		db.Close()
		return nil, err
	}
	return ix, nil
}

// Close closes the index database.
func (ix *Index) Close() error { return ix.db.Close() }

// Model is the embedding model the vectors were built with; query vectors must use the same one.
func (ix *Index) Model() string { return ix.model }

// Size is the number of embedded documents.
func (ix *Index) Size() int { return len(ix.vecs) }

// Search ranks events by the text query (FTS5) and the query vector (cosine
// similarity), fused with reciprocal rank fusion. queryVec may be nil.
func (ix *Index) Search(ctx context.Context, query string, queryVec []float32, limit int) ([]Hit, error) {
	const k = 60.0 // RRF constant
	scores := map[int64]float64{}

	if match := ftsQuery(query); match != "" {
		rows, err := ix.db.QueryContext(ctx, `SELECT d.event_id FROM docs_fts f JOIN docs d ON d.id = f.rowid
			WHERE docs_fts MATCH ? ORDER BY bm25(docs_fts, 5.0, 1.0) LIMIT 60`, match)
		if err != nil {
			return nil, err
		}
		rank := 0
		seen := map[int64]bool{}
		for rows.Next() {
			var id int64
			if err := rows.Scan(&id); err != nil {
				rows.Close()
				return nil, err
			}
			if !seen[id] { // best document per event (another language may match too)
				seen[id] = true
				rank++
				scores[id] += 1 / (k + float64(rank))
			}
		}
		rows.Close()
		if err := rows.Err(); err != nil {
			return nil, err
		}
	}

	if len(queryVec) > 0 {
		best := map[int64]float64{}
		for _, d := range ix.vecs {
			if s := cosine(queryVec, d.vec); s > best[d.eventID] {
				best[d.eventID] = s
			}
		}
		type scored struct {
			id  int64
			sim float64
		}
		ranked := make([]scored, 0, len(best))
		for id, s := range best {
			ranked = append(ranked, scored{id, s})
		}
		sort.Slice(ranked, func(i, j int) bool { return ranked[i].sim > ranked[j].sim })
		for i, r := range ranked[:min(len(ranked), 40)] {
			scores[r.id] += 1 / (k + float64(i+1))
		}
	}

	hits := make([]Hit, 0, len(scores))
	for id, s := range scores {
		hits = append(hits, Hit{EventID: id, Score: s})
	}
	sort.Slice(hits, func(i, j int) bool {
		if hits[i].Score != hits[j].Score {
			return hits[i].Score > hits[j].Score
		}
		return hits[i].EventID < hits[j].EventID
	})
	if limit > 0 && len(hits) > limit {
		hits = hits[:limit]
	}
	return hits, nil
}

// ftsQuery turns free text into an FTS5 query: every word as a prefix, any may match.
func ftsQuery(q string) string {
	words := strings.FieldsFunc(catalog.Fold(q), func(r rune) bool {
		return !unicode.IsLetter(r) && !unicode.IsDigit(r)
	})
	var terms []string
	for _, w := range words {
		if len([]rune(w)) < 3 || stopwords[w] {
			continue
		}
		terms = append(terms, `"`+w+`"*`)
	}
	return strings.Join(terms, " OR ")
}

// stopwords are frequent words of the spoken queries that would match nearly every document.
var stopwords = map[string]bool{}

func init() {
	for _, w := range strings.Fields(`
		ten tej tym tego jak jaki jakie jakis jakas cos czy dla gdzie kiedy ktore ktory ktora jest sa bedzie moze mozna
		chce chcialbym chcialabym poszukaj znajdz polec polecisz prosze dzis jutro koncert koncerty
		koncertu wydarzenie wydarzenia filharmonia filharmonii the and for with what which are there
		any some want would like concert concerts event events was ist sind gibt eine einen ein der die
		das und fur mit konzert konzerte`) {
		stopwords[w] = true
	}
}

func cosine(a, b []float32) float64 {
	if len(a) != len(b) {
		return 0
	}
	var dot, na, nb float64
	for i := range a {
		x, y := float64(a[i]), float64(b[i])
		dot += x * y
		na += x * x
		nb += y * y
	}
	if na == 0 || nb == 0 {
		return 0
	}
	return dot / math.Sqrt(na*nb)
}

func encodeVector(v []float32) []byte {
	b := make([]byte, 4*len(v))
	for i, x := range v {
		binary.LittleEndian.PutUint32(b[4*i:], math.Float32bits(x))
	}
	return b
}

func decodeVector(b []byte) []float32 {
	v := make([]float32, len(b)/4)
	for i := range v {
		v[i] = math.Float32frombits(binary.LittleEndian.Uint32(b[4*i:]))
	}
	return v
}
