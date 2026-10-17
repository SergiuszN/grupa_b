# Model danych — Filharmonia Szczecin

Model odpowiada briefowi: kalendarz jest centralnym modułem; ten sam rekord może pojawić się w repertuarze, EDUfilharmonii i rekomendacjach. Dane treści są oddzielone od dat wykonań i od języków.

## Główne relacje

```text
events 1 ─── N performances N ─── 1 venues
   │
   ├── 1 ─── N event_translations (PL / EN / DE)
   ├── N ─── N artists       przez event_artists (z rolą)
   ├── N ─── N works         przez event_works; kompozytor jest artystą
   ├── N ─── N series        przez event_series
   ├── N ─── N audience_groups przez event_audiences (opcjonalny zakres wieku)
   ├── N ─── N moods         przez event_moods
   └── 1 ─── N event_accessibility
```

`events` opisuje pozycję repertuaru, a `performances` konkretny termin. To ważne np. dla warsztatów w kilku terminach i wystaw trwających dłużej niż jeden dzień. `event_translations` pozwala zachować oryginalny tekst w każdym języku; scraper nie tworzy tłumaczeń, których nie ma na stronie.

## Tabele

- `events`, `event_translations` — opis, typ wydarzenia, kategoria źródłowa, obraz i treści PL/EN/DE.
- `performances`, `venues` — daty, miejsce, status biletów, ceny i link do zakupu.
- `artists`, `artist_translations`, `event_artists` — osoby i zespoły wraz z rolami.
- `works`, `work_translations`, `event_works` — program i kompozytorzy.
- `series`, `series_translations`, `event_series` — cykle i festiwale.
- `audience_groups`, `event_audiences`, `moods`, `event_moods` — filtry „dla kogo” i „jaki klimat”.
- `event_accessibility` — osobne potwierdzone informacje o dostępności ruchowej, wzrokowej, słuchowej i sensorycznej.
- `source_snapshots` — kopia źródłowych danych strukturalnych do kontroli i ponownego importu.

## Zawartość aktualnej bazy demo

Ostatni zrzut z publicznych stron Filharmonii zawiera 21 rekordów wydarzeń i 85 wystąpień (stan na 17.10.2026), wraz z dostępnymi tłumaczeniami EN/DE, wykonawcami, utworami, cyklami oraz kategoriami odczytanymi z kalendarza. Oferta obejmuje terminy od 18.10.2026 do 14.06.2027; liczby zmienią się po kolejnym uruchomieniu scrapera. Dokładna liczba zmieni się po kolejnym uruchomieniu scrapera.

**Świadomie nie uzupełniamy zgadywanych danych:** publiczne JSON-LD nie ujawnia wiarygodnych cen ani bieżącego stanu sprzedaży, więc `price_min`/`price_max` pozostają puste, a `ticket_status` ma wartość `unknown`. Miejsce w pobranych danych może być ogólne („Filharmonia Szczecin”), a nie konkretną salą. Znaczniki dostępności również wymagają weryfikacji u organizatora. Do prezentacji można dodać ręcznie zweryfikowane lub wyraźnie oznaczone mockowe wartości.

## Źródło i ponowne pobranie

Źródło: [filharmonia.szczecin.pl](https://filharmonia.szczecin.pl/). Scraper bierze publiczne linki do wydarzeń z repertuaru, odczytuje dane JSON-LD oraz dostępne warianty językowe, a typ i cykl odczytuje z kalendarza. Zrzut zapisuje czas pobrania i URL źródłowy. Przed użyciem danych jako bieżącej oferty należy ponownie uruchomić skrypt i sprawdzić status sprzedaży w oficjalnym systemie.

```bash
python3 scripts/scrape_filharmonia.py --limit 30 --output data/filharmonia_events.json
python3 scripts/load_sqlite.py --reset
```
