import { getTranslations, setRequestLocale } from "next-intl/server";
import { CalendarList } from "@/components/calendar/calendar-list";
import { Screen } from "@/components/flow/screen";
import { getCalendarData } from "@/lib/calendar-performances";

export const dynamic = "force-dynamic";

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Calendar");

  const { terms, days } = await getCalendarData(locale, {
    today: t("today"),
    tomorrow: t("tomorrow"),
    inWeek: t("inWeek"),
  });

  return (
    <Screen>
      <CalendarList
        days={days}
        emptyLabel={terms.length === 0 ? t("unavailable") : t("empty")}
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
