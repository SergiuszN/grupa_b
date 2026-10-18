import { PICKS_KEY } from "./taste";

type Localized = {
  date: string;
  room: string;
  kind: string;
  subtitle: string;
  meta: string;
  description: string;
};

export type EventInfo = {
  id: string;
  date: string;
  room: string;
  kind: string;
  title: string;
  subtitle: string;
  meta: string;
  description: string;
  duration?: number;
  audio?: boolean;
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
    description:
      "Dlaczego jedna melodia zostaje w głowie na całe życie? W cyklu Pomniki symfoniki razem z orkiestrą szukamy odpowiedzi — od pierwszego taktu Symfonii nr 40. Usłyszymy, jak z prostego motywu powstaje utwór, który zna cały świat.",
    duration: 65,
    audio: true,
    image: "/images/events/mozart.jpg",
    i18n: {
      en: {
        date: "SATURDAY · 19:00",
        room: "SYMPHONIC HALL",
        kind: "Symphonic concert",
        subtitle: "Symphony No. 40 in G minor, K. 550",
        meta: "Szczecin Philharmonic Orchestra",
        description:
          "Why does one melody stay with you for life? In the Symphonic Monuments series we look for the answer with the orchestra — starting with the first bar of Symphony No. 40. You will hear how a simple motif becomes a work the whole world knows.",
      },
      de: {
        date: "SAMSTAG · 19:00",
        room: "SYMPHONIESAAL",
        kind: "Sinfoniekonzert",
        subtitle: "Sinfonie Nr. 40 g-Moll, KV 550",
        meta: "Orchester der Philharmonie Szczecin",
        description:
          "Warum bleibt eine Melodie ein Leben lang im Kopf? In der Reihe Sinfonische Monumente suchen wir mit dem Orchester nach der Antwort — vom ersten Takt der Sinfonie Nr. 40. Sie hören, wie aus einem einfachen Motiv ein Werk wird, das die ganze Welt kennt.",
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
    description:
      "Płyta nominowana do Grammy 2026 w kategorii muzyki kameralnej. Dwie gitary, Chopin i Pasieczny — wieczór, który brzmi jak odkrycie. Kowalski i Grgić zagrają program, który przyniósł im nominację.",
    duration: 65,
    audio: true,
    image: "/images/events/slavic.jpg",
    i18n: {
      en: {
        date: "WEDNESDAY · 19:00",
        room: "CHAMBER HALL",
        kind: "Chamber concert",
        subtitle: "Kowalski & Grgić — two guitars",
        meta: "Chopin, Bobrowicz, Pasieczny · Grammy 2026",
        description:
          "A 2026 Grammy-nominated chamber album. Two guitars, Chopin and Pasieczny — an evening that sounds like a discovery. Kowalski and Grgić play the programme that earned them the nomination.",
      },
      de: {
        date: "MITTWOCH · 19:00",
        room: "KAMMERSAAL",
        kind: "Kammerkonzert",
        subtitle: "Kowalski & Grgić — zwei Gitarren",
        meta: "Chopin, Bobrowicz, Pasieczny · Grammy 2026",
        description:
          "Ein für den Grammy 2026 nominiertes Kammermusikalbum. Zwei Gitarren, Chopin und Pasieczny — ein Abend, der nach Entdeckung klingt. Kowalski und Grgić spielen das Programm ihrer Nominierung.",
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
    description:
      "Jedna z najbardziej charyzmatycznych polskich wokalistek wraca do jazzu i soulu, które ukształtowały jej dom. Usłyszymy Insides w całości, w składzie, w którym powstał.",
    audio: true,
    image: "/images/events/przybysz.jpg",
    i18n: {
      en: {
        date: "MONDAY · 19:00",
        room: "SYMPHONIC HALL",
        kind: "Jazz concert",
        subtitle: "Insides",
        meta: "Singer and a six-piece band",
        description:
          "One of Poland's most charismatic vocalists returns to the jazz and soul that shaped her home. We will hear Insides in full, with the band that recorded it.",
      },
      de: {
        date: "MONTAG · 19:00",
        room: "SYMPHONIESAAL",
        kind: "Jazzkonzert",
        subtitle: "Insides",
        meta: "Sängerin und sechsköpfige Band",
        description:
          "Eine der charismatischsten polnischen Sängerinnen kehrt zu Jazz und Soul zurück, die ihr Zuhause prägten. Wir hören Insides komplett, mit der Band, die es aufgenommen hat.",
      },
    },
  },
  {
    id: "bryla",
    date: "CODZIENNIE · 12:00",
    room: "GALERIA POZIOM 4.",
    kind: "Wystawa",
    title: "Bryła",
    subtitle: "Rzeźba i dźwięk",
    meta: "Wstęp wolny",
    description:
      "Wystawa, w której forma spotyka się z dźwiękiem: rzeźby i instalacje rozmieszczone w foyer i galerii na poziomie 4. Można wejść na chwilę albo zostać na cały wieczór — wstęp jest wolny.",
    duration: 45,
    image: "/images/hall-chamber.jpg",
    i18n: {
      en: {
        date: "DAILY · 12:00",
        room: "GALLERY LEVEL 4",
        kind: "Exhibition",
        subtitle: "Sculpture and sound",
        meta: "Free entry",
        description:
          "An exhibition where form meets sound: sculptures and installations across the foyer and the level 4 gallery. Drop in for a moment or stay the whole evening — entry is free.",
      },
      de: {
        date: "TÄGLICH · 12:00",
        room: "GALERIE EBENE 4",
        kind: "Ausstellung",
        subtitle: "Skulptur und Klang",
        meta: "Eintritt frei",
        description:
          "Eine Ausstellung, in der Form auf Klang trifft: Skulpturen und Installationen im Foyer und in der Galerie auf Ebene 4. Komm kurz vorbei oder bleib den ganzen Abend — der Eintritt ist frei.",
      },
    },
  },
  {
    id: "barok-pory-roku",
    date: "NIEDZIELA · 11:00",
    room: "SALA SYMFONICZNA",
    kind: "Koncert dla dzieci",
    title: "Jak w baroku brzmiały pory roku?",
    subtitle: "Koncert dla dzieci 5+",
    meta: "Rodziny · wstęp z opiekunem",
    description:
      "Vivaldi dla najmłodszych: godzina muzyki, ruchu i opowieści o tym, co słychać wiosną, latem, jesienią i zimą. Koncert prowadzony tak, żeby pięciolatek nie usiedział w miejscu.",
    duration: 60,
    audio: true,
    image: "/images/hall-symphonic.jpg",
    i18n: {
      en: {
        date: "SUNDAY · 11:00",
        room: "SYMPHONIC HALL",
        kind: "Concert for children",
        subtitle: "Concert for children 5+",
        meta: "Families · with a guardian",
        description:
          "Vivaldi for the youngest: an hour of music, movement and stories about what you can hear in spring, summer, autumn and winter. A concert designed so a five-year-old will not sit still.",
      },
      de: {
        date: "SONNTAG · 11:00",
        room: "SYMPHONIESAAL",
        kind: "Kinderkonzert",
        subtitle: "Konzert für Kinder ab 5",
        meta: "Familien · mit Begleitung",
        description:
          "Vivaldi für die Jüngsten: eine Stunde Musik, Bewegung und Geschichten darüber, was im Frühling, Sommer, Herbst und Winter zu hören ist. Ein Konzert, bei dem ein Fünfjähriger nicht stillsitzt.",
      },
    },
  },
  {
    id: "noc-w-foyer",
    date: "PIĄTEK · 22:15",
    room: "FOYER",
    kind: "Wydarzenie",
    title: "Noc w foyer",
    subtitle: "Po ostatnim takcie",
    meta: "Bar, rozmowy, muzyka na żywo",
    description:
      "Po koncercie foyer zostaje otwarte: bar, ciche rozmowy i krótkie sety muzyków z orkiestry. Wchodzi się bez biletu, wystarczy zostać chwilę dłużej.",
    duration: 90,
    image: "/images/concert-hall.jpg",
    i18n: {
      en: {
        date: "FRIDAY · 22:15",
        room: "FOYER",
        kind: "Event",
        subtitle: "After the last bar",
        meta: "Bar, conversations, live music",
        description:
          "After the concert the foyer stays open: a bar, quiet conversations and short sets by musicians from the orchestra. No ticket needed — just stay a little longer.",
      },
      de: {
        date: "FREITAG · 22:15",
        room: "FOYER",
        kind: "Veranstaltung",
        subtitle: "Nach dem letzten Takt",
        meta: "Bar, Gespräche, Live-Musik",
        description:
          "Nach dem Konzert bleibt das Foyer offen: Bar, leise Gespräche und kurze Sets von Musiker:innen des Orchesters. Ohne Ticket — bleib einfach etwas länger.",
      },
    },
  },
];

/** Looks an event up among the built-in ones and the cards liked in the swipe deck. */
export function findEvent(id: string | null | undefined): EventInfo | undefined {
  if (!id) return undefined;

  const builtIn = EVENTS.find((item) => item.id === id);
  if (builtIn) return builtIn;

  try {
    const picks = JSON.parse(localStorage.getItem(PICKS_KEY) ?? "{}") as Record<
      string,
      EventInfo
    >;
    return picks[id];
  } catch {
    return undefined;
  }
}

export function localizeEvent(event: EventInfo, locale: string): EventInfo {
  if (locale === "en" || locale === "de") {
    const localized = event.i18n?.[locale];

    if (localized) return { ...event, ...localized };
  }

  return event;
}
