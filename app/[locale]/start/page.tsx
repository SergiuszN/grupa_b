"use client";

import { useRouter } from "@/i18n/routing";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Building2, Ear, Eye, Frame, Music, Waves } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { FlowArrows, FlowSteps } from "@/components/flow/flow-nav";
import { Screen } from "@/components/flow/screen";
import { TASTE_KEY } from "@/lib/taste";

const QUESTIONS: {
  key: string;
  question: string;
  options: { key: string; icon: LucideIcon }[];
}[] = [
  {
    key: "mode",
    question: "q1",
    options: [
      { key: "q1a", icon: Ear },
      { key: "q1b", icon: Eye },
    ],
  },
  {
    key: "era",
    question: "q2",
    options: [
      { key: "q2a", icon: Music },
      { key: "q2b", icon: Waves },
    ],
  },
  {
    key: "space",
    question: "q3",
    options: [
      { key: "q3a", icon: Frame },
      { key: "q3b", icon: Building2 },
    ],
  },
];

export default function Start() {
  const t = useTranslations("Quiz");
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [picked, setPicked] = useState<string | null>(null);

  const question = QUESTIONS[step];

  function choose(option: string) {
    if (picked) return;

    const next = { ...answers, [question.key]: option };
    setPicked(option);
    setAnswers(next);

    window.setTimeout(() => {
      setPicked(null);

      if (step === QUESTIONS.length - 1) {
        localStorage.setItem(TASTE_KEY, JSON.stringify(next));
        router.push("/swipe");
        return;
      }

      setStep(step + 1);
    }, 240);
  }

  return (
    <Screen>
      <FlowSteps step={1} />

      <div className="rise flex flex-1 flex-col justify-center px-6" key={step}>
        <p className="text-caption text-gold font-medium tracking-[0.16em] uppercase">
          {t("eyebrow", { current: step + 1, total: QUESTIONS.length })}
        </p>

        <h1 className="text-display mt-3 max-w-[320px] font-bold">
          {t(question.question)}
        </h1>

        <div className="mt-8 flex flex-col gap-3">
          {question.options.map((option, index) => {
            const active = picked === t(option.key);
            const Icon = option.icon;

            return (
              <button
                className={`focus-visible:outline-gold flex h-[104px] w-full items-center justify-between rounded-lg border-[1.5px] px-6 text-left transition duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 ${
                  active
                    ? "border-gold bg-gold text-white"
                    : "border-ink hover:bg-surface"
                }`}
                key={option.key}
                onClick={() => choose(t(option.key))}
                type="button"
              >
                <span className="flex items-center gap-4">
                  <Icon aria-hidden="true" size={24} strokeWidth={1.5} />
                  <span className="text-[22px] leading-7 font-bold">
                    {t(option.key)}
                  </span>
                </span>
                <span
                  className={`text-caption ${
                    active ? "text-white/70" : "text-muted"
                  }`}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <FlowArrows step={1} />
    </Screen>
  );
}
