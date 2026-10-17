"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { gsap } from "gsap";
import { PersonStanding } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { prefersStillMotion } from "@/lib/motion";

const DURATION = 2;

export default function Matching() {
  const t = useTranslations("Matching");
  const router = useRouter();
  const markRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const peopleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const still = prefersStillMotion();
    const mark = markRef.current;
    const bar = barRef.current;
    const tweens: gsap.core.Tween[] = [];

    if (bar) {
      gsap.set(bar, { scaleX: 0, transformOrigin: "0% 50%" });
      tweens.push(
        gsap.to(bar, {
          scaleX: 1,
          duration: still ? 0.01 : DURATION,
          ease: "power1.inOut",
        }),
      );
    }

    if (mark && !still) {
      tweens.push(
        gsap.fromTo(
          mark,
          { scale: 1.38, autoAlpha: 0 },
          { scale: 1.5, autoAlpha: 1, duration: 0.6, ease: "power3.out" },
        ),
      );
      tweens.push(
        gsap.to(mark, {
          scale: 1.56,
          duration: 2,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          delay: 0.6,
        }),
      );
    } else if (mark) {
      gsap.set(mark, { scale: 1.5 });
    }

    const peopleGroup = peopleRef.current;
    if (peopleGroup && !still) {
      const people = peopleGroup.querySelectorAll("[data-person]");

      tweens.push(
        gsap.fromTo(
          people,
          { y: 18, autoAlpha: 0, scale: 0.85 },
          {
            y: 0,
            autoAlpha: 1,
            scale: 1,
            duration: 0.55,
            stagger: 0.09,
            ease: "back.out(2)",
          },
        ),
      );

      people.forEach((node, index) => {
        tweens.push(
          gsap.to(node, {
            y: index === 1 ? -6 : -3,
            duration: 1.6,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
            delay: 0.7 + index * 0.15,
          }),
        );
      });
    }

    const id = window.setTimeout(
      () => router.replace("/swipe"),
      still ? 600 : DURATION * 1000 + 120,
    );

    return () => {
      window.clearTimeout(id);
      tweens.forEach((tween) => tween.kill());
      if (mark) gsap.set(mark, { clearProps: "transform,opacity,visibility" });
    };
  }, [router]);

  return (
    <main className="bg-paper text-ink flex min-h-dvh flex-col items-center justify-center overflow-clip px-6">
      <div className="flex flex-col items-center gap-9">
        <div
          aria-hidden="true"
          className="text-ink/15 flex items-end gap-3"
          ref={peopleRef}
        >
          <PersonStanding data-person size={56} strokeWidth={1.1} />
          <PersonStanding
            className="text-gold"
            data-person
            size={78}
            strokeWidth={1.1}
          />
          <PersonStanding data-person size={56} strokeWidth={1.1} />
        </div>

        <div ref={markRef}>
          <Logo />
        </div>

        <div className="flex flex-col items-center gap-3">
          <p
            aria-live="polite"
            className="text-caption text-gold-deep font-medium tracking-[0.18em] uppercase"
          >
            {t("title")}
          </p>
          <div
            aria-hidden="true"
            className="bg-ink/10 h-[3px] w-[168px] overflow-hidden rounded-full"
          >
            <div className="bg-gold h-full w-full rounded-full" ref={barRef} />
          </div>
        </div>
      </div>
    </main>
  );
}
