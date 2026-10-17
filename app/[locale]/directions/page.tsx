import { getTranslations } from "next-intl/server";
import { FlowArrows, FlowSteps, INFO_FLOW } from "@/components/flow/flow-nav";
import { Screen } from "@/components/flow/screen";

const LEGEND = [
  { color: "bg-gold", key: "legend1" },
  { color: "bg-ink", key: "legend2" },
  { color: "bg-[#C8C4BC]", key: "legend3" },
] as const;

export default async function Directions() {
  const t = await getTranslations("Directions");

  return (
    <Screen>
      <FlowSteps items={INFO_FLOW} step={1} />

      <h1
        className="px-6 pt-4 text-[32px] leading-9 font-bold tracking-[-0.03em]"
        data-flow="title"
      >
        {t("title")}
      </h1>

      <div
        className="border-line mx-6 mt-4 flex items-center justify-between rounded-2xl border px-4 py-3.5"
        data-flow="copy"
      >
        <div className="flex flex-col gap-[3px]">
          <p className="text-muted text-[11px] leading-[14px] font-medium tracking-[0.14em]">
            {t("venue")}
          </p>
          <p className="text-[16px] leading-5 font-medium">
            {t("address")}
          </p>
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

      <div className="mx-6 mt-3.5 h-[280px] overflow-clip rounded-[22px] bg-[#F4F1EA]" data-flow="media">
        <svg
          aria-label={t("mapAria")}
          className="h-full w-full"
          role="img"
          viewBox="0 0 350 280"
        >
          <rect fill="#F4F1EA" height="280" width="350" />
          <path
            d="M0 168 C70 150, 120 190, 180 176 C250 160, 290 188, 350 170 L350 280 L0 280 Z"
            fill="#E7E2D6"
          />
          <path
            d="M0 40 H350 M0 96 H350 M0 210 H350 M78 0 V280 M168 0 V168 M248 0 V280"
            fill="#000000"
            stroke="#FFFFFF"
            strokeWidth="7"
          />
          <path
            d="M36 228 C78 196, 112 188, 150 156 C186 126, 198 118, 214 104"
            fill="none"
            stroke="#AD891C"
            strokeLinecap="round"
            strokeWidth="2.5"
          />
          <circle cx="36" cy="228" fill="#111111" r="5" />
          <path
            d="M214 78c-9 0-15 7-15 15 0 11 15 26 15 26s15-15 15-26c0-8-6-15-15-15z"
            fill="#111111"
          />
          <circle cx="214" cy="93" fill="#AD891C" r="4" />
        </svg>
      </div>

      <div className="flex flex-col gap-3 px-6 pt-4">
        {LEGEND.map((item) => (
          <div className="flex items-center gap-3" data-flow-item key={item.key}>
            <span
              aria-hidden="true"
              className={`size-2 shrink-0 rounded-full ${item.color}`}
            />
            <p className="text-[14px] leading-[18px]">{t(item.key)}</p>
          </div>
        ))}
      </div>

      <div className="flex-1" />

      <FlowArrows items={INFO_FLOW} step={1} />
    </Screen>
  );
}
