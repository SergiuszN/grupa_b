#!/usr/bin/env python3
"""Polite, stdlib-only scraper for the public Filharmonia Szczecin repertoire.

Usage: python3 parser/scrape_filharmonia.py --output data/filharmonia_events.json

Sources (all public, the same ones the website's own JavaScript uses):
- monthly calendar boxes (``update_box_fs_calendar_next.php``) — every event and date,
- event pages in PL/EN/DE — description, artists, programme, hall, duration,
- ticket popup (``update_box_indexpopup.php``) — prices, ticket links and sale notes,
- artist/ensemble pages in PL/EN/DE — photo and biography,
- series pages — series description and image,
- the accessibility statement — building-level accessibility facts.

The output is a reviewable demo dataset, not a production sync with the ticketing system.
"""

from __future__ import annotations

import argparse
import hashlib
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
USER_AGENT = "FilharmoniaSzczecinHackathonDemo/0.2 (public event catalogue scraper)"
CALENDAR_URL = BASE_URL + "/update_box_fs_calendar_next.php?lang=pl&y={y}&m={m}"
TICKETS_URL = BASE_URL + "/update_box_indexpopup.php?lang=pl&event_id={id}"
ACCESSIBILITY_URL = BASE_URL + "/deklaracja_dostepnosci"
LANGUAGES = ("pl", "en", "de")
# Building address used to decide whether building-level accessibility facts apply.
MAIN_BUILDING_STREET = "Małopolska 48"

EVENT_ID_RE = re.compile(r"/(?:wydarzenia|events|events_de)/(\d+)")
PERSON_RE = re.compile(r"/(ludzie|people|leute)/(\d+)")
GROUP_RE = re.compile(r"/(grupy|groups|gruppen)/(\d+)")
SERIES_RE = re.compile(r"/(?:cykl|series|konzertreihen)/(\d+)")
CSS_URL_RE = re.compile(r"url\(['\"]?([^'\")]+)['\"]?\)")
VOID_TAGS = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}
BLOCK_TAGS = {"div", "p", "ul", "ol", "li", "h1", "h2", "h3", "h4", "table", "tr", "section", "article"}
ENSEMBLE_WORDS = ("orkiestr", "orchestra", "zespół", "ensemble", "kwartet", "quartet", "kwintet", "trio", "chór", "choir", "band", "big band", "consort")


# --------------------------------------------------------------------------- HTML tree


class Node:
    __slots__ = ("tag", "attrs", "children", "parent")

    def __init__(self, tag: str, attrs: dict[str, str], parent: Node | None) -> None:
        self.tag = tag
        self.attrs = attrs
        self.children: list[Node | str] = []
        self.parent = parent

    @property
    def classes(self) -> list[str]:
        return self.attrs.get("class", "").split()

    def iter(self):
        for child in self.children:
            if isinstance(child, Node):
                yield child
                yield from child.iter()

    def find_all(self, tag: str | None = None, cls: str | None = None, **attrs: str) -> list[Node]:
        return [
            node for node in self.iter()
            if (tag is None or node.tag == tag)
            and (cls is None or cls in node.classes)
            and all(node.attrs.get(key) == value for key, value in attrs.items())
        ]

    def find(self, tag: str | None = None, cls: str | None = None, **attrs: str) -> Node | None:
        return next(iter(self.find_all(tag, cls, **attrs)), None)

    def text(self) -> str:
        """Readable text: <br> become line breaks, block elements become paragraphs."""
        parts: list[str] = []

        def walk(node: Node) -> None:
            for child in node.children:
                if isinstance(child, str):
                    parts.append(child)
                elif child.tag == "br":
                    parts.append("\n")
                elif child.tag in {"script", "style", "iframe", "svg", "noscript"}:
                    continue
                else:
                    if child.tag in BLOCK_TAGS:
                        parts.append("\n\n")
                    walk(child)
                    if child.tag in BLOCK_TAGS:
                        parts.append("\n\n")

        walk(self)
        return clean_text("".join(parts))


class TreeBuilder(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.root = Node("#root", {}, None)
        self.current = self.root

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        node = Node(tag, {key: value or "" for key, value in attrs}, self.current)
        self.current.children.append(node)
        if tag not in VOID_TAGS:
            self.current = node

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        # The site uses `<div ... />`; treat every self-closed tag as empty.
        self.current.children.append(Node(tag, {key: value or "" for key, value in attrs}, self.current))

    def handle_endtag(self, tag: str) -> None:
        node = self.current
        while node is not None and node.tag != tag:
            node = node.parent
        if node is not None and node.parent is not None:
            self.current = node.parent

    def handle_data(self, data: str) -> None:
        self.current.children.append(data)


def parse_html(markup: str) -> Node:
    builder = TreeBuilder()
    builder.feed(markup)
    builder.close()
    return builder.root


def clean_text(value: str) -> str:
    value = value.replace("\xa0", " ").replace("\r", "")
    value = re.sub(r"[ \t\f\v]+", " ", value)
    value = re.sub(r" *\n *", "\n", value)
    value = re.sub(r"\n{3,}", "\n\n", value)
    return value.strip()


def text_of(node: Node | None) -> str | None:
    return (node.text() or None) if node is not None else None


def absolute_url(href: str | None) -> str | None:
    if not href:
        return None
    url = urljoin(BASE_URL + "/", href.strip())
    parsed = urlparse(url)
    return parsed._replace(path=re.sub(r"/{2,}", "/", parsed.path)).geturl()


def css_image(node: Node | None) -> str | None:
    if node is None:
        return None
    match = CSS_URL_RE.search(node.attrs.get("style", ""))
    return absolute_url(match.group(1)) if match else None


def alternates(root: Node) -> dict[str, str]:
    found = {}
    for link in root.find_all("link"):
        lang = link.attrs.get("hreflang", "")[:2].lower()
        if "alternate" in link.attrs.get("rel", "").split() and lang in LANGUAGES and link.attrs.get("href"):
            found[lang] = absolute_url(link.attrs["href"])
    return found


def jsonld_events(root: Node) -> list[dict]:
    found: list[dict] = []

    def visit(value: object) -> None:
        if isinstance(value, list):
            for item in value:
                visit(item)
        elif isinstance(value, dict):
            types = value.get("@type")
            types = types if isinstance(types, list) else [types]
            if any(item in {"Event", "MusicEvent", "ExhibitionEvent", "EducationEvent"} for item in types):
                found.append(value)
            if value.get("@graph"):
                visit(value["@graph"])

    for script in root.find_all("script"):
        if "ld+json" not in script.attrs.get("type", "").lower():
            continue
        try:
            visit(json.loads("".join(child for child in script.children if isinstance(child, str))))
        except (json.JSONDecodeError, TypeError):
            continue
    return found


# --------------------------------------------------------------------------- HTTP


class Fetcher:
    def __init__(self, delay: float, cache_dir: Path | None) -> None:
        self.delay = delay
        self.cache_dir = cache_dir
        self.requests = 0
        self.errors: list[dict[str, str]] = []
        self._last = 0.0

    def get(self, url: str) -> str | None:
        cache_file = None
        if self.cache_dir:
            cache_file = self.cache_dir / (hashlib.sha1(url.encode()).hexdigest() + ".html")
            if cache_file.exists():
                return cache_file.read_text(encoding="utf-8")
        wait = self._last + self.delay - time.monotonic()
        if wait > 0:
            time.sleep(wait)
        try:
            request = Request(url, headers={"User-Agent": USER_AGENT, "Accept": "text/html"})
            with urlopen(request, timeout=25) as response:
                charset = response.headers.get_content_charset() or "utf-8"
                body = response.read().decode(charset, errors="replace")
        except (HTTPError, URLError, TimeoutError) as exc:
            self.errors.append({"url": url, "error": str(exc)})
            return None
        finally:
            self._last = time.monotonic()
            self.requests += 1
        if cache_file:
            cache_file.parent.mkdir(parents=True, exist_ok=True)
            cache_file.write_text(body, encoding="utf-8")
        return body

    def tree(self, url: str) -> Node | None:
        body = self.get(url)
        return parse_html(body) if body else None


# --------------------------------------------------------------------------- calendar


def parse_calendar(root: Node) -> list[dict]:
    images = {
        node.attrs.get("data-dateid"): css_image(node)
        for node in root.find_all("div", cls="event_promo_image")
    }
    cards = []
    for node in root.find_all("div", cls="event"):
        if not node.attrs.get("id", "").startswith("fs_calendar_event_"):
            continue
        classes = node.classes
        filters = [cls.removeprefix("fs_matches_event_filter_") for cls in classes if cls.startswith("fs_matches_event_filter_")]
        type_ids = [cls.removeprefix("fs_event_type") for cls in classes if cls.startswith("fs_event_type")]
        link = node.find("a")
        card = {
            "date_id": node.attrs.get("data-dateid"),
            "external": "event_ext" in classes,
            "filter": filters[0] if filters else None,
            "type_id": type_ids[0] if type_ids else None,
            "href": absolute_url(link.attrs.get("href")) if link else None,
            "title": text_of(link),
            "image_url": images.get(node.attrs.get("data-dateid")),
        }
        time_node = node.find("time")
        if time_node is not None:
            card["starts_at"] = time_node.attrs.get("datetime")
            info = node.find("div", cls="info")
            card["series_label"] = text_of(info.find("span", cls="period")) if info else None
            card["offer"] = text_of(info.find("span", cls="offer")) if info else None
            card["recipients"] = text_of(info.find("span", cls="recipients")) if info else None
        else:
            # External (non-Filharmonia) concerts: "04 PAŹ, nd, 19:00 - <a>title</a><span>label</span>".
            card["starts_at"] = None
            card["raw_when"] = text_of(node)
            label = node.find("span")
            card["offer"] = text_of(label)
            card["series_label"] = card["recipients"] = None
        cards.append(card)
    return cards


def calendar_months(start: date, months: int):
    year, month = start.year, start.month
    for _ in range(months):
        yield year, month
        month += 1
        if month == 13:
            year, month = year + 1, 1


EXTERNAL_WHEN_RE = re.compile(r"(\d{1,2})\s+\S+,\s*\S+,\s*(\d{1,2}):(\d{2})")


def external_start(card: dict, year: int, month: int) -> str | None:
    match = EXTERNAL_WHEN_RE.search(card.get("raw_when") or "")
    if not match:
        return None
    day, hour, minute = (int(group) for group in match.groups())
    local = datetime(year, month, day, hour, minute).astimezone()
    return local.isoformat(timespec="seconds")


# --------------------------------------------------------------------------- event pages


def split_role(label: str) -> tuple[str, str | None]:
    parts = re.split(r"\s+[-–—]\s+", label, maxsplit=1)
    name = parts[0].strip()
    role = parts[1].strip() if len(parts) > 1 else None
    return name, role or None


def artist_key(href: str | None, name: str) -> tuple[str, str | None]:
    path = urlparse(href).path if href else ""
    if match := PERSON_RE.search(path):
        return f"fs:person:{match.group(2)}", "person"
    if match := GROUP_RE.search(path):
        return f"fs:group:{match.group(2)}", "group"
    digest = hashlib.sha1(name.strip().casefold().encode()).hexdigest()[:12]
    return f"fs:name:{digest}", None


def parse_event_page(root: Node) -> dict:
    cover = root.find("div", cls="event_cover_container")
    page: dict = {
        "title": text_of(root.find("h1", cls="title")),
        "offer": None,
        "place": None,
        "starts_at": None,
        "series": [],
        "artists": [],
        "works": [],
        "programme_notes": text_of(root.find("div", cls="programme_description")),
        "description": None,
        "image_url": css_image(root.find("div", cls="event_cover")),
        "playlist_url": None,
        "partners_note": text_of(root.find("div", cls="logos_text")),
        "venue": None,
        "alternates": alternates(root),
        "jsonld": jsonld_events(root),
    }
    if cover is not None:
        page["offer"] = text_of(cover.find("div", cls="offer"))
        page["place"] = text_of(cover.find("div", cls="place"))
        time_node = cover.find("time")
        page["starts_at"] = time_node.attrs.get("datetime") if time_node else None
        for period in cover.find_all("div", cls="period"):
            for link in period.find_all("a"):
                if not text_of(link):
                    continue
                match = SERIES_RE.search(urlparse(absolute_url(link.attrs.get("href"))).path)
                page["series"].append({
                    "source_key": f"fs:series:{match.group(1)}" if match else None,
                    "name": text_of(link),
                    "source_url": absolute_url(link.attrs.get("href")),
                })

    people = root.find("div", cls="programme_people")
    if people is not None:
        for group_index, ul in enumerate(people.find_all("ul")):
            for li in ul.find_all("li"):
                label = text_of(li)
                if not label:
                    continue
                link = li.find("a")
                href = absolute_url(link.attrs.get("href")) if link else None
                name, role = split_role(label)
                key, link_kind = artist_key(href, name)
                page["artists"].append({
                    "key": key, "name": name, "role": role, "group": group_index,
                    "url": href, "link_kind": link_kind,
                })

    programme = root.find("div", cls="programme_programme")
    if programme is not None:
        for li in programme.find_all("li"):
            label = text_of(li)
            if not label:
                continue
            composer, sep, title = label.partition(" - ")
            if not sep:
                composer, sep, title = label.partition(" – ")
            page["works"].append({"composer": composer.strip(), "title": title.strip()} if sep else {"composer": None, "title": label})

    description = root.find("div", cls="description")
    if description is not None:
        page["description"] = description.text() or None
        iframe = description.find("iframe")
        if iframe is not None and "spotify" in iframe.attrs.get("src", ""):
            page["playlist_url"] = iframe.attrs["src"].split("?", 1)[0].replace("/embed/", "/")

    place = root.find("div", cls="place_details")
    if place is not None:
        hall = text_of(place.find("b"))
        lines = [line.strip() for line in (text_of(place) or "").split("\n") if line.strip()]
        if hall and lines and lines[0].startswith(hall):
            lines[0] = lines[0][len(hall):].strip()
            lines = [line for line in lines if line]
        postal = next((line for line in lines if re.match(r"\d{2}-\d{3}\b", line)), None)
        street = next((line for line in lines if re.match(r"(ul\.|al\.|pl\.)", line, re.I)), None)
        seatplan = place.find("img", cls="seatplan")
        page["venue"] = {
            "hall": hall,
            "organisation": lines[0] if lines else None,
            "street": re.sub(r"^(ul\.|al\.|pl\.)\s*", "", street, flags=re.I) if street else None,
            "postal_code": postal.split()[0] if postal else None,
            "city": " ".join(postal.split()[1:]) if postal else None,
            "seatplan_url": absolute_url(seatplan.attrs.get("src")) if seatplan else None,
        }
    return page


DURATION_RE = re.compile(r"(?:czas trwania|duration|dauer)[^0-9]{0,60}(\d{2,3})\s*(?:min)", re.I)
INTERMISSION_RE = re.compile(r"(\d{1,2})\s*(?:minut\w*|minutes?|min\.?)\s*(?:przerwy|intermission|pause)|(?:przerw\w*|intermission|pause)\s*(\d{1,2})\s*min", re.I)
NO_INTERMISSION_RE = re.compile(r"bez przerwy|without (?:an )?intermission|no intermission|ohne pause", re.I)


def parse_duration(*texts: str | None) -> tuple[int | None, bool | None]:
    joined = "\n".join(text for text in texts if text)
    duration = DURATION_RE.search(joined)
    has_break = None
    if NO_INTERMISSION_RE.search(joined):
        has_break = False
    elif INTERMISSION_RE.search(joined):
        has_break = True
    return (int(duration.group(1)) if duration else None, has_break)


# --------------------------------------------------------------------------- audiences / kind


AUDIENCE_RULES = (
    ("children", r"dzieci|dziecka|children|kinder"),
    ("families", r"opiekun|rodzin|famil"),
    ("preschool", r"przedszkol|preschool|kindergarten"),
    ("schools", r"szkół|szkoł|szkoln|uczni|school"),
    ("youth", r"młodzież|youth|jugend"),
    ("teachers", r"nauczyciel|teacher|lehrer"),
    ("seniors", r"senior"),
    ("young-musicians", r"młodych muzyk|young musician"),
    ("adults", r"dorosł|adults?\b|erwachsene"),
    ("beginners", r"nowych słuchaczy|wprowadzając|przewodnik po koncertach|początkując|beginner"),
)
AGE_RANGE_RES = (
    re.compile(r"od\s+(\d{1,2})\.?\s*(?:roku życia\s*)?do\s+(\d{1,2})\.?\s*(?:roku|lat)", re.I),
    re.compile(r"(\d{1,2})\s*[-–]\s*(\d{1,2})\s*(?:lat|years|jahre|r\.ż\.)", re.I),
)
AGE_MIN_RES = (
    re.compile(r"(\d{1,2})\s*\+"),
    re.compile(r"od\s+(\d{1,2})\.?\s*(?:roku życia|lat)", re.I),
)


def parse_audience(*texts: str | None) -> tuple[list[str], int | None, int | None]:
    joined = " ".join(text for text in texts if text)
    slugs = [slug for slug, pattern in AUDIENCE_RULES if re.search(pattern, joined, re.I)]
    for pattern in AGE_RANGE_RES:
        if match := pattern.search(joined):
            low, high = int(match.group(1)), int(match.group(2))
            return slugs, min(low, high), max(low, high)
    for pattern in AGE_MIN_RES:
        if match := pattern.search(joined):
            return slugs, int(match.group(1)), None
    return slugs, None, None


def kind_for(card: dict, offer: str | None) -> str:
    label = (offer or card.get("offer") or "").casefold()
    if card.get("external"):
        return "external"
    if card.get("filter") == "exhibitions" or "wystaw" in label or "wernisaż" in label:
        return "exhibition"
    if "zwiedz" in label:
        return "tour"
    if card.get("filter") == "edu" or any(word in label for word in ("warsztat", "spektakl", "dla dzieci")):
        return "education"
    if "festiwal" in label:
        return "festival"
    if "jazz" in label:
        return "jazz"
    if "symfon" in label:
        return "symphonic"
    if "kameral" in label:
        return "chamber"
    if "koncert" in label or "recital" in label:
        return "concert"
    return "other"


# --------------------------------------------------------------------------- tickets


PRICE_RE = re.compile(r"(\d+(?:[.,]\d{1,2})?)\s*zł")


def parse_price(cell: str) -> float | None:
    match = PRICE_RE.search(cell)
    return float(match.group(1).replace(",", ".")) if match else None


def parse_tickets(root: Node) -> dict[str, dict]:
    """Return ticket info keyed by performance start (ISO string)."""
    result: dict[str, dict] = {}
    for box in root.find_all("div", cls="cashbox_event"):
        time_node = box.find("time")
        if time_node is None or not time_node.attrs.get("datetime"):
            continue
        links = [
            {"label": text_of(link), "url": absolute_url(link.attrs.get("href"))}
            for link in box.find_all("a") if link.attrs.get("href")
        ]
        prices = []
        table = box.find("table")
        if table is not None:
            rows = table.find_all("tr")
            header = [text_of(td) or "" for td in rows[0].find_all("td")] if rows else []
            for row in rows[1:]:
                cells = [text_of(td) or "" for td in row.find_all("td")]
                if not cells:
                    continue
                entry = {"zone": cells[0] or None, "prices": {}}
                for label, cell in zip(header[1:], cells[1:]):
                    price = parse_price(cell)
                    if price is not None:
                        entry["prices"][label.casefold()] = {
                            "amount": price,
                            "note": clean_text(PRICE_RE.sub("", cell)).strip("() ") or None,
                        }
                if entry["prices"]:
                    prices.append(entry)
        for node in [table, time_node]:
            if node is not None and node.parent is not None:
                node.parent.children.remove(node)
        notes = text_of(box)
        notes = clean_text(re.sub(r"\b(BILETY|ABONAMENT|WYPEŁNIJ FORMULARZ REZERWACJI)\b", "", notes or "")) or None
        amounts = [price["amount"] for entry in prices for price in entry["prices"].values()]
        result[time_node.attrs["datetime"]] = {
            "ticket_url": next((link["url"] for link in links if "bilety.filharmonia" in (link["url"] or "") and "rezerwacja" in (link["url"] or "")), None),
            "registration_url": next((link["url"] for link in links if "forms." in (link["url"] or "") or "formularz" in (link["label"] or "").casefold()), None),
            "prices": prices,
            "price_min": min(amounts) if amounts else None,
            "price_max": max(amounts) if amounts else None,
            "notes": notes,
        }
    return result


def ticket_status(info: dict | None, event_status: str | None) -> str:
    if event_status and "cancel" in event_status.casefold():
        return "cancelled"
    if not info:
        return "unknown"
    notes = (info.get("notes") or "").casefold()
    if any(word in notes for word in ("wyprzedan", "brak biletów", "brak miejsc", "sold out")):
        return "sold_out"
    if "ostatnie miejsca" in notes or "ostatnie bilety" in notes:
        return "last_seats"
    if info.get("ticket_url"):
        return "available"
    if info.get("registration_url") or any(word in notes for word in ("zapisy", "rejestrac", "zgłosze")):
        return "registration_required"
    if "wstęp wolny" in notes or "bezpłatn" in notes or "wstęp darmowy" in notes:
        return "free"
    if "sprzedaż od" in notes:
        return "not_yet_on_sale"
    if info.get("prices"):
        return "box_office"
    return "unknown"


# --------------------------------------------------------------------------- artists, series, accessibility


def parse_artist_page(root: Node) -> dict:
    container = root.find("div", cls="text_container")
    photo = container.find("img", cls="person_photo") if container else None
    credit = None
    biography = None
    if container is not None:
        hr = container.find("hr")
        if hr is not None:
            siblings = hr.parent.children
            tail = siblings[siblings.index(hr) + 1:]
            credit = clean_text("".join(item if isinstance(item, str) else item.text() for item in tail)) or None
            del siblings[siblings.index(hr):]
        biography = re.sub(r"\(\s*\.\.\.\s*czytaj więcej\s*\)\.?$", "", container.text()).strip() or None
    title = root.find("h1", cls="f__page_title")
    return {
        "name": text_of(title),
        "image_url": absolute_url(photo.attrs.get("src")) if photo else css_image(root.find("div", cls="people_group_cover")),
        "image_credit": credit,
        "biography": biography,
        "alternates": alternates(root),
    }


def parse_series_page(root: Node) -> dict:
    return {
        "name": text_of(root.find("h1", cls="news_title")),
        "description": text_of(root.find("div", cls="news_text_more")),
        "image_url": css_image(root.find("div", cls="period_image_tile")),
        "alternates": alternates(root),
    }


def sentences(text: str, pattern: str) -> str | None:
    found = [s.strip() for s in re.split(r"(?<=[.!?])\s+|\n+", text) if re.search(pattern, s, re.I)]
    return " ".join(dict.fromkeys(found)) or None


def parse_accessibility(root: Node | None) -> dict:
    """Building-level facts from the official accessibility statement, quoted verbatim."""
    if root is None:
        return {}
    container = root.find("div", cls="site_content_column") or root
    text = container.text()
    return {
        "mobility": {
            "status": "available" if re.search(r"wózk", text, re.I) else "unknown",
            "notes": sentences(text, r"wózk|wind|barier|parking|toalet"),
        },
        "hearing": {
            "status": "available" if re.search(r"pętla indukcyjna", text, re.I) else "unknown",
            "notes": sentences(text, r"pętl|migow"),
        },
        "visual": {
            "status": "partial" if re.search(r"psem przewodnikiem|brajl", text, re.I) else "unknown",
            "notes": sentences(text, r"brajl|tyflo|niewidom|słabowidz|psem|kontrast"),
        },
        "assistance": sentences(text, r"przeszkolon|pomocy|numer telefonu"),
    }


SIGN_LANGUAGE_RE = re.compile(r"\bPJM\b|języku migowym|tłumacz\w* (?:na )?(?:PJM|język migowy)", re.I)
AUDIO_DESCRIPTION_RE = re.compile(r"audiodeskrypc", re.I)
SENSORY_RE = re.compile(r"sensoryczn|relaks\w* koncert|koncert\w* relaks|wyciszon|autyzm|spektrum autyzmu", re.I)


def event_accessibility(event: dict, building: dict, captured_at: str) -> list[dict]:
    venue = event.get("venue") or {}
    in_building = bool(venue.get("street") and MAIN_BUILDING_STREET.split()[0] in venue["street"])
    pl = event["translations"].get("pl", {})
    text = " ".join(filter(None, [pl.get("title"), pl.get("subtitle"), pl.get("description"), pl.get("programme_notes")]))
    rows = []
    for kind in ("mobility", "hearing", "visual", "sensory"):
        row = {"type": kind, "status": "unknown", "notes": None, "source_url": None, "verified_at": None}
        fact = building.get(kind) if in_building else None
        if fact and fact["status"] != "unknown":
            row.update(status=fact["status"], notes=fact["notes"], source_url=ACCESSIBILITY_URL, verified_at=captured_at)
        if kind == "hearing" and SIGN_LANGUAGE_RE.search(text):
            row.update(status="available", source_url=event["source_url"], verified_at=captured_at,
                       notes="Wydarzenie dostępne w polskim języku migowym (PJM). " + (row["notes"] or ""))
        if kind == "visual" and AUDIO_DESCRIPTION_RE.search(text):
            row.update(status="available", source_url=event["source_url"], verified_at=captured_at,
                       notes="Wydarzenie z audiodeskrypcją. " + (row["notes"] or ""))
        if kind == "sensory" and SENSORY_RE.search(text):
            row.update(status="available", source_url=event["source_url"], verified_at=captured_at,
                       notes=sentences(text, SENSORY_RE.pattern))
        row["notes"] = (row["notes"] or "").strip() or None
        rows.append(row)
    return rows


# --------------------------------------------------------------------------- assembly


def build_event(event_id: str, cards: list[dict], fetcher: Fetcher, with_translations: bool) -> dict | None:
    first = cards[0]
    pl_url = first["href"]
    pl_root = fetcher.tree(pl_url)
    if pl_root is None:
        return None
    pages = {"pl": parse_event_page(pl_root)}
    if with_translations:
        for lang in ("en", "de"):
            url = pages["pl"]["alternates"].get(lang)
            root = fetcher.tree(url) if url else None
            if root is not None:
                pages[lang] = parse_event_page(root) | {"url": url}
    pages["pl"]["url"] = pl_url
    pl = pages["pl"]

    jsonld = next(iter(pl["jsonld"]), {})
    event_status = str(jsonld.get("eventStatus") or "") or None
    recipients = next((card["recipients"] for card in cards if card.get("recipients")), None)
    audiences, min_age, max_age = parse_audience(recipients, pl["offer"], pl["title"])
    duration, has_break = parse_duration(pl["programme_notes"], pl["description"])

    translations = {}
    for lang, page in pages.items():
        if not page.get("title"):
            continue
        translations[lang] = {
            "title": page["title"],
            "subtitle": page["offer"],
            "audience_note": recipients if lang == "pl" else None,
            "description": page["description"],
            "programme_notes": page["programme_notes"],
            "partners_note": page["partners_note"],
            "hall": page["place"],
            "source_url": page["url"],
        }

    artists = []
    for position, person in enumerate(pl["artists"]):
        roles = {"pl": person["role"]}
        for lang in ("en", "de"):
            other = pages.get(lang, {}).get("artists") or []
            match = next((item for item in other if item["key"] == person["key"]), None)
            if match is None and len(other) == len(pl["artists"]):
                match = other[position]
            if match:
                roles[lang] = match["role"]
        artists.append({**person, "roles": roles, "position": position})

    works = []
    for position, work in enumerate(pl["works"]):
        titles = {"pl": work["title"]}
        for lang in ("en", "de"):
            other = pages.get(lang, {}).get("works") or []
            if len(other) == len(pl["works"]):
                titles[lang] = other[position]["title"]
        works.append({"composer": work["composer"], "title": work["title"], "titles": titles, "position": position})

    series = []
    for position, item in enumerate(pl["series"]):
        names = {"pl": item["name"]}
        for lang in ("en", "de"):
            other = pages.get(lang, {}).get("series") or []
            match = next((entry for entry in other if entry["source_key"] == item["source_key"]), None)
            if match:
                names[lang] = match["name"]
        series.append({**item, "names": names})
    if not series:
        for card in cards:
            if card.get("series_label"):
                series.append({"source_key": None, "name": card["series_label"], "names": {"pl": card["series_label"]}, "source_url": None})
                break

    tickets_root = fetcher.tree(TICKETS_URL.format(id=event_id))
    tickets = parse_tickets(tickets_root) if tickets_root is not None else {}

    performances = []
    for card in sorted(cards, key=lambda item: item["starts_at"]):
        info = tickets.get(card["starts_at"])
        performances.append({
            "starts_at": card["starts_at"],
            "ends_at": None,
            "calendar_date_id": card.get("date_id"),
            "ticket_status": ticket_status(info, event_status),
            "price_min": (info or {}).get("price_min"),
            "price_max": (info or {}).get("price_max"),
            "prices": (info or {}).get("prices") or [],
            "currency": "PLN",
            "ticket_url": (info or {}).get("ticket_url") or (info or {}).get("registration_url"),
            "ticket_notes": (info or {}).get("notes"),
        })

    venue = pl["venue"] or {}
    if pl["place"] and not venue.get("hall"):
        venue["hall"] = pl["place"]
    if venue.get("hall") and not venue.get("street"):
        # Galleries, foyer and hall pages omit the address block, but they are rooms of the main building.
        venue.update(organisation="Filharmonia im. Mieczysława Karłowicza w Szczecinie", street=MAIN_BUILDING_STREET,
                     postal_code="70-515", city="Szczecin")
    return {
        "source_key": f"fs:{event_id}",
        "source_id": int(event_id),
        "source_url": pl_url,
        "kind": kind_for(first, pl["offer"]),
        "calendar_filter": first.get("filter"),
        "calendar_type_id": first.get("type_id"),
        "category_labels": list(dict.fromkeys(filter(None, [pl["offer"]] + [card.get("offer") for card in cards]))),
        "event_status": event_status,
        "image_url": pl["image_url"] or first.get("image_url") or absolute_url(jsonld.get("image") if isinstance(jsonld.get("image"), str) else None),
        "playlist_url": pl["playlist_url"],
        "duration_minutes": duration,
        "has_intermission": has_break,
        "min_age": min_age,
        "max_age": max_age,
        "audiences": audiences,
        "venue": venue,
        "series": series,
        "translations": translations,
        "artists": artists,
        "works": works,
        "performances": performances,
        "source_payload": {"jsonld": pl["jsonld"]},
    }


def build_external(card: dict) -> dict:
    digest = card.get("date_id") or hashlib.sha1((card.get("title") or "").encode()).hexdigest()[:12]
    return {
        "source_key": f"fs:ext:{digest}",
        "source_id": None,
        "source_url": card.get("href") or BASE_URL,
        "kind": "external",
        "calendar_filter": card.get("filter"),
        "calendar_type_id": None,
        "category_labels": [card["offer"]] if card.get("offer") else [],
        "event_status": None,
        "image_url": None,
        "playlist_url": None,
        "duration_minutes": None,
        "has_intermission": None,
        "min_age": None,
        "max_age": None,
        "audiences": [],
        "venue": {},
        "series": [],
        "translations": {"pl": {"title": card.get("title") or "Koncert zewnętrzny", "subtitle": card.get("offer"), "source_url": card.get("href")}},
        "artists": [],
        "works": [],
        "performances": [{
            "starts_at": card["starts_at"], "ends_at": None, "calendar_date_id": card.get("date_id"),
            "ticket_status": "unknown", "price_min": None, "price_max": None, "prices": [],
            "currency": "PLN", "ticket_url": None, "ticket_notes": None,
        }],
        "source_payload": {"calendar_card": card},
    }


def unify_artist_keys(events: list[dict]) -> None:
    """The same person is sometimes linked to their page and sometimes not; prefer the linked identity."""
    linked = {}
    for event in events:
        for person in event["artists"]:
            if person["link_kind"]:
                linked.setdefault(person["name"].casefold(), person)
    for event in events:
        for person in event["artists"]:
            match = linked.get(person["name"].casefold())
            if not person["link_kind"] and match:
                person.update(key=match["key"], url=match["url"], link_kind=match["link_kind"])


def collect_artists(events: list[dict], fetcher: Fetcher, with_translations: bool) -> dict[str, dict]:
    unify_artist_keys(events)
    artists: dict[str, dict] = {}
    for event in events:
        for person in event["artists"]:
            if person["key"] in artists:
                continue
            name = person["name"]
            lowered = name.casefold()
            artist_type = "person"
            if person["link_kind"] == "group" or any(word in lowered for word in ENSEMBLE_WORDS):
                artist_type = "orchestra" if "orkiestr" in lowered or "orchestra" in lowered else "ensemble"
            artists[person["key"]] = {
                "source_key": person["key"], "display_name": name, "artist_type": artist_type,
                "image_url": None, "image_credit": None, "source_url": person["url"], "biography": {},
            }
    for artist in artists.values():
        url = artist["source_url"]
        if not url:
            continue
        root = fetcher.tree(url)
        if root is None:
            continue
        page = parse_artist_page(root)
        artist.update(image_url=page["image_url"], image_credit=page["image_credit"])
        artist["source_url"] = page["alternates"].get("pl", url)
        if page["biography"]:
            artist["biography"]["pl"] = page["biography"]
        if not with_translations:
            continue
        for lang in ("en", "de"):
            alt = page["alternates"].get(lang)
            alt_root = fetcher.tree(alt) if alt else None
            if alt_root is not None:
                bio = parse_artist_page(alt_root)["biography"]
                if bio:
                    artist["biography"][lang] = bio
    return artists


def collect_series(events: list[dict], fetcher: Fetcher, with_translations: bool) -> dict[str, dict]:
    series: dict[str, dict] = {}
    for event in events:
        for item in event["series"]:
            key = item["source_key"] or "fs:series-label:" + hashlib.sha1(item["name"].casefold().encode()).hexdigest()[:12]
            item["source_key"] = key
            entry = series.setdefault(key, {"source_key": key, "source_url": item["source_url"], "names": {}, "descriptions": {}, "image_url": None})
            entry["names"].update({lang: name for lang, name in item["names"].items() if name})
            season = re.search(r"(20\d{2}/20\d{2})", item["name"] or "")
            entry["season"] = season.group(1) if season else None
    for entry in series.values():
        if not entry["source_url"]:
            continue
        root = fetcher.tree(entry["source_url"])
        if root is None:
            continue
        page = parse_series_page(root)
        entry["image_url"] = page["image_url"]
        if page["description"]:
            entry["descriptions"]["pl"] = page["description"]
        if not with_translations:
            continue
        for lang in ("en", "de"):
            alt = page["alternates"].get(lang)
            alt_root = fetcher.tree(alt) if alt else None
            if alt_root is not None:
                alt_page = parse_series_page(alt_root)
                if alt_page["description"]:
                    entry["descriptions"][lang] = alt_page["description"]
                if alt_page["name"]:
                    entry["names"].setdefault(lang, alt_page["name"])
    return series


def main() -> None:
    cli = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    cli.add_argument("--output", type=Path, default=Path("data/filharmonia_events.json"))
    cli.add_argument("--from-date", default=datetime.now().astimezone().isoformat(timespec="seconds"),
                     help="keep performances on/after this ISO date/time; pass an empty string to include the whole first month")
    cli.add_argument("--months", type=int, default=12, help="how many calendar months to read (stops early after two empty months)")
    cli.add_argument("--limit", type=int, default=0, help="maximum number of events to fetch in detail (0 = all)")
    cli.add_argument("--delay", type=float, default=0.5, help="minimum seconds between requests")
    cli.add_argument("--cache-dir", type=Path, help="store raw responses here and reuse them on the next run")
    cli.add_argument("--no-translations", action="store_true", help="do not fetch EN/DE pages")
    cli.add_argument("--no-artists", action="store_true", help="do not fetch artist pages (photos, biographies)")
    args = cli.parse_args()

    fetcher = Fetcher(args.delay, args.cache_dir)
    robots = fetcher.get(BASE_URL + "/robots.txt")
    if robots is None:
        raise SystemExit("Could not check robots.txt; refusing to scrape.")
    if re.search(r"(?im)^\s*Disallow:\s*/\s*$", robots):
        raise SystemExit("Scraping stopped: robots.txt disallows crawling the site.")

    cutoff = datetime.fromisoformat(args.from_date) if args.from_date else None
    if cutoff and cutoff.tzinfo is None:
        cutoff = cutoff.astimezone()
    start = cutoff.date() if cutoff else date.today()

    cards_by_event: dict[str, list[dict]] = {}
    external_cards: list[dict] = []
    empty_months = 0
    for year, month in calendar_months(start, args.months):
        root = fetcher.tree(CALENDAR_URL.format(y=year, m=month))
        cards = parse_calendar(root) if root is not None else []
        empty_months = 0 if cards else empty_months + 1
        if empty_months >= 2:
            break
        for card in cards:
            if card["external"]:
                card["starts_at"] = external_start(card, year, month)
            if not card["starts_at"]:
                continue
            if cutoff and datetime.fromisoformat(card["starts_at"]) < cutoff:
                continue
            match = EVENT_ID_RE.search(urlparse(card["href"] or "").path)
            if match and not card["external"]:
                bucket = cards_by_event.setdefault(match.group(1), [])
                if all(item["starts_at"] != card["starts_at"] for item in bucket):
                    bucket.append(card)
            elif card["external"]:
                external_cards.append(card)
    print(f"Calendar: {len(cards_by_event)} events, {sum(map(len, cards_by_event.values()))} dates, {len(external_cards)} external concerts.")

    with_translations = not args.no_translations
    captured_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    event_ids = sorted(cards_by_event, key=lambda key: min(card["starts_at"] for card in cards_by_event[key]))
    if args.limit:
        event_ids = event_ids[: args.limit]
    events = []
    for index, event_id in enumerate(event_ids, 1):
        event = build_event(event_id, cards_by_event[event_id], fetcher, with_translations)
        if event:
            events.append(event)
        print(f"  [{index}/{len(event_ids)}] {event_id} {(event or {}).get('translations', {}).get('pl', {}).get('title', 'ERROR')}")
    events.extend(build_external(card) for card in external_cards)

    building = parse_accessibility(fetcher.tree(ACCESSIBILITY_URL))
    for event in events:
        event["accessibility"] = event_accessibility(event, building, captured_at)

    artists = collect_artists(events, fetcher, with_translations) if not args.no_artists else {}
    series = collect_series(events, fetcher, with_translations)
    events.sort(key=lambda item: (item["performances"][0]["starts_at"], item["source_key"]))

    output = {
        "source": BASE_URL,
        "captured_at": captured_at,
        "note": "Public event information scraped for a hackathon demo. Verify prices, availability and accessibility with the official source before presenting as live facts.",
        "requests": fetcher.requests,
        "errors": fetcher.errors,
        "building_accessibility": building | {"source_url": ACCESSIBILITY_URL},
        "events": events,
        "artists": list(artists.values()),
        "series": list(series.values()),
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    performance_count = sum(len(item["performances"]) for item in events)
    print(f"Saved {len(events)} events / {performance_count} performances / {len(artists)} artists / {len(series)} series "
          f"to {args.output} ({fetcher.requests} requests, {len(fetcher.errors)} errors).")


if __name__ == "__main__":
    main()
