"use client";

import { Link } from "@/i18n/routing";
import {
  CalendarDays,
  Clock,
  MapPin,
  Music,
  Ticket,
  Users,
} from "lucide-react";
import { FlowArrows, FlowSteps, skippedSteps } from "@/components/flow/flow-nav";
import { Screen } from "@/components/flow/screen";
import { CtaButton } from "@/components/ui";
import { useTranslations } from "next-intl";
import { useFlow } from "@/lib/use-flow";
import { ORDERS_KEY, type Order } from "@/lib/taste";
import { sentenceCase } from "@/lib/format";
import { hasSeats, seatPrice, ticketPrice } from "@/lib/events";

export default function Checkout() {
  const t = useTranslations("Checkout");
  const flow = useFlow();
  const { event, people } = flow;
  // Seats left over from an earlier concert don't apply to a walk-in event.
  const seated = hasSeats(event);
  const seats = seated ? flow.seats : [];

  const label = people === 1 ? t("one") : people < 5 ? t("few") : t("many");
  const [weekday, time] = event.date.split("·").map((part) => part.trim());

  const totalAmount =
    seats.length > 0
      ? seats.reduce((acc, s) => acc + seatPrice(event, s.category), 0)
      : people * (seated ? seatPrice(event, 2) : ticketPrice(event));

  function buy() {
    const orders = JSON.parse(
      localStorage.getItem(ORDERS_KEY) ?? "[]",
    ) as Order[];

    orders.push({
      id: `${event.id}-${Date.now()}`,
      title: event.title,
      subtitle: event.subtitle,
      date: event.date,
      people,
      total: totalAmount,
    });
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }

  return (
    <Screen>
      <FlowSteps skip={skippedSteps(seated)} step={6} />

      <div className="flex flex-col gap-1.5 px-6 pt-3.5 pb-4">
        <p
          className="text-gold flex items-center gap-1.5 text-[0.75rem] leading-4 font-medium tracking-[0.14em]"
          data-flow="eyebrow"
        >
          <Ticket aria-hidden="true" size={13} strokeWidth={1.8} />
          {t("eyebrow")}
        </p>
        <h1
          className="text-[2rem] leading-9 font-bold tracking-[-0.03em]"
          data-flow="title"
        >
          {t("title")}
        </h1>
      </div>

      <div className="bg-surface mx-6 overflow-clip rounded-[20px]" data-flow="media">
        <div
          className="bg-ink h-[248px] bg-cover bg-[50%]"
          data-flow="image"
          style={{ backgroundImage: `url(${event.image})` }}
        />

        <div className="flex flex-col gap-1.5 px-[18px] pt-4 pb-3.5">
          <h2 className="text-[1.375rem] leading-[1.625rem] font-bold tracking-[-0.03em]">
            {event.title}
          </h2>
          <p className="text-muted text-[0.875rem] leading-[1.125rem]">{event.subtitle}</p>

          <div className="text-muted mt-1 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-[0.75rem] leading-4">
            <span className="flex items-center gap-1.5">
              <Music
                aria-hidden="true"
                className="text-gold shrink-0"
                size={13}
                strokeWidth={1.8}
              />
              {event.kind}
            </span>
            {event.duration ? (
              <span className="flex items-center gap-1.5">
                <Clock
                  aria-hidden="true"
                  className="text-gold shrink-0"
                  size={13}
                  strokeWidth={1.8}
                />
                {event.duration} min
              </span>
            ) : null}
            <span className="flex items-center gap-1.5">
              <MapPin
                aria-hidden="true"
                className="text-gold shrink-0"
                size={13}
                strokeWidth={1.8}
              />
              {sentenceCase(event.room)}
            </span>
          </div>

          <div className="border-line mt-2 grid grid-cols-2 gap-4 border-t pt-3">
            <div>
              <p className="text-muted flex items-center gap-1.5 text-[0.625rem] leading-[0.875rem] font-medium tracking-[0.14em]">
                <CalendarDays
                  aria-hidden="true"
                  className="text-gold shrink-0"
                  size={12}
                  strokeWidth={1.8}
                />
                {t("date")}
              </p>
              <p className="mt-1 text-[0.9375rem] leading-5 font-medium">
                {sentenceCase(weekday)}
              </p>
            </div>
            <div>
              <p className="text-muted flex items-center gap-1.5 text-[0.625rem] leading-[0.875rem] font-medium tracking-[0.14em]">
                <Clock
                  aria-hidden="true"
                  className="text-gold shrink-0"
                  size={12}
                  strokeWidth={1.8}
                />
                {t("time")}
              </p>
              <p className="mt-1 text-[1.375rem] leading-6 font-bold tracking-[-0.02em]">
                {time}
              </p>
            </div>
          </div>

          <div className="mt-2 flex flex-col gap-1.5">
            <p className="text-muted flex items-center gap-1.5 text-[0.875rem] leading-[1.125rem]">
              <Users
                aria-hidden="true"
                className="text-gold shrink-0"
                size={14}
                strokeWidth={1.8}
              />
              {people} {label}
            </p>

            {seats.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {seats.map((seat) => (
                  <span
                    key={seat.id}
                    className="bg-gold/10 border border-gold/30 text-ink px-2.5 py-0.5 rounded-lg text-xs font-medium"
                  >
                    {seat.sector} · Rz. {seat.row}, m. {seat.seatNumber}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div
          className="flex items-end gap-4 px-[18px] pt-4 pb-[18px]"
          data-flow-item
        >
          <p className="text-muted flex items-center gap-1.5 pb-1.5 text-[0.75rem] leading-4 font-medium tracking-[0.14em]">
            <Ticket
              aria-hidden="true"
              className="text-gold shrink-0"
              size={13}
              strokeWidth={1.8}
            />
            {t("total")}
          </p>
          <span aria-hidden="true" className="border-line mb-[13px] flex-1 border-t" />
          <p className="text-[2rem] leading-9 font-bold tracking-[-0.03em]">
            {totalAmount} zł
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center gap-4 px-6 pt-[22px]" data-flow="actions">
        <CtaButton
          fullWidth
          href="/success"
          iconLeft={<Ticket aria-hidden="true" size={18} strokeWidth={1.8} />}
          onClick={buy}
          size="md"
          variant="primary"
        >
          {t("buy")}
        </CtaButton>
      </div>

      <FlowArrows next={false} step={6} />
    </Screen>
  );
}
