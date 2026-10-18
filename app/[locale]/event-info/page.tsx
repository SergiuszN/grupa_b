"use client";

import { useTranslations } from "next-intl";
import { FlowArrows, FlowSteps, INFO_FLOW } from "@/components/flow/flow-nav";
import { Screen } from "@/components/flow/screen";
import { useFlow } from "@/lib/use-flow";

const PROGRAMME = ["1", "2", "3"] as const;

export default function EventInfo() {
  const t = useTranslations("EventInfo");
  const { event } = useFlow();

  return (
    <Screen>
      <FlowSteps items={INFO_FLOW} step={2} />

      <div className="px-6 pt-3">
        <h1
          className="text-[2rem] leading-9 font-bold tracking-[-0.03em]"
          data-flow="title"
        >
          {event.title}
        </h1>
        <p
          className="text-muted mt-2 text-[0.9375rem] leading-[1.375rem]"
          data-flow="copy"
        >
          {event.subtitle}
        </p>
      </div>

      <div
        className="mx-6 mt-4 h-[300px] overflow-clip rounded-[20px] bg-ink bg-cover bg-[50%]"
        data-flow="image"
        style={{ backgroundImage: `url(${event.image})` }}
      />

      <section className="px-6 pt-7" data-flow="copy">
        <p className="text-gold-deep text-[0.6875rem] leading-[0.875rem] font-medium tracking-[0.14em]">
          {t("about")}
        </p>
        <div className="text-muted mt-3 flex flex-col gap-3 text-[0.9375rem] leading-[1.4375rem]">
          <p>{event.description}</p>
          <p>{t("aboutP1")}</p>
          <p>{t("aboutP2")}</p>
        </div>
      </section>

      <section className="px-6 pt-8" data-flow="media">
        <p className="text-gold-deep text-[0.6875rem] leading-[0.875rem] font-medium tracking-[0.14em]">
          {t("programme")}
        </p>

        <ol className="border-line mt-3 flex flex-col rounded-2xl border">
          {PROGRAMME.map((step, index) => (
            <li
              className={`flex gap-3.5 px-4 py-3.5 ${
                index < PROGRAMME.length - 1 ? "border-line border-b" : ""
              }`}
              key={step}
            >
              <span className="text-gold w-5 shrink-0 pt-0.5 text-[0.625rem] leading-4 font-medium tracking-[0.1em]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="flex flex-col gap-0.5">
                <p className="text-[0.875rem] leading-[1.125rem] font-bold">
                  {t(`prog${step}Title` as never)}
                </p>
                <p className="text-muted text-[0.8125rem] leading-[1.1875rem]">
                  {t(`prog${step}Text` as never)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="flex-1" />

      <div className="pt-4">
        <FlowArrows
          items={INFO_FLOW}
          nextHref="/"
          nextLabel={t("home")}
          step={2}
          sticky
        />
      </div>
    </Screen>
  );
}
