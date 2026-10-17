# Design system — Filharmonia Szczecin

Source of truth: Paper file **Filharmonia** → page _Flow debiutanta_, artboard
`01a · Hasło na zdjęciu`
(https://app.paper.design/file/01M55P75W1FART26HNBGT8A371/p-1-0/1D5-0).
Tokens below are copied from the Paper token set (hash `c605a518`) and implemented
once in [`app/globals.css`](app/globals.css) as a Tailwind v4 `@theme` block.

## Mood

**Nocturnal, after-hours foyer.** A cool concrete facade at dusk, one warm gold
signal (the door, the ticket window). The photo does the talking; the interface
stays quiet, typographic and editorial — poster copy on a photograph, not a
dashboard.

## Colour

| Token               | Value     | Role                                          |
| ------------------- | --------- | --------------------------------------------- |
| `--color-paper`     | `#FFFFFF` | Text on dark, inverse surfaces                |
| `--color-ink`       | `#111111` | Base canvas, dark surfaces                    |
| `--color-muted`     | `#6E6A63` | Secondary text **on light surfaces only**     |
| `--color-line`      | `#E3DFD7` | Hairlines, dividers                           |
| `--color-surface`   | `#F7F5F1` | Light panels, sheets                          |
| `--color-gold`      | `#AD891C` | Primary action, brand accent                  |
| `--color-gold-deep` | `#8F7017` | Gold pressed / hover                          |
| `--color-gold-soft` | `#F3EBD6` | Gold tint backgrounds, tags                   |

Rules:

- Dark screens use `paper` on `ink` (or on the photograph). Never `muted` on ink —
  it drops under 4.5:1.
- Gold is the only chromatic accent. One gold element per screen.
- The hero scrim is part of the system: 48 % → 4 % → 18 % → 78 % black top to
  bottom, so the header and the poster copy both stay legible.

## Typography

Family: `Helvetica Neue` → `Geist` → Helvetica → Arial. Paper specifies
Helvetica Neue; Geist (bundled locally via `next/font`) is the cross-platform
fallback so Windows/Linux don't collapse to Arial metrics.

| Token          | Size / line | Use                                  |
| -------------- | ----------- | ------------------------------------ |
| `text-hero`    | 40 / 44 px  | Landing headline (`-0.035em`)        |
| `text-display` | 34 / 38 px  | Screen titles                        |
| `text-title`   | 22 / 28 px  | Section titles, card titles          |
| `text-body`    | 15 / 22 px  | Body copy, buttons secondary         |
| `text-caption` | 12 / 16 px  | Captions, metadata, eyebrows         |

Weights: `300` light (logo subline), `400` regular, `500` medium (body),
`700` bold (headline, CTA). Headlines are bold and tightly tracked; small caps
labels are light with open tracking.

## Shape & space

- Radii: `sm` 8, `md` 16, `lg` 24, `full` 999. Buttons are always `full`.
- Base grid: 390 px wide, **24 px** side gutters, **36 px** bottom inset.
- Vertical rhythm inside the poster copy: 14 px headline→body, 28 px body→CTA.
- Touch targets: 56 px tall primary button, minimum 44 px for icon buttons.
- Respect `env(safe-area-inset-*)` on the header top and the CTA bottom.

## Layout — screens

### 01 · Landing (`/`)

Full-bleed photograph → header → flexible spacer → poster copy pinned to the
bottom. The photograph never scrolls away; on mobile the page is exactly one
viewport (`min-h-dvh`).

- **Header**: logo lockup (four-polygon mark + FILHARMONIA / SZCZECIN), then
  language, programme and menu controls, 15 px apart.
- **Poster copy**: headline set in two fixed lines, one-sentence promise, single
  gold pill CTA.
- **Responsive**: below 768 px the composition is 1:1 with the artboard. From
  768 px up the copy sits in a 760 px block, the headline grows to 64/66 px and
  the container widens to 1100 px — same poster, more room.

### 02 · Taste quiz (`/start`)

Three questions, one per screen, in a 430 px app column on paper:

1. _Wolisz słuchać czy oglądać?_ — Słuchanie / Oglądanie
2. _Klasycznie czy nowocześnie?_ — Klasycznie / Nowocześnie
3. _Wystawa czy architektura?_ — Wystawa / Architektura

- Eyebrow `PYTANIE n / 3` in gold, 12 px, `0.16em`, uppercase.
- Question in `text-display` (34/38), bold, max 320 px — two lines.
- Options are 104 px outlined cards (`radius-lg`, 1.5 px ink, label 22 px bold,
  index `01`/`02` in muted right). Hover fills `surface`; selected flips to gold
  with white text.
- The chosen option holds for 240 ms (acknowledgement) before the next question
  fades in with the `rise` animation.
- Answers are stored in `localStorage` under `filharmonia:taste` as
  `{ mode, era, space }`, then `/swipe` opens.
- Progress: three dots at the bottom, active dot 18 px wide in gold.

### 03 · Discover card (`/swipe`)

Paper artboard `04 · Eksploracja swipe`. The card fills the space between header
and actions; header on paper tone.

- Card: `radius-lg` (28 px on this screen), `overflow: clip`, photograph
  `object-cover`, copy block pinned to the bottom on a flat `ink` 42 % overlay.
- Copy: date in gold small caps, work title 32/34 bold, subtitle 20/26 light.
- Two 64 px circular actions, 56 px apart, centered, with 12 px labels under
  them: reject (outlined ink, muted label) and accept (gold, ink label).
- Six progress dots; the active one follows the card index.
- **Gestures**: drag the card horizontally — it follows the pointer, tilts
  (`translateX / 18` degrees) and, past 96 px, flies out (560 px + fade, 280 ms).
  Right = like, left = reject. Below the threshold it springs back. The card is
  also focusable: `←` / `→` decide. `touch-action: none` so the drag never turns
  into a page scroll.
- Buttons call the same `decide()` path, so pointer, keyboard and buttons stay
  consistent.
- Three cards (Mozart / Czajkowski / wieczór kameralny) from the real hall
  photography. After the last one the card area becomes a closing panel.
- **Tap** (pointer up under 8 px of movement, or `Enter`) opens an event sheet:
  88 vh bottom panel, 160 px photo header, gold date, 28 px title, kind + venue,
  description, program, performers and an outlined link to the event page.
  Backdrop tap and `Esc` close it; the close button takes focus on open.
- Decisions append to `localStorage` under `filharmonia:swipe` as
  `{ id, choice }`; a visually hidden `aria-live` region announces the save.

## Motion

One gesture only: content rises 12 px and fades in over 0.7 s — the landing copy
staggered 90 ms (headline → body → CTA), and each quiz question replayed on
change. Disabled under `prefers-reduced-motion: reduce`. No parallax, no hover
tricks on photographs.

## Assets

- `public/images/logo-mark.png` — the official Filharmonia Szczecin symbol,
  cropped from the brand-book PNG and used as an **alpha mask** so it inherits
  `currentColor` (white on the hero, ink on paper screens). Header lockup =
  20 × 36 px mark + typeset `FILHARMONIA` (700, 9/10 px, `0.04em`) over
  `SZCZECIN` (300, 9/10 px, `0.17em`).
- `public/images/hero-filharmonia.jpg` — facade photograph (landing).
- `public/images/concert-hall.jpg` — concert hall interior (discover card),
  converted from the Paper PNG to keep the payload at ~250 kB.
- `public/images/events/*.jpg` — real event photos pulled from the scraped
  repertoire (`data/filharmonia_events.json`), centre-cropped to 3:4.
  Both are downloaded from the Paper file, so the app has no runtime dependency
  on Paper.
- Logo mark is inline SVG (four polygons), so it inherits `currentColor`.
- Icons are inline SVG at 1.3–1.6 px stroke, `currentColor`.

## Known gaps

- **Gold CTA contrast**: white 16 px bold on `#AD891C` is 3.3:1 — passes AA for
  large text only, not for normal text. Kept for brand fidelity; to reach 4.5:1
  either darken the fill to ≈`#856813` or set the label in `--color-ink` (5.7:1).
- Header controls (language, programme, menu) are placeholders — no routes yet.
- The discover deck ends on a closing panel; the plan screen (`07 · Plan
  wieczoru`) is not built yet.
- No status bar: the Paper artboard is a device mock; the real app is a web page.
- Paper's `linear-gradient(in oklab …)` scrim is rebuilt in sRGB with identical
  stops (Safari/Chrome support for `in oklab` is still uneven).
