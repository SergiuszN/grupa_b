package catalog

import (
	"context"
	"database/sql"
	"encoding/json"
	"strings"
)

// Filter narrows down events and performances. Zero values mean "no filter".
// Dates are local (Europe/Warsaw) calendar days in YYYY-MM-DD format.
type Filter struct {
	Lang          string
	From, To      string
	Kinds         []string
	Categories    []string
	Audiences     []string
	Age           *int
	Moods         []string
	Venues        []string
	Series        []string // slugs
	ArtistID      *int64   // performer or composer
	TicketStatus  []string
	Free          bool
	PriceMax      *float64
	DurationMin   *int
	DurationMax   *int
	Accessibility []string // every listed type must be available or partial
	Query         string
	IDs           []int64 // only these events
	Limit, Offset int
}

// VenueRef is a short reference to a venue.
type VenueRef struct {
	ID   int64  `json:"id"`
	Slug string `json:"slug"`
	Name string `json:"name"`
}

// Performance is a single date of an event.
type Performance struct {
	ID           int64           `json:"id"`
	StartsAt     string          `json:"starts_at"`
	EndsAt       *string         `json:"ends_at"`
	Venue        *VenueRef       `json:"venue"`
	TicketStatus string          `json:"ticket_status"`
	PriceMin     *float64        `json:"price_min"`
	PriceMax     *float64        `json:"price_max"`
	Currency     string          `json:"currency"`
	TicketURL    *string         `json:"ticket_url"`
	TicketNotes  *string         `json:"ticket_notes,omitempty"`
	PriceDetails json.RawMessage `json:"price_details,omitempty"`
}

// EventSummary is the card shown in lists and calendars.
type EventSummary struct {
	ID               int64         `json:"id"`
	Kind             string        `json:"kind"`
	CalendarCategory *string       `json:"calendar_category"`
	Season           *string       `json:"season"`
	Language         string        `json:"language"`
	Title            string        `json:"title"`
	Subtitle         *string       `json:"subtitle"`
	Summary          *string       `json:"summary"`
	ImageURL         *string       `json:"image_url"`
	DurationMinutes  *int          `json:"duration_minutes"`
	HasIntermission  *bool         `json:"has_intermission"`
	MinAge           *int          `json:"min_age"`
	MaxAge           *int          `json:"max_age"`
	Performances     []Performance `json:"performances"`
}

// EventDetail is the full event card.
type EventDetail struct {
	EventSummary
	Description        *string         `json:"description"`
	WhyAttend          *string         `json:"why_attend"`
	AudienceNote       *string         `json:"audience_note"`
	ProgrammeNotes     *string         `json:"programme_notes"`
	PartnersNote       *string         `json:"partners_note"`
	SEOTitle           *string         `json:"seo_title"`
	SEODescription     *string         `json:"seo_description"`
	PlaylistURL        *string         `json:"playlist_url"`
	SourceURL          string          `json:"source_url"`
	ScrapedAt          *string         `json:"scraped_at"`
	AvailableLanguages []string        `json:"available_languages"`
	Artists            []EventArtist   `json:"artists"`
	Works              []Work          `json:"works"`
	Series             []SeriesRef     `json:"series"`
	Audiences          []Audience      `json:"audiences"`
	Moods              []string        `json:"moods"`
	Accessibility      []Accessibility `json:"accessibility"`
}

// EventArtist is an artist with their role in an event.
type EventArtist struct {
	ArtistRef
	Role string `json:"role"`
}

// ArtistRef is a short reference to an artist.
type ArtistRef struct {
	ID       int64   `json:"id"`
	Name     string  `json:"name"`
	Type     string  `json:"type"`
	ImageURL *string `json:"image_url"`
}

// Work is a piece in a programme.
type Work struct {
	ID              int64      `json:"id"`
	Title           string     `json:"title"`
	Composer        *ArtistRef `json:"composer"`
	DurationMinutes *int       `json:"duration_minutes"`
	AudioSampleURL  *string    `json:"audio_sample_url"`
	FullRecording   *string    `json:"full_recording_url"`
}

// SeriesRef is a short reference to a series.
type SeriesRef struct {
	ID   int64   `json:"id"`
	Slug *string `json:"slug"`
	Name string  `json:"name"`
}

// Audience is a target group, optionally with an age range.
type Audience struct {
	Slug   string `json:"slug"`
	MinAge *int   `json:"min_age"`
	MaxAge *int   `json:"max_age"`
}

// Accessibility describes one accessibility aspect of an event.
type Accessibility struct {
	Type       string  `json:"type"`
	Status     string  `json:"status"`
	Notes      *string `json:"notes"`
	SourceURL  *string `json:"source_url"`
	VerifiedAt *string `json:"verified_at"`
}

// CalendarEntry is a performance together with its event card.
type CalendarEntry struct {
	Performance
	Event EventSummary `json:"event"`
}

// where builds conditions over events e, performances p and venues v.
func (f Filter) where() (string, []any) {
	conds := []string{"e.published = 1"}
	var args []any
	add := func(cond string, a ...any) {
		conds = append(conds, cond)
		args = append(args, a...)
	}
	in := func(col string, vals []string) {
		if len(vals) > 0 {
			add(col+" IN ("+placeholders(len(vals))+")", anyArgs(vals)...)
		}
	}

	// A performance matches a day range when it overlaps it (exhibitions span many days).
	if f.From != "" {
		add("COALESCE(substr(p.ends_at, 1, 10), substr(p.starts_at, 1, 10)) >= ?", f.From)
	}
	if f.To != "" {
		add("substr(p.starts_at, 1, 10) <= ?", f.To)
	}
	if len(f.IDs) > 0 {
		add("e.id IN ("+placeholders(len(f.IDs))+")", anyArgs(f.IDs)...)
	}
	in("e.kind", f.Kinds)
	in("e.calendar_category", f.Categories)
	in("v.slug", f.Venues)
	in("p.ticket_status", f.TicketStatus)
	if len(f.Audiences) > 0 {
		add(`EXISTS (SELECT 1 FROM event_audiences ea JOIN audience_groups ag ON ag.id = ea.audience_id
			WHERE ea.event_id = e.id AND ag.slug IN (`+placeholders(len(f.Audiences))+`))`, anyArgs(f.Audiences)...)
	}
	if f.Age != nil {
		add(`((e.min_age IS NOT NULL OR e.max_age IS NOT NULL) AND COALESCE(e.min_age, 0) <= ? AND COALESCE(e.max_age, 999) >= ?
			OR EXISTS (SELECT 1 FROM event_audiences ea WHERE ea.event_id = e.id
				AND (ea.min_age IS NOT NULL OR ea.max_age IS NOT NULL)
				AND COALESCE(ea.min_age, 0) <= ? AND COALESCE(ea.max_age, 999) >= ?))`,
			*f.Age, *f.Age, *f.Age, *f.Age)
	}
	if len(f.Moods) > 0 {
		add(`EXISTS (SELECT 1 FROM event_moods em JOIN moods m ON m.id = em.mood_id
			WHERE em.event_id = e.id AND m.slug IN (`+placeholders(len(f.Moods))+`))`, anyArgs(f.Moods)...)
	}
	if len(f.Series) > 0 {
		add(`EXISTS (SELECT 1 FROM event_series es JOIN series s ON s.id = es.series_id
			WHERE es.event_id = e.id AND s.slug IN (`+placeholders(len(f.Series))+`))`, anyArgs(f.Series)...)
	}
	if f.ArtistID != nil {
		add(`(EXISTS (SELECT 1 FROM event_artists ea WHERE ea.event_id = e.id AND ea.artist_id = ?)
			OR EXISTS (SELECT 1 FROM event_works ew JOIN works w ON w.id = ew.work_id
				WHERE ew.event_id = e.id AND w.composer_id = ?))`, *f.ArtistID, *f.ArtistID)
	}
	if f.Free {
		add("p.ticket_status = 'free'")
	}
	if f.PriceMax != nil {
		add("(p.ticket_status = 'free' OR p.price_min <= ?)", *f.PriceMax)
	}
	if f.DurationMin != nil {
		add("e.duration_minutes >= ?", *f.DurationMin)
	}
	if f.DurationMax != nil {
		add("e.duration_minutes <= ?", *f.DurationMax)
	}
	for _, a := range f.Accessibility {
		add(`EXISTS (SELECT 1 FROM event_accessibility ax WHERE ax.event_id = e.id
			AND ax.accessibility_type = ? AND ax.status IN ('available', 'partial'))`, a)
	}
	if strings.TrimSpace(f.Query) != "" {
		q := likePattern(f.Query)
		add(`(EXISTS (SELECT 1 FROM event_translations st WHERE st.event_id = e.id
				AND (fold(st.title) LIKE ? ESCAPE '\' OR fold(st.subtitle) LIKE ? ESCAPE '\' OR fold(st.summary) LIKE ? ESCAPE '\'))
			OR EXISTS (SELECT 1 FROM event_artists sa JOIN artists a ON a.id = sa.artist_id
				WHERE sa.event_id = e.id AND fold(a.display_name) LIKE ? ESCAPE '\')
			OR EXISTS (SELECT 1 FROM event_works sw JOIN works w ON w.id = sw.work_id
				LEFT JOIN artists c ON c.id = w.composer_id
				LEFT JOIN work_translations wt ON wt.work_id = w.id
				WHERE sw.event_id = e.id AND (fold(w.default_title) LIKE ? ESCAPE '\'
					OR fold(wt.title) LIKE ? ESCAPE '\' OR fold(c.display_name) LIKE ? ESCAPE '\'))
			OR EXISTS (SELECT 1 FROM event_series ss JOIN series_translations sst ON sst.series_id = ss.series_id
				WHERE ss.event_id = e.id AND fold(sst.name) LIKE ? ESCAPE '\'))`,
			q, q, q, q, q, q, q, q)
	}
	return strings.Join(conds, " AND "), args
}

const filterFrom = `FROM performances p
	JOIN events e ON e.id = p.event_id
	LEFT JOIN venues v ON v.id = p.venue_id`

// ListEvents returns events with at least one matching performance, ordered by
// their first matching date, and the total number of matching events.
func (s *Store) ListEvents(ctx context.Context, f Filter) ([]EventSummary, int, error) {
	where, args := f.where()

	var total int
	if err := s.db.QueryRowContext(ctx, "SELECT COUNT(DISTINCT e.id) "+filterFrom+" WHERE "+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	rows, err := s.db.QueryContext(ctx, "SELECT e.id, MIN(p.starts_at) AS first "+filterFrom+" WHERE "+where+
		" GROUP BY e.id ORDER BY first, e.id LIMIT ? OFFSET ?", append(args, f.Limit, f.Offset)...)
	if err != nil {
		return nil, 0, err
	}
	var ids []int64
	for rows.Next() {
		var id int64
		var first string
		if err := rows.Scan(&id, &first); err != nil {
			rows.Close()
			return nil, 0, err
		}
		ids = append(ids, id)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	events, err := s.eventSummaries(ctx, f.Lang, ids)
	if err != nil || len(ids) == 0 {
		return events, total, err
	}
	// Attach only the performances that match the filter (e.g. the selected weekend).
	perfs, err := s.performances(ctx, where+" AND e.id IN ("+placeholders(len(ids))+")", append(args, anyArgs(ids)...), false)
	if err != nil {
		return nil, 0, err
	}
	byEvent := map[int64]*EventSummary{}
	for i := range events {
		byEvent[events[i].ID] = &events[i]
	}
	for _, p := range perfs {
		ev := byEvent[p.eventID]
		ev.Performances = append(ev.Performances, p.Performance)
	}
	return events, total, nil
}

// ListPerformances returns matching performances in chronological order (calendar view).
func (s *Store) ListPerformances(ctx context.Context, f Filter) ([]CalendarEntry, int, error) {
	where, args := f.where()

	var total int
	if err := s.db.QueryRowContext(ctx, "SELECT COUNT(*) "+filterFrom+" WHERE "+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}
	perfs, err := s.performances(ctx, where+" ORDER BY p.starts_at, p.id LIMIT ? OFFSET ?", append(args, f.Limit, f.Offset), false)
	if err != nil {
		return nil, 0, err
	}

	ids := make([]int64, 0, len(perfs))
	seen := map[int64]bool{}
	for _, p := range perfs {
		if !seen[p.eventID] {
			seen[p.eventID] = true
			ids = append(ids, p.eventID)
		}
	}
	events, err := s.eventSummaries(ctx, f.Lang, ids)
	if err != nil {
		return nil, 0, err
	}
	byEvent := map[int64]EventSummary{}
	for _, e := range events {
		e.Performances = nil
		byEvent[e.ID] = e
	}

	out := make([]CalendarEntry, len(perfs))
	for i, p := range perfs {
		out[i] = CalendarEntry{Performance: p.Performance, Event: byEvent[p.eventID]}
	}
	return out, total, nil
}

// GetEvent returns the full event card with all performances.
func (s *Store) GetEvent(ctx context.Context, lang string, id int64) (*EventDetail, error) {
	var d EventDetail
	var hasIntermission *int64
	err := s.db.QueryRowContext(ctx, `SELECT e.id, e.kind, e.calendar_category, e.season, COALESCE(t.language_code, 'pl'), COALESCE(t.title, ''),
			t.subtitle, t.summary, e.image_url, e.duration_minutes, e.has_intermission, e.min_age, e.max_age,
			t.description, t.why_attend, t.audience_note, t.programme_notes, t.partners_note,
			t.seo_title, t.seo_description, e.playlist_url, COALESCE(t.source_url, e.source_url), e.scraped_at
		FROM events e `+translationJoin("event_translations", "t", "event_id", "e")+`
		WHERE e.id = ? AND e.published = 1`, lang, id).Scan(
		&d.ID, &d.Kind, &d.CalendarCategory, &d.Season, &d.Language, &d.Title,
		&d.Subtitle, &d.Summary, &d.ImageURL, &d.DurationMinutes, &hasIntermission, &d.MinAge, &d.MaxAge,
		&d.Description, &d.WhyAttend, &d.AudienceNote, &d.ProgrammeNotes, &d.PartnersNote,
		&d.SEOTitle, &d.SEODescription, &d.PlaylistURL, &d.SourceURL, &d.ScrapedAt)
	if err == sql.ErrNoRows {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	d.HasIntermission = intBool(hasIntermission)

	perfs, err := s.performances(ctx, "p.event_id = ? ORDER BY p.starts_at", []any{id}, true)
	if err != nil {
		return nil, err
	}
	d.Performances = make([]Performance, len(perfs))
	for i, p := range perfs {
		d.Performances[i] = p.Performance
	}

	if d.AvailableLanguages, err = queryStrings(ctx, s.db,
		"SELECT language_code FROM event_translations WHERE event_id = ? ORDER BY CASE language_code WHEN 'pl' THEN 0 WHEN 'en' THEN 1 ELSE 2 END", id); err != nil {
		return nil, err
	}
	if d.Moods, err = queryStrings(ctx, s.db,
		"SELECT m.slug FROM event_moods em JOIN moods m ON m.id = em.mood_id WHERE em.event_id = ? ORDER BY m.slug", id); err != nil {
		return nil, err
	}
	if d.Artists, err = s.eventArtists(ctx, id); err != nil {
		return nil, err
	}
	if d.Works, err = s.eventWorks(ctx, lang, id); err != nil {
		return nil, err
	}
	if d.Series, err = s.eventSeries(ctx, lang, id); err != nil {
		return nil, err
	}
	if d.Audiences, err = s.eventAudiences(ctx, id); err != nil {
		return nil, err
	}
	if d.Accessibility, err = s.eventAccessibility(ctx, id); err != nil {
		return nil, err
	}
	return &d, nil
}

func (s *Store) eventSummaries(ctx context.Context, lang string, ids []int64) ([]EventSummary, error) {
	if len(ids) == 0 {
		return []EventSummary{}, nil
	}
	rows, err := s.db.QueryContext(ctx, `SELECT e.id, e.kind, e.calendar_category, e.season, COALESCE(t.language_code, 'pl'), COALESCE(t.title, ''),
			t.subtitle, t.summary, e.image_url, e.duration_minutes, e.has_intermission, e.min_age, e.max_age
		FROM events e `+translationJoin("event_translations", "t", "event_id", "e")+`
		WHERE e.id IN (`+placeholders(len(ids))+`)`, append([]any{lang}, anyArgs(ids)...)...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	byID := map[int64]EventSummary{}
	for rows.Next() {
		var e EventSummary
		var hasIntermission *int64
		if err := rows.Scan(&e.ID, &e.Kind, &e.CalendarCategory, &e.Season, &e.Language, &e.Title,
			&e.Subtitle, &e.Summary, &e.ImageURL, &e.DurationMinutes, &hasIntermission, &e.MinAge, &e.MaxAge); err != nil {
			return nil, err
		}
		e.HasIntermission = intBool(hasIntermission)
		e.Performances = []Performance{}
		byID[e.ID] = e
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	// Keep the order of ids.
	out := make([]EventSummary, 0, len(ids))
	for _, id := range ids {
		if e, ok := byID[id]; ok {
			out = append(out, e)
		}
	}
	return out, nil
}

type eventPerformance struct {
	Performance
	eventID int64
}

// performances runs a query over filterFrom with the given condition (and optional ORDER/LIMIT tail).
func (s *Store) performances(ctx context.Context, cond string, args []any, details bool) ([]eventPerformance, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT p.id, p.event_id, p.starts_at, p.ends_at, v.id, v.slug, v.name,
			p.ticket_status, p.price_min, p.price_max, p.currency, p.ticket_url, p.ticket_notes, p.price_details
		`+filterFrom+` WHERE `+cond, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []eventPerformance{}
	for rows.Next() {
		var p eventPerformance
		var venueID *int64
		var venueSlug, venueName *string
		var priceDetails string
		if err := rows.Scan(&p.ID, &p.eventID, &p.StartsAt, &p.EndsAt, &venueID, &venueSlug, &venueName,
			&p.TicketStatus, &p.PriceMin, &p.PriceMax, &p.Currency, &p.TicketURL, &p.TicketNotes, &priceDetails); err != nil {
			return nil, err
		}
		if venueID != nil {
			p.Venue = &VenueRef{ID: *venueID, Slug: deref(venueSlug), Name: deref(venueName)}
		}
		if details {
			if json.Valid([]byte(priceDetails)) {
				p.PriceDetails = json.RawMessage(priceDetails)
			}
		} else {
			p.TicketNotes = nil
		}
		out = append(out, p)
	}
	return out, rows.Err()
}

func (s *Store) eventArtists(ctx context.Context, id int64) ([]EventArtist, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT a.id, a.display_name, a.artist_type, a.image_url, ea.role
		FROM event_artists ea JOIN artists a ON a.id = ea.artist_id
		WHERE ea.event_id = ? ORDER BY ea.position, a.display_name`, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []EventArtist{}
	for rows.Next() {
		var a EventArtist
		if err := rows.Scan(&a.ID, &a.Name, &a.Type, &a.ImageURL, &a.Role); err != nil {
			return nil, err
		}
		out = append(out, a)
	}
	return out, rows.Err()
}

func (s *Store) eventWorks(ctx context.Context, lang string, id int64) ([]Work, error) {
	return s.works(ctx, `JOIN event_works ew ON ew.work_id = w.id WHERE ew.event_id = ? ORDER BY ew.position`, lang, id)
}

// works selects works w (with composer c) using the given JOIN/WHERE tail.
func (s *Store) works(ctx context.Context, tail, lang string, args ...any) ([]Work, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT w.id, COALESCE(wt.title, w.default_title), w.duration_minutes,
			w.audio_sample_url, w.full_recording_url, c.id, c.display_name, c.artist_type, c.image_url
		FROM works w `+translationJoin("work_translations", "wt", "work_id", "w")+`
		LEFT JOIN artists c ON c.id = w.composer_id `+tail, append([]any{lang}, args...)...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Work{}
	for rows.Next() {
		var w Work
		var cID *int64
		var cName, cType *string
		var cImage *string
		if err := rows.Scan(&w.ID, &w.Title, &w.DurationMinutes, &w.AudioSampleURL, &w.FullRecording,
			&cID, &cName, &cType, &cImage); err != nil {
			return nil, err
		}
		if cID != nil {
			w.Composer = &ArtistRef{ID: *cID, Name: deref(cName), Type: deref(cType), ImageURL: cImage}
		}
		out = append(out, w)
	}
	return out, rows.Err()
}

func (s *Store) eventSeries(ctx context.Context, lang string, id int64) ([]SeriesRef, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT s.id, s.slug, COALESCE(st.name, s.slug, '')
		FROM event_series es JOIN series s ON s.id = es.series_id
		`+translationJoin("series_translations", "st", "series_id", "s")+`
		WHERE es.event_id = ? ORDER BY 3`, lang, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []SeriesRef{}
	for rows.Next() {
		var r SeriesRef
		if err := rows.Scan(&r.ID, &r.Slug, &r.Name); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, rows.Err()
}

func (s *Store) eventAudiences(ctx context.Context, id int64) ([]Audience, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT ag.slug, ea.min_age, ea.max_age
		FROM event_audiences ea JOIN audience_groups ag ON ag.id = ea.audience_id
		WHERE ea.event_id = ? ORDER BY ag.id`, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Audience{}
	for rows.Next() {
		var a Audience
		if err := rows.Scan(&a.Slug, &a.MinAge, &a.MaxAge); err != nil {
			return nil, err
		}
		out = append(out, a)
	}
	return out, rows.Err()
}

func (s *Store) eventAccessibility(ctx context.Context, id int64) ([]Accessibility, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT accessibility_type, status, notes, source_url, verified_at
		FROM event_accessibility WHERE event_id = ? ORDER BY accessibility_type`, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Accessibility{}
	for rows.Next() {
		var a Accessibility
		if err := rows.Scan(&a.Type, &a.Status, &a.Notes, &a.SourceURL, &a.VerifiedAt); err != nil {
			return nil, err
		}
		out = append(out, a)
	}
	return out, rows.Err()
}

func queryStrings(ctx context.Context, db *sql.DB, query string, args ...any) ([]string, error) {
	rows, err := db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []string{}
	for rows.Next() {
		var s string
		if err := rows.Scan(&s); err != nil {
			return nil, err
		}
		out = append(out, s)
	}
	return out, rows.Err()
}

func intBool(v *int64) *bool {
	if v == nil {
		return nil
	}
	b := *v != 0
	return &b
}

func deref(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}
