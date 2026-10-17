#!/usr/bin/env python3
"""Polite, stdlib-only scraper for public Filharmonia Szczecin event pages.

Usage: python3 scripts/scrape_filharmonia.py --limit 30 --output data/filharmonia_events.json
The output is a reviewable demo dataset, not a production sync with the ticketing system.
"""

from __future__ import annotations

import argparse
import html
import json
import re
import time
from datetime import date, datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen

BASE_URL = "https://filharmonia.szczecin.pl"
HOME_URL = f"{BASE_URL}/pl"
USER_AGENT = "FilharmoniaSzczecinHackathonDemo/0.1 (public event catalogue scraper)"
EVENT_PATH_RE = re.compile(r"^/(?:wydarzenia|events|events_de)/")
SOURCE_ID_RE = re.compile(r"/(?:wydarzenia|events(?:_de)?)/(\d+)-")


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.event_links: set[str] = set()
        self.alternates: dict[str, str] = {}
        self.jsonld: list[str] = []
        self._in_jsonld = False
        self._jsonld_parts: list[str] = []
        self.calendar_cards: list[dict] = []
        self._calendar_card: dict | None = None
        self._calendar_depth = 0
        self._calendar_capture: tuple[str, str] | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attrs_dict = dict(attrs)
        card_id = attrs_dict.get("id") or ""
        if tag == "div" and card_id.startswith("fs_calendar_event_") and "promo_image" not in card_id:
            self._calendar_card = {"href": None, "offer": "", "period": "", "starts_at": None}
            self._calendar_depth = 1
        elif self._calendar_card is not None and tag == "div":
            self._calendar_depth += 1
        if tag == "a":
            href = attrs_dict.get("href")
            if href:
                absolute = urljoin(BASE_URL, href)
                if EVENT_PATH_RE.match(urlparse(absolute).path):
                    self.event_links.add(absolute.split("#", 1)[0])
                    if self._calendar_card is not None and urlparse(absolute).path.startswith("/wydarzenia/"):
                        self._calendar_card["href"] = absolute.split("#", 1)[0]
        elif tag == "link" and "alternate" in (attrs_dict.get("rel") or "").split():
            href = attrs_dict.get("href")
            lang = attrs_dict.get("hreflang")
            if href and lang and lang[:2].lower() in {"pl", "en", "de"}:
                self.alternates[lang[:2].lower()] = urljoin(BASE_URL, href)
        elif tag == "script" and "ld+json" in (attrs_dict.get("type") or "").lower():
            self._in_jsonld = True
            self._jsonld_parts = []
        if self._calendar_card is not None:
            if tag == "time" and attrs_dict.get("datetime"):
                self._calendar_card["starts_at"] = attrs_dict["datetime"]
            classes = (attrs_dict.get("class") or "").split()
            if tag == "span" and "offer" in classes:
                self._calendar_capture = ("offer", tag)
            elif tag == "span" and "period" in classes:
                self._calendar_capture = ("period", tag)

    def handle_data(self, data: str) -> None:
        if self._in_jsonld:
            self._jsonld_parts.append(data)
        if self._calendar_card is not None and self._calendar_capture:
            field = self._calendar_capture[0]
            self._calendar_card[field] += data

    def handle_endtag(self, tag: str) -> None:
        if self._calendar_capture and self._calendar_capture[1] == tag:
            self._calendar_capture = None
        if self._calendar_card is not None and tag == "div":
            self._calendar_depth -= 1
            if self._calendar_depth == 0:
                self.calendar_cards.append({key: value.strip() if isinstance(value, str) else value for key, value in self._calendar_card.items()})
                self._calendar_card = None
        if tag == "script" and self._in_jsonld:
            self.jsonld.append("".join(self._jsonld_parts).strip())
            self._in_jsonld = False
            self._jsonld_parts = []


def fetch(url: str) -> str:
    request = Request(url, headers={"User-Agent": USER_AGENT, "Accept": "text/html"})
    with urlopen(request, timeout=25) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        return response.read().decode(charset, errors="replace")


def structured_events(parser: PageParser) -> list[dict]:
    found: list[dict] = []

    def visit(value: object) -> None:
        if isinstance(value, list):
            for item in value:
                visit(item)
        elif isinstance(value, dict):
            types = as_list(value.get("@type"))
            if any(item in {"Event", "MusicEvent", "ExhibitionEvent", "EducationEvent"} for item in types):
                found.append(value)
            graph = value.get("@graph")
            if graph:
                visit(graph)

    for raw in parser.jsonld:
        try:
            visit(json.loads(raw))
        except (json.JSONDecodeError, TypeError):
            continue
    return found


def as_list(value: object) -> list:
    if value is None:
        return []
    return value if isinstance(value, list) else [value]


def name_of(value: object) -> str | None:
    if isinstance(value, str):
        return html.unescape(value).strip() or None
    if isinstance(value, dict):
        name = value.get("name")
        return html.unescape(str(name)).strip() if name else None
    return None


def image_of(value: object) -> str | None:
    if isinstance(value, str):
        return value
    if isinstance(value, list):
        return next((image_of(item) for item in value if image_of(item)), None)
    if isinstance(value, dict):
        return value.get("url") or value.get("contentUrl")
    return None


def event_key(page_url: str) -> str:
    match = SOURCE_ID_RE.search(urlparse(page_url).path)
    if match:
        return f"fs:{match.group(1)}"
    return f"fs:{urlparse(page_url).path.strip('/')}"


def event_language(page_url: str) -> str:
    path = urlparse(page_url).path
    if path.startswith("/events_de/"):
        return "de"
    if path.startswith("/events/"):
        return "en"
    return "pl"


def kind_for_label(label: str) -> str:
    value = label.casefold()
    if "wystaw" in value or "wernisaż" in value:
        return "exhibition"
    if "zwiedz" in value:
        return "tour"
    if "jazz" in value:
        return "jazz"
    if "symfon" in value:
        return "symphonic"
    if "kameral" in value:
        return "chamber"
    if any(word in value for word in ("warsztat", "eduk", "akademia", "spektakl")):
        return "education"
    if "zewnętrz" in value:
        return "external"
    if "koncert" in value:
        return "concert"
    return "other"


def extract_offer(event: dict) -> tuple[float | None, float | None, str | None, str]:
    offers = as_list(event.get("offers"))
    prices = []
    ticket_url = None
    status = "unknown"
    for offer in offers:
        if not isinstance(offer, dict):
            continue
        try:
            if offer.get("price") is not None:
                prices.append(float(offer["price"]))
        except (TypeError, ValueError):
            pass
        ticket_url = ticket_url or offer.get("url")
        availability = str(offer.get("availability", "")).lower()
        if "soldout" in availability or "sold-out" in availability:
            status = "sold_out"
        elif "instock" in availability:
            status = "available"
        elif offer.get("price") == 0 or str(offer.get("price")).lower() == "0.00":
            status = "free"
    return (min(prices) if prices else None, max(prices) if prices else None, ticket_url, status)


def merge_page(dataset: dict[str, dict], page_url: str, parser: PageParser) -> None:
    key = event_key(page_url)
    lang = event_language(page_url)
    records = structured_events(parser)
    if not records:
        return

    event = dataset.setdefault(key, {
        "source_key": key,
        "source_url": page_url,
        "kind": "other",
        "category_labels": [],
        "series_labels": [],
        "image_url": None,
        "translations": {},
        "performers": [],
        "works": [],
        "performances": {},
        "source_payload": {},
    })

    for record in records:
        title = name_of(record.get("name"))
        if title:
            event["translations"][lang] = {
                "title": title,
                "description": html.unescape(str(record.get("description", ""))).strip() or None,
            }
        event["image_url"] = event["image_url"] or image_of(record.get("image"))

        for performer in as_list(record.get("performer")):
            name = name_of(performer)
            if name and name not in event["performers"]:
                event["performers"].append(name)

        for work in as_list(record.get("workPerformed")):
            if not isinstance(work, dict):
                continue
            work_data = {
                "title": name_of(work.get("name")),
                "composer": name_of(work.get("composer")),
            }
            if work_data["title"] and work_data not in event["works"]:
                event["works"].append(work_data)

        start = record.get("startDate")
        if not start:
            continue
        price_min, price_max, ticket_url, ticket_status = extract_offer(record)
        location = as_list(record.get("location"))
        location_name = name_of(location[0]) if location else None
        performance_key = str(start)
        event["performances"].setdefault(performance_key, {
            "starts_at": start,
            "ends_at": record.get("endDate"),
            "venue_name": location_name,
            "ticket_status": ticket_status,
            "price_min": price_min,
            "price_max": price_max,
            "currency": "PLN",
            "ticket_url": ticket_url,
            "source_payload": record,
        })

    # Keep the source's structured records for later verification and re-imports.
    event["source_payload"][lang] = records


def main() -> None:
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("--limit", type=int, default=30, help="maximum number of Polish event pages")
    cli.add_argument("--delay", type=float, default=0.5, help="seconds between requests")
    cli.add_argument("--output", type=Path, default=Path("data/filharmonia_events.json"))
    cli.add_argument("--from-date", default=datetime.now().astimezone().isoformat(timespec="seconds"), help="keep performances on/after this local date/time; pass an empty string to include history")
    cli.add_argument("--no-translations", action="store_true", help="do not fetch EN/DE alternate pages")
    args = cli.parse_args()

    robots_url = f"{BASE_URL}/robots.txt"
    try:
        robots = fetch(robots_url)
        if re.search(r"(?im)^\s*Disallow:\s*/", robots):
            raise SystemExit("Scraping stopped: robots.txt disallows crawling the site.")
    except (HTTPError, URLError, TimeoutError) as exc:
        raise SystemExit(f"Could not check robots.txt ({exc}); refusing to scrape.") from exc

    try:
        home_parser = PageParser()
        home_parser.feed(fetch(HOME_URL))
    except (HTTPError, URLError, TimeoutError) as exc:
        raise SystemExit(f"Could not fetch {HOME_URL}: {exc}") from exc

    pages = sorted(home_parser.event_links)
    # Prefer the Polish canonical page for each published event.
    pages = [url for url in pages if urlparse(url).path.startswith("/wydarzenia/")]
    pages = list(dict.fromkeys(pages))[: max(0, args.limit)]
    dataset: dict[str, dict] = {}
    errors: list[dict[str, str]] = []

    for index, page_url in enumerate(pages):
        try:
            parser = PageParser()
            parser.feed(fetch(page_url))
            merge_page(dataset, page_url, parser)
            if not args.no_translations:
                for lang in ("en", "de"):
                    alternate = parser.alternates.get(lang)
                    if not alternate:
                        continue
                    time.sleep(max(0, args.delay))
                    try:
                        translated_parser = PageParser()
                        translated_parser.feed(fetch(alternate))
                        merge_page(dataset, alternate, translated_parser)
                    except (HTTPError, URLError, TimeoutError) as exc:
                        errors.append({"url": alternate, "error": str(exc)})
        except (HTTPError, URLError, TimeoutError) as exc:
            errors.append({"url": page_url, "error": str(exc)})
        if index + 1 < len(pages):
            time.sleep(max(0, args.delay))

    # The homepage calendar carries official category/series labels not present in JSON-LD.
    for card in home_parser.calendar_cards:
        if not card.get("href"):
            continue
        event = dataset.get(event_key(card["href"]))
        if not event:
            continue
        label = card.get("offer", "").strip()
        if label and label not in event["category_labels"]:
            event["category_labels"].append(label)
            mapped_kind = kind_for_label(label)
            if mapped_kind != "other":
                event["kind"] = mapped_kind
        for series_label in (part.strip() for part in card.get("period", "").split("|")):
            if series_label and series_label not in event["series_labels"]:
                event["series_labels"].append(series_label)

    events = []
    cutoff_datetime = datetime.fromisoformat(args.from_date) if args.from_date else None
    cutoff_date = date.fromisoformat(args.from_date[:10]) if args.from_date and len(args.from_date) == 10 else None
    for event in dataset.values():
        performances = sorted(event["performances"].values(), key=lambda item: item["starts_at"])
        if cutoff_datetime and len(args.from_date) > 10:
            performances = [
                item for item in performances
                if datetime.fromisoformat(item["starts_at"]) >= cutoff_datetime
            ]
        elif cutoff_date:
            performances = [item for item in performances if item["starts_at"][:10] >= cutoff_date.isoformat()]
        if not performances:
            continue
        event["performances"] = performances
        events.append(event)
    events.sort(key=lambda item: (item["performances"][0]["starts_at"] if item["performances"] else "9999", item["source_key"]))

    output = {
        "source": BASE_URL,
        "captured_at": datetime.now(timezone.utc).isoformat(),
        "note": "Public event information scraped for a hackathon demo. Verify prices, availability and accessibility with the official source before presenting as live facts.",
        "pages_requested": len(pages),
        "errors": errors,
        "events": events,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    performance_count = sum(len(item["performances"]) for item in events)
    print(f"Saved {len(events)} events / {performance_count} performances to {args.output} ({len(errors)} page errors).")


if __name__ == "__main__":
    main()
