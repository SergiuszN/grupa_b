"use client";

import { Link } from "@/i18n/routing";
import { FlowArrows, FlowSteps } from "@/components/flow/flow-nav";
import { Screen } from "@/components/flow/screen";
import { useFlow } from "@/lib/use-flow";

export default function Success() {
  const { event, people } = useFlow();
  const label = people === 1 ? "osoba" : people < 5 ? "osoby" : "osób";

  return (
    <Screen>
      <FlowSteps step={6} />

      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="bg-gold-soft flex size-24 items-center justify-center rounded-full">
          <svg
            aria-hidden="true"
            fill="none"
            height="34"
            viewBox="0 0 34 26"
            width="44"
          >
            <path
              d="M3 13.5l9.5 9.5L31 3"
              stroke="var(--color-gold)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.6"
            />
          </svg>
        </div>

        <p className="text-gold mt-8 text-[12px] leading-4 font-medium tracking-[0.14em]">
          POTWIERDZENIE
        </p>
        <h1 className="text-display mt-2 font-bold tracking-[-0.03em]">
          Bilet jest Twój.
        </h1>
        <p className="text-muted mt-3 max-w-[300px] text-[15px] leading-[22px]">
          Wysłaliśmy go na e-mail. Plan wieczoru i wskazówki masz już w
          aplikacji.
        </p>

        <p className="bg-surface mt-7 rounded-full px-4 py-2 text-[13px] leading-5 font-medium">
          {event.title} · {event.date} · {people} {label}
        </p>
      </div>

      <div className="px-6 pb-2">
        <Link
          className="bg-gold text-ink hover:bg-gold-deep focus-visible:outline-ink flex h-[52px] items-center justify-center rounded-full text-[16px] leading-5 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-4"
          href="/onboarding"
        >
          Zaczynamy
        </Link>
      </div>

      <FlowArrows step={6} />
    </Screen>
  );
}
