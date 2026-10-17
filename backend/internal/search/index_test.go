package search

import (
	"context"
	"math"
	"os"
	"testing"
)

func TestFTSQuery(t *testing.T) {
	tests := map[string]string{
		"Karłowicz":                      `"karlowicz"*`,
		"Jaki koncert Chopina polecisz?": `"chopina"*`,
		"jazz w ten weekend":             `"jazz"* OR "weekend"*`,
		"a i o":                          "",
		`"; DROP TABLE docs; --`:         `"drop"* OR "table"* OR "docs"*`,
	}
	for in, want := range tests {
		if got := ftsQuery(in); got != want {
			t.Errorf("ftsQuery(%q) = %q, want %q", in, got, want)
		}
	}
}

func TestVectorRoundTrip(t *testing.T) {
	v := []float32{0.25, -1, 3.5, 0}
	got := decodeVector(encodeVector(v))
	for i := range v {
		if got[i] != v[i] {
			t.Fatalf("decode(encode(%v)) = %v", v, got)
		}
	}
	if c := cosine(v, v); math.Abs(c-1) > 1e-9 {
		t.Errorf("cosine(v, v) = %v, want 1", c)
	}
}

func TestSearchIndex(t *testing.T) {
	path := "../../../data/search.sqlite"
	if _, err := os.Stat(path); err != nil {
		t.Skipf("search index not built: %v", err)
	}
	ix, err := Open(path)
	if err != nil {
		t.Fatal(err)
	}
	defer ix.Close()
	if ix.Size() == 0 || ix.Model() == "" {
		t.Fatalf("index has %d vectors, model %q", ix.Size(), ix.Model())
	}

	// Full-text only (no query vector), diacritics folded.
	hits, err := ix.Search(context.Background(), "vivaldi", nil, 5)
	if err != nil {
		t.Fatal(err)
	}
	if len(hits) == 0 {
		t.Fatal("no hits for vivaldi")
	}

	// A stored vector finds its own event first.
	own := ix.vecs[0]
	hits, err = ix.Search(context.Background(), "", own.vec, 3)
	if err != nil {
		t.Fatal(err)
	}
	if len(hits) == 0 || hits[0].EventID != own.eventID {
		t.Fatalf("vector search hits = %v, want event %d first", hits, own.eventID)
	}
}
