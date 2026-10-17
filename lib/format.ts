/** Turns "SOBOTA · 19:00" / "SALA SYMFONICZNA" into sentence case. */
export function sentenceCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

const PL = {
  ą: "a",
  ć: "c",
  ę: "e",
  ł: "l",
  ń: "n",
  ó: "o",
  ś: "s",
  ź: "z",
  ż: "z",
};

/** "Koncert Noworoczny — Gala" → "koncert-noworoczny-gala" */
export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (char) => PL[char as keyof typeof PL])
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/** Readable calendar URL: id keeps lookup cheap, title makes it legible. */
export function eventSlug(id: number, title: string) {
  const slug = slugify(title);
  return slug ? `${id}-${slug}` : String(id);
}

/** "12-koncert-noworoczny" → 12 */
export function eventIdFromSlug(value: string) {
  const match = /^(\d+)(?:-|$)/.exec(value);
  return match ? Number(match[1]) : null;
}
