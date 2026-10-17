import { getTranslations, setRequestLocale } from "next-intl/server";
import { CalendarList } from "@/components/calendar/calendar-list";
import { Screen } from "@/components/flow/screen";
import { getCalendarEvents } from "@/lib/calendar-events";

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Calendar");

  const events = await getCalendarEvents(locale);

  return (
    <Screen>
      <CalendarList
        emptyLabel={events.length === 0 ? t("unavailable") : t("empty")}
        events={events}
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
