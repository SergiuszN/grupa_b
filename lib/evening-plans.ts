import {
  Beer,
  Binoculars,
  BookOpen,
  CakeSlice,
  Camera,
  Castle,
  Church,
  Coffee,
  Croissant,
  Disc3,
  Fish,
  Footprints,
  Frame,
  Headphones,
  IceCreamCone,
  Landmark,
  Martini,
  MoonStar,
  Palette,
  Pizza,
  Ship,
  Shirt,
  Soup,
  Sunset,
  UtensilsCrossed,
  Wine,
  type LucideIcon,
} from "lucide-react";

/**
 * `title` is a key in Evening.activities; `place` is a key in Evening.places.
 * `party` marks a table booked for the whole group (rendered with the head count).
 */
export type PlanItem = {
  time: string;
  title: string;
  place: string;
  Icon: LucideIcon;
  party?: boolean;
};

export type EveningPlan = { before: PlanItem[]; after: PlanItem[] };

const cloakroom: PlanItem = {
  time: "19:45",
  title: "cloakroom",
  place: "mainEntrance",
  Icon: Shirt,
};

/** Plans per quiz leaf, keyed by the taste path saved by /start (e.g. "listen/classical/modern-classic"). */
export const EVENING_PLANS: Record<string, EveningPlan[]> = {
  "listen/classical/modern-classic": [
    {
      before: [
        { time: "18:30", title: "drinks", place: "noNameBar", Icon: Martini },
        { time: "19:15", title: "walk", place: "walyChrobrego", Icon: Footprints },
        cloakroom,
      ],
      after: [
        { time: "22:15", title: "dinner", place: "fino", Icon: UtensilsCrossed, party: true },
      ],
    },
    {
      before: [
        { time: "18:15", title: "coffee", place: "cafe22", Icon: Coffee },
        { time: "19:00", title: "riverWalk", place: "bulwary", Icon: Footprints },
        cloakroom,
      ],
      after: [
        { time: "22:10", title: "wine", place: "wineBar", Icon: Wine, party: true },
      ],
    },
    {
      before: [
        { time: "18:00", title: "listening", place: "recordShop", Icon: Headphones },
        { time: "19:00", title: "snack", place: "bistro", Icon: Croissant },
        cloakroom,
      ],
      after: [
        { time: "22:15", title: "lateDinner", place: "willaLentza", Icon: UtensilsCrossed, party: true },
        { time: "23:30", title: "nightWalk", place: "walyChrobrego", Icon: MoonStar },
      ],
    },
  ],
  "listen/classical/old-classics": [
    {
      before: [
        { time: "18:00", title: "castle", place: "zamek", Icon: Castle },
        { time: "19:00", title: "coffee", place: "oldTownCafe", Icon: Coffee },
        cloakroom,
      ],
      after: [
        { time: "22:15", title: "dinner", place: "willaLentza", Icon: UtensilsCrossed, party: true },
      ],
    },
    {
      before: [
        { time: "18:15", title: "cathedral", place: "katedra", Icon: Church },
        { time: "19:00", title: "wine", place: "wineBar", Icon: Wine },
        cloakroom,
      ],
      after: [
        { time: "22:10", title: "dessert", place: "patisserie", Icon: CakeSlice, party: true },
      ],
    },
    {
      before: [
        { time: "18:30", title: "drinks", place: "noNameBar", Icon: Martini },
        { time: "19:15", title: "walk", place: "placOrla", Icon: Footprints },
        cloakroom,
      ],
      after: [
        { time: "22:15", title: "dinner", place: "fino", Icon: UtensilsCrossed, party: true },
        { time: "23:45", title: "nightWalk", place: "walyChrobrego", Icon: MoonStar },
      ],
    },
  ],
  "listen/contemporary/avant-garde": [
    {
      before: [
        { time: "18:00", title: "gallery", place: "trafostacja", Icon: Palette },
        { time: "19:00", title: "craftBeer", place: "brewpub", Icon: Beer },
        cloakroom,
      ],
      after: [
        { time: "22:15", title: "jazz", place: "jazzClub", Icon: Disc3, party: true },
      ],
    },
    {
      before: [
        { time: "18:15", title: "listening", place: "recordShop", Icon: Headphones },
        { time: "19:00", title: "snack", place: "streetFood", Icon: Pizza },
        cloakroom,
      ],
      after: [
        { time: "22:10", title: "drinks", place: "rooftopBar", Icon: Martini, party: true },
      ],
    },
    {
      before: [
        { time: "18:00", title: "riverWalk", place: "lasztownia", Icon: Footprints },
        { time: "18:45", title: "drinks", place: "staraRzeznia", Icon: Martini },
        cloakroom,
      ],
      after: [
        { time: "22:15", title: "lateDinner", place: "ramenBar", Icon: Soup, party: true },
        { time: "23:30", title: "jazz", place: "jazzClub", Icon: Disc3 },
      ],
    },
  ],
  "listen/contemporary/minimal": [
    {
      before: [
        { time: "18:15", title: "tea", place: "teaRoom", Icon: Coffee },
        { time: "19:00", title: "riverWalk", place: "bulwary", Icon: Footprints },
        cloakroom,
      ],
      after: [
        { time: "22:10", title: "nightWalk", place: "jasneBlonia", Icon: MoonStar },
      ],
    },
    {
      before: [
        { time: "18:00", title: "reading", place: "bookshop", Icon: BookOpen },
        { time: "19:00", title: "coffee", place: "cafe22", Icon: Coffee },
        cloakroom,
      ],
      after: [
        { time: "22:15", title: "wine", place: "wineBar", Icon: Wine, party: true },
      ],
    },
    {
      before: [
        { time: "18:30", title: "sunset", place: "bulwary", Icon: Sunset },
        { time: "19:15", title: "snack", place: "bistro", Icon: Croissant },
        cloakroom,
      ],
      after: [
        { time: "22:15", title: "lateDinner", place: "ramenBar", Icon: Soup, party: true },
      ],
    },
  ],
  "watch/exhibition/old-art": [
    {
      before: [
        { time: "17:30", title: "museum", place: "nationalMuseum", Icon: Frame },
        { time: "19:00", title: "coffee", place: "oldTownCafe", Icon: Coffee },
        cloakroom,
      ],
      after: [
        { time: "22:15", title: "dinner", place: "fino", Icon: UtensilsCrossed, party: true },
      ],
    },
    {
      before: [
        { time: "18:00", title: "castle", place: "zamek", Icon: Castle },
        { time: "19:00", title: "wine", place: "wineBar", Icon: Wine },
        cloakroom,
      ],
      after: [
        { time: "22:10", title: "dessert", place: "patisserie", Icon: CakeSlice, party: true },
      ],
    },
    {
      before: [
        { time: "17:45", title: "museum", place: "przelomy", Icon: Landmark },
        { time: "19:00", title: "drinks", place: "noNameBar", Icon: Martini },
        cloakroom,
      ],
      after: [
        { time: "22:15", title: "lateDinner", place: "willaLentza", Icon: UtensilsCrossed, party: true },
      ],
    },
  ],
  "watch/exhibition/contemporary-art": [
    {
      before: [
        { time: "17:45", title: "gallery", place: "trafostacja", Icon: Palette },
        { time: "19:00", title: "coffee", place: "cafe22", Icon: Coffee },
        cloakroom,
      ],
      after: [
        { time: "22:15", title: "dinner", place: "fino", Icon: UtensilsCrossed, party: true },
      ],
    },
    {
      before: [
        { time: "18:00", title: "gallery", place: "galeria13muz", Icon: Palette },
        { time: "19:00", title: "craftBeer", place: "brewpub", Icon: Beer },
        cloakroom,
      ],
      after: [
        { time: "22:10", title: "lateDinner", place: "streetFood", Icon: Pizza, party: true },
      ],
    },
    {
      before: [
        { time: "18:00", title: "photoWalk", place: "lasztownia", Icon: Camera },
        { time: "18:45", title: "drinks", place: "staraRzeznia", Icon: Martini },
        cloakroom,
      ],
      after: [
        { time: "22:15", title: "drinks", place: "rooftopBar", Icon: Martini, party: true },
        { time: "23:30", title: "icecream", place: "gelateria", Icon: IceCreamCone },
      ],
    },
  ],
  "watch/architecture/interiors": [
    {
      before: [
        { time: "18:00", title: "interiorsTour", place: "filharmoniaFoyer", Icon: Landmark },
        { time: "19:00", title: "coffee", place: "oldTownCafe", Icon: Coffee },
        cloakroom,
      ],
      after: [
        { time: "22:15", title: "dinner", place: "willaLentza", Icon: UtensilsCrossed, party: true },
      ],
    },
    {
      before: [
        { time: "18:00", title: "castle", place: "zamek", Icon: Castle },
        { time: "19:00", title: "drinks", place: "noNameBar", Icon: Martini },
        cloakroom,
      ],
      after: [
        { time: "22:15", title: "dinner", place: "fino", Icon: UtensilsCrossed, party: true },
      ],
    },
    {
      before: [
        { time: "18:15", title: "cathedral", place: "katedra", Icon: Church },
        { time: "19:00", title: "wine", place: "wineBar", Icon: Wine },
        cloakroom,
      ],
      after: [
        { time: "22:10", title: "dessert", place: "patisserie", Icon: CakeSlice, party: true },
      ],
    },
  ],
  "watch/architecture/city": [
    {
      before: [
        { time: "18:00", title: "viewpoint", place: "katedraTower", Icon: Binoculars },
        { time: "19:00", title: "walk", place: "walyChrobrego", Icon: Footprints },
        cloakroom,
      ],
      after: [
        { time: "22:15", title: "dinner", place: "fino", Icon: UtensilsCrossed, party: true },
      ],
    },
    {
      before: [
        { time: "17:45", title: "cruise", place: "odraPier", Icon: Ship },
        { time: "19:00", title: "snack", place: "fishBar", Icon: Fish },
        cloakroom,
      ],
      after: [
        { time: "22:10", title: "drinks", place: "rooftopBar", Icon: Martini, party: true },
      ],
    },
    {
      before: [
        { time: "18:00", title: "photoWalk", place: "placGrunwaldzki", Icon: Camera },
        { time: "19:00", title: "coffee", place: "cafe22", Icon: Coffee },
        cloakroom,
      ],
      after: [
        { time: "22:15", title: "lateDinner", place: "staraRzeznia", Icon: UtensilsCrossed, party: true },
        { time: "23:30", title: "nightWalk", place: "bulwary", Icon: MoonStar },
      ],
    },
  ],
};

/** A random plan for the quiz answers; any plan when the quiz was skipped or the path is unknown. */
export function pickEveningPlan(tastes: string[] | undefined): EveningPlan {
  const pool =
    EVENING_PLANS[tastes?.join("/") ?? ""] ??
    Object.values(EVENING_PLANS).flat();
  return pool[Math.floor(Math.random() * pool.length)];
}
