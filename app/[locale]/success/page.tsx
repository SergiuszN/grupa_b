"use client";

import {
  CalendarDays,
  Check,
  Clock,
  Download,
  Music,
  Share2,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { FlowSteps } from "@/components/flow/flow-nav";
import { Screen } from "@/components/flow/screen";
import { CtaButton } from "@/components/ui";
import { useTranslations } from "next-intl";
import { useFlow } from "@/lib/use-flow";
import { prefersStillMotion } from "@/lib/motion";
import { sentenceCase } from "@/lib/format";

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
  const [walletNote, setWalletNote] = useState(false);
  const label =
    people === 1 ? tCheckout("one") : people < 5 ? tCheckout("few") : tCheckout("many");
  const [weekday, time] = event.date.split("·").map((part) => part.trim());
  const calendar = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    event.title,
  )}&location=${encodeURIComponent("Filharmonia Szczecin")}`;

  function share() {
    const text = `${event.title} · ${event.date} · Filharmonia Szczecin`;

    if (navigator.share) void navigator.share({ title: event.title, text });
    else void navigator.clipboard?.writeText(text);
  }

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
        className="pointer-events-none fixed inset-0 z-40 overflow-hidden print:hidden"
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

      <div className="print:hidden">
        <FlowSteps step={6} />
      </div>

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
          className="text-gold mt-8 text-[0.75rem] leading-4 font-medium tracking-[0.14em]"
          data-flow="eyebrow"
        >
          {t("eyebrow")}
        </p>
        <h1 className="text-display mt-2 font-bold tracking-[-0.03em]" data-flow="title">
          {t("title")}
        </h1>
        <p
          className="text-muted mt-3 max-w-[300px] text-[0.9375rem] leading-[1.375rem]"
          data-flow="copy"
        >
          {t("body")}
        </p>

        <div
          className="mt-7 flex flex-wrap items-center justify-center gap-2"
          data-flow="media"
        >
          {[
            { Icon: Music, label: event.title },
            { Icon: CalendarDays, label: sentenceCase(weekday) },
            { Icon: Clock, label: time },
            { Icon: Users, label: `${people} ${label}` },
          ].map(({ Icon, label: text }) => (
            <p
              className="bg-surface flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[0.8125rem] leading-5 font-medium"
              key={text}
            >
              <Icon
                aria-hidden="true"
                className="text-gold"
                size={15}
                strokeWidth={1.8}
              />
              {text}
            </p>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 px-6 pb-2" data-flow="actions">
        <CtaButton
          fullWidth
          href="/onboarding"
          size="md"
          variant="primary"
        >
          {t("info")}
        </CtaButton>

        <div className="flex flex-col gap-2 print:hidden">
          <button
            className="border-ink text-ink hover:bg-surface focus-visible:outline-gold flex h-[52px] items-center justify-center gap-2 rounded-full border-[1.5px] text-[0.9375rem] leading-5 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-4"
            onClick={() => window.print()}
            type="button"
          >
            <Download aria-hidden="true" size={17} strokeWidth={1.8} />
            {t("pdf")}
          </button>

          <button
            className="focus-visible:outline-ink flex h-[52px] items-center justify-center gap-2 rounded-full bg-black text-[0.9375rem] leading-5 font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-4"
            onClick={() => setWalletNote(true)}
            type="button"
          >
            <svg
              aria-hidden="true"
              fill="currentColor"
              height="18"
              viewBox="0 0 24 24"
              width="18"
            >
              <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.03 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
            </svg>
            {t("wallet")}
          </button>

          <div className="flex items-center justify-center gap-[22px] pt-2 text-[0.875rem] leading-[1.125rem] font-medium">
            <a
              className="focus-visible:outline-gold flex items-center gap-1.5 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
              href={calendar}
              rel="noreferrer"
              target="_blank"
            >
              <CalendarDays aria-hidden="true" size={16} strokeWidth={1.7} />
              {t("calendar")}
            </a>
            <span aria-hidden="true" className="bg-gold size-1 rounded-full" />
            <button
              className="focus-visible:outline-gold flex items-center gap-1.5 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
              onClick={share}
              type="button"
            >
              <Share2 aria-hidden="true" size={16} strokeWidth={1.7} />
              {t("share")}
            </button>
          </div>
        </div>

        {walletNote ? (
          <p aria-live="polite" className="text-muted text-center text-[0.75rem] leading-4 print:hidden">
            {t("walletSoon")}
          </p>
        ) : null}
      </div>

    </Screen>
  );
}
