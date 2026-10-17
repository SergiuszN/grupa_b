// ==============================================================================
// GŁÓWNE MIEJSCE KONFIGURACJI JĘZYKÓW (Single Source of Truth)
// Aby dodać lub usunąć język, zmień go TYLKO TUTAJ oraz dodaj plik w /messages!
// ==============================================================================

export const LOCALES = ["pl", "en", "de"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "pl";

export const LOCALE_LABELS: Record<Locale, { name: string; flag: string }> = {
  pl: { name: "Polski", flag: "🇵🇱" },
  en: { name: "English", flag: "🇬🇧" },
  de: { name: "Deutsch", flag: "🇩🇪" },
};
