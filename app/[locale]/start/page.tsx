"use client";

import { useRouter } from "@/i18n/routing";
import { useState } from "react";
import { Building2, Ear, Eye, Frame, Music, Waves } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { FlowArrows, FlowSteps } from "@/components/flow/flow-nav";
import { Screen } from "@/components/flow/screen";
import { TASTE_KEY } from "@/lib/taste";

const QUESTIONS: {
  key: string;
  question: string;
  options: { label: string; icon: LucideIcon }[];
}[] = [
  {
    key: "mode",
    question: "Wolisz słuchać czy oglądać?",
    options: [
      { label: "Słuchanie", icon: Ear },
      { label: "Oglądanie", icon: Eye },
    ],
  },
  {
    key: "era",
    question: "Klasycznie czy nowocześnie?",
    options: [
      { label: "Klasycznie", icon: Music },
      { label: "Nowocześnie", icon: Waves },
    ],
  },
  {
    key: "space",
    question: "Wystawa czy architektura?",
    options: [
      { label: "Wystawa", icon: Frame },
      { label: "Architektura", icon: Building2 },
    ],
  },
];

export default function Start() {
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
          Pytanie {step + 1} / {QUESTIONS.length}
        </p>

        <h1 className="text-display mt-3 max-w-[320px] font-bold">
          {question.question}
        </h1>

        <div className="mt-8 flex flex-col gap-3">
          {question.options.map((option, index) => {
            const active = picked === option.label;
            const Icon = option.icon;

            return (
              <button
                className={`focus-visible:outline-gold flex h-[104px] w-full items-center justify-between rounded-lg border-[1.5px] px-6 text-left transition duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 ${
                  active
                    ? "border-gold bg-gold text-white"
                    : "border-ink hover:bg-surface"
                }`}
                key={option.label}
                onClick={() => choose(option.label)}
                type="button"
              >
                <span className="flex items-center gap-4">
                  <Icon aria-hidden="true" size={24} strokeWidth={1.5} />
                  <span className="text-[22px] leading-7 font-bold">
                    {option.label}
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
