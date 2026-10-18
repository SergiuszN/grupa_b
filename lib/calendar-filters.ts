import type { CalendarTerm } from "@/lib/calendar-performances";

// Calendar filters from the brief (6.2). The URL is the state, so a filtered
// view can be shared and survives the back button.

export const WHEN = ["today", "tomorrow", "weekend", "week", "month", "range"] as const;
export const TYPES = [
  "symphonic",
  "chamber",
  "jazz",
  "concert",
  "education",
  "exhibition",
  "tour",
  "festival",
  "external",
  "other",
] as const;
export const AUDIENCES = [
  "children",
  "families",
  "preschool",
  "youth",
  "schools",
  "adults",
  "seniors",
  "beginners",
] as const;
export const MOODS = [
  "classical-super-hits",
  "emotional",
  "energy",
  "relax",
  "something-extraordinary",
] as const;
export const VENUES = ["symphony", "chamber", "galleries", "outside"] as const;
export const PRICES = ["free", "30", "50", "100"] as const;
export const DURATIONS = ["45", "90", "long"] as const;
export const ACCESS = ["mobility", "visual", "hearing", "sensory"] as const;

export type When = (typeof WHEN)[number];

export type CalendarFilters = {
  when: When | null;
  from: string | null;
  to: string | null;
  types: string[];
  audiences: string[];
  age: number | null;
  moods: string[];
  venues: string[];
  price: string | null;
  duration: string | null;
  access: string[];
  q: string;
};

/** Filter groups, used for faceted counts and "remove this filter" suggestions. */
export type FilterGroup =
  | "when"
  | "types"
  | "audiences"
  | "moods"
  | "venues"
  | "price"
  | "duration"
  | "access"
  | "q";

export const EMPTY_FILTERS: CalendarFilters = {
  when: null,
  from: null,
  to: null,
  types: [],
  audiences: [],
  age: null,
  moods: [],
  venues: [],
  price: null,
  duration: null,
  access: [],
  q: "",
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function list(value: string | null, allowed: readonly string[]) {
  if (!value) return [];
  return [...new Set(value.split(","))].filter((v) => allowed.includes(v));
}

function one<T extends string>(value: string | null, allowed: readonly T[]) {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : null;
}

export function parseFilters(params: URLSearchParams): CalendarFilters {
  const age = Number(params.get("age"));
  const from = params.get("from");
  const to = params.get("to");

  return {
    when: one(params.get("when"), WHEN),
    from: from && DATE.test(from) ? from : null,
    to: to && DATE.test(to) ? to : null,
    types: list(params.get("type"), TYPES),
    audiences: list(params.get("for"), AUDIENCES),
    age: Number.isInteger(age) && age > 0 && age < 100 ? age : null,
    moods: list(params.get("mood"), MOODS),
    venues: list(params.get("venue"), VENUES),
    price: one(params.get("price"), PRICES),
    duration: one(params.get("duration"), DURATIONS),
    access: list(params.get("access"), ACCESS),
    q: params.get("q")?.slice(0, 100) ?? "",
  };
}

export function serializeFilters(f: CalendarFilters) {
  const params = new URLSearchParams();
  const set = (key: string, value: string | number | null | undefined) => {
    if (value !== null && value !== undefined && value !== "") params.set(key, String(value));
  };

  set("when", f.when);
  if (f.when === "range") {
    set("from", f.from);
    set("to", f.to);
  }
  set("type", f.types.join(","));
  set("for", f.audiences.join(","));
  set("age", f.age);
  set("mood", f.moods.join(","));
  set("venue", f.venues.join(","));
  set("price", f.price);
  set("duration", f.duration);
  set("access", f.access.join(","));
  set("q", f.q.trim());
  return params.toString();
}

export function clearGroup(f: CalendarFilters, group: FilterGroup): CalendarFilters {
  switch (group) {
    case "when":
      return { ...f, when: null, from: null, to: null };
    case "audiences":
      return { ...f, audiences: [], age: null };
    case "q":
      return { ...f, q: "" };
    default:
      return { ...f, [group]: Array.isArray(f[group]) ? [] : null };
  }
}

export function activeGroups(f: CalendarFilters): FilterGroup[] {
  const groups: FilterGroup[] = [];
  if (f.when) groups.push("when");
  if (f.types.length) groups.push("types");
  if (f.audiences.length || f.age !== null) groups.push("audiences");
  if (f.moods.length) groups.push("moods");
  if (f.venues.length) groups.push("venues");
  if (f.price) groups.push("price");
  if (f.duration) groups.push("duration");
  if (f.access.length) groups.push("access");
  if (f.q.trim()) groups.push("q");
  return groups;
}

function addDays(key: string, days: number) {
  const date = new Date(`${key}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Inclusive day range for a "when" choice; null bounds are open. */
export function dateRange(
  f: Pick<CalendarFilters, "when" | "from" | "to">,
  today: string,
): [string | null, string | null] {
  switch (f.when) {
    case "today":
      return [today, today];
    case "tomorrow":
      return [addDays(today, 1), addDays(today, 1)];
    case "weekend": {
      // Saturday and Sunday of the current week (only Sunday when today is Sunday).
      const weekday = new Date(`${today}T12:00:00Z`).getUTCDay();
      if (weekday === 0) return [today, today];
      return [addDays(today, Math.max(6 - weekday, 0)), addDays(today, 7 - weekday)];
    }
    case "week":
      return [today, addDays(today, 6)];
    case "month":
      return [today, addDays(today, 30)];
    case "range":
      return [f.from, f.to];
    default:
      return [null, null];
  }
}

export function isFestival(term: CalendarTerm) {
  return term.series.some((name) => /fest/i.test(name));
}

function fold(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l");
}

function matchesGroup(
  term: CalendarTerm,
  f: CalendarFilters,
  group: FilterGroup,
  today: string,
): boolean {
  switch (group) {
    case "when": {
      const [from, to] = dateRange(f, today);
      // Multi-day items (exhibitions) match when they overlap the range.
      if (from && (term.endDay ?? term.day) < from) return false;
      if (to && term.day > to) return false;
      return true;
    }
    case "types":
      return (
        !f.types.length ||
        f.types.includes(term.kind) ||
        (f.types.includes("festival") && isFestival(term))
      );
    case "audiences": {
      if (f.audiences.length && !term.audiences.some((a) => f.audiences.includes(a.slug)))
        return false;
      if (f.age === null) return true;
      const age = f.age;
      const fits = (min: number | null, max: number | null) =>
        (min !== null || max !== null) && (min ?? 0) <= age && (max ?? 999) >= age;
      return fits(term.minAge, term.maxAge) || term.audiences.some((a) => fits(a.minAge, a.maxAge));
    }
    case "moods":
      return !f.moods.length || term.moods.some((m) => f.moods.includes(m));
    case "venues":
      return !f.venues.length || f.venues.includes(term.venueGroup);
    case "price":
      if (!f.price) return true;
      if (term.ticketStatus === "free") return true;
      if (f.price === "free") return false;
      return term.priceMin !== null && term.priceMin <= Number(f.price);
    case "duration":
      if (!f.duration) return true;
      if (term.duration === null) return false;
      if (f.duration === "long") return term.duration > 90;
      return term.duration <= Number(f.duration);
    case "access":
      return f.access.every((a) => term.accessibility.includes(a));
    case "q": {
      const q = fold(f.q.trim());
      if (!q) return true;
      return [term.title, term.subtitle ?? "", ...term.people, ...term.series].some((v) =>
        fold(v).includes(q),
      );
    }
  }
}

const GROUPS: FilterGroup[] = [
  "when",
  "types",
  "audiences",
  "moods",
  "venues",
  "price",
  "duration",
  "access",
  "q",
];

/** Whether the term passes every filter group, optionally ignoring one of them. */
export function matches(
  term: CalendarTerm,
  f: CalendarFilters,
  today: string,
  skip?: FilterGroup,
) {
  return GROUPS.every((group) => group === skip || matchesGroup(term, f, group, today));
}
