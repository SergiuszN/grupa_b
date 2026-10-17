import { Link } from "@/i18n/routing";
import { AudioWaveform } from "lucide-react";
import { HeroGallery } from "@/components/landing/hero-gallery";
import { HeroMotion } from "@/components/landing/hero-motion";
import { SiteHeader } from "@/components/landing/site-header";
import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Landing");

  return (
    <main
      data-hero-root
      id="main-content"
      tabIndex={-1}
      className="bg-ink relative flex min-h-dvh flex-col overflow-clip focus:outline-none"
    >
      <HeroMotion />
      <HeroGallery />
      <div aria-hidden="true" data-anim="scrim" className="hero-scrim absolute inset-0" />

      <div className="relative z-10 mx-auto flex w-full max-w-[1100px] flex-1 flex-col">
        <SiteHeader />

        <div className="flex-1" />

        <section className="w-full px-6 pb-[calc(env(safe-area-inset-bottom)+36px)] md:pb-16">
          <div className="md:max-w-[760px]">
            <h1 className="text-hero md:text-[64px] md:leading-[66px] font-bold">
              <span className="-mb-[0.12em] block overflow-hidden pb-[0.12em]">
                <span className="block" data-anim="line">
                  {t("headline1")}
                </span>
              </span>
              <span className="-mb-[0.12em] block overflow-hidden pb-[0.12em]">
                <span className="block" data-anim="line">
                  {t("headline2")}
                </span>
              </span>
            </h1>

            <p
              className="text-body md:text-[17px] md:leading-[26px] mt-3.5 max-w-[342px] font-medium md:mt-5 md:max-w-[460px]"
              data-anim="copy"
            >
              {t("promise")}
            </p>

            <div className="mt-7 flex gap-2.5 md:mt-9" data-anim="copy">
              <Link
                aria-label={t("voice")}
                className="border-paper/50 text-paper hover:bg-paper/10 focus-visible:outline-paper flex size-14 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-4"
                href="/voice"
              >
                <AudioWaveform aria-hidden="true" size={22} strokeWidth={1.7} />
              </Link>

              <Link
                className="bg-gold hover:bg-gold-deep focus-visible:outline-paper flex h-14 flex-1 items-center justify-center gap-2.5 rounded-full text-base font-bold text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-4"
                href="/start"
              >
                {t("cta")}
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
