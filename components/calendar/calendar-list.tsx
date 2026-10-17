"use client";

import { useState } from "react";
import { ChevronRight, Play } from "lucide-react";

export type CalendarEvent = {
  id: number;
  category: "concerts" | "exhibitions" | "others";
  title: string;
  meta: string;
  image: string | null;
  href: string | null;
  playable: boolean;
};

type Labels = {
  all: string;
  concerts: string;
  exhibitions: string;
  others: string;
  details: string;
  footnote: string;
};

const FILTERS = ["all", "concerts", "exhibitions", "others"] as const;
type Filter = (typeof FILTERS)[number];

const CATEGORY: Record<CalendarEvent["category"], keyof Labels> = {
  concerts: "concerts",
  exhibitions: "exhibitions",
  others: "others",
};

export function CalendarList({
  events,
  labels,
  emptyLabel,
}: {
  events: CalendarEvent[];
  labels: Labels;
  emptyLabel: string;
}) {
  const [filter, setFilter] = useState<Filter>("all");

  const visible =
    filter === "all" ? events : events.filter((event) => event.category === filter);

  return (
    <>
      <div className="flex gap-2 overflow-x-auto px-6 pt-4 pb-2 [scrollbar-width:none]">
        {FILTERS.map((key) => {
          const active = filter === key;

          return (
            <button
              className={`focus-visible:outline-gold flex h-[34px] shrink-0 items-center rounded-full px-3.5 text-[13px] leading-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
                active
                  ? "bg-ink text-paper"
                  : "border-line text-ink hover:bg-surface border"
              }`}
              key={key}
              onClick={() => setFilter(key)}
              type="button"
            >
              {labels[key]}
            </button>
          );
        })}
      </div>

      <div className="flex flex-1 flex-col px-5 pt-2.5 md:px-6">
        {visible.length === 0 ? (
          <p className="text-muted px-1 py-8 text-[14px] leading-5">
            {emptyLabel}
          </p>
        ) : (
          visible.map((event) => (
            <article
              className="border-line flex items-center gap-3.5 border-b px-1 py-4"
              key={event.id}
            >
              <div className="relative size-[72px] shrink-0">
                <div
                  className="size-full overflow-clip rounded-xl bg-[#E7E2D8] bg-cover bg-[50%]"
                  style={
                    event.image
                      ? { backgroundImage: `url(${event.image})` }
                      : undefined
                  }
                />
                {event.playable ? (
                  <span className="bg-gold absolute right-1 bottom-1 flex size-[26px] items-center justify-center rounded-full">
                    <Play
                      aria-hidden="true"
                      className="translate-x-px text-white"
                      fill="currentColor"
                      size={11}
                      strokeWidth={0}
                    />
                  </span>
                ) : null}
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <p className="text-gold text-[11px] leading-[14px] font-medium tracking-[0.12em]">
                  {labels[CATEGORY[event.category]]}
                </p>
                <h2 className="text-[17px] leading-5 font-bold tracking-[-0.02em]">
                  {event.title}
                </h2>
                <p className="text-muted text-[13px] leading-4">{event.meta}</p>
              </div>

              {event.href ? (
                <a
                  className="focus-visible:outline-gold flex shrink-0 items-center gap-0.5 rounded-sm text-[13px] leading-4 font-medium focus-visible:outline-2 focus-visible:outline-offset-4"
                  href={event.href}
                  rel="noreferrer"
                  target="_blank"
                >
                  {labels.details}
                  <ChevronRight aria-hidden="true" size={14} strokeWidth={1.4} />
                </a>
              ) : (
                <span className="text-muted flex shrink-0 items-center text-[13px] leading-4">
                  {labels.details}
                  <ChevronRight aria-hidden="true" size={14} strokeWidth={1.4} />
                </span>
              )}
            </article>
          ))
        )}

        <p className="text-muted max-w-[310px] px-1 pt-[22px] text-[14px] leading-5">
          {labels.footnote}
        </p>
      </div>
    </>
  );
}
