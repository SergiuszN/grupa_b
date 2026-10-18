"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { type SelectedSeat } from "@/lib/taste";

/* ------------------------------------------------------------------ */
/*  Public types                                                       */
/* ------------------------------------------------------------------ */

export type SeatData = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  section: string;
  row: string;
  num: string;
  cat: number;
  price: number;
  avail: boolean;
};

interface HallMapProps {
  maxSelectable: number;
  selectedSeats: SelectedSeat[];
  onSelectSeat: (seat: SelectedSeat) => void;
  onDeselectSeat: (seatId: string) => void;
  labels?: {
    allSectors?: string;
    parter?: string;
    balkon?: string;
    loza?: string;
    chor?: string;
    wheelchairFilter?: string;
    seatTakenNotice?: string;
    keyboardNavHint?: string;
    row?: string;
    seat?: string;
    sector?: string;
    zoomIn?: string;
    zoomOut?: string;
    resetZoom?: string;
  };
}

/* ------------------------------------------------------------------ */
/*  Grid constants (matching the provided HTML)                        */
/* ------------------------------------------------------------------ */

const SEAT_SIZE = 18;
const GAP = 3;
const STEP = SEAT_SIZE + GAP; // 21px

const CENTER_GAP = 50;
const SECTION_GAP = 80;

const PARTER_START_Y = 0;
const BALKON_START_Y = PARTER_START_Y + 13 * STEP + SECTION_GAP;
const STAGE_TOP = -460;
const STAGE_HEIGHT = 400;
const CHOR_START_Y = STAGE_TOP - 3 * STEP - 40;
const LOZA_TOP_Y = STAGE_TOP;

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII"];

const COLORS = {
  bg: "#ffffff",
  seat: "#333333",
  textWhite: "#ffffff",
  textDark: "#000000",
  selectedBg: "#ffffff",
  selectedBorder: "#eab308",
  wheelchairBg: "#1d4ed8",
  wheelchairIcon: "#ffffff",
  stageBorder: "#333333",
};

type Seat = {
  id: string;
  section: string;
  row: string;
  num: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  cat: number;
  price: number;
};

/* ------------------------------------------------------------------ */
/*  Seat generation (mirrors the vanilla JS version exactly)           */
/* ------------------------------------------------------------------ */

function generateSeats(): Seat[] {
  const seats: Seat[] = [];

  // 1. CHÓR
  for (let r = 0; r < 3; r++) {
    const rowId = ROMAN[2 - r];
    const y = CHOR_START_Y + r * STEP;
    for (let c = 1; c <= 27; c++) {
      const x = (14 - c) * STEP - SEAT_SIZE / 2;
      seats.push({ id: `CH-R${rowId}-M${c}`, section: "Chór", row: rowId, num: String(c), x, y, w: SEAT_SIZE, h: SEAT_SIZE, label: String(c), cat: 3, price: 30 });
    }
  }

  // 2. PARTER
  for (let r = 0; r < 13; r++) {
    const y = PARTER_START_Y + r * STEP;
    const rowId = ROMAN[r];

    // Lewy
    for (let c = 17; c <= 32; c++) {
      const dist = c - 17;
      const x = -CENTER_GAP / 2 - SEAT_SIZE - dist * STEP;
      seats.push({ id: `P-R${rowId}-M${c}`, section: "Parter Lewy", row: rowId, num: String(c), x, y, w: SEAT_SIZE, h: SEAT_SIZE, label: String(c), cat: r < 6 ? 1 : 2, price: r < 6 ? 50 : 40 });
    }

    // Prawy
    for (let c = 16; c >= 1; c--) {
      const dist = 16 - c;
      const x = CENTER_GAP / 2 + dist * STEP;
      seats.push({ id: `P-R${rowId}-M${c}`, section: "Parter Prawy", row: rowId, num: String(c), x, y, w: SEAT_SIZE, h: SEAT_SIZE, label: String(c), cat: r < 6 ? 1 : 2, price: r < 6 ? 50 : 40 });
    }
  }

  // 3. BALKON
  for (let r = 0; r < 12; r++) {
    const y = BALKON_START_Y + r * STEP;
    const rowId = ROMAN[r];

    // Lewy
    for (let c = 17; c <= 32; c++) {
      const dist = c - 17;
      const x = -CENTER_GAP / 2 - SEAT_SIZE - dist * STEP;
      seats.push({ id: `B-R${rowId}-M${c}`, section: "Balkon Lewy", row: rowId, num: String(c), x, y, w: SEAT_SIZE, h: SEAT_SIZE, label: String(c), cat: 2, price: 40 });
    }

    // Prawy
    for (let c = 16; c >= 1; c--) {
      const dist = 16 - c;
      const x = CENTER_GAP / 2 + dist * STEP;
      seats.push({ id: `B-R${rowId}-M${c}`, section: "Balkon Prawy", row: rowId, num: String(c), x, y, w: SEAT_SIZE, h: SEAT_SIZE, label: String(c), cat: 2, price: 40 });
    }
  }

  // 4. LOŻE
  const lozaLeftX = -CENTER_GAP / 2 - 16 * STEP - 60;
  const lozaRightX = CENTER_GAP / 2 + 15 * STEP + 60;

  for (let c = 1; c <= 36; c++) {
    const y = LOZA_TOP_Y + (36 - c) * STEP;
    seats.push({ id: `LA-M${c}`, section: "Loża A", row: "-", num: String(c), x: lozaLeftX, y, w: SEAT_SIZE, h: SEAT_SIZE, label: String(c), cat: 3, price: 30 });
    seats.push({ id: `LB-M${c}`, section: "Loża B", row: "-", num: String(c), x: lozaRightX, y, w: SEAT_SIZE, h: SEAT_SIZE, label: String(c), cat: 3, price: 30 });
  }

  return seats;
}

/* ------------------------------------------------------------------ */
/*  Sections for bottom pill bar                                       */
/* ------------------------------------------------------------------ */

const SECTIONS = [
  { key: "Cała sala", label: "Cała sala" },
  { key: "Chór", label: "Chór" },
  { key: "Loża A", label: "Loża A" },
  { key: "Parter Lewy", label: "Parter L" },
  { key: "Parter Prawy", label: "Parter P" },
  { key: "Balkon Lewy", label: "Balkon L" },
  { key: "Balkon Prawy", label: "Balkon P" },
  { key: "Loża B", label: "Loża B" },
] as const;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function HallMap({
  maxSelectable,
  selectedSeats,
  onSelectSeat,
  onDeselectSeat,
}: HallMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const seatsRef = useRef<Seat[]>([]);
  const transformRef = useRef({ x: 0, y: 150, scale: 0.8 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const animIdRef = useRef<number | null>(null);
  const selectedIdsRef = useRef<Set<string>>(new Set());
  const renderQueuedRef = useRef(false);

  const [activeSection, setActiveSection] = useState("Cała sala");

  // Keep selectedIds ref in sync
  useEffect(() => {
    selectedIdsRef.current = new Set(selectedSeats.map((s) => s.id));
    queueRender();
  }, [selectedSeats]);

  // Generate seats once
  useEffect(() => {
    seatsRef.current = generateSeats();
  }, []);

  /* ---------- render ---------- */

  const render = useCallback(() => {
    renderQueuedRef.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    const w = Math.floor(rect.width * dpr);
    const h = Math.floor(rect.height * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    const t = transformRef.current;
    const seats = seatsRef.current;
    const selectedIds = selectedIdsRef.current;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.translate(rect.width / 2 + t.x, rect.height / 2 + t.y);
    ctx.scale(t.scale, t.scale);

    const drawText = (text: string, x: number, y: number, font: string, align: CanvasTextAlign = "center") => {
      ctx.fillStyle = COLORS.textDark;
      ctx.font = font;
      ctx.textAlign = align;
      ctx.textBaseline = "middle";
      ctx.fillText(text, x, y);
    };

    const stageWidth = (CENTER_GAP / 2 + 15 * STEP + SEAT_SIZE) * 2;
    const stageLeft = -stageWidth / 2;

    // Stage
    ctx.strokeStyle = COLORS.stageBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(stageLeft, STAGE_TOP, stageWidth, STAGE_HEIGHT);
    drawText("SCENA | STAGE | BÜHNE", 0, STAGE_TOP + STAGE_HEIGHT / 2, "bold 32px Arial");

    // Section labels
    drawText("CHÓR | CHOIR | CHOR", 0, CHOR_START_Y - 35, "bold 15px Arial");
    drawText("PARTER | GROUND FLOOR | PARTERRE", 0, PARTER_START_Y - 35, "bold 15px Arial");
    drawText("BALKON | BALCONY | RANG", 0, BALKON_START_Y - 35, "bold 15px Arial");

    // Roman numerals
    for (let r = 0; r < 3; r++) {
      drawText(ROMAN[2 - r], -320, CHOR_START_Y + r * STEP + SEAT_SIZE / 2, "12px Arial");
      drawText(ROMAN[2 - r], 320, CHOR_START_Y + r * STEP + SEAT_SIZE / 2, "12px Arial");
    }
    for (let r = 0; r < 13; r++) {
      drawText(ROMAN[r], 0, PARTER_START_Y + r * STEP + SEAT_SIZE / 2, "12px Arial");
    }
    for (let r = 0; r < 12; r++) {
      drawText(ROMAN[r], 0, BALKON_START_Y + r * STEP + SEAT_SIZE / 2, "12px Arial");
    }

    // Loże labels (rotated)
    const lozaLeftTextX = -CENTER_GAP / 2 - 16 * STEP - 95;
    const lozaRightTextX = CENTER_GAP / 2 + 15 * STEP + 95;

    ctx.save();
    ctx.translate(lozaLeftTextX, STAGE_TOP + 400);
    ctx.rotate(-Math.PI / 2);
    drawText("LOŻA A | GALLERY A | LOGE A", 0, 0, "14px Arial");
    ctx.restore();

    ctx.save();
    ctx.translate(lozaRightTextX, STAGE_TOP + 400);
    ctx.rotate(-Math.PI / 2);
    drawText("LOŻA B | GALLERY B | LOGE B", 0, 0, "14px Arial");
    ctx.restore();

    // Wheelchair symbols
    const drawWheelchair = (x: number, y: number) => {
      ctx.fillStyle = COLORS.wheelchairBg;
      ctx.fillRect(x, y, 22, 22);
      ctx.fillStyle = COLORS.wheelchairIcon;
      ctx.font = "16px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("♿", x + 11, y + 12);
    };
    drawWheelchair(-CENTER_GAP / 2 - 16 * STEP - 4, PARTER_START_Y - 45);
    drawWheelchair(CENTER_GAP / 2 + 15 * STEP, PARTER_START_Y - 45);
    drawWheelchair(lozaLeftTextX + 22, STAGE_TOP + 550);
    drawWheelchair(lozaRightTextX - 44, STAGE_TOP + 550);

    // Seats
    ctx.font = "10px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (const seat of seats) {
      const isSelected = selectedIds.has(seat.id);

      ctx.fillStyle = isSelected ? COLORS.selectedBg : COLORS.seat;
      ctx.fillRect(seat.x, seat.y, seat.w, seat.h);

      if (isSelected) {
        ctx.strokeStyle = COLORS.selectedBorder;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(seat.x, seat.y, seat.w, seat.h);
      }

      ctx.fillStyle = isSelected ? COLORS.textDark : COLORS.textWhite;
      ctx.fillText(seat.label, seat.x + seat.w / 2, seat.y + seat.h / 2 + 1);
    }
  }, []);

  function queueRender() {
    if (renderQueuedRef.current) return;
    renderQueuedRef.current = true;
    requestAnimationFrame(render);
  }

  /* ---------- animated transform ---------- */

  const animateTransform = useCallback(
    (targetX: number, targetY: number, targetScale: number) => {
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);

      const startX = transformRef.current.x;
      const startY = transformRef.current.y;
      const startScale = transformRef.current.scale;
      const duration = 600;
      const startTime = performance.now();

      function step(now: number) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);

        transformRef.current.x = startX + (targetX - startX) * ease;
        transformRef.current.y = startY + (targetY - startY) * ease;
        transformRef.current.scale = startScale + (targetScale - startScale) * ease;

        render();

        if (progress < 1) {
          animIdRef.current = requestAnimationFrame(step);
        } else {
          animIdRef.current = null;
        }
      }

      animIdRef.current = requestAnimationFrame(step);
    },
    [render],
  );

  /* ---------- section focus ---------- */

  const focusSection = useCallback(
    (sectionName: string) => {
      if (sectionName === "Cała sala") {
        const clientH = canvasRef.current?.clientHeight || 400;
        const targetScale = clientH < 400 ? 0.62 : 0.8;
        const targetY = clientH < 400 ? 90 : 150;
        animateTransform(0, targetY, targetScale);
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) return;

      const sectionSeats = seatsRef.current.filter((s) => s.section === sectionName);
      if (sectionSeats.length === 0) return;

      let minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity;
      for (const s of sectionSeats) {
        if (s.x < minX) minX = s.x;
        if (s.x + s.w > maxX) maxX = s.x + s.w;
        if (s.y < minY) minY = s.y;
        if (s.y + s.h > maxY) maxY = s.y + s.h;
      }

      const w = maxX - minX;
      const h = maxY - minY;
      const cx = minX + w / 2;
      const cy = minY + h / 2;

      const paddingX = 120;
      const paddingY = 250;
      const clientW = canvas.clientWidth;
      const clientH = canvas.clientHeight;

      let targetScale = Math.min((clientW - paddingX) / w, (clientH - paddingY) / h);
      targetScale = Math.max(0.5, Math.min(targetScale, 2.5));

      const targetX = -cx * targetScale;
      const targetY = -cy * targetScale;

      animateTransform(targetX, targetY, targetScale);
    },
    [animateTransform],
  );

  /* ---------- cancel auto-animation on user interaction ---------- */

  const cancelAutoAnimation = useCallback(() => {
    if (animIdRef.current) {
      cancelAnimationFrame(animIdRef.current);
      animIdRef.current = null;
    }
    setActiveSection("Cała sala");
  }, []);

  /* ---------- coordinate conversion ---------- */

  const getCanvasCoords = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const t = transformRef.current;
    const x = (clientX - rect.left - rect.width / 2 - t.x) / t.scale;
    const y = (clientY - rect.top - rect.height / 2 - t.y) / t.scale;
    return { x, y };
  }, []);

  /* ---------- seat click handler ---------- */

  const handleSeatClick = useCallback(
    (clientX: number, clientY: number) => {
      const { x, y } = getCanvasCoords(clientX, clientY);
      const clicked = seatsRef.current.find(
        (seat) => x >= seat.x && x <= seat.x + seat.w && y >= seat.y && y <= seat.y + seat.h,
      );
      if (!clicked) return;

      if (selectedIdsRef.current.has(clicked.id)) {
        onDeselectSeat(clicked.id);
      } else {
        onSelectSeat({
          id: clicked.id,
          sector: clicked.section,
          row: clicked.row,
          seatNumber: clicked.num,
          category: clicked.cat,
          price: clicked.price,
        });
      }
    },
    [getCanvasCoords, onSelectSeat, onDeselectSeat],
  );

  /* ---------- mouse event handlers ---------- */

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onMouseDown = (e: MouseEvent) => {
      cancelAutoAnimation();
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      transformRef.current.x += dx;
      transformRef.current.y += dy;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
      queueRender();
    };

    const onMouseUp = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      const distance = Math.hypot(e.clientX - dragStartRef.current.x, e.clientY - dragStartRef.current.y);
      if (distance < 5) handleSeatClick(e.clientX, e.clientY);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cancelAutoAnimation();
      const delta = -e.deltaY * 0.003;
      let newScale = transformRef.current.scale * (1 + delta);
      newScale = Math.max(0.4, Math.min(newScale, 4));
      transformRef.current.scale = newScale;
      queueRender();
    };

    // Touch
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        cancelAutoAnimation();
        isDraggingRef.current = true;
        dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        lastMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || e.touches.length !== 1) return;
      e.preventDefault();
      const dx = e.touches[0].clientX - lastMouseRef.current.x;
      const dy = e.touches[0].clientY - lastMouseRef.current.y;
      transformRef.current.x += dx;
      transformRef.current.y += dy;
      lastMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      queueRender();
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      if (e.changedTouches.length === 1) {
        const distance = Math.hypot(
          e.changedTouches[0].clientX - dragStartRef.current.x,
          e.changedTouches[0].clientY - dragStartRef.current.y,
        );
        if (distance < 10) handleSeatClick(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      }
    };

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [cancelAutoAnimation, handleSeatClick]);

  /* ---------- initial render + resize ---------- */

  useEffect(() => {
    seatsRef.current = generateSeats();
    const clientH = containerRef.current?.clientHeight || 400;
    if (clientH < 400) {
      transformRef.current = { x: 0, y: 90, scale: 0.62 };
    }
    render();

    const onResize = () => queueRender();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [render]);

  /* ---------- section button click ---------- */

  const handleSectionClick = useCallback(
    (key: string) => {
      setActiveSection(key);
      focusSection(key);
    },
    [focusSection],
  );

  /* ---------- zoom buttons ---------- */

  const zoomIn = useCallback(() => {
    cancelAutoAnimation();
    transformRef.current.scale = Math.min(transformRef.current.scale * 1.3, 4);
    queueRender();
  }, [cancelAutoAnimation]);

  const zoomOut = useCallback(() => {
    cancelAutoAnimation();
    transformRef.current.scale = Math.max(transformRef.current.scale / 1.3, 0.4);
    queueRender();
  }, [cancelAutoAnimation]);

  /* ---------- JSX ---------- */

  return (
    <div ref={containerRef} className="relative w-full rounded-2xl overflow-hidden border border-line bg-white shadow-sm" style={{ height: "clamp(260px, 45vh, 480px)" }}>
      {/* Zoom Controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1 bg-white/95 shadow-md border border-gray-200 rounded-lg p-1 backdrop-blur-md">
        <button
          type="button"
          onClick={zoomIn}
          className="w-8 h-8 flex items-center justify-center text-gray-700 hover:bg-gray-100 hover:text-black rounded text-lg font-medium transition-colors"
          title="Przybliż"
          aria-label="Przybliż"
        >
          +
        </button>
        <div className="w-full h-px bg-gray-200" />
        <button
          type="button"
          onClick={zoomOut}
          className="w-8 h-8 flex items-center justify-center text-gray-700 hover:bg-gray-100 hover:text-black rounded text-lg font-medium transition-colors"
          title="Oddal"
          aria-label="Oddal"
        >
          −
        </button>
      </div>

      {/* Selected count badge */}
      <div className="absolute top-3 left-3 z-10 bg-white/95 shadow-md border border-gray-200 rounded-lg px-3 py-1.5 backdrop-blur-md flex items-center gap-2">
        <div className="w-3 h-3 border-2 border-yellow-500 bg-white rounded-sm shadow-[0_0_8px_rgba(234,179,8,0.4)]" />
        <span className="text-xs font-semibold text-gray-800">
          Wybrane:{" "}
          <span className="text-black font-bold">
            {selectedSeats.length}/{maxSelectable}
          </span>
        </span>
      </div>

      {/* Section pill bar */}
      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-10 bg-white/95 shadow-[0_4px_20px_rgba(0,0,0,0.1)] border border-gray-200 rounded-full p-1 backdrop-blur-md flex items-center gap-1 overflow-x-auto max-w-[95%] w-max" style={{ scrollbarWidth: "none" }}>
        {SECTIONS.map((sec) => (
          <button
            key={sec.key}
            type="button"
            onClick={() => handleSectionClick(sec.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
              activeSection === sec.key
                ? "bg-gray-800 text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            {sec.label}
          </button>
        ))}
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="block w-full h-full cursor-grab active:cursor-grabbing outline-none touch-none select-none"
      />
    </div>
  );
}
