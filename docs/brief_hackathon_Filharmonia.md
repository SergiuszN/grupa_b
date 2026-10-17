# Brief hackathonowy: Nowa strona internetowa Filharmonii w Szczecinie

**Hasło projektu: FILHARMONIA ZACZYNA SIĘ ONLINE**

---

## Zadanie

Stworzyć koncept nowej strony internetowej dla **Filharmonii im. Mieczysława Karłowicza w Szczecinie**.

Projekt powstaje w podejściu **mobile first** i musi w pełni obsługiwać desktop.

|                          |                                                                                                          |
| ------------------------ | -------------------------------------------------------------------------------------------------------- |
| **Zamawiający**          | Filharmonia im. Mieczysława Karłowicza w Szczecinie (FS)                                                 |
| **Adresaci briefu**      | Zespoły hackathonowe: front-end, back-end, UX/UI, data/AI                                                |
| **Charakter rezultatu**  | Koncepcja nowej strony internetowej; nie wdrożenie produkcyjne                                           |
| **Materiały źródłowe**   | Brief „Nowa strona internetowa FS” (założenia wstępne), arkusz „Funkcjonalności na nowej stronie www FS” |
| **Języki serwisu**       | polski, angielski, niemiecki                                                                             |
| **Standard dostępności** | WCAG 2.2 AA                                                                                              |

---

## 1. Cel hackathonu

### Użytkownik ma w kilka sekund zdecydować: „chcę tam być”

- **Co dzieje się teraz i wkrótce?** Odpowiedzią jest kalendarz, który stanowi centrum serwisu.
- **Co jest dla mnie?** Pomagają w tym filtry, „Pomóż mi wybrać”, asystent AI i rekomendacje.
- **Jak tam się dostać?** Tu potrzebne są informacje o biletach, dojeździe, dostępności i planowaniu wizyty.

> **Zasada nadrzędna:** użytkownik nie musi „znać Filharmonii”, żeby umieć korzystać z jej strony.

### Najważniejsza zmiana

**Strona ma być przewodnikiem po Filharmonii, a nie tylko tablicą ogłoszeń.**

`01 Odkryj` → `02 Wybierz` → `03 Zaplanuj` → `04 Kup` → `05 Przyjdź` → `06 Wróć`

---

## 2. Kontekst

### Wejdź do Filharmonii

Strona działa jak wejście do budynku: na koncert, na wystawę, na warsztaty, do historii, do orkiestry, do architektury, do świata Karłowicza.

| Obszar              | Przykłady treści                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| Koncerty            | symfoniczne, kameralne, jazz, cykle (np. FilHERmonia, Filharmonia Light), festiwale                     |
| EDUfilharmonia      | dzieci, rodziny, przedszkola, szkoły, młodzież, nauczyciele, młodzi muzycy, dorośli                     |
| Wystawy             | Galeria Poziom 4. i Art.Room, z własnym kalendarzem wystaw                                              |
| Budynek             | architektura, Sala Symfoniczna, Sala Kameralna, galerie, nagrody, zwiedzanie PL / EN / DE               |
| Orkiestra i artyści | muzycy, dyrygenci, soliści, nagrania, tournée                                                           |
| Projekty            | m.in. International Lutosławski Youth Orchestra (ILYO), „Słyszę Dobre Dźwięki”, projekty międzynarodowe |

### Grupy odbiorców

| Persona                     | Potrzeba                                                   | Kluczowy ekran                         |
| --------------------------- | ---------------------------------------------------------- | -------------------------------------- |
| Stały bywalec, meloman      | szybko znaleźć koncert, skład, program; zarządzać biletami | kalendarz, wydarzenie, panel klienta   |
| Debiutant                   | „Nie znam się na muzyce klasycznej. Co mogę zobaczyć?”     | „Zacznij tutaj”, „Pomóż mi wybrać”, AI |
| Rodzic                      | coś dla dziecka w określonym wieku, w weekend              | filtr „dla dzieci”, EDUfilharmonia     |
| Nauczyciel, szkoła          | oferta dla grup, zasady rezerwacji                         | EDUfilharmonia, oferta dla szkół       |
| Turysta (PL / EN / DE)      | kiedy i za ile zwiedzać, w jakim języku                    | Zwiedzanie, Planuj wizytę              |
| Osoba z niepełnosprawnością | czego się spodziewać przed wizytą                          | znaczniki dostępności przy wydarzeniu  |
| Partner biznesowy           | dlaczego i jak wspierać Filharmonię                        | Partnerzy                              |
| Dziennikarz                 | komunikaty, zdjęcia, logo, biogramy                        | Strefa mediów                          |

### Marka i warstwa wizualna

- **Charakter:** Minimalizm, charakter, elegancja. Inspiracja budynkiem (światło, biel, geometria, rytm, cisza, przestrzeń), ale bez jego kopiowania.
- **Logo:** Znak graficzny i logotyp „FILHARMONIA SZCZECIN”. Czarne na jasnym tle, białe na ciemnym; bez deformacji i zmiany proporcji.
- **Kolor:** Sugerowane kolory: biel, czerń, odcienie złotego, a także kolory tematyczne cykli.
- **Typografia:** Nowa strona ma zawierać fonty nowoczesne, minimalistyczne, dopasowane do instytucji.
- **Motyw graficzny:** Geometria znaku (łamane płaszczyzny, rytm pasów) i heksagon. Stosujemy je oszczędnie, np. w kadrowaniu zdjęć czy układzie siatki.
- **Język:** Profesjonalnie, ale po ludzku: „Usłyszymy jedną z najważniejszych symfonii Mahlera w wykonaniu Orkiestry Filharmonii”.

---

## 2. Obecna strona w liczbach

### Trzy czwarte użytkowników korzysta z telefonu

| Wskaźnik                          | Wartość    |
| --------------------------------- | ---------- |
| Wejścia z telefonu                | **74%**    |
| Aktywni użytkownicy w miesiąc     | **11 922** |
| Wyświetlenia podstron             | **69 380** |
| Średni czas zaangażowania (min:s) | **2:32**   |

| Urządzenie | Udział |
| ---------- | ------ |
| Telefon    | 74,0%  |
| Komputer   | 24,7%  |
| Tablet     | 1,3%   |

_Źródło: Google Analytics obecnej strony. Urządzenia: marzec 2026; pozostałe dane: od 8 września do 8 października 2026._

### Ruch dzień po dniu

- **Aktywni użytkownicy dziennie:** najwięcej użytkowników 2 października (ok. 720).
- **Wyświetlenia podstron dziennie:** szczyty 8 września (ok. 3,3 tys.) i 2 października (ok. 3,0 tys.).

_(Okres: 8.09–8.10.2026; w oryginale wykresy liniowe.)_

### Systemy, przeglądarki i ekrany

**Android i iOS: ok. 75%**

| System operacyjny | Użytkownicy |
| ----------------- | ----------- |
| Android           | 5,4 tys.    |
| iOS               | 4,6 tys.    |
| Windows           | 2,5 tys.    |
| Macintosh         | 646         |
| Linux             | 90          |
| Chrome OS         | 11          |

**Chrome i Safari przeważają**

| Przeglądarka | Użytkownicy (ok.) |
| ------------ | ----------------- |
| Chrome       | 6,7 tys.          |
| Safari       | 4,1 tys.          |
| Firefox      | 630               |
| Webview      | 510               |
| Edge         | 490               |
| Samsung      | 470               |
| Opera        | 120               |

**5 z 7 ekranów to telefony**

| Rozdzielczość ekranu | Użytkownicy (ok.) | Typ      |
| -------------------- | ----------------- | -------- |
| 390×844              | 1 340             | telefon  |
| 393×852              | 1 170             | telefon  |
| 1920×1080            | 960               | komputer |
| 384×832              | 890               | telefon  |
| 360×780              | 710               | telefon  |
| 402×874              | 600               | telefon  |
| 1536×864             | 560               | komputer |

_Źródło: Google Analytics obecnej strony, marzec 2026. Przeglądarki i rozdzielczości: wartości przybliżone, odczytane z wykresów._

### Kto odwiedza stronę

**Szczecin: 28% użytkowników i najdłuższe wizyty (3 min 18 s)**

| Miasto        | Aktywni użytkownicy |
| ------------- | ------------------- |
| Szczecin      | 3 356               |
| Warszawa      | 3 041               |
| Wrocław       | 1 368               |
| Poznań        | 1 027               |
| Gdańsk        | 923                 |
| Bydgoszcz     | 477                 |
| (nieustalone) | 444                 |
| Pruszków      | 308                 |
| Łódź          | 269                 |
| Berlin        | 227                 |

**Wiek: przeważają osoby 35+, najdłużej zostają osoby 65+ (3 min 02 s)** — dla 71% wiek nieznany.

| Wiek  | Aktywni użytkownicy |
| ----- | ------------------- |
| 18–24 | 254                 |
| 25–34 | 641                 |
| 35–44 | 810                 |
| 45–54 | 927                 |
| 55–64 | 677                 |
| 65+   | 765                 |

### Najpopularniejsze podstrony

| Podstrona                               | Wyświetlenia | Użytkownicy | Średni czas |
| --------------------------------------- | -----------: | ----------: | ----------: |
| Strona główna (/pl)                     |       11 551 |       4 700 |  1 min 07 s |
| Repertuar                               |        5 590 |       2 526 |  1 min 06 s |
| Inauguracja 79. sezonu artystycznego    |        3 005 |       1 233 |  1 min 01 s |
| Strona główna EN (/en)                  |        1 344 |         572 |        53 s |
| Koncerty zewnętrzne we wrześniu 2026    |        1 328 |         928 |        35 s |
| FilHERmonia: Poranek w wielkim mieście  |        1 152 |         642 |        46 s |
| Koncerty zewnętrzne w październiku 2026 |        1 061 |         729 |        58 s |
| Cykl: Koncerty zewnętrzne               |        1 013 |         536 |        32 s |
| Koncert prezydencki                     |          996 |         349 |  1 min 03 s |
| Strona główna DE (/de)                  |          941 |         413 |  1 min 08 s |

### Co z tego wynika dla konceptu

- 74% wejść z telefonu potwierdza podejście mobile first, a najczęstsze ekrany mają od 360 do 402 px szerokości.
- Strona główna i repertuar to razem prawie 25% wyświetleń, więc droga do kalendarza musi być krótka z każdego miejsca.
- Wersje angielska i niemiecka są w pierwszej dziesiątce podstron, co uzasadnia pełne tłumaczenia treści.
- Osoby 65+ zostają na stronie najdłużej (3 min 02 s), dlatego czytelność i dostępność są kluczowe.
- Ponad 70% użytkowników łączy się spoza Szczecina, więc informacje o dojeździe i planowaniu wizyty muszą być łatwe do znalezienia.

---

## 3. Cele i mierniki sukcesu

### Krótsza droga od wejścia na stronę do decyzji i zakupu biletu

| Cel FS                            | Miernik (propozycja)                                       | Co w koncepcie na niego działa                                                           |
| --------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Więcej sprzedanych biletów online | konwersja wydarzenie, koszyk, zakup                        | czytelna karta wydarzenia, CTA „Kup bilet” zawsze widoczne, sugestie podobnych koncertów |
| Nowa publiczność                  | udział nowych kupujących; użycie „Pomóż mi wybrać”         | ścieżka „Zacznij tutaj”, kategorie nastrojów, asystent AI                                |
| Szybkie znajdowanie informacji    | czas do znalezienia wydarzenia; skuteczność wyszukiwarki   | kalendarz z filtrami, wyszukiwarka języka naturalnego                                    |
| Wiedza o odbiorcach               | liczba kont w panelu klienta, ulubione, zgody marketingowe | panel klienta, powiadomienia                                                             |
| Mniej pytań do kasy i biura       | spadek pytań powtarzalnych (dojazd, szatnia, dostępność)   | „Planuj wizytę”, AI oparte na faktach FS                                                 |
| Pełna dostępność                  | zgodność z WCAG 2.2 AA                                     | dostępność wbudowana w komponenty i treści                                               |
| Wizerunek miejsca otwartego       | ruch w sekcjach Budynek, Historia, Wystawy, Zwiedzanie     | odkrywalne treści, oś czasu, archiwum                                                    |

---

## 4. Zasady projektowe

### Telefon to podstawowe doświadczenie, desktop rozszerza ten sam system

#### Wersja mobilna — projektujemy od 360 px w górę

- Natychmiast pod kciukiem: co jest, kiedy, gdzie, kup bilet, jak dojechać, AI.
- Dolny pasek nawigacji (4–5 pozycji, np. Kalendarz, Szukaj, Asystent, Planuj wizytę, Konto) lub równoważne rozwiązanie uzasadnione przez zespół.
- Przyklejony przycisk „Kup bilet” na karcie wydarzenia, z ceną „od…” i statusem dostępności miejsc.
- Filtry kalendarza jako dolny arkusz z licznikiem wyników; szybkie wybory: Dziś, Ten weekend, Dla dzieci, Jazz, Wystawy.
- Cele dotykowe min. 44 × 44 px, odstępy min. 8 px; żadnych interakcji działających tylko po najechaniu kursorem.
- Akcje natywne: dodaj do kalendarza, nawiguj, zadzwoń do kasy, udostępnij, bilet w portfelu (Apple / Google Wallet, docelowo).
- Strona główna do przewijania: duże zdjęcie lub wideo na otwarcie, potem kafelki sekcji.

#### Wersja desktop — więcej kontekstu, nie inne funkcje

- Proste menu górne (5–7 pozycji), bez kilkunastu poziomów; wyszukiwarka i przełącznik PL | EN | DE zawsze widoczne.
- Kalendarz: filtry w bocznej kolumnie lub pasku, widok listy lub siatki miesiąca.
- Karta wydarzenia: treść po lewej, przyklejony panel biletowy (data, godzina, sala, cena, CTA) po prawej.
- Pełna obsługa klawiaturą, widoczny focus, skrót do wyszukiwarki.
- Wybieranie miejsc na planie sali. Wygodniejsze na dużym ekranie, ale musi działać też na telefonie.

#### Punkty przełamania (propozycja)

| Zakres       | Układ                                                                     |
| ------------ | ------------------------------------------------------------------------- |
| 360–599 px   | 1 kolumna, dolna nawigacja, arkusze dolne                                 |
| 600–1023 px  | 2 kolumny kart, nawigacja dolna lub górna                                 |
| 1024–1439 px | menu górne, 3 kolumny kart, panel boczny filtrów                          |
| od 1440 px   | treść do ok. 1320 px szerokości, więcej „powietrza”, nie więcej elementów |

### Dostępność wbudowana, nie doklejona

#### WCAG 2.2 AA

- Kontrast tekstu min. 4,5:1 (duży tekst 3:1); skalowanie do 200% bez utraty funkcji; możliwość wyłączenia animacji.
- Pełna obsługa czytników ekranu, opisy zdjęć, napisy do wideo, transkrypcje audio.
- Formularze i koszyk bez pułapek czasowych; komunikaty błędów czytelne dla czytników ekranu.
- Przy każdym wydarzeniu znaczniki: dostępność ruchowa, niewidomi i słabowidzący, głusi i słabosłyszący, informacje sensoryczne (głośność, światło, długość, przerwa).
- Tekst łatwy do czytania (ETR) i treści w PJM dla kluczowych informacji jako moduł docelowy.

#### Wydajność

- Szybkie ładowanie na telefonie, także przy słabym zasięgu.
- Lekkie zdjęcia dopasowane do ekranu, wideo bez automatycznego odtwarzania dźwięku.
- Bez sliderów z wieloma komunikatami i bez nadmiaru animacji.

---

## 5. Architektura informacji

### Płaska struktura serwisu

**Zawsze widoczne:** Szukaj, Asystent AI, Kup bilet, PL | EN | DE

```
Strona główna
├── Repertuar            — Kalendarz z filtrami, karta wydarzenia, festiwale i cykle
├── Dla Ciebie           — Zacznij tutaj, Pomóż mi wybrać, dla rodzin, kategorie nastrojów
├── EDUfilharmonia       — Rodziny, przedszkola, szkoły, młodzież, nauczyciele, dorośli
├── Odkryj Filharmonię   — Orkiestra i artyści, budynek, historia, wystawy, zwiedzanie
├── Planuj wizytę        — Bilety i kasa, dojazd i parking, szatnia, dostępność, FAQ
├── Moje konto           — Ulubione, moje bilety, programy koncertów, powiadomienia
└── Stopka               — Partnerzy i biznes, Strefa mediów, Kontakt, O instytucji, Deklaracja dostępności
```

### Zasady nawigacji

Każda treść jest osiągalna z menu w maksymalnie dwóch krokach. Pasek „Zawsze widoczne” to na mobile dolna nawigacja, a na desktopie nagłówek.

- **Tagi zamiast kopii:** Wydarzenie EDU pojawia się w kalendarzu i w EDUfilharmonii z jednego rekordu.
- **Festiwale w serwisie:** Festiwale jako podstrony serwisu, nie osobne domeny. Wyjątek: ILYO.
- **Orientacja w serwisie:** Okruszki (breadcrumbs) na desktopie, przycisk wstecz zachowujący filtry na mobile.
- **Trzy języki:** Czytelne adresy podstron w 3 językach. Wyszukiwarka i asystent AI są skrótem do każdej sekcji.

---

## 6. Moduły i założenia funkcjonalne

### Moduły serwisu i ich priorytety

Projektujemy wszystkie moduły o najwyższym priorytecie; co najmniej cztery pokazujemy w działaniu.

#### Najwyższy priorytet

- **Strona główna:** Dziś w Filharmonii, Najbliższe, Polecamy, Dla Ciebie, Odkryj Filharmonię
- **Kalendarz z filtrami:** osobna podstrona; bogate filtry; widok lista / miesiąc
- **Karta wydarzenia:** co, kiedy, gdzie, za ile, dla kogo + Kup bilet
- **Pomóż mi wybrać:** 5 pytań, a w wyniku 3–5 propozycji
- **Sugestie podobnych koncertów:** rekomendacje pod wydarzeniem, kategorie nastrojów
- **Odsłuch fragmentów:** ok. 1 min audio przy utworze, link do pełnego nagrania
- **Panel klienta:** ulubione, bilety, programy, powiadomienia
- **Podstrony festiwalowe:** rozbudowane sekcje w serwisie zamiast osobnych stron (wyjątek: ILYO)
- **Proste menu górne:** 5–7 pozycji, wyszukiwarka, języki

#### Wysoki i średni priorytet

- **Asystent AI** (wysoki): przewodnik oparty na danych FS, prowadzi do działania
- **Wyszukiwarka języka naturalnego** (wysoki): wydarzenia, artyści, utwory, teksty
- **Planuj wizytę** (wysoki): bilety, dojazd, parking, szatnia, sale, dostępność
- **EDUfilharmonia** (wysoki): oferta wg grup, zapisy, informacje praktyczne
- **Orkiestra i artyści** (wysoki): profile, powiązania z wydarzeniami
- **Wystawy** (średni): aktualne, nadchodzące, galerie, wernisaże
- **Zwiedzanie** (średni): terminy, ceny, języki, grupy, rezerwacja
- **Budynek** (średni): architektura, sale, nagrody
- **Historia i archiwum** (średni): interaktywna oś czasu od 1948 roku do dziś
- **Partnerzy i biznes** (średni): narracja partnerstwa, formy współpracy
- **Strefa mediów** (średni): komunikaty, zdjęcia, logo, biogramy, kontakt

### 6.1 Strona główna — co dzieje się teraz i co wydarzy się wkrótce

Kolejność bloków na telefonie, od góry ekranu. Na desktopie te same bloki w szerszym układzie.

1. **Otwarcie:** jedno duże zdjęcie lub krótkie wideo i najbliższe wydarzenie z CTA, bez slidera wielu komunikatów.
2. **Dziś w Filharmonii:** koncert, wystawa otwarta do, zwiedzanie o godz.
3. **Najbliższe wydarzenia:** kilka kart i przycisk „Pełny repertuar”.
4. **Polecamy:** wybór redakcji.
5. **Dla Ciebie:** Zacznij tutaj, Dla rodzin, Jeśli lubisz jazz, Jeśli lubisz muzykę filmową, Jeśli masz 30 minut, Coś niezwykłego lub „Pomóż mi wybrać”.
6. **Odkryj Filharmonię:** kafelki Orkiestra, Budynek, Historia, Wystawy, EDUfilharmonia, Zwiedzanie.
7. **Newsletter, partnerzy, stopka.**

### 6.2 Kalendarz wydarzeń — odpowiedź w kilka sekund

Kalendarz jest osobną podstroną i sercem serwisu. Użytkownik pyta, a kalendarz od razu pokazuje wyniki.

Przykładowe pytania:

- „Co jest w ten weekend?”
- „Co jest dla dzieci?”
- „Pokaż mi jazz”
- „Chcę koncert symfoniczny”
- „Co mogę zrobić z 5-letnim dzieckiem?”
- „Co jest dzisiaj?”
- „Jakie wystawy są teraz otwarte?”

**Wymagania**

- Możliwość udostępnienia linku z wybranymi filtrami i licznik wyników.
- Czytelny stan „brak wyników” z propozycją alternatyw.
- Status biletów na karcie: dostępne, ostatnie miejsca, wyprzedane.

**Filtry kalendarza**

| Filtr                       | Wartości                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------- |
| Kiedy                       | dziś, jutro, ten weekend, ten tydzień, miesiąc, zakres dat                                        |
| Rodzaj                      | symfoniczny, kameralny, jazz, edukacja, wystawa, zwiedzanie, festiwal, wydarzenie zewnętrzne      |
| Dla kogo                    | dzieci (z wiekiem), rodziny, młodzież, szkoły, dorośli, debiutanci                                |
| Nastrój                     | Classical super hits, Emotional, Energy, Relaks, Coś niezwykłego (jak w serwisach streamingowych) |
| Miejsce                     | Sala Symfoniczna, Sala Kameralna, galerie, poza budynkiem                                         |
| Cena                        | bezpłatne, do X zł, zakres                                                                        |
| Czas trwania                | do 45 min, do 90 min, dłużej                                                                      |
| Dostępność                  | ruchowa, wzrokowa, słuchowa, informacje sensoryczne                                               |
| Wykonawca, kompozytor, cykl | wyszukiwanie w filtrze                                                                            |

### 6.3 Karta wydarzenia — wszystko o wydarzeniu w jednym miejscu

Pierwszy ekran, bez przewijania:

**CO? · KIEDY? · GDZIE? · ZA ILE? · DLA KOGO? · KUP BILET**

- Kto występuje, z linkami do profili artystów.
- Co zagramy: program i odsłuch ok. 1 min.
- Ile to potrwa, z przerwą.
- Dlaczego warto przyjść, w 2–3 zdaniach.
- Dostępność i informacje sensoryczne.
- Program koncertu do pobrania.
- Dodaj do kalendarza, udostępnij, ulubione.
- Podobne wydarzenia, z pierwszeństwem dla koncertów, które FS chce promować.

### 6.4 Pomóż mi wybrać — pięć pytań i gotowe propozycje

1. Dla kogo?
2. Kiedy?
3. Jaki rodzaj muzyki?
4. Jaki klimat?
5. Jaki budżet?

→ **3–5 propozycji** z przyciskami „Zobacz” i „Kup bilet”.

- Każde pytanie ma odpowiedzi do wyboru. Pytania można pominąć i zmienić odpowiedź bez zaczynania od nowa.
- Wzorzec: smaksguide Filharmonii w Oslo.
- W przyszłości kreator można połączyć z asystentem AI.

### 6.5 Asystent AI — inteligentny przewodnik, nie chatbot dla ozdoby

- Odpowiada wyłącznie na podstawie danych FS i nie generuje faktów. Gdy nie wie, mówi to i kieruje do kasy lub formularza.
- Prowadzi do działania: zamiast samej odpowiedzi pokazuje kartę wydarzenia z przyciskami.
- Działa w PL / EN / DE, z dolnego paska na mobile i z nagłówka na desktopie.
- RODO: informacja o przetwarzaniu, bez zbierania danych osobowych w rozmowie, bez logowania. Wzorzec: omn.art.pl.

Przykład interakcji:

> **Użytkownik:** Jaki koncert jest w sobotę?
>
> **Asystent:** _[Tytuł koncertu]_ · [godzina], [sala] · [wykonawcy] · [krótki opis]
> `[Zobacz wydarzenie]` `[Kup bilet]`

### 6.6–6.9 Wyszukiwarka, panel klienta, odsłuch, orkiestra

#### Wyszukiwarka, która rozumie intencję

Nie tylko „Mendelssohn”, ale też „koncerty Mendelssohna”, „koncert dla dzieci”, „jazz w październiku”, „Karłowicz”.

- Wyniki pogrupowane: wydarzenia, artyści, utwory, teksty i materiały.
- Tolerancja literówek i polskich znaków („karlowicz” = „Karłowicz”).

#### Panel klienta

- Ulubione wydarzenia i artyści; powiadomienia („Koncert, który obserwujesz, prawie się wyprzedał”).
- Zakupione bilety bez szukania w mailu; zarządzanie biletami; pobieranie programu.
- Docelowo program lojalnościowy i aplikacja FS z zakupem biletów.
- Dla FS: grupowanie odbiorców wg zainteresowań. Do rozstrzygnięcia: RODO oraz to, czy dane przechowuje iksoris czy CMS.

#### Odsłuch fragmentów utworów

- Ok. 1-minutowy fragment bezpośrednio na stronie, bez reklam YouTube i przewijania symfonii.
- Promuje też płyty FS i odsyła do pełnego nagrania.
- Do rozstrzygnięcia: platforma streamingowa (Spotify jest najpopularniejszy, ale część odbiorców może go nie akceptować) czy własne pliki z nagrań FS.
- Koncept niezależny od dostawcy odtwarzacza.

#### Orkiestra i artyści

- Orkiestra: muzycy wg sekcji, dyrygenci, historia, nagrania, tournée, najważniejsze wydarzenia, współprace, nagrody.
- Profil artysty: biografia, zdjęcie, najbliższe koncerty, wcześniejsze wydarzenia, nagrania.
- Wszystko powiązane relacjami, żeby zainteresowanie jednym artystą prowadziło do kolejnych treści.

### 6.10 EDUfilharmonia — jeden z głównych filarów, nie „zakładka dla rodziców”

**Wejścia według grup:** dzieci · rodziny · przedszkola · szkoły · młodzież · nauczyciele · młodzi muzycy · dorośli

**Każde wydarzenie od razu pokazuje:** wiek · czas trwania · cenę · dla kogo · miejsce · jak się zapisać · co uczestnik zyska

Różne zasady rezerwacji (bilet, zapis, grupa szkolna) muszą być jasno rozróżnione.

### 6.12 i 6.13 Historia i archiwum, Planuj wizytę

#### Historia do odkrywania, nie „ściana tekstu”

- Oś czasu: 1948, kolejne dekady, najważniejsze wydarzenia, nowy budynek, dziś.
- Zdjęcia, plakaty, nagrania, programy koncertów, ludzie, historie, połączone z istniejącym cyfrowym archiwum FS.

#### Planuj wizytę

- Bardzo prosta sekcja: jak kupić bilet, jak dojechać, gdzie zaparkować, gdzie jest kasa, kiedy przyjść, ile trwa koncert, gdzie są toalety i szatnia, jak wygląda wejście, informacje o salach i dostępności.
- Forma: krótkie odpowiedzi, mapa, plan budynku.

### 6.11 i 6.14 Filharmonia jako miejsce i partner

- **Wystawy:** Aktualne i nadchodzące wystawy, artyści, kuratorzy, galerie (Poziom 4., Art.Room), wernisaże, zdjęcia prac, informacje praktyczne.
- **Budynek:** Architektura, Sala Symfoniczna, Sala Kameralna, galerie, historia budynku, nagrody. Pokazujemy, „dlaczego warto do niego wejść”, a nie tworzymy muzeum architektury.
- **Zwiedzanie:** Turysta w chwilę dowiaduje się: kiedy, ile kosztuje, w jakim języku (PL / EN / DE), jak długo, czy z grupą, a potem rezerwuje.
- **Festiwale:** Rozbudowane podstrony w serwisie (program, artyści, bilety, karnety) zamiast osobnych stron, co daje lepszą ekspozycję i SEO. Wyjątek: ILYO.
- **Partnerzy:** Nie tylko logotypy, ale też to, dlaczego warto wspierać kulturę, wspólne wartości, jak wygląda współpraca i jakie projekty można wspierać. Partnerstwo jako wspólna odpowiedzialność za miasto.
- **Strefa mediów:** Komunikaty prasowe, zdjęcia, logo, biogramy, materiały, informacje o wydarzeniach, kontakt prasowy. Strefa jest łatwo dostępna ze stopki.

---

## 7. Kluczowe ścieżki użytkownika

### Sześć scenariuszy, w tym obowiązkowy A

Każdy zespół pokazuje w koncepcji nowej strony internetowej co najmniej trzy scenariusze, w tym **obowiązkowo A na telefonie**.

#### A. Debiutant _(obowiązkowy)_ — „Nie znam się na muzyce klasycznej”

1. Wchodzi z telefonu, wybiera „Zacznij tutaj” lub „Pomóż mi wybrać”.
2. Odpowiada na 5 pytań, dostaje 3–5 propozycji.
3. Na karcie wydarzenia słucha fragmentu i czyta „Dlaczego warto przyjść”.
4. Kupuje bilet, dodaje wydarzenie do kalendarza.
5. W dniu koncertu otwiera „Planuj wizytę”.

#### B. Rodzic — „Co mogę zrobić z 5-letnim dzieckiem w ten weekend?”

1. W kalendarzu wybiera „Ten weekend” i „Dla dzieci”, ustawia wiek 5 lat.
2. Porównuje wiek, czas trwania, cenę, sposób zapisu.
3. Zapisuje się lub kupuje bilet rodzinny.

#### C. Rozmowa z AI — „Jaki koncert jest w sobotę? Czy mogę przyjechać z osobą na wózku?”

1. Dostaje kartę wydarzenia z godziną, wykonawcami, opisem i dostępnością sali.
2. Widzi źródło informacji w danych FS.
3. Przechodzi przyciskiem „Kup bilet” do zakupu.

#### D. Turysta z Niemiec

1. Wchodzi z wyszukiwarki na wersję DE.
2. W sekcji Zwiedzanie widzi terminy po niemiecku, cenę i czas trwania.
3. Rezerwuje zwiedzanie dla grupy i sprawdza, co gra się wieczorem.

#### E. Stały bywalec

1. Loguje się do panelu klienta, widzi swoje bilety i ulubionych artystów.
2. Dostaje powiadomienie, że obserwowany koncert się wyprzedaje.
3. Kupuje bilet w dwóch krokach, pobiera program koncertu.

#### F. Nauczyciel (desktop)

1. Filtruje EDUfilharmonię: szkoły, wiek 10–12 lat, najbliższy miesiąc.
2. Porównuje terminy w widoku miesiąca, czyta zasady rezerwacji grupowej.
3. Wysyła zgłoszenie grupy przez formularz.

---

## 8. Wymagania techniczne i integracje

### Jedno API zasila wszystkie kanały

```
 ŹRÓDŁA                              WARSTWA DANYCH                    KANAŁY
 ─────────────────────               ───────────────────────           ─────────────────────────────
 CMS headless                        API, warstwa danych               Strona www
   treści PL/EN/DE, media              • jeden model treści              mobile first i desktop
 System biletowy (iksoris)    ──►      • relacje między obiektami ──►  Wyszukiwarka
   sprzedaż, miejsca                   • wersje PL / EN / DE             język naturalny, literówki
 Cyfrowe archiwum FS                   • indeks wyszukiwania           Asystent AI
   historia, plakaty, nagrania         • baza wiedzy dla AI              tylko dane FS, karty z CTA
 Audio                                                                 Aplikacja FS
   fragmenty utworów, ok. 1 min                                          docelowo, to samo API
```

Stack jest wolnym wyborem zespołu. **Żaden kanał nie czyta bezpośrednio z systemu biletowego ani z CMS.**

### Model treści — treści to powiązane obiekty, nie strony

| Typ treści                 | Kluczowe pola                                                                                                                                                      | Relacje                                     |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- |
| Wydarzenie                 | tytuł, data i godzina, sala, czas trwania, przerwa, cena od–do, typ, grupa docelowa, wiek, nastrój, opis „dlaczego warto”, dostępność, status biletów, link zakupu | artyści, utwory, cykl lub festiwal, miejsce |
| Artysta                    | imię i nazwisko, rola lub instrument, biogram, zdjęcie                                                                                                             | wydarzenia, nagrania, orkiestra             |
| Utwór                      | tytuł, kompozytor, czas trwania, fragment audio                                                                                                                    | wydarzenia, nagrania                        |
| Cykl, festiwal             | nazwa, sezon, opis, karnety                                                                                                                                        | wydarzenia                                  |
| Wystawa                    | tytuł, daty, galeria, artyści, kurator, wernisaż, galeria zdjęć                                                                                                    | miejsce                                     |
| Oferta edukacyjna          | grupa, wiek, sposób zapisu, co uczestnik zyska                                                                                                                     | wydarzenia                                  |
| Miejsce                    | sala lub galeria, plan, dostępność                                                                                                                                 | wydarzenia, wystawy                         |
| Artykuł, historia          | tekst, media, data, tagi                                                                                                                                           | artyści, wydarzenia, oś czasu               |
| FAQ, informacja praktyczna | pytanie, odpowiedź, kategoria                                                                                                                                      | źródło wiedzy dla AI                        |

Każdy typ treści ma pełne wersje PL / EN / DE (tłumaczenie treści, nie tylko menu) oraz pola SEO.

### Systemy, z którymi łączy się serwis

| System                    | Rola                                               | Uwagi dla hackathonu                                               |
| ------------------------- | -------------------------------------------------- | ------------------------------------------------------------------ |
| System biletowy (iksoris) | sprzedaż, status miejsc, plan sali, bilety klienta | użyć mocka API; pokazać punkt integracji i obsługę statusów        |
| CMS headless              | treści, tłumaczenia, media, role redakcyjne        | dowolny (np. Strapi, Sanity, Payload, Directus)                    |
| Wyszukiwarka              | pełnotekstowa i semantyczna                        | np. Meilisearch, Typesense, baza wektorowa                         |
| Asystent AI (LLM + RAG)   | odpowiedzi tylko z treści FS, karty z CTA          | pokazać cytowanie źródła i zachowanie przy braku wiedzy            |
| Audio                     | fragmenty utworów                                  | niezależność od dostawcy (pliki własne lub platforma streamingowa) |
| Cyfrowe archiwum FS       | historia, plakaty, programy, nagrania              | linkowanie lub osadzanie                                           |
| Newsletter, CRM           | zapis, segmentacja wg zainteresowań                | zgody RODO                                                         |
| Analityka                 | ścieżki, konwersje, wyszukiwane frazy              | rozwiązanie zgodne z RODO, baner zgód                              |
| Mapy                      | dojazd, parking                                    | link do natywnej nawigacji                                         |

### Wymagania przekrojowe

- **RODO i bezpieczeństwo:** Minimalizacja danych, zgody, polityka prywatności, HTTPS, brak danych osobowych w zapytaniach do AI.
- **SEO:** Przyjazne adresy w 3 językach i dobra widoczność wydarzeń w wyszukiwarkach.
- **Redakcja:** Treści edytowane przez zespół FS bez programisty; podgląd przed publikacją; wersjonowanie.
- **Skalowalność:** Strona musi wytrzymać ruch szczytowy w dniu startu sprzedaży sezonu.
- **Docelowo:** aplikacja FS (bilety, panel klienta) na tym samym API.

---

## 9. Inspiracje

### Serwisy filharmonii do obejrzenia

| Serwis                                 | Co obejrzeć                                                                                             |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Philharmonie Luxembourg (TOP)          | strona główna do przewijania, panel klienta, sugestie podobnych koncertów, odsłuch, podstrona festiwalu |
| Concertgebouworkest                    | sugestie podobnych koncertów, odsłuch, agenda                                                           |
| Het Concertgebouw Amsterdam            | inspiracja ogólna                                                                                       |
| Dresdner Philharmonie                  | inspiracja ogólna                                                                                       |
| Philharmonie de Paris                  | inspiracja ogólna                                                                                       |
| Oslo-Filharmonien                      | smaksguide, wzorzec dla „Pomóż mi wybrać”                                                               |
| Berliner Philharmoniker                | inspiracja ogólna                                                                                       |
| Wiener Philharmoniker                  | proste menu górne, kalendarz koncertów                                                                  |
| Orchestre philharmonique de Strasbourg | sugestie podobnych koncertów                                                                            |
| Gewandhausorchester Leipzig            | festiwal jako podstrona serwisu                                                                         |

### Wzorce poszczególnych rozwiązań

| Rozwiązanie          | Wzorzec                                                                         |
| -------------------- | ------------------------------------------------------------------------------- |
| Kalendarz z filtrami | Nowy Teatr, kalendarz; Concertgebouworkest; Wiener Philharmoniker               |
| Asystent AI          | omn.art.pl                                                                      |
| Znajdź swój koncert  | Oslo-Filharmonien (smaksguide)                                                  |
| Kategorie nastrojów  | serwisy streamingowe (playlisty: „Classical super hits”, „Emotional”, „Energy”) |

---

## 10. Rezultaty

### Scenariusze wyników pracy zespołu

Koncepcja nowej strony internetowej w wersji mobile i desktop oraz prezentacja na żywo z telefonu. Wynik pracy może obejmować na przykład:

1. **Koncepcja nowej strony internetowej:** strona główna, kalendarz z filtrami, karta wydarzenia, „Pomóż mi wybrać” lub asystent AI.
2. **Widoki mobile (360 px) i desktop (1440 px)** dla każdego z tych ekranów.
3. **Mapa serwisu i model treści** (diagram i opis).
4. **Szkic architektury technicznej** z punktami integracji (system biletowy, CMS, AI).
5. **Mini design system:** siatka, typografia, kolory, komponenty (karta wydarzenia, filtr, CTA, znaczniki dostępności).
6. **Raport dostępności:** wynik automatycznego testu i test obsługi klawiaturą.
7. **Prezentacja:** problem, rozwiązanie, demo ścieżki A na telefonie, co dalej.

### Kryteria oceny — jak oceniamy koncepty

| Kryterium                          | Waga | Co oceniamy                                                                    |
| ---------------------------------- | ---: | ------------------------------------------------------------------------------ |
| Doświadczenie użytkownika mobile   |  25% | czy ścieżka od wejścia do biletu jest krótka i oczywista na telefonie          |
| Odkrywanie i wybór                 |  20% | kalendarz, filtry, „Pomóż mi wybrać”, rekomendacje, AI prowadzące do działania |
| Jakość wizualna i zgodność z marką |  15% | minimalizm, elegancja, typografia, kompozycja, adaptacja na desktop            |
| Dostępność                         |  15% | WCAG 2.2 AA w praktyce, znaczniki dostępności przy wydarzeniach                |
| Architektura i skalowalność        |  15% | model treści, API-first, realność integracji, wydajność                        |
| Wykonalność wdrożenia              |  10% | czy koncept da się przekazać wykonawcy zewnętrznemu jako specyfikację          |

### Materiały

#### Czego unikać

- przeciążonej strony i kilkunastu poziomów menu
- wielkich bloków tekstu
- sliderów z wieloma komunikatami
- nadmiaru animacji
- technologii dla samej technologii
- strony, która dobrze wygląda tylko na komputerze

#### Materiały dla zespołów

- Logo FS (wersje czarna i biała, SVG) i wytyczne marki.
- Materiały dostępne na obecnej stronie: filharmonia.szczecin.pl

---

**FILHARMONIA ZACZYNA SIĘ ONLINE**
