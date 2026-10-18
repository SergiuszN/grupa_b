"use client";

import { useEffect, useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { FlowSteps, skippedSteps } from "@/components/flow/flow-nav";
import { Screen } from "@/components/flow/screen";
import { HallMap } from "@/components/seats/hall-map";
import { CtaButton } from "@/components/ui";
import { SEATS_KEY, type SelectedSeat } from "@/lib/taste";
import { useFlow } from "@/lib/use-flow";
import { hasSeats, seatPrice } from "@/lib/events";
import { useRouter } from "@/i18n/routing";
import { ArrowLeft, ArrowRight, Ticket } from "lucide-react";

export default function SeatsPage() {
  const t = useTranslations("Seats");
  const { event, ready, partySize } = useFlow();
  const [selectedSeats, setSelectedSeats] = useState<SelectedSeat[]>([]);
  const [pageAnnouncement, setPageAnnouncement] = useState("");
  const router = useRouter();

  // Exhibitions and tours have no seat map: their path goes straight on.
  useEffect(() => {
    if (ready && !hasSeats(event)) router.replace("/evening");
  }, [ready, event, router]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SEATS_KEY);
      if (stored) {
        // The choir seats were dropped from the plan; ignore any saved before that.
        const parsed = (JSON.parse(stored) as SelectedSeat[]).filter((s) => s.sector !== "Chór");
        if (parsed.length > 0) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot read of the seats saved earlier in the flow
          setSelectedSeats(parsed);
          return;
        }
      }
    } catch {
      // ignore JSON parse error
    }
  }, []);

  const saveSeats = (seats: SelectedSeat[]) => {
    setSelectedSeats(seats);
    try {
      localStorage.setItem(SEATS_KEY, JSON.stringify(seats));
    } catch {
      // ignore
    }
  };

  const handleSelectSeat = (picked: SelectedSeat) => {
    const seat = { ...picked, price: seatPrice(event, picked.category) };
    const next = [...selectedSeats, seat];
    saveSeats(next);
    setPageAnnouncement(
      t("seatSelectedAnnounce", {
        seat: `${seat.sector}, Rząd ${seat.row}, Miejsce ${seat.seatNumber}`,
        count: next.length,
      })
    );
  };

  const handleDeselectSeat = (seatId: string) => {
    const seat = selectedSeats.find((s) => s.id === seatId);
    const next = selectedSeats.filter((s) => s.id !== seatId);
    saveSeats(next);
    if (seat) {
      setPageAnnouncement(
        t("seatDeselectedAnnounce", {
          seat: `${seat.sector}, Rząd ${seat.row}, Miejsce ${seat.seatNumber}`,
        })
      );
    }
  };

  const totalPrice = useMemo(() => {
    return selectedSeats.reduce((sum, s) => sum + seatPrice(event, s.category), 0);
  }, [event, selectedSeats]);

  return (
    <Screen>
      <FlowSteps skip={skippedSteps(true)} step={4} />

      {/* Screen reader live updates */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {pageAnnouncement}
      </div>

      <div className="flex flex-1 flex-col px-4 sm:px-8 py-2 sm:py-4 gap-3 sm:gap-5 max-w-[1040px] mx-auto w-full pb-[calc(env(safe-area-inset-bottom)+96px)]">
        {/* Header */}
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-ink">
            {t("title")}
          </h1>
          <span className="text-muted text-sm font-medium tabular-nums sm:text-base">
            {t("countOf", {
              selected: selectedSeats.length,
              total: partySize,
            })}
          </span>
        </div>

        {/* Interactive Canvas Hall Map */}
        <section aria-label="Plan sali symfonicznej">
          <HallMap
            selectedSeats={selectedSeats}
            onSelectSeat={handleSelectSeat}
            onDeselectSeat={handleDeselectSeat}
            labels={{
              allSectors: t("allSectors"),
              parter: t("parter"),
              balkon: t("balkon"),
              loza: t("loza"),
              wheelchairFilter: t("wheelchairFilter"),
              seatTakenNotice: t("seatTakenNotice"),
              keyboardNavHint: t("keyboardNavHint"),
              row: t("row"),
              seat: t("seat"),
              sector: t("sector"),
              zoomIn: t("zoomIn"),
              zoomOut: t("zoomOut"),
              resetZoom: t("resetZoom"),
              backToHall: t("backToHall"),
              pickSectorHint: t("pickSectorHint"),
              stage: t("stage"),
            }}
          />
        </section>
      </div>

      <div className="border-line bg-paper/95 fixed inset-x-0 bottom-0 z-30 border-t backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1100px] items-center gap-3 px-6 pt-3 pb-[calc(env(safe-area-inset-bottom)+16px)]">
          <CtaButton
            aria-label={t("back")}
            href="/swipe"
            iconLeft={<ArrowLeft aria-hidden="true" size={18} strokeWidth={1.8} />}
            size="icon"
            variant="outline"
          />
          <CtaButton
            disabled={selectedSeats.length === 0}
            flex1
            href={selectedSeats.length > 0 ? "/evening" : undefined}
            iconLeft={<Ticket aria-hidden="true" size={18} strokeWidth={1.8} />}
            iconRight={<ArrowRight aria-hidden="true" size={18} strokeWidth={1.8} />}
            variant="primary"
          >
            {t("continue")} · {totalPrice} zł
          </CtaButton>
        </div>
      </div>
    </Screen>
  );
}
