import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { eventSlug } from "@/lib/format";
import {
  InfoActions,
  InfoCard,
  InfoFooter,
  InfoFacts,
  InfoHero,
  InfoList,
  InfoNote,
  InfoScreen,
  InfoSection,
  Prose,
} from "@/components/info/page";

export const dynamic = "force-dynamic";

type ApiEvent = {
  id: number;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  performances: {
    starts_at: string;
    ends_at: string | null;
    venue: { name: string } | null;
    price_min: number | null;
    ticket_url: string | null;
  }[];
};

const API_URL = process.env.API_URL ?? "http://localhost:8080";

async function getExhibitions(locale: string): Promise<ApiEvent[]> {
  try {
    const response = await fetch(
      `${API_URL}/api/v1/events?kind=exhibition&limit=30&lang=${locale}`,
      { next: { revalidate: 300 } },
    );
    if (!response.ok) return [];
    const json = (await response.json()) as { data?: ApiEvent[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

const C = {
  pl: {
    eyebrow: "Wystawy",
    title: "Sztuka na najwyższym piętrze.",
    lead: "Dwie galerie, dwa różne temperamenty. Wystawy w sezonie 2026/2027 łączy hasło „Prześwit”.",
    sections: {
      galleries: "Galerie",
      now: "Aktualne i nadchodzące",
      current: "Teraz w galeriach",
      upcoming: "Nadchodzące",
      openings: "Wernisaże",
      visit: "Odwiedzanie",
    },
    galleries: [
      {
        title: "Galeria Poziom 4.",
        body: "Kulminacyjna przestrzeń budynku. Ascetyczna biel i duża plastyczność pozwalają pokazywać malarstwo, fotografię i działania interdyscyplinarne.",
      },
      {
        title: "Art.Room",
        body: "Mniejsza przestrzeń spotkań — wystawy, pokazy i projekty społeczne. Miejsce, w którym sztuka wchodzi w codzienność.",
      },
    ],
    now: "Wystawy otwarte i zapowiedziane",
    openings: "Wernisaże i spotkania",
    empty: "Nowe wystawy pojawią się tu wkrótce — zajrzyj do repertuaru.",
    facts: [
      { value: "2", label: "Galerie" },
      { value: "10 zł", label: "Bilet" },
      { value: "12–16", label: "Weekend" },
      { value: "0 zł", label: "Do 10 lat" },
    ],
    visitBody: [
      "Galerie są otwarte w soboty i niedziele 12:00–16:00, z ostatnim wejściem o 15:30. Bilet za 10 zł obejmuje obie przestrzenie.",
      "Dzieci do 10 lat i osoby z niepełnosprawnościami wchodzą bezpłatnie. Goście koncertów mogą odwiedzić galerie godzinę przed koncertem, w przerwie i pół godziny po nim.",
    ],
    note: "Bilet kupisz w kasie, biletomacie i online. Wystawy są dostępne także podczas zwiedzania budynku z przewodnikiem.",
    visitAction: "Planuj wizytę",
    toursAction: "Zwiedzanie",
    calendarAction: "Repertuar",
    footerTitle: "Zostań dłużej po koncercie.",
    footerBody:
      "Galerie są otwarte dla gości koncertów. Zajrzyj przed występem albo w przerwie.",
    footerLinks: ["Repertuar", "Zwiedzanie", "Planuj wizytę"],
  },
  en: {
    eyebrow: "Exhibitions",
    title: "Art on the top floor.",
    lead: "Two galleries, two temperaments. The 2026/2027 season exhibitions share the theme “Clearing”.",
    sections: {
      galleries: "Galleries",
      now: "Current and upcoming",
      current: "Now in the galleries",
      upcoming: "Upcoming",
      openings: "Openings",
      visit: "Visiting",
    },
    galleries: [
      {
        title: "Level 4 Gallery",
        body: "The building's culminating space. Ascetic white and great flexibility host painting, photography and interdisciplinary work.",
      },
      {
        title: "Art.Room",
        body: "A smaller meeting space — exhibitions, screenings and community projects. Where art enters everyday life.",
      },
    ],
    now: "Open and announced exhibitions",
    openings: "Openings and talks",
    empty: "New exhibitions will appear here soon — see the programme.",
    facts: [
      { value: "2", label: "Galleries" },
      { value: "10 PLN", label: "Ticket" },
      { value: "12–4 pm", label: "Weekend" },
      { value: "0 PLN", label: "Under 10" },
    ],
    visitBody: [
      "The galleries are open on Saturdays and Sundays from 12 noon to 4 pm, last entry at 3.30 pm. A 10 PLN ticket covers both spaces.",
      "Children under 10 and people with disabilities enter free. Concert guests can visit the galleries an hour before, during the interval and half an hour after the concert.",
    ],
    note: "Tickets are available at the box office, the ticket machine and online. The galleries are also part of the guided building tour.",
    visitAction: "Plan your visit",
    toursAction: "Guided tours",
    calendarAction: "Programme",
    footerTitle: "Stay a little longer after the concert.",
    footerBody:
      "The galleries are open to concert guests. Drop in before the performance or during the interval.",
    footerLinks: ["Programme", "Guided tours", "Plan your visit"],
  },
  de: {
    eyebrow: "Ausstellungen",
    title: "Kunst in der obersten Etage.",
    lead: "Zwei Galerien, zwei Temperamente. Die Ausstellungen der Saison 2026/2027 verbindet das Motto „Lichtung“.",
    sections: {
      galleries: "Galerien",
      now: "Aktuell und angekündigt",
      current: "Jetzt in den Galerien",
      upcoming: "Demnächst",
      openings: "Vernissagen",
      visit: "Besuch",
    },
    galleries: [
      {
        title: "Galerie Ebene 4",
        body: "Der krönende Raum des Gebäudes. Askhetisches Weiß und große Flexibilität für Malerei, Fotografie und interdisziplinäre Arbeiten.",
      },
      {
        title: "Art.Room",
        body: "Ein kleinerer Begegnungsraum — Ausstellungen, Vorführungen und soziale Projekte. Hier tritt Kunst in den Alltag.",
      },
    ],
    now: "Offene und angekündigte Ausstellungen",
    openings: "Vernissagen und Gespräche",
    empty: "Neue Ausstellungen erscheinen hier bald — sehen Sie ins Programm.",
    facts: [
      { value: "2", label: "Galerien" },
      { value: "10 PLN", label: "Ticket" },
      { value: "12–16", label: "Wochenende" },
      { value: "0 PLN", label: "Unter 10" },
    ],
    visitBody: [
      "Die Galerien sind Samstag und Sonntag von 12 bis 16 Uhr geöffnet, letzter Einlass 15.30 Uhr. Ein Ticket für 10 PLN gilt für beide Räume.",
      "Kinder unter 10 Jahren und Menschen mit Behinderung haben freien Eintritt. Konzertgäste können die Galerien eine Stunde vorher, in der Pause und eine halbe Stunde danach besuchen.",
    ],
    note: "Tickets gibt es an der Kasse, am Automaten und online. Die Galerien sind auch Teil der Gebäudeführung.",
    visitAction: "Besuch planen",
    toursAction: "Führungen",
    calendarAction: "Programm",
    footerTitle: "Bleiben Sie nach dem Konzert noch etwas.",
    footerBody:
      "Die Galerien stehen Konzertgästen offen. Kommen Sie vor der Vorstellung oder in der Pause.",
    footerLinks: ["Programm", "Führungen", "Besuch planen"],
  },
} as const;

export default async function ExhibitionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const c = C[(locale as Locale) in C ? (locale as Locale) : "pl"];
  const events = await getExhibitions(locale);

  const openings = events.filter((event) =>
    /wernisa/i.test(event.subtitle ?? ""),
  );

  // The same exhibition is listed once per opening weekend; merge those rows.
  const merged = new Map<string, ApiEvent>();
  for (const event of events) {
    if (/wernisa/i.test(event.subtitle ?? "")) continue;
    const key = event.title;
    const existing = merged.get(key);
    if (existing) {
      existing.performances = [...existing.performances, ...event.performances].sort(
        (a, b) => a.starts_at.localeCompare(b.starts_at),
      );
    } else {
      merged.set(key, { ...event, performances: [...event.performances] });
    }
  }
  const shows = [...merged.values()];

  const day = (value: string) =>
    new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Europe/Warsaw",
    }).format(new Date(value));

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Warsaw",
  }).format(new Date());

  const isCurrent = (event: ApiEvent) =>
    (event.performances[0]?.starts_at.slice(0, 10) ?? "") <= today;

  const currentShows = shows.filter(isCurrent);
  const upcomingShows = shows.filter((event) => !isCurrent(event));

  const range = (event: ApiEvent) => {
    const first = event.performances[0];
    const last = event.performances[event.performances.length - 1];
    if (!first) return null;
    const venue = first.venue?.name ?? null;
    const dates =
      last && last.starts_at !== first.starts_at
        ? `${day(first.starts_at)} – ${day(last.starts_at)}`
        : day(first.starts_at);
    return [dates, venue].filter(Boolean).join(" · ");
  };

  return (
    <InfoScreen>
      <InfoHero
        eyebrow={c.eyebrow}
        image="/photos/illumination-3.jpg"
        imageAlt="Iluminacja fasady Filharmonii"
        lead={c.lead}
        title={c.title}
      />

      <InfoSection index="01" title={c.sections.galleries}>
        <InfoList>
          {c.galleries.map((gallery) => (
            <div className="border-line border-b py-4" key={gallery.title}>
              <h3 className="text-[1.125rem] leading-[1.5rem] font-bold tracking-[-0.02em]">
                {gallery.title}
              </h3>
              <p className="text-muted mt-1.5 max-w-[560px] text-[0.875rem] leading-[1.3125rem]">
                {gallery.body}
              </p>
            </div>
          ))}
        </InfoList>
        <div className="mt-5">
          <InfoFacts items={[...c.facts]} />
        </div>
      </InfoSection>

      <InfoSection index="02" title={c.sections.now}>
        {shows.length === 0 ? (
          <p className="text-muted text-[0.9375rem] leading-[1.375rem]">{c.empty}</p>
        ) : (
          <div className="flex flex-col gap-6">
            {currentShows.length > 0 ? (
              <div>
                <p className="text-muted mb-1 text-[0.625rem] leading-[0.8125rem] font-medium tracking-[0.14em] uppercase">
                  {c.sections.current}
                </p>
                <InfoList>
                  {currentShows.map((event) => (
                    <InfoCard
                      href={`/calendar/${eventSlug(event.id, event.title)}`}
                      image={event.image_url}
                      key={event.id}
                      meta={range(event)}
                      title={event.title}
                    />
                  ))}
                </InfoList>
              </div>
            ) : null}

            {upcomingShows.length > 0 ? (
              <div>
                <p className="text-muted mb-1 text-[0.625rem] leading-[0.8125rem] font-medium tracking-[0.14em] uppercase">
                  {c.sections.upcoming}
                </p>
                <InfoList>
                  {upcomingShows.map((event) => (
                    <InfoCard
                      href={`/calendar/${eventSlug(event.id, event.title)}`}
                      image={event.image_url}
                      key={event.id}
                      meta={range(event)}
                      title={event.title}
                    />
                  ))}
                </InfoList>
              </div>
            ) : null}
          </div>
        )}
      </InfoSection>

      {openings.length > 0 ? (
        <InfoSection index="03" title={c.sections.openings}>
          <InfoList>
            {openings.map((event) => (
              <InfoCard
                href={`/calendar/${eventSlug(event.id, event.title)}`}
                image={event.image_url}
                key={event.id}
                meta={range(event)}
                title={event.title}
              />
            ))}
          </InfoList>
        </InfoSection>
      ) : null}

      <InfoSection index="04" title={c.sections.visit}>
        <Prose>
          {c.visitBody.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </Prose>
        <InfoNote>{c.note}</InfoNote>
        <InfoActions
          items={[
            { href: "/visit", label: c.visitAction },
            { href: "/tours", label: c.toursAction },
          ]}
        />
      </InfoSection>

      <InfoFooter
        body={c.footerBody}
        links={[
          { href: "/calendar", label: c.footerLinks[0] },
          { href: "/tours", label: c.footerLinks[1] },
          { href: "/visit", label: c.footerLinks[2] },
        ]}
        title={c.footerTitle}
      />
    </InfoScreen>
  );
}
