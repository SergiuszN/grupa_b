"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Baby,
  CalendarDays,
  CircleHelp,
  ExternalLink,
  Mic,
  RotateCcw,
  Square,
  Ticket,
} from "lucide-react";
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
  source: string;
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
  const listRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  // Follow the conversation unless the user scrolled up to read older messages.
  const followRef = useRef(true);
  const started = messages.length > 0;
  const count = messages.length;

  // How far the end of the conversation is below the top of the sticky bar.
  const overflow = () => {
    const end = endRef.current;
    const bar = barRef.current;
    if (!end || !bar) return 0;
    return (
      end.getBoundingClientRect().bottom - bar.getBoundingClientRect().top + 16
    );
  };

  useEffect(() => {
    const onScroll = () => {
      followRef.current = overflow() < 80;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Streamed text, cards and late images all grow the list.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const observer = new ResizeObserver(() => {
      const by = overflow();
      if (followRef.current && by > 0) window.scrollBy({ top: by });
    });
    observer.observe(list);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    followRef.current = true;
    const by = overflow();
    if (by > 0) window.scrollBy({ top: by });
  }, [count]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    ask(draft);
    setDraft("");
  };

  const busy = status === "processing" || status === "speaking";
  const caption =
    status === "processing" && activity
      ? labels.activity[activity]
      : labels.status[status];

  return (
    <div className="flex flex-1 flex-col">
      {started ? (
        <div
          aria-live="polite"
          ref={listRef}
          className="flex flex-1 flex-col gap-5 px-6 pt-6 pb-4 md:mx-auto md:w-full md:max-w-[720px]"
        >
          {messages.map((m) => (
            <Message key={m.id} labels={labels} locale={locale} message={m} />
          ))}
          <div ref={endRef} />
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center px-6 pb-2.5 text-center">
          <p className="text-gold mb-3.5 text-[1.0625rem] leading-[1.375rem] font-medium tracking-[0.02em]">
            {labels.hi}
          </p>
          <h1 className="max-w-[320px] text-[1.9375rem] leading-[112%] font-bold tracking-[-0.03em] md:max-w-[520px]">
            {labels.title}
          </h1>
          <p className="text-muted mt-3 max-w-[290px] text-[0.8125rem] leading-[1.45] md:max-w-[420px]">
            {labels.subtitle}
          </p>
          <div className="mt-6 flex max-w-[380px] flex-wrap justify-center gap-2">
            {labels.suggestions.map((s, index) => {
              const Icon = [CircleHelp, CalendarDays, Baby][index] ?? CircleHelp;
              return (
                <button
                  className="border-line hover:bg-surface focus-visible:outline-gold flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[0.8125rem] leading-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
                  key={s}
                  onClick={() => ask(s)}
                  type="button"
                >
                  <Icon
                    aria-hidden="true"
                    className="text-gold"
                    size={14}
                    strokeWidth={1.8}
                  />
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* From md up the accessibility button floats bottom-right; on tablets it would cover the form. */}
      <div
        ref={barRef}
        className="bg-paper/95 sticky bottom-0 flex flex-col items-center px-6 pt-3 pb-[calc(env(safe-area-inset-bottom)+20px)] backdrop-blur md:pb-[calc(env(safe-area-inset-bottom)+84px)] lg:pb-6"
      >
        <MicButton
          compact={started}
          label={caption}
          level={level}
          onClick={toggle}
          status={status}
        />
        {status !== "idle" ? (
          <p
            aria-live="polite"
            className={`mt-3 text-[0.75rem] leading-4 font-medium tracking-[0.14em] uppercase ${
              busy ? "text-muted" : ""
            }`}
          >
            {caption}
          </p>
        ) : null}
        {error ? (
          <p
            className="mt-2 max-w-[300px] text-center text-[0.8125rem] leading-5 text-[#9B2C1F]"
            role="alert"
          >
            {labels.errors[error]}
          </p>
        ) : null}

        <form
          className="border-line focus-within:border-ink mt-4 flex h-12 w-full max-w-[520px] items-center gap-2 rounded-full border pr-1.5 pl-4 transition-colors"
          onSubmit={submit}
        >
          <input
            aria-label={labels.placeholder}
            className="placeholder:text-muted min-w-0 flex-1 bg-transparent text-[0.9375rem] leading-5 outline-none"
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
        } ${status === "idle" ? "mic-ring-breathe" : ""}`}
        style={{ transform: `scale(${ring})` }}
      />
      <span
        className={`absolute rounded-full border border-[#E6DDC4] transition-transform duration-100 ${
          compact ? "inset-[8px]" : "inset-[14px]"
        } ${status === "speaking" ? "animate-ping [animation-duration:2s]" : ""} ${
          status === "idle" ? "mic-ring-breathe mic-ring-breathe-late" : ""
        }`}
        style={{ transform: `scale(${listening ? 1 + level * 0.2 : 1})` }}
      />
      <span
        className={`bg-gold hover:bg-gold-deep relative flex items-center justify-center rounded-full transition-colors ${
          status === "idle" ? "mic-breathe" : ""
        } ${compact ? "size-[60px]" : "size-[118px]"}`}
      >
        {status === "idle" ? (
          <Mic
            aria-hidden="true"
            className="text-white"
            size={compact ? 24 : 32}
            strokeWidth={1.8}
          />
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
          <Square
            aria-hidden="true"
            className="text-white"
            fill="currentColor"
            size={compact ? 16 : 22}
            strokeWidth={0}
          />
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
        <p className="bg-ink text-paper max-w-[85%] rounded-[20px] rounded-br-md px-4 py-2.5 text-[0.9375rem] leading-[1.375rem]">
          {message.text || <Dots />}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="sr-only">{labels.guide}:</span>
      {message.text ? (
        <p className="max-w-[92%] text-[1.0625rem] leading-[1.625rem] tracking-[-0.01em]">
          {message.text}
        </p>
      ) : message.pending ? (
        <Dots />
      ) : null}
      {message.sources?.length ? (
        <ul className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <li className="text-muted text-[0.75rem] leading-4 font-medium tracking-[0.12em] uppercase">
            {labels.source}
          </li>
          {message.sources.map((s) => (
            <li key={s.url}>
              <a
                className="text-ink decoration-line hover:decoration-ink focus-visible:outline-gold inline-flex items-center gap-1 rounded-sm text-[0.8125rem] leading-4 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
                href={s.url}
                rel="noreferrer"
                target="_blank"
              >
                {s.title}
                <ExternalLink aria-hidden="true" size={12} strokeWidth={1.8} />
              </a>
            </li>
          ))}
        </ul>
      ) : null}
      {message.events?.length ? (
        <div className="flex flex-col gap-2.5">
          {message.events.map((e) => (
            <Card
              event={e}
              key={`${e.event_id}-${e.performance_id}`}
              labels={labels}
              locale={locale}
            />
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
        style={
          event.image_url
            ? { backgroundImage: `url(${event.image_url})` }
            : undefined
        }
      />
      <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <p className="text-gold truncate text-[0.6875rem] leading-[0.875rem] font-medium tracking-[0.12em] uppercase">
          {event.subtitle ?? event.kind}
        </p>
        <h3 className="text-[1rem] leading-5 font-bold tracking-[-0.02em]">
          {event.title}
        </h3>
        <p className="text-muted text-[0.8125rem] leading-4">
          {when}
          {event.venue ? ` · ${event.venue}` : ""}
        </p>
        <div className="mt-1.5 flex items-center gap-3">
          <span className="text-[0.8125rem] leading-4 font-medium">
            {soldOut ? labels.soldOut : formatPrice(event, labels.free)}
          </span>
          <a
            className="border-ink hover:bg-surface focus-visible:outline-gold ml-auto flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[0.8125rem] leading-4 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
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
  if (e.price_max == null || e.price_max === e.price_min)
    return `${e.price_min} ${cur}`;
  return `${e.price_min}–${e.price_max} ${cur}`;
}

function Dots() {
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-[22px] items-center gap-1"
    >
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
