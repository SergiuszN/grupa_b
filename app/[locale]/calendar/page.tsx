import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  CalendarList,
  type CalendarDay,
  type CalendarTerm,
} from "@/components/calendar/calendar-list";
import { Screen } from "@/components/flow/screen";

export const dynamic = "force-dynamic";

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

const API_URL = process.env.API_URL ?? "http://localhost:8080";

async function getPerformances(locale: string): Promise<ApiPerformance[]> {
  try {
    const response = await fetch(
      `${API_URL}/api/v1/performances?limit=200&lang=${locale}`,
      { next: { revalidate: 300 } },
    );

    if (!response.ok) return [];

    const json = (await response.json()) as { data?: ApiPerformance[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

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

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Calendar");

  const performances = await getPerformances(locale);
  const todayKey = keyOf(new Date());

  const terms: CalendarTerm[] = performances.map((term) => {
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
    dayInfo(key, todayKey, locale, {
      today: t("today"),
      tomorrow: t("tomorrow"),
      inWeek: t("inWeek"),
    }),
  );

  return (
    <Screen>
      <CalendarList
        days={days}
        emptyLabel={performances.length === 0 ? t("unavailable") : t("empty")}
        labels={{
          all: t("all"),
          concerts: t("concerts"),
          exhibitions: t("exhibitions"),
          others: t("others"),
          details: t("details"),
          footnote: t("footnote"),
        }}
        terms={terms}
      />
    </Screen>
  );
}
