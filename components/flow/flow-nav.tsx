import { Link } from "@/i18n/routing";
import { ArrowLeft, ArrowRight } from "lucide-react";

export const FLOW = [
  { href: "/", label: "Start" },
  { href: "/start", label: "Gust" },
  { href: "/swipe", label: "Propozycje" },
  { href: "/plan", label: "Plan" },
  { href: "/evening", label: "Wieczór" },
  { href: "/checkout", label: "Bilet" },
  { href: "/success", label: "Potwierdzenie" },
  { href: "/onboarding", label: "Przed wyjściem" },
  { href: "/directions", label: "Dojazd" },
] as const;

type Tone = "dark" | "light";

export function FlowSteps({
  step,
  tone = "light",
}: {
  step: number;
  tone?: Tone;
}) {
  return (
    <div
      aria-hidden="true"
      className="flex items-center justify-center gap-[7px] pt-4"
    >
      {FLOW.map((item, index) => (
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
  "flex size-11 items-center justify-center rounded-full border-[1.5px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-4";

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
  tone = "light",
}: {
  step: number;
  tone?: Tone;
}) {
  const previous = FLOW[step - 1];
  const next = FLOW[step + 1];

  return (
    <div className="flex items-center justify-between px-6 pt-2 pb-[calc(env(safe-area-inset-bottom)+20px)]">
      {previous ? (
        <Link
          aria-label={`Poprzedni krok: ${previous.label}`}
          className={`${base} ${outline[tone]}`}
          href={previous.href}
        >
          <ArrowLeft aria-hidden="true" size={18} strokeWidth={1.8} />
        </Link>
      ) : (
        <span className="size-11" />
      )}

      {next ? (
        <Link
          aria-label={`Następny krok: ${next.label}`}
          className={`${base} ${filled[tone]}`}
          href={next.href}
        >
          <ArrowRight aria-hidden="true" size={18} strokeWidth={1.8} />
        </Link>
      ) : (
        <span className="size-11" />
      )}
    </div>
  );
}
