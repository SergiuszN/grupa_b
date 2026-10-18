import { setRequestLocale } from "next-intl/server";
import { CalendarDays, MapPin } from "lucide-react";
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
    venue: { name: string } | null;
    price_min: number | null;
    price_max: number | null;
    ticket_url: string | null;
  }[];
};

const API_URL = process.env.API_URL ?? "http://localhost:8080";

async function getTours(locale: string): Promise<ApiEvent[]> {
  try {
    const response = await fetch(
      `${API_URL}/api/v1/events?kind=tour&limit=12&lang=${locale}`,
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
    eyebrow: "Zwiedzanie",
    title: "Zobacz budynek od środka.",
    lead: "Czterdzieści pięć minut, dwie sale i widok z czwartego piętra. W piątki, po polsku, angielsku i niemiecku.",
    sections: {
      route: "Trasa",
      dates: "Terminy",
      tickets: "Bilety i języki",
      groups: "Grupy i dostępność",
    },
    route: [
      "Zwiedzanie zaczyna się w holu i prowadzi przez obie sale koncertowe — symfoniczną i kameralną — oraz foyer z kręconymi schodami.",
      "Na końcu wchodzimy do Galerii Poziom 4., skąd widać miasto i całą bryłę budynku. Opowieść łączy architekturę z historią miejsca.",
    ],
    routeFacts: [
      { value: "40–45", label: "Minut" },
      { value: "2", label: "Sale" },
      { value: "4", label: "Poziom" },
      { value: "3", label: "Języki" },
    ],
    dates: "Najbliższe zwiedzania",
    empty: "Terminy zwiedzania pojawiają się w repertuarze — sprawdź kalendarz.",
    tickets: [
      "Zwiedzanie odbywa się w wybrane piątki po próbie generalnej: 13:00 po niemiecku, 14:00 po angielsku, 15:00 po polsku.",
      "Bilet normalny kosztuje 30 zł, ulgowy i grupowy 20 zł. Bilety kupisz online, w kasie i w biletomacie.",
      "Czasem zwiedzanie po polsku prowadzimy z tłumaczeniem na polski język migowy. Terminy oznaczone są w repertuarze.",
    ],
    ticketsFacts: [
      { value: "13:00", label: "Deutsch" },
      { value: "14:00", label: "English" },
      { value: "15:00", label: "Polski" },
      { value: "20–30 zł", label: "Bilet" },
    ],
    note: "Na zwiedzanie warto przyjść 5 minut wcześniej. Wejście od ul. Małopolskiej 48, zbiórka w holu.",
    groups: [
      "Grupy zorganizowane mogą zamówić zwiedzanie w innym terminie — napisz na zwiedzanie@filharmonia.szczecin.pl.",
      "Budynek jest dostępny dla osób z niepełnosprawnością ruchową: wejście bez barier, windy do wszystkich sal i galerii.",
    ],
    actions: {
      calendar: "Repertuar",
      write: "Zamów zwiedzanie",
      visit: "Planuj wizytę",
    },
    footerTitle: "Piątek po próbie generalnej.",
    footerBody:
      "O 13:00, 14:00 i 15:00. Bilety online, w kasie i w biletomacie.",
    footerLinks: ["Repertuar", "Budynek", "Planuj wizytę"],
  },
  en: {
    eyebrow: "Guided tours",
    title: "See the building from the inside.",
    lead: "Forty-five minutes, two halls and a view from the fourth floor. On Fridays, in Polish, English and German.",
    sections: {
      route: "Route",
      dates: "Dates",
      tickets: "Tickets and languages",
      groups: "Groups and access",
    },
    route: [
      "The tour starts in the foyer and leads through both concert halls — symphonic and chamber — and the foyer with its spiral staircase.",
      "It ends in the Level 4 Gallery, with a view over the city and the whole shape of the building. The story connects architecture with the history of the place.",
    ],
    routeFacts: [
      { value: "40–45", label: "Minutes" },
      { value: "2", label: "Halls" },
      { value: "4", label: "Level" },
      { value: "3", label: "Languages" },
    ],
    dates: "Upcoming tours",
    empty: "Tour dates appear in the programme — check the calendar.",
    tickets: [
      "Tours run on selected Fridays after the dress rehearsal: 1 pm in German, 2 pm in English, 3 pm in Polish.",
      "A standard ticket costs 30 PLN, concession and group 20 PLN. Tickets are available online, at the box office and at the machine.",
      "The Polish tour is sometimes interpreted into Polish Sign Language. Those dates are marked in the programme.",
    ],
    ticketsFacts: [
      { value: "1 pm", label: "Deutsch" },
      { value: "2 pm", label: "English" },
      { value: "3 pm", label: "Polski" },
      { value: "20–30 PLN", label: "Ticket" },
    ],
    note: "Please arrive 5 minutes early. Entrance from Małopolska 48, meeting point in the foyer.",
    groups: [
      "Organised groups can book a tour at another time — write to zwiedzanie@filharmonia.szczecin.pl.",
      "The building is accessible for wheelchair users: step-free entrance, lifts to every hall and gallery.",
    ],
    actions: {
      calendar: "Programme",
      write: "Book a tour",
      visit: "Plan your visit",
    },
    footerTitle: "Friday, after the dress rehearsal.",
    footerBody:
      "At 1, 2 and 3 pm. Tickets online, at the box office and at the machine.",
    footerLinks: ["Programme", "Building", "Plan your visit"],
  },
  de: {
    eyebrow: "Führungen",
    title: "Sehen Sie das Gebäude von innen.",
    lead: "Fünfundvierzig Minuten, zwei Säle und der Blick aus der vierten Etage. Freitags, auf Polnisch, Englisch und Deutsch.",
    sections: {
      route: "Route",
      dates: "Termine",
      tickets: "Tickets und Sprachen",
      groups: "Gruppen und Zugang",
    },
    route: [
      "Die Führung beginnt im Foyer und führt durch beide Konzertsäle — Sinfonie- und Kammermusiksaal — sowie das Foyer mit der Wendeltreppe.",
      "Zum Schluss geht es in die Galerie Ebene 4 mit Blick über die Stadt und auf die gesamte Gebäudeform. Die Erzählung verbindet Architektur und Geschichte des Ortes.",
    ],
    routeFacts: [
      { value: "40–45", label: "Minuten" },
      { value: "2", label: "Säle" },
      { value: "4", label: "Ebene" },
      { value: "3", label: "Sprachen" },
    ],
    dates: "Nächste Führungen",
    empty: "Führungstermine erscheinen im Programm — sehen Sie in den Kalender.",
    tickets: [
      "Führungen finden an ausgewählten Freitagen nach der Generalprobe statt: 13 Uhr Deutsch, 14 Uhr Englisch, 15 Uhr Polnisch.",
      "Ein Normalticket kostet 30 PLN, ermäßigt und für Gruppen 20 PLN. Tickets gibt es online, an der Kasse und am Automaten.",
      "Die polnische Führung wird manchmal in polnische Gebärdensprache übersetzt. Die Termine sind im Programm markiert.",
    ],
    ticketsFacts: [
      { value: "13 Uhr", label: "Deutsch" },
      { value: "14 Uhr", label: "English" },
      { value: "15 Uhr", label: "Polski" },
      { value: "20–30 PLN", label: "Ticket" },
    ],
    note: "Bitte kommen Sie 5 Minuten früher. Eingang Małopolska 48, Treffpunkt im Foyer.",
    groups: [
      "Organisierte Gruppen können eine Führung zu einem anderen Termin buchen — schreiben Sie an zwiedzanie@filharmonia.szczecin.pl.",
      "Das Gebäude ist für Rollstuhlfahrer zugänglich: stufenloser Eingang, Aufzüge zu allen Sälen und Galerien.",
    ],
    actions: {
      calendar: "Programm",
      write: "Führung buchen",
      visit: "Besuch planen",
    },
    footerTitle: "Freitag, nach der Generalprobe.",
    footerBody:
      "Um 13, 14 und 15 Uhr. Tickets online, an der Kasse und am Automaten.",
    footerLinks: ["Programm", "Gebäude", "Besuch planen"],
  },
} as const;

export default async function ToursPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const c = C[(locale as Locale) in C ? (locale as Locale) : "pl"];
  const tours = await getTours(locale);

  const when = (value: string) =>
    new Intl.DateTimeFormat(locale, {
      weekday: "long",
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
        image="/photos/foyer-4.jpg"
        imageAlt="Foyer Filharmonii"
        lead={c.lead}
        title={c.title}
      />

      <InfoSection index="01" title={c.sections.route}>
        <Prose>
          {c.route.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </Prose>
        <div className="mt-5">
          <InfoFacts items={[...c.routeFacts]} />
        </div>
      </InfoSection>

      <InfoSection index="02" title={c.sections.dates}>
        {tours.length === 0 ? (
          <p className="text-muted text-[15px] leading-[22px]">{c.empty}</p>
        ) : (
          <InfoList>
            {tours.map((tour) => {
              const first = tour.performances[0];
              const price =
                first?.price_min != null
                  ? `${first.price_min}${
                      first.price_max && first.price_max !== first.price_min
                        ? `–${first.price_max}`
                        : ""
                    } zł`
                  : null;
              return (
                <InfoCard
                  href={`/calendar/${eventSlug(tour.id, tour.title)}`}
                  icon={
                    <CalendarDays
                      aria-hidden="true"
                      size={18}
                      strokeWidth={1.7}
                    />
                  }
                  key={tour.id}
                  meta={[
                    first ? when(first.starts_at) : null,
                    first?.venue?.name ?? null,
                    price,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                  title={tour.title}
                />
              );
            })}
          </InfoList>
        )}
      </InfoSection>

      <InfoSection index="03" title={c.sections.tickets}>
        <Prose>
          {c.tickets.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </Prose>
        <div className="mt-5">
          <InfoFacts items={[...c.ticketsFacts]} />
        </div>
        <InfoNote>{c.note}</InfoNote>
        <InfoActions
          items={[
            { href: "/calendar", label: c.actions.calendar },
            {
              href: "mailto:zwiedzanie@filharmonia.szczecin.pl",
              label: c.actions.write,
              external: true,
            },
          ]}
        />
      </InfoSection>

      <InfoSection index="04" title={c.sections.groups}>
        <Prose>
          {c.groups.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </Prose>
        <InfoActions items={[{ href: "/visit", label: c.actions.visit }]} />
      </InfoSection>

      <InfoFooter
        body={c.footerBody}
        links={[
          { href: "/calendar", label: c.footerLinks[0] },
          { href: "/building", label: c.footerLinks[1] },
          { href: "/visit", label: c.footerLinks[2] },
        ]}
        title={c.footerTitle}
      />
    </InfoScreen>
  );
}
