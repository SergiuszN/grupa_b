package assistant

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"github.com/SergiuszN/grupa_b/backend/internal/catalog"
	"github.com/SergiuszN/grupa_b/backend/internal/openrouter"
)

var (
	kindValues     = []string{"symphonic", "chamber", "jazz", "concert", "education", "exhibition", "tour", "festival", "external", "other"}
	audienceValues = []string{"children", "families", "preschool", "schools", "youth", "teachers", "young-musicians", "adults", "seniors", "beginners"}
	accessValues   = []string{"mobility", "visual", "hearing", "sensory"}
)

func (a *Assistant) tools() []openrouter.Tool {
	fn := func(name, desc string, params map[string]any) openrouter.Tool {
		return openrouter.Tool{Type: "function", Function: openrouter.ToolFunction{Name: name, Description: desc, Parameters: params}}
	}
	obj := func(props map[string]any, required ...string) map[string]any {
		if required == nil {
			required = []string{}
		}
		return map[string]any{"type": "object", "properties": props, "required": required, "additionalProperties": false}
	}
	// Optional filters are nullable: models tend to fill every field, and null reads as "any".
	opt := func(typ, desc string) map[string]any {
		return map[string]any{"type": []string{typ, "null"}, "description": desc + " Null = any."}
	}
	enumList := func(desc string, values []string) map[string]any {
		return map[string]any{"type": []string{"array", "null"}, "description": desc + " Null or empty = any.",
			"items": map[string]any{"type": "string", "enum": values}}
	}
	venues := opt("string", "Venue slug, only when the user asks for a specific hall.")
	if len(a.venues) > 0 {
		venues["enum"] = append(anySlice(a.venues), nil)
	}

	return []openrouter.Tool{
		fn("search_events",
			"Search the Philharmonic calendar for upcoming events. Combines semantic + full-text search over titles, "+
				"descriptions, performers, composers, works and series with structured filters. Returns events with their "+
				"matching dates, venues, ticket status and prices. Use it for every question about what is on.",
			obj(map[string]any{
				"query": opt("string", "Free-text topic: composer, performer, work, genre, mood, theme or title, "+
					"e.g. 'Chopin', 'romantic piano', 'jazz vocalist', 'Vivaldi four seasons'. Null to just list by filters."),
				"date_from":     opt("string", "First day YYYY-MM-DD (default: today)."),
				"date_to":       opt("string", "Last day YYYY-MM-DD, inclusive."),
				"kinds":         enumList("Event kinds.", kindValues),
				"audiences":     enumList("Target groups. Strict: events without this tag are excluded, so prefer age for children.", audienceValues),
				"age":           opt("integer", "Child's age in years; matches events with an age range covering it."),
				"price_max":     opt("number", "Cheapest ticket at most this many PLN (or free)."),
				"free":          opt("boolean", "true = only free events."),
				"venue":         venues,
				"accessibility": enumList("Required accessibility (available or partial).", accessValues),
				"limit":         opt("integer", "Max events to return, 1-10 (default 6)."),
			})),
		fn("get_event_details",
			"Full card of one event: description, why attend, performers with roles, programme, series, target audience, "+
				"accessibility, duration and all dates with prices. Use it before recommending or answering detailed questions.",
			obj(map[string]any{"event_id": map[string]any{"type": "integer"}}, "event_id")),
		fn("get_visitor_info",
			"Practical information about visiting the Philharmonic, from its official website: tickets and box office, "+
				"discounts (students, seniors, families, disabled), online purchase, reservations, refunds, getting there, "+
				"parking, opening hours, cloakroom, dress code, cafes, concert etiquette, accessibility, halls, the building "+
				"and its awards, guided tours, galleries, education for families and schools, rentals, contact. "+
				"Returns matching entries with their source page; the source links are shown to the user.",
			obj(map[string]any{
				"query": map[string]any{"type": "string", "description": "What the user wants to know, e.g. 'parking', " +
					"'student discount', 'wheelchair access', 'can I return a ticket bought online'."},
			}, "query")),
		fn("show_events",
			"Show event cards (with date, place, price and a ticket button) on the user's screen. Call it with the 1-3 best "+
				"options whenever you recommend or point to specific events, before your final spoken answer.",
			obj(map[string]any{
				"items": map[string]any{
					"type":     "array",
					"maxItems": 3,
					"items": obj(map[string]any{
						"event_id":       map[string]any{"type": "integer"},
						"performance_id": opt("integer", "Specific date to show; null for the nearest one."),
					}, "event_id"),
				},
			}, "items")),
	}
}

// runTool executes one tool call and returns the JSON result for the model.
func (a *Assistant) runTool(ctx context.Context, call openrouter.ToolCall, lang string, emit Emit) string {
	var (
		result any
		err    error
	)
	started := time.Now()
	defer func() {
		slog.Info("assistant tool", "tool", call.Function.Name, "args", call.Function.Arguments, "ms", time.Since(started).Milliseconds())
	}()
	args := json.RawMessage(call.Function.Arguments)
	if len(args) == 0 {
		args = json.RawMessage("{}")
	}
	switch call.Function.Name {
	case "search_events":
		result, err = a.searchEvents(ctx, args, lang)
	case "get_event_details":
		result, err = a.eventDetails(ctx, args, lang)
	case "get_visitor_info":
		result, err = a.visitorInfo(ctx, args, emit)
	case "show_events":
		result, err = a.showEvents(ctx, args, lang, emit)
	default:
		err = fmt.Errorf("unknown tool %q", call.Function.Name)
	}
	if err != nil {
		slog.Warn("assistant tool failed", "tool", call.Function.Name, "args", call.Function.Arguments, "err", err)
		result = map[string]string{"error": err.Error()}
	}
	out, _ := json.Marshal(result)
	return string(out)
}

type searchArgs struct {
	Query         string   `json:"query"`
	DateFrom      string   `json:"date_from"`
	DateTo        string   `json:"date_to"`
	Kinds         []string `json:"kinds"`
	Audiences     []string `json:"audiences"`
	Age           *int     `json:"age"`
	PriceMax      *float64 `json:"price_max"`
	Free          *bool    `json:"free"`
	Venue         string   `json:"venue"`
	Accessibility []string `json:"accessibility"`
	Limit         *int     `json:"limit"`
}

type eventResult struct {
	ID              int64               `json:"event_id"`
	Title           string              `json:"title"`
	Subtitle        string              `json:"subtitle,omitempty"`
	Kind            string              `json:"kind"`
	Summary         string              `json:"summary,omitempty"`
	DurationMinutes *int                `json:"duration_minutes,omitempty"`
	Ages            string              `json:"ages,omitempty"`
	Dates           []performanceResult `json:"dates"`
	MoreDates       int                 `json:"more_dates,omitempty"`
}

type performanceResult struct {
	ID      int64  `json:"performance_id"`
	When    string `json:"when"`
	Venue   string `json:"venue,omitempty"`
	Tickets string `json:"tickets"`
	Price   string `json:"price,omitempty"`
}

func (a *Assistant) searchEvents(ctx context.Context, raw json.RawMessage, lang string) (any, error) {
	var p searchArgs
	if err := json.Unmarshal(raw, &p); err != nil {
		return nil, fmt.Errorf("invalid arguments: %w", err)
	}
	for _, d := range []string{p.DateFrom, p.DateTo} {
		if d != "" {
			if _, err := time.Parse(time.DateOnly, d); err != nil {
				return nil, errors.New("dates must be YYYY-MM-DD")
			}
		}
	}
	limit := 6
	if p.Limit != nil && *p.Limit > 0 {
		limit = min(*p.Limit, 10)
	}
	if p.PriceMax != nil && *p.PriceMax <= 0 {
		p.PriceMax = nil // "0" is how models say "no limit"; free has its own flag
	}
	if p.Age != nil && *p.Age <= 0 {
		p.Age = nil
	}

	f := catalog.Filter{
		Lang:          lang,
		From:          p.DateFrom,
		To:            p.DateTo,
		Kinds:         p.Kinds,
		Audiences:     p.Audiences,
		Age:           p.Age,
		PriceMax:      p.PriceMax,
		Free:          p.Free != nil && *p.Free,
		Accessibility: p.Accessibility,
		Limit:         limit,
	}
	if f.From == "" || f.From < a.today() {
		f.From = a.today()
	}
	if p.Venue != "" {
		f.Venues = []string{p.Venue}
	}

	var rank map[int64]int
	query := strings.TrimSpace(p.Query)
	if query != "" {
		ids, err := a.rankedIDs(ctx, query)
		if err != nil {
			slog.Warn("hybrid search unavailable, falling back to text filter", "err", err)
		}
		if len(ids) > 0 {
			rank = map[int64]int{}
			for i, id := range ids {
				rank[id] = i
			}
			f.IDs = ids
			f.Limit = len(ids) // order by relevance below, then cut
		} else {
			f.Query = query
		}
	}

	events, total, err := a.store.ListEvents(ctx, f)
	if err != nil {
		return nil, err
	}
	if rank != nil {
		sortByRank(events, rank)
		total = len(events)
		events = events[:min(len(events), limit)]
	}

	out := make([]eventResult, len(events))
	for i, e := range events {
		out[i] = a.eventResult(e, 4)
	}
	res := map[string]any{"total_matching": total, "events": out}
	if total == 0 {
		res["hint"] = "Nothing matches. Try fewer filters, a wider date range or a broader query."
	}
	return res, nil
}

// rankedIDs returns event ids ordered by hybrid relevance (FTS + embeddings).
func (a *Assistant) rankedIDs(ctx context.Context, query string) ([]int64, error) {
	if a.index == nil {
		return nil, errors.New("search index not loaded")
	}
	var vec []float32
	vecs, err := a.client.Embed(ctx, a.index.Model(), []string{query})
	if err != nil {
		slog.Warn("query embedding failed, using full-text only", "err", err)
	} else {
		vec = vecs[0]
	}
	hits, err := a.index.Search(ctx, query, vec, 30)
	if err != nil {
		return nil, err
	}
	ids := make([]int64, len(hits))
	for i, h := range hits {
		ids[i] = h.EventID
	}
	return ids, nil
}

func sortByRank(events []catalog.EventSummary, rank map[int64]int) {
	for i := 1; i < len(events); i++ {
		for j := i; j > 0 && rank[events[j].ID] < rank[events[j-1].ID]; j-- {
			events[j], events[j-1] = events[j-1], events[j]
		}
	}
}

func (a *Assistant) eventResult(e catalog.EventSummary, maxDates int) eventResult {
	r := eventResult{
		ID:              e.ID,
		Title:           e.Title,
		Subtitle:        deref(e.Subtitle),
		Kind:            e.Kind,
		Summary:         shorten(deref(e.Summary), 280),
		DurationMinutes: e.DurationMinutes,
		Ages:            ages(e.MinAge, e.MaxAge),
	}
	for i, p := range e.Performances {
		if i == maxDates {
			r.MoreDates = len(e.Performances) - maxDates
			break
		}
		r.Dates = append(r.Dates, a.performanceResult(p))
	}
	return r
}

func (a *Assistant) performanceResult(p catalog.Performance) performanceResult {
	r := performanceResult{ID: p.ID, When: a.formatWhen(p.StartsAt), Tickets: p.TicketStatus, Price: price(p)}
	if p.Venue != nil {
		r.Venue = p.Venue.Name
	}
	return r
}

func (a *Assistant) eventDetails(ctx context.Context, raw json.RawMessage, lang string) (any, error) {
	var p struct {
		EventID int64 `json:"event_id"`
	}
	if err := json.Unmarshal(raw, &p); err != nil {
		return nil, fmt.Errorf("invalid arguments: %w", err)
	}
	d, err := a.store.GetEvent(ctx, lang, p.EventID)
	if errors.Is(err, catalog.ErrNotFound) {
		return nil, fmt.Errorf("event %d not found", p.EventID)
	}
	if err != nil {
		return nil, err
	}

	today := a.today()
	var dates []performanceResult
	for _, perf := range d.Performances {
		if perf.StartsAt[:10] >= today || (perf.EndsAt != nil && (*perf.EndsAt)[:min(10, len(*perf.EndsAt))] >= today) {
			dates = append(dates, a.performanceResult(perf))
		}
	}
	var artists, works, series, audiences, access []string
	for _, ar := range d.Artists {
		artists = append(artists, ar.Name+" ("+ar.Role+")")
	}
	for _, w := range d.Works {
		if w.Composer != nil {
			works = append(works, w.Composer.Name+": "+w.Title)
		} else {
			works = append(works, w.Title)
		}
	}
	for _, s := range d.Series {
		series = append(series, s.Name)
	}
	for _, au := range d.Audiences {
		audiences = append(audiences, strings.TrimSpace(au.Slug+" "+ages(au.MinAge, au.MaxAge)))
	}
	for _, ac := range d.Accessibility {
		access = append(access, ac.Type+": "+ac.Status)
	}
	return map[string]any{
		"event_id":         d.ID,
		"title":            d.Title,
		"subtitle":         deref(d.Subtitle),
		"kind":             d.Kind,
		"description":      shorten(deref(d.Description), 1600),
		"why_attend":       shorten(deref(d.WhyAttend), 600),
		"audience_note":    shorten(deref(d.AudienceNote), 400),
		"programme_notes":  shorten(deref(d.ProgrammeNotes), 600),
		"performers":       artists,
		"programme":        works,
		"series":           series,
		"audiences":        audiences,
		"ages":             ages(d.MinAge, d.MaxAge),
		"accessibility":    access,
		"duration_minutes": d.DurationMinutes,
		"has_intermission": d.HasIntermission,
		"upcoming_dates":   dates,
	}, nil
}

// Source is a page of the Philharmonic website an answer is based on.
type Source struct {
	Title string `json:"title"`
	URL   string `json:"url"`
}

func (a *Assistant) visitorInfo(ctx context.Context, raw json.RawMessage, emit Emit) (any, error) {
	var p struct {
		Query string `json:"query"`
	}
	if err := json.Unmarshal(raw, &p); err != nil {
		return nil, fmt.Errorf("invalid arguments: %w", err)
	}
	noInfo := map[string]any{"entries": []any{}, "hint": "No information found. Say you don't know and refer the user " +
		"to the box office: +48 91 431 07 20, kasa@filharmonia.szczecin.pl (Tue-Fri 12-18, Sat 12-16)."}
	if a.index == nil || a.index.InfoSize() == 0 || strings.TrimSpace(p.Query) == "" {
		return noInfo, nil
	}
	var vec []float32
	if vecs, err := a.client.Embed(ctx, a.index.Model(), []string{p.Query}); err != nil {
		slog.Warn("query embedding failed, using full-text only", "err", err)
	} else {
		vec = vecs[0]
	}
	entries, err := a.index.SearchInfo(ctx, p.Query, vec, 4)
	if err != nil {
		return nil, err
	}
	if len(entries) == 0 {
		return noInfo, nil
	}
	// The best entry is the likely source; lower ones are often just related.
	emit("sources", map[string]any{"sources": []Source{{Title: entries[0].Title, URL: entries[0].URL}}})
	return map[string]any{"entries": entries}, nil
}

// Card is an event shown on the user's screen.
type Card struct {
	EventID       int64    `json:"event_id"`
	PerformanceID int64    `json:"performance_id"`
	Title         string   `json:"title"`
	Subtitle      *string  `json:"subtitle"`
	Kind          string   `json:"kind"`
	ImageURL      *string  `json:"image_url"`
	StartsAt      string   `json:"starts_at"`
	Venue         string   `json:"venue"`
	TicketStatus  string   `json:"ticket_status"`
	PriceMin      *float64 `json:"price_min"`
	PriceMax      *float64 `json:"price_max"`
	Currency      string   `json:"currency"`
	TicketURL     *string  `json:"ticket_url"`
	SourceURL     string   `json:"source_url"`
}

func (a *Assistant) showEvents(ctx context.Context, raw json.RawMessage, lang string, emit Emit) (any, error) {
	var p struct {
		Items []struct {
			EventID       int64  `json:"event_id"`
			PerformanceID *int64 `json:"performance_id"`
		} `json:"items"`
	}
	if err := json.Unmarshal(raw, &p); err != nil {
		return nil, fmt.Errorf("invalid arguments: %w", err)
	}
	today := a.today()
	cards := []Card{}
	for _, it := range p.Items[:min(len(p.Items), 3)] {
		d, err := a.store.GetEvent(ctx, lang, it.EventID)
		if err != nil {
			return nil, fmt.Errorf("event %d: %w", it.EventID, err)
		}
		var perf *catalog.Performance
		for i := range d.Performances {
			cand := &d.Performances[i]
			if it.PerformanceID != nil && cand.ID == *it.PerformanceID {
				perf = cand
				break
			}
			if perf == nil && cand.StartsAt[:10] >= today {
				perf = cand
			}
		}
		if perf == nil {
			return nil, fmt.Errorf("event %d has no upcoming dates", it.EventID)
		}
		c := Card{
			EventID: d.ID, PerformanceID: perf.ID, Title: d.Title, Subtitle: d.Subtitle, Kind: d.Kind,
			ImageURL: d.ImageURL, StartsAt: perf.StartsAt, TicketStatus: perf.TicketStatus,
			PriceMin: perf.PriceMin, PriceMax: perf.PriceMax, Currency: perf.Currency,
			TicketURL: perf.TicketURL, SourceURL: d.SourceURL,
		}
		if perf.Venue != nil {
			c.Venue = perf.Venue.Name
		}
		cards = append(cards, c)
	}
	emit("events", map[string]any{"events": cards})
	return map[string]any{"shown": len(cards)}, nil
}

func (a *Assistant) today() string { return a.now().In(warsaw).Format(time.DateOnly) }

// formatWhen renders a performance start as "2026-10-24 (Saturday) 19:00" for the model.
func (a *Assistant) formatWhen(startsAt string) string {
	t, err := time.Parse(time.RFC3339, startsAt)
	if err != nil {
		return startsAt
	}
	t = t.In(warsaw)
	return t.Format("2006-01-02") + " (" + t.Weekday().String() + ") " + t.Format("15:04")
}

func price(p catalog.Performance) string {
	switch {
	case p.TicketStatus == "free":
		return "free"
	case p.PriceMin == nil:
		return ""
	case p.PriceMax == nil || *p.PriceMax == *p.PriceMin:
		return fmt.Sprintf("%g %s", *p.PriceMin, p.Currency)
	default:
		return fmt.Sprintf("%g-%g %s", *p.PriceMin, *p.PriceMax, p.Currency)
	}
}

func ages(lo, hi *int) string {
	switch {
	case lo != nil && hi != nil:
		return fmt.Sprintf("%d-%d y.o.", *lo, *hi)
	case lo != nil:
		return fmt.Sprintf("%d+ y.o.", *lo)
	case hi != nil:
		return fmt.Sprintf("up to %d y.o.", *hi)
	}
	return ""
}

func shorten(s string, n int) string {
	s = strings.TrimSpace(s)
	r := []rune(s)
	if len(r) <= n {
		return s
	}
	return strings.TrimSpace(string(r[:n])) + "…"
}

func deref(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func anySlice[T any](vs []T) []any {
	out := make([]any, len(vs))
	for i, v := range vs {
		out[i] = v
	}
	return out
}
