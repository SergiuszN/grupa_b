export const TASTE_KEY = "filharmonia:taste";
export const SWIPE_KEY = "filharmonia:swipe";
export const PARTY_KEY = "filharmonia:party";

export type TasteAnswers = {
  path?: string[];
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
