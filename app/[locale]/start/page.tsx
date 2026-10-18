"use client";

import { useRouter } from "@/i18n/routing";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Building2,
  ChevronRight,
  Ear,
  Eye,
  Frame,
  House,
  Landmark,
  Map,
  Minus,
  Moon,
  Music,
  Sparkles,
  Sun,
  Waves,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { gsap } from "gsap";
import { FlowArrows } from "@/components/flow/flow-nav";
import { Screen } from "@/components/flow/screen";
import { TASTE_KEY, type TasteAnswers } from "@/lib/taste";
import { prefersStillMotion } from "@/lib/motion";

const DEPTH = 3;

/** `taste` is the profile the answer adds in GET /api/v1/recommendations. */
type Option = { key: string; taste: string; icon: LucideIcon; next?: string };

/** Three-level binary tree: every branch asks its own question. */
const TREE: Record<string, { question: string; options: Option[] }> = {
  q1: {
    question: "q1",
    options: [
      { key: "q1a", taste: "listen", icon: Ear, next: "q2l" },
      { key: "q1b", taste: "watch", icon: Eye, next: "q2w" },
    ],
  },
  q2l: {
    question: "q2l",
    options: [
      { key: "q2la", taste: "classical", icon: Music, next: "q3c" },
      { key: "q2lb", taste: "contemporary", icon: Waves, next: "q3n" },
    ],
  },
  q2w: {
    question: "q2w",
    options: [
      { key: "q2wa", taste: "exhibition", icon: Frame, next: "q3e" },
      { key: "q2wb", taste: "architecture", icon: Building2, next: "q3a" },
    ],
  },
  q3c: {
    question: "q3c",
    options: [
      { key: "q3ca", taste: "modern-classic", icon: Sparkles, next: undefined },
      { key: "q3cb", taste: "old-classics", icon: Landmark, next: undefined },
    ],
  },
  q3n: {
    question: "q3n",
    options: [
      { key: "q3na", taste: "avant-garde", icon: Zap, next: undefined },
      { key: "q3nb", taste: "minimal", icon: Moon, next: undefined },
    ],
  },
  q3e: {
    question: "q3e",
    options: [
      { key: "q3ea", taste: "old-art", icon: Sun, next: undefined },
      { key: "q3eb", taste: "contemporary-art", icon: Minus, next: undefined },
    ],
  },
  q3a: {
    question: "q3a",
    options: [
      { key: "q3aa", taste: "interiors", icon: House, next: undefined },
      { key: "q3ab", taste: "city", icon: Map, next: undefined },
    ],
  },
};

export default function Start() {
  const t = useTranslations("Quiz");
  const router = useRouter();
  const [nodeId, setNodeId] = useState("q1");
  const [path, setPath] = useState<Option[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const fadeRef = useRef<HTMLDivElement>(null);

  const question = TREE[nodeId];

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const marks = stage.querySelectorAll("[data-q]");

    if (prefersStillMotion()) {
      gsap.set(marks, { autoAlpha: 1, y: 0, clearProps: "transform,visibility" });
      return;
    }

    const q = gsap.utils.selector(stage);
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.fromTo(
      q("[data-q-eyebrow]"),
      { y: 8, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.18 },
    )
      .fromTo(
        q("[data-q-title]"),
        { y: 26, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.28 },
        "-=0.12",
      )
      .fromTo(
        q("[data-q-option]"),
        { y: 18, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.24, stagger: 0.03 },
        "-=0.14",
      );

    return () => {
      tl.kill();
    };
  }, [nodeId]);

  function choose(option: Option, element: HTMLButtonElement) {
    if (picked) return;

    const still = prefersStillMotion();
    const nextPath = [...path, option];
    setPicked(option.key);
    setPath(nextPath);

    if (!still) {
      gsap
        .timeline()
        .to(element, { scale: 0.96, duration: 0.07, ease: "power2.out" })
        .to(element, { scale: 1, duration: 0.22, ease: "back.out(2.4)" });
    }

    window.setTimeout(() => {
      if (!still && stageRef.current) {
        gsap.to(stageRef.current, {
          y: -18,
          autoAlpha: 0,
          duration: 0.14,
          ease: "power2.in",
        });
      }
    }, 70);

    window.setTimeout(() => {
      if (!option.next) {
        const answers: TasteAnswers = {
          path: nextPath.map((item) => item.key),
          tastes: nextPath.map((item) => item.taste),
        };
        localStorage.setItem(TASTE_KEY, JSON.stringify(answers));
        const fade = fadeRef.current;

        if (!still && fade) {
          gsap.to(fade, {
            autoAlpha: 1,
            duration: 0.34,
            ease: "power2.inOut",
            delay: 0.04,
            onComplete: () => router.push("/matching"),
          });
        } else {
          router.push("/matching");
        }

        return;
      }

      setPicked(null);
      setNodeId(option.next);
    }, still ? 60 : 200);
  }

  return (
    <Screen>
      <div
        aria-hidden="true"
        className="bg-paper pointer-events-none fixed inset-0 z-50 opacity-0"
        ref={fadeRef}
      />

      <div
        className="flex flex-1 flex-col justify-center overflow-hidden px-6"
        key={nodeId}
        ref={stageRef}
      >
        <p
          className="text-caption text-gold font-medium tracking-[0.16em] uppercase"
          data-q
          data-q-eyebrow
        >
          {t("eyebrow", { current: Number(nodeId[1]), total: DEPTH })}
        </p>

        <h1 className="text-display mt-3 max-w-[320px] font-bold" data-q data-q-title>
          {t(question.question)}
        </h1>

        <div className="mt-8 flex flex-col gap-3">
          {question.options.map((option) => {
            const active = picked === option.key;
            const Icon = option.icon;

            return (
              <button
                className={`focus-visible:outline-gold flex h-[104px] w-full items-center justify-between rounded-lg border-[1.5px] px-6 text-left transition duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 ${
                  active
                    ? "border-gold bg-gold text-white"
                    : "border-ink hover:bg-surface"
                }`}
                data-q
                data-q-option
                key={option.key}
                onClick={(event) => choose(option, event.currentTarget)}
                type="button"
              >
                <span className="flex items-center gap-4">
                  <Icon aria-hidden="true" size={24} strokeWidth={1.5} />
                  <span className="text-[22px] leading-7 font-bold">
                    {t(option.key)}
                  </span>
                </span>
                <ChevronRight
                  aria-hidden="true"
                  className={`shrink-0 ${active ? "text-white/70" : "text-muted"}`}
                  size={20}
                  strokeWidth={1.8}
                />
              </button>
            );
          })}
        </div>
      </div>

      <FlowArrows next={false} step={1} />
    </Screen>
  );
}
