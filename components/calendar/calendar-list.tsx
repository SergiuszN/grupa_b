"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import {
  CalendarDays,
  ChevronRight,
  Clock,
  Frame,
  Info,
  LayoutGrid,
  MapPin,
  Music,
  Play,
} from "lucide-react";

export type CalendarTerm = {
  id: number;
  eventId: number;
  day: string;
  time: string;
  category: "concerts" | "exhibitions" | "others";
  title: string;
  subtitle: string | null;
  image: string | null;
  venue: string | null;
  href: string | null;
  playable: boolean;
};

export type CalendarDay = {
  key: string;
  label: string;
  date: string;
};

type Labels = {
  all: string;
  concerts: string;
  exhibitions: string;
  others: string;
  details: string;
  footnote: string;
};

const FILTERS = [
  { key: "all", Icon: LayoutGrid },
  { key: "concerts", Icon: Music },
  { key: "exhibitions", Icon: Frame },
  { key: "others", Icon: CalendarDays },
] as const;

type Filter = (typeof FILTERS)[number]["key"];

const CATEGORY: Record<CalendarTerm["category"], keyof Labels> = {
  concerts: "concerts",
  exhibitions: "exhibitions",
  others: "others",
};

export function CalendarList({
  days,
  terms,
  labels,
  emptyLabel,
}: {
  days: CalendarDay[];
  terms: CalendarTerm[];
  labels: Labels;
  emptyLabel: string;
}) {
  const [filter, setFilter] = useState<Filter>("all");

  const visible =
    filter === "all" ? terms : terms.filter((term) => term.category === filter);

  return (
    <>
      <div className="flex gap-2 overflow-x-auto px-6 pt-4 pb-2 [scrollbar-width:none]">
        {FILTERS.map(({ key, Icon }) => {
          const active = filter === key;

          return (
            <button
              className={`focus-visible:outline-gold flex h-[34px] shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] leading-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
                active
                  ? "bg-ink text-paper"
                  : "border-line text-ink hover:bg-surface border"
              }`}
              key={key}
              onClick={() => setFilter(key)}
              type="button"
            >
              <Icon aria-hidden="true" size={15} strokeWidth={1.6} />
              {labels[key]}
            </button>
          );
        })}
      </div>

      <div className="flex flex-1 flex-col px-5 pt-2 md:px-6">
        {visible.length === 0 ? (
          <p className="text-muted px-1 py-8 text-[14px] leading-5">
            {emptyLabel}
          </p>
        ) : (
          days.map((day) => {
            const dayTerms = visible.filter((term) => term.day === day.key);

            if (dayTerms.length === 0) return null;

            return (
              <section className="pt-7 first:pt-3" key={day.key}>
                <header className="flex items-baseline justify-between gap-4 px-1">
                  <h2 className="text-[30px] leading-8 font-bold tracking-[-0.03em]">
                    {day.label}
                  </h2>
                  <p className="text-muted text-[12px] leading-4">{day.date}</p>
                </header>

                <div className="mt-2">
                  {dayTerms.map((term) => (
                    <Link
                      className="border-line hover:bg-surface focus-visible:outline-gold flex items-center gap-3.5 border-b px-1 py-4 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2"
                      href={`/calendar/${term.eventId}`}
                      key={term.id}
                    >
                      <div className="relative size-[72px] shrink-0">
                        <div
                          className="size-full overflow-clip rounded-xl bg-[#E7E2D8] bg-cover bg-[50%]"
                          style={
                            term.image
                              ? { backgroundImage: `url(${term.image})` }
                              : undefined
                          }
                        />
                        {term.playable ? (
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
                          {labels[CATEGORY[term.category]]}
                        </p>
                        <h3 className="text-[17px] leading-5 font-bold tracking-[-0.02em]">
                          {term.title}
                        </h3>
                        {term.subtitle ? (
                          <p className="text-muted text-[13px] leading-4">
                            {term.subtitle}
                          </p>
                        ) : null}
                        <p className="text-muted mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] leading-4">
                          <span className="flex items-center gap-1">
                            <Clock aria-hidden="true" size={12} strokeWidth={1.8} />
                            {term.time}
                          </span>
                          {term.venue ? (
                            <span className="flex items-center gap-1">
                              <MapPin
                                aria-hidden="true"
                                size={12}
                                strokeWidth={1.8}
                              />
                              {term.venue}
                            </span>
                          ) : null}
                        </p>
                      </div>

                      <span
                        aria-hidden="true"
                        className="border-line text-ink flex size-9 shrink-0 items-center justify-center rounded-full border"
                      >
                        <Info size={16} strokeWidth={1.8} />
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })
        )}

        <p className="text-muted max-w-[310px] px-1 pt-[22px] text-[14px] leading-5">
          {labels.footnote}
        </p>
      </div>
    </>
  );
}
