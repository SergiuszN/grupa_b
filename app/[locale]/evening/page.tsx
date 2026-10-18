"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";
import { gsap } from "gsap";
import { FlowArrows, FlowSteps, skippedSteps } from "@/components/flow/flow-nav";
import { Screen } from "@/components/flow/screen";
import {
  fitPlanToEvent,
  pickEveningPlan,
  type EveningPlan,
  type PlanItem,
} from "@/lib/evening-plans";
import { prefersStillMotion } from "@/lib/motion";
import { TASTE_KEY, type TasteAnswers } from "@/lib/taste";
import { useFlow } from "@/lib/use-flow";
import { hasSeats, startMinutes } from "@/lib/events";

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

export default function Evening() {
  const t = useTranslations("Evening");
  const { event, people } = useFlow();
  const seated = hasSeats(event);
  const [picked, setPicked] = useState<EveningPlan | null>(null);
  const start = startMinutes(event);
  const time = event.date.split("·").at(-1)?.trim();
  const plan =
    picked && start !== null ? fitPlanToEvent(picked, start, event.duration) : picked;

  useEffect(() => {
    const answers = JSON.parse(
      localStorage.getItem(TASTE_KEY) ?? "{}",
    ) as TasteAnswers;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- random pick must wait for the client to avoid a hydration mismatch
    setPicked(pickEveningPlan(answers.tastes));
  }, []);

  // The rows mount after FlowMotion's entrance has run, so they bring their own.
  useEffect(() => {
    if (!picked) return;
    const rows = document.querySelectorAll("[data-flow-screen] [data-flow-item]");

    if (prefersStillMotion()) {
      gsap.set(rows, { autoAlpha: 1 });
      return;
    }

    const tween = gsap.fromTo(
      rows,
      { y: 16, autoAlpha: 0 },
      {
        y: 0,
        autoAlpha: 1,
        duration: 0.5,
        stagger: 0.06,
        delay: 0.3,
        ease: "power3.out",
        clearProps: "transform,visibility",
      },
    );

    return () => {
      tween.kill();
    };
  }, [picked]);

  function item(entry: PlanItem, index: number, all: PlanItem[]) {
    const place = t(`places.${entry.place}`);
    return (
      <Row
        Icon={entry.Icon}
        key={`${entry.time}-${entry.title}`}
        last={all === plan?.after && index === all.length - 1}
        place={entry.party ? t("party", { place, count: people }) : place}
        time={entry.time}
        title={t(`activities.${entry.title}`)}
      />
    );
  }

  return (
    <Screen>
      <FlowSteps skip={skippedSteps(seated)} step={5} />

      <div className="px-6 pt-4 pb-2.5">
        <h1
          className="text-[1.875rem] leading-[2.125rem] font-bold tracking-[-0.03em]"
          data-flow="title"
        >
          {t("title")}
        </h1>
      </div>

      <div className="px-6 pt-1.5">
        {plan?.before.map(item)}
      </div>

      <div className="px-6 pt-3">
        <div
          className="bg-ink relative flex h-[252px] flex-col justify-end overflow-clip rounded-[18px] bg-cover bg-[50%]"
          data-flow="media"
          style={{ backgroundImage: `url(${event.image})` }}
        >
          <div className="from-ink/72 flex items-end bg-gradient-to-t to-transparent px-3.5 py-3">
            <div className="flex flex-col gap-0.5">
              <p className="bg-ink/70 text-gold mb-0.5 inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[0.6875rem] leading-4 font-medium tracking-[0.12em]">
                {start !== null && time ? t("concert", { time }) : t("concertUntimed")}
              </p>
              <p className="text-[1.375rem] leading-[1.625rem] font-bold tracking-[-0.03em] text-white">
                {event.title}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 pt-4">
        {plan?.after.map(item)}
      </div>

      <div className="flex-1" />

      <div className="pb-2" />

      <FlowArrows prevHref={seated ? undefined : "/plan"} step={5} sticky />
    </Screen>
  );
}
