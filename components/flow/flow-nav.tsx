"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { CtaButton } from "@/components/ui";
export type FlowItem = { href: string; label: string };

export const FLOW: readonly FlowItem[] = [
  { href: "/", label: "Start" },
  { href: "/start", label: "Gust" },
  { href: "/swipe", label: "Propozycje" },
  { href: "/plan", label: "Plan" },
  { href: "/seats", label: "Miejsca" },
  { href: "/evening", label: "Wieczór" },
  { href: "/checkout", label: "Bilet" },
  { href: "/success", label: "Potwierdzenie" },
  { href: "/onboarding", label: "Przed wyjściem" },
  { href: "/directions", label: "Dojazd" },
];

/** Post-purchase info trail: what to wear, how to get there, the event. */
export const INFO_FLOW: readonly FlowItem[] = [
  { href: "/onboarding", label: "Ubiór" },
  { href: "/directions", label: "Dystans" },
  { href: "/event-info", label: "Wydarzenie" },
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
    <nav
      aria-label="Paginacja kroków"
      className="flex items-center justify-center gap-1 pt-5 pb-2"
    >
      {items.map((item, index) => {
        const isCurrent = index === step;
        return (
          <Link
            aria-current={isCurrent ? "step" : undefined}
            aria-label={`Krok ${index + 1}: ${item.label}`}
            className="group flex min-h-[28px] min-w-[20px] items-center justify-center p-1.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
            href={item.href}
            key={item.href}
          >
            <span
              className={`h-2 rounded-full transition-all duration-200 ${
                isCurrent
                  ? "bg-gold w-[24px]"
                  : `w-2 group-hover:scale-125 ${
                      tone === "dark"
                        ? "bg-paper/35 group-hover:bg-paper/70"
                        : "bg-[#D9D4CB] group-hover:bg-ink/50"
                    }`
              }`}
              data-flow-dot
            />
          </Link>
        );
      })}
    </nav>
  );
}

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
    <div
      className="flex items-center gap-3 px-6 pt-2 pb-[calc(env(safe-area-inset-bottom)+20px)]"
      data-flow="actions"
    >
      {previous ? (
        <CtaButton
          aria-label={`Poprzedni krok: ${previous.label}`}
          href={previous.href}
          iconLeft={<ArrowLeft aria-hidden="true" size={18} strokeWidth={1.8} />}
          size="icon"
          tone={tone}
          variant="outline"
        />
      ) : null}

      {href ? (
        <CtaButton
          flex1
          href={href}
          iconRight={<ArrowRight aria-hidden="true" size={18} strokeWidth={1.8} />}
          tone={tone}
          variant="primary"
        >
          {label}
        </CtaButton>
      ) : (
        <span className="flex-1" />
      )}
    </div>
  );
}
