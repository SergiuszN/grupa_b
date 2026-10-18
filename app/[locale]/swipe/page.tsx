"use client";

import { Link } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { CalendarDays, Check, Clock, MapPin, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { FlowSteps } from "@/components/flow/flow-nav";
import { Screen } from "@/components/flow/screen";
import { CtaButton } from "@/components/ui";
import { EVENTS, localizeEvent, type EventInfo } from "@/lib/events";
import { PreviewPlayer } from "@/components/swipe/preview-player";
import { toEventInfo, type Recommendation } from "@/lib/recommendations";
import { PICKS_KEY, SWIPE_KEY, TASTE_KEY, type TasteAnswers } from "@/lib/taste";
import { prefersStillMotion } from "@/lib/motion";
import { sentenceCase } from "@/lib/format";

const THRESHOLD = 96;

export default function Swipe() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("Swipe");
  // null until the deck matching the quiz answers arrives.
  const [deck, setDeck] = useState<EventInfo[] | null>(null);
  const [index, setIndex] = useState(0);
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [exit, setExit] = useState<-1 | 1 | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const startX = useRef(0);
  const cardWrap = useRef<HTMLDivElement>(null);
  const copyWrap = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (prefersStillMotion()) {
      if (cardWrap.current) {
        gsap.set(cardWrap.current, {
          autoAlpha: 1,
          clearProps: "transform,visibility",
        });
      }
      if (copyWrap.current) {
        gsap.set(copyWrap.current.querySelectorAll("[data-copy]"), {
          autoAlpha: 1,
          y: 0,
          clearProps: "transform,visibility",
        });
      }
      return;
    }

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    if (cardWrap.current) {
      tl.fromTo(
        cardWrap.current,
        { y: 26, autoAlpha: 0, scale: 0.975 },
        {
          y: 0,
          autoAlpha: 1,
          scale: 1,
          duration: 0.62,
          clearProps: "transform,visibility",
        },
        0,
      );
    }

    if (copyWrap.current) {
      tl.fromTo(
        copyWrap.current.querySelectorAll("[data-copy]"),
        { y: 14, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.5,
          stagger: 0.06,
          clearProps: "transform,visibility",
        },
        0.16,
      );
    }

    return () => {
      tl.kill();
    };
  }, [index, deck]);

  function decide(direction: -1 | 1) {
    if (!card || exit !== null) return;

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
    setExit(direction);

    window.setTimeout(() => {
      if (direction === 1) {
        router.push("/plan");
        return;
      }

      setIndex((current) => (current + 1) % (deck?.length ?? 1));
      setExit(null);
      setDx(0);
      setDragging(false);
    }, 280);
  }

  function release(event: React.PointerEvent<HTMLElement>) {
    setDragging(false);

    const moved = event.clientX - startX.current;

    if (Math.abs(moved) > THRESHOLD) {
      decide(moved > 0 ? 1 : -1);
      return;
    }

    setDx(0);
  }

  const offset = exit === null ? dx : exit * 640;

  return (
    <Screen>
      <FlowSteps step={2} />

      {deck === null ? (
        <div
          aria-busy="true"
          className="bg-surface ring-ink/10 mx-6 mt-3 min-h-[220px] flex-1 animate-pulse rounded-[24px] ring-1"
        />
      ) : card ? (
        <>
          <div className="relative mx-6 mt-3 flex min-h-[220px] flex-1" ref={cardWrap}>
            <div
              aria-label={t("cardAria", {
                title: card.title,
                subtitle: card.subtitle,
              })}
              className="concert-card ring-ink/10 flex-1 cursor-grab touch-none overflow-clip rounded-[24px] bg-cover bg-[50%_40%] ring-1 select-none active:cursor-grabbing"
              key={card.id}
              onKeyDown={(event) => {
                if (event.key === "ArrowLeft") decide(-1);
                if (event.key === "ArrowRight") decide(1);
              }}
              onPointerCancel={() => {
                setDragging(false);
                setDx(0);
              }}
              onPointerDown={(event) => {
                if (exit !== null) return;
                event.currentTarget.setPointerCapture(event.pointerId);
                startX.current = event.clientX;
                setDragging(true);
              }}
              onPointerMove={(event) => {
                if (!dragging || exit !== null) return;
                setDx(event.clientX - startX.current);
              }}
              onPointerUp={release}
              role="group"
              style={{
                backgroundImage: `url(${card.image})`,
                opacity: exit === null ? 1 : 0,
                transform: `translate3d(${offset}px, 0, 0) rotate(${offset / 22}deg)`,
                transition: dragging
                  ? "none"
                  : "transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 280ms ease-out",
              }}
              tabIndex={0}
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

      <div
        className={`px-6 pt-5 ${deck === null ? "invisible" : ""}`}
        key={`copy-${index}`}
        ref={copyWrap}
      >
        <p
          className="text-gold text-[0.6875rem] leading-[0.9375rem] font-medium tracking-[0.16em] uppercase"
          data-copy
        >
          {card ? card.kind : t("endKind")}
        </p>
        <h1
          className="mt-2.5 text-[2.125rem] leading-9 font-bold tracking-[-0.03em]"
          data-copy
        >
          {card ? card.title : t("endBig")}
        </h1>
        <p className="mt-1 text-[1.0625rem] leading-6 font-light" data-copy>
          {card ? card.subtitle : t("endSubtitle")}
        </p>

        {card ? (
          <p
            className="text-muted mt-2 line-clamp-3 text-[0.875rem] leading-5"
            data-copy
          >
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

      <div className="mt-auto flex gap-2.5 px-6 pt-5 pb-[calc(env(safe-area-inset-bottom)+20px)]">
        <CtaButton
          aria-label={t("skip")}
          disabled={!card || exit !== null}
          flex1
          iconLeft={<X aria-hidden="true" size={18} strokeWidth={1.8} />}
          onClick={() => decide(-1)}
          variant="outline"
        >
          {t("skip")}
        </CtaButton>
        <CtaButton
          aria-label={t("like")}
          disabled={!card || exit !== null}
          flex1
          iconLeft={<Check aria-hidden="true" size={18} strokeWidth={2} />}
          onClick={() => decide(1)}
          variant="primary"
        >
          {t("like")}
        </CtaButton>
      </div>

      <p aria-live="polite" className="sr-only">
        {saved ?? ""}
      </p>
    </Screen>
  );
}
