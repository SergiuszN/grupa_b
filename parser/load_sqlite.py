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
SCHEMA = ROOT / "db" / "schema.sqlite.sql"


def stable_key(kind: str, value: str) -> str:
    digest = hashlib.sha1(value.strip().casefold().encode("utf-8")).hexdigest()[:16]
    return f"fs:{kind}:{digest}"


def get_artist_id(conn: sqlite3.Connection, name: str, source_url: str | None = None) -> int:
    name = name.strip()
    artist_type = "orchestra" if "orkiestr" in name.casefold() else "person"
    conn.execute(
        "INSERT OR IGNORE INTO artists(source_key, display_name, artist_type, source_url) VALUES (?, ?, ?, ?)",
        (stable_key("artist", name), name, artist_type, source_url),
    )
    row = conn.execute("SELECT id FROM artists WHERE display_name = ?", (name,)).fetchone()
    assert row is not None
    return int(row[0])


def get_venue_id(conn: sqlite3.Connection, performance: dict, source_url: str) -> int | None:
    payload = performance.get("source_payload") or {}
    locations = payload.get("location") or []
    if isinstance(locations, dict):
        locations = [locations]
    location = locations[0] if locations and isinstance(locations[0], dict) else {}
    name = performance.get("venue_name") or location.get("name")
    if not name:
        return None
    address = location.get("address") or {}
    if isinstance(address, str):
        address_text = address
        postal_code = None
        city = "Szczecin"
    else:
        address_text = address.get("streetAddress")
        postal_code = address.get("postalCode")
        city = address.get("addressLocality") or "Szczecin"
    slug = re.sub(r"[^a-z0-9]+", "-", name.casefold()).strip("-") or "venue"
    conn.execute(
        """INSERT OR IGNORE INTO venues(slug, name, address, city, postal_code, country_code, source_url)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (slug, name, address_text, city, postal_code, address.get("addressCountry", "PL") if isinstance(address, dict) else "PL", source_url),
    )
    row = conn.execute("SELECT id FROM venues WHERE slug = ?", (slug,)).fetchone()
    return int(row[0]) if row else None


def load_event(conn: sqlite3.Connection, event: dict, captured_at: str) -> tuple[int, int]:
    source_key = event["source_key"]
    conn.execute(
        """INSERT INTO events(source_key, kind, source_category, image_url, source_url, source_payload, scraped_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(source_key) DO UPDATE SET
             kind=excluded.kind, source_category=excluded.source_category,
             image_url=excluded.image_url, source_url=excluded.source_url,
             source_payload=excluded.source_payload, scraped_at=excluded.scraped_at,
             updated_at=datetime('now')""",
        (source_key, event.get("kind", "other"), " | ".join(event.get("category_labels", [])) or None,
         event.get("image_url"), event["source_url"],
         json.dumps(event.get("source_payload", {}), ensure_ascii=False), captured_at),
    )
    event_id = int(conn.execute("SELECT id FROM events WHERE source_key = ?", (source_key,)).fetchone()[0])

    # Replace related scraped rows, so a refresh also removes stale dates/artists/works.
    for table in ("event_translations", "performances", "event_artists", "event_works", "event_series"):
        conn.execute(f"DELETE FROM {table} WHERE event_id = ?", (event_id,))

    for language, translated in event.get("translations", {}).items():
        title = translated.get("title")
        if not title or language not in {"pl", "en", "de"}:
            continue
        conn.execute(
            """INSERT INTO event_translations(event_id, language_code, title, description)
               VALUES (?, ?, ?, ?)""",
            (event_id, language, title, translated.get("description")),
        )

    for position, performer in enumerate(event.get("performers", [])):
        artist_id = get_artist_id(conn, performer, event["source_url"])
        conn.execute(
            "INSERT OR IGNORE INTO event_artists(event_id, artist_id, role, position) VALUES (?, ?, 'performer', ?)",
            (event_id, artist_id, position),
        )

    for position, work in enumerate(event.get("works", [])):
        title = (work.get("title") or "").strip()
        if not title:
            continue
        composer_name = (work.get("composer") or "").strip()
        composer_id = get_artist_id(conn, composer_name, event["source_url"]) if composer_name else None
        work_key = stable_key("work", f"{title}|{composer_name}")
        conn.execute(
            """INSERT OR IGNORE INTO works(source_key, composer_id, default_title)
               VALUES (?, ?, ?)""",
            (work_key, composer_id, title),
        )
        work_id = int(conn.execute("SELECT id FROM works WHERE source_key = ?", (work_key,)).fetchone()[0])
        conn.execute("INSERT OR IGNORE INTO work_translations(work_id, language_code, title) VALUES (?, 'pl', ?)", (work_id, title))
        conn.execute("INSERT OR IGNORE INTO event_works(event_id, work_id, position) VALUES (?, ?, ?)", (event_id, work_id, position))

    for series_label in event.get("series_labels", []):
        series_key = stable_key("series", series_label)
        conn.execute(
            "INSERT OR IGNORE INTO series(source_key, slug, source_url) VALUES (?, ?, ?)",
            (series_key, series_key.replace(":", "-"), event["source_url"]),
        )
        series_id = int(conn.execute("SELECT id FROM series WHERE source_key = ?", (series_key,)).fetchone()[0])
        conn.execute(
            "INSERT OR REPLACE INTO series_translations(series_id, language_code, name) VALUES (?, 'pl', ?)",
            (series_id, series_label),
        )
        conn.execute("INSERT OR IGNORE INTO event_series(event_id, series_id) VALUES (?, ?)", (event_id, series_id))

    performance_count = 0
    for performance in event.get("performances", []):
        starts_at = performance["starts_at"]
        performance_key = f"{source_key}:{starts_at}"
        venue_id = get_venue_id(conn, performance, event["source_url"])
        conn.execute(
            """INSERT INTO performances(
                   event_id, venue_id, source_key, starts_at, ends_at, ticket_status,
                   price_min, price_max, currency, ticket_url, source_payload, scraped_at
               ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT(source_key) DO UPDATE SET
                   event_id=excluded.event_id, venue_id=excluded.venue_id,
                   starts_at=excluded.starts_at, ends_at=excluded.ends_at,
                   ticket_status=excluded.ticket_status, price_min=excluded.price_min,
                   price_max=excluded.price_max, currency=excluded.currency,
                   ticket_url=excluded.ticket_url, source_payload=excluded.source_payload,
                   scraped_at=excluded.scraped_at""",
            (event_id, venue_id, performance_key, starts_at, performance.get("ends_at"),
             performance.get("ticket_status", "unknown"), performance.get("price_min"),
             performance.get("price_max"), performance.get("currency", "PLN"),
             performance.get("ticket_url"), json.dumps(performance.get("source_payload", {}), ensure_ascii=False), captured_at),
        )
        performance_count += 1

    conn.execute(
        """INSERT INTO source_snapshots(source_url, entity_type, source_key, captured_at, payload)
           VALUES (?, 'event', ?, ?, ?)""",
        (event["source_url"], source_key, captured_at, json.dumps(event, ensure_ascii=False)),
    )
    return 1, performance_count


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--db", type=Path, default=DEFAULT_DB)
    parser.add_argument("--reset", action="store_true", help="delete existing catalogue rows before import")
    args = parser.parse_args()

    payload = json.loads(args.input.read_text(encoding="utf-8"))
    args.db.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(args.db)
    conn.execute("PRAGMA foreign_keys = ON")
    conn.executescript(SCHEMA.read_text(encoding="utf-8"))
    # Tiny in-place migration for databases created by the first schema draft.
    event_columns = {row[1] for row in conn.execute("PRAGMA table_info(events)")}
    if "source_category" not in event_columns:
        conn.execute("ALTER TABLE events ADD COLUMN source_category TEXT")

    try:
        with conn:
            if args.reset:
                for table in (
                    "source_snapshots", "event_accessibility", "event_moods", "event_audiences",
                    "event_series", "event_works", "event_artists", "performances",
                    "event_translations", "events", "work_translations", "works",
                    "artist_translations", "artists", "series_translations", "series", "venues",
                ):
                    conn.execute(f"DELETE FROM {table}")
            total_events = 0
            total_performances = 0
            for event in payload.get("events", []):
                events_added, performances_added = load_event(conn, event, payload.get("captured_at", ""))
                total_events += events_added
                total_performances += performances_added
    finally:
        conn.close()

    print(f"Loaded {total_events} events / {total_performances} performances into {args.db}")


if __name__ == "__main__":
    main()
