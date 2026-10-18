import { setRequestLocale } from "next-intl/server";
import { Search } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/routing";
import { BlurImage } from "@/components/ui/blur-image";
import {
  InfoActions,
  InfoFooter,
  InfoHero,
  InfoScreen,
  InfoSection,
  Prose,
} from "@/components/info/page";

export const dynamic = "force-dynamic";

type ApiArtistRef = {
  id: number;
  name: string;
  type: string;
  image_url: string | null;
};

type ApiArtist = ApiArtistRef & {
  biography: string | null;
  image_credit: string | null;
  upcoming_events: unknown[] | null;
};

const API_URL = process.env.API_URL ?? "http://localhost:8080";

async function getOrchestra(locale: string): Promise<ApiArtist | null> {
  try {
    const response = await fetch(`${API_URL}/api/v1/artists/1?lang=${locale}`, {
      next: { revalidate: 600 },
    });
    if (!response.ok) return null;
    const json = (await response.json()) as { data?: ApiArtist };
    return json.data ?? null;
  } catch {
    return null;
  }
}

async function getArtists(locale: string, q: string): Promise<ApiArtistRef[]> {
  try {
    const params = new URLSearchParams({ limit: "60", lang: locale });
    if (q) params.set("q", q);
    const response = await fetch(`${API_URL}/api/v1/artists?${params}`, {
      next: { revalidate: 600 },
    });
    if (!response.ok) return [];
    const json = (await response.json()) as { data?: ApiArtistRef[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

function excerpt(value: string | null, length = 420) {
  if (!value) return "";
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > length ? `${clean.slice(0, length).replace(/\s\S*$/, "")}…` : clean;
}

const TYPE_LABEL: Record<Locale, Record<string, string>> = {
  pl: {
    person: "Artysta",
    orchestra: "Orkiestra",
    ensemble: "Zespół",
  },
  en: {
    person: "Artist",
    orchestra: "Orchestra",
    ensemble: "Ensemble",
  },
  de: {
    person: "Künstler",
    orchestra: "Orchester",
    ensemble: "Ensemble",
  },
};

const C = {
  pl: {
    eyebrow: "Orkiestra i artyści",
    title: "Ludzie, którzy stoją za dźwiękiem.",
    lead: "Ponad 90 muzyków, dyrygenci i goście z całego świata. Każdy profil prowadzi do najbliższych wydarzeń.",
    sections: {
      orchestra: "Orkiestra",
      ensembles: "Zespoły kameralne",
      people: "Artyści",
      link: "Powiązania z wydarzeniami",
    },
    orchestraFacts: [
      { value: "1948", label: "Rok założenia" },
      { value: "90+", label: "Muzyków" },
      { value: "2023", label: "Gloria Artis" },
      { value: "2026", label: "Elbphilharmonie" },
    ],
    orchestraAction: "Historia orkiestry",
    orchestraProfile: "Profil orkiestry",
    ensembles: [
      "Karłowicz Quartet",
      "ÉxQuartet",
      "Szczecin International String Quartet",
      "FeelHarmony Quintet",
      "High Five Brass",
      "Szczecin Philharmonic Big Band",
      "Duo Con Fuoco",
    ],
    ensemblesNote:
      "Składy kameralne tworzą muzycy Orkiestry Symfonicznej. Występują w sali kameralnej i w holu.",
    searchLabel: "Szukaj po nazwisku",
    searchPlaceholder: "np. Maślanka, Neumann, Dworzyński",
    searchButton: "Szukaj",
    clear: "Wyczyść",
    empty: "Nie znaleźliśmy artysty o tym nazwisku. Spróbuj krótszej frazy.",
    resultCount: "{count} artystów",
    resultCountOne: "1 artysta",
    allNote:
      "Pokazujemy pierwszych 60 artystów w porządku alfabetycznym. Wpisz nazwisko, aby zawęzić listę.",
    linkBody: [
      "Każdy profil pokazuje najbliższe wydarzenia z udziałem artysty oraz utwory, które skomponował.",
      "Wydarzenia można też przeglądać po dacie, sali i cenie — cały repertuar jest w kalendarzu.",
    ],
    linkAction: "Repertuar",
    footerTitle: "Poznaj orkiestrę od środka.",
    footerBody:
      "Historia zespołu, nagrania i nagrody czekają w archiwum. Najbliższe koncerty — w repertuarze.",
    footerLinks: ["Historia", "Repertuar", "Planuj wizytę"],
  },
  en: {
    eyebrow: "Orchestra and artists",
    title: "The people behind the sound.",
    lead: "Over 90 musicians, conductors and guests from around the world. Every profile leads to upcoming events.",
    sections: {
      orchestra: "Orchestra",
      ensembles: "Chamber ensembles",
      people: "Artists",
      link: "Connections to events",
    },
    orchestraFacts: [
      { value: "1948", label: "Founded" },
      { value: "90+", label: "Musicians" },
      { value: "2023", label: "Gloria Artis" },
      { value: "2026", label: "Elbphilharmonie" },
    ],
    orchestraAction: "Orchestra history",
    orchestraProfile: "Orchestra profile",
    ensembles: [
      "Karłowicz Quartet",
      "ÉxQuartet",
      "Szczecin International String Quartet",
      "FeelHarmony Quintet",
      "High Five Brass",
      "Szczecin Philharmonic Big Band",
      "Duo Con Fuoco",
    ],
    ensemblesNote:
      "The chamber groups are formed by members of the symphony orchestra. They perform in the chamber hall and the foyer.",
    searchLabel: "Search by surname",
    searchPlaceholder: "e.g. Maślanka, Neumann, Dworzyński",
    searchButton: "Search",
    clear: "Clear",
    empty: "No artist with that surname. Try a shorter phrase.",
    resultCount: "{count} artists",
    resultCountOne: "1 artist",
    allNote:
      "Showing the first 60 artists alphabetically. Type a surname to narrow the list.",
    linkBody: [
      "Every profile lists the artist's upcoming events and the works they composed.",
      "Events can also be browsed by date, hall and price — the full programme is in the calendar.",
    ],
    linkAction: "Programme",
    footerTitle: "Meet the orchestra from the inside.",
    footerBody:
      "The ensemble's history, recordings and awards await in the archive. Upcoming concerts are in the programme.",
    footerLinks: ["History", "Programme", "Plan your visit"],
  },
  de: {
    eyebrow: "Orchester und Künstler",
    title: "Die Menschen hinter dem Klang.",
    lead: "Über 90 Musikerinnen und Musiker, Dirigenten und Gäste aus aller Welt. Jedes Profil führt zu den nächsten Veranstaltungen.",
    sections: {
      orchestra: "Orchester",
      ensembles: "Kammerensembles",
      people: "Künstler",
      link: "Verbindung zu Veranstaltungen",
    },
    orchestraFacts: [
      { value: "1948", label: "Gegründet" },
      { value: "90+", label: "Musiker" },
      { value: "2023", label: "Gloria Artis" },
      { value: "2026", label: "Elbphilharmonie" },
    ],
    orchestraAction: "Orchestergeschichte",
    orchestraProfile: "Orchesterprofil",
    ensembles: [
      "Karłowicz Quartet",
      "ÉxQuartet",
      "Szczecin International String Quartet",
      "FeelHarmony Quintet",
      "High Five Brass",
      "Szczecin Philharmonic Big Band",
      "Duo Con Fuoco",
    ],
    ensemblesNote:
      "Die Kammerensembles bestehen aus Mitgliedern des Sinfonieorchesters. Sie spielen im Kammermusiksaal und im Foyer.",
    searchLabel: "Nach Nachnamen suchen",
    searchPlaceholder: "z. B. Maślanka, Neumann, Dworzyński",
    searchButton: "Suchen",
    clear: "Löschen",
    empty: "Kein Künstler mit diesem Nachnamen. Versuchen Sie eine kürzere Eingabe.",
    resultCount: "{count} Künstler",
    resultCountOne: "1 Künstler",
    allNote:
      "Die ersten 60 Künstler in alphabetischer Reihenfolge. Geben Sie einen Nachnamen ein, um die Liste zu verengen.",
    linkBody: [
      "Jedes Profil zeigt die nächsten Veranstaltungen und die komponierten Werke.",
      "Veranstaltungen lassen sich auch nach Datum, Saal und Preis durchsuchen — das ganze Programm steht im Kalender.",
    ],
    linkAction: "Programm",
    footerTitle: "Lernen Sie das Orchester von innen kennen.",
    footerBody:
      "Geschichte, Aufnahmen und Auszeichnungen finden Sie im Archiv. Die nächsten Konzerte im Programm.",
    footerLinks: ["Geschichte", "Programm", "Besuch planen"],
  },
} as const;

export default async function ArtistsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const raw = await searchParams;
  setRequestLocale(locale);
  const c = C[(locale as Locale) in C ? (locale as Locale) : "pl"];
  const q = typeof raw.q === "string" ? raw.q.trim() : "";

  const [orchestra, artists] = await Promise.all([
    getOrchestra(locale),
    getArtists(locale, q),
  ]);

  const people = artists.filter((artist) => artist.type !== "orchestra");
  const labels = TYPE_LABEL[(locale as Locale) in TYPE_LABEL ? (locale as Locale) : "pl"];

  return (
    <InfoScreen>
      <InfoHero
        eyebrow={c.eyebrow}
        image="/photos/symphonic-1.jpg"
        imageAlt="Orkiestra w sali symfonicznej"
        lead={c.lead}
        title={c.title}
      />

      <InfoSection index="01" title={c.sections.orchestra}>
        {orchestra ? (
          <>
            <div className="flex flex-col gap-5 md:flex-row md:items-start">
              {orchestra.image_url ? (
                <BlurImage
                  alt=""
                  className="h-[220px] w-full shrink-0 rounded-[20px] md:h-[260px] md:w-[320px]"
                  src={orchestra.image_url}
                />
              ) : null}
              <div className="min-w-0">
                <h3 className="text-[24px] leading-[30px] font-bold tracking-[-0.03em]">
                  {orchestra.name}
                </h3>
                <p className="text-muted mt-3 text-[15px] leading-[23px]">
                  {excerpt(orchestra.biography)}
                </p>
                <InfoActions
                  items={[
                    { href: `/artists/${orchestra.id}`, label: c.orchestraProfile },
                    { href: "/history", label: c.orchestraAction },
                  ]}
                />
              </div>
            </div>
            <div className="mt-6">
              <dl className="border-line bg-line grid grid-cols-2 gap-px overflow-clip rounded-2xl border md:grid-cols-4">
                {c.orchestraFacts.map((fact) => (
                  <div className="bg-paper px-4 py-4" key={fact.label}>
                    <dt className="text-muted text-[10px] leading-[13px] font-medium tracking-[0.14em] uppercase">
                      {fact.label}
                    </dt>
                    <dd className="mt-1.5 text-[19px] leading-[24px] font-bold tracking-[-0.02em]">
                      {fact.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </>
        ) : (
          <p className="text-muted text-[15px] leading-[22px]">
            {c.sections.orchestra}
          </p>
        )}
      </InfoSection>

      <InfoSection index="02" title={c.sections.ensembles}>
        <div className="flex flex-wrap gap-2">
          {c.ensembles.map((name) => (
            <span
              className="border-line text-ink rounded-full border px-3.5 py-1.5 text-[13px] leading-[18px]"
              key={name}
            >
              {name}
            </span>
          ))}
        </div>
        <p className="text-muted mt-4 max-w-[560px] text-[14px] leading-[21px]">
          {c.ensemblesNote}
        </p>
      </InfoSection>

      <InfoSection index="03" title={c.sections.people}>
        <form className="mb-5" method="get">
          <label className="relative block max-w-[460px]">
            <span className="sr-only">{c.searchLabel}</span>
            <Search
              aria-hidden="true"
              className="text-muted pointer-events-none absolute top-1/2 left-4 -translate-y-1/2"
              size={16}
              strokeWidth={1.8}
            />
            <input
              className="border-line focus-visible:outline-gold h-12 w-full rounded-full border-[1.5px] bg-transparent pr-4 pl-11 text-[15px] focus-visible:outline-2 focus-visible:outline-offset-2"
              defaultValue={q}
              name="q"
              placeholder={c.searchPlaceholder}
              type="search"
            />
          </label>
          <div className="mt-2.5 flex items-center gap-4">
            <button
              className="bg-ink text-paper hover:bg-ink/85 focus-visible:outline-gold inline-flex h-10 items-center rounded-full px-4 text-[13px] font-bold focus-visible:outline-2 focus-visible:outline-offset-2"
              type="submit"
            >
              {c.searchButton}
            </button>
            {q ? (
              <Link
                className="text-muted text-[13px] underline underline-offset-4"
                href="/artists"
              >
                {c.clear}
              </Link>
            ) : null}
          </div>
        </form>

        <p className="text-muted mb-3 text-[13px] leading-[18px]">
          {q
            ? people.length === 1
              ? c.resultCountOne
              : c.resultCount.replace("{count}", String(people.length))
            : c.allNote}
        </p>

        {people.length === 0 ? (
          <p className="text-muted text-[15px] leading-[22px]">{c.empty}</p>
        ) : (
          <ul className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3">
            {people.map((artist) => (
              <li key={artist.id}>
                <Link
                  className="focus-visible:outline-gold group block focus-visible:outline-2 focus-visible:outline-offset-4"
                  href={`/artists/${artist.id}`}
                >
                  {artist.image_url ? (
                    <BlurImage
                      alt=""
                      className="aspect-[4/5] w-full rounded-[16px] transition-opacity group-hover:opacity-90"
                      src={artist.image_url}
                    />
                  ) : (
                    <div className="aspect-[4/5] w-full rounded-[16px] bg-[#E7E2D8]" />
                  )}
                  <p className="mt-2 text-[14px] leading-[19px] font-bold tracking-[-0.01em]">
                    {artist.name}
                  </p>
                  <p className="text-muted mt-0.5 text-[11px] leading-[15px] tracking-[0.1em] uppercase">
                    {labels[artist.type] ?? artist.type}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </InfoSection>

      <InfoSection index="04" title={c.sections.link}>
        <Prose>
          {c.linkBody.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </Prose>
        <InfoActions items={[{ href: "/calendar", label: c.linkAction }]} />
      </InfoSection>

      <InfoFooter
        body={c.footerBody}
        links={[
          { href: "/history", label: c.footerLinks[0] },
          { href: "/calendar", label: c.footerLinks[1] },
          { href: "/visit", label: c.footerLinks[2] },
        ]}
        title={c.footerTitle}
      />
    </InfoScreen>
  );
}
