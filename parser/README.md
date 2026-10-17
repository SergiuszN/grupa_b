# Filharmonia Szczecin — hackathon data starter

Model danych i demonstracyjna baza SQLite przygotowane na podstawie briefu oraz publicznego repertuaru Filharmonii.

## Pliki

- `data/filharmonia.sqlite` — gotowa baza do podpięcia do prototypu.
- `data/filharmonia_events.json` — surowy, sprawdzalny zrzut danych źródłowych.
- `parser/schema.sqlite.sql` — schemat SQLite.
- `parser/schema.postgres.sql` — wariant PostgreSQL, jeśli będzie potrzebny później.
- `parser/scrape_filharmonia.py` — pobiera repertuar z publicznej strony.
- `parser/load_sqlite.py` — ładuje JSON do SQLite.
- `parser/model-danych.md` — opis encji i ograniczeń danych.

## Odświeżenie danych

Wymagany jest Python 3, bez dodatkowych bibliotek:

```bash
python3 parser/scrape_filharmonia.py --output data/filharmonia_events.json
python3 parser/load_sqlite.py --reset
```

Scraper czyta kalendarz miesiąc po miesiącu (domyślnie 12 miesięcy od dziś, `--months`), a dla każdego wydarzenia pobiera stronę PL/EN/DE, popup biletów (ceny, link do kasy, uwagi o sprzedaży), strony artystów (zdjęcie, biogram) i cykli oraz deklarację dostępności budynku. Pełny przebieg to kilkaset zapytań (~5–10 min przy `--delay 0.5`).

Przydatne opcje:

- `--cache-dir /tmp/fs-cache` — zapisuje surowe odpowiedzi i używa ich przy kolejnym uruchomieniu (szybkie iterowanie nad parserem),
- `--limit 5` — tylko pierwsze N wydarzeń (test),
- `--no-translations`, `--no-artists` — pomija strony EN/DE i strony artystów.

`load_sqlite.py --reset` usuwa plik bazy i tworzy go od nowa z aktualnego schematu.

## Szybki test

```bash
python3 - <<'PY'
import sqlite3
conn = sqlite3.connect('data/filharmonia.sqlite')
print(conn.execute('''
  SELECT t.title, p.starts_at, p.ticket_status
  FROM performances p
  JOIN events e ON e.id = p.event_id
  JOIN event_translations t ON t.event_id = e.id AND t.language_code = 'pl'
  ORDER BY p.starts_at LIMIT 10
''').fetchall())
PY
```

Dane są demonstracyjne, nie są synchronizowane z systemem sprzedaży biletów. Ceny i status sprzedaży pochodzą z publicznego popupu biletów w chwili pobrania. Informacje o dostępności to cytaty z deklaracji dostępności budynku (plus znaczniki PJM/audiodeskrypcji z opisu wydarzenia) — dla wydarzeń poza budynkiem przy Małopolskiej 48 pozostają `unknown`.
