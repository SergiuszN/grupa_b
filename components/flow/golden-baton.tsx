"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type Tone = "dark" | "light";

interface GlidingBatonProps {
  tone?: Tone;
  stepCount?: number;
}

export function GlidingBaton({ tone = "light", stepCount = 9 }: { tone?: Tone; stepCount?: number }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const batonRef = useRef<HTMLDivElement>(null);

  // Physics state
  const posX = useRef<number>(12); // Start on the left side
  const velX = useRef<number>(0);
  const tiltAngle = useRef<number>(-35); // Start tilted
  const gravityAcc = useRef<number>(0);
  const isDragging = useRef<boolean>(false);
  const dragStartX = useRef<number>(0);
  const dragStartPosX = useRef<number>(0);
  const lastCrossedDot = useRef<number>(-1);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const [sparkles, setSparkles] = useState<
    Array<{ id: number; offset: number; y: number; char: string }>
  >([]);
  const sparkIdCounter = useRef(0);

  // Safe Web Audio API synthesizer
  const getAudioContext = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!audioCtxRef.current) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current?.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // Play delicate harp chime for step dots or bounces
  const playNote = useCallback(
    (index: number) => {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        // Pentatonic scale in A major
        const scale = [440, 493.88, 554.37, 659.25, 739.99, 880, 987.77, 1108.73, 1318.51];
        const freq = scale[Math.max(0, Math.min(scale.length - 1, index))];

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.65);
      } catch {
        // Audio error handling
      }
    },
    [getAudioContext],
  );

  // Spawn visual sparkle
  const spawnSparkle = useCallback(() => {
    const chars = ["♩", "♪", "♫", "✨"];
    const char = chars[Math.floor(Math.random() * chars.length)];
    const spark = {
      id: ++sparkIdCounter.current,
      offset: Math.random() * 16 - 8,
      y: -20 - Math.random() * 12,
      char,
    };
    setSparkles((prev) => [...prev.slice(-3), spark]);
  }, []);

  // Physics animation loop & Gyroscope / Mouse listeners
  useEffect(() => {
    let animId: number;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null && !isDragging.current) {
        // gamma: left-to-right tilt in degrees [-90, 90]
        const clamped = Math.max(-45, Math.min(45, e.gamma));
        // Tilt creates horizontal gravity acceleration
        gravityAcc.current = (clamped / 45) * 0.95;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current || !trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const diff = e.clientX - centerX;
      // Mouse position gently pulls gravity towards cursor
      const normalized = Math.max(-1, Math.min(1, diff / (window.innerWidth / 2)));
      gravityAcc.current = normalized * 0.55;
    };

    window.addEventListener("deviceorientation", handleOrientation);
    window.addEventListener("mousemove", handleMouseMove);

    // Physics render loop
    const updatePhysics = () => {
      if (!isDragging.current && trackRef.current) {
        const trackWidth = trackRef.current.clientWidth;
        const batonWidth = 36;
        const minX = 4;
        const maxX = Math.max(minX, trackWidth - batonWidth - 4);

        // Apply acceleration from tilt
        velX.current += gravityAcc.current;
        // Damping / friction (glides smoothly like on ice)
        velX.current *= 0.93;

        posX.current += velX.current;

        // Bounce off left/right edges with restitution
        if (posX.current <= minX) {
          posX.current = minX;
          if (Math.abs(velX.current) > 1.2) {
            playNote(0);
          }
          velX.current = -velX.current * 0.42;
        } else if (posX.current >= maxX) {
          posX.current = maxX;
          if (Math.abs(velX.current) > 1.2) {
            playNote(stepCount - 1);
          }
          velX.current = -velX.current * 0.42;
        }

        // Tilted angle sways dynamically with velocity
        // Resting tilt is -35deg, leaning into movement
        const dynamicTilt = -35 + velX.current * 3.5;
        tiltAngle.current += (dynamicTilt - tiltAngle.current) * 0.15;

        // Check if baton crossed a step dot along the track
        if (maxX > minX && stepCount > 1) {
          const progress = (posX.current - minX) / (maxX - minX);
          const currentDot = Math.round(progress * (stepCount - 1));

          if (currentDot !== lastCrossedDot.current && Math.abs(velX.current) > 0.8) {
            lastCrossedDot.current = currentDot;
            playNote(currentDot);
            spawnSparkle();
          }
        }

        // Update DOM transform directly for 60fps smoothness
        if (batonRef.current) {
          batonRef.current.style.transform = `translateX(${posX.current}px) rotate(${tiltAngle.current}deg)`;
        }
      }

      animId = requestAnimationFrame(updatePhysics);
    };

    animId = requestAnimationFrame(updatePhysics);

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, [playNote, spawnSparkle, stepCount]);

  // Pointer drag support (works for touch drag and mouse drag)
  const onPointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartPosX.current = posX.current;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    // Play initial chime on touch
    playNote(Math.floor(Math.random() * stepCount));
    spawnSparkle();

    // Request iOS orientation permission if needed
    const DeviceOrientation = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<"granted" | "denied">;
    };
    if (typeof DeviceOrientation?.requestPermission === "function") {
      DeviceOrientation.requestPermission().catch(() => {});
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !trackRef.current) return;
    const delta = e.clientX - dragStartX.current;
    const trackWidth = trackRef.current.clientWidth;
    const batonWidth = 36;
    const minX = 4;
    const maxX = Math.max(minX, trackWidth - batonWidth - 4);

    const newX = Math.max(minX, Math.min(maxX, dragStartPosX.current + delta));
    velX.current = newX - posX.current;
    posX.current = newX;

    if (batonRef.current) {
      batonRef.current.style.transform = `translateX(${posX.current}px) rotate(${tiltAngle.current}deg)`;
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignored
    }
  };

  const glowFilter =
    tone === "dark"
      ? "drop-shadow(0 0 8px rgba(173,137,28,0.9)) drop-shadow(0 2px 4px rgba(0,0,0,0.6))"
      : "drop-shadow(0 2px 5px rgba(173,137,28,0.55)) drop-shadow(0 1px 2px rgba(0,0,0,0.2))";

  return (
    <div
      className="pointer-events-none absolute inset-x-0 -top-3 z-30 h-10 select-none"
      ref={trackRef}
    >
      {/* Gliding Baton (pointer-events enabled on baton itself) */}
      <div
        aria-label="Złota Batuta Dyrygenta — przechyl telefon, by popłynęła!"
        className="pointer-events-auto absolute top-0 left-0 cursor-grab touch-none active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        ref={batonRef}
        role="button"
        style={{
          transform: "translateX(12px) rotate(-35deg)",
          transformOrigin: "8px 30px",
          willChange: "transform",
        }}
        tabIndex={0}
        title="Przechyl telefon w lewo lub prawo, by batuta płynęła wzdłuż nawigacji!"
      >
        <svg
          aria-hidden="true"
          className="size-9"
          fill="none"
          style={{ filter: glowFilter }}
          viewBox="0 0 36 36"
        >
          <defs>
            <linearGradient id="wandShaft" x1="0" x2="1" y1="1" y2="0">
              <stop offset="0%" stopColor="#8F7017" />
              <stop offset="30%" stopColor="#F3EBD6" />
              <stop offset="60%" stopColor="#AD891C" />
              <stop offset="100%" stopColor="#FFF4D9" />
            </linearGradient>

            <linearGradient id="wandGrip" x1="0" x2="1" y1="1" y2="0">
              <stop offset="0%" stopColor="#111111" />
              <stop offset="50%" stopColor="#3E3A33" />
              <stop offset="100%" stopColor="#AD891C" />
            </linearGradient>

            <radialGradient id="wandTip" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="65%" stopColor="#AD891C" />
              <stop offset="100%" stopColor="#8F7017" />
            </radialGradient>
          </defs>

          {/* Ergonomic Baton Handle at base */}
          <path
            d="M4 31 C3 32.5 5 34 7 33.5 C9 32.5 9.5 30 8.5 28.5 C7.5 27.5 5 29.5 4 31 Z"
            fill="url(#wandGrip)"
            stroke="#AD891C"
            strokeWidth="0.75"
          />

          {/* Gold Collar */}
          <ellipse
            cx="8.5"
            cy="28"
            fill="#FFF4D9"
            rx="1.4"
            ry="0.9"
            stroke="#8F7017"
            strokeWidth="0.4"
            transform="rotate(-45 8.5 28)"
          />

          {/* Slender Tapering Gold Wand (pointing up-right) */}
          <polygon
            fill="url(#wandShaft)"
            points="7.8,28.6 9.2,27.4 31.4,5.4 30.6,4.6"
            stroke="#8F7017"
            strokeWidth="0.3"
          />

          {/* Luminous Pearl Tip */}
          <circle cx="31.2" cy="4.8" fill="url(#wandTip)" r="2" />

          {/* Light Glint Star */}
          <path
            d="M31.2 2 L31.2 7.6 M28.4 4.8 L34 4.8"
            opacity="0.85"
            stroke="#FFFFFF"
            strokeLinecap="round"
            strokeWidth="0.75"
          />
        </svg>

        {/* Floating Sparkles when gliding past dots */}
        {sparkles.map((sp) => (
          <span
            className="pointer-events-none absolute text-[12px] font-bold text-gold animate-bounce"
            key={sp.id}
            style={{
              left: `calc(50% + ${sp.offset}px)`,
              top: `${sp.y}px`,
              animationDuration: "0.6s",
              textShadow: "0 0 6px rgba(173,137,28,0.9)",
            }}
          >
            {sp.char}
          </span>
        ))}
      </div>
    </div>
  );
}

// Export as GoldenBaton for backwards compatibility
export const GoldenBaton = GlidingBaton;
