"use client";

import { Link } from "@/i18n/routing";
import { CalendarDays, Share2, Ticket } from "lucide-react";
import { FlowArrows, FlowSteps } from "@/components/flow/flow-nav";
import { Screen } from "@/components/flow/screen";
import { useTranslations } from "next-intl";
import { useFlow } from "@/lib/use-flow";

const PRICE = 140;

export default function Checkout() {
  const t = useTranslations("Checkout");
  const { event, people } = useFlow();

  const label = people === 1 ? t("one") : people < 5 ? t("few") : t("many");
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
          className="text-gold text-[12px] leading-4 font-medium tracking-[0.14em]"
          data-flow="eyebrow"
        >
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
          <p className="text-muted text-[14px] leading-[18px]">{event.date}</p>
          <p className="text-muted text-[14px] leading-[18px]">
            {people} {label}
          </p>
        </div>

        <div className="flex h-[18px] items-center justify-center">
          <div className="border-gold w-[306px] max-w-[calc(100%-36px)] border-t-[1.5px] border-dashed" />
        </div>

        <div
          className="flex items-end justify-between px-[18px] pt-2 pb-[18px]"
          data-flow-item
        >
          <p className="text-muted pb-1.5 text-[12px] leading-4 font-medium tracking-[0.14em]">
            {t("total")}
          </p>
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
