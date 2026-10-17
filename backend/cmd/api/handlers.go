package main

import (
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/SergiuszN/grupa_b/backend/internal/assistant"
	"github.com/SergiuszN/grupa_b/backend/internal/catalog"
)

// All dates in the API are local calendar days of the venue.
var warsaw = mustLoadLocation("Europe/Warsaw")

type api struct {
	store     *catalog.Store
	assistant *assistant.Assistant // nil without OPENROUTER_API_KEY
	now       func() time.Time
}

// badRequest is a validation error reported to the client as 400.
type badRequest struct{ msg string }

func (e badRequest) Error() string { return e.msg }

func (a *api) routes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/v1", a.handleIndex)
	mux.HandleFunc("GET /api/v1/events", a.handleEvents)
	mux.HandleFunc("GET /api/v1/events/{id}", a.handleEvent)
	mux.HandleFunc("GET /api/v1/performances", a.handlePerformances)
	mux.HandleFunc("GET /api/v1/artists", a.handleArtists)
	mux.HandleFunc("GET /api/v1/artists/{id}", a.handleArtist)
	mux.HandleFunc("GET /api/v1/series", a.handleSeriesList)
	mux.HandleFunc("GET /api/v1/series/{slug}", a.handleSeries)
	mux.HandleFunc("GET /api/v1/venues", a.handleVenues)
	mux.HandleFunc("GET /api/v1/venues/{slug}", a.handleVenue)
	mux.HandleFunc("GET /api/v1/filters", a.handleFilters)
	mux.HandleFunc("GET /api/v1/search", a.handleSearch)
	mux.HandleFunc("POST /api/v1/assistant", a.handleAssistant)
	mux.HandleFunc("GET /api/v1/openapi.yaml", handleOpenAPI)
	mux.HandleFunc("GET /api/docs", handleDocs)
}

func (a *api) handleIndex(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"name":      "Filharmonia Szczecin public API",
		"version":   "v1",
		"languages": catalog.Languages,
		"docs":      "/api/docs",
		"openapi":   "/api/v1/openapi.yaml",
		"endpoints": []string{
			"GET /api/v1/events",
			"GET /api/v1/events/{id}",
			"GET /api/v1/performances",
			"GET /api/v1/artists",
			"GET /api/v1/artists/{id}",
			"GET /api/v1/series",
			"GET /api/v1/series/{slug}",
			"GET /api/v1/venues",
			"GET /api/v1/venues/{slug}",
			"GET /api/v1/filters",
			"GET /api/v1/search",
			"POST /api/v1/assistant",
		},
	})
}

func (a *api) handleEvents(w http.ResponseWriter, r *http.Request) {
	f, err := a.parseFilter(r, 20, 100)
	if err != nil {
		a.fail(w, r, err)
		return
	}
	events, total, err := a.store.ListEvents(r.Context(), f)
	if err != nil {
		a.fail(w, r, err)
		return
	}
	writeList(w, events, total, f)
}

func (a *api) handlePerformances(w http.ResponseWriter, r *http.Request) {
	f, err := a.parseFilter(r, 50, 200)
	if err != nil {
		a.fail(w, r, err)
		return
	}
	entries, total, err := a.store.ListPerformances(r.Context(), f)
	if err != nil {
		a.fail(w, r, err)
		return
	}
	writeList(w, entries, total, f)
}

func (a *api) handleEvent(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r)
	if err != nil {
		a.fail(w, r, err)
		return
	}
	ev, err := a.store.GetEvent(r.Context(), lang(r), id)
	if err != nil {
		a.fail(w, r, err)
		return
	}
	writeData(w, ev)
}

func (a *api) handleArtists(w http.ResponseWriter, r *http.Request) {
	limit, offset, err := paging(r.URL.Query(), 50, 200)
	if err != nil {
		a.fail(w, r, err)
		return
	}
	artists, total, err := a.store.ListArtists(r.Context(), r.URL.Query().Get("q"), limit, offset)
	if err != nil {
		a.fail(w, r, err)
		return
	}
	writeList(w, artists, total, catalog.Filter{Limit: limit, Offset: offset})
}

func (a *api) handleArtist(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r)
	if err != nil {
		a.fail(w, r, err)
		return
	}
	artist, err := a.store.GetArtist(r.Context(), lang(r), a.today(), id)
	if err != nil {
		a.fail(w, r, err)
		return
	}
	writeData(w, artist)
}

func (a *api) handleSeriesList(w http.ResponseWriter, r *http.Request) {
	series, err := a.store.ListSeries(r.Context(), lang(r))
	if err != nil {
		a.fail(w, r, err)
		return
	}
	writeData(w, series)
}

func (a *api) handleSeries(w http.ResponseWriter, r *http.Request) {
	series, err := a.store.GetSeries(r.Context(), lang(r), a.today(), r.PathValue("slug"))
	if err != nil {
		a.fail(w, r, err)
		return
	}
	writeData(w, series)
}

func (a *api) handleVenues(w http.ResponseWriter, r *http.Request) {
	venues, err := a.store.ListVenues(r.Context())
	if err != nil {
		a.fail(w, r, err)
		return
	}
	writeData(w, venues)
}

func (a *api) handleVenue(w http.ResponseWriter, r *http.Request) {
	venue, err := a.store.GetVenue(r.Context(), lang(r), a.today(), r.PathValue("slug"))
	if err != nil {
		a.fail(w, r, err)
		return
	}
	writeData(w, venue)
}

func (a *api) handleFilters(w http.ResponseWriter, r *http.Request) {
	filters, err := a.store.GetFilters(r.Context(), lang(r), a.today())
	if err != nil {
		a.fail(w, r, err)
		return
	}
	writeData(w, filters)
}

func (a *api) handleSearch(w http.ResponseWriter, r *http.Request) {
	q := strings.TrimSpace(r.URL.Query().Get("q"))
	if len([]rune(q)) < 2 {
		a.fail(w, r, badRequest{"q must have at least 2 characters"})
		return
	}
	limit, _, err := paging(r.URL.Query(), 10, 50)
	if err != nil {
		a.fail(w, r, err)
		return
	}
	res, err := a.store.Search(r.Context(), lang(r), a.today(), q, limit)
	if err != nil {
		a.fail(w, r, err)
		return
	}
	writeData(w, res)
}

// parseFilter reads calendar filters from the query string. List values are
// comma-separated or repeated (?kind=jazz,chamber or ?kind=jazz&kind=chamber).
func (a *api) parseFilter(r *http.Request, defLimit, maxLimit int) (catalog.Filter, error) {
	q := r.URL.Query()
	f := catalog.Filter{
		Lang:          lang(r),
		Kinds:         list(q["kind"]),
		Categories:    list(q["category"]),
		Audiences:     list(q["audience"]),
		Moods:         list(q["mood"]),
		Venues:        list(q["venue"]),
		Series:        list(q["series"]),
		TicketStatus:  list(q["ticket_status"]),
		Accessibility: list(q["accessibility"]),
		Query:         q.Get("q"),
	}
	var err error
	if f.Limit, f.Offset, err = paging(q, defLimit, maxLimit); err != nil {
		return f, err
	}
	if f.From, f.To, err = a.dateRange(q.Get("when"), q.Get("from"), q.Get("to")); err != nil {
		return f, err
	}
	if f.Age, err = optInt(q, "age"); err != nil {
		return f, err
	}
	if f.DurationMin, err = optInt(q, "duration_min"); err != nil {
		return f, err
	}
	if f.DurationMax, err = optInt(q, "duration_max"); err != nil {
		return f, err
	}
	if v := q.Get("artist"); v != "" {
		id, err := strconv.ParseInt(v, 10, 64)
		if err != nil {
			return f, badRequest{"artist must be an artist id"}
		}
		f.ArtistID = &id
	}
	if v := q.Get("price_max"); v != "" {
		p, err := strconv.ParseFloat(v, 64)
		if err != nil || p < 0 {
			return f, badRequest{"price_max must be a non-negative number"}
		}
		f.PriceMax = &p
	}
	if v := q.Get("free"); v != "" {
		if f.Free, err = strconv.ParseBool(v); err != nil {
			return f, badRequest{"free must be true or false"}
		}
	}
	return f, nil
}

// dateRange resolves a "when" shortcut or explicit from/to days. Without any of
// them the range starts today, so lists show only what is still ahead.
func (a *api) dateRange(when, from, to string) (string, string, error) {
	for name, v := range map[string]string{"from": from, "to": to} {
		if v != "" {
			if _, err := time.Parse(time.DateOnly, v); err != nil {
				return "", "", badRequest{name + " must be a date in YYYY-MM-DD format"}
			}
		}
	}
	now := a.now().In(warsaw)
	today := now.Format(time.DateOnly)
	day := func(d int) string { return now.AddDate(0, 0, d).Format(time.DateOnly) }

	switch when {
	case "":
		if from == "" {
			from = today
		}
		return from, to, nil
	case "today":
		return today, today, nil
	case "tomorrow":
		return day(1), day(1), nil
	case "weekend":
		// Saturday and Sunday of this week; on Sunday only the rest of it.
		wd := int(now.Weekday())
		if wd == 0 {
			return today, today, nil
		}
		return day(6 - wd), day(7 - wd), nil
	case "week":
		// Today until Sunday.
		return today, day((7 - int(now.Weekday())) % 7), nil
	case "month":
		end := time.Date(now.Year(), now.Month()+1, 0, 0, 0, 0, 0, warsaw)
		return today, end.Format(time.DateOnly), nil
	case "all":
		return from, to, nil
	}
	return "", "", badRequest{"when must be one of: today, tomorrow, weekend, week, month, all"}
}

func (a *api) today() string { return a.now().In(warsaw).Format(time.DateOnly) }

func (a *api) fail(w http.ResponseWriter, r *http.Request, err error) {
	var br badRequest
	switch {
	case errors.As(err, &br):
		writeError(w, http.StatusBadRequest, "bad_request", br.msg)
	case errors.Is(err, catalog.ErrNotFound):
		writeError(w, http.StatusNotFound, "not_found", "resource not found")
	default:
		slog.Error("request failed", "path", r.URL.Path, "err", err)
		writeError(w, http.StatusInternalServerError, "internal", "internal server error")
	}
}

// lang picks the content language from ?lang= or Accept-Language (pl by default).
func lang(r *http.Request) string {
	if l := r.URL.Query().Get("lang"); l != "" {
		return catalog.NormalizeLang(l)
	}
	for _, part := range strings.Split(r.Header.Get("Accept-Language"), ",") {
		tag, _, _ := strings.Cut(strings.TrimSpace(part), ";")
		base, _, _ := strings.Cut(tag, "-")
		for _, l := range catalog.Languages {
			if strings.EqualFold(base, l) {
				return l
			}
		}
	}
	return catalog.NormalizeLang("")
}

func list(values []string) []string {
	var out []string
	for _, v := range values {
		for _, p := range strings.Split(v, ",") {
			if p = strings.TrimSpace(p); p != "" {
				out = append(out, p)
			}
		}
	}
	return out
}

func optInt(q map[string][]string, key string) (*int, error) {
	vs := q[key]
	if len(vs) == 0 || vs[0] == "" {
		return nil, nil
	}
	n, err := strconv.Atoi(vs[0])
	if err != nil || n < 0 {
		return nil, badRequest{key + " must be a non-negative integer"}
	}
	return &n, nil
}

func paging(q map[string][]string, defLimit, maxLimit int) (int, int, error) {
	limit, offset := defLimit, 0
	if v, err := optInt(q, "limit"); err != nil {
		return 0, 0, err
	} else if v != nil {
		limit = min(max(*v, 1), maxLimit)
	}
	if v, err := optInt(q, "offset"); err != nil {
		return 0, 0, err
	} else if v != nil {
		offset = *v
	}
	return limit, offset, nil
}

func pathID(r *http.Request) (int64, error) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		return 0, catalog.ErrNotFound
	}
	return id, nil
}

type listMeta struct {
	Total  int `json:"total"`
	Limit  int `json:"limit"`
	Offset int `json:"offset"`
}

func writeList(w http.ResponseWriter, data any, total int, f catalog.Filter) {
	w.Header().Set("Cache-Control", "public, max-age=60")
	writeJSON(w, http.StatusOK, map[string]any{
		"data": data,
		"meta": listMeta{Total: total, Limit: f.Limit, Offset: f.Offset},
	})
}

func writeData(w http.ResponseWriter, data any) {
	w.Header().Set("Cache-Control", "public, max-age=60")
	writeJSON(w, http.StatusOK, map[string]any{"data": data})
}

func writeError(w http.ResponseWriter, status int, code, msg string) {
	writeJSON(w, status, map[string]any{"error": map[string]string{"code": code, "message": msg}})
}

// withCORS allows any origin to read the public API.
func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h := w.Header()
		h.Set("Access-Control-Allow-Origin", "*")
		h.Set("Vary", "Accept-Language")
		if r.Method == http.MethodOptions {
			h.Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			h.Set("Access-Control-Allow-Headers", "Accept-Language, Content-Type")
			h.Set("Access-Control-Max-Age", "86400")
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func mustLoadLocation(name string) *time.Location {
	loc, err := time.LoadLocation(name)
	if err != nil {
		panic(fmt.Sprintf("load location %s: %v", name, err))
	}
	return loc
}
