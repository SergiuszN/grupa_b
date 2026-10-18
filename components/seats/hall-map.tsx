"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Theater } from "lucide-react";
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
  selectedSeats: SelectedSeat[];
  onSelectSeat: (seat: SelectedSeat) => void;
  onDeselectSeat: (seatId: string) => void;
  labels?: {
    allSectors?: string;
    parter?: string;
    balkon?: string;
    loza?: string;
    wheelchairFilter?: string;
    seatTakenNotice?: string;
    keyboardNavHint?: string;
    row?: string;
    seat?: string;
    sector?: string;
    zoomIn?: string;
    zoomOut?: string;
    resetZoom?: string;
    backToHall?: string;
    pickSectorHint?: string;
    stage?: string;
  };
}

/* ------------------------------------------------------------------ */
/*  Grid constants                                                     */
/* ------------------------------------------------------------------ */

const SEAT_SIZE = 18;
const GAP = 3;
const STEP = SEAT_SIZE + GAP; // 21px

const CENTER_GAP = 50;
const SECTION_GAP = 80;

const PARTER_START_Y = 0;
const BALKON_START_Y = PARTER_START_Y + 13 * STEP + SECTION_GAP;
const STAGE_HEIGHT = 150;
const STAGE_TOP = -STAGE_HEIGHT - 60;
const LOZA_TOP_Y = STAGE_TOP;

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII"];

const COLORS = {
  bg: "#ffffff",
  seat: "#333333",
  textWhite: "#ffffff",
  ink: "#111111",
  muted: "#6b6760",
  gold: "#AD891C",
  selectedBg: "#ffffff",
  selectedBorder: "#eab308",
  wheelchairBg: "#1d4ed8",
  wheelchairIcon: "#ffffff",
  stageFill: "#111111",
  stageBorder: "#111111",
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

type Rect = { x: number; y: number; w: number; h: number };

/* ------------------------------------------------------------------ */
/*  Seat generation                                                    */
/* ------------------------------------------------------------------ */

function generateSeats(): Seat[] {
  const seats: Seat[] = [];

  // 1. PARTER
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

  // 2. BALKON
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

  // 3. LOŻE
  const lozaLeftX = -CENTER_GAP / 2 - 16 * STEP - 90;
  const lozaRightX = CENTER_GAP / 2 + 15 * STEP + 90;

  for (let c = 1; c <= 36; c++) {
    const y = LOZA_TOP_Y + (36 - c) * STEP;
    seats.push({ id: `LA-M${c}`, section: "Loża A", row: "-", num: String(c), x: lozaLeftX, y, w: SEAT_SIZE, h: SEAT_SIZE, label: String(c), cat: 3, price: 30 });
    seats.push({ id: `LB-M${c}`, section: "Loża B", row: "-", num: String(c), x: lozaRightX, y, w: SEAT_SIZE, h: SEAT_SIZE, label: String(c), cat: 3, price: 30 });
  }

  return seats;
}

/* ------------------------------------------------------------------ */
/*  Schematic sectors                                                  */
/* ------------------------------------------------------------------ */

const SECTIONS = [
  { key: "Parter Lewy", label: "Parter L", price: "40–50 zł", fill: "rgba(173,137,28,0.16)", stroke: "rgba(173,137,28,0.55)", vertical: false },
  { key: "Parter Prawy", label: "Parter P", price: "40–50 zł", fill: "rgba(173,137,28,0.16)", stroke: "rgba(173,137,28,0.55)", vertical: false },
  { key: "Balkon Lewy", label: "Balkon L", price: "40 zł", fill: "rgba(173,137,28,0.08)", stroke: "rgba(173,137,28,0.4)", vertical: false },
  { key: "Balkon Prawy", label: "Balkon P", price: "40 zł", fill: "rgba(173,137,28,0.08)", stroke: "rgba(173,137,28,0.4)", vertical: false },
  { key: "Loża A", label: "Loża A", price: "30 zł", fill: "rgba(17,17,17,0.05)", stroke: "rgba(17,17,17,0.22)", vertical: true },
  { key: "Loża B", label: "Loża B", price: "30 zł", fill: "rgba(17,17,17,0.05)", stroke: "rgba(17,17,17,0.22)", vertical: true },
] as const;

type SectionKey = (typeof SECTIONS)[number]["key"];

const BLOCK_PAD = 10;
// Boxes are one seat wide, so the schematic block is padded out to stay tappable on phones.
const LOZA_BLOCK_PAD_X = 26;

function computeBlocks(seats: Seat[]): Map<string, Rect> {
  const blocks = new Map<string, Rect>();
  for (const sec of SECTIONS) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const s of seats) {
      if (s.section !== sec.key) continue;
      minX = Math.min(minX, s.x);
      maxX = Math.max(maxX, s.x + s.w);
      minY = Math.min(minY, s.y);
      maxY = Math.max(maxY, s.y + s.h);
    }
    const padX = sec.vertical ? LOZA_BLOCK_PAD_X : BLOCK_PAD;
    blocks.set(sec.key, {
      x: minX - padX,
      y: minY - BLOCK_PAD,
      w: maxX - minX + padX * 2,
      h: maxY - minY + BLOCK_PAD * 2,
    });
  }
  return blocks;
}

const SEATS = generateSeats();
const BLOCKS = computeBlocks(SEATS);

const STAGE_WIDTH = (CENTER_GAP / 2 + 15 * STEP + SEAT_SIZE) * 2;
const STAGE_RECT: Rect = { x: -STAGE_WIDTH / 2, y: STAGE_TOP, w: STAGE_WIDTH, h: STAGE_HEIGHT };

function unionRect(rects: Rect[]): Rect {
  const minX = Math.min(...rects.map((r) => r.x));
  const minY = Math.min(...rects.map((r) => r.y));
  const maxX = Math.max(...rects.map((r) => r.x + r.w));
  const maxY = Math.max(...rects.map((r) => r.y + r.h));
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

function contains(r: Rect, x: number, y: number) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function HallMap({
  selectedSeats,
  onSelectSeat,
  onDeselectSeat,
  labels,
}: HallMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stageLabelRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef({ x: 0, y: 0, scale: 0.5 });
  // 0 = schematic blocks, 1 = seats of the active section
  const detailRef = useRef(0);
  const activeRef = useRef<SectionKey | null>(null);
  const hoverRef = useRef<SectionKey | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const animIdRef = useRef<number | null>(null);
  const animTargetRef = useRef<{ detail: number } | null>(null);
  const selectedIdsRef = useRef<Set<string>>(new Set());
  const renderQueuedRef = useRef(false);

  const [activeSection, setActiveSection] = useState<SectionKey | null>(null);

  const selectedBySection = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of selectedSeats) counts.set(s.sector, (counts.get(s.sector) ?? 0) + 1);
    return counts;
  }, [selectedSeats]);
  const selectedBySectionRef = useRef(selectedBySection);

  /* ---------- fitting ---------- */

  const fitRect = useCallback((r: Rect, padX: number, padTop: number, padBottom: number) => {
    const canvas = canvasRef.current;
    const clientW = canvas?.clientWidth || 600;
    const clientH = canvas?.clientHeight || 400;
    const scale = Math.max(0.2, Math.min((clientW - padX * 2) / r.w, (clientH - padTop - padBottom) / r.h, 2.5));
    return {
      x: -(r.x + r.w / 2) * scale,
      y: -(r.y + r.h / 2) * scale + (padTop - padBottom) / 2,
      scale,
    };
  }, []);

  const overviewTransform = useCallback(
    // Bottom inset keeps the hint pill clear of the balcony.
    () => fitRect(unionRect([STAGE_RECT, ...BLOCKS.values()]), 12, 14, 56),
    [fitRect],
  );

  const sectionTransform = useCallback(
    (key: SectionKey) => {
      const block = BLOCKS.get(key);
      if (!block) return overviewTransform();
      // Leave room for the back pill at the top and the zoom controls.
      return fitRect(block, 24, 60, 56);
    },
    [fitRect, overviewTransform],
  );

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
    const detail = detailRef.current;
    const active = activeRef.current;
    const hover = hoverRef.current;
    const blocks = BLOCKS;
    const selectedIds = selectedIdsRef.current;
    const counts = selectedBySectionRef.current;

    const toScreen = (x: number, y: number) => ({
      x: rect.width / 2 + t.x + x * t.scale,
      y: rect.height / 2 + t.y + y * t.scale,
    });

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.save();
    ctx.translate(rect.width / 2 + t.x, rect.height / 2 + t.y);
    ctx.scale(t.scale, t.scale);

    // Stage
    ctx.fillStyle = COLORS.stageFill;
    ctx.strokeStyle = COLORS.stageBorder;
    ctx.lineWidth = 2 / t.scale;
    ctx.beginPath();
    ctx.roundRect(STAGE_RECT.x, STAGE_RECT.y, STAGE_RECT.w, STAGE_RECT.h, 16);
    ctx.fill();
    ctx.stroke();

    // Schematic blocks. The active one fades out while its seats fade in.
    for (const sec of SECTIONS) {
      const b = blocks.get(sec.key);
      if (!b) continue;
      const alpha = sec.key === active ? 1 - detail : 1 - detail * 0.55;
      if (alpha <= 0.01) continue;
      const hasSelection = (counts.get(sec.key) ?? 0) > 0;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = sec.fill;
      ctx.beginPath();
      ctx.roundRect(b.x, b.y, b.w, b.h, 14);
      ctx.fill();
      if (hover === sec.key) {
        ctx.fillStyle = "rgba(173,137,28,0.12)";
        ctx.fill();
      }
      ctx.strokeStyle = hasSelection ? COLORS.gold : sec.stroke;
      ctx.lineWidth = (hasSelection || hover === sec.key ? 2.5 : 1.5) / t.scale;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Seats + row numerals of the active section
    if (active && detail > 0.01) {
      ctx.globalAlpha = detail;
      ctx.font = "10px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (const seat of SEATS) {
        if (seat.section !== active) continue;
        const isSelected = selectedIds.has(seat.id);

        ctx.fillStyle = isSelected ? COLORS.selectedBg : COLORS.seat;
        ctx.fillRect(seat.x, seat.y, seat.w, seat.h);

        if (isSelected) {
          ctx.strokeStyle = COLORS.selectedBorder;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(seat.x, seat.y, seat.w, seat.h);
        }

        ctx.fillStyle = isSelected ? COLORS.ink : COLORS.textWhite;
        ctx.fillText(seat.label, seat.x + seat.w / 2, seat.y + seat.h / 2 + 1);
      }

      ctx.fillStyle = COLORS.muted;
      ctx.font = "11px Arial";
      if (active.startsWith("Parter") || active.startsWith("Balkon")) {
        const startY = active.startsWith("Parter") ? PARTER_START_Y : BALKON_START_Y;
        const rows = active.startsWith("Parter") ? 13 : 12;
        const left = active.endsWith("Lewy");
        const x = left ? -CENTER_GAP / 2 + 12 : CENTER_GAP / 2 - 12;
        for (let r = 0; r < rows; r++) ctx.fillText(ROMAN[r], x, startY + r * STEP + SEAT_SIZE / 2);
      }

      if (active.startsWith("Parter")) {
        // Wheelchair spaces sit in front of the first parter row.
        const wx = active.endsWith("Lewy") ? -CENTER_GAP / 2 - 16 * STEP - 4 : CENTER_GAP / 2 + 15 * STEP;
        ctx.fillStyle = COLORS.wheelchairBg;
        ctx.fillRect(wx, PARTER_START_Y - 34, 22, 22);
        ctx.fillStyle = COLORS.wheelchairIcon;
        ctx.font = "16px Arial";
        ctx.fillText("♿", wx + 11, PARTER_START_Y - 22);
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    /* Labels are drawn in screen space so they stay legible at any zoom. */
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const stageCenter = toScreen(0, STAGE_TOP + STAGE_HEIGHT / 2);
    if (stageLabelRef.current) {
      stageLabelRef.current.style.transform = `translate(${stageCenter.x}px, ${stageCenter.y}px) translate(-50%, -50%)`;
      stageLabelRef.current.style.opacity = "1";
    }

    for (const sec of SECTIONS) {
      const b = blocks.get(sec.key);
      if (!b) continue;
      const alpha = sec.key === active ? 1 - detail : 1 - detail * 0.55;
      if (alpha <= 0.01) continue;
      const c = toScreen(b.x + b.w / 2, b.y + b.h / 2);
      const count = counts.get(sec.key) ?? 0;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(c.x, c.y);
      if (sec.vertical) ctx.rotate(-Math.PI / 2);

      ctx.fillStyle = COLORS.ink;
      ctx.font = "700 13px system-ui, sans-serif";
      ctx.fillText(sec.label, 0, -8);
      ctx.fillStyle = COLORS.muted;
      ctx.font = "500 11px system-ui, sans-serif";
      ctx.fillText(sec.price, 0, 8);

      if (count > 0) {
        // Vertical labels run along the box, so the badge goes after the text instead of below it.
        const bx = sec.vertical ? -62 : 0;
        const by = sec.vertical ? 0 : 28;
        ctx.fillStyle = COLORS.gold;
        ctx.beginPath();
        ctx.roundRect(bx - 16, by - 9, 32, 18, 9);
        ctx.fill();
        ctx.fillStyle = COLORS.textWhite;
        ctx.font = "700 11px system-ui, sans-serif";
        ctx.fillText(`✓ ${count}`, bx, by + 0.5);
      }
      ctx.restore();
    }
  }, []);

  const queueRender = useCallback(() => {
    if (renderQueuedRef.current) return;
    renderQueuedRef.current = true;
    requestAnimationFrame(render);
  }, [render]);

  // Keep selection refs in sync
  useEffect(() => {
    selectedIdsRef.current = new Set(selectedSeats.map((s) => s.id));
    selectedBySectionRef.current = selectedBySection;
    queueRender();
  }, [selectedSeats, selectedBySection, queueRender]);

  /* ---------- animated transform ---------- */

  const animateTo = useCallback(
    (target: { x: number; y: number; scale: number }, targetDetail: number) => {
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);

      const start = { ...transformRef.current };
      const startDetail = detailRef.current;
      const duration = 550;
      const startTime = performance.now();
      animTargetRef.current = { detail: targetDetail };

      function step(now: number) {
        const progress = Math.min((now - startTime) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);

        transformRef.current = {
          x: start.x + (target.x - start.x) * ease,
          y: start.y + (target.y - start.y) * ease,
          scale: start.scale + (target.scale - start.scale) * ease,
        };
        detailRef.current = startDetail + (targetDetail - startDetail) * ease;

        render();

        if (progress < 1) {
          animIdRef.current = requestAnimationFrame(step);
        } else {
          animIdRef.current = null;
          animTargetRef.current = null;
        }
      }

      animIdRef.current = requestAnimationFrame(step);
    },
    [render],
  );

  const cancelAnimation = useCallback(() => {
    if (!animIdRef.current) return;
    cancelAnimationFrame(animIdRef.current);
    animIdRef.current = null;
    if (animTargetRef.current) detailRef.current = animTargetRef.current.detail;
    animTargetRef.current = null;
  }, []);

  /* ---------- sector navigation ---------- */

  const openSection = useCallback(
    (key: SectionKey) => {
      activeRef.current = key;
      hoverRef.current = null;
      setActiveSection(key);
      animateTo(sectionTransform(key), 1);
    },
    [animateTo, sectionTransform],
  );

  const backToOverview = useCallback(() => {
    // activeRef stays set until the seats have faded out.
    setActiveSection(null);
    hoverRef.current = null;
    animateTo(overviewTransform(), 0);
  }, [animateTo, overviewTransform]);

  /* ---------- coordinate conversion ---------- */

  const getWorldCoords = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const t = transformRef.current;
    return {
      x: (clientX - rect.left - rect.width / 2 - t.x) / t.scale,
      y: (clientY - rect.top - rect.height / 2 - t.y) / t.scale,
    };
  }, []);

  const blockAt = useCallback((x: number, y: number): SectionKey | null => {
    for (const sec of SECTIONS) {
      const b = BLOCKS.get(sec.key);
      if (b && contains(b, x, y)) return sec.key;
    }
    return null;
  }, []);

  /* ---------- click handler ---------- */

  const isDetail = useCallback(() => activeSection !== null, [activeSection]);

  const handleClick = useCallback(
    (clientX: number, clientY: number) => {
      const { x, y } = getWorldCoords(clientX, clientY);

      if (!isDetail()) {
        const key = blockAt(x, y);
        if (key) openSection(key);
        return;
      }

      const active = activeRef.current;
      const clicked = SEATS.find(
        (seat) => seat.section === active && contains(seat, x, y),
      );
      if (!clicked) {
        const key = blockAt(x, y);
        if (key && key !== active) openSection(key);
        return;
      }

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
    [getWorldCoords, isDetail, blockAt, openSection, onSelectSeat, onDeselectSeat],
  );

  /* ---------- pointer event handlers ---------- */

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const detail = isDetail();

    const onMouseDown = (e: MouseEvent) => {
      if (detail) cancelAnimation();
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !detail) {
        if (!detail && e.target === canvas) {
          const { x, y } = getWorldCoords(e.clientX, e.clientY);
          const key = blockAt(x, y);
          if (key !== hoverRef.current) {
            hoverRef.current = key;
            canvas.style.cursor = key ? "pointer" : "default";
            queueRender();
          }
        }
        return;
      }
      transformRef.current.x += e.clientX - lastMouseRef.current.x;
      transformRef.current.y += e.clientY - lastMouseRef.current.y;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
      queueRender();
    };

    const onMouseUp = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      const distance = Math.hypot(e.clientX - dragStartRef.current.x, e.clientY - dragStartRef.current.y);
      if (distance < 5) handleClick(e.clientX, e.clientY);
    };

    const onMouseLeave = () => {
      if (hoverRef.current) {
        hoverRef.current = null;
        queueRender();
      }
    };

    // The overview is static, so the wheel keeps scrolling the page there.
    const onWheel = (e: WheelEvent) => {
      if (!detail) return;
      e.preventDefault();
      cancelAnimation();
      const t = transformRef.current;
      const newScale = Math.max(0.3, Math.min(t.scale * (1 - e.deltaY * 0.003), 4));
      t.x *= newScale / t.scale;
      t.y *= newScale / t.scale;
      t.scale = newScale;
      queueRender();
    };

    // Touch
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      if (detail) cancelAnimation();
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      lastMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || !detail || e.touches.length !== 1) return;
      e.preventDefault();
      transformRef.current.x += e.touches[0].clientX - lastMouseRef.current.x;
      transformRef.current.y += e.touches[0].clientY - lastMouseRef.current.y;
      lastMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      queueRender();
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      if (e.changedTouches.length !== 1) return;
      const distance = Math.hypot(
        e.changedTouches[0].clientX - dragStartRef.current.x,
        e.changedTouches[0].clientY - dragStartRef.current.y,
      );
      if (distance < 10) {
        // Prevent the synthetic mouse events from firing a second click.
        e.preventDefault();
        handleClick(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      }
    };

    canvas.style.cursor = detail ? "grab" : "default";

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mouseleave", onMouseLeave);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("mouseleave", onMouseLeave);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, [isDetail, cancelAnimation, getWorldCoords, blockAt, handleClick, queueRender]);

  /* ---------- initial render + resize ---------- */

  useEffect(() => {
    transformRef.current = overviewTransform();
    render();

    const onResize = () => {
      if (animIdRef.current) return;
      if (activeRef.current === null || detailRef.current === 0) {
        transformRef.current = overviewTransform();
      }
      queueRender();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [render, queueRender, overviewTransform]);

  /* ---------- zoom buttons ---------- */

  const zoomBy = useCallback(
    (factor: number) => {
      cancelAnimation();
      const t = transformRef.current;
      const newScale = Math.max(0.3, Math.min(t.scale * factor, 4));
      t.x *= newScale / t.scale;
      t.y *= newScale / t.scale;
      t.scale = newScale;
      queueRender();
    },
    [cancelAnimation, queueRender],
  );

  const activeMeta = SECTIONS.find((s) => s.key === activeSection);

  /* ---------- JSX ---------- */

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-2xl overflow-hidden border border-line bg-white shadow-sm"
      style={{ height: "clamp(320px, 55vh, 540px)" }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && activeSection) backToOverview();
      }}
    >
      {activeMeta ? (
        <>
          {/* Back to the schematic hall */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
            <button
              type="button"
              onClick={backToOverview}
              className="flex items-center gap-1.5 bg-white/95 shadow-md border border-gray-200 rounded-full pl-2.5 pr-3.5 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50 backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#AD891C]"
            >
              <ArrowLeft size={14} aria-hidden="true" />
              {labels?.backToHall ?? "Cała sala"}
            </button>
            <span className="bg-white/95 shadow-md border border-gray-200 rounded-full px-3 py-1.5 text-xs font-semibold text-gray-800 backdrop-blur-md">
              {activeMeta.label} · <span className="text-gray-500 font-medium">{activeMeta.price}</span>
            </span>
          </div>

          {/* Zoom Controls */}
          <div className="absolute top-3 right-3 z-10 flex flex-col gap-1 bg-white/95 shadow-md border border-gray-200 rounded-lg p-1 backdrop-blur-md">
            <button
              type="button"
              onClick={() => zoomBy(1.3)}
              className="w-8 h-8 flex items-center justify-center text-gray-700 hover:bg-gray-100 hover:text-black rounded text-lg font-medium transition-colors"
              title={labels?.zoomIn ?? "Przybliż"}
              aria-label={labels?.zoomIn ?? "Przybliż"}
            >
              +
            </button>
            <div className="w-full h-px bg-gray-200" />
            <button
              type="button"
              onClick={() => zoomBy(1 / 1.3)}
              className="w-8 h-8 flex items-center justify-center text-gray-700 hover:bg-gray-100 hover:text-black rounded text-lg font-medium transition-colors"
              title={labels?.zoomOut ?? "Oddal"}
              aria-label={labels?.zoomOut ?? "Oddal"}
            >
              −
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 bg-white/95 shadow-md border border-gray-200 rounded-full px-3.5 py-1.5 text-xs font-medium text-gray-700 backdrop-blur-md whitespace-nowrap pointer-events-none">
            {labels?.pickSectorHint ?? "Wybierz sektor, aby zobaczyć miejsca"}
          </p>

          {/* Keyboard / screen reader access to the canvas blocks */}
          <ul className="sr-only">
            {SECTIONS.map((sec) => (
              <li key={sec.key}>
                <button type="button" onClick={() => openSection(sec.key)}>
                  {sec.label}, {sec.price}
                  {selectedBySection.get(sec.key) ? `, wybrano ${selectedBySection.get(sec.key)}` : ""}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className={`block w-full h-full outline-none select-none ${activeMeta ? "touch-none" : "touch-pan-y"}`}
      />

      {/* Stage label rides with the canvas transform. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 z-[6] flex items-center gap-2 text-white"
        ref={stageLabelRef}
        style={{ opacity: 0 }}
      >
        <Theater size={15} strokeWidth={1.8} />
        <span className="text-[12px] font-semibold tracking-[0.12em] uppercase">
          {labels?.stage ?? "SCENA"}
        </span>
      </div>
    </div>
  );
}
