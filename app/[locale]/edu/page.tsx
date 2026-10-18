import { setRequestLocale } from "next-intl/server";
import { Music, Users } from "lucide-react";
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
  performances: { starts_at: string; venue: { name: string } | null }[];
};

const API_URL = process.env.API_URL ?? "http://localhost:8080";

async function getEduEvents(locale: string): Promise<ApiEvent[]> {
  try {
    const response = await fetch(
      `${API_URL}/api/v1/events?category=edu&limit=8&lang=${locale}`,
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
    eyebrow: "EDUfilharmonia",
    title: "Muzyka, która tłumaczy się sama.",
    lead: "Warsztaty, koncerty rodzinne i poranki dla szkół. Od pierwszego roku życia do matury — i trochę dalej.",
    sections: {
      families: "Dla rodzin",
      schools: "Dla szkół",
      signup: "Zapisy i bilety",
      practical: "Praktyczne",
      upcoming: "Najbliższe",
    },
    families: [
      {
        title: "Raniutto",
        body: "Muzyczne warsztaty w soboty i niedziele dla dzieci od 1. do 6. roku życia z opiekunami. Trzy grupy: 9:00 (1–2 lata), 10:30 (3–4 lata), 12:00 (5–6 lat). Sobota i niedziela mają ten sam temat.",
      },
      {
        title: "Akademia Młodego Melomana",
        body: "Koncerty w sali symfonicznej dla dzieci od 5 lat. Orkiestra opowiada o instrumentach, a bajkowa narracja prowadzi przez świat dźwięków.",
      },
      {
        title: "EduWerwa",
        body: "Rodzinne spektakle muzyczne z orkiestrą i aktorami szczecińskich teatrów. Każdy koncert to osobna historia.",
      },
    ],
    schools: [
      {
        title: "Donuta",
        body: "Poniedziałkowe poranne koncerty kameralne dla przedszkolaków i młodszych uczniów w sali kameralnej.",
      },
      {
        title: "Koncerty szkolne",
        body: "Przedpołudniowe koncerty orkiestry w sali symfonicznej dla starszych klas. Miejsca nienumerowane.",
      },
      {
        title: "Dla nauczycieli",
        body: "Darmowe scenariusze lekcji do pobrania i materiały, które pozwalają przygotować klasę przed wizytą.",
      },
    ],
    signup: [
      "Grupy szkolne i przedszkola rezerwują wyłącznie przez formularz zgłoszeniowy — jedna rezerwacja to jedna klasa.",
      "Filharmonia potwierdza rezerwację w ciągu 14 dni. Ostateczną liczbę osób i płatność trzeba ustalić najpóźniej 7 dni przed koncertem.",
      "Grupa przychodzi 30 minut wcześniej i zgłasza się w kasie. Zwrotów nie ma, poza odwołaniem koncertu.",
    ],
    signupFacts: [
      { value: "30 zł", label: "Dziecko" },
      { value: "10 zł", label: "Dziecko z orzeczeniem" },
      { value: "1 zł", label: "Opiekun" },
      { value: "14 dni", label: "Potwierdzenie" },
    ],
    signupNote:
      "Zapisy na koncerty szkolne na luty–czerwiec 2027 ruszają 1 grudnia 2026. Formularz i terminy znajdziesz w repertuarze.",
    practical: [
      "Bilety dla dzieci na Raniutto trafiają do sprzedaży z miesięcznym wyprzedzeniem. Opiekunowie dokupują swoje bilety w kasie bezpośrednio przed warsztatami.",
      "Na koncerty rodzinne działa Szczecińska Karta Rodzinna. Bilety dla szkół muzycznych i na Kartę Rodzinną kupisz tylko w kasie.",
      "Wszystkie przestrzenie otwieramy godzinę przed wydarzeniem, salę — pół godziny przed. Na miejscu są przewijaki i miejsca dla wózków.",
    ],
    practicalFacts: [
      { value: "1–6", label: "Wiek na Raniutto" },
      { value: "5+", label: "Akademia" },
      { value: "9:00", label: "Pierwsza grupa" },
      { value: "12:00", label: "Ostatnia grupa" },
    ],
    upcoming: "Najbliższe wydarzenia EDU",
    empty: "Nowe wydarzenia EDU pojawią się tu wkrótce — zajrzyj do repertuaru.",
    footerTitle: "Zabierz klasę albo całą rodzinę.",
    footerBody:
      "Formularz zgłoszeniowy, terminy i ceny są w repertuarze. Pytania kieruj do kasy.",
    footerLinks: ["Repertuar", "Planuj wizytę", "Napisz do nas"],
    actions: {
      programme: "Repertuar EDU",
      visit: "Planuj wizytę",
      write: "Napisz do kasy",
    },
  },
  en: {
    eyebrow: "EDUphilharmonic",
    title: "Music that explains itself.",
    lead: "Workshops, family concerts and school mornings. From the first year of life to the final exam — and a little beyond.",
    sections: {
      families: "For families",
      schools: "For schools",
      signup: "Booking and tickets",
      practical: "Practical",
      upcoming: "Coming up",
    },
    families: [
      {
        title: "Raniutto",
        body: "Music workshops on Saturdays and Sundays for children aged 1–6 with their carers. Three groups: 9 am (1–2), 10.30 am (3–4), 12 noon (5–6). Saturday and Sunday share the same theme.",
      },
      {
        title: "Young Melomaniac Academy",
        body: "Concerts in the symphonic hall for children aged 5+. The orchestra introduces the instruments, and a storybook narration leads through the world of sound.",
      },
      {
        title: "EduWerwa",
        body: "Family music theatre with the orchestra and actors from Szczecin theatres. Every concert is a separate story.",
      },
    ],
    schools: [
      {
        title: "Donuta",
        body: "Monday morning chamber concerts for preschoolers and younger pupils in the chamber hall.",
      },
      {
        title: "School concerts",
        body: "Morning orchestra concerts in the symphonic hall for older classes. Unnumbered seats.",
      },
      {
        title: "For teachers",
        body: "Free lesson plans to download and materials that help prepare a class before the visit.",
      },
    ],
    signup: [
      "School groups and preschools book only through the online form — one booking, one class.",
      "The Philharmonic confirms a booking within 14 days. The final headcount and payment are due at least 7 days before the concert.",
      "Groups arrive 30 minutes early and check in at the box office. No refunds, unless the concert is cancelled.",
    ],
    signupFacts: [
      { value: "30 PLN", label: "Child" },
      { value: "10 PLN", label: "Child with certificate" },
      { value: "1 PLN", label: "Carer" },
      { value: "14 days", label: "Confirmation" },
    ],
    signupNote:
      "Booking for school concerts from February to June 2027 opens on 1 December 2026. The form and dates are in the programme.",
    practical: [
      "Raniutto tickets for children go on sale one month ahead. Carers buy their own tickets at the box office just before the workshop.",
      "The Szczecin Family Card applies to family concerts. Music-school and Family Card tickets are only available at the box office.",
      "All spaces open an hour before the event, the hall half an hour before. Baby-changing facilities and pram space are available.",
    ],
    practicalFacts: [
      { value: "1–6", label: "Raniutto age" },
      { value: "5+", label: "Academy" },
      { value: "9 am", label: "First group" },
      { value: "12 noon", label: "Last group" },
    ],
    upcoming: "Upcoming EDU events",
    empty: "New EDU events will appear here soon — see the programme.",
    footerTitle: "Bring a class or the whole family.",
    footerBody:
      "The booking form, dates and prices are in the programme. Questions go to the box office.",
    footerLinks: ["Programme", "Plan your visit", "Write to us"],
    actions: {
      programme: "EDU programme",
      visit: "Plan your visit",
      write: "Write to the box office",
    },
  },
  de: {
    eyebrow: "EDUphilharmonie",
    title: "Musik, die sich selbst erklärt.",
    lead: "Workshops, Familienkonzerte und Schulvormittage. Vom ersten Lebensjahr bis zum Abschluss — und ein Stück darüber hinaus.",
    sections: {
      families: "Für Familien",
      schools: "Für Schulen",
      signup: "Anmeldung und Tickets",
      practical: "Praktisches",
      upcoming: "Demnächst",
    },
    families: [
      {
        title: "Raniutto",
        body: "Musikworkshops am Samstag und Sonntag für Kinder von 1 bis 6 Jahren mit Begleitung. Drei Gruppen: 9 Uhr (1–2), 10.30 Uhr (3–4), 12 Uhr (5–6). Samstag und Sonntag haben dasselbe Thema.",
      },
      {
        title: "Akademie des jungen Melomanen",
        body: "Konzerte im Sinfoniesaal für Kinder ab 5 Jahren. Das Orchester stellt die Instrumente vor, eine märchenhafte Erzählung führt durch die Klangwelt.",
      },
      {
        title: "EduWerwa",
        body: "Musiktheater für Familien mit Orchester und Schauspielern Szczeciner Theater. Jedes Konzert ist eine eigene Geschichte.",
      },
    ],
    schools: [
      {
        title: "Donuta",
        body: "Montägliche Kammermusik am Morgen für Vorschulkinder und jüngere Schüler im Kammermusiksaal.",
      },
      {
        title: "Schulkonzerte",
        body: "Vormittägliche Orchesterkonzerte im Sinfoniesaal für ältere Klassen. Freie Platzwahl.",
      },
      {
        title: "Für Lehrkräfte",
        body: "Kostenlose Unterrichtsentwürfe und Materialien zur Vorbereitung der Klasse.",
      },
    ],
    signup: [
      "Schulgruppen und Kitas buchen ausschließlich über das Online-Formular — eine Anmeldung, eine Klasse.",
      "Die Philharmonie bestätigt die Buchung binnen 14 Tagen. Endgültige Teilnehmerzahl und Zahlung sind spätestens 7 Tage vor dem Konzert fällig.",
      "Gruppen kommen 30 Minuten früher und melden sich an der Kasse. Keine Erstattung, außer bei Absage des Konzerts.",
    ],
    signupFacts: [
      { value: "30 PLN", label: "Kind" },
      { value: "10 PLN", label: "Kind mit Ausweis" },
      { value: "1 PLN", label: "Begleitung" },
      { value: "14 Tage", label: "Bestätigung" },
    ],
    signupNote:
      "Die Anmeldung für Schulkonzerte von Februar bis Juni 2027 startet am 1. Dezember 2026. Formular und Termine stehen im Programm.",
    practical: [
      "Raniutto-Tickets für Kinder sind einen Monat im Voraus erhältlich. Begleitpersonen kaufen ihre Karten kurz vorher an der Kasse.",
      "Für Familienkonzerte gilt die Szczeciner Familienkarte. Karten für Musikschulen und die Familienkarte gibt es nur an der Kasse.",
      "Alle Räume öffnen eine Stunde vor der Veranstaltung, der Saal eine halbe Stunde vorher. Wickelräume und Platz für Kinderwagen sind vorhanden.",
    ],
    practicalFacts: [
      { value: "1–6", label: "Raniutto-Alter" },
      { value: "5+", label: "Akademie" },
      { value: "9 Uhr", label: "Erste Gruppe" },
      { value: "12 Uhr", label: "Letzte Gruppe" },
    ],
    upcoming: "Kommende EDU-Veranstaltungen",
    empty: "Neue EDU-Veranstaltungen erscheinen hier bald — sehen Sie ins Programm.",
    footerTitle: "Bringen Sie eine Klasse oder die ganze Familie.",
    footerBody:
      "Formular, Termine und Preise stehen im Programm. Fragen beantwortet die Kasse.",
    footerLinks: ["Programm", "Besuch planen", "Schreiben Sie uns"],
    actions: {
      programme: "EDU-Programm",
      visit: "Besuch planen",
      write: "An die Kasse schreiben",
    },
  },
} as const;

export default async function EduPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const c = C[(locale as Locale) in C ? (locale as Locale) : "pl"];
  const events = await getEduEvents(locale);

  const when = (value: string) =>
    new Intl.DateTimeFormat(locale, {
      weekday: "short",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Warsaw",
    }).format(new Date(value));

  return (
    <InfoScreen>
      <InfoHero
        eyebrow={c.eyebrow}
        image="/photos/chamber-1.jpg"
        imageAlt="Sala kameralna"
        lead={c.lead}
        title={c.title}
      />

      <InfoSection index="01" title={c.sections.families}>
        <InfoList>
          {c.families.map((item) => (
            <InfoCard
              external
              href="https://filharmonia.szczecin.pl/edu_filharmonia"
              icon={<Music aria-hidden="true" size={18} strokeWidth={1.7} />}
              key={item.title}
              meta={item.body}
              title={item.title}
            />
          ))}
        </InfoList>
      </InfoSection>

      <InfoSection index="02" title={c.sections.schools}>
        <InfoList>
          {c.schools.map((item) => (
            <InfoCard
              external
              href="https://filharmonia.szczecin.pl/edu_filharmonia"
              icon={<Users aria-hidden="true" size={18} strokeWidth={1.7} />}
              key={item.title}
              meta={item.body}
              title={item.title}
            />
          ))}
        </InfoList>
      </InfoSection>

      <InfoSection index="03" title={c.sections.signup}>
        <Prose>
          {c.signup.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </Prose>
        <div className="mt-5">
          <InfoFacts items={[...c.signupFacts]} />
        </div>
        <InfoNote>{c.signupNote}</InfoNote>
        <InfoActions
          items={[
            {
              href: "mailto:kasa@filharmonia.szczecin.pl",
              label: c.actions.write,
              external: true,
            },
            { href: "/calendar", label: c.actions.programme },
          ]}
        />
      </InfoSection>

      <InfoSection index="04" title={c.sections.practical}>
        <Prose>
          {c.practical.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </Prose>
        <div className="mt-5">
          <InfoFacts items={[...c.practicalFacts]} />
        </div>
      </InfoSection>

      <InfoSection index="05" title={c.sections.upcoming}>
        {events.length === 0 ? (
          <p className="text-muted text-[0.9375rem] leading-[1.375rem]">{c.empty}</p>
        ) : (
          <InfoList>
            {events.map((event) => {
              const first = event.performances[0];
              return (
                <InfoCard
                  href={`/calendar/${eventSlug(event.id, event.title)}`}
                  image={event.image_url}
                  key={event.id}
                  meta={[
                    first ? when(first.starts_at) : null,
                    first?.venue?.name ?? null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                  title={event.title}
                />
              );
            })}
          </InfoList>
        )}
      </InfoSection>

      <InfoFooter
        body={c.footerBody}
        links={[
          { href: "/calendar", label: c.footerLinks[0] },
          { href: "/visit", label: c.footerLinks[1] },
          {
            href: "mailto:kasa@filharmonia.szczecin.pl",
            label: c.footerLinks[2],
          },
        ]}
        title={c.footerTitle}
      />
    </InfoScreen>
  );
}
