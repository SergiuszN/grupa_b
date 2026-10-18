import fs from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Clock,
  MapPin,
  Music,
  Music2,
  Sparkles,
  Ticket,
  UserRound,
  Users,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Screen } from "@/components/flow/screen";
import { PlayButton } from "@/components/calendar/play-button";
import { Link } from "@/i18n/routing";
import { CtaButton } from "@/components/ui";
import { eventIdFromSlug, eventSlug } from "@/lib/format";
import { previewFor } from "@/lib/events";

export const dynamic = "force-dynamic";

type ApiEventDetail = {
  id: number;
  kind: string;
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
  moods: string[] | null;
};

type ApiEventSummary = {
  id: number;
  calendar_category: string | null;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  performances: { starts_at: string; venue: { name: string } | null }[];
};

const API_URL = process.env.API_URL ?? "http://localhost:8080";

let cachedLocalEvents: any[] | null = null;

async function loadLocalEvents(): Promise<any[]> {
  if (cachedLocalEvents) return cachedLocalEvents;

  try {
    const filePath = path.join(process.cwd(), "data", "filharmonia_events.json");
    const raw = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    cachedLocalEvents = parsed.events ?? [];
    return cachedLocalEvents ?? [];
  } catch (err) {
    console.error("Failed to load local filharmonia_events.json:", err);
    return [];
  }
}

async function getEvent(id: string, locale: string): Promise<ApiEventDetail | null> {
  // 1. Try remote API with quick timeout
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);

    const response = await fetch(
      `${API_URL}/api/v1/events/${id}?lang=${locale}`,
      {
        next: { revalidate: 300 },
        signal: controller.signal,
      },
    );
    clearTimeout(timeout);

    if (response.ok) {
      const json = (await response.json()) as { data?: ApiEventDetail };
      if (json.data) return json.data;
    }
  } catch {
    // API is unreachable; proceed to fallback
  }

  // 2. Seamless fallback to local filharmonia_events.json
  const events = await loadLocalEvents();
  const ev = events.find((e: any) => String(e.source_id) === String(id));
  if (!ev) return null;

  const tr =
    ev.translations?.[locale] ??
    ev.translations?.pl ??
    ev.translations?.en ??
    {};

  const cat =
    ev.calendar_filter === "concerts" || ev.calendar_filter === "exhibitions"
      ? ev.calendar_filter
      : "others";

  return {
    id: ev.source_id,
    kind: ev.kind ?? (cat === "exhibitions" ? "exhibition" : cat === "concerts" ? "concert" : "other"),
    calendar_category: cat,
    title: tr.title ?? "Wydarzenie",
    subtitle: tr.subtitle ?? null,
    image_url: ev.image_url ?? null,
    duration_minutes: ev.duration_minutes ?? null,
    min_age: ev.min_age ?? null,
    description: tr.description ?? null,
    audience_note: tr.audience_note ?? null,
    performances: (ev.performances || []).map((p: any) => ({
      starts_at: p.starts_at,
      venue: tr.hall
        ? { name: tr.hall }
        : ev.venue?.hall
          ? { name: ev.venue.hall }
          : { name: "Filharmonia Szczecin" },
      ticket_url: p.ticket_url ?? null,
      price_min: p.price_min ?? null,
      price_max: p.price_max ?? null,
    })),
    artists: (ev.artists || []).map((a: any, idx: number) => ({
      id: idx + 1,
      name: a.name,
      role: a.roles?.[locale] ?? a.roles?.pl ?? a.role ?? null,
    })),
    works: (ev.works || []).map((w: any, idx: number) => ({
      id: idx + 1,
      title: w.title,
      composer: w.composer
        ? typeof w.composer === "string"
          ? { name: w.composer }
          : { name: w.composer.name ?? "" }
        : null,
    })),
    moods: ev.moods ?? null,
  };
}

async function fetchSimilar(params: URLSearchParams) {
  const response = await fetch(`${API_URL}/api/v1/events?${params}`, {
    next: { revalidate: 300 },
  });

  if (!response.ok) return [];

  const json = (await response.json()) as { data?: ApiEventSummary[] };
  return json.data ?? [];
}

async function getSimilar(event: ApiEventDetail, locale: string) {
  try {
    const base = new URLSearchParams({ limit: "6", lang: locale });
    if (event.calendar_category) base.set("category", event.calendar_category);

    const byMood = new URLSearchParams(base);
    for (const mood of event.moods?.slice(0, 2) ?? []) {
      byMood.append("mood", mood);
    }

    let data = byMood.toString() === base.toString() ? [] : await fetchSimilar(byMood);
    if (data.length === 0) data = await fetchSimilar(base);

    return data.filter((item) => item.id !== event.id).slice(0, 4);
  } catch {
    return [];
  }
}

function categoryKey(category: string | null) {
  if (category === "concerts" || category === "exhibitions") return category;
  return "others" as const;
}

/** Long descriptions read better in pairs of sentences. */
function paragraphsOf(text: string) {
  const sentences = text
    .split(
      /(?<!\bnp\.)(?<!\bm\.in\.)(?<!\bitp\.)(?<!\bitd\.)(?<!\btzn\.)(?<!\bprof\.)(?<!\bdr\.)(?<!\bśw\.)(?<!\bul\.)(?<=[.!?])\s+(?=[A-ZĄĆĘŁŃÓŚŹŻ„"«])/,
    )
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  if (sentences.length <= 2) return [text.trim()];

  const paragraphs: string[] = [];
  for (let i = 0; i < sentences.length; i += 2) {
    paragraphs.push(sentences.slice(i, i + 2).join(" "));
  }
  return paragraphs;
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const eventId = eventIdFromSlug(id);
  if (eventId === null) notFound();

  const [t, tc, event] = await Promise.all([
    getTranslations("EventDetail"),
    getTranslations("Calendar"),
    getEvent(String(eventId), locale),
  ]);

  if (!event) notFound();

  const similar = await getSimilar(event, locale);
  const dateFormat = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Warsaw",
  });

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
        <p className="text-gold text-[0.6875rem] leading-[0.875rem] font-medium tracking-[0.14em]">
          {tc(categoryKey(event.calendar_category))}
        </p>
        <div className="mt-1.5 flex items-start justify-between gap-3">
          <h1 className="min-w-0 flex-1 text-[2rem] leading-9 font-bold tracking-[-0.03em]">
            {event.title}
          </h1>
          {event.calendar_category === "concerts" ? (
            <div className="mt-1">
              <PlayButton
                label={t("play")}
                pauseLabel={t("pause")}
                src={previewFor(event.kind, event.id) ?? "/audio/mozart-40.mp3"}
              />
            </div>
          ) : null}
        </div>
        {event.subtitle ? (
          <p className="text-muted mt-2 text-[1rem] leading-6">
            {event.subtitle}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-1.5">
          {startsAt ? (
            <span className="border-line flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.75rem] leading-4">
              <CalendarDays aria-hidden="true" size={13} strokeWidth={1.7} />
              {startsAt}
            </span>
          ) : null}
          {performance?.venue ? (
            <span className="border-line flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.75rem] leading-4">
              <MapPin aria-hidden="true" size={13} strokeWidth={1.7} />
              {performance.venue.name}
            </span>
          ) : null}
          {event.duration_minutes ? (
            <span className="border-line flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.75rem] leading-4">
              <Clock aria-hidden="true" size={13} strokeWidth={1.7} />
              {t("duration", { count: event.duration_minutes })}
            </span>
          ) : null}
          {event.min_age ? (
            <span className="border-line flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.75rem] leading-4">
              <Users aria-hidden="true" size={13} strokeWidth={1.7} />
              {t("age", { age: event.min_age })}
            </span>
          ) : null}
        </div>
      </div>

      {event.description ? (
        <section className="flex flex-col gap-3 px-6 pt-6">
          {paragraphsOf(event.description).map((paragraph, index) => (
            <p className="text-[0.9375rem] leading-[1.4375rem]" key={index}>
              {paragraph}
            </p>
          ))}
        </section>
      ) : null}

      {event.works && event.works.length > 0 ? (
        <section className="px-6 pt-7">
          <h2 className="text-muted flex items-center gap-1.5 text-[0.6875rem] leading-[0.875rem] font-medium tracking-[0.14em]">
            <Music aria-hidden="true" size={13} strokeWidth={1.7} />
            {t("programme")}
          </h2>
          <ul className="mt-3 flex flex-col gap-3">
            {event.works.map((work) => (
              <li className="flex items-start gap-2.5" key={work.id}>
                <Music2
                  aria-hidden="true"
                  className="text-gold mt-0.5 shrink-0"
                  size={15}
                  strokeWidth={1.7}
                />
                <div>
                  <p className="text-[0.9375rem] leading-5 font-medium">{work.title}</p>
                  {work.composer?.name ? (
                    <p className="text-muted text-[0.8125rem] leading-4">
                      {work.composer.name}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {event.artists && event.artists.length > 0 ? (
        <section className="px-6 pt-7">
          <div className="bg-surface rounded-[20px] px-[18px] py-4">
            <h2 className="text-muted flex items-center gap-1.5 text-[0.6875rem] leading-[0.875rem] font-medium tracking-[0.14em]">
              <UserRound aria-hidden="true" size={13} strokeWidth={1.7} />
              {t("performers")}
            </h2>
            <ul className="mt-3 flex flex-col gap-2">
              {event.artists.map((artist) => (
                <li
                  className="flex items-start gap-2.5 text-[0.9375rem] leading-5"
                  key={artist.id}
                >
                  <UserRound
                    aria-hidden="true"
                    className="text-gold mt-0.5 shrink-0"
                    size={15}
                    strokeWidth={1.7}
                  />
                  <span>
                    {artist.name}
                    {artist.role ? (
                      <span className="text-muted"> — {artist.role}</span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {similar.length > 0 ? (
        <section className="px-6 pt-7">
          <h2 className="text-muted flex items-center gap-1.5 text-[0.6875rem] leading-[0.875rem] font-medium tracking-[0.14em]">
            <Sparkles aria-hidden="true" size={13} strokeWidth={1.7} />
            {t("similar")}
          </h2>
          <ul className="mt-3 flex flex-col">
            {similar.map((item) => {
              const first = item.performances[0];

              return (
                <li key={item.id}>
                  <Link
                    className="border-line hover:bg-surface focus-visible:outline-gold flex items-center gap-3.5 border-b py-3 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2"
                    href={`/calendar/${eventSlug(item.id, item.title)}`}
                  >
                    <div
                      className="size-14 shrink-0 overflow-clip rounded-xl bg-[#E7E2D8] bg-cover bg-[50%]"
                      style={
                        item.image_url
                          ? { backgroundImage: `url(${item.image_url})` }
                          : undefined
                      }
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <p className="text-[0.9375rem] leading-5 font-bold tracking-[-0.01em]">
                        {item.title}
                      </p>
                      <p className="text-muted text-[0.75rem] leading-4">
                        {first
                          ? [
                              dateFormat.format(new Date(first.starts_at)),
                              first.venue?.name,
                            ]
                              .filter(Boolean)
                              .join(" · ")
                          : item.subtitle}
                      </p>
                    </div>
                    <ChevronRight
                      aria-hidden="true"
                      className="text-muted shrink-0"
                      size={16}
                      strokeWidth={1.8}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <div className="flex-1" />

      <div className="border-line bg-paper/95 sticky bottom-0 mt-8 flex items-center gap-3 border-t px-6 py-3 backdrop-blur">
        <CtaButton
          aria-label={t("back")}
          href="/calendar"
          iconLeft={<ArrowLeft aria-hidden="true" size={20} strokeWidth={1.8} />}
          size="icon"
          variant="outline"
        />

        {tickets && !isFree ? (
          <CtaButton
            className="justify-between"
            flex1
            href={tickets}
            iconLeft={
              <span className="flex items-center gap-2">
                <Ticket aria-hidden="true" size={17} strokeWidth={1.8} />
                {t("buy")}
              </span>
            }
            rel="noreferrer"
            target="_blank"
            variant="primary"
          >
            <span>
              {price
                ? `${price === performance?.price_max ? "" : `${t("from")} `}${price} zł`
                : ""}
            </span>
          </CtaButton>
        ) : (
          <div className="border-line text-muted flex h-14 flex-1 items-center justify-center rounded-full border text-[0.9375rem] leading-5 font-medium">
            {isFree ? t("free") : t("unavailable")}
          </div>
        )}
      </div>
    </Screen>
  );
}
