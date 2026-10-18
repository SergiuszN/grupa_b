import fs from "node:fs/promises";
import path from "node:path";

export type VenueGroup = "symphony" | "chamber" | "galleries" | "outside";

export type CalendarAudience = {
  slug: string;
  minAge: number | null;
  maxAge: number | null;
};

export type CalendarTerm = {
  id: string | number;
  eventId: number | null;
  day: string;
  endDay: string | null;
  time: string;
  kind: string;
  title: string;
  subtitle: string | null;
  image: string | null;
  venue: string | null;
  venueGroup: VenueGroup;
  href: string | null;
  playable: boolean;
  ticketStatus: string;
  priceMin: number | null;
  duration: number | null;
  minAge: number | null;
  maxAge: number | null;
  audiences: CalendarAudience[];
  moods: string[];
  accessibility: string[];
  series: string[];
  people: string[];
};

export type CalendarDay = {
  key: string;
  label: string;
  date: string;
};

type ApiAudience = { slug: string; min_age: number | null; max_age: number | null };

type ApiPerformance = {
  id: number;
  starts_at: string;
  ends_at: string | null;
  ticket_url: string | null;
  ticket_status: string;
  price_min: number | null;
  venue: { slug: string; name: string } | null;
  event: {
    id: number;
    kind: string;
    calendar_category: string | null;
    title: string;
    subtitle: string | null;
    image_url: string | null;
    duration_minutes: number | null;
    min_age: number | null;
    max_age: number | null;
  };
  facets?: {
    audiences: ApiAudience[];
    moods: string[];
    accessibility: string[];
    series: string[];
    people: string[];
  };
};

type JsonFilePerformance = {
  starts_at: string;
  ends_at: string | null;
  ticket_url: string | null;
  ticket_status: string;
  price_min: number | null;
};

type JsonFileEvent = {
  source_id: number;
  kind: string;
  calendar_filter: string | null;
  image_url: string | null;
  duration_minutes: number | null;
  min_age: number | null;
  max_age: number | null;
  audiences?: string[];
  accessibility?: { type: string; status: string }[];
  series?: { name: string; names?: Record<string, string> }[];
  artists?: { name: string }[];
  works?: { composer: string | null }[];
  venue?: {
    hall?: string | null;
  } | null;
  translations?: Record<
    string,
    {
      title?: string;
      subtitle?: string | null;
      description?: string | null;
      hall?: string | null;
    }
  >;
  performances?: JsonFilePerformance[];
};

const API_URL = process.env.API_URL ?? "http://localhost:8080";
const PAGE_SIZE = 200;

function venueGroup(name: string | null | undefined): VenueGroup {
  const value = name?.toLowerCase() ?? "";
  if (!value) return "outside";
  if (value.includes("foyer")) return "galleries";
  if (value.includes("symfon")) return "symphony";
  if (value.includes("kameral")) return "chamber";
  return "galleries";
}

function isAccessible(status: string) {
  return status === "available" || status === "partial";
}

function keyOf(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Warsaw",
  }).format(date);
}

/** Today's calendar day in Warsaw, YYYY-MM-DD. */
export function todayKey() {
  return keyOf(new Date());
}

function timeOf(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Warsaw",
  }).format(date);
}

function capitalise(value: string) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function dayInfo(
  key: string,
  todayKey: string,
  locale: string,
  labels: { today: string; tomorrow: string; inWeek: string },
): CalendarDay {
  const day = new Date(`${key}T12:00:00Z`);
  const diff = Math.round(
    (Date.parse(`${key}T12:00:00Z`) - Date.parse(`${todayKey}T12:00:00Z`)) /
      86_400_000,
  );

  const weekday = new Intl.DateTimeFormat(locale, {
    weekday: "long",
  }).format(day);
  const full = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(day);

  let label: string;

  if (diff === 0) label = labels.today;
  else if (diff === 1) label = labels.tomorrow;
  else if (diff === 7) label = labels.inWeek;
  else if (diff > 1 && diff < 7) label = capitalise(weekday);
  else
    label = capitalise(
      new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "long",
      }).format(day),
    );

  return { key, label, date: capitalise(full) };
}

let cachedLocalEvents: JsonFileEvent[] | null = null;

async function loadLocalEvents(): Promise<JsonFileEvent[]> {
  if (cachedLocalEvents) return cachedLocalEvents;

  try {
    const filePath = path.join(process.cwd(), "data", "filharmonia_events.json");
    const raw = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(raw) as { events?: JsonFileEvent[] };
    cachedLocalEvents = parsed.events ?? [];
    return cachedLocalEvents;
  } catch (err) {
    console.error("Failed to load local filharmonia_events.json:", err);
    return [];
  }
}

async function fetchPerformances(locale: string, signal: AbortSignal) {
  const all: ApiPerformance[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const response = await fetch(
      `${API_URL}/api/v1/performances?limit=${PAGE_SIZE}&offset=${offset}&lang=${locale}`,
      { next: { revalidate: 300 }, signal },
    );
    if (!response.ok) return all;
    const json = (await response.json()) as {
      data?: ApiPerformance[];
      meta?: { total: number };
    };
    all.push(...(json.data ?? []));
    if (!json.data?.length || all.length >= (json.meta?.total ?? 0)) return all;
  }
}

function withDays(
  terms: CalendarTerm[],
  locale: string,
  dayLabels: { today: string; tomorrow: string; inWeek: string },
) {
  const today = todayKey();
  const days = [...new Set(terms.map((term) => term.day))].sort().map((key) =>
    dayInfo(key, today, locale, dayLabels),
  );
  return { terms, days };
}

export async function getCalendarData(
  locale: string,
  dayLabels: { today: string; tomorrow: string; inWeek: string },
): Promise<{ terms: CalendarTerm[]; days: CalendarDay[] }> {
  // 1. Try remote API first with quick timeout
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);
    const data = await fetchPerformances(locale, controller.signal);
    clearTimeout(timeout);

    if (data.length > 0) {
      const terms: CalendarTerm[] = data.map((term) => {
        const startsAt = new Date(term.starts_at);
        const facets = term.facets;

        return {
          id: term.id,
          eventId: term.event.id,
          day: keyOf(startsAt),
          endDay: term.ends_at ? keyOf(new Date(term.ends_at)) : null,
          time: timeOf(startsAt, locale),
          kind: term.event.kind,
          title: term.event.title,
          subtitle: term.event.subtitle,
          image: term.event.image_url,
          venue: term.venue?.name ?? null,
          venueGroup: venueGroup(term.venue?.name),
          href: term.ticket_url,
          playable: term.event.calendar_category === "concerts",
          ticketStatus: term.ticket_status,
          priceMin: term.price_min,
          duration: term.event.duration_minutes,
          minAge: term.event.min_age,
          maxAge: term.event.max_age,
          audiences: (facets?.audiences ?? []).map((a) => ({
            slug: a.slug,
            minAge: a.min_age,
            maxAge: a.max_age,
          })),
          moods: facets?.moods ?? [],
          accessibility: facets?.accessibility ?? [],
          series: facets?.series ?? [],
          people: facets?.people ?? [],
        };
      });

      return withDays(terms, locale, dayLabels);
    }
  } catch {
    // API is unreachable; proceed seamlessly to fallback
  }

  // 2. Reliable fallback from local filharmonia_events.json
  const events = await loadLocalEvents();
  const terms: (CalendarTerm & { timestamp: number })[] = [];

  for (const ev of events) {
    const tr =
      ev.translations?.[locale] ??
      ev.translations?.pl ??
      ev.translations?.en ??
      {};
    const perfs = ev.performances ?? [];
    const hall = ev.venue?.hall ?? null;
    const people = [
      ...new Set([
        ...(ev.artists ?? []).map((a) => a.name),
        ...(ev.works ?? []).flatMap((w) => (w.composer ? [w.composer] : [])),
      ]),
    ];

    for (let i = 0; i < perfs.length; i++) {
      const p = perfs[i];
      if (!p.starts_at) continue;

      const startsAt = new Date(p.starts_at);

      terms.push({
        id: `${ev.source_id}-${i}`,
        eventId: ev.source_id,
        day: keyOf(startsAt),
        endDay: p.ends_at ? keyOf(new Date(p.ends_at)) : null,
        time: timeOf(startsAt, locale),
        kind: ev.kind,
        title: tr.title ?? "Wydarzenie",
        subtitle: tr.subtitle ?? null,
        image: ev.image_url ?? null,
        venue: hall ?? tr.hall ?? null,
        venueGroup: venueGroup(hall),
        href: p.ticket_url ?? null,
        playable: ev.calendar_filter === "concerts",
        ticketStatus: p.ticket_status,
        priceMin: p.price_min,
        duration: ev.duration_minutes,
        minAge: ev.min_age,
        maxAge: ev.max_age,
        audiences: (ev.audiences ?? []).map((slug) => ({
          slug,
          minAge: ev.min_age,
          maxAge: ev.max_age,
        })),
        moods: [],
        accessibility: (ev.accessibility ?? [])
          .filter((a) => isAccessible(a.status))
          .map((a) => a.type),
        series: (ev.series ?? []).map((s) => s.names?.[locale] ?? s.name),
        people,
        timestamp: startsAt.getTime(),
      });
    }
  }

  // Sort terms chronologically
  terms.sort((a, b) => a.timestamp - b.timestamp);

  return withDays(terms, locale, dayLabels);
}
