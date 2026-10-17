"use client";

import { CalendarDays, Info, MapPin, Music } from "lucide-react";
import { useTranslations } from "next-intl";
import { FlowArrows, FlowSteps, INFO_FLOW } from "@/components/flow/flow-nav";
import { Screen } from "@/components/flow/screen";
import { useFlow } from "@/lib/use-flow";

export default function EventInfo() {
  const t = useTranslations("EventInfo");
  const { event } = useFlow();

  const rows = [
    { Icon: Music, label: event.kind },
    { Icon: CalendarDays, label: event.date },
    { Icon: MapPin, label: event.room },
    { Icon: Info, label: event.meta },
  ];

  return (
    <Screen>
      <FlowSteps items={INFO_FLOW} step={2} />

      <div className="px-6 pt-3">
        <p className="text-gold text-[11px] leading-[14px] font-medium tracking-[0.14em]">
          {t("eyebrow")}
        </p>
        <h1 className="mt-2 text-[32px] leading-9 font-bold tracking-[-0.03em]">
          {event.title}
        </h1>
        <p className="text-muted mt-2 text-[15px] leading-[22px]">
          {event.subtitle}
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3 px-6">
        {rows.map(({ Icon, label }) => (
          <div
            className="border-line flex items-center gap-3 rounded-2xl border px-4 py-3.5"
            key={label}
          >
            <Icon aria-hidden="true" className="text-gold" size={18} strokeWidth={1.7} />
            <p className="text-[15px] leading-5">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex-1" />

      <FlowArrows items={INFO_FLOW} step={2} />
    </Screen>
  );
}
