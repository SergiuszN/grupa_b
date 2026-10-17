# Backend — publiczne API Filharmonii

Go (biblioteka standardowa + `modernc.org/sqlite`, bez CGO). Czyta bazę demo `data/filharmonia.sqlite` **tylko do odczytu** — model danych opisuje `parser/model-danych.md`.

```bash
make api-dev    # http://localhost:8080/api/v1
make api-test
```

Dokumentacja do testowania w przeglądarce (Swagger UI, „Try it out”): **http://localhost:8080/api/docs** (`make api-docs`). Specyfikacja OpenAPI 3: `GET /api/v1/openapi.yaml` (plik `cmd/api/openapi.yaml`, wbudowany w binarkę) — można ją też zaimportować do Postmana/Insomnii albo wygenerować z niej klienta TS. Przy dodawaniu endpointu trzeba dopisać go do spec — test `TestOpenAPI` to sprawdza.

Lokalnie bez Dockera: `cd backend && go run ./cmd/api` (domyślnie `DB_PATH=../data/filharmonia.sqlite`, `PORT=8080`).

## Konwencje

- Wszystkie endpointy to `GET`, bez autoryzacji, z `Access-Control-Allow-Origin: *`.
- Odpowiedź: `{"data": ...}`, listy stronicowane dodatkowo `{"meta": {"total", "limit", "offset"}}`. Błąd: `{"error": {"code", "message"}}` (400 / 404 / 500).
- Język treści: `?lang=pl|en|de` albo nagłówek `Accept-Language`; domyślnie `pl`. Gdy brak tłumaczenia, zwracany jest tekst polski, a pole `language` mówi, w jakim języku jest odpowiedź.
- Daty to dni kalendarzowe w strefie Europe/Warsaw (`YYYY-MM-DD`). Bez filtra daty listy pokazują tylko to, co jest od dziś.
- Paginacja: `limit`, `offset`.

## Endpointy

| Endpoint | Opis |
| --- | --- |
| `GET /api/v1` | lista endpointów |
| `GET /api/v1/events` | wydarzenia (karty) z pasującymi terminami, sortowane po najbliższym terminie |
| `GET /api/v1/events/{id}` | karta wydarzenia: opis, wszystkie terminy z cennikiem, artyści z rolami, program, cykle, dla kogo, nastroje, dostępność |
| `GET /api/v1/performances` | widok kalendarza: pojedyncze terminy chronologicznie, każdy z kartą wydarzenia |
| `GET /api/v1/artists?q=` | artyści (wyszukiwanie po nazwisku) |
| `GET /api/v1/artists/{id}` | profil: biogram, role, najbliższe wydarzenia, skomponowane utwory |
| `GET /api/v1/series`, `/series/{slug}` | cykle i festiwale, szczegóły z wydarzeniami |
| `GET /api/v1/venues`, `/venues/{slug}` | sale i galerie, szczegóły z dostępnością i wydarzeniami |
| `GET /api/v1/filters` | wartości filtrów kalendarza z licznikami nadchodzących wydarzeń |
| `GET /api/v1/search?q=` | wyszukiwarka pogrupowana: wydarzenia, artyści, utwory, cykle |
| `POST /api/v1/assistant` | asystent głosowy — jedna tura rozmowy, odpowiedź jako strumień SSE (niżej) |

Wyszukiwanie (`q`) ignoruje wielkość liter i polskie/niemieckie znaki: `karlowicz` = `Karłowicz`. Przeszukuje tytuły we wszystkich językach, wykonawców, utwory, kompozytorów i cykle.

## Filtry `/events` i `/performances`

Wartości list można podać po przecinku (`kind=jazz,chamber`) albo powtarzając parametr.

| Parametr | Wartości |
| --- | --- |
| `when` | `today`, `tomorrow`, `weekend`, `week` (do niedzieli), `month` (do końca miesiąca), `all` (także przeszłe) |
| `from`, `to` | zakres dat `YYYY-MM-DD`; termin pasuje, jeśli nachodzi na zakres (wystawy) |
| `kind` | `symphonic`, `chamber`, `jazz`, `concert`, `education`, `exhibition`, `tour`, `festival`, `external`, `other` |
| `category` | `concerts`, `edu`, `exhibitions`, `others` |
| `audience` | `children`, `families`, `preschool`, `schools`, `youth`, `teachers`, `young-musicians`, `adults`, `seniors`, `beginners` |
| `age` | wiek dziecka; pasują wydarzenia z zakresem wieku, który go obejmuje |
| `mood` | slugi z tabeli `moods` (obecnie nieotagowane) |
| `venue` | slug sali, np. `sala-symfoniczna`, `sala-kameralna`, `galeria-poziom-4` |
| `series` | slug cyklu |
| `artist` | id artysty — jako wykonawca albo kompozytor utworu z programu |
| `ticket_status` | `available`, `last_seats`, `sold_out`, `free`, `registration_required`, … |
| `free=true` | tylko bezpłatne |
| `price_max` | najtańszy bilet nie droższy niż X zł (lub bezpłatne) |
| `duration_min`, `duration_max` | czas trwania w minutach (wydarzenia bez znanego czasu są pomijane) |
| `accessibility` | `mobility`, `visual`, `hearing`, `sensory` — status `available` lub `partial` |
| `q` | wyszukiwanie tekstowe |

Przykłady z briefu:

```bash
curl 'localhost:8080/api/v1/events?when=weekend&audience=children'      # Co jest w ten weekend dla dzieci?
curl 'localhost:8080/api/v1/events?age=5'                                # Co mogę zrobić z 5-letnim dzieckiem?
curl 'localhost:8080/api/v1/events?kind=jazz&lang=en'                    # Pokaż mi jazz
curl 'localhost:8080/api/v1/events?kind=exhibition&when=today'           # Jakie wystawy są teraz otwarte?
curl 'localhost:8080/api/v1/performances?when=month&price_max=50'        # kalendarz na miesiąc, do 50 zł
curl 'localhost:8080/api/v1/search?q=karlowicz'
```

Ceny i statusy biletów to stan z chwili pobrania danych, nie dane na żywo z systemu sprzedaży.

## Asystent głosowy

`POST /api/v1/assistant` (front woła go przez proxy `app/api/assistant/route.ts`). Wszystko przez OpenRouter, wymaga `OPENROUTER_API_KEY` — bez klucza endpoint zwraca 503, reszta API działa normalnie.

1. **Mowa → tekst**: `microsoft/mai-transcribe-2`. Przeglądarka nagrywa i koduje WAV 16 kHz mono (webm model odrzuca). Wykryty język mowy (pl/en/de) wybiera język odpowiedzi i głos.
2. **Agent**: `openai/gpt-6-luna` (`reasoning: none` — szybsze, a w testach bez straty jakości) w pętli z narzędziami, maks. 6 kroków:
   - `search_events` — wyszukiwanie hybrydowe + filtry kalendarza (daty, rodzaj, wiek, cena, sala, dostępność),
   - `get_event_details` — pełna karta wydarzenia,
   - `get_visitor_info` — praktyczne informacje o wizycie z bazy wiedzy (niżej); źródło trafia na ekran (zdarzenie `sources`),
   - `show_events` — wysyła 1–3 karty z biletami na ekran (zdarzenie `events`).
3. **Tekst → mowa**: `microsoft/mai-voice-2.1` (głos Harper pl/en/de). Odpowiedź modelu jest strumieniowana i cięta na zdania; zdania są syntezowane równolegle i wysyłane po kolei jako klipy MP3, więc pierwsze zdanie gra, zanim model skończy pisać.

Zdarzenia SSE: `transcript`, `tool`, `events`, `sources`, `delta`, `audio`, `done`, `error` — szczegóły w OpenAPI. Historię rozmowy trzyma klient i odsyła ją w `history`.

### Baza wiedzy dla asystenta

`data/visitor_info.json` — kilkadziesiąt haseł spisanych ze strony filharmonia.szczecin.pl (bilety i ulgi, zwroty, rezerwacje, kasa, dojazd, parking, szatnia, dress code, kawiarnie, zasady na sali, dostępność, sale, budynek i nagrody, zwiedzanie, galerie, oferta EDU, wynajem, kontakt). Każde hasło ma `id`, `category`, `title`, `content` i `url` strony źródłowej. Asystent odpowiada na pytania praktyczne tylko z tych haseł i pokazuje źródło; gdy czegoś nie ma, mówi, że nie wie, i podaje numer kasy. Tam, gdzie strona FS sama sobie przeczy (godziny kasy, cena zwiedzania), hasło to zaznacza. Po edycji pliku trzeba przebudować indeks.

### Indeks wyszukiwania (FTS5 + embeddingi)

`data/search.sqlite` — osobny plik obok bazy katalogu (ta zostaje tylko do odczytu): hasła z bazy wiedzy oraz jeden dokument na wydarzenie i język (tytuł, opisy, wykonawcy, program, cykle, sale, grupy odbiorców), tabela FTS5 na tekście bez polskich znaków oraz embeddingi `openai/text-embedding-3-small` jako BLOB float32. Zapytanie łączy ranking BM25 z podobieństwem cosinusowym (wektory w pamięci API) przez reciprocal rank fusion, a potem przechodzi przez zwykłe filtry kalendarza. Bez indeksu asystent działa dalej, na samym wyszukiwaniu tekstowym `q`.

```bash
make index         # w Dockerze; lokalnie: make local-index
```

Po zmianie danych trzeba przebudować indeks — embeddingi niezmienionych dokumentów są brane z poprzedniego pliku, więc ponowne budowanie jest tanie. Modele można nadpisać zmiennymi z `.env.example`.
