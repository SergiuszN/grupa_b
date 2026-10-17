"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Mic, RotateCcw, Square, Ticket } from "lucide-react";
import {
  type Activity,
  type ChatMessage,
  type ErrorCode,
  type EventCard,
  type Status,
  useVoiceAssistant,
} from "@/lib/voice/use-voice-assistant";

export type VoiceLabels = {
  hi: string;
  title: string;
  subtitle: string;
  suggestions: string[];
  status: Record<Status, string>;
  activity: Record<Exclude<Activity, null>, string>;
  errors: Record<ErrorCode, string>;
  placeholder: string;
  send: string;
  reset: string;
  tickets: string;
  details: string;
  free: string;
  soldOut: string;
  you: string;
  guide: string;
};

export function VoiceAssistant({
  locale,
  labels,
}: {
  locale: string;
  labels: VoiceLabels;
}) {
  const { status, activity, messages, error, level, toggle, ask, reset } =
    useVoiceAssistant(locale);
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const started = messages.length > 0;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, activity]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    ask(draft);
    setDraft("");
  };

  const busy = status === "processing" || status === "speaking";
  const caption =
    status === "processing" && activity ? labels.activity[activity] : labels.status[status];

  return (
    <div className="flex flex-1 flex-col">
      {started ? (
        <div
          aria-live="polite"
          className="flex flex-1 flex-col gap-5 px-6 pt-6 pb-4 md:mx-auto md:w-full md:max-w-[720px]"
        >
          {messages.map((m) => (
            <Message key={m.id} labels={labels} locale={locale} message={m} />
          ))}
          <div ref={endRef} />
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center px-6 pb-2.5 text-center">
          <p className="text-gold mb-3.5 text-[17px] leading-[22px] font-medium tracking-[0.02em]">
            {labels.hi}
          </p>
          <h1 className="max-w-[300px] text-[31px] leading-[112%] font-bold tracking-[-0.03em] md:max-w-[460px]">
            {labels.title}
          </h1>
          <p className="text-muted mt-[18px] max-w-[250px] text-[14px] leading-[150%]">
            {labels.subtitle}
          </p>
          <div className="mt-6 flex max-w-[340px] flex-wrap justify-center gap-2">
            {labels.suggestions.map((s) => (
              <button
                className="border-line hover:bg-surface focus-visible:outline-gold rounded-full border px-3.5 py-2 text-[13px] leading-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
                key={s}
                onClick={() => ask(s)}
                type="button"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* On phones the bar clears the floating accessibility button (fixed bottom-right). */}
      <div className="bg-paper/95 sticky bottom-0 flex flex-col items-center px-6 pt-3 pb-[calc(env(safe-area-inset-bottom)+84px)] backdrop-blur md:pb-[calc(env(safe-area-inset-bottom)+24px)]">
        <MicButton
          compact={started}
          label={caption}
          level={level}
          onClick={toggle}
          status={status}
        />
        <p
          aria-live="polite"
          className={`mt-3 text-[12px] leading-4 font-medium tracking-[0.14em] uppercase ${
            busy ? "text-muted" : ""
          }`}
        >
          {caption}
        </p>
        {error ? (
          <p className="mt-2 max-w-[300px] text-center text-[13px] leading-5 text-[#9B2C1F]" role="alert">
            {labels.errors[error]}
          </p>
        ) : null}

        <form
          className="border-line focus-within:border-ink mt-4 flex h-12 w-full max-w-[520px] items-center gap-2 rounded-full border pr-1.5 pl-4 transition-colors"
          onSubmit={submit}
        >
          <input
            aria-label={labels.placeholder}
            className="placeholder:text-muted min-w-0 flex-1 bg-transparent text-[15px] leading-5 outline-none"
            onChange={(e) => setDraft(e.target.value)}
            placeholder={labels.placeholder}
            value={draft}
          />
          {started ? (
            <button
              aria-label={labels.reset}
              className="text-muted hover:text-ink focus-visible:outline-gold flex size-9 shrink-0 items-center justify-center rounded-full focus-visible:outline-2"
              onClick={reset}
              title={labels.reset}
              type="button"
            >
              <RotateCcw aria-hidden="true" size={16} strokeWidth={1.8} />
            </button>
          ) : null}
          <button
            aria-label={labels.send}
            className="bg-ink text-paper focus-visible:outline-gold flex size-9 shrink-0 items-center justify-center rounded-full transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-30"
            disabled={!draft.trim()}
            type="submit"
          >
            <ArrowUp aria-hidden="true" size={17} strokeWidth={2} />
          </button>
        </form>
      </div>
    </div>
  );
}

function MicButton({
  status,
  level,
  compact,
  label,
  onClick,
}: {
  status: Status;
  level: number;
  compact: boolean;
  label: string;
  onClick: () => void;
}) {
  const listening = status === "listening";
  const working = status === "processing";
  const ring = listening ? 1 + level * 0.35 : 1;

  return (
    <button
      aria-label={label}
      aria-pressed={listening}
      className={`focus-visible:outline-gold relative flex items-center justify-center rounded-full transition-[width,height] duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 ${
        compact ? "size-[92px]" : "size-[190px]"
      }`}
      onClick={onClick}
      type="button"
    >
      <span
        className={`border-gold-soft absolute inset-0 rounded-full border transition-transform duration-100 ${
          working ? "animate-pulse" : ""
        }`}
        style={{ transform: `scale(${ring})` }}
      />
      <span
        className={`absolute rounded-full border border-[#E6DDC4] transition-transform duration-100 ${
          compact ? "inset-[8px]" : "inset-[14px]"
        } ${status === "speaking" ? "animate-ping [animation-duration:2s]" : ""}`}
        style={{ transform: `scale(${listening ? 1 + level * 0.2 : 1})` }}
      />
      <span
        className={`bg-gold hover:bg-gold-deep relative flex items-center justify-center rounded-full transition-colors ${
          compact ? "size-[60px]" : "size-[118px]"
        }`}
      >
        {status === "idle" ? (
          <Mic aria-hidden="true" className="text-white" size={compact ? 24 : 32} strokeWidth={1.8} />
        ) : listening ? (
          <span className="flex h-7 items-center gap-[3px]" aria-hidden="true">
            {[0.6, 1, 0.75, 0.9, 0.55].map((f, i) => (
              <span
                className="w-[3px] rounded-full bg-white transition-[height] duration-100"
                key={i}
                style={{ height: `${Math.max(4, level * 28 * f + 4)}px` }}
              />
            ))}
          </span>
        ) : (
          <Square aria-hidden="true" className="text-white" fill="currentColor" size={compact ? 16 : 22} strokeWidth={0} />
        )}
      </span>
    </button>
  );
}

function Message({
  message,
  labels,
  locale,
}: {
  message: ChatMessage;
  labels: VoiceLabels;
  locale: string;
}) {
  if (message.role === "user") {
    return (
      <div className="flex flex-col items-end gap-1">
        <span className="sr-only">{labels.you}:</span>
        <p className="bg-ink text-paper max-w-[85%] rounded-[20px] rounded-br-md px-4 py-2.5 text-[15px] leading-[22px]">
          {message.text || <Dots />}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="sr-only">{labels.guide}:</span>
      {message.text ? (
        <p className="max-w-[92%] text-[17px] leading-[26px] tracking-[-0.01em]">{message.text}</p>
      ) : message.pending ? (
        <Dots />
      ) : null}
      {message.events?.length ? (
        <div className="flex flex-col gap-2.5">
          {message.events.map((e) => (
            <Card event={e} key={`${e.event_id}-${e.performance_id}`} labels={labels} locale={locale} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Card({
  event,
  labels,
  locale,
}: {
  event: EventCard;
  labels: VoiceLabels;
  locale: string;
}) {
  const when = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Warsaw",
  }).format(new Date(event.starts_at));
  const soldOut = event.ticket_status === "sold_out";

  return (
    <article className="border-line flex gap-3.5 rounded-2xl border p-3">
      <div
        className="size-[76px] shrink-0 rounded-xl bg-[#E7E2D8] bg-cover bg-center"
        style={event.image_url ? { backgroundImage: `url(${event.image_url})` } : undefined}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <p className="text-gold truncate text-[11px] leading-[14px] font-medium tracking-[0.12em] uppercase">
          {event.subtitle ?? event.kind}
        </p>
        <h3 className="text-[16px] leading-5 font-bold tracking-[-0.02em]">{event.title}</h3>
        <p className="text-muted text-[13px] leading-4">
          {when}
          {event.venue ? ` · ${event.venue}` : ""}
        </p>
        <div className="mt-1.5 flex items-center gap-3">
          <span className="text-[13px] leading-4 font-medium">
            {soldOut ? labels.soldOut : formatPrice(event, labels.free)}
          </span>
          <a
            className="border-ink hover:bg-surface focus-visible:outline-gold ml-auto flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[13px] leading-4 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
            href={(!soldOut && event.ticket_url) || event.source_url}
            rel="noreferrer"
            target="_blank"
          >
            <Ticket aria-hidden="true" size={14} strokeWidth={1.8} />
            {!soldOut && event.ticket_url ? labels.tickets : labels.details}
          </a>
        </div>
      </div>
    </article>
  );
}

function formatPrice(e: EventCard, free: string) {
  if (e.ticket_status === "free") return free;
  if (e.price_min == null) return "";
  const cur = e.currency === "PLN" ? "zł" : e.currency;
  if (e.price_max == null || e.price_max === e.price_min) return `${e.price_min} ${cur}`;
  return `${e.price_min}–${e.price_max} ${cur}`;
}

function Dots() {
  return (
    <span aria-hidden="true" className="inline-flex h-[22px] items-center gap-1">
      {[0, 150, 300].map((d) => (
        <span
          className="bg-muted size-1.5 animate-bounce rounded-full"
          key={d}
          style={{ animationDelay: `${d}ms` }}
        />
      ))}
    </span>
  );
}
