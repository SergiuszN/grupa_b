"use client";

import { useSearchParams } from "next/navigation";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { eventSlug } from "@/lib/format";
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
import type { CalendarDay, CalendarTerm } from "@/lib/calendar-performances";
import { useProgressiveList } from "@/lib/use-progressive-list";

export type { CalendarDay, CalendarTerm };

export type CalendarEvent = {
  id: string | number;
  category: "concerts" | "exhibitions" | "others";
  title: string;
  meta: string;
  image: string | null;
  href: string | null;
  playable: boolean;
};

export type CalendarLabels = {
  all: string;
  concerts: string;
  exhibitions: string;
  others: string;
  details: string;
  footnote: string;
  today?: string;
  tomorrow?: string;
  inWeek?: string;
  loadingMore?: string;
  loadMore?: string;
};

const FILTERS = [
  { key: "all", Icon: LayoutGrid },
  { key: "concerts", Icon: Music },
  { key: "exhibitions", Icon: Frame },
  { key: "others", Icon: CalendarDays },
] as const;

type Filter = (typeof FILTERS)[number]["key"];

const CATEGORY: Record<"concerts" | "exhibitions" | "others", keyof CalendarLabels> = {
  concerts: "concerts",
  exhibitions: "exhibitions",
  others: "others",
};

export type CalendarListProps = {
  events?: CalendarEvent[];
  days?: CalendarDay[];
  terms?: CalendarTerm[];
  labels: CalendarLabels;
  emptyLabel: string;
  initialCategory?: string;
};

function CalendarSkeletonItem() {
  return (
    <div
      aria-hidden="true"
      className="border-line flex items-center gap-3.5 border-b px-1 py-4 animate-pulse pointer-events-none select-none"
    >
      {/* 1. Zdjęcie */}
      <div className="size-[72px] shrink-0 rounded-xl bg-line" />

      {/* 2. Teksty */}
      <div className="flex min-w-0 flex-1 flex-col gap-[7px]">
        {/* Kategoria */}
        <div className="h-2.5 w-16 rounded-full bg-gold/40" />

        {/* Tytuł wydarzenia */}
        <div className="h-4 w-4/5 rounded bg-ink/15" />

        {/* Kategoria · Dzień, Godzina */}
        <div className="h-3 w-48 rounded bg-ink/10" />
      </div>

      {/* 3. Details > */}
      <div className="flex shrink-0 items-center gap-1 opacity-40">
        <div className="h-3 w-10 rounded bg-ink/10" />
        <ChevronRight aria-hidden="true" size={14} className="text-muted" strokeWidth={1.4} />
      </div>
    </div>
  );
}

export function CalendarList({
  events,
  days,
  terms,
  labels,
  emptyLabel,
  initialCategory,
}: CalendarListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentParam = searchParams.get("category");
  const filter: Filter = (
    currentParam && FILTERS.some((f) => f.key === currentParam)
      ? currentParam
      : initialCategory && FILTERS.some((f) => f.key === initialCategory)
        ? initialCategory
        : "all"
  ) as Filter;

  function handleFilterChange(key: Filter) {
    const params = new URLSearchParams(searchParams.toString());
    if (key === "all") {
      params.delete("category");
    } else {
      params.set("category", key);
    }
    const qs = params.toString();
    const target = qs ? `${pathname}?${qs}` : pathname;
    router.replace(target, { scroll: false });
  }

  // Mode A: Day-grouped terms
  const hasDayGroups = Array.isArray(days) && Array.isArray(terms);

  const visibleTerms = terms
    ? filter === "all"
      ? terms
      : terms.filter((term) => term.category === filter)
    : [];

  const activeDays = days
    ? days.filter((day) => visibleTerms.some((term) => term.day === day.key))
    : [];

  const {
    visibleItems: visibleDays,
    hasMore: hasMoreDays,
    sentinelRef: daysSentinelRef,
    loadedCount: loadedDaysCount,
    totalCount: totalDaysCount,
  } = useProgressiveList(activeDays, {
    initialCount: 4,
    pageSize: 4,
    rootMargin: "50px",
    delayMs: 1200,
  });

  // Mode B: Flat events list
  const filteredEvents = events
    ? filter === "all"
      ? events
      : events.filter((e) => e.category === filter)
    : [];

  const {
    visibleItems: visibleEvents,
    hasMore: hasMoreEvents,
    sentinelRef: eventsSentinelRef,
    loadedCount: loadedEventsCount,
    totalCount: totalEventsCount,
  } = useProgressiveList(filteredEvents, {
    initialCount: 6,
    pageSize: 6,
    rootMargin: "50px",
    delayMs: 1200,
  });

  return (
    <>
      {/* Category filter tabs */}
      <div className="flex gap-2 overflow-x-auto px-6 pt-2 pb-2 [scrollbar-width:none]">
        {FILTERS.map(({ key, Icon }) => {
          const active = filter === key;

          return (
            <button
              className={`focus-visible:outline-gold flex h-[34px] shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[0.8125rem] leading-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer ${
                active
                  ? "bg-ink text-paper"
                  : "border-line text-ink hover:bg-surface border"
              }`}
              key={key}
              onClick={() => handleFilterChange(key)}
              type="button"
            >
              <Icon aria-hidden="true" size={15} strokeWidth={1.6} />
              {labels[key]}
            </button>
          );
        })}
      </div>

      <div className="flex flex-1 flex-col px-5 pt-2 md:px-6">
        {hasDayGroups ? (
          // RENDER MODE A: Grouped by day
          activeDays.length === 0 ? (
            <p className="text-muted px-1 py-8 text-[0.875rem] leading-5">
              {emptyLabel}
            </p>
          ) : (
            visibleDays.map((day, dayIndex) => {
              const dayTerms = visibleTerms.filter((term) => term.day === day.key);
              if (dayTerms.length === 0) return null;

              return (
                <section
                  className="pt-7 first:pt-3"
                  key={day.key ? `day-${day.key}` : `day-${dayIndex}`}
                >
                  <div className="flex items-baseline justify-between gap-4 px-1">
                    <h2 className="text-[1.875rem] leading-8 font-bold tracking-[-0.03em]">
                      {day.label}
                    </h2>
                    <time
                      className="text-muted text-[0.75rem] leading-4"
                      dateTime={day.key}
                    >
                      {day.date}
                    </time>
                  </div>

                  <div className="mt-2 divide-y divide-line">
                    {dayTerms.map((term, termIndex) => {
                      const itemKey =
                        term.id !== null && term.id !== undefined
                          ? `term-${term.id}`
                          : `term-${day.key}-${termIndex}`;

                      const cardContent = (
                        <>
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
                            <p className="text-gold text-[0.6875rem] leading-[0.875rem] font-medium tracking-[0.12em]">
                              {labels[CATEGORY[term.category]]}
                            </p>
                            <h3 className="text-[1.0625rem] leading-5 font-bold tracking-[-0.02em]">
                              {term.title}
                            </h3>
                            {term.subtitle ? (
                              <p className="text-muted text-[0.8125rem] leading-4">
                                {term.subtitle}
                              </p>
                            ) : null}
                            <p className="text-muted mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.75rem] leading-4">
                              <span className="flex items-center gap-1">
                                <Clock aria-hidden="true" size={12} strokeWidth={1.8} />
                                <time
                                  dateTime={
                                    /^\d{2}:\d{2}$/.test(term.time)
                                      ? `${day.key}T${term.time}`
                                      : day.key
                                  }
                                >
                                  <span className="sr-only">{day.date}, </span>
                                  {term.time}
                                </time>
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
                            className="border-line text-ink flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors group-hover:border-gold group-hover:text-gold"
                          >
                            <Info size={16} strokeWidth={1.8} />
                          </span>
                        </>
                      );

                      return term.eventId ? (
                        <Link
                          className="group hover:bg-surface focus-visible:outline-gold flex items-center gap-3.5 px-1 py-4 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 rounded-xl"
                          href={`/calendar/${eventSlug(term.eventId, term.title)}`}
                          key={itemKey}
                        >
                          {cardContent}
                        </Link>
                      ) : (
                        <div
                          className="flex items-center gap-3.5 px-1 py-4"
                          key={itemKey}
                        >
                          {cardContent}
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })
          )
        ) : (
          // RENDER MODE B: Flat list of events
          filteredEvents.length === 0 ? (
            <p className="text-muted px-1 py-8 text-[0.875rem] leading-5">
              {emptyLabel}
            </p>
          ) : (
            visibleEvents.map((event, eventIndex) => {
              const itemKey =
                event.id !== null && event.id !== undefined
                  ? `event-${event.id}`
                  : `event-${eventIndex}`;

              return (
                <article
                  className="border-line flex items-center gap-3.5 border-b px-1 py-4 transition-opacity duration-300"
                  key={itemKey}
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
                    <p className="text-gold text-[0.6875rem] leading-[0.875rem] font-medium tracking-[0.12em]">
                      {labels[CATEGORY[event.category]]}
                    </p>
                    <h2 className="text-[1.0625rem] leading-5 font-bold tracking-[-0.02em]">
                      {event.title}
                    </h2>
                    <p className="text-muted text-[0.8125rem] leading-4">{event.meta}</p>
                  </div>

                  {event.href ? (
                    <a
                      className="focus-visible:outline-gold flex shrink-0 items-center gap-0.5 rounded-sm text-[0.8125rem] leading-4 font-medium focus-visible:outline-2 focus-visible:outline-offset-4"
                      href={event.href}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {labels.details}
                      <ChevronRight aria-hidden="true" size={14} strokeWidth={1.4} />
                    </a>
                  ) : (
                    <span className="text-muted flex shrink-0 items-center text-[0.8125rem] leading-4">
                      {labels.details}
                      <ChevronRight aria-hidden="true" size={14} strokeWidth={1.4} />
                    </span>
                  )}
                </article>
              );
            })
          )
        )}

        {/* PROGRESSIVE / LAZY SCROLL SKELETON SENTINEL */}
        {hasDayGroups ? (
          hasMoreDays && (
            <div ref={daysSentinelRef} className="w-full">
              <CalendarSkeletonItem />
            </div>
          )
        ) : (
          hasMoreEvents && (
            <div ref={eventsSentinelRef} className="w-full">
              <CalendarSkeletonItem />
            </div>
          )
        )}

        <div className="flex items-center justify-between pt-6 pb-2 text-muted text-[0.8125rem] leading-4">
          <p className="max-w-[310px] px-1">{labels.footnote}</p>
          <span className="shrink-0 text-right text-[0.75rem] tabular-nums font-medium">
            {hasDayGroups
              ? `${loadedDaysCount} / ${totalDaysCount} dni`
              : `${loadedEventsCount} / ${totalEventsCount}`}
          </span>
        </div>
      </div>
    </>
  );
}
