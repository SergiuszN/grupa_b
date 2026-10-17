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
python3 parser/scrape_filharmonia.py --limit 30 --output data/filharmonia_events.json
python3 parser/load_sqlite.py --reset
```

Domyślnie scraper pobiera wydarzenia od bieżącej chwili, w tym dostępne wersje EN/DE. Opcja `--from-date ''` uwzględnia też archiwalne wystąpienia. Scraper sprawdza `robots.txt`, ogranicza tempo zapytań i korzysta z publicznych stron wydarzeń.

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

Dane są demonstracyjne, nie są synchronizowane z systemem sprzedaży biletów. Ceny, dostępność miejsc i szczegóły dostępności pozostają `NULL`/`unknown`, jeśli nie występują w publicznych danych strukturalnych — nie są zgadywane.
