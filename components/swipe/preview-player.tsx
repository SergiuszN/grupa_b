"use client";

import { useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

const BARS = [
  18, 34, 52, 76, 44, 62, 88, 50, 30, 68, 92, 58, 40, 74, 54, 26, 46, 82, 64,
  36, 50, 86, 70, 32, 60, 94, 48, 66, 38, 78, 56, 42, 72, 52, 84, 34, 62, 46,
  76, 58, 30, 68, 44, 24,
];

export function PreviewPlayer({
  src,
  label,
  pauseLabel,
}: {
  src: string;
  label: string;
  pauseLabel: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0.55;
    if (audio.paused) void audio.play().catch(() => setPlaying(false));
    else audio.pause();
  }

  return (
    <div className="border-line flex items-center gap-3 rounded-full border py-1.5 pr-4 pl-1.5">
      <button
        aria-label={playing ? pauseLabel : label}
        className="bg-gold focus-visible:outline-ink flex size-9 shrink-0 items-center justify-center rounded-full text-white transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-95"
        onClick={toggle}
        type="button"
      >
        {playing ? (
          <Pause aria-hidden="true" fill="currentColor" size={13} strokeWidth={0} />
        ) : (
          <Play
            aria-hidden="true"
            className="translate-x-px"
            fill="currentColor"
            size={13}
            strokeWidth={0}
          />
        )}
      </button>

      <div className="flex h-6 flex-1 items-center gap-[3px]">
        {BARS.map((height, index) => (
          <span
            className={`w-[3px] flex-1 rounded-full transition-colors duration-150 ${
              index / BARS.length <= progress ? "bg-gold" : "bg-line"
            }`}
            key={index}
            style={{ height: `${height}%` }}
          />
        ))}
      </div>

      <audio
        onEnded={() => {
          setPlaying(false);
          setProgress(0);
        }}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
        onTimeUpdate={(event) => {
          const audio = event.currentTarget;
          setProgress(audio.duration ? audio.currentTime / audio.duration : 0);
        }}
        preload="auto"
        ref={audioRef}
        src={src}
      />
    </div>
  );
}
