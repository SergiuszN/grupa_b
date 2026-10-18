"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  Accessibility,
  Armchair,
  AudioLines,
  Baby,
  Backpack,
  Blocks,
  Brain,
  CalendarDays,
  CalendarHeart,
  CalendarRange,
  CalendarSearch,
  Clock,
  DoorOpen,
  Drum,
  Ear,
  Eye,
  Footprints,
  Frame,
  Gift,
  GraduationCap,
  Heart,
  Hourglass,
  Landmark,
  Leaf,
  Megaphone,
  Music,
  PartyPopper,
  Piano,
  School,
  Sparkles,
  Sprout,
  Star,
  Sun,
  Sunrise,
  Timer,
  Trees,
  User,
  Users,
  Wallet,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  ACCESS,
  AUDIENCES,
  DURATIONS,
  MOODS,
  PRICES,
  TYPES,
  VENUES,
  WHEN,
  type CalendarFilters,
} from "@/lib/calendar-filters";

/** Number of results each option would give; options missing here are hidden. */
export type OptionCounts = Partial<Record<keyof CalendarFilters, Record<string, number>>>;

const ICONS: Record<string, Record<string, LucideIcon>> = {
  when: {
    today: Sun,
    tomorrow: Sunrise,
    weekend: CalendarHeart,
    week: CalendarRange,
    month: CalendarDays,
    range: CalendarSearch,
  },
  types: {
    symphonic: Music,
    chamber: Piano,
    jazz: Drum,
    concert: AudioLines,
    education: GraduationCap,
    exhibition: Frame,
    tour: Footprints,
    festival: PartyPopper,
    external: Megaphone,
    other: Sparkles,
  },
  audiences: {
    children: Baby,
    families: Users,
    preschool: Blocks,
    youth: Backpack,
    schools: School,
    adults: User,
    seniors: Armchair,
    beginners: Sprout,
  },
  moods: {
    "classical-super-hits": Star,
    emotional: Heart,
    energy: Zap,
    relax: Leaf,
    "something-extraordinary": Sparkles,
  },
  venues: { symphony: Landmark, chamber: DoorOpen, galleries: Frame, outside: Trees },
  price: { free: Gift, "30": Wallet, "50": Wallet, "100": Wallet },
  duration: { "45": Timer, "90": Clock, long: Hourglass },
  access: { mobility: Accessibility, visual: Eye, hearing: Ear, sensory: Brain },
};

type PanelProps = {
  filters: CalendarFilters;
  counts: OptionCounts;
  onChange: (next: CalendarFilters) => void;
};

const chipClass = (active: boolean) =>
  `focus-visible:outline-gold inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-4 text-[0.8125rem] leading-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
    active ? "bg-ink text-paper" : "border-line text-ink hover:bg-surface border"
  }`;

function Chip({
  active,
  count,
  icon: Icon,
  onClick,
  children,
}: {
  active: boolean;
  count?: number;
  icon?: LucideIcon;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button aria-pressed={active} className={chipClass(active)} onClick={onClick} type="button">
      {Icon ? <Icon aria-hidden="true" size={15} strokeWidth={1.6} /> : null}
      {children}
      {count !== undefined && !active ? (
        <span className="text-muted tabular-nums">{count}</span>
      ) : null}
    </button>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="border-line border-t pt-4 pb-5 first:border-t-0 first:pt-0">
      <legend className="float-left mb-3 w-full text-[0.75rem] leading-4 font-medium tracking-[0.12em] uppercase">
        {title}
      </legend>
      <div className="clear-both flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

function toggle(values: string[], value: string) {
  return values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
}

export function FilterPanel({ filters, counts, onChange }: PanelProps) {
  const t = useTranslations("CalendarFilters");
  const ageId = useId();
  const fromId = useId();
  const toId = useId();

  function multi(
    key: "types" | "audiences" | "moods" | "venues" | "access",
    options: readonly string[],
    title: string,
    extra?: ReactNode,
  ) {
    const visible = options.filter((o) => counts[key]?.[o] !== undefined || filters[key].includes(o));
    if (!visible.length) return null;
    return (
      <Group title={title}>
        {visible.map((option) => (
          <Chip
            active={filters[key].includes(option)}
            count={counts[key]?.[option]}
            icon={ICONS[key][option]}
            key={option}
            onClick={() => onChange({ ...filters, [key]: toggle(filters[key], option) })}
          >
            {t(`${key}.${option}`)}
          </Chip>
        ))}
        {extra}
      </Group>
    );
  }

  function single(key: "price" | "duration", options: readonly string[], title: string) {
    const visible = options.filter((o) => counts[key]?.[o] !== undefined || filters[key] === o);
    if (!visible.length) return null;
    return (
      <Group title={title}>
        {visible.map((option) => (
          <Chip
            active={filters[key] === option}
            count={counts[key]?.[option]}
            icon={ICONS[key][option]}
            key={option}
            onClick={() => onChange({ ...filters, [key]: filters[key] === option ? null : option })}
          >
            {t(`${key}.${option}`)}
          </Chip>
        ))}
      </Group>
    );
  }

  const dateInput =
    "border-line focus-visible:outline-gold bg-paper text-ink mt-1 block h-11 w-full rounded-sm border px-3 text-[0.875rem] focus-visible:outline-2 focus-visible:outline-offset-2";

  return (
    <div>
      <Group title={t("groups.when")}>
        {WHEN.map((option) => (
          <Chip
            active={filters.when === option}
            count={option === "range" ? undefined : counts.when?.[option]}
            icon={ICONS.when[option]}
            key={option}
            onClick={() =>
              onChange({ ...filters, when: filters.when === option ? null : option })
            }
          >
            {t(`when.${option}`)}
          </Chip>
        ))}
        {filters.when === "range" ? (
          <div className="mt-1 grid w-full grid-cols-2 gap-3">
            <label className="text-muted text-[0.75rem]" htmlFor={fromId}>
              {t("from")}
              <input
                className={dateInput}
                id={fromId}
                max={filters.to ?? undefined}
                onChange={(e) => onChange({ ...filters, from: e.target.value || null })}
                type="date"
                value={filters.from ?? ""}
              />
            </label>
            <label className="text-muted text-[0.75rem]" htmlFor={toId}>
              {t("to")}
              <input
                className={dateInput}
                id={toId}
                min={filters.from ?? undefined}
                onChange={(e) => onChange({ ...filters, to: e.target.value || null })}
                type="date"
                value={filters.to ?? ""}
              />
            </label>
          </div>
        ) : null}
      </Group>

      {multi("types", TYPES, t("groups.types"))}

      {multi(
        "audiences",
        AUDIENCES,
        t("groups.audiences"),
        <label className="text-muted mt-1 flex w-full items-center gap-3 text-[0.8125rem]" htmlFor={ageId}>
          {t("age")}
          <select
            className="border-line focus-visible:outline-gold bg-paper text-ink h-11 rounded-sm border px-3 text-[0.875rem] focus-visible:outline-2 focus-visible:outline-offset-2"
            id={ageId}
            onChange={(e) =>
              onChange({ ...filters, age: e.target.value ? Number(e.target.value) : null })
            }
            value={filters.age ?? ""}
          >
            <option value="">{t("anyAge")}</option>
            {Array.from({ length: 18 }, (_, i) => i + 1).map((age) => (
              <option key={age} value={age}>
                {t("years", { age })}
              </option>
            ))}
          </select>
        </label>,
      )}

      {multi("moods", MOODS, t("groups.moods"))}
      {multi("venues", VENUES, t("groups.venues"))}
      {single("price", PRICES, t("groups.price"))}
      {single("duration", DURATIONS, t("groups.duration"))}
      {multi("access", ACCESS, t("groups.access"))}
    </div>
  );
}

const QUICK = [
  { key: "today", label: "when.today", icon: ICONS.when.today },
  { key: "weekend", label: "when.weekend", icon: ICONS.when.weekend },
  { key: "children", label: "audiences.children", icon: ICONS.audiences.children },
  { key: "jazz", label: "types.jazz", icon: ICONS.types.jazz },
  { key: "exhibition", label: "types.exhibition", icon: ICONS.types.exhibition },
] as const;

/** Shortcuts from the brief: Today, This weekend, For children, Jazz, Exhibitions. */
export function QuickFilters({
  filters,
  onChange,
  trailing,
}: {
  filters: CalendarFilters;
  onChange: (next: CalendarFilters) => void;
  trailing?: ReactNode;
}) {
  const t = useTranslations("CalendarFilters");

  const state = {
    today: filters.when === "today",
    weekend: filters.when === "weekend",
    children: filters.audiences.includes("children"),
    jazz: filters.types.includes("jazz"),
    exhibition: filters.types.includes("exhibition"),
  };

  function apply(key: (typeof QUICK)[number]["key"]) {
    switch (key) {
      case "today":
      case "weekend":
        return onChange({ ...filters, when: state[key] ? null : key });
      case "children":
        return onChange({ ...filters, audiences: toggle(filters.audiences, "children") });
      case "jazz":
      case "exhibition":
        return onChange({ ...filters, types: toggle(filters.types, key) });
    }
  }

  return (
    <div
      aria-label={t("quick")}
      className="flex gap-2 overflow-x-auto px-5 py-2 [scrollbar-width:none] md:px-6"
      role="group"
    >
      {trailing}
      {QUICK.map(({ key, label, icon }) => (
        <Chip active={state[key]} icon={icon} key={key} onClick={() => apply(key)}>
          {t(label)}
        </Chip>
      ))}
    </div>
  );
}

/** Mobile bottom sheet with the full filter panel and a live result count. */
export function FilterSheet({
  open,
  onClose,
  resultCount,
  onClear,
  children,
}: {
  open: boolean;
  onClose: () => void;
  resultCount: number;
  onClear: () => void;
  children: ReactNode;
}) {
  const t = useTranslations("CalendarFilters");
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      // Keep keyboard focus inside the sheet.
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        "button, input, select, [tabindex]:not([tabindex='-1'])",
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div aria-hidden="true" className="bg-ink/50 absolute inset-0" onClick={onClose} />
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className="bg-paper text-ink absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-lg shadow-2xl"
        ref={dialogRef}
        role="dialog"
      >
        <div className="border-line flex items-center justify-between border-b px-5 py-3">
          <h2 className="text-title font-bold tracking-[-0.02em]" id={titleId}>
            {t("filters")}
          </h2>
          <button
            aria-label={t("close")}
            className="border-line focus-visible:outline-gold hover:bg-surface flex size-11 cursor-pointer items-center justify-center rounded-full border focus-visible:outline-2 focus-visible:outline-offset-2"
            onClick={onClose}
            ref={closeRef}
            type="button"
          >
            <X aria-hidden="true" size={18} strokeWidth={1.8} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pt-4">{children}</div>

        <div className="border-line flex gap-3 border-t px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
          <button
            className="border-ink focus-visible:outline-gold hover:bg-surface h-12 cursor-pointer rounded-full border-[1.5px] px-5 text-[0.875rem] font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
            onClick={onClear}
            type="button"
          >
            {t("clear")}
          </button>
          <button
            aria-live="polite"
            className="bg-gold hover:bg-gold-deep focus-visible:outline-gold h-12 flex-1 cursor-pointer rounded-full px-5 text-[0.875rem] font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2"
            onClick={onClose}
            type="button"
          >
            {t("show", { count: resultCount })}
          </button>
        </div>
      </div>
    </div>
  );
}
