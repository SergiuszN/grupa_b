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

function plural(n: number) {
  if (n === 1) return "one";
  const ones = n % 10;
  const tens = n % 100;
  return ones >= 2 && ones <= 4 && (tens < 12 || tens > 14) ? "few" : "many";
}

export default function Plan() {
  const t = useTranslations("Plan");
  const [people, setPeople] = useState(2);
  const [draft, setDraft] = useState(String(people));
  const numberRef = useRef<HTMLInputElement>(null);
  const shown = useRef(people);

  useEffect(() => {
    const el = numberRef.current;
    const previous = shown.current;
    shown.current = people;

    if (!el || previous === people || prefersStillMotion()) return;

    const tween = gsap.fromTo(
      el,
      { scale: 1.12 },
      { scale: 1, duration: 0.55, ease: "back.out(2)" },
    );

    return () => {
      tween.kill();
    };
  }, [people]);

  function change(value: number) {
    const next = Math.max(MIN, value);
    setPeople(next);
    setDraft(String(next));
    localStorage.setItem(PARTY_KEY, String(next));
  }

  function type(value: string) {
    const digits = value.replace(/\D/g, "");
    if (digits) change(Number(digits));
    else setDraft("");
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
        >
          <p className="text-[0.6875rem] leading-[0.9375rem] font-medium tracking-[0.16em] text-muted">
            {t("count")}
          </p>

          <div className="flex items-center justify-between">
            <CtaButton
              aria-label={t("fewer")}
              disabled={people === MIN}
              iconLeft={<Minus aria-hidden="true" size={24} strokeWidth={1.5} />}
              onClick={() => change(people - 1)}
              size="icon"
              variant="outline"
            />

            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5">
                <Users
                  aria-hidden="true"
                  className="text-gold max-[359px]:hidden"
                  size={32}
                  strokeWidth={1.4}
                />
                <span
                  aria-hidden="true"
                  className="text-muted text-[1.625rem] leading-none font-light max-[359px]:hidden"
                >
                  ×
                </span>
                <input
                  aria-label={t("input")}
                  className={`box-content rounded-xl border border-line bg-transparent px-1.5 text-center font-light tracking-[-0.05em] tabular-nums caret-gold transition-colors hover:border-gold/60 focus:border-gold focus:outline-2 focus:outline-gold/30 focus:outline-offset-2 ${
                    draft.length > 2
                      ? "text-[2.5rem] leading-[4.5rem]"
                      : "text-[3.5rem] leading-[4.5rem]"
                  }`}
                  inputMode="numeric"
                  onBlur={() => setDraft(String(people))}
                  onChange={(event) => type(event.target.value)}
                  onFocus={(event) => event.target.select()}
                  maxLength={3}
                  pattern="[0-9]*"
                  ref={numberRef}
                  style={{ width: `${Math.max(2, draft.length)}ch` }}
                  type="text"
                  value={draft}
                />
              </div>
              <p className="mt-1 text-[0.6875rem] leading-[0.9375rem] font-medium tracking-[0.16em] text-muted">
                {t(plural(people))}
              </p>
            </div>

            <CtaButton
              aria-label={t("more")}
              iconLeft={<Plus aria-hidden="true" size={24} strokeWidth={1.5} />}
              onClick={() => change(people + 1)}
              size="icon"
              variant="primary"
            />
          </div>
        </div>
      </div>

      <FlowArrows step={3} />
    </Screen>
  );
}
