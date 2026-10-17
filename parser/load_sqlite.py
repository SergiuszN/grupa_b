#!/usr/bin/env python3
"""Load scraped Filharmonia JSON into the local SQLite demo database."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = ROOT / "data" / "filharmonia_events.json"
DEFAULT_DB = ROOT / "data" / "filharmonia.sqlite"
SCHEMA = Path(__file__).resolve().parent / "schema.sqlite.sql"
LANGUAGES = {"pl", "en", "de"}


def stable_key(kind: str, value: str) -> str:
    digest = hashlib.sha1(value.strip().casefold().encode("utf-8")).hexdigest()[:16]
    return f"fs:{kind}:{digest}"


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.casefold()).strip("-") or "item"


def row_id(conn: sqlite3.Connection, table: str, column: str, value: str) -> int:
    row = conn.execute(f"SELECT id FROM {table} WHERE {column} = ?", (value,)).fetchone()
    assert row is not None, (table, value)
    return int(row[0])


def upsert_artist(conn: sqlite3.Connection, artist: dict) -> int:
    conn.execute(
        """INSERT INTO artists(source_key, display_name, artist_type, image_url, image_credit, source_url)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT(source_key) DO UPDATE SET
             display_name=excluded.display_name, artist_type=excluded.artist_type,
             image_url=excluded.image_url, image_credit=excluded.image_credit, source_url=excluded.source_url""",
        (artist["source_key"], artist["display_name"], artist.get("artist_type", "person"),
         artist.get("image_url"), artist.get("image_credit"), artist.get("source_url")),
    )
    artist_id = row_id(conn, "artists", "source_key", artist["source_key"])
    for language, biography in (artist.get("biography") or {}).items():
        if language in LANGUAGES and biography:
            conn.execute(
                "INSERT OR REPLACE INTO artist_translations(artist_id, language_code, biography) VALUES (?, ?, ?)",
                (artist_id, language, biography),
            )
    return artist_id


def composer_id(conn: sqlite3.Connection, name: str) -> int:
    """Composers are only named in the programme; reuse an artist with the same name if known."""
    row = conn.execute("SELECT id FROM artists WHERE display_name = ? ORDER BY id LIMIT 1", (name,)).fetchone()
    if row:
        return int(row[0])
    return upsert_artist(conn, {"source_key": stable_key("composer", name), "display_name": name, "artist_type": "person"})


def upsert_series(conn: sqlite3.Connection, series: dict) -> int:
    key = series["source_key"]
    conn.execute(
        """INSERT INTO series(source_key, slug, season, image_url, source_url) VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(source_key) DO UPDATE SET season=excluded.season, image_url=excluded.image_url, source_url=excluded.source_url""",
        (key, slugify(series["names"].get("pl") or key) + "-" + key.rsplit(":", 1)[-1],
         series.get("season"), series.get("image_url"), series.get("source_url")),
    )
    series_id = row_id(conn, "series", "source_key", key)
    for language, name in series.get("names", {}).items():
        if language in LANGUAGES and name:
            conn.execute(
                "INSERT OR REPLACE INTO series_translations(series_id, language_code, name, description) VALUES (?, ?, ?, ?)",
                (series_id, language, name, (series.get("descriptions") or {}).get(language)),
            )
    return series_id


def get_venue_id(conn: sqlite3.Connection, venue: dict, source_url: str, accessibility_notes: str | None) -> int | None:
    name = venue.get("hall") or venue.get("organisation")
    if not name:
        return None
    slug = slugify(name)
    in_building = "Małopolska" in (venue.get("street") or "")
    conn.execute(
        """INSERT INTO venues(slug, name, venue_type, address, city, postal_code, accessibility_notes, seatplan_url, source_url)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(slug) DO UPDATE SET
             address=COALESCE(excluded.address, venues.address), postal_code=COALESCE(excluded.postal_code, venues.postal_code),
             seatplan_url=COALESCE(excluded.seatplan_url, venues.seatplan_url),
             accessibility_notes=COALESCE(excluded.accessibility_notes, venues.accessibility_notes)""",
        (slug, name, "gallery" if re.search(r"galeri|art\.room", name, re.I) else "hall",
         venue.get("street"), venue.get("city") or "Szczecin", venue.get("postal_code"),
         accessibility_notes if in_building else None, venue.get("seatplan_url"), source_url),
    )
    return row_id(conn, "venues", "slug", slug)


def load_event(conn: sqlite3.Connection, event: dict, captured_at: str, artist_ids: dict[str, int],
               series_ids: dict[str, int], venue_notes: str | None) -> tuple[int, int]:
    source_key = event["source_key"]
    season = next((series["name"] for series in event.get("series", []) if re.search(r"20\d\d/20\d\d", series.get("name") or "")), None)
    season = re.search(r"20\d\d/20\d\d", season).group(0) if season else None
    conn.execute(
        """INSERT INTO events(source_key, kind, source_category, calendar_category, season, image_url, playlist_url,
                              duration_minutes, has_intermission, min_age, max_age, source_url, source_payload, scraped_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(source_key) DO UPDATE SET
             kind=excluded.kind, source_category=excluded.source_category, calendar_category=excluded.calendar_category,
             season=excluded.season, image_url=excluded.image_url, playlist_url=excluded.playlist_url,
             duration_minutes=excluded.duration_minutes, has_intermission=excluded.has_intermission,
             min_age=excluded.min_age, max_age=excluded.max_age, source_url=excluded.source_url,
             source_payload=excluded.source_payload, scraped_at=excluded.scraped_at, updated_at=datetime('now')""",
        (source_key, event.get("kind", "other"), " | ".join(event.get("category_labels", [])) or None,
         event.get("calendar_filter"), season, event.get("image_url"), event.get("playlist_url"),
         event.get("duration_minutes"),
         None if event.get("has_intermission") is None else int(event["has_intermission"]),
         event.get("min_age"), event.get("max_age"), event["source_url"],
         json.dumps(event.get("source_payload", {}), ensure_ascii=False), captured_at),
    )
    event_id = row_id(conn, "events", "source_key", source_key)

    # Replace related scraped rows, so a refresh also removes stale dates/artists/works.
    for table in ("event_translations", "performances", "event_artists", "event_works", "event_series",
                  "event_audiences", "event_accessibility"):
        conn.execute(f"DELETE FROM {table} WHERE event_id = ?", (event_id,))

    for language, translated in event.get("translations", {}).items():
        if language not in LANGUAGES or not translated.get("title"):
            continue
        conn.execute(
            """INSERT INTO event_translations(event_id, language_code, title, subtitle, description,
                                              audience_note, programme_notes, partners_note, source_url)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (event_id, language, translated["title"], translated.get("subtitle"), translated.get("description"),
             translated.get("audience_note"), translated.get("programme_notes"), translated.get("partners_note"),
             translated.get("source_url")),
        )

    for person in event.get("artists", []):
        artist_id = artist_ids.get(person["key"]) or upsert_artist(
            conn, {"source_key": person["key"], "display_name": person["name"], "source_url": person.get("url")})
        conn.execute(
            "INSERT OR IGNORE INTO event_artists(event_id, artist_id, role, position) VALUES (?, ?, ?, ?)",
            (event_id, artist_id, person.get("role") or "performer", person["position"]),
        )

    for work in event.get("works", []):
        title = (work.get("title") or "").strip()
        if not title:
            continue
        composer_name = (work.get("composer") or "").strip()
        work_key = stable_key("work", f"{title}|{composer_name}")
        conn.execute(
            "INSERT OR IGNORE INTO works(source_key, composer_id, default_title) VALUES (?, ?, ?)",
            (work_key, composer_id(conn, composer_name) if composer_name else None, title),
        )
        work_id = row_id(conn, "works", "source_key", work_key)
        for language, translated_title in (work.get("titles") or {"pl": title}).items():
            if language in LANGUAGES and translated_title:
                conn.execute("INSERT OR IGNORE INTO work_translations(work_id, language_code, title) VALUES (?, ?, ?)",
                             (work_id, language, translated_title))
        conn.execute("INSERT OR IGNORE INTO event_works(event_id, work_id, position) VALUES (?, ?, ?)",
                     (event_id, work_id, work["position"]))

    for series in event.get("series", []):
        series_id = series_ids.get(series["source_key"])
        if series_id:
            conn.execute("INSERT OR IGNORE INTO event_series(event_id, series_id) VALUES (?, ?)", (event_id, series_id))

    for slug in event.get("audiences", []):
        conn.execute("INSERT OR IGNORE INTO audience_groups(slug) VALUES (?)", (slug,))
        conn.execute(
            "INSERT OR IGNORE INTO event_audiences(event_id, audience_id, min_age, max_age) VALUES (?, ?, ?, ?)",
            (event_id, row_id(conn, "audience_groups", "slug", slug), event.get("min_age"), event.get("max_age")),
        )

    for row in event.get("accessibility", []):
        conn.execute(
            """INSERT INTO event_accessibility(event_id, accessibility_type, status, notes, source_url, verified_at)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (event_id, row["type"], row["status"], row.get("notes"), row.get("source_url"), row.get("verified_at")),
        )

    venue_id = get_venue_id(conn, event.get("venue") or {}, event["source_url"], venue_notes)
    performance_count = 0
    for performance in event.get("performances", []):
        starts_at = performance["starts_at"]
        conn.execute(
            """INSERT INTO performances(
                   event_id, venue_id, source_key, starts_at, ends_at, ticket_status, price_min, price_max,
                   price_details, currency, ticket_url, ticket_notes, source_payload, scraped_at
               ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (event_id, venue_id, f"{source_key}:{starts_at}", starts_at, performance.get("ends_at"),
             performance.get("ticket_status", "unknown"), performance.get("price_min"), performance.get("price_max"),
             json.dumps(performance.get("prices", []), ensure_ascii=False), performance.get("currency", "PLN"),
             performance.get("ticket_url"), performance.get("ticket_notes"),
             json.dumps({"calendar_date_id": performance.get("calendar_date_id")}), captured_at),
        )
        performance_count += 1

    conn.execute(
        """INSERT OR IGNORE INTO source_snapshots(source_url, entity_type, source_key, captured_at, payload)
           VALUES (?, 'event', ?, ?, ?)""",
        (event["source_url"], source_key, captured_at, json.dumps(event, ensure_ascii=False)),
    )
    return 1, performance_count


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--db", type=Path, default=DEFAULT_DB)
    parser.add_argument("--reset", action="store_true", help="recreate the database file from the current schema")
    args = parser.parse_args()

    payload = json.loads(args.input.read_text(encoding="utf-8"))
    args.db.parent.mkdir(parents=True, exist_ok=True)
    if args.reset and args.db.exists():
        args.db.unlink()
    conn = sqlite3.connect(args.db)
    conn.execute("PRAGMA foreign_keys = ON")
    conn.executescript(SCHEMA.read_text(encoding="utf-8"))

    captured_at = payload.get("captured_at", "")
    building = payload.get("building_accessibility") or {}
    venue_notes = "\n\n".join(filter(None, [
        (building.get("mobility") or {}).get("notes"),
        (building.get("hearing") or {}).get("notes"),
        (building.get("visual") or {}).get("notes"),
        building.get("assistance"),
    ])) or None
    try:
        with conn:
            artist_ids = {artist["source_key"]: upsert_artist(conn, artist) for artist in payload.get("artists", [])}
            series_ids = {series["source_key"]: upsert_series(conn, series) for series in payload.get("series", [])}
            total_events = total_performances = 0
            for event in payload.get("events", []):
                events_added, performances_added = load_event(conn, event, captured_at, artist_ids, series_ids, venue_notes)
                total_events += events_added
                total_performances += performances_added
    finally:
        conn.close()

    print(f"Loaded {total_events} events / {total_performances} performances / {len(artist_ids)} artists into {args.db}")


if __name__ == "__main__":
    main()
