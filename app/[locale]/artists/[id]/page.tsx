import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ArrowLeft, Music } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/routing";
import { eventSlug } from "@/lib/format";
import { BlurImage } from "@/components/ui/blur-image";
import {
  InfoActions,
  InfoCard,
  InfoFooter,
  InfoList,
  InfoScreen,
  InfoSection,
  Prose,
} from "@/components/info/page";

export const dynamic = "force-dynamic";

type ApiArtist = {
  id: number;
  name: string;
  type: string;
  image_url: string | null;
  image_credit: string | null;
  biography: string | null;
  roles: string[] | null;
  events: {
    id: number;
    title: string;
    subtitle: string | null;
    image_url: string | null;
    performances: { starts_at: string; venue: { name: string } | null }[];
  }[];
  works: { id: number; title: string }[];
};

const API_URL = process.env.API_URL ?? "http://localhost:8080";

async function getArtist(id: string, locale: string): Promise<ApiArtist | null> {
  try {
    const response = await fetch(
      `${API_URL}/api/v1/artists/${id}?lang=${locale}`,
      { next: { revalidate: 600 } },
    );
    if (!response.ok) return null;
    const json = (await response.json()) as { data?: ApiArtist };
    return json.data ?? null;
  } catch {
    return null;
  }
}

const TYPE_LABEL: Record<Locale, Record<string, string>> = {
  pl: { person: "Artysta", orchestra: "Orkiestra", ensemble: "Zespół" },
  en: { person: "Artist", orchestra: "Orchestra", ensemble: "Ensemble" },
  de: { person: "Künstler", orchestra: "Orchester", ensemble: "Ensemble" },
};

const ROLE_LABEL: Record<Locale, Record<string, string>> = {
  pl: {
    performer: "Wykonawca",
    conductor: "Dyrygent",
    soloist: "Solista",
    composer: "Kompozytor",
    director: "Dyrektor",
    choir: "Chór",
  },
  en: {
    performer: "Performer",
    conductor: "Conductor",
    soloist: "Soloist",
    composer: "Composer",
    director: "Director",
    choir: "Choir",
  },
  de: {
    performer: "Ausführender",
    conductor: "Dirigent",
    soloist: "Solist",
    composer: "Komponist",
    director: "Direktor",
    choir: "Chor",
  },
};

const C = {
  pl: {
    back: "Wszyscy artyści",
    bio: "Biografia",
    events: "Najbliższe wydarzenia",
    works: "Skomponowane utwory",
    noEvents: "Brak zaplanowanych wydarzeń. Zajrzyj do repertuaru — lista rośnie.",
    noWorks: "Ten artysta nie ma w katalogu skomponowanych utworów.",
    calendar: "Repertuar",
    contacts: "Orkiestra i artyści",
    footerTitle: "Zobacz, kiedy zagra.",
    footerBody:
      "Najbliższe terminy z udziałem tego artysty są w kalendarzu. Bilety kupisz online.",
    footerLinks: ["Repertuar", "Wszyscy artyści", "Planuj wizytę"],
  },
  en: {
    back: "All artists",
    bio: "Biography",
    events: "Upcoming events",
    works: "Composed works",
    noEvents: "No scheduled events. See the programme — the list keeps growing.",
    noWorks: "This artist has no composed works in the catalogue.",
    calendar: "Programme",
    contacts: "Orchestra and artists",
    footerTitle: "See when they perform.",
    footerBody:
      "Upcoming dates with this artist are in the calendar. Tickets are available online.",
    footerLinks: ["Programme", "All artists", "Plan your visit"],
  },
  de: {
    back: "Alle Künstler",
    bio: "Biografie",
    events: "Nächste Veranstaltungen",
    works: "Komponierte Werke",
    noEvents: "Keine geplanten Veranstaltungen. Sehen Sie ins Programm — die Liste wächst.",
    noWorks: "Für diesen Künstler sind keine komponierten Werke im Katalog.",
    calendar: "Programm",
    contacts: "Orchester und Künstler",
    footerTitle: "Sehen Sie, wann er oder sie spielt.",
    footerBody:
      "Die nächsten Termine mit diesem Künstler stehen im Kalender. Tickets gibt es online.",
    footerLinks: ["Programm", "Alle Künstler", "Besuch planen"],
  },
} as const;

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const c = C[(locale as Locale) in C ? (locale as Locale) : "pl"];
  const labels = TYPE_LABEL[(locale as Locale) in TYPE_LABEL ? (locale as Locale) : "pl"];
  const artist = await getArtist(id, locale);

  if (!artist) notFound();

  const paragraphs = (artist.biography ?? "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const when = (value: string) =>
    new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Warsaw",
    }).format(new Date(value));

  return (
    <InfoScreen>
      <div className="px-6 pt-5">
        <Link
          className="text-muted hover:text-ink focus-visible:outline-gold inline-flex items-center gap-1.5 text-[0.8125rem] font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
          href="/artists"
        >
          <ArrowLeft aria-hidden="true" size={15} strokeWidth={1.8} />
          {c.back}
        </Link>
      </div>

      <header className="px-6 pt-6 pb-4 md:pt-8">
        <div className="md:flex md:items-start md:gap-10">
          {artist.image_url ? (
            <BlurImage
              alt={artist.name}
              className="aspect-[4/5] w-full max-w-[320px] shrink-0 rounded-[24px]"
              priority
              src={artist.image_url}
            />
          ) : null}
          <div className="mt-5 min-w-0 md:mt-0 md:pt-2">
            <p className="text-gold text-[0.6875rem] leading-[0.875rem] font-medium tracking-[0.16em] uppercase">
              {labels[artist.type] ?? artist.type}
            </p>
            <h1 className="mt-2 max-w-[620px] text-[2.25rem] leading-[2.5rem] font-bold tracking-[-0.035em] md:text-[3.25rem] md:leading-[3.5rem]">
              {artist.name}
            </h1>
            {artist.roles && artist.roles.length > 0 ? (
              <p className="text-muted mt-3 max-w-[520px] text-[0.9375rem] leading-[1.375rem]">
                {artist.roles
                  .map((role) => labels[role] ?? role)
                  .join(" · ")}
              </p>
            ) : null}
            <InfoActions items={[{ href: "/calendar", label: c.calendar }]} />
          </div>
        </div>
      </header>

      {paragraphs.length > 0 ? (
        <InfoSection index="01" title={c.bio}>
          <Prose>
            {paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </Prose>
        </InfoSection>
      ) : null}

      <InfoSection index="02" title={c.events}>
        {artist.events.length === 0 ? (
          <p className="text-muted text-[0.9375rem] leading-[1.375rem]">{c.noEvents}</p>
        ) : (
          <InfoList>
            {artist.events.slice(0, 8).map((event) => {
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

      {artist.works.length > 0 ? (
        <InfoSection index="03" title={c.works}>
          <ul className="flex flex-col">
            {artist.works.map((work) => (
              <li
                className="border-line flex items-start gap-3 border-b py-3"
                key={work.id}
              >
                <Music
                  aria-hidden="true"
                  className="text-gold mt-0.5 shrink-0"
                  size={15}
                  strokeWidth={1.7}
                />
                <span className="text-[0.9375rem] leading-[1.3125rem]">{work.title}</span>
              </li>
            ))}
          </ul>
        </InfoSection>
      ) : null}

      <InfoFooter
        body={c.footerBody}
        links={[
          { href: "/calendar", label: c.footerLinks[0] },
          { href: "/artists", label: c.footerLinks[1] },
          { href: "/visit", label: c.footerLinks[2] },
        ]}
        title={c.footerTitle}
      />
    </InfoScreen>
  );
}
