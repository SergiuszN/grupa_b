import { Car, Clock, MapPin } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { FlowArrows, FlowSteps, INFO_FLOW } from "@/components/flow/flow-nav";
import { Screen } from "@/components/flow/screen";

const ROWS = [
  { key: "entrance", Icon: Car },
  { key: "level", Icon: MapPin },
  { key: "walk", Icon: Clock },
] as const;

export default async function Parking() {
  const t = await getTranslations("Parking");

  return (
    <Screen>
      <FlowSteps items={INFO_FLOW} step={3} />

      <div className="px-6 pt-3">
        <p className="text-gold text-[11px] leading-[14px] font-medium tracking-[0.14em]">
          {t("eyebrow")}
        </p>
        <h1 className="mt-2 text-[32px] leading-9 font-bold tracking-[-0.03em]">
          {t("title")}
        </h1>
        <p className="text-muted mt-2 text-[15px] leading-[22px]">
          {t("body")}
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3 px-6">
        {ROWS.map(({ key, Icon }) => (
          <div
            className="border-line flex items-center gap-3 rounded-2xl border px-4 py-3.5"
            key={key}
          >
            <Icon aria-hidden="true" className="text-gold" size={18} strokeWidth={1.7} />
            <p className="text-[15px] leading-5">{t(key)}</p>
          </div>
        ))}
      </div>

      <div className="flex-1" />

      <FlowArrows
        items={INFO_FLOW}
        nextHref="/"
        nextLabel={t("home")}
        step={3}
      />
    </Screen>
  );
}
