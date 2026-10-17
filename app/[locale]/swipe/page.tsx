"use client";

import { Link } from "@/i18n/routing";
import { useRouter } from "@/i18n/routing";
import { Check, X } from "lucide-react";
import { useRef, useState } from "react";
import { FlowArrows, FlowSteps } from "@/components/flow/flow-nav";
import { Screen } from "@/components/flow/screen";
import { EVENTS } from "@/lib/events";
import { SWIPE_KEY } from "@/lib/taste";

const THRESHOLD = 96;

export default function Swipe() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [exit, setExit] = useState<-1 | 1 | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const startX = useRef(0);

  const card = EVENTS[index];
  const step = Math.min(index + 1, EVENTS.length);

  function decide(direction: -1 | 1) {
    if (!card || exit !== null) return;

    const previous = JSON.parse(localStorage.getItem(SWIPE_KEY) ?? "[]");
    localStorage.setItem(
      SWIPE_KEY,
      JSON.stringify([
        ...previous,
        { id: card.id, choice: direction === 1 ? "tak" : "nie" },
      ]),
    );
    setSaved(direction === 1 ? "To chcę" : "Nie teraz");
    setExit(direction);

    window.setTimeout(() => {
      if (direction === 1) {
        router.push("/plan");
        return;
      }

      setIndex((current) => current + 1);
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

      {card ? (
        <div
          aria-label={`${card.title}, ${card.subtitle}. Przesuń w prawo, aby polubić, w lewo, aby odrzucić.`}
          className="concert-card mx-4 mt-3 flex h-[min(420px,50dvh)] cursor-grab touch-none flex-col justify-end overflow-clip rounded-[24px] bg-cover bg-[50%_40%] select-none active:cursor-grabbing"
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
        >
          <div className="from-ink/62 flex w-full flex-col justify-end bg-gradient-to-t to-transparent px-[22px] pt-14 pb-5">
            <p className="text-[11px] leading-[15px] font-medium tracking-[0.16em] text-white/85">
              {card.date} · {card.room}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-surface mx-4 mt-3 flex h-[min(420px,50dvh)] flex-col items-center justify-center gap-3 rounded-[24px] px-8 text-center">
          <p className="text-caption text-muted font-medium tracking-[0.16em] uppercase">
            To wszystkie propozycje
          </p>
          <p className="text-title font-bold">
            Dobraliśmy wieczór pod Twój gust.
          </p>
          <Link
            className="text-body mt-1 font-medium underline underline-offset-4"
            href="/"
          >
            Wróć na początek
          </Link>
        </div>
      )}

      <div className="rise px-[22px] pt-[22px]" key={`copy-${index}`}>
        <p className="text-gold text-[11px] leading-[15px] font-medium tracking-[0.16em] uppercase">
          {card ? card.kind : "Koniec"}
        </p>
        <h1 className="mt-2.5 text-[38px] leading-[40px] font-bold tracking-[-0.03em]">
          {card ? card.title : "Dziękujemy"}
        </h1>
        <p className="mt-1 text-[18px] leading-6 font-light">
          {card ? card.subtitle : "Twój wieczór jest już ułożony."}
        </p>
        <p className="text-muted mt-3 text-[13px] leading-[19px]">
          {card ? card.meta : "Wracaj po kolejne propozycje."}
        </p>
      </div>

      <div className="mt-auto flex gap-2.5 px-4 pt-6">
        <button
          aria-label="Nie teraz"
          className="border-ink hover:bg-surface focus-visible:outline-gold flex h-14 flex-1 items-center justify-center gap-2 rounded-full border-[1.5px] text-[14px] font-medium tracking-[0.01em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 active:scale-[0.98] disabled:opacity-40"
          disabled={!card || exit !== null}
          onClick={() => decide(-1)}
          type="button"
        >
          <X aria-hidden="true" size={18} strokeWidth={1.8} />
          Nie teraz
        </button>
        <button
          aria-label="To chcę"
          className="bg-gold text-paper hover:bg-gold-deep focus-visible:outline-ink flex h-14 flex-1 items-center justify-center gap-2 rounded-full text-[14px] font-bold tracking-[0.01em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 active:scale-[0.98] disabled:opacity-40"
          disabled={!card || exit !== null}
          onClick={() => decide(1)}
          type="button"
        >
          <Check aria-hidden="true" size={18} strokeWidth={2} />
          To chcę
        </button>
      </div>

      <div className="flex items-center gap-3.5 px-[22px] pt-5">
        <p className="text-muted text-[12px] leading-4 font-medium tracking-[0.08em] tabular-nums">
          {String(step).padStart(2, "0")} /{" "}
          {String(EVENTS.length).padStart(2, "0")}
        </p>
        <div className="bg-line h-0.5 flex-1">
          <div
            className="bg-gold h-0.5 transition-[width] duration-300"
            style={{ width: `${(step / EVENTS.length) * 100}%` }}
          />
        </div>
      </div>

      <FlowArrows step={2} />

      <p aria-live="polite" className="sr-only">
        {saved ? `Zapisane: ${saved}` : ""}
      </p>
    </Screen>
  );
}
