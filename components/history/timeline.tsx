"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

export type TimelineEntry = {
  year: string;
  title: string;
  body: string;
};

export function Timeline({
  entries,
  labels,
}: {
  entries: TimelineEntry[];
  labels: { previous: string; next: string };
}) {
  const [index, setIndex] = useState(0);
  const entry = entries[index];
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }, [index]);

  const move = (delta: number) =>
    setIndex((current) =>
      Math.min(entries.length - 1, Math.max(0, current + delta)),
    );

  return (
    <div>
      <div
        aria-label="Lata"
        className="-mx-6 flex gap-1 overflow-x-auto px-6 pb-2 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0 [&::-webkit-scrollbar]:hidden"
        role="group"
      >
        {entries.map((item, itemIndex) => {
          const active = itemIndex === index;
          return (
            <button
              aria-pressed={active}
              className={`focus-visible:outline-gold shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-medium tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
                active
                  ? "border-gold bg-gold text-white"
                  : "border-line text-muted hover:text-ink"
              }`}
              key={item.year}
              onClick={() => setIndex(itemIndex)}
              ref={active ? activeRef : undefined}
              type="button"
            >
              {item.year}
            </button>
          );
        })}
      </div>

      <div
        aria-live="polite"
        className="border-line mt-5 rounded-[20px] border px-5 py-6 md:px-8 md:py-8"
      >
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-gold text-[40px] leading-[44px] font-bold tracking-[-0.04em] tabular-nums md:text-[56px] md:leading-[60px]">
            {entry.year}
          </p>
          <p className="text-muted text-[12px] tabular-nums">
            {String(index + 1).padStart(2, "0")} /{" "}
            {String(entries.length).padStart(2, "0")}
          </p>
        </div>
        <h3 className="mt-3 text-[22px] leading-[28px] font-bold tracking-[-0.03em] md:text-[26px] md:leading-[32px]">
          {entry.title}
        </h3>
        <p className="text-muted mt-2 max-w-[560px] text-[15px] leading-[23px]">
          {entry.body}
        </p>
      </div>

      <div className="mt-4 flex items-center gap-2.5">
        <button
          aria-label={labels.previous}
          className="border-ink text-ink hover:bg-surface focus-visible:outline-gold flex size-11 items-center justify-center rounded-full border-[1.5px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-30"
          disabled={index === 0}
          onClick={() => move(-1)}
          type="button"
        >
          <ArrowLeft aria-hidden="true" size={17} strokeWidth={1.8} />
        </button>
        <button
          aria-label={labels.next}
          className="bg-ink text-paper hover:bg-ink/85 focus-visible:outline-gold flex size-11 items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-30"
          disabled={index === entries.length - 1}
          onClick={() => move(1)}
          type="button"
        >
          <ArrowRight aria-hidden="true" size={17} strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
}
