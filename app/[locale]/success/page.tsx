"use client";

import { Link } from "@/i18n/routing";
import { Check, Info } from "lucide-react";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { FlowSteps } from "@/components/flow/flow-nav";
import { Screen } from "@/components/flow/screen";
import { useTranslations } from "next-intl";
import { useFlow } from "@/lib/use-flow";
import { prefersStillMotion } from "@/lib/motion";

const CONFETTI = [
  { left: 6, delay: 0, duration: 2600, size: 8, color: "#AD891C", round: false },
  { left: 14, delay: 240, duration: 3200, size: 6, color: "#111111", round: true },
  { left: 22, delay: 80, duration: 2900, size: 10, color: "#E7E2D8", round: false },
  { left: 30, delay: 420, duration: 3400, size: 7, color: "#AD891C", round: true },
  { left: 38, delay: 160, duration: 2700, size: 9, color: "#8F7017", round: false },
  { left: 46, delay: 520, duration: 3100, size: 6, color: "#111111", round: false },
  { left: 54, delay: 60, duration: 3000, size: 8, color: "#E7E2D8", round: true },
  { left: 62, delay: 340, duration: 2800, size: 10, color: "#AD891C", round: false },
  { left: 70, delay: 200, duration: 3300, size: 7, color: "#111111", round: true },
  { left: 78, delay: 460, duration: 2600, size: 9, color: "#8F7017", round: false },
  { left: 86, delay: 120, duration: 3200, size: 6, color: "#AD891C", round: false },
  { left: 94, delay: 300, duration: 2900, size: 8, color: "#111111", round: true },
  { left: 10, delay: 700, duration: 3000, size: 6, color: "#AD891C", round: false },
  { left: 26, delay: 820, duration: 3400, size: 7, color: "#111111", round: true },
  { left: 42, delay: 640, duration: 2700, size: 8, color: "#E7E2D8", round: false },
  { left: 58, delay: 900, duration: 3100, size: 6, color: "#8F7017", round: true },
  { left: 74, delay: 760, duration: 2900, size: 9, color: "#AD891C", round: false },
  { left: 90, delay: 980, duration: 3200, size: 7, color: "#111111", round: false },
] as const;

export default function Success() {
  const t = useTranslations("Success");
  const tCheckout = useTranslations("Checkout");
  const { event, people } = useFlow();
  const badgeRef = useRef<HTMLDivElement>(null);
  const label =
    people === 1 ? tCheckout("one") : people < 5 ? tCheckout("few") : tCheckout("many");

  useEffect(() => {
    const badge = badgeRef.current;
    if (!badge || prefersStillMotion()) return;

    const tl = gsap.timeline({ delay: 0.1 });
    tl.fromTo(
      badge,
      { scale: 0.4, autoAlpha: 0 },
      {
        scale: 1,
        autoAlpha: 1,
        duration: 0.7,
        ease: "back.out(2.4)",
        clearProps: "transform,visibility",
      },
    );
    tl.fromTo(
      badge.querySelector("svg"),
      { scale: 0.5, rotation: -25 },
      {
        scale: 1,
        rotation: 0,
        duration: 0.55,
        ease: "back.out(3)",
        clearProps: "transform",
      },
      0.18,
    );

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <Screen>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-40 overflow-hidden"
      >
        {CONFETTI.map((piece, index) => (
          <span
            className="confetti-piece absolute top-0 block"
            key={index}
            style={{
              left: `${piece.left}%`,
              width: piece.size,
              height: piece.size,
              backgroundColor: piece.color,
              borderRadius: piece.round ? 999 : 1,
              animationDelay: `${piece.delay}ms`,
              animationDuration: `${piece.duration}ms`,
            }}
          />
        ))}
      </div>

      <FlowSteps step={6} />

      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div
          className="bg-gold-soft flex size-24 items-center justify-center rounded-full"
          ref={badgeRef}
        >
          <Check
            aria-hidden="true"
            className="text-gold"
            size={44}
            strokeWidth={2.6}
          />
        </div>

        <p
          className="text-gold mt-8 text-[12px] leading-4 font-medium tracking-[0.14em]"
          data-flow="eyebrow"
        >
          {t("eyebrow")}
        </p>
        <h1 className="text-display mt-2 font-bold tracking-[-0.03em]" data-flow="title">
          {t("title")}
        </h1>
        <p
          className="text-muted mt-3 max-w-[300px] text-[15px] leading-[22px]"
          data-flow="copy"
        >
          {t("body")}
        </p>

        <p
          className="bg-surface mt-7 rounded-full px-4 py-2 text-[13px] leading-5 font-medium"
          data-flow-item
        >
          {t("summary", {
            title: event.title,
            date: event.date,
            count: people,
            people: label,
          })}
        </p>
      </div>

      <div className="px-6 pb-2" data-flow="actions">
        <Link
          className="bg-gold text-ink hover:bg-gold-deep focus-visible:outline-ink flex h-[52px] items-center justify-center gap-2 rounded-full text-[16px] leading-5 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-4"
          href="/onboarding"
        >
          <Info aria-hidden="true" size={18} strokeWidth={1.8} />
          {t("info")}
        </Link>
      </div>

    </Screen>
  );
}
