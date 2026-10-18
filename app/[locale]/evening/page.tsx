"use client";

import { useTranslations } from "next-intl";
import {
  Footprints,
  Martini,
  Shirt,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { FlowArrows, FlowSteps } from "@/components/flow/flow-nav";
import { Screen } from "@/components/flow/screen";
import { useFlow } from "@/lib/use-flow";

const BEFORE: { time: string; title: string; place: string; Icon: LucideIcon }[] = [
  { time: "18:30", title: "drinks", place: "barName", Icon: Martini },
  { time: "19:15", title: "walk", place: "walkPlace", Icon: Footprints },
  { time: "19:45", title: "cloakroom", place: "cloakroomPlace", Icon: Shirt },
];

function Row({
  time,
  title,
  place,
  Icon,
  last = false,
}: {
  time: string;
  title: string;
  place: string;
  Icon?: LucideIcon;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline gap-3.5 py-[9px] ${
        last ? "" : "border-line border-b"
      }`}
      data-flow-item
    >
      <span className="text-muted w-[52px] shrink-0 text-[0.875rem] leading-[1.125rem] font-medium">
        {time}
      </span>
      <span className="text-ink flex flex-1 items-center gap-2 text-[1rem] leading-5 font-medium">
        {Icon ? (
          <Icon
            aria-hidden="true"
            className="text-gold shrink-0 self-center"
            size={16}
            strokeWidth={1.7}
          />
        ) : null}
        {title}
      </span>
      <span className="text-muted w-[118px] shrink-0 text-right text-[0.8125rem] leading-4">
        {place}
      </span>
    </div>
  );
}

function Label({ children }: { children: string }) {
  return (
    <p className="text-muted pb-1 text-[0.75rem] leading-4 font-medium tracking-[0.14em]">
      {children}
    </p>
  );
}

export default function Evening() {
  const t = useTranslations("Evening");
  const { event, people } = useFlow();

  return (
    <Screen>
      <FlowSteps step={5} />

      <div className="px-6 pt-4 pb-2.5">
        <h1
          className="text-[1.875rem] leading-[2.125rem] font-bold tracking-[-0.03em]"
          data-flow="title"
        >
          {t("title")}
        </h1>
      </div>

      <div className="px-6 pt-1.5">
        <Label>{t("before")}</Label>
        {BEFORE.map((item) => (
          <Row
            Icon={item.Icon}
            key={item.title}
            place={t(item.place)}
            time={item.time}
            title={t(item.title)}
          />
        ))}
      </div>

      <div className="px-6 pt-3">
        <div
          className="bg-ink relative flex h-[296px] flex-col justify-end overflow-clip rounded-[18px] bg-cover bg-[50%]"
          data-flow="media"
          style={{ backgroundImage: `url(${event.image})` }}
        >
          <div className="from-ink/72 flex items-end bg-gradient-to-t to-transparent px-3.5 py-3">
            <div className="flex flex-col gap-0.5">
              <p className="bg-ink/70 text-gold mb-0.5 inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[0.6875rem] leading-4 font-medium tracking-[0.12em]">
                {t("concert")}
              </p>
              <p className="text-[1.375rem] leading-[1.625rem] font-bold tracking-[-0.03em] text-white">
                {event.title}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 pt-4">
        <Label>{t("after")}</Label>
        <Row
          Icon={UtensilsCrossed}
          last
          place={t("dinnerPlace", { count: people })}
          time="22:15"
          title={t("dinner")}
        />
      </div>

      <div className="flex-1" />

      <div className="pb-2" />

      <FlowArrows step={5} />
    </Screen>
  );
}
