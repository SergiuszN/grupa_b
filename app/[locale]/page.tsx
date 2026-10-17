import { Link } from "@/i18n/routing";
import { AudioWaveform } from "lucide-react";
import { HeroGallery } from "@/components/landing/hero-gallery";
import { SiteHeader } from "@/components/landing/site-header";

export default function Home() {
  return (
    <main className="bg-ink relative flex min-h-dvh flex-col overflow-clip">
      <HeroGallery />
      <div aria-hidden="true" className="hero-scrim absolute inset-0" />

      <div className="relative z-10 mx-auto flex w-full max-w-[1100px] flex-1 flex-col">
        <SiteHeader />

        <div className="flex-1" />

        <section className="w-full px-6 pb-[calc(env(safe-area-inset-bottom)+36px)] md:pb-16">
          <div className="md:max-w-[760px]">
            <h1 className="rise text-hero md:text-[64px] md:leading-[66px] font-bold">
              Filharmonia
              <br />
              zaczyna się online.
            </h1>

            <p className="rise text-body md:text-[17px] md:leading-[26px] mt-3.5 max-w-[342px] font-medium [animation-delay:90ms] md:mt-5 md:max-w-[460px]">
              Zaczniemy od tego, co lubisz, i pokażemy Ci coś, czego jeszcze nie
              znasz.
            </p>

            <div className="rise mt-7 flex gap-2.5 [animation-delay:180ms] md:mt-9">
              <Link
                aria-label="Porozmawiaj z przewodnikiem"
                className="border-paper/50 text-paper hover:bg-paper/10 focus-visible:outline-paper flex size-14 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-4"
                href="/voice"
              >
                <AudioWaveform aria-hidden="true" size={22} strokeWidth={1.7} />
              </Link>

              <Link
                className="bg-gold hover:bg-gold-deep focus-visible:outline-paper flex h-14 flex-1 items-center justify-center gap-2.5 rounded-full text-base font-bold text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-4"
                href="/start"
              >
                Pierwszy raz?
                <svg
                  aria-hidden="true"
                  fill="none"
                  height="16"
                  viewBox="0 0 16 16"
                  width="16"
                >
                  <path
                    d="M3 8h10M9 4l4 4-4 4"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.6"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
