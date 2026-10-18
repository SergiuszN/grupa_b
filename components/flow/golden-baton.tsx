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
  const targetRotation = useRef(-32); // Default resting tilt: -32deg
  const currentRotation = useRef(-32);
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
        gain.gain.linearRampToValueAtTime(0.18, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

        harmonicGain.gain.setValueAtTime(0, now);
        harmonicGain.gain.linearRampToValueAtTime(0.06, now + 0.01);
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
      chords.forEach((freq, idx) => {
        setTimeout(() => playChime(idx), idx * 75);
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
    velocity.current = 36;
    playChime(nextCount);

    // Spawn musical sparkle particles
    const notesChars = ["♩", "♪", "♫", "✨", "𝄞"];
    const char = notesChars[Math.floor(Math.random() * notesChars.length)];
    const newSpark = {
      id: ++sparkIdCounter.current,
      x: Math.random() * 20 - 10,
      y: -28 - Math.random() * 15,
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
        const tilt = Math.max(-45, Math.min(45, e.gamma));
        targetRotation.current = -32 + tilt * 0.85;

        // Sound chime on energetic tilt crossings
        const now = Date.now();
        if (Math.abs(e.gamma) > 22 && now - lastChimeTime.current > 400) {
          lastChimeTime.current = now;
          playChime();
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Desktop fallback: baton tilts smoothly with cursor position across window
      const normalizedX = (e.clientX / window.innerWidth) * 2 - 1; // [-1, 1]
      targetRotation.current = -32 + normalizedX * 28;
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
      ? "drop-shadow(0 0 8px rgba(173,137,28,0.75))"
      : "drop-shadow(0 1px 3px rgba(0,0,0,0.18))";

  return (
    <div className="relative inline-flex items-center">
      <button
        aria-label="Złota Batuta Dyrygenta (Easter Egg)"
        className="group relative flex size-9 items-center justify-center rounded-full transition-transform hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold cursor-pointer select-none"
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
          className="size-8 origin-bottom-left transition-transform ease-out"
          fill="none"
          ref={wandRef}
          style={{
            filter: glowFilter,
            transform: "rotate(-32deg)",
            transformOrigin: "4px 28px",
          }}
          viewBox="0 0 32 32"
        >
          <defs>
            {/* Rich gold metallic gradient */}
            <linearGradient id="goldShaft" x1="0" x2="1" y1="1" y2="0">
              <stop offset="0%" stopColor="#8F7017" />
              <stop offset="35%" stopColor="#F3EBD6" />
              <stop offset="55%" stopColor="#AD891C" />
              <stop offset="100%" stopColor="#E5C868" />
            </linearGradient>

            {/* Handle gradient */}
            <linearGradient id="batonHandle" x1="0" x2="1" y1="1" y2="0">
              <stop offset="0%" stopColor="#111111" />
              <stop offset="50%" stopColor="#3A3732" />
              <stop offset="100%" stopColor="#8F7017" />
            </linearGradient>

            {/* Pearl tip glow */}
            <radialGradient id="tipGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="70%" stopColor="#AD891C" />
              <stop offset="100%" stopColor="#8F7017" />
            </radialGradient>
          </defs>

          {/* Conductors Baton Handle (Ergonomic grip at bottom) */}
          <path
            d="M3 28 C2.5 29 4 30.5 5.5 30 C7 29 6 26.5 5 25.5 C4.2 24.8 3.5 26.8 3 28 Z"
            fill="url(#batonHandle)"
            stroke="#AD891C"
            strokeWidth="0.5"
          />

          {/* Gold Collar */}
          <ellipse
            cx="5"
            cy="25"
            fill="#AD891C"
            rx="1.2"
            ry="0.8"
            transform="rotate(-45 5 25)"
          />

          {/* Tapering Gold Shaft */}
          <polygon
            fill="url(#goldShaft)"
            points="4.6,24.8 5.6,25.4 27.8,4.2 27.2,3.6"
          />

          {/* Glowing Luminous Tip */}
          <circle cx="27.8" cy="3.8" fill="url(#tipGlow)" r="1.4" />
        </svg>

        {/* Floating animated sparkles on conduct */}
        {sparkles.map((sp) => (
          <span
            className="pointer-events-none absolute text-[12px] font-bold text-gold animate-bounce"
            key={sp.id}
            style={{
              left: `calc(50% + ${sp.x}px)`,
              top: `${sp.y}px`,
              animationDuration: "0.75s",
              textShadow: "0 0 6px rgba(173,137,28,0.8)",
            }}
          >
            {sp.char}
          </span>
        ))}
      </button>

      {/* Maestro celebration tooltip */}
      {showApplause ? (
        <div className="absolute top-10 left-0 z-50 flex items-center gap-1.5 whitespace-nowrap rounded-full bg-gold px-3 py-1 text-[11px] font-bold text-white shadow-lg animate-in fade-in zoom-in-95 duration-200">
          <span>🎼</span>
          <span>Maestro!</span>
        </div>
      ) : null}
    </div>
  );
}
