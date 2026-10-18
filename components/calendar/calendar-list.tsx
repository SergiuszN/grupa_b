"use client";

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { eventSlug } from "@/lib/format";
import {
  ChevronRight,
  Clock,
  Info,
  MapPin,
  Play,
  Search,
  Share2,
  SlidersHorizontal,
  Ticket,
} from "lucide-react";
import type { CalendarDay, CalendarTerm } from "@/lib/calendar-performances";
import {
  ACCESS,
  AUDIENCES,
  DURATIONS,
  EMPTY_FILTERS,
  MOODS,
  PRICES,
  TYPES,
  VENUES,
  WHEN,
  activeGroups,
  clearGroup,
  matches,
  parseFilters,
  serializeFilters,
  type CalendarFilters,
} from "@/lib/calendar-filters";
import {
  FilterPanel,
  FilterSheet,
  QuickFilters,
  type OptionCounts,
} from "@/components/calendar/calendar-filters";
import { useProgressiveList } from "@/lib/use-progressive-list";

export type { CalendarDay, CalendarTerm };

export type CalendarLabels = {
  footnote: string;
};

export type CalendarListProps = {
  days: CalendarDay[];
  terms: CalendarTerm[];
  today: string;
  labels: CalendarLabels;
  emptyLabel: string;
};

const MULTI = [
  ["types", TYPES],
  ["audiences", AUDIENCES],
  ["moods", MOODS],
  ["venues", VENUES],
  ["access", ACCESS],
] as const;

const SINGLE = [
  ["price", PRICES],
  ["duration", DURATIONS],
] as const;

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

export function CalendarList({ days, terms, today, labels, emptyLabel }: CalendarListProps) {
  const t = useTranslations("CalendarFilters");
  const searchParams = useSearchParams();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const filters = useMemo(
    () => parseFilters(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  // Native history keeps useSearchParams in sync without a server round trip.
  const setFilters = useCallback((next: CalendarFilters) => {
    const qs = serializeFilters(next);
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, []);
  const clearFilters = useCallback(() => setFilters(EMPTY_FILTERS), [setFilters]);
  const closeSheet = useCallback(() => setSheetOpen(false), []);

  const visibleTerms = useMemo(
    () => terms.filter((term) => matches(term, filters, today)),
    [terms, filters, today],
  );

  // Faceted counts: how many results each option gives together with the other filters.
  // Options that never occur in the programme are left out, so they are not shown.
  const counts = useMemo(() => {
    const count = (patch: Partial<CalendarFilters>, base: CalendarFilters) =>
      terms.filter((term) => matches(term, { ...base, ...patch }, today)).length;
    const out: OptionCounts = { when: {} };

    for (const option of WHEN) {
      if (option !== "range") out.when![option] = count({ when: option }, filters);
    }
    for (const [key, options] of MULTI) {
      out[key] = {};
      for (const option of options) {
        if (count({ [key]: [option] }, EMPTY_FILTERS) > 0) {
          out[key]![option] = count({ [key]: [option] }, filters);
        }
      }
    }
    for (const [key, options] of SINGLE) {
      out[key] = {};
      for (const option of options) {
        if (count({ [key]: option }, EMPTY_FILTERS) > 0) {
          out[key]![option] = count({ [key]: option }, filters);
        }
      }
    }
    return out;
  }, [terms, filters, today]);

  const groups = activeGroups(filters);
  const panelGroups = groups.filter((group) => group !== "q").length;

  // When nothing matches, suggest dropping the single filter that brings most results back.
  const suggestions = useMemo(() => {
    if (visibleTerms.length > 0) return [];
    return groups
      .map((group) => ({
        group,
        count: terms.filter((term) => matches(term, filters, today, group)).length,
      }))
      .filter((s) => s.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [visibleTerms.length, groups, terms, filters, today]);

  const searchOptions = useMemo(
    () => [...new Set(terms.flatMap((term) => [...term.people, ...term.series]))].sort(),
    [terms],
  );

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Share sheet dismissed or clipboard blocked.
    }
  }

  const activeDays = days.filter((day) => visibleTerms.some((term) => term.day === day.key));

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

  function ticketLabel(term: CalendarTerm) {
    if (term.ticketStatus === "sold_out") return t("ticket.sold_out");
    if (term.ticketStatus === "last_seats") return t("ticket.last_seats");
    if (term.ticketStatus === "free") return t("ticket.free");
    if (term.ticketStatus === "registration_required") return t("ticket.registration_required");
    if (term.priceMin !== null) return t("ticket.from", { price: term.priceMin });
    return null;
  }

  const filterButton = (
    <button
      aria-expanded={sheetOpen}
      aria-haspopup="dialog"
      className="border-ink focus-visible:outline-gold hover:bg-surface inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] px-4 text-[0.8125rem] leading-4 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 lg:hidden"
      onClick={() => setSheetOpen(true)}
      type="button"
    >
      <SlidersHorizontal aria-hidden="true" size={15} strokeWidth={1.8} />
      {t("filters")}
      {panelGroups > 0 ? (
        <span className="bg-ink text-paper flex size-5 items-center justify-center rounded-full text-[0.6875rem] tabular-nums">
          {panelGroups}
        </span>
      ) : null}
    </button>
  );

  const panel = <FilterPanel counts={counts} filters={filters} onChange={setFilters} />;

  return (
    <>
      <div className="px-5 pt-6 md:px-6">
        <label className="sr-only" htmlFor="calendar-search">
          {t("searchLabel")}
        </label>
        <div className="relative">
          <Search
            aria-hidden="true"
            className="text-muted pointer-events-none absolute top-1/2 left-4 -translate-y-1/2"
            size={16}
            strokeWidth={1.8}
          />
          <input
            autoComplete="off"
            className="border-line bg-surface focus-visible:outline-gold placeholder:text-muted h-12 w-full rounded-full border pr-4 pl-11 text-[0.9375rem] focus-visible:outline-2 focus-visible:outline-offset-2"
            id="calendar-search"
            list="calendar-search-options"
            onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            placeholder={t("searchPlaceholder")}
            type="search"
            value={filters.q}
          />
          <datalist id="calendar-search-options">
            {searchOptions.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </div>
      </div>

      <QuickFilters filters={filters} onChange={setFilters} trailing={filterButton} />

      <div className="flex flex-1 flex-col lg:grid lg:grid-cols-[300px_1fr] lg:items-start lg:gap-10 lg:px-6">
        <aside
          aria-label={t("filters")}
          className="hidden lg:sticky lg:top-4 lg:block lg:max-h-[calc(100dvh-2rem)] lg:overflow-y-auto lg:pt-4 lg:pr-1"
        >
          {panel}
        </aside>

        <div className="flex flex-1 flex-col px-5 pt-2 md:px-6 lg:px-0">
          <div className="flex min-h-11 items-center justify-between gap-3 px-1">
            <p aria-live="polite" className="text-[0.875rem] leading-5 font-medium" role="status">
              {t("results", { count: visibleTerms.length })}
            </p>
            <div className="flex items-center gap-1">
              {groups.length > 0 ? (
                <button
                  className="focus-visible:outline-gold text-muted hover:text-ink min-h-11 cursor-pointer rounded-full px-3 text-[0.8125rem] underline-offset-4 hover:underline focus-visible:outline-2"
                  onClick={clearFilters}
                  type="button"
                >
                  {t("clear")}
                </button>
              ) : null}
              <button
                className="focus-visible:outline-gold hover:bg-surface inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full px-3 text-[0.8125rem] focus-visible:outline-2"
                onClick={share}
                type="button"
              >
                <Share2 aria-hidden="true" size={15} strokeWidth={1.8} />
                <span aria-live="polite">{copied ? t("copied") : t("share")}</span>
              </button>
            </div>
          </div>

          {activeDays.length === 0 ? (
            <div className="px-1 py-8">
              <p className="text-[0.9375rem] leading-6 font-medium">
                {groups.length > 0 ? t("noResults") : emptyLabel}
              </p>
              {suggestions.length > 0 ? (
                <>
                  <p className="text-muted mt-3 text-[0.8125rem]">{t("tryInstead")}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {suggestions.map(({ group, count }) => (
                      <button
                        className="border-line focus-visible:outline-gold hover:bg-surface inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-[0.8125rem] focus-visible:outline-2 focus-visible:outline-offset-2"
                        key={group}
                        onClick={() => setFilters(clearGroup(filters, group))}
                        type="button"
                      >
                        {t("without", { label: t(`groups.${group}`) })}
                        <span className="text-muted tabular-nums">{count}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
              {groups.length > 0 ? (
                <button
                  className="bg-ink text-paper focus-visible:outline-gold mt-4 min-h-11 cursor-pointer rounded-full px-5 text-[0.8125rem] font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
                  onClick={clearFilters}
                  type="button"
                >
                  {t("clear")}
                </button>
              ) : null}
            </div>
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
                      const ticket = ticketLabel(term);

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
                            <p className="text-gold text-[0.6875rem] leading-[0.875rem] font-medium tracking-[0.12em] uppercase">
                              {t.has(`types.${term.kind}`) ? t(`types.${term.kind}`) : term.kind}
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
                              {ticket ? (
                                <span
                                  className={`flex items-center gap-1 ${
                                    term.ticketStatus === "sold_out" ? "text-ink font-medium" : ""
                                  }`}
                                >
                                  <Ticket aria-hidden="true" size={12} strokeWidth={1.8} />
                                  {ticket}
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
          )}

          {/* PROGRESSIVE / LAZY SCROLL SKELETON SENTINEL */}
          {hasMoreDays && (
            <div ref={daysSentinelRef} className="w-full">
              <CalendarSkeletonItem />
            </div>
          )}

          <div className="flex items-center justify-between pt-6 pb-2 text-muted text-[0.8125rem] leading-4">
            <p className="max-w-[310px] px-1">{labels.footnote}</p>
            <span className="shrink-0 text-right text-[0.75rem] tabular-nums font-medium">
              {`${loadedDaysCount} / ${totalDaysCount} dni`}
            </span>
          </div>
        </div>
      </div>

      <FilterSheet
        onClear={clearFilters}
        onClose={closeSheet}
        open={sheetOpen}
        resultCount={visibleTerms.length}
      >
        {panel}
      </FilterSheet>
    </>
  );
}
