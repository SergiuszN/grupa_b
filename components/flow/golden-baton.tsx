"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type Tone = "dark" | "light";

export function GoldenBaton({ tone = "light" }: { tone?: Tone }) {
  const containerRef = useRef<HTMLButtonElement>(null);
  const wandRef = useRef<SVGSVGElement>(null);
  const [conductCount, setConductCount] = useState(0);
  const [showApplause, setShowApplause] = useState(false);
  const [sparkles, setSparkles] = useState<
    Array<{ id: number; x: number; y: number; char: string }>
  >([]);

  // Physics state
  const targetRotation = useRef(0); // Resting angle relative to natural 45deg tilt
  const currentRotation = useRef(0);
  const velocity = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastChimeTime = useRef(0);
  const sparkIdCounter = useRef(0);

  // Initialize Web Audio safely on first user gesture
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

  // Play magical orchestral chime / harp note
  const playChime = useCallback(
    (noteIndex?: number) => {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        // Pentatonic orchestral chord in A major (Karłowicz overture tuning)
        const notes = [440, 554.37, 659.25, 830.61, 880, 1108.73];
        const freq =
          notes[
            typeof noteIndex === "number"
              ? noteIndex % notes.length
              : Math.floor(Math.random() * notes.length)
          ];

        // Primary bell oscillator
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Overtone harmonic
        const harmonic = ctx.createOscillator();
        const harmonicGain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);

        harmonic.type = "triangle";
        harmonic.frequency.setValueAtTime(freq * 2, now);

        // Envelope: instant chime attack with lush exponential decay
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

        harmonicGain.gain.setValueAtTime(0, now);
        harmonicGain.gain.linearRampToValueAtTime(0.08, now + 0.01);
        harmonicGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

        osc.connect(gain);
        harmonic.connect(harmonicGain);
        gain.connect(ctx.destination);
        harmonicGain.connect(ctx.destination);

        osc.start(now);
        harmonic.start(now);
        osc.stop(now + 1.25);
        harmonic.stop(now + 0.85);
      } catch {
        // Audio error handling without throwing
      }
    },
    [getAudioContext],
  );

  // Play tutti orchestra flourish when maestro hits 4 beats
  const playMaestroFanfare = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const chords = [440, 554.37, 659.25, 880];
      chords.forEach((_, idx) => {
        setTimeout(() => playChime(idx), idx * 80);
      });
    } catch {
      // Ignored
    }
  }, [getAudioContext, playChime]);

  // Trigger conduct downbeat
  const conduct = useCallback(() => {
    const nextCount = conductCount + 1;
    setConductCount(nextCount);

    // Conduct flick impulse in spring physics
    velocity.current = 28;
    playChime(nextCount);

    // Spawn musical sparkle particles
    const notesChars = ["♩", "♪", "♫", "✨", "𝄞"];
    const char = notesChars[Math.floor(Math.random() * notesChars.length)];
    const newSpark = {
      id: ++sparkIdCounter.current,
      x: Math.random() * 24 - 12,
      y: -24 - Math.random() * 16,
      char,
    };
    setSparkles((prev) => [...prev.slice(-4), newSpark]);

    // Easter egg: 4 beats conducts a bar -> Bravo Maestro!
    if (nextCount % 4 === 0) {
      playMaestroFanfare();
      setShowApplause(true);
      setTimeout(() => setShowApplause(false), 2400);
    }
  }, [conductCount, playChime, playMaestroFanfare]);

  // Handle Gyroscope & Device Tilt with spring physics
  useEffect(() => {
    let animFrame: number;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null) {
        // gamma: left-to-right tilt in degrees [-90, 90]
        const tilt = Math.max(-40, Math.min(40, e.gamma));
        targetRotation.current = tilt * 0.75;

        // Sound chime on energetic tilt crossings
        const now = Date.now();
        if (Math.abs(e.gamma) > 24 && now - lastChimeTime.current > 400) {
          lastChimeTime.current = now;
          playChime();
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Desktop fallback: baton tilts smoothly with cursor position across window
      const normalizedX = (e.clientX / window.innerWidth) * 2 - 1; // [-1, 1]
      targetRotation.current = normalizedX * 24;
    };

    window.addEventListener("deviceorientation", handleOrientation);
    window.addEventListener("mousemove", handleMouseMove);

    // Physics render loop
    const tick = () => {
      const k = 0.12; // Spring stiffness
      const damping = 0.82; // Friction

      const displacement = targetRotation.current - currentRotation.current;
      velocity.current = (velocity.current + displacement * k) * damping;
      currentRotation.current += velocity.current;

      if (wandRef.current) {
        wandRef.current.style.transform = `rotate(${currentRotation.current}deg)`;
      }

      animFrame = requestAnimationFrame(tick);
    };

    animFrame = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animFrame);
    };
  }, [playChime]);

  // Request gyroscope permission on iOS 13+ devices
  const requestGyroPermission = async () => {
    const DeviceOrientation = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<"granted" | "denied">;
    };
    if (typeof DeviceOrientation?.requestPermission === "function") {
      try {
        await DeviceOrientation.requestPermission();
      } catch {
        // Ignore user cancellation
      }
    }
  };

  const glowFilter =
    tone === "dark"
      ? "drop-shadow(0 0 10px rgba(173,137,28,0.85)) drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
      : "drop-shadow(0 2px 6px rgba(173,137,28,0.5)) drop-shadow(0 1px 2px rgba(0,0,0,0.15))";

  return (
    <div className="relative inline-flex items-center">
      <button
        aria-label="Złota Batuta Dyrygenta (Easter Egg)"
        className={`group relative flex size-11 items-center justify-center rounded-full transition-transform hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold cursor-pointer select-none ${
          tone === "dark" ? "hover:bg-paper/10" : "hover:bg-black/5"
        }`}
        onClick={() => {
          requestGyroPermission();
          conduct();
        }}
        ref={containerRef}
        title="Złota batuta Filharmonii — dotknij lub przechyl telefon!"
        type="button"
      >
        <svg
          aria-hidden="true"
          className="size-9 origin-bottom-left transition-transform ease-out"
          fill="none"
          ref={wandRef}
          style={{
            filter: glowFilter,
            transform: "rotate(0deg)",
            transformOrigin: "8px 36px",
          }}
          viewBox="0 0 44 44"
        >
          <defs>
            {/* Rich gold metallic gradient */}
            <linearGradient id="goldShaft44" x1="0" x2="1" y1="1" y2="0">
              <stop offset="0%" stopColor="#8F7017" />
              <stop offset="25%" stopColor="#AD891C" />
              <stop offset="50%" stopColor="#FFF2D6" />
              <stop offset="75%" stopColor="#E5C868" />
              <stop offset="100%" stopColor="#AD891C" />
            </linearGradient>

            {/* Handle gradient */}
            <linearGradient id="batonHandle44" x1="0" x2="1" y1="1" y2="0">
              <stop offset="0%" stopColor="#1A1815" />
              <stop offset="45%" stopColor="#3E3A33" />
              <stop offset="85%" stopColor="#8F7017" />
              <stop offset="100%" stopColor="#AD891C" />
            </linearGradient>

            {/* Pearl tip glow */}
            <radialGradient id="tipGlow44" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="60%" stopColor="#FFF2D6" />
              <stop offset="85%" stopColor="#AD891C" />
              <stop offset="100%" stopColor="#8F7017" />
            </radialGradient>
          </defs>

          {/* Conductors Baton Handle (Ergonomic grip at bottom-left) */}
          <path
            d="M5 38 C4 39.5 6 41 8 40.5 C10.5 39.5 11 36.5 9.5 34.5 C8.5 33.5 6 35.5 5 38 Z"
            fill="url(#batonHandle44)"
            stroke="#AD891C"
            strokeWidth="0.8"
          />

          {/* Gold Collar band */}
          <ellipse
            cx="10"
            cy="34"
            fill="#FFF2D6"
            rx="1.6"
            ry="1.1"
            stroke="#8F7017"
            strokeWidth="0.5"
            transform="rotate(-45 10 34)"
          />

          {/* Tapering Gold Shaft (Tilted gracefully from 10,34 to 37,7) */}
          <polygon
            fill="url(#goldShaft44)"
            points="9.2,34.8 10.8,33.2 37.8,6.8 36.8,5.8"
            stroke="#8F7017"
            strokeWidth="0.4"
          />

          {/* Glowing Luminous Tip */}
          <circle cx="37.4" cy="6.2" fill="url(#tipGlow44)" r="2.2" />

          {/* Sparkle glint on tip */}
          <path
            d="M37.4 3 L37.4 9.4 M34.2 6.2 L40.6 6.2"
            opacity="0.8"
            stroke="#FFFFFF"
            strokeLinecap="round"
            strokeWidth="0.8"
          />
        </svg>

        {/* Floating animated sparkles on conduct */}
        {sparkles.map((sp) => (
          <span
            className="pointer-events-none absolute text-[13px] font-bold text-gold animate-bounce"
            key={sp.id}
            style={{
              left: `calc(50% + ${sp.x}px)`,
              top: `${sp.y}px`,
              animationDuration: "0.75s",
              textShadow: "0 0 8px rgba(173,137,28,0.9)",
            }}
          >
            {sp.char}
          </span>
        ))}
      </button>

      {/* Maestro celebration tooltip */}
      {showApplause ? (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 whitespace-nowrap rounded-full bg-gold px-3 py-1 text-[11px] font-bold text-white shadow-xl animate-in fade-in zoom-in-95 duration-200">
          <span>🎼</span>
          <span>Maestro!</span>
        </div>
      ) : null}
    </div>
  );
}
