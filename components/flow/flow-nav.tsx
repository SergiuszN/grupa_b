"use client";

import { useEffect, useState } from "react";
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

/** Concerts pick seats (the count follows from them); walk-in events only pick a count. */
export function skippedSteps(seated: boolean): string[] {
  return seated ? ["/plan"] : ["/seats"];
}

type Tone = "dark" | "light";

export function FlowSteps({
  step,
  items = FLOW,
  tone = "light",
  skip = [],
}: {
  step: number;
  items?: readonly FlowItem[];
  tone?: Tone;
  /** Hrefs of steps this path leaves out (e.g. seats for an exhibition). */
  skip?: readonly string[];
}) {
  const progressKey = `filharmonia:progress:${items[0]?.href ?? "main"}`;
  const [maxVisited, setMaxVisited] = useState(step);

  useEffect(() => {
    const stored = Number(sessionStorage.getItem(progressKey));
    const reached = Number.isFinite(stored) ? Math.max(stored, step) : step;
    sessionStorage.setItem(progressKey, String(reached));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot read of this session's progress
    setMaxVisited(reached);
  }, [progressKey, step]);

  return (
    <nav
      aria-label="Paginacja kroków"
      className="flex items-center justify-center gap-1 pt-4 pb-1.5"
    >
      {items.map((item, index) => {
        if (skip.includes(item.href)) return null;
        const isCurrent = index === step;
        const reachable = index <= maxVisited;

        if (!reachable) {
          return (
            <span
              aria-hidden="true"
              className="flex min-h-[28px] min-w-[20px] items-center justify-center p-1.5"
              key={item.href}
            >
              <span
                className={`h-2 w-2 rounded-full opacity-40 ${
                  tone === "dark" ? "bg-paper/35" : "bg-[#D9D4CB]"
                }`}
                data-flow-dot
              />
            </span>
          );
        }

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
  prevHref,
  nextLabel,
  sticky = false,
}: {
  step: number;
  items?: readonly FlowItem[];
  tone?: Tone;
  next?: boolean;
  nextHref?: string;
  prevHref?: string;
  nextLabel?: string;
  /** Pin the buttons to the viewport bottom, above the scrolling content. */
  sticky?: boolean;
}) {
  const t = useTranslations("Nav");
  const previous = prevHref
    ? (items.find((item) => item.href === prevHref) ?? { href: prevHref, label: "" })
    : items[step - 1];
  const upcoming = next ? items[step + 1] : undefined;
  const href = nextHref ?? upcoming?.href;
  const label = nextLabel ?? t("nextStep");

  const buttons = (
    <>
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
    </>
  );

  if (sticky) {
    return (
      <>
        <div
          aria-hidden="true"
          className="h-[calc(env(safe-area-inset-bottom)+84px)]"
        />
        <div
          className={`fixed inset-x-0 bottom-0 z-30 border-t backdrop-blur-sm ${
            tone === "dark"
              ? "bg-ink/95 border-paper/10"
              : "bg-paper/95 border-line"
          }`}
          data-flow="actions"
        >
          <div className="mx-auto flex w-full max-w-[1100px] items-center gap-3 px-6 pt-3 pb-[calc(env(safe-area-inset-bottom)+16px)]">
            {buttons}
          </div>
        </div>
      </>
    );
  }

  return (
    <div
      className="flex items-center gap-3 px-6 pt-2 pb-[calc(env(safe-area-inset-bottom)+20px)]"
      data-flow="actions"
    >
      {buttons}
    </div>
  );
}
