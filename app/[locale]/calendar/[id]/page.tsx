import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  Ticket,
  Users,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Screen } from "@/components/flow/screen";
import { Link } from "@/i18n/routing";

export const dynamic = "force-dynamic";

type ApiEventDetail = {
  id: number;
  calendar_category: string | null;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  duration_minutes: number | null;
  min_age: number | null;
  description: string | null;
  audience_note: string | null;
  performances: {
    starts_at: string;
    venue: { name: string } | null;
    ticket_url: string | null;
    price_min: number | null;
    price_max: number | null;
  }[];
  artists: { id: number; name: string; role: string | null }[] | null;
  works:
    | { id: number; title: string; composer: { name: string } | null }[]
    | null;
};

const API_URL = process.env.API_URL ?? "http://localhost:8080";

async function getEvent(id: string, locale: string) {
  try {
    const response = await fetch(
      `${API_URL}/api/v1/events/${id}?lang=${locale}`,
      { next: { revalidate: 300 } },
    );

    if (!response.ok) return null;

    const json = (await response.json()) as { data?: ApiEventDetail };
    return json.data ?? null;
  } catch {
    return null;
  }
}

function categoryKey(category: string | null) {
  if (category === "concerts" || category === "exhibitions") return category;
  return "others" as const;
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const [t, tc, event] = await Promise.all([
    getTranslations("EventDetail"),
    getTranslations("Calendar"),
    getEvent(id, locale),
  ]);

  if (!event) notFound();

  const performance = event.performances[0];
  const startsAt = performance
    ? new Intl.DateTimeFormat(locale, {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Warsaw",
      }).format(new Date(performance.starts_at))
    : null;

  const price = performance?.price_min ?? null;
  const isFree = price === 0;
  const tickets = performance?.ticket_url ?? null;

  return (
    <Screen>
      {event.image_url ? (
        <div className="px-6 pt-3">
          <div
            className="h-[240px] rounded-[20px] bg-[#E7E2D8] bg-cover bg-[50%]"
            style={{ backgroundImage: `url(${event.image_url})` }}
          />
        </div>
      ) : null}

      <div className="px-6 pt-5">
        <p className="text-gold text-[11px] leading-[14px] font-medium tracking-[0.14em]">
          {tc(categoryKey(event.calendar_category))}
        </p>
        <h1 className="mt-1.5 text-[32px] leading-9 font-bold tracking-[-0.03em]">
          {event.title}
        </h1>
        {event.subtitle ? (
          <p className="text-muted mt-2 text-[16px] leading-6">
            {event.subtitle}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-1.5">
          {startsAt ? (
            <span className="border-line flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] leading-4">
              <CalendarDays aria-hidden="true" size={13} strokeWidth={1.7} />
              {startsAt}
            </span>
          ) : null}
          {performance?.venue ? (
            <span className="border-line flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] leading-4">
              <MapPin aria-hidden="true" size={13} strokeWidth={1.7} />
              {performance.venue.name}
            </span>
          ) : null}
          {event.duration_minutes ? (
            <span className="border-line flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] leading-4">
              <Clock aria-hidden="true" size={13} strokeWidth={1.7} />
              {t("duration", { count: event.duration_minutes })}
            </span>
          ) : null}
          {event.min_age ? (
            <span className="border-line flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] leading-4">
              <Users aria-hidden="true" size={13} strokeWidth={1.7} />
              {t("age", { age: event.min_age })}
            </span>
          ) : null}
        </div>
      </div>

      {event.description ? (
        <section className="px-6 pt-6">
          <p className="text-[15px] leading-[23px]">{event.description}</p>
        </section>
      ) : null}

      {event.works && event.works.length > 0 ? (
        <section className="px-6 pt-7">
          <h2 className="text-muted text-[11px] leading-[14px] font-medium tracking-[0.14em]">
            {t("programme")}
          </h2>
          <ul className="mt-3 flex flex-col gap-3">
            {event.works.map((work) => (
              <li key={work.id}>
                <p className="text-[15px] leading-5 font-medium">{work.title}</p>
                {work.composer?.name ? (
                  <p className="text-muted text-[13px] leading-4">
                    {work.composer.name}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {event.artists && event.artists.length > 0 ? (
        <section className="px-6 pt-7">
          <h2 className="text-muted text-[11px] leading-[14px] font-medium tracking-[0.14em]">
            {t("performers")}
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {event.artists.map((artist) => (
              <li className="text-[15px] leading-5" key={artist.id}>
                {artist.name}
                {artist.role ? (
                  <span className="text-muted"> — {artist.role}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="flex-1" />

      <div className="border-line bg-paper/95 sticky bottom-0 mt-8 flex items-center gap-3 border-t px-6 py-3 backdrop-blur">
        <Link
          aria-label={t("back")}
          className="border-ink text-ink hover:bg-surface focus-visible:outline-gold flex size-14 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-4"
          href="/calendar"
        >
          <ArrowLeft aria-hidden="true" size={20} strokeWidth={1.8} />
        </Link>

        {tickets && !isFree ? (
          <a
            className="bg-gold text-ink hover:bg-gold-deep focus-visible:outline-ink flex h-14 flex-1 items-center justify-between gap-3 rounded-full px-6 text-[15px] leading-5 font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4"
            href={tickets}
            rel="noreferrer"
            target="_blank"
          >
            <span className="flex items-center gap-2">
              <Ticket aria-hidden="true" size={17} strokeWidth={1.8} />
              {t("buy")}
            </span>
            <span>
              {price
                ? `${price === performance?.price_max ? "" : `${t("from")} `}${price} zł`
                : ""}
            </span>
          </a>
        ) : (
          <div className="border-line text-muted flex h-14 flex-1 items-center justify-center rounded-full border text-[15px] leading-5 font-medium">
            {isFree ? t("free") : t("unavailable")}
          </div>
        )}
      </div>
    </Screen>
  );
}
