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

- `events`, `event_translations` — typ wydarzenia (`kind`), kategoria z kalendarza (`calendar_category`: concerts/edu/exhibitions/others), obraz, playlista Spotify, czas trwania i przerwa, wiek; w tłumaczeniach PL/EN/DE: tytuł, podtytuł (np. „Koncert symfoniczny”), opis jako czysty tekst z akapitami, `programme_notes` (np. Akademia słuchania, czas trwania), `audience_note` („dla dzieci od 3. do 4. roku życia z opiekunami”), `partners_note`.
- `performances`, `venues` — daty, sala (Sala symfoniczna / kameralna / galerie) z adresem i planem sali, status biletów, `price_min`/`price_max` oraz pełny cennik w `price_details` (JSON: strefa → normalne/ulgowe/grupowe), link do kasy lub formularza, `ticket_notes` (np. „Sprzedaż od…”, zasady dla opiekunów).
- `artists`, `artist_translations`, `event_artists` — osoby i zespoły ze zdjęciem (`image_url`, `image_credit`) i biogramem PL/EN/DE; rola w wydarzeniu (dyrygent, trąbka, prowadzenie…) jest w `event_artists.role`, a nie w nazwisku.
- `works`, `work_translations`, `event_works` — program (kompozytor jest artystą), tytuły w PL/EN/DE.
- `series`, `series_translations`, `event_series` — cykle z opisem i obrazkiem.
- `audience_groups`, `event_audiences` — filtr „dla kogo” wyciągany z pola odbiorców w kalendarzu i podtytułu (dzieci, rodziny, przedszkola, szkoły, seniorzy…) z zakresem wieku. To główne źródło dla persony „Rodzic” i EDUfilharmonii.
- `moods`, `event_moods` — słownik „jaki klimat”; strona go nie publikuje, więc tabela jest pusta (do ręcznego/AI tagowania).
- `event_accessibility` — dostępność ruchowa/słuchowa/wzrokowa/sensoryczna: cytaty z [deklaracji dostępności](https://filharmonia.szczecin.pl/deklaracja_dostepnosci) dla wydarzeń w budynku przy Małopolskiej 48 (`source_url` wskazuje źródło) oraz znaczniki z opisu wydarzenia (PJM, audiodeskrypcja, koncert sensoryczny). Status `partial` = część udogodnień jest, części brak.
- `source_snapshots` — kopia rekordu źródłowego do kontroli i ponownego importu.

## Zawartość aktualnej bazy demo

Zrzut z 17.10.2026: **100 wydarzeń** (w tym 6 koncertów zewnętrznych) i **222 terminy** od 18.10.2026 do 19.06.2027, 94 wydarzenia z tłumaczeniami EN/DE, 188 artystów (97 z biogramem PL/EN/DE, 90 ze zdjęciem — pozostali nie mają na stronie własnej podstrony), 107 utworów w programach 39 wydarzeń, 15 cykli z opisami. Ceny ma 185 terminów; statusy: 160 `available`, 24 `registration_required`, 20 `free`, 1 `sold_out`, 17 `unknown` (głównie koncerty zewnętrzne). Czas trwania znany dla 44 wydarzeń.

**Świadomie nie zgadujemy danych:** ceny i statusy sprzedaży to stan z chwili pobrania (popup biletów na stronie), nie dane na żywo z systemu sprzedaży. Dostępność dla wydarzeń zewnętrznych pozostaje `unknown`. Nastroje (`moods`) nie są wypełniane automatycznie.

## Źródło i ponowne pobranie

Źródło: [filharmonia.szczecin.pl](https://filharmonia.szczecin.pl/). Scraper czyta miesięczny kalendarz (ten sam endpoint, którego używa strona), a następnie strony wydarzeń PL/EN/DE, popup biletów, strony artystów i cykli. Przed użyciem danych jako bieżącej oferty należy ponownie uruchomić skrypt.

```bash
python3 parser/scrape_filharmonia.py --output data/filharmonia_events.json
python3 parser/load_sqlite.py --reset
```
