# Filharmonia Szczecin

Hackathonowy monorepo z aplikacją Next.js oraz demonstracyjnym modelem danych Filharmonii.

## Aplikacje

- `apps/web` — aplikacja webowa (port 3000)
- `apps/docs` — aplikacja dokumentacyjna (port 3001)
- `backend/` — publiczne API w Go (port 8080), opis endpointów: `backend/README.md`
- `parser/` — scraper publicznego repertuaru, schematy i importer SQLite

Wymagania: Node.js 20+ oraz pnpm 10+.

```bash
pnpm install
pnpm dev
```

## Zmienne środowiskowe

```bash
cp .env.example .env   # uzupełnij OPENROUTER_API_KEY
```

`.env` jest w `.gitignore` — nie commituj kluczy. `docker compose` wczytuje go do serwisu `api`.

## Baza demo

Gotowa baza SQLite znajduje się w `data/filharmonia.sqlite`. Opis modelu: `parser/model-danych.md`.

Odświeżenie danych (Python 3, bez dodatkowych bibliotek):

```bash
python3 parser/scrape_filharmonia.py --output data/filharmonia_events.json
python3 parser/load_sqlite.py --reset
```

Dane repertuaru są demonstracyjne; ceny i statusy biletów nie są pobierane z systemu sprzedaży i pozostają nieznane, jeśli nie ma ich w publicznych danych źródłowych.
