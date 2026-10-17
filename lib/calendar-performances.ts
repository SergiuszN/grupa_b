import fs from "node:fs/promises";
import path from "node:path";

export type CalendarTerm = {
  id: string | number;
  eventId: number | null;
  day: string;
  time: string;
  category: "concerts" | "exhibitions" | "others";
  title: string;
  subtitle: string | null;
  image: string | null;
  venue: string | null;
  href: string | null;
  playable: boolean;
};

export type CalendarDay = {
  key: string;
  label: string;
  date: string;
};

type ApiPerformance = {
  id: number;
  starts_at: string;
  ticket_url: string | null;
  venue: { name: string } | null;
  event: {
    id: number;
    calendar_category: string | null;
    title: string;
    subtitle: string | null;
    image_url: string | null;
  };
};

type JsonFilePerformance = {
  starts_at: string;
  ticket_url: string | null;
};

type JsonFileEvent = {
  source_id: number;
  kind: string;
  calendar_filter: string | null;
  image_url: string | null;
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

function group(category: string | null): CalendarTerm["category"] {
  if (category === "concerts" || category === "exhibitions") return category;
  return "others";
}

function keyOf(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
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

export async function getCalendarData(
  locale: string,
  dayLabels: { today: string; tomorrow: string; inWeek: string },
): Promise<{ terms: CalendarTerm[]; days: CalendarDay[] }> {
  const todayKey = keyOf(new Date());

  // 1. Try remote API first with quick timeout
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);

    const response = await fetch(
      `${API_URL}/api/v1/performances?limit=200&lang=${locale}`,
      {
        next: { revalidate: 300 },
        signal: controller.signal,
      },
    );
    clearTimeout(timeout);

    if (response.ok) {
      const json = (await response.json()) as { data?: ApiPerformance[] };
      if (json.data && json.data.length > 0) {
        const terms: CalendarTerm[] = json.data.map((term) => {
          const startsAt = new Date(term.starts_at);

          return {
            id: term.id,
            eventId: term.event.id,
            day: keyOf(startsAt),
            time: new Intl.DateTimeFormat(locale, {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Europe/Warsaw",
            }).format(startsAt),
            category: group(term.event.calendar_category),
            title: term.event.title,
            subtitle: term.event.subtitle,
            image: term.event.image_url,
            venue: term.venue?.name ?? null,
            href: term.ticket_url,
            playable: group(term.event.calendar_category) === "concerts",
          };
        });

        const days = [...new Set(terms.map((term) => term.day))].sort().map((key) =>
          dayInfo(key, todayKey, locale, dayLabels),
        );

        return { terms, days };
      }
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

    for (let i = 0; i < perfs.length; i++) {
      const p = perfs[i];
      if (!p.starts_at) continue;

      const startsAt = new Date(p.starts_at);
      const category = group(ev.calendar_filter);

      terms.push({
        id: `${ev.source_id}-${i}`,
        eventId: ev.source_id,
        day: keyOf(startsAt),
        time: new Intl.DateTimeFormat(locale, {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Europe/Warsaw",
        }).format(startsAt),
        category,
        title: tr.title ?? "Wydarzenie",
        subtitle: tr.subtitle ?? null,
        image: ev.image_url ?? null,
        venue: ev.venue?.hall ?? tr.hall ?? null,
        href: p.ticket_url ?? null,
        playable: category === "concerts",
        timestamp: startsAt.getTime(),
      });
    }
  }

  // Sort terms chronologically
  terms.sort((a, b) => a.timestamp - b.timestamp);

  const days = [...new Set(terms.map((term) => term.day))].sort().map((key) =>
    dayInfo(key, todayKey, locale, dayLabels),
  );

  return { terms, days };
}
