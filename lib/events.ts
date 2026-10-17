export type EventInfo = {
  id: string;
  date: string;
  room: string;
  kind: string;
  title: string;
  subtitle: string;
  meta: string;
  image: string;
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
  },
];
