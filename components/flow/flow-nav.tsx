"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ArrowLeft, ArrowRight } from "lucide-react";

export type FlowItem = { href: string; label: string };

export const FLOW: readonly FlowItem[] = [
  { href: "/", label: "Start" },
  { href: "/start", label: "Gust" },
  { href: "/swipe", label: "Propozycje" },
  { href: "/plan", label: "Plan" },
  { href: "/evening", label: "Wieczór" },
  { href: "/checkout", label: "Bilet" },
  { href: "/success", label: "Potwierdzenie" },
  { href: "/onboarding", label: "Przed wyjściem" },
  { href: "/directions", label: "Dojazd" },
];

/** Post-purchase info trail: what to wear, how to get there, the event, parking. */
export const INFO_FLOW: readonly FlowItem[] = [
  { href: "/onboarding", label: "Ubiór" },
  { href: "/directions", label: "Dystans" },
  { href: "/event-info", label: "Wydarzenie" },
  { href: "/parking", label: "Parking" },
];

type Tone = "dark" | "light";

export function FlowSteps({
  step,
  items = FLOW,
  tone = "light",
}: {
  step: number;
  items?: readonly FlowItem[];
  tone?: Tone;
}) {
  return (
    <div
      aria-hidden="true"
      className="flex items-center justify-center gap-[7px] pt-4"
    >
      {items.map((item, index) => (
        <span
          className={`h-1.5 rounded-full transition-all ${
            index === step
              ? "bg-gold w-[18px]"
              : `w-1.5 ${tone === "dark" ? "bg-paper/35" : "bg-[#D9D4CB]"}`
          }`}
          key={item.href}
        />
      ))}
    </div>
  );
}

const base =
  "flex size-14 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-4";

const outline: Record<Tone, string> = {
  dark: "border-paper text-paper hover:bg-paper/10 focus-visible:outline-gold",
  light: "border-ink text-ink hover:bg-surface focus-visible:outline-gold",
};

const filled: Record<Tone, string> = {
  dark: "bg-gold text-white hover:bg-gold-deep focus-visible:outline-paper",
  light: "bg-gold text-white hover:bg-gold-deep focus-visible:outline-ink",
};

export function FlowArrows({
  step,
  items = FLOW,
  tone = "light",
  next = true,
  nextHref,
  nextLabel,
}: {
  step: number;
  items?: readonly FlowItem[];
  tone?: Tone;
  next?: boolean;
  nextHref?: string;
  nextLabel?: string;
}) {
  const t = useTranslations("Nav");
  const previous = items[step - 1];
  const upcoming = next ? items[step + 1] : undefined;
  const href = nextHref ?? upcoming?.href;
  const label = nextLabel ?? t("nextStep");

  return (
    <div className="flex items-center gap-3 px-6 pt-2 pb-[calc(env(safe-area-inset-bottom)+20px)]">
      {previous ? (
        <Link
          aria-label={`Poprzedni krok: ${previous.label}`}
          className={`${base} ${outline[tone]}`}
          href={previous.href}
        >
          <ArrowLeft aria-hidden="true" size={18} strokeWidth={1.8} />
        </Link>
      ) : (
        <span className="size-11 shrink-0" />
      )}

      {href ? (
        <Link
          className={`${filled[tone]} flex h-14 flex-1 items-center justify-center gap-2 rounded-full text-[15px] leading-5 font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4`}
          href={href}
        >
          {label}
          <ArrowRight aria-hidden="true" size={18} strokeWidth={1.8} />
        </Link>
      ) : (
        <span className="flex-1" />
      )}
    </div>
  );
}
