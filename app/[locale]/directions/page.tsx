import { Car, Clock, MapPin, Ticket } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { FlowArrows, FlowSteps, INFO_FLOW } from "@/components/flow/flow-nav";
import { Screen } from "@/components/flow/screen";
import { VenueMap } from "@/components/directions/venue-map";

const LEGEND = [
  { color: "bg-gold", key: "legend1" },
  { color: "bg-ink", key: "legend2" },
  { color: "bg-[#C8C4BC]", key: "legend3" },
] as const;

const PARKING = [
  { key: "entrance", Icon: Car },
  { key: "level", Icon: MapPin },
  { key: "walk", Icon: Clock },
  { key: "free", Icon: Ticket },
] as const;

export default async function Directions() {
  const t = await getTranslations("Directions");
  const p = await getTranslations("Parking");

  return (
    <Screen>
      <FlowSteps items={INFO_FLOW} step={1} />

      <div className="px-6 pt-4">
        <h1
          className="text-[2rem] leading-9 font-bold tracking-[-0.03em]"
          data-flow="title"
        >
          {t("title")}
        </h1>
        <p
          className="text-muted mt-2 text-[0.9375rem] leading-[1.375rem]"
          data-flow="copy"
        >
          {t("subtitle")}
        </p>
      </div>

      <div
        className="border-line mx-6 mt-4 flex items-center justify-between rounded-2xl border px-4 py-3.5"
        data-flow="copy"
      >
        <div className="flex flex-col gap-[3px]">
          <p className="text-muted text-[0.6875rem] leading-[0.875rem] font-medium tracking-[0.14em]">
            {t("venue")}
          </p>
          <p className="text-[1rem] leading-5 font-medium">{t("address")}</p>
        </div>
        <svg
          aria-hidden="true"
          fill="none"
          height="16"
          viewBox="0 0 16 16"
          width="16"
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="var(--color-muted)"
            strokeLinecap="round"
            strokeWidth="1.4"
          />
        </svg>
      </div>

      <div className="mx-6 mt-3.5" data-flow="media">
        <VenueMap />
      </div>

      <div className="flex flex-col gap-3 px-6 pt-4">
        {LEGEND.map((item) => (
          <div className="flex items-center gap-3" data-flow-item key={item.key}>
            <span
              aria-hidden="true"
              className={`size-2 shrink-0 rounded-full ${item.color}`}
            />
            <p className="text-[0.875rem] leading-[1.125rem]">{t(item.key)}</p>
          </div>
        ))}
      </div>

      <div className="px-6 pt-7" data-flow="copy">
        <p className="text-muted text-[0.6875rem] leading-[0.875rem] font-medium tracking-[0.14em]">
          {p("eyebrow")}
        </p>
        <h2 className="mt-2 text-[1.375rem] leading-[1.625rem] font-bold tracking-[-0.03em]">
          {p("title")}
        </h2>
        <p className="text-muted mt-1.5 text-[0.875rem] leading-5">{p("body")}</p>

        <div className="mt-3 flex flex-col gap-2.5">
          {PARKING.map(({ key, Icon }) => (
            <div className="flex items-center gap-3" data-flow-item key={key}>
              <Icon
                aria-hidden="true"
                className="text-gold shrink-0"
                size={17}
                strokeWidth={1.7}
              />
              <p className="text-[0.875rem] leading-[1.125rem]">{p(key)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1" />

      <FlowArrows items={INFO_FLOW} step={1} />
    </Screen>
  );
}
