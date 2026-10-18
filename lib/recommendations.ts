import type { EventInfo } from "./events";

/** Card returned by GET /api/v1/recommendations. */
export type Recommendation = {
  id: number;
  kind: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  duration_minutes: number | null;
  performances: { starts_at: string; venue: { name: string } | null }[];
  performers: string[];
  composers: string[];
  excerpt: string | null;
};

/** Event kinds you mostly listen to — their cards get the audio preview. */
const LISTEN = new Set(["symphonic", "chamber", "jazz", "concert"]);

function formatDate(iso: string, locale: string) {
  const date = new Date(iso);
  const day = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Europe/Warsaw",
  }).format(date);
  const time = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Warsaw",
  }).format(date);

  return `${day} · ${time}`.toUpperCase();
}

/** Maps an API card onto the swipe deck's event shape. */
export function toEventInfo(
  rec: Recommendation,
  locale: string,
  kindLabel: string,
): EventInfo {
  // "Pomniki symfoniki | Mozart" → title "Pomniki symfoniki", subtitle "Mozart".
  const [title, ...rest] = rec.title.split(" | ");
  const generic =
    !rec.subtitle || rec.subtitle.toLowerCase() === kindLabel.toLowerCase();
  const subtitle =
    rest.join(" · ") ||
    (generic ? rec.composers.slice(0, 3).join(", ") : rec.subtitle) ||
    kindLabel;
  const first = rec.performances[0];

  return {
    id: `event-${rec.id}`,
    date: first ? formatDate(first.starts_at, locale) : "",
    room: (first?.venue?.name ?? "").toUpperCase(),
    kind: kindLabel,
    title,
    subtitle,
    meta: (rec.performers.length ? rec.performers : rec.composers)
      .slice(0, 3)
      .join(" · "),
    description: rec.excerpt ?? "",
    duration: rec.duration_minutes ?? undefined,
    audio: LISTEN.has(rec.kind),
    image: rec.image_url ?? "/images/concert-hall.jpg",
  };
}
