"use client";

import { useEffect, useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { FlowArrows, FlowSteps } from "@/components/flow/flow-nav";
import { Screen } from "@/components/flow/screen";
import { HallMap } from "@/components/seats/hall-map";
import { SEATS_KEY, type SelectedSeat } from "@/lib/taste";
import { useFlow } from "@/lib/use-flow";
import { Armchair, Sparkles, X } from "lucide-react";

export default function SeatsPage() {
  const t = useTranslations("Seats");
  const { people } = useFlow();
  const [selectedSeats, setSelectedSeats] = useState<SelectedSeat[]>([]);
  const [pageAnnouncement, setPageAnnouncement] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SEATS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SelectedSeat[];
        if (parsed.length > 0) {
          setSelectedSeats(parsed);
          return;
        }
      }
    } catch {
      // ignore JSON parse error
    }
  }, [people]);

  const saveSeats = (seats: SelectedSeat[]) => {
    setSelectedSeats(seats);
    try {
      localStorage.setItem(SEATS_KEY, JSON.stringify(seats));
    } catch {
      // ignore
    }
  };

  const handleSelectSeat = (seat: SelectedSeat) => {
    let next: SelectedSeat[];
    if (selectedSeats.length >= people) {
      // FIFO replacement: remove first, add new
      next = [...selectedSeats.slice(1), seat];
    } else {
      next = [...selectedSeats, seat];
    }
    saveSeats(next);
    setPageAnnouncement(
      t("seatSelectedAnnounce", {
        seat: `${seat.sector}, Rząd ${seat.row}, Miejsce ${seat.seatNumber}`,
        current: next.length,
        total: people,
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
    return selectedSeats.reduce((sum, s) => sum + (s.price || 50), 0);
  }, [selectedSeats]);

  return (
    <Screen>
      <FlowSteps step={4} />

      {/* Screen reader live updates */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {pageAnnouncement}
      </div>

      <div className="flex flex-1 flex-col px-4 sm:px-8 py-2 sm:py-4 gap-3 sm:gap-5 max-w-[1040px] mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col gap-1 sm:gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[#AD891C] flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
              <Armchair size={14} aria-hidden="true" />
              {t("eyebrow")}
            </span>
            <span
              aria-label={`Wybrano ${selectedSeats.length} z ${people} wymaganych miejsc`}
              className="bg-[#AD891C]/15 text-[#AD891C] px-2.5 py-0.5 rounded-full text-xs font-medium"
            >
              {t("countSelected", { current: selectedSeats.length, total: people })}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-ink">
            {t("title")}
          </h1>
          <p className="text-xs sm:text-base text-muted max-w-2xl">
            {t("subtitle")}
          </p>
        </div>

        {/* Interactive Canvas Hall Map */}
        <section aria-label="Plan sali symfonicznej">
          <HallMap
            maxSelectable={people}
            selectedSeats={selectedSeats}
            onSelectSeat={handleSelectSeat}
            onDeselectSeat={handleDeselectSeat}
            labels={{
              allSectors: t("allSectors"),
              parter: t("parter"),
              balkon: t("balkon"),
              loza: t("loza"),
              chor: t("chor"),
              wheelchairFilter: t("wheelchairFilter"),
              seatTakenNotice: t("seatTakenNotice"),
              keyboardNavHint: t("keyboardNavHint"),
              row: t("row"),
              seat: t("seat"),
              sector: t("sector"),
              zoomIn: t("zoomIn"),
              zoomOut: t("zoomOut"),
              resetZoom: t("resetZoom"),
            }}
          />
        </section>

        {/* Selected Seats Badges & Bottom Total */}
        <div
          role="region"
          aria-label="Podsumowanie wybranych miejsc"
          className="bg-surface border border-line rounded-xl p-3 sm:p-4 flex items-center justify-between gap-3 shadow-sm"
        >
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted">
              <Sparkles size={13} className="text-[#AD891C] shrink-0" aria-hidden="true" />
              <span>{t("autoAssigned", { count: selectedSeats.length })}</span>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto">
              {selectedSeats.length === 0 ? (
                <span className="text-xs text-muted italic">
                  Kliknij miejsce na planie, aby je wybrać.
                </span>
              ) : (
                selectedSeats.map((seat) => (
                  <div
                    key={seat.id}
                    className="flex items-center gap-1 bg-[#AD891C]/10 border border-[#AD891C]/30 px-2.5 py-0.5 rounded-lg text-xs font-semibold text-ink"
                  >
                    <span>
                      {seat.sector} · Rz. {seat.row}, m. {seat.seatNumber}
                    </span>
                    <span className="text-muted font-normal">({seat.price} zł)</span>
                    <button
                      type="button"
                      onClick={() => handleDeselectSeat(seat.id)}
                      className="text-muted hover:text-ink transition-colors p-0.5 rounded-full hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#AD891C]"
                      aria-label={t("removeSeat", {
                        seat: `${seat.sector}, Rząd ${seat.row}, Miejsce ${seat.seatNumber}`,
                      })}
                    >
                      <X size={11} aria-hidden="true" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="text-right shrink-0 pl-3 border-l border-line">
            <p className="text-[10px] font-medium tracking-wider text-muted uppercase">
              {t("total")}
            </p>
            <p className="text-xl sm:text-2xl font-bold tracking-tight text-ink">
              {totalPrice} zł
            </p>
          </div>
        </div>
      </div>

      <FlowArrows step={4} />
    </Screen>
  );
}
