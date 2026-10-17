"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { FlowArrows, FlowSteps } from "@/components/flow/flow-nav";
import { Screen } from "@/components/flow/screen";
import { PARTY_KEY } from "@/lib/taste";

const MIN = 1;
const MAX = 8;

export default function Plan() {
  const t = useTranslations("Plan");
  const [people, setPeople] = useState(2);

  function change(value: number) {
    const next = Math.min(MAX, Math.max(MIN, value));
    setPeople(next);
    localStorage.setItem(PARTY_KEY, String(next));
  }

  return (
    <Screen>
      <FlowSteps step={3} />

      <div className="rise flex flex-1 flex-col justify-center px-6 py-5">
        <div className="mb-8">
          <h1 className="text-display font-bold tracking-[-0.03em]">
            {t("title")}
          </h1>
          <p className="text-body text-muted mt-2.5">{t("subtitle")}</p>
        </div>

        <div className="bg-surface flex flex-col gap-[18px] rounded-3xl px-[22px] pt-[22px] pb-[18px]">
          <div className="flex items-center justify-between">
            <p className="text-[11px] leading-[15px] font-medium tracking-[0.16em] text-muted">
              {t("count")}
            </p>
            <p className="text-[11px] leading-[15px] font-medium tracking-[0.16em] text-gold">
              {MIN} – {MAX}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <button
              aria-label={t("fewer")}
              className="border-ink focus-visible:outline-gold flex size-14 shrink-0 items-center justify-center rounded-full border-[1.5px] text-[26px] leading-none font-light transition-colors hover:bg-paper focus-visible:outline-2 focus-visible:outline-offset-4 disabled:opacity-30"
              disabled={people === MIN}
              onClick={() => change(people - 1)}
              type="button"
            >
              <Minus aria-hidden="true" size={24} strokeWidth={1.5} />
            </button>

            <div aria-live="polite" className="flex flex-col items-center">
              <p className="text-[96px] leading-[92px] font-light tracking-[-0.05em]">
                {people}
              </p>
              <p className="mt-1 text-[11px] leading-[15px] font-medium tracking-[0.16em] text-muted">
                {people === 1 ? t("one") : people < 5 ? t("few") : t("many")}
              </p>
            </div>

            <button
              aria-label={t("more")}
              className="bg-gold text-paper hover:bg-gold-deep focus-visible:outline-ink flex size-14 shrink-0 items-center justify-center rounded-full text-[26px] leading-none font-light transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 disabled:opacity-30"
              disabled={people === MAX}
              onClick={() => change(people + 1)}
              type="button"
            >
              <Plus aria-hidden="true" size={24} strokeWidth={1.5} />
            </button>
          </div>

          <div className="flex flex-col gap-2.5 pt-1">
            <div className="relative flex h-[18px] items-center justify-between">
              {Array.from({ length: MAX }, (_, index) => (
                <span
                  className={`shrink-0 rounded-[2px] ${
                    index < people
                      ? "bg-gold h-[18px] w-[3px]"
                      : "bg-line h-2.5 w-0.5"
                  }`}
                  key={index}
                />
              ))}
              <input
                aria-label={t("slider")}
                aria-valuetext={`${people} ${people === 1 ? t("one") : t("few")}`}
                className="absolute inset-0 w-full cursor-pointer opacity-0"
                max={MAX}
                min={MIN}
                onChange={(event) => change(Number(event.target.value))}
                step={1}
                type="range"
                value={people}
              />
            </div>

            <div className="flex items-center justify-between">
              <p className="text-[11px] leading-[14px] font-medium tracking-[0.06em] text-muted">
                {MIN}
              </p>
              <p className="text-[11px] leading-[14px] tracking-[0.02em] text-muted">
                {t("drag")}
              </p>
              <p className="text-[11px] leading-[14px] font-medium tracking-[0.06em] text-muted">
                {MAX}
              </p>
            </div>
          </div>
        </div>
      </div>

      <FlowArrows step={3} />
    </Screen>
  );
}
