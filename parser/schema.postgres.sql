-- PostgreSQL 15+ starter schema for the Filharmonia Szczecin hackathon.
-- Public catalogue data only; ticket checkout and customer accounts remain external.

CREATE TABLE venues (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    venue_type TEXT NOT NULL DEFAULT 'hall',
    address TEXT,
    city TEXT NOT NULL DEFAULT 'Szczecin',
    postal_code TEXT,
    country_code CHAR(2) NOT NULL DEFAULT 'PL',
    accessibility_notes TEXT,
    source_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    source_key TEXT UNIQUE,
    kind TEXT NOT NULL DEFAULT 'other'
        CHECK (kind IN ('symphonic', 'chamber', 'jazz', 'concert', 'education', 'exhibition', 'tour', 'festival', 'external', 'other')),
    source_category TEXT,
    season TEXT,
    image_url TEXT,
    duration_minutes INTEGER CHECK (duration_minutes IS NULL OR duration_minutes > 0),
    has_intermission BOOLEAN,
    min_age SMALLINT CHECK (min_age IS NULL OR min_age >= 0),
    max_age SMALLINT CHECK (max_age IS NULL OR max_age >= min_age),
    source_url TEXT,
    source_system TEXT NOT NULL DEFAULT 'filharmonia.szczecin.pl',
    source_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    scraped_at TIMESTAMPTZ,
    published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE event_translations (
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    language_code CHAR(2) NOT NULL CHECK (language_code IN ('pl', 'en', 'de')),
    title TEXT NOT NULL,
    subtitle TEXT,
    summary TEXT,
    description TEXT,
    why_attend TEXT,
    seo_title TEXT,
    seo_description TEXT,
    PRIMARY KEY (event_id, language_code)
);

-- One event may have multiple performances; repeated dates are not duplicate events.
CREATE TABLE performances (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    venue_id BIGINT REFERENCES venues(id) ON DELETE SET NULL,
    source_key TEXT UNIQUE,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ,
    ticket_status TEXT NOT NULL DEFAULT 'unknown'
        CHECK (ticket_status IN ('available', 'last_seats', 'sold_out', 'free', 'registration_required', 'unknown')),
    price_min NUMERIC(8,2) CHECK (price_min IS NULL OR price_min >= 0),
    price_max NUMERIC(8,2) CHECK (price_max IS NULL OR price_max >= price_min),
    currency CHAR(3) NOT NULL DEFAULT 'PLN',
    ticket_url TEXT,
    source_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    scraped_at TIMESTAMPTZ,
    UNIQUE (event_id, starts_at)
);

CREATE TABLE artists (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    source_key TEXT UNIQUE,
    display_name TEXT NOT NULL,
    artist_type TEXT NOT NULL DEFAULT 'person' CHECK (artist_type IN ('person', 'ensemble', 'orchestra', 'organization')),
    image_url TEXT,
    source_url TEXT
);

CREATE TABLE artist_translations (
    artist_id BIGINT NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    language_code CHAR(2) NOT NULL CHECK (language_code IN ('pl', 'en', 'de')),
    biography TEXT,
    PRIMARY KEY (artist_id, language_code)
);

CREATE TABLE event_artists (
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    artist_id BIGINT NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'performer',
    position SMALLINT NOT NULL DEFAULT 0,
    PRIMARY KEY (event_id, artist_id, role)
);

CREATE TABLE works (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    source_key TEXT UNIQUE,
    composer_id BIGINT REFERENCES artists(id) ON DELETE SET NULL,
    default_title TEXT NOT NULL,
    duration_minutes INTEGER CHECK (duration_minutes IS NULL OR duration_minutes > 0),
    audio_sample_url TEXT,
    full_recording_url TEXT
);

CREATE TABLE work_translations (
    work_id BIGINT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
    language_code CHAR(2) NOT NULL CHECK (language_code IN ('pl', 'en', 'de')),
    title TEXT NOT NULL,
    PRIMARY KEY (work_id, language_code)
);

CREATE TABLE event_works (
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    work_id BIGINT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
    position SMALLINT NOT NULL DEFAULT 0,
    PRIMARY KEY (event_id, work_id)
);

CREATE TABLE series (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    source_key TEXT UNIQUE,
    slug TEXT UNIQUE,
    season TEXT,
    source_url TEXT
);

CREATE TABLE series_translations (
    series_id BIGINT NOT NULL REFERENCES series(id) ON DELETE CASCADE,
    language_code CHAR(2) NOT NULL CHECK (language_code IN ('pl', 'en', 'de')),
    name TEXT NOT NULL,
    description TEXT,
    PRIMARY KEY (series_id, language_code)
);

CREATE TABLE event_series (
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    series_id BIGINT NOT NULL REFERENCES series(id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, series_id)
);

CREATE TABLE audience_groups (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE
);

CREATE TABLE event_audiences (
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    audience_id BIGINT NOT NULL REFERENCES audience_groups(id) ON DELETE CASCADE,
    min_age SMALLINT CHECK (min_age IS NULL OR min_age >= 0),
    max_age SMALLINT CHECK (max_age IS NULL OR max_age >= min_age),
    PRIMARY KEY (event_id, audience_id)
);

CREATE TABLE moods (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE
);

CREATE TABLE event_moods (
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    mood_id BIGINT NOT NULL REFERENCES moods(id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, mood_id)
);

CREATE TABLE event_accessibility (
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    accessibility_type TEXT NOT NULL CHECK (accessibility_type IN ('mobility', 'visual', 'hearing', 'sensory')),
    status TEXT NOT NULL DEFAULT 'unknown' CHECK (status IN ('available', 'not_available', 'unknown')),
    notes TEXT,
    source_url TEXT,
    verified_at TIMESTAMPTZ,
    PRIMARY KEY (event_id, accessibility_type)
);

-- Keep provenance and original structured data so scraped facts can be checked/updated.
CREATE TABLE source_snapshots (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    source_url TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    source_key TEXT NOT NULL,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    payload JSONB NOT NULL,
    UNIQUE (source_url, entity_type, source_key, captured_at)
);

CREATE INDEX performances_starts_at_idx ON performances (starts_at);
CREATE INDEX performances_ticket_status_idx ON performances (ticket_status);
CREATE INDEX event_translations_title_search_idx ON event_translations USING GIN (to_tsvector('simple', title));
CREATE INDEX events_source_system_idx ON events (source_system);
CREATE INDEX event_accessibility_type_status_idx ON event_accessibility (accessibility_type, status);

INSERT INTO audience_groups (slug) VALUES
    ('children'), ('families'), ('preschool'), ('schools'), ('youth'), ('teachers'), ('young-musicians'), ('adults'), ('beginners')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO moods (slug) VALUES
    ('classical-super-hits'), ('emotional'), ('energy'), ('relax'), ('something-extraordinary')
ON CONFLICT (slug) DO NOTHING;
