"use client";

import { Link } from "@/i18n/routing";
import {
  CalendarDays,
  Clock,
  MapPin,
  Music,
  Share2,
  Ticket,
  Users,
} from "lucide-react";
import { FlowArrows, FlowSteps } from "@/components/flow/flow-nav";
import { Screen } from "@/components/flow/screen";
import { useTranslations } from "next-intl";
import { useFlow } from "@/lib/use-flow";
import { sentenceCase } from "@/lib/format";

const PRICE = 140;

export default function Checkout() {
  const t = useTranslations("Checkout");
  const { event, people } = useFlow();

  const label = people === 1 ? t("one") : people < 5 ? t("few") : t("many");
  const [weekday, time] = event.date.split("·").map((part) => part.trim());
  const calendar = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    event.title,
  )}&location=${encodeURIComponent("Filharmonia Szczecin")}`;

  function share() {
    const text = `${event.title} · ${event.date} · Filharmonia Szczecin`;

    if (navigator.share) void navigator.share({ title: event.title, text });
    else void navigator.clipboard?.writeText(text);
  }

  return (
    <Screen>
      <FlowSteps step={5} />

      <div className="flex flex-col gap-1.5 px-6 pt-3.5 pb-4">
        <p
          className="text-gold flex items-center gap-1.5 text-[12px] leading-4 font-medium tracking-[0.14em]"
          data-flow="eyebrow"
        >
          <Ticket aria-hidden="true" size={13} strokeWidth={1.8} />
          {t("eyebrow")}
        </p>
        <h1
          className="text-[32px] leading-9 font-bold tracking-[-0.03em]"
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
          <h2 className="text-[22px] leading-[26px] font-bold tracking-[-0.03em]">
            {event.title}
          </h2>
          <p className="text-muted text-[14px] leading-[18px]">{event.subtitle}</p>

          <div className="text-muted mt-1 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-[12px] leading-4">
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
              <p className="text-muted flex items-center gap-1.5 text-[10px] leading-[14px] font-medium tracking-[0.14em]">
                <CalendarDays
                  aria-hidden="true"
                  className="text-gold shrink-0"
                  size={12}
                  strokeWidth={1.8}
                />
                {t("date")}
              </p>
              <p className="mt-1 text-[15px] leading-5 font-medium">
                {sentenceCase(weekday)}
              </p>
            </div>
            <div>
              <p className="text-muted flex items-center gap-1.5 text-[10px] leading-[14px] font-medium tracking-[0.14em]">
                <Clock
                  aria-hidden="true"
                  className="text-gold shrink-0"
                  size={12}
                  strokeWidth={1.8}
                />
                {t("time")}
              </p>
              <p className="mt-1 text-[22px] leading-6 font-bold tracking-[-0.02em]">
                {time}
              </p>
            </div>
          </div>

          <p className="text-muted mt-1 flex items-center gap-1.5 text-[14px] leading-[18px]">
            <Users
              aria-hidden="true"
              className="text-gold shrink-0"
              size={14}
              strokeWidth={1.8}
            />
            {people} {label}
          </p>
        </div>

        <div
          className="flex items-end gap-4 px-[18px] pt-4 pb-[18px]"
          data-flow-item
        >
          <p className="text-muted flex items-center gap-1.5 pb-1.5 text-[12px] leading-4 font-medium tracking-[0.14em]">
            <Ticket
              aria-hidden="true"
              className="text-gold shrink-0"
              size={13}
              strokeWidth={1.8}
            />
            {t("total")}
          </p>
          <span aria-hidden="true" className="border-line mb-[13px] flex-1 border-t" />
          <p className="text-[32px] leading-9 font-bold tracking-[-0.03em]">
            {people * PRICE} zł
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center gap-4 px-6 pt-[22px]" data-flow="actions">
        <Link
          className="bg-gold text-ink hover:bg-gold-deep focus-visible:outline-ink flex h-[52px] w-full items-center justify-center gap-2 rounded-full text-[16px] leading-5 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-4"
          href="/success"
        >
          <Ticket aria-hidden="true" size={18} strokeWidth={1.8} />
          {t("buy")}
        </Link>

        <div className="flex items-center justify-center gap-[22px] text-[14px] leading-[18px] font-medium">
          <a
            className="focus-visible:outline-gold flex items-center gap-1.5 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
            href={calendar}
            rel="noreferrer"
            target="_blank"
          >
            <CalendarDays aria-hidden="true" size={16} strokeWidth={1.7} />
            {t("calendar")}
          </a>
          <span aria-hidden="true" className="bg-gold size-1 rounded-full" />
          <button
            className="focus-visible:outline-gold flex items-center gap-1.5 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
            onClick={share}
            type="button"
          >
            <Share2 aria-hidden="true" size={16} strokeWidth={1.7} />
            {t("share")}
          </button>
        </div>
      </div>

      <FlowArrows next={false} step={5} />
    </Screen>
  );
}
