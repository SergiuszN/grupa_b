-- SQLite 3.35+ schema for the Filharmonia Szczecin hackathon demo.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS venues (
    id INTEGER PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    venue_type TEXT NOT NULL DEFAULT 'hall',
    address TEXT,
    city TEXT NOT NULL DEFAULT 'Szczecin',
    postal_code TEXT,
    country_code TEXT NOT NULL DEFAULT 'PL' CHECK (length(country_code) = 2),
    accessibility_notes TEXT,
    source_url TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY,
    source_key TEXT NOT NULL UNIQUE,
    kind TEXT NOT NULL DEFAULT 'other'
        CHECK (kind IN ('symphonic', 'chamber', 'jazz', 'concert', 'education', 'exhibition', 'tour', 'festival', 'external', 'other')),
    source_category TEXT,
    season TEXT,
    image_url TEXT,
    duration_minutes INTEGER CHECK (duration_minutes IS NULL OR duration_minutes > 0),
    has_intermission INTEGER CHECK (has_intermission IS NULL OR has_intermission IN (0, 1)),
    min_age INTEGER CHECK (min_age IS NULL OR min_age >= 0),
    max_age INTEGER CHECK (max_age IS NULL OR max_age >= min_age),
    source_url TEXT NOT NULL,
    source_system TEXT NOT NULL DEFAULT 'filharmonia.szczecin.pl',
    source_payload TEXT NOT NULL DEFAULT '{}',
    scraped_at TEXT,
    published INTEGER NOT NULL DEFAULT 1 CHECK (published IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS event_translations (
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    language_code TEXT NOT NULL CHECK (language_code IN ('pl', 'en', 'de')),
    title TEXT NOT NULL,
    subtitle TEXT,
    summary TEXT,
    description TEXT,
    why_attend TEXT,
    seo_title TEXT,
    seo_description TEXT,
    PRIMARY KEY (event_id, language_code)
);

-- A single event can have multiple performances/dates.
CREATE TABLE IF NOT EXISTS performances (
    id INTEGER PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    venue_id INTEGER REFERENCES venues(id) ON DELETE SET NULL,
    source_key TEXT UNIQUE,
    starts_at TEXT NOT NULL,
    ends_at TEXT,
    ticket_status TEXT NOT NULL DEFAULT 'unknown'
        CHECK (ticket_status IN ('available', 'last_seats', 'sold_out', 'free', 'registration_required', 'unknown')),
    price_min REAL CHECK (price_min IS NULL OR price_min >= 0),
    price_max REAL CHECK (price_max IS NULL OR price_max >= price_min),
    currency TEXT NOT NULL DEFAULT 'PLN' CHECK (length(currency) = 3),
    ticket_url TEXT,
    source_payload TEXT NOT NULL DEFAULT '{}',
    scraped_at TEXT,
    UNIQUE (event_id, starts_at)
);

CREATE TABLE IF NOT EXISTS artists (
    id INTEGER PRIMARY KEY,
    source_key TEXT UNIQUE,
    display_name TEXT NOT NULL UNIQUE,
    artist_type TEXT NOT NULL DEFAULT 'person'
        CHECK (artist_type IN ('person', 'ensemble', 'orchestra', 'organization')),
    image_url TEXT,
    source_url TEXT
);

CREATE TABLE IF NOT EXISTS artist_translations (
    artist_id INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    language_code TEXT NOT NULL CHECK (language_code IN ('pl', 'en', 'de')),
    biography TEXT,
    PRIMARY KEY (artist_id, language_code)
);

CREATE TABLE IF NOT EXISTS event_artists (
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    artist_id INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'performer',
    position INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (event_id, artist_id, role)
);

CREATE TABLE IF NOT EXISTS works (
    id INTEGER PRIMARY KEY,
    source_key TEXT UNIQUE,
    composer_id INTEGER REFERENCES artists(id) ON DELETE SET NULL,
    default_title TEXT NOT NULL,
    duration_minutes INTEGER CHECK (duration_minutes IS NULL OR duration_minutes > 0),
    audio_sample_url TEXT,
    full_recording_url TEXT
);

CREATE TABLE IF NOT EXISTS work_translations (
    work_id INTEGER NOT NULL REFERENCES works(id) ON DELETE CASCADE,
    language_code TEXT NOT NULL CHECK (language_code IN ('pl', 'en', 'de')),
    title TEXT NOT NULL,
    PRIMARY KEY (work_id, language_code)
);

CREATE TABLE IF NOT EXISTS event_works (
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    work_id INTEGER NOT NULL REFERENCES works(id) ON DELETE CASCADE,
    position INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (event_id, work_id)
);

CREATE TABLE IF NOT EXISTS series (
    id INTEGER PRIMARY KEY,
    source_key TEXT UNIQUE,
    slug TEXT UNIQUE,
    season TEXT,
    source_url TEXT
);

CREATE TABLE IF NOT EXISTS series_translations (
    series_id INTEGER NOT NULL REFERENCES series(id) ON DELETE CASCADE,
    language_code TEXT NOT NULL CHECK (language_code IN ('pl', 'en', 'de')),
    name TEXT NOT NULL,
    description TEXT,
    PRIMARY KEY (series_id, language_code)
);

CREATE TABLE IF NOT EXISTS event_series (
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    series_id INTEGER NOT NULL REFERENCES series(id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, series_id)
);

CREATE TABLE IF NOT EXISTS audience_groups (
    id INTEGER PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS event_audiences (
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    audience_id INTEGER NOT NULL REFERENCES audience_groups(id) ON DELETE CASCADE,
    min_age INTEGER CHECK (min_age IS NULL OR min_age >= 0),
    max_age INTEGER CHECK (max_age IS NULL OR max_age >= min_age),
    PRIMARY KEY (event_id, audience_id)
);

CREATE TABLE IF NOT EXISTS moods (
    id INTEGER PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS event_moods (
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    mood_id INTEGER NOT NULL REFERENCES moods(id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, mood_id)
);

CREATE TABLE IF NOT EXISTS event_accessibility (
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    accessibility_type TEXT NOT NULL CHECK (accessibility_type IN ('mobility', 'visual', 'hearing', 'sensory')),
    status TEXT NOT NULL DEFAULT 'unknown' CHECK (status IN ('available', 'not_available', 'unknown')),
    notes TEXT,
    source_url TEXT,
    verified_at TEXT,
    PRIMARY KEY (event_id, accessibility_type)
);

CREATE TABLE IF NOT EXISTS source_snapshots (
    id INTEGER PRIMARY KEY,
    source_url TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    source_key TEXT NOT NULL,
    captured_at TEXT NOT NULL DEFAULT (datetime('now')),
    payload TEXT NOT NULL,
    UNIQUE (source_url, entity_type, source_key, captured_at)
);

CREATE INDEX IF NOT EXISTS performances_starts_at_idx ON performances (starts_at);
CREATE INDEX IF NOT EXISTS performances_ticket_status_idx ON performances (ticket_status);
CREATE INDEX IF NOT EXISTS event_translations_title_idx ON event_translations (title COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS events_source_system_idx ON events (source_system);
CREATE INDEX IF NOT EXISTS event_accessibility_type_status_idx ON event_accessibility (accessibility_type, status);

INSERT OR IGNORE INTO audience_groups (slug) VALUES
    ('children'), ('families'), ('preschool'), ('schools'), ('youth'), ('teachers'), ('young-musicians'), ('adults'), ('beginners');

INSERT OR IGNORE INTO moods (slug) VALUES
    ('classical-super-hits'), ('emotional'), ('energy'), ('relax'), ('something-extraordinary');
