"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Heart,
  LogOut,
  Ticket,
  UserRound,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Screen } from "@/components/flow/screen";
import { findEvent, localizeEvent } from "@/lib/events";
import {
  ACCOUNT_KEY,
  ORDERS_KEY,
  SWIPE_KEY,
  type Account,
  type Order,
} from "@/lib/taste";

function read<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "") as T;
  } catch {
    return fallback;
  }
}

export default function AccountPage() {
  const t = useTranslations("Account");
  const locale = useLocale();
  const [account, setAccount] = useState<Account | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [liked, setLiked] = useState<string[]>([]);
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const saved = read<Account | null>(ACCOUNT_KEY, null);
    const decisions = read<{ id: string; choice: string }[]>(SWIPE_KEY, []);
    const nextOrders = read<Order[]>(ORDERS_KEY, []);
    const nextLiked = decisions
      .filter((item) => item.choice === "tak")
      .map((item) => item.id);

    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot read of local profile
    setAccount(saved);
    setOrders(nextOrders);
    setLiked(nextLiked);
  }, []);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim() || password.length < 4) return;

    const profile: Account = {
      name:
        name.trim() ||
        email.split("@")[0].replace(/^./, (c) => c.toUpperCase()),
      email: email.trim(),
      notifications: true,
    };

    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(profile));
    setAccount(profile);
  }

  function toggleNotifications() {
    if (!account) return;
    const next = { ...account, notifications: !account.notifications };
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(next));
    setAccount(next);
  }

  function logout() {
    localStorage.removeItem(ACCOUNT_KEY);
    setAccount(null);
    setPassword("");
  }

  const favourites = liked
    .map((id) => findEvent(id))
    .filter((item) => item !== undefined)
    .map((item) => localizeEvent(item, locale));

  if (!account) {
    return (
      <Screen>
        <section className="flex flex-1 flex-col justify-center px-6 py-8">
          <p className="text-gold text-[11px] leading-[14px] font-medium tracking-[0.16em] uppercase">
            {t("eyebrow")}
          </p>
          <h1 className="mt-2 text-[34px] leading-[38px] font-bold tracking-[-0.03em]">
            {mode === "in" ? t("title") : t("titleUp")}
          </h1>
          <p className="text-muted mt-2.5 max-w-[320px] text-[15px] leading-[22px]">
            {mode === "in" ? t("subtitle") : t("subtitleUp")}
          </p>

          <form className="mt-8 flex flex-col gap-3" onSubmit={submit}>
            {mode === "up" ? (
              <label className="flex flex-col gap-1.5">
                <span className="text-muted text-[11px] leading-4 font-medium tracking-[0.12em] uppercase">
                  {t("name")}
                </span>
                <input
                  autoComplete="name"
                  className="focus-visible:outline-gold border-line bg-surface h-12 rounded-2xl border px-4 text-[15px] focus-visible:outline-2 focus-visible:outline-offset-2"
                  onChange={(event) => setName(event.target.value)}
                  value={name}
                />
              </label>
            ) : null}

            <label className="flex flex-col gap-1.5">
              <span className="text-muted text-[11px] leading-4 font-medium tracking-[0.12em] uppercase">
                {t("email")}
              </span>
              <input
                autoComplete="email"
                className="focus-visible:outline-gold border-line bg-surface h-12 rounded-2xl border px-4 text-[15px] focus-visible:outline-2 focus-visible:outline-offset-2"
                inputMode="email"
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-muted text-[11px] leading-4 font-medium tracking-[0.12em] uppercase">
                {t("password")}
              </span>
              <input
                autoComplete={mode === "in" ? "current-password" : "new-password"}
                className="focus-visible:outline-gold border-line bg-surface h-12 rounded-2xl border px-4 text-[15px] focus-visible:outline-2 focus-visible:outline-offset-2"
                minLength={4}
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </label>

            <button
              className="bg-gold text-ink hover:bg-gold-deep focus-visible:outline-ink mt-2 flex h-14 items-center justify-center gap-2 rounded-full text-[15px] leading-5 font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4"
              type="submit"
            >
              <UserRound aria-hidden="true" size={17} strokeWidth={1.8} />
              {mode === "in" ? t("signIn") : t("signUp")}
            </button>
          </form>

          <button
            className="focus-visible:outline-gold text-muted mt-5 w-fit self-center rounded-sm text-[13px] leading-4 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4"
            onClick={() => setMode(mode === "in" ? "up" : "in")}
            type="button"
          >
            {mode === "in" ? t("noAccount") : t("haveAccount")}
          </button>

          <p className="text-muted mt-10 max-w-[320px] self-center text-center text-[11px] leading-4 opacity-80">
            {t("note")}
          </p>
        </section>
      </Screen>
    );
  }

  return (
    <Screen>
      <div className="flex flex-1 flex-col px-6 pt-5 pb-8">
        <p className="text-gold text-[11px] leading-[14px] font-medium tracking-[0.16em] uppercase">
          {t("eyebrow")}
        </p>
        <h1 className="mt-1.5 text-[32px] leading-9 font-bold tracking-[-0.03em]">
          {t("greeting", { name: account.name })}
        </h1>
        <p className="text-muted mt-1 text-[13px] leading-4">{account.email}</p>

        <section className="bg-surface mt-6 rounded-[20px] px-[18px] py-4">
          <h2 className="text-muted flex items-center gap-1.5 text-[11px] leading-[14px] font-medium tracking-[0.14em]">
            <Heart aria-hidden="true" size={13} strokeWidth={1.7} />
            {t("favourites")}
          </h2>

          {favourites.length === 0 ? (
            <p className="text-muted mt-3 text-[14px] leading-5">
              {t("favouritesEmpty")}
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-3">
              {favourites.map((event) => (
                <li className="flex items-center gap-3" key={event.id}>
                  <div
                    className="size-11 shrink-0 overflow-clip rounded-xl bg-[#E7E2D8] bg-cover bg-[50%]"
                    style={{ backgroundImage: `url(${event.image})` }}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-[14px] leading-5 font-bold">
                      {event.title}
                    </p>
                    <p className="text-muted truncate text-[12px] leading-4">
                      {event.subtitle}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-surface mt-3 rounded-[20px] px-[18px] py-4">
          <h2 className="text-muted flex items-center gap-1.5 text-[11px] leading-[14px] font-medium tracking-[0.14em]">
            <Ticket aria-hidden="true" size={13} strokeWidth={1.7} />
            {t("tickets")}
          </h2>

          {orders.length === 0 ? (
            <p className="text-muted mt-3 text-[14px] leading-5">
              {t("ticketsEmpty")}
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-3">
              {orders.map((order) => (
                <li className="border-line border-b pb-3 last:border-0 last:pb-0" key={order.id}>
                  <p className="text-[14px] leading-5 font-bold">{order.title}</p>
                  <p className="text-muted text-[12px] leading-4">
                    {order.date} · {t("people", { count: order.people })} ·{" "}
                    {order.total} zł
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-surface mt-3 flex items-center justify-between gap-4 rounded-[20px] px-[18px] py-4">
          <span className="flex items-center gap-2.5">
            <Bell
              aria-hidden="true"
              className="text-gold shrink-0"
              size={16}
              strokeWidth={1.7}
            />
            <span>
              <span className="block text-[14px] leading-5 font-medium">
                {t("notifications")}
              </span>
              <span className="text-muted block text-[12px] leading-4">
                {t("notificationsHint")}
              </span>
            </span>
          </span>

          <button
            aria-checked={account.notifications}
            aria-label={t("notifications")}
            className={`focus-visible:outline-gold relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
              account.notifications ? "bg-gold" : "bg-line"
            }`}
            onClick={toggleNotifications}
            role="switch"
            type="button"
          >
            <span
              className={`absolute top-1 size-5 rounded-full bg-paper transition-all ${
                account.notifications ? "left-6" : "left-1"
              }`}
            />
          </button>
        </section>

        <button
          className="border-ink text-ink hover:bg-surface focus-visible:outline-gold mt-6 flex h-12 items-center justify-center gap-2 rounded-full border-[1.5px] text-[14px] leading-5 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-4"
          onClick={logout}
          type="button"
        >
          <LogOut aria-hidden="true" size={16} strokeWidth={1.8} />
          {t("logout")}
        </button>
      </div>
    </Screen>
  );
}
