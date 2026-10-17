type Localized = {
  date: string;
  room: string;
  kind: string;
  subtitle: string;
  meta: string;
};

export type EventInfo = {
  id: string;
  date: string;
  room: string;
  kind: string;
  title: string;
  subtitle: string;
  meta: string;
  image: string;
  i18n?: Record<"en" | "de", Localized>;
};

export const EVENTS: EventInfo[] = [
  {
    id: "mozart-40",
    date: "SOBOTA · 19:00",
    room: "SALA SYMFONICZNA",
    kind: "Koncert symfoniczny",
    title: "Mozart",
    subtitle: "Symfonia nr 40 g-moll, KV 550",
    meta: "Orkiestra Filharmonii Szczecińskiej",
    image: "/images/events/mozart.jpg",
    i18n: {
      en: {
        date: "SATURDAY · 19:00",
        room: "SYMPHONIC HALL",
        kind: "Symphonic concert",
        subtitle: "Symphony No. 40 in G minor, K. 550",
        meta: "Szczecin Philharmonic Orchestra",
      },
      de: {
        date: "SAMSTAG · 19:00",
        room: "SYMPHONIESAAL",
        kind: "Sinfoniekonzert",
        subtitle: "Sinfonie Nr. 40 g-Moll, KV 550",
        meta: "Orchester der Philharmonie Szczecin",
      },
    },
  },
  {
    id: "slavic-sessions",
    date: "ŚRODA · 19:00",
    room: "SALA KAMERALNA",
    kind: "Koncert kameralny",
    title: "Slavic Sessions",
    subtitle: "Kowalski & Grgić — dwie gitary",
    meta: "Chopin, Bobrowicz, Pasieczny · Grammy 2026",
    image: "/images/events/slavic.jpg",
    i18n: {
      en: {
        date: "WEDNESDAY · 19:00",
        room: "CHAMBER HALL",
        kind: "Chamber concert",
        subtitle: "Kowalski & Grgić — two guitars",
        meta: "Chopin, Bobrowicz, Pasieczny · Grammy 2026",
      },
      de: {
        date: "MITTWOCH · 19:00",
        room: "KAMMERSAAL",
        kind: "Kammerkonzert",
        subtitle: "Kowalski & Grgić — zwei Gitarren",
        meta: "Chopin, Bobrowicz, Pasieczny · Grammy 2026",
      },
    },
  },
  {
    id: "przybysz-insides",
    date: "PONIEDZIAŁEK · 19:00",
    room: "SALA SYMFONICZNA",
    kind: "Koncert jazzowy",
    title: "Paulina Przybysz",
    subtitle: "Insides",
    meta: "Wokalistka i zespół sześcioosobowy",
    image: "/images/events/przybysz.jpg",
    i18n: {
      en: {
        date: "MONDAY · 19:00",
        room: "SYMPHONIC HALL",
        kind: "Jazz concert",
        subtitle: "Insides",
        meta: "Singer and a six-piece band",
      },
      de: {
        date: "MONTAG · 19:00",
        room: "SYMPHONIESAAL",
        kind: "Jazzkonzert",
        subtitle: "Insides",
        meta: "Sängerin und sechsköpfige Band",
      },
    },
  },
];

export function localizeEvent(event: EventInfo, locale: string): EventInfo {
  if (locale === "en" || locale === "de") {
    const localized = event.i18n?.[locale];

    if (localized) return { ...event, ...localized };
  }

  return event;
}
