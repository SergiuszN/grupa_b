"use client";

import { Link } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { CalendarDays, Check, Clock, MapPin, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { FlowSteps } from "@/components/flow/flow-nav";
import { Screen } from "@/components/flow/screen";
import { CtaButton } from "@/components/ui";
import { EVENTS, hasSeats, localizeEvent, type EventInfo } from "@/lib/events";
import { PreviewPlayer } from "@/components/swipe/preview-player";
import { toEventInfo, type Recommendation } from "@/lib/recommendations";
import { PICKS_KEY, SWIPE_KEY, TASTE_KEY, type TasteAnswers } from "@/lib/taste";
import { prefersStillMotion } from "@/lib/motion";
import { sentenceCase } from "@/lib/format";

export default function Swipe() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("Swipe");
  // null until the deck matching the quiz answers arrives.
  const [deck, setDeck] = useState<EventInfo[] | null>(null);
  const [index, setIndex] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  const card = deck?.[index] ? localizeEvent(deck[index], locale) : undefined;

  useEffect(() => {
    let cancelled = false;
    let tastes: string[] = [];

    try {
      const answers = JSON.parse(
        localStorage.getItem(TASTE_KEY) ?? "{}",
      ) as TasteAnswers;
      tastes = answers.tastes ?? [];
    } catch {
      // No quiz answers yet: the API returns the nearest events.
    }

    const params = new URLSearchParams({ lang: locale });
    if (tastes.length) params.set("taste", tastes.join(","));

    fetch(`/api/recommendations?${params}`)
      .then((response) => response.json() as Promise<{ data?: Recommendation[] | null }>)
      .then(({ data }) => {
        if (!data?.length) throw new Error("empty deck");
        if (!cancelled) {
          setDeck(
            data.map((rec) =>
              toEventInfo(
                rec,
                locale,
                t.has(`kinds.${rec.kind}`) ? t(`kinds.${rec.kind}`) : t("kinds.other"),
              ),
            ),
          );
        }
      })
      .catch(() => {
        // API offline: fall back to the built-in showcase events.
        if (!cancelled) setDeck(EVENTS);
      });

    return () => {
      cancelled = true;
    };
  }, [locale, t]);

  function decide(direction: -1 | 1) {
    if (!card || leaving) return;

    if (direction === 1) {
      const picks = JSON.parse(localStorage.getItem(PICKS_KEY) ?? "{}");
      localStorage.setItem(PICKS_KEY, JSON.stringify({ ...picks, [card.id]: card }));
    }

    const previous = JSON.parse(localStorage.getItem(SWIPE_KEY) ?? "[]");
    localStorage.setItem(
      SWIPE_KEY,
      JSON.stringify([
        ...previous,
        { id: card.id, choice: direction === 1 ? "tak" : "nie" },
      ]),
    );
    setSaved(direction === 1 ? t("like") : t("skip"));
    setLeaving(true);

    const wait = prefersStillMotion() ? 0 : 220;

    window.setTimeout(() => {
      if (direction === 1) {
        router.push(hasSeats(card) ? "/seats" : "/plan");
        return;
      }

      setIndex((current) => (current + 1) % (deck?.length ?? 1));
      setLeaving(false);
    }, wait);
  }

  return (
    <Screen>
      <FlowSteps step={2} />

      <div
        className={`flex flex-1 flex-col pb-[calc(env(safe-area-inset-bottom)+104px)] ${
          leaving ? "swipe-out" : "swipe-in"
        }`}
        key={card?.id ?? (deck === null ? "loading" : "end")}
      >
        {deck === null ? (
          <div
            aria-busy="true"
            className="bg-surface ring-ink/10 mx-6 mt-3 min-h-[220px] flex-1 animate-pulse rounded-[24px] ring-1"
          />
        ) : card ? (
          <>
            <div className="relative mx-6 mt-3 flex min-h-[220px] flex-1">
              <div
                aria-label={t("cardAria", {
                  title: card.title,
                  subtitle: card.subtitle,
                })}
                className="concert-card ring-ink/10 flex-1 overflow-clip rounded-[24px] bg-cover bg-[50%_40%] ring-1"
                role="img"
                style={{ backgroundImage: `url(${card.image})` }}
              />
            </div>

            {card.audio ? (
              <div className="px-6 pt-3">
                <PreviewPlayer
                  key={card.id}
                  label={t("preview")}
                  pauseLabel={t("pause")}
                  src="/audio/preview.mp3"
                />
              </div>
            ) : null}
          </>
        ) : (
          <div className="bg-surface ring-ink/10 mx-6 mt-3 flex min-h-[220px] flex-1 flex-col items-center justify-center gap-3 rounded-[24px] px-8 text-center ring-1">
            <p className="text-caption text-muted font-medium tracking-[0.16em] uppercase">
              {t("endEyebrow")}
            </p>
            <p className="text-title font-bold">{t("endTitle")}</p>
            <Link
              className="text-body mt-1 font-medium underline underline-offset-4"
              href="/"
            >
              {t("backHome")}
            </Link>
          </div>
        )}

        <div className="px-6 pt-5">
          <p className="text-gold text-[0.6875rem] leading-[0.9375rem] font-medium tracking-[0.16em] uppercase">
            {card ? card.kind : t("endKind")}
          </p>
          <h1 className="mt-2.5 text-[2.125rem] leading-9 font-bold tracking-[-0.03em]">
            {card ? card.title : t("endBig")}
          </h1>
          <p className="mt-1 text-[1.0625rem] leading-6 font-light">
            {card ? card.subtitle : t("endSubtitle")}
          </p>

          {card ? (
            <p className="text-muted mt-2 line-clamp-3 text-[0.875rem] leading-5">
              {card.description}
            </p>
          ) : null}

          {card ? (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="border-line text-ink flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.75rem] leading-4">
                <CalendarDays aria-hidden="true" size={13} strokeWidth={1.7} />
                {sentenceCase(card.date)}
              </span>
              <span className="border-line text-ink flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.75rem] leading-4">
                <MapPin aria-hidden="true" size={13} strokeWidth={1.7} />
                {sentenceCase(card.room)}
              </span>
              {card.duration ? (
                <span className="border-line text-ink flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.75rem] leading-4">
                  <Clock aria-hidden="true" size={13} strokeWidth={1.7} />
                  {card.duration} min
                </span>
              ) : null}
            </div>
          ) : null}

          <p className="text-muted mt-2 text-[0.8125rem] leading-[1.1875rem]">
            {card ? card.meta : t("endMeta")}
          </p>
        </div>
      </div>

      <div className="border-line bg-paper/95 fixed inset-x-0 bottom-0 z-30 border-t backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1100px] gap-2.5 px-6 pt-3 pb-[calc(env(safe-area-inset-bottom)+16px)]">
          <CtaButton
            aria-label={t("skip")}
            disabled={!card || leaving}
            flex1
            iconLeft={<RefreshCw aria-hidden="true" size={17} strokeWidth={1.9} />}
            onClick={() => decide(-1)}
            variant="outline"
          >
            {t("skip")}
          </CtaButton>
          <CtaButton
            aria-label={t("like")}
            disabled={!card || leaving}
            flex1
            iconLeft={<Check aria-hidden="true" size={18} strokeWidth={2} />}
            onClick={() => decide(1)}
            variant="primary"
          >
            {t("like")}
          </CtaButton>
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {saved ?? ""}
      </p>
    </Screen>
  );
}
