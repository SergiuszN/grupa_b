// Package search keeps a side index for the voice assistant: one document
// per event and language, plus practical visitor information (tickets,
// parking, accessibility...). Both are searchable with SQLite FTS5 (BM25) and
// with embedding vectors stored as float32 BLOBs; queries combine the two
// rankings with reciprocal rank fusion.
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
CREATE TABLE IF NOT EXISTS info (
	id INTEGER PRIMARY KEY,
	slug TEXT NOT NULL UNIQUE,
	category TEXT NOT NULL,
	title TEXT NOT NULL,
	body TEXT NOT NULL,
	url TEXT NOT NULL,
	hash TEXT NOT NULL,
	embedding BLOB
);
CREATE VIRTUAL TABLE IF NOT EXISTS info_fts USING fts5(title, body, tokenize = 'unicode61');
`

// Hit is an event found by a query; a higher Score is better.
type Hit struct {
	EventID int64
	Score   float64
}

// Info is one entry of practical visitor information, with its source page.
type Info struct {
	Slug     string `json:"id"`
	Category string `json:"category"`
	Title    string `json:"title"`
	Content  string `json:"content"`
	URL      string `json:"url"`
}

// vector is an embedded document; key is the event id (docs) or the info row id.
type vector struct {
	key int64
	vec []float32
}

// Index is the read-only search index loaded by the API.
type Index struct {
	db        *sql.DB
	model     string
	vecs      []vector // events
	infoVecs  []vector
	infoCount int
}

// Open opens the index read-only and loads all embeddings into memory.
func Open(path string) (*Index, error) {
	dsn := "file:" + (&url.URL{Path: path}).EscapedPath() + "?mode=ro&_pragma=query_only(1)"
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, err
	}
	ix := &Index{db: db}
	if err := ix.load(); err != nil {
		db.Close()
		return nil, fmt.Errorf("open search index %s: %w", path, err)
	}
	return ix, nil
}

func (ix *Index) load() error {
	if err := ix.db.QueryRow("SELECT value FROM meta WHERE key = 'embedding_model'").Scan(&ix.model); err != nil {
		return err
	}
	var err error
	if ix.vecs, err = loadVectors(ix.db, "SELECT event_id, embedding FROM docs WHERE embedding IS NOT NULL"); err != nil {
		return err
	}
	// Indexes built before visitor information existed have no info table.
	var hasInfo int
	_ = ix.db.QueryRow("SELECT COUNT(*) FROM sqlite_master WHERE name = 'info'").Scan(&hasInfo)
	if hasInfo == 0 {
		return nil
	}
	if err := ix.db.QueryRow("SELECT COUNT(*) FROM info").Scan(&ix.infoCount); err != nil {
		return err
	}
	ix.infoVecs, err = loadVectors(ix.db, "SELECT id, embedding FROM info WHERE embedding IS NOT NULL")
	return err
}

func loadVectors(db *sql.DB, query string) ([]vector, error) {
	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []vector
	for rows.Next() {
		var v vector
		var blob []byte
		if err := rows.Scan(&v.key, &blob); err != nil {
			return nil, err
		}
		v.vec = decodeVector(blob)
		out = append(out, v)
	}
	return out, rows.Err()
}

// Close closes the index database.
func (ix *Index) Close() error { return ix.db.Close() }

// Model is the embedding model the vectors were built with; query vectors must use the same one.
func (ix *Index) Model() string { return ix.model }

// Size is the number of embedded event documents.
func (ix *Index) Size() int { return len(ix.vecs) }

// InfoSize is the number of visitor information entries.
func (ix *Index) InfoSize() int { return ix.infoCount }

// Search ranks events by the text query (FTS5) and the query vector (cosine
// similarity), fused with reciprocal rank fusion. queryVec may be nil.
func (ix *Index) Search(ctx context.Context, query string, queryVec []float32, limit int) ([]Hit, error) {
	text, err := ix.ftsRank(ctx, `SELECT d.event_id FROM docs_fts f JOIN docs d ON d.id = f.rowid
		WHERE docs_fts MATCH ? ORDER BY bm25(docs_fts, 5.0, 1.0) LIMIT 60`, query)
	if err != nil {
		return nil, err
	}
	scores := fuse(text, vectorRank(ix.vecs, queryVec, 40))
	hits := make([]Hit, len(scores))
	for i, s := range scores {
		hits[i] = Hit{EventID: s.key, Score: s.score}
	}
	return hits[:min(len(hits), max(limit, 0))], nil
}

// SearchInfo returns the visitor information entries best matching the query.
func (ix *Index) SearchInfo(ctx context.Context, query string, queryVec []float32, limit int) ([]Info, error) {
	if ix.infoCount == 0 {
		return nil, nil
	}
	text, err := ix.ftsRank(ctx, `SELECT rowid FROM info_fts WHERE info_fts MATCH ?
		ORDER BY bm25(info_fts, 3.0, 1.0) LIMIT 20`, query)
	if err != nil {
		return nil, err
	}
	scores := fuse(text, vectorRank(ix.infoVecs, queryVec, 10))
	out := make([]Info, 0, limit)
	for _, s := range scores[:min(len(scores), limit)] {
		var in Info
		if err := ix.db.QueryRowContext(ctx, "SELECT slug, category, title, body, url FROM info WHERE id = ?", s.key).
			Scan(&in.Slug, &in.Category, &in.Title, &in.Content, &in.URL); err != nil {
			return nil, err
		}
		out = append(out, in)
	}
	return out, nil
}

// ftsRank runs a full-text query returning keys best first, each key once.
func (ix *Index) ftsRank(ctx context.Context, sqlQuery, text string) ([]int64, error) {
	match := ftsQuery(text)
	if match == "" {
		return nil, nil
	}
	rows, err := ix.db.QueryContext(ctx, sqlQuery, match)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []int64
	seen := map[int64]bool{}
	for rows.Next() {
		var key int64
		if err := rows.Scan(&key); err != nil {
			return nil, err
		}
		if !seen[key] { // best document per event (another language may match too)
			seen[key] = true
			out = append(out, key)
		}
	}
	return out, rows.Err()
}

// vectorRank returns the keys of the n most similar vectors, best first.
func vectorRank(vecs []vector, query []float32, n int) []int64 {
	if len(query) == 0 {
		return nil
	}
	best := map[int64]float64{}
	for _, v := range vecs {
		if s := cosine(query, v.vec); s > best[v.key] {
			best[v.key] = s
		}
	}
	keys := make([]int64, 0, len(best))
	for k := range best {
		keys = append(keys, k)
	}
	sort.Slice(keys, func(i, j int) bool { return best[keys[i]] > best[keys[j]] })
	return keys[:min(len(keys), n)]
}

type scored struct {
	key   int64
	score float64
}

// fuse combines rankings with reciprocal rank fusion, best first.
func fuse(rankings ...[]int64) []scored {
	const k = 60.0
	scores := map[int64]float64{}
	for _, ranking := range rankings {
		for i, key := range ranking {
			scores[key] += 1 / (k + float64(i+1))
		}
	}
	out := make([]scored, 0, len(scores))
	for key, s := range scores {
		out = append(out, scored{key, s})
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].score != out[j].score {
			return out[i].score > out[j].score
		}
		return out[i].key < out[j].key
	})
	return out
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
