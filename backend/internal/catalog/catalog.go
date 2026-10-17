package catalog

import (
	"context"
	"database/sql"
)

// Artist is an artist profile.
type Artist struct {
	ArtistRef
	ImageCredit *string        `json:"image_credit"`
	SourceURL   *string        `json:"source_url"`
	Language    *string        `json:"language"`
	Biography   *string        `json:"biography"`
	Roles       []string       `json:"roles"`
	Events      []EventSummary `json:"events"`
	Works       []Work         `json:"works"`
}

// Series is a concert cycle or festival.
type Series struct {
	SeriesRef
	Season      *string        `json:"season"`
	ImageURL    *string        `json:"image_url"`
	SourceURL   *string        `json:"source_url"`
	Language    *string        `json:"language"`
	Description *string        `json:"description,omitempty"`
	EventCount  int            `json:"event_count"`
	Events      []EventSummary `json:"events,omitempty"`
}

// Venue is a hall or gallery.
type Venue struct {
	VenueRef
	Type               string         `json:"type"`
	Address            *string        `json:"address"`
	City               string         `json:"city"`
	PostalCode         *string        `json:"postal_code"`
	CountryCode        string         `json:"country_code"`
	AccessibilityNotes *string        `json:"accessibility_notes,omitempty"`
	SeatplanURL        *string        `json:"seatplan_url"`
	Events             []EventSummary `json:"events,omitempty"`
}

// Option is a filter value with the number of upcoming events it matches.
type Option struct {
	Value string `json:"value"`
	Label string `json:"label,omitempty"`
	Count int    `json:"count"`
}

// Filters lists the values available for the calendar filters.
type Filters struct {
	Kinds         []Option `json:"kinds"`
	Categories    []Option `json:"categories"`
	Audiences     []Option `json:"audiences"`
	Moods         []Option `json:"moods"`
	Venues        []Option `json:"venues"`
	Series        []Option `json:"series"`
	TicketStatus  []Option `json:"ticket_status"`
	Accessibility []Option `json:"accessibility"`
	Languages     []string `json:"languages"`
	DateRange     struct {
		From *string `json:"from"`
		To   *string `json:"to"`
	} `json:"date_range"`
	PriceRange struct {
		Min *float64 `json:"min"`
		Max *float64 `json:"max"`
	} `json:"price_range"`
}

// SearchResults groups search hits by content type.
type SearchResults struct {
	Events  []EventSummary `json:"events"`
	Artists []ArtistRef    `json:"artists"`
	Works   []Work         `json:"works"`
	Series  []SeriesRef    `json:"series"`
}

// upcomingEvents lists events with performances from the given day on.
func (s *Store) upcomingEvents(ctx context.Context, f Filter) ([]EventSummary, error) {
	f.Limit, f.Offset = 100, 0
	events, _, err := s.ListEvents(ctx, f)
	return events, err
}

// ListArtists returns artists, optionally filtered by a diacritic-insensitive name query.
func (s *Store) ListArtists(ctx context.Context, q string, limit, offset int) ([]ArtistRef, int, error) {
	where, args := "1 = 1", []any{}
	if q != "" {
		where, args = `fold(a.display_name) LIKE ? ESCAPE '\'`, []any{likePattern(q)}
	}
	var total int
	if err := s.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM artists a WHERE "+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}
	out, err := s.artistRefs(ctx, "SELECT a.id, a.display_name, a.artist_type, a.image_url FROM artists a WHERE "+where+
		" ORDER BY a.display_name COLLATE NOCASE LIMIT ? OFFSET ?", append(args, limit, offset)...)
	return out, total, err
}

// GetArtist returns an artist with biography, upcoming events and composed works.
func (s *Store) GetArtist(ctx context.Context, lang, from string, id int64) (*Artist, error) {
	var a Artist
	err := s.db.QueryRowContext(ctx, `SELECT a.id, a.display_name, a.artist_type, a.image_url, a.image_credit,
			a.source_url, t.language_code, t.biography
		FROM artists a `+translationJoin("artist_translations", "t", "artist_id", "a")+`
		WHERE a.id = ?`, lang, id).Scan(&a.ID, &a.Name, &a.Type, &a.ImageURL, &a.ImageCredit,
		&a.SourceURL, &a.Language, &a.Biography)
	if err == sql.ErrNoRows {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	if a.Roles, err = queryStrings(ctx, s.db,
		"SELECT DISTINCT role FROM event_artists WHERE artist_id = ? AND role <> '' ORDER BY role", id); err != nil {
		return nil, err
	}
	if a.Events, err = s.upcomingEvents(ctx, Filter{Lang: lang, From: from, ArtistID: &id}); err != nil {
		return nil, err
	}
	if a.Works, err = s.works(ctx, "WHERE w.composer_id = ? ORDER BY 2", lang, id); err != nil {
		return nil, err
	}
	return &a, nil
}

// ListSeries returns all series with the number of their events.
func (s *Store) ListSeries(ctx context.Context, lang string) ([]Series, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT s.id, s.slug, COALESCE(t.name, s.slug, ''), s.season, s.image_url,
			s.source_url, t.language_code,
			(SELECT COUNT(*) FROM event_series es JOIN events e ON e.id = es.event_id
				WHERE es.series_id = s.id AND e.published = 1)
		FROM series s `+translationJoin("series_translations", "t", "series_id", "s")+`
		ORDER BY 3`, lang)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Series{}
	for rows.Next() {
		var r Series
		if err := rows.Scan(&r.ID, &r.Slug, &r.Name, &r.Season, &r.ImageURL, &r.SourceURL, &r.Language, &r.EventCount); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, rows.Err()
}

// GetSeries returns a series by slug with its description and upcoming events.
func (s *Store) GetSeries(ctx context.Context, lang, from, slug string) (*Series, error) {
	var r Series
	err := s.db.QueryRowContext(ctx, `SELECT s.id, s.slug, COALESCE(t.name, s.slug, ''), s.season, s.image_url,
			s.source_url, t.language_code, t.description
		FROM series s `+translationJoin("series_translations", "t", "series_id", "s")+`
		WHERE s.slug = ?`, lang, slug).Scan(&r.ID, &r.Slug, &r.Name, &r.Season, &r.ImageURL,
		&r.SourceURL, &r.Language, &r.Description)
	if err == sql.ErrNoRows {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	if r.Events, err = s.upcomingEvents(ctx, Filter{Lang: lang, From: from, Series: []string{slug}}); err != nil {
		return nil, err
	}
	r.Events = nonNil(r.Events)
	r.EventCount = len(r.Events)
	return &r, nil
}

const venueColumns = `SELECT id, slug, name, venue_type, address, city, postal_code, country_code,
	accessibility_notes, seatplan_url FROM venues`

// ListVenues returns all venues.
func (s *Store) ListVenues(ctx context.Context) ([]Venue, error) {
	rows, err := s.db.QueryContext(ctx, venueColumns+" ORDER BY id")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Venue{}
	for rows.Next() {
		v, err := scanVenue(rows)
		if err != nil {
			return nil, err
		}
		v.AccessibilityNotes = nil
		out = append(out, *v)
	}
	return out, rows.Err()
}

// GetVenue returns a venue by slug with accessibility notes and upcoming events.
func (s *Store) GetVenue(ctx context.Context, lang, from, slug string) (*Venue, error) {
	v, err := scanVenue(s.db.QueryRowContext(ctx, venueColumns+" WHERE slug = ?", slug))
	if err == sql.ErrNoRows {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	if v.Events, err = s.upcomingEvents(ctx, Filter{Lang: lang, From: from, Venues: []string{slug}}); err != nil {
		return nil, err
	}
	v.Events = nonNil(v.Events)
	return v, nil
}

func scanVenue(row interface{ Scan(...any) error }) (*Venue, error) {
	var v Venue
	err := row.Scan(&v.ID, &v.Slug, &v.Name, &v.Type, &v.Address, &v.City, &v.PostalCode, &v.CountryCode,
		&v.AccessibilityNotes, &v.SeatplanURL)
	if err != nil {
		return nil, err
	}
	return &v, nil
}

// GetFilters returns filter values with counts of events that have performances from the given day on.
func (s *Store) GetFilters(ctx context.Context, lang, from string) (*Filters, error) {
	const upcoming = `SELECT DISTINCT e.id FROM events e JOIN performances p ON p.event_id = e.id
		WHERE e.published = 1 AND COALESCE(substr(p.ends_at, 1, 10), substr(p.starts_at, 1, 10)) >= ?`
	var f Filters
	var err error
	queries := []struct {
		dst  *[]Option
		sql  string
		args []any
	}{
		{&f.Kinds, `SELECT e.kind, '', COUNT(*) FROM events e WHERE e.id IN (` + upcoming + `) GROUP BY 1 ORDER BY 3 DESC, 1`, []any{from}},
		{&f.Categories, `SELECT e.calendar_category, '', COUNT(*) FROM events e WHERE e.id IN (` + upcoming + `)
			AND e.calendar_category IS NOT NULL GROUP BY 1 ORDER BY 3 DESC, 1`, []any{from}},
		{&f.Audiences, `SELECT ag.slug, '', COUNT(DISTINCT ea.event_id) FROM audience_groups ag
			LEFT JOIN event_audiences ea ON ea.audience_id = ag.id AND ea.event_id IN (` + upcoming + `)
			GROUP BY ag.id ORDER BY ag.id`, []any{from}},
		{&f.Moods, `SELECT m.slug, '', COUNT(DISTINCT em.event_id) FROM moods m
			LEFT JOIN event_moods em ON em.mood_id = m.id AND em.event_id IN (` + upcoming + `)
			GROUP BY m.id ORDER BY m.id`, []any{from}},
		{&f.Venues, `SELECT v.slug, v.name, COUNT(DISTINCT p.event_id) FROM venues v
			LEFT JOIN performances p ON p.venue_id = v.id AND p.event_id IN (` + upcoming + `)
			GROUP BY v.id ORDER BY v.id`, []any{from}},
		{&f.Series, `SELECT s.slug, COALESCE(t.name, s.slug), COUNT(DISTINCT es.event_id) FROM series s
			` + translationJoin("series_translations", "t", "series_id", "s") + `
			LEFT JOIN event_series es ON es.series_id = s.id AND es.event_id IN (` + upcoming + `)
			WHERE s.slug IS NOT NULL GROUP BY s.id ORDER BY 2`, []any{lang, from}},
		{&f.TicketStatus, `SELECT p.ticket_status, '', COUNT(*) FROM performances p JOIN events e ON e.id = p.event_id
			WHERE e.published = 1 AND COALESCE(substr(p.ends_at, 1, 10), substr(p.starts_at, 1, 10)) >= ?
			GROUP BY 1 ORDER BY 3 DESC`, []any{from}},
		{&f.Accessibility, `SELECT accessibility_type, '', COUNT(*) FROM event_accessibility
			WHERE status IN ('available', 'partial') AND event_id IN (` + upcoming + `) GROUP BY 1 ORDER BY 1`, []any{from}},
	}
	for _, q := range queries {
		if *q.dst, err = s.options(ctx, q.sql, q.args...); err != nil {
			return nil, err
		}
	}
	f.Languages = Languages

	err = s.db.QueryRowContext(ctx, `SELECT MIN(substr(p.starts_at, 1, 10)),
			MAX(COALESCE(substr(p.ends_at, 1, 10), substr(p.starts_at, 1, 10))), MIN(p.price_min), MAX(p.price_max)
		FROM performances p JOIN events e ON e.id = p.event_id
		WHERE e.published = 1 AND COALESCE(substr(p.ends_at, 1, 10), substr(p.starts_at, 1, 10)) >= ?`, from).Scan(
		&f.DateRange.From, &f.DateRange.To, &f.PriceRange.Min, &f.PriceRange.Max)
	if err != nil {
		return nil, err
	}
	return &f, nil
}

func (s *Store) options(ctx context.Context, query string, args ...any) ([]Option, error) {
	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Option{}
	for rows.Next() {
		var o Option
		if err := rows.Scan(&o.Value, &o.Label, &o.Count); err != nil {
			return nil, err
		}
		out = append(out, o)
	}
	return out, rows.Err()
}

// Search finds upcoming events, artists, works and series matching q (typo-tolerant to missing diacritics).
func (s *Store) Search(ctx context.Context, lang, from, q string, limit int) (*SearchResults, error) {
	var r SearchResults
	var err error
	if r.Events, _, err = s.ListEvents(ctx, Filter{Lang: lang, From: from, Query: q, Limit: limit}); err != nil {
		return nil, err
	}
	if r.Artists, _, err = s.ListArtists(ctx, q, limit, 0); err != nil {
		return nil, err
	}
	pattern := likePattern(q)
	if r.Works, err = s.works(ctx, `WHERE fold(w.default_title) LIKE ? ESCAPE '\'
			OR EXISTS (SELECT 1 FROM work_translations x WHERE x.work_id = w.id AND fold(x.title) LIKE ? ESCAPE '\')
			OR fold(c.display_name) LIKE ? ESCAPE '\'
		ORDER BY 2 LIMIT ?`, lang, pattern, pattern, pattern, limit); err != nil {
		return nil, err
	}
	rows, err := s.db.QueryContext(ctx, `SELECT s.id, s.slug, COALESCE(t.name, s.slug, '') FROM series s
		`+translationJoin("series_translations", "t", "series_id", "s")+`
		WHERE EXISTS (SELECT 1 FROM series_translations x WHERE x.series_id = s.id AND fold(x.name) LIKE ? ESCAPE '\')
		ORDER BY 3 LIMIT ?`, lang, pattern, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	r.Series = []SeriesRef{}
	for rows.Next() {
		var sr SeriesRef
		if err := rows.Scan(&sr.ID, &sr.Slug, &sr.Name); err != nil {
			return nil, err
		}
		r.Series = append(r.Series, sr)
	}
	return &r, rows.Err()
}

func (s *Store) artistRefs(ctx context.Context, query string, args ...any) ([]ArtistRef, error) {
	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []ArtistRef{}
	for rows.Next() {
		var a ArtistRef
		if err := rows.Scan(&a.ID, &a.Name, &a.Type, &a.ImageURL); err != nil {
			return nil, err
		}
		out = append(out, a)
	}
	return out, rows.Err()
}

func nonNil[T any](s []T) []T {
	if s == nil {
		return []T{}
	}
	return s
}
