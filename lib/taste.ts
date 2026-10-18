export const TASTE_KEY = "filharmonia:taste";
export const SWIPE_KEY = "filharmonia:swipe";
export const PARTY_KEY = "filharmonia:party";
/** Cards liked in the swipe deck, by id — the deck comes from the API, so later steps can't look them up in EVENTS. */
export const PICKS_KEY = "filharmonia:picks";
export const SEATS_KEY = "filharmonia:seats";

export type SelectedSeat = {
  id: string;
  sector: string;
  row: string;
  seatNumber: string;
  category: number;
  price: number;
};

export type TasteAnswers = {
  path?: string[];
  /** Taste profiles of the answers, as accepted by GET /api/v1/recommendations. */
  tastes?: string[];
};
export const ORDERS_KEY = "filharmonia:orders";
export const ACCOUNT_KEY = "filharmonia:account";

export type Account = {
  name: string;
  email: string;
  notifications: boolean;
};

export type Order = {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  people: number;
  total: number;
};
