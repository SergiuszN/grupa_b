"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Plus, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { gsap } from "gsap";
import { FlowArrows, FlowSteps } from "@/components/flow/flow-nav";
import { Screen } from "@/components/flow/screen";
import { CtaButton } from "@/components/ui";
import { PARTY_KEY } from "@/lib/taste";
import { prefersStillMotion } from "@/lib/motion";

const MIN = 1;
const MAX = 8;

export default function Plan() {
  const t = useTranslations("Plan");
  const [people, setPeople] = useState(2);
  const numberRef = useRef<HTMLParagraphElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const shown = useRef(people);

  useEffect(() => {
    const el = numberRef.current;
    const previous = shown.current;
    shown.current = people;

    if (!el || previous === people || prefersStillMotion()) return;

    const counter = { value: previous };
    const tl = gsap.timeline({
      onUpdate: () => {
        el.textContent = String(Math.round(counter.value));
      },
      onComplete: () => {
        el.textContent = String(people);
      },
    });

    tl.to(counter, { value: people, duration: 0.45, ease: "power2.out" }, 0);
    tl.fromTo(el, { scale: 1.12 }, { scale: 1, duration: 0.55, ease: "back.out(2)" }, 0);

    const bars = cardRef.current?.querySelectorAll("[data-bar]");
    if (bars?.length) {
      tl.fromTo(
        bars,
        { scaleY: 0.35, transformOrigin: "50% 100%" },
        { scaleY: 1, duration: 0.3, stagger: 0.03, ease: "back.out(2)" },
        0,
      );
    }

    return () => {
      tl.kill();
    };
  }, [people]);

  function change(value: number) {
    const next = Math.min(MAX, Math.max(MIN, value));
    setPeople(next);
    localStorage.setItem(PARTY_KEY, String(next));
  }

  return (
    <Screen>
      <FlowSteps step={3} />

      <div className="flex flex-1 flex-col justify-center px-6 py-5">
        <div className="mb-8">
          <h1
            className="text-display font-bold tracking-[-0.03em]"
            data-flow="title"
          >
            {t("title")}
          </h1>
          <p className="text-body text-muted mt-2.5" data-flow="copy">
            {t("subtitle")}
          </p>
        </div>

        <div
          className="bg-surface flex flex-col gap-[18px] rounded-3xl px-[22px] pt-[22px] pb-[18px]"
          data-flow="media"
          ref={cardRef}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] leading-[15px] font-medium tracking-[0.16em] text-muted">
              {t("count")}
            </p>
            <p className="text-[11px] leading-[15px] font-medium tracking-[0.16em] text-gold">
              {MIN} – {MAX}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <CtaButton
              aria-label={t("fewer")}
              disabled={people === MIN}
              iconLeft={<Minus aria-hidden="true" size={24} strokeWidth={1.5} />}
              onClick={() => change(people - 1)}
              size="icon"
              variant="outline"
            />

            <div aria-live="polite" className="flex flex-col items-center">
              <div className="flex items-center gap-2.5">
                <Users
                  aria-hidden="true"
                  className="text-gold"
                  size={44}
                  strokeWidth={1.4}
                />
                <span
                  aria-hidden="true"
                  className="text-muted text-[26px] leading-none font-light"
                >
                  ×
                </span>
                <p
                  className="text-[96px] leading-[92px] font-light tracking-[-0.05em]"
                  ref={numberRef}
                >
                  {people}
                </p>
              </div>
              <p className="mt-1 text-[11px] leading-[15px] font-medium tracking-[0.16em] text-muted">
                {people === 1 ? t("one") : people < 5 ? t("few") : t("many")}
              </p>
            </div>

            <CtaButton
              aria-label={t("more")}
              disabled={people === MAX}
              iconLeft={<Plus aria-hidden="true" size={24} strokeWidth={1.5} />}
              onClick={() => change(people + 1)}
              size="icon"
              variant="primary"
            />
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <div
              className="relative flex flex-col gap-2 rounded-2xl p-2.5 transition-all focus-within:outline-2 focus-within:outline-gold focus-within:outline-offset-2 focus-within:ring-2 focus-within:ring-gold/20"
              data-guest-slider=""
            >
              <div className="relative flex h-[18px] items-center justify-between px-2">
                {Array.from({ length: MAX }, (_, index) => {
                  const val = index + 1;
                  const isCurrent = val === people;
                  const isFilled = val <= people;

                  return (
                    <span
                      className={`shrink-0 rounded-[2px] transition-all ${
                        isCurrent
                          ? "bg-gold h-[20px] w-[3.5px] scale-110 shadow-sm"
                          : isFilled
                            ? "bg-gold h-[18px] w-[3px]"
                            : "bg-line h-2.5 w-0.5"
                      }`}
                      data-bar
                      key={index}
                    />
                  );
                })}
              </div>

              <div
                aria-label={t("count")}
                className="flex items-center justify-between px-0.5"
                role="radiogroup"
              >
                {Array.from({ length: MAX }, (_, index) => {
                  const val = index + 1;
                  const isCurrent = val === people;

                  return (
                    <button
                      aria-checked={isCurrent}
                      aria-label={`${val} ${val === 1 ? t("one") : val < 5 ? t("few") : t("many")}`}
                      className={`relative flex size-7 items-center justify-center rounded-full text-[12px] leading-none font-semibold transition-all select-none cursor-pointer focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-2 ${
                        isCurrent
                          ? "bg-gold text-white font-bold shadow-sm scale-110"
                          : "text-muted hover:text-ink hover:bg-black/5"
                      }`}
                      key={val}
                      onClick={() => change(val)}
                      role="radio"
                      type="button"
                    >
                      {val}
                    </button>
                  );
                })}
              </div>

              <input
                aria-label={t("slider")}
                aria-valuetext={`${people} ${people === 1 ? t("one") : t("few")}`}
                className="absolute inset-x-2 top-0 h-[24px] cursor-pointer opacity-0 focus-visible:outline-none"
                max={MAX}
                min={MIN}
                onChange={(event) => change(Number(event.target.value))}
                step={1}
                tabIndex={-1}
                type="range"
                value={people}
              />
            </div>

            <p className="text-center text-[11px] leading-[14px] tracking-[0.02em] text-muted">
              {t("drag")}
            </p>
          </div>
        </div>
      </div>

      <FlowArrows step={3} />
    </Screen>
  );
}
