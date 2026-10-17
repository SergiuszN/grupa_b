import { getTranslations, setRequestLocale } from "next-intl/server";
import { CalendarList, type CalendarEvent } from "@/components/calendar/calendar-list";
import { Screen } from "@/components/flow/screen";

type ApiPerformance = {
  starts_at: string;
  ticket_url: string | null;
};

type ApiEvent = {
  id: number;
  kind: string;
  calendar_category: string | null;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  performances: ApiPerformance[];
};

const API_URL = process.env.API_URL ?? "http://localhost:8080";

async function getEvents(locale: string): Promise<ApiEvent[]> {
  try {
    const response = await fetch(
      `${API_URL}/api/v1/events?limit=50&lang=${locale}`,
      { next: { revalidate: 300 } },
    );

    if (!response.ok) return [];

    const json = (await response.json()) as { data?: ApiEvent[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

function group(category: string | null): "concerts" | "exhibitions" | "others" {
  if (category === "concerts" || category === "exhibitions") return category;
  return "others";
}

function formatWhen(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Warsaw",
  }).format(new Date(iso));
}

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Calendar");

  const events = await getEvents(locale);

  const items: CalendarEvent[] = events.map((event) => ({
    id: event.id,
    category: group(event.calendar_category),
    title: event.title,
    meta: [event.subtitle, event.performances[0] ? formatWhen(event.performances[0].starts_at, locale) : null]
      .filter(Boolean)
      .join(" · "),
    image: event.image_url,
    href: event.performances[0]?.ticket_url ?? null,
    playable: group(event.calendar_category) === "concerts",
  }));

  return (
    <Screen>
      <CalendarList
        emptyLabel={events.length === 0 ? t("unavailable") : t("empty")}
        events={items}
        labels={{
          all: t("all"),
          concerts: t("concerts"),
          exhibitions: t("exhibitions"),
          others: t("others"),
          details: t("details"),
          footnote: t("footnote"),
        }}
      />
    </Screen>
  );
}
