import fs from "node:fs/promises";
import path from "node:path";
import type { CalendarEvent } from "@/components/calendar/calendar-list";

type ApiPerformance = {
  starts_at: string;
  ticket_url: string | null;
};

type ApiEvent = {
  id: number | null;
  kind: string;
  calendar_category: string | null;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  performances: ApiPerformance[];
};

type JsonFilePerformance = {
  starts_at: string;
  ticket_url: string | null;
};

type JsonFileEvent = {
  source_id: number | null;
  kind: string;
  calendar_filter: string | null;
  image_url: string | null;
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

function group(category: string | null): "concerts" | "exhibitions" | "others" {
  if (category === "concerts" || category === "exhibitions") return category;
  return "others";
}

function formatWhen(iso: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale, {
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Warsaw",
    }).format(new Date(iso));
  } catch {
    return "";
  }
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

export async function getCalendarEvents(locale: string): Promise<CalendarEvent[]> {
  // 1. Try fetching from live API if available
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);

    const response = await fetch(
      `${API_URL}/api/v1/events?limit=100&lang=${locale}`,
      {
        next: { revalidate: 300 },
        signal: controller.signal,
      },
    );
    clearTimeout(timeout);

    if (response.ok) {
      const json = (await response.json()) as { data?: ApiEvent[] };
      if (json.data && json.data.length > 0) {
        return json.data.map((event, index) => ({
          id: event.id ?? `api-${index}`,
          category: group(event.calendar_category),
          title: event.title,
          meta: [
            event.subtitle,
            event.performances[0]
              ? formatWhen(event.performances[0].starts_at, locale)
              : null,
          ]
            .filter(Boolean)
            .join(" · "),
          image: event.image_url,
          href: event.performances[0]?.ticket_url ?? null,
          playable: group(event.calendar_category) === "concerts",
        }));
      }
    }
  } catch {
    // API is offline or timed out; seamlessly fallback to local data
  }

  // 2. Fallback to rich local dataset
  const localEvents = await loadLocalEvents();

  return localEvents.map((event, index) => {
    const tr =
      event.translations?.[locale] ??
      event.translations?.pl ??
      event.translations?.en ??
      {};
    const firstPerf = event.performances?.[0];
    const when = firstPerf ? formatWhen(firstPerf.starts_at, locale) : null;
    const category = group(event.calendar_filter);

    // Ensure unique key even if source_id is null
    const id = event.source_id ?? `filharmonia-${index}`;

    return {
      id,
      category,
      title: tr.title ?? "Wydarzenie",
      meta: [tr.subtitle, when].filter(Boolean).join(" · "),
      image: event.image_url ?? null,
      href: firstPerf?.ticket_url ?? null,
      playable: category === "concerts",
    };
  });
}
