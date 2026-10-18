import { useTranslations } from "next-intl";
import { InfoScreen } from "@/components/info/page";

export default function CalendarLoading() {
  const t = useTranslations("Calendar");

  return (
    <InfoScreen>
      <section className="px-6 pt-8 pb-10 md:pt-14">
        <p className="text-muted text-body" role="status">
          {t("loading")}
        </p>
        <div aria-hidden="true" className="mt-6 flex flex-col gap-4">
          {[0, 1, 2].map((index) => (
            <div
              className="border-line flex gap-4 rounded-2xl border p-4"
              key={index}
            >
              <div className="bg-surface size-20 shrink-0 rounded-xl" />
              <div className="flex flex-1 flex-col gap-3 py-2">
                <div className="bg-surface h-5 w-3/4 rounded" />
                <div className="bg-surface h-4 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </InfoScreen>
  );
}
