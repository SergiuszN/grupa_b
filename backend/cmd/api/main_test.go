package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"strconv"
	"strings"
	"testing"
	"time"

	"github.com/SergiuszN/grupa_b/backend/internal/catalog"
)

// The demo database snapshot starts on 2026-10-18; tests pin "now" to the day before (a Saturday).
var testNow = time.Date(2026, 10, 17, 12, 0, 0, 0, warsaw)

func newTestServer(t *testing.T) http.Handler {
	t.Helper()
	path := getenv("DB_PATH", "../../../data/filharmonia.sqlite")
	if _, err := os.Stat(path); err != nil {
		t.Skipf("demo database not available: %v", err)
	}
	store, err := catalog.Open(path)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { store.Close() })

	mux := http.NewServeMux()
	(&api{store: store, now: func() time.Time { return testNow }}).routes(mux)
	return withCORS(mux)
}

func get(t *testing.T, h http.Handler, url string, wantStatus int) map[string]any {
	t.Helper()
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, url, nil))
	if rec.Code != wantStatus {
		t.Fatalf("GET %s: status = %d, want %d; body: %s", url, rec.Code, wantStatus, rec.Body.String())
	}
	var body map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("GET %s: invalid JSON: %v", url, err)
	}
	return body
}

func items(t *testing.T, body map[string]any) []map[string]any {
	t.Helper()
	raw, ok := body["data"].([]any)
	if !ok {
		t.Fatalf("data is not a list: %v", body["data"])
	}
	out := make([]map[string]any, len(raw))
	for i, v := range raw {
		out[i] = v.(map[string]any)
	}
	return out
}

func total(body map[string]any) int {
	return int(body["meta"].(map[string]any)["total"].(float64))
}

func TestHealthz(t *testing.T) {
	rec := httptest.NewRecorder()
	newRouter(nil, nil).ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/healthz", nil))

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	if got, want := rec.Body.String(), "{\"status\":\"ok\"}\n"; got != want {
		t.Fatalf("body = %q, want %q", got, want)
	}
	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "*" {
		t.Fatalf("CORS header = %q, want *", got)
	}
}

func TestListEvents(t *testing.T) {
	h := newTestServer(t)

	all := get(t, h, "/api/v1/events?limit=100", http.StatusOK)
	if total(all) != 100 {
		t.Fatalf("total = %d, want 100 upcoming events", total(all))
	}
	evs := items(t, all)
	prev := ""
	for _, e := range evs {
		perfs := e["performances"].([]any)
		if len(perfs) == 0 {
			t.Fatalf("event %v has no performances", e["id"])
		}
		first := perfs[0].(map[string]any)["starts_at"].(string)
		if first < prev {
			t.Fatalf("events not sorted by first date: %s after %s", first, prev)
		}
		prev = first
	}

	for _, e := range items(t, get(t, h, "/api/v1/events?kind=jazz", http.StatusOK)) {
		if e["kind"] != "jazz" {
			t.Fatalf("kind filter returned %v", e["kind"])
		}
	}

	// Ten weekend = 2026-10-17..18; every returned performance must fall in it.
	for _, e := range items(t, get(t, h, "/api/v1/events?when=weekend", http.StatusOK)) {
		for _, p := range e["performances"].([]any) {
			day := p.(map[string]any)["starts_at"].(string)[:10]
			if day != "2026-10-17" && day != "2026-10-18" {
				t.Fatalf("weekend filter returned performance on %s", day)
			}
		}
	}

	if total(get(t, h, "/api/v1/events?age=5", http.StatusOK)) == 0 {
		t.Fatal("no events for a 5-year-old")
	}

	for _, e := range items(t, get(t, h, "/api/v1/events?free=true", http.StatusOK)) {
		for _, p := range e["performances"].([]any) {
			if s := p.(map[string]any)["ticket_status"]; s != "free" {
				t.Fatalf("free filter returned status %v", s)
			}
		}
	}

	page := get(t, h, "/api/v1/events?limit=5&offset=5", http.StatusOK)
	if got := len(items(t, page)); got != 5 {
		t.Fatalf("page size = %d, want 5", got)
	}
}

func TestSearchIgnoresDiacritics(t *testing.T) {
	h := newTestServer(t)
	with := get(t, h, "/api/v1/search?q=Karłowicz", http.StatusOK)["data"].(map[string]any)
	without := get(t, h, "/api/v1/search?q=karlowicz", http.StatusOK)["data"].(map[string]any)
	for _, group := range []string{"events", "artists", "works"} {
		a, b := len(with[group].([]any)), len(without[group].([]any))
		if a != b {
			t.Fatalf("%s: %d results with diacritics, %d without", group, a, b)
		}
	}
	if len(without["events"].([]any))+len(without["artists"].([]any)) == 0 {
		t.Fatal("search for karlowicz found nothing")
	}
	get(t, h, "/api/v1/search?q=a", http.StatusBadRequest)
}

func TestEventDetail(t *testing.T) {
	h := newTestServer(t)
	first := items(t, get(t, h, "/api/v1/events?limit=1", http.StatusOK))[0]
	id := idString(first["id"])

	pl := get(t, h, "/api/v1/events/"+id, http.StatusOK)["data"].(map[string]any)
	for _, key := range []string{"title", "performances", "artists", "works", "series", "audiences", "accessibility", "available_languages"} {
		if _, ok := pl[key]; !ok {
			t.Fatalf("event detail has no %q", key)
		}
	}
	if pl["language"] != "pl" {
		t.Fatalf("language = %v, want pl", pl["language"])
	}

	en := get(t, h, "/api/v1/events/"+id+"?lang=en", http.StatusOK)["data"].(map[string]any)
	langs := en["available_languages"].([]any)
	wantLang := "pl"
	for _, l := range langs {
		if l == "en" {
			wantLang = "en"
		}
	}
	if en["language"] != wantLang {
		t.Fatalf("language = %v, want %s", en["language"], wantLang)
	}

	get(t, h, "/api/v1/events/999999", http.StatusNotFound)
	get(t, h, "/api/v1/events/abc", http.StatusNotFound)
}

func TestPerformances(t *testing.T) {
	h := newTestServer(t)
	body := get(t, h, "/api/v1/performances?limit=200", http.StatusOK)
	if total(body) != 222 {
		t.Fatalf("total = %d, want 222 performances", total(body))
	}
	for _, p := range items(t, body) {
		if p["event"].(map[string]any)["title"] == "" {
			t.Fatalf("performance %v has no event title", p["id"])
		}
	}
}

func TestCatalogEndpoints(t *testing.T) {
	h := newTestServer(t)

	filters := get(t, h, "/api/v1/filters", http.StatusOK)["data"].(map[string]any)
	if len(filters["kinds"].([]any)) == 0 || len(filters["venues"].([]any)) == 0 {
		t.Fatalf("filters missing kinds or venues: %v", filters)
	}

	artists := get(t, h, "/api/v1/artists?limit=1", http.StatusOK)
	a := items(t, artists)[0]
	artist := get(t, h, "/api/v1/artists/"+idString(a["id"]), http.StatusOK)["data"].(map[string]any)
	if artist["name"] != a["name"] {
		t.Fatalf("artist name = %v, want %v", artist["name"], a["name"])
	}

	series := items(t, get(t, h, "/api/v1/series", http.StatusOK))
	if len(series) != 15 {
		t.Fatalf("series = %d, want 15", len(series))
	}
	s := get(t, h, "/api/v1/series/"+series[0]["slug"].(string), http.StatusOK)["data"].(map[string]any)
	if _, ok := s["events"]; !ok {
		t.Fatal("series detail has no events")
	}

	venues := items(t, get(t, h, "/api/v1/venues", http.StatusOK))
	v := get(t, h, "/api/v1/venues/"+venues[0]["slug"].(string), http.StatusOK)["data"].(map[string]any)
	if v["accessibility_notes"] == nil {
		t.Fatal("venue detail has no accessibility notes")
	}
	get(t, h, "/api/v1/venues/nope", http.StatusNotFound)
}

func TestBadRequests(t *testing.T) {
	h := newTestServer(t)
	for _, url := range []string{
		"/api/v1/events?when=yesterday",
		"/api/v1/events?from=17.10.2026",
		"/api/v1/events?age=-1",
		"/api/v1/events?price_max=cheap",
		"/api/v1/events?limit=x",
	} {
		body := get(t, h, url, http.StatusBadRequest)
		if body["error"].(map[string]any)["code"] != "bad_request" {
			t.Fatalf("%s: unexpected error body %v", url, body)
		}
	}
}

func idString(v any) string {
	return strconv.FormatInt(int64(v.(float64)), 10)
}

func TestOpenAPI(t *testing.T) {
	h := newTestServer(t)

	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/v1/openapi.yaml", nil))
	if rec.Code != http.StatusOK || !strings.HasPrefix(rec.Body.String(), "openapi: 3") {
		t.Fatalf("openapi.yaml: status %d, body starts %q", rec.Code, rec.Body.String()[:min(20, rec.Body.Len())])
	}
	spec := rec.Body.String()

	// Every endpoint listed in the index must be documented in the spec.
	for _, e := range get(t, h, "/api/v1", http.StatusOK)["endpoints"].([]any) {
		_, path, _ := strings.Cut(e.(string), " ")
		if !strings.Contains(spec, "\n  "+path+":\n") {
			t.Errorf("endpoint %s is missing from openapi.yaml", path)
		}
	}

	rec = httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/docs", nil))
	if rec.Code != http.StatusOK || !strings.Contains(rec.Body.String(), "/api/v1/openapi.yaml") {
		t.Fatalf("docs page: status %d", rec.Code)
	}
}

func TestAssistantDisabled(t *testing.T) {
	h := newTestServer(t) // no OpenRouter key in tests

	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodPost, "/api/v1/assistant", strings.NewReader(`{"text":"Co gracie?"}`)))
	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want 503; body: %s", rec.Code, rec.Body.String())
	}
}
