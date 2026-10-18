import { AudioWaveform, ArrowRight } from "lucide-react";
import { CtaButton } from "@/components/ui";
import { HeroGallery } from "@/components/landing/hero-gallery";
import { StringPlayground } from "@/components/landing/string-playground";
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
      <StringPlayground />
      <div aria-hidden="true" data-anim="scrim" className="hero-scrim absolute inset-0" />

      <div className="relative z-10 mx-auto flex w-full max-w-[1100px] flex-1 flex-col">
        <SiteHeader />

        <div className="flex-1" />

        <section className="w-full px-6 pb-[calc(env(safe-area-inset-bottom)+36px)] md:pb-16">
          <div className="md:max-w-[760px]">
            <h1 className="text-hero md:text-[4rem] md:leading-[4.125rem] font-bold">
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
              className="text-body md:text-[1.0625rem] md:leading-[1.625rem] mt-3.5 max-w-[342px] font-medium md:mt-5 md:max-w-[460px]"
              data-anim="copy"
            >
              {t("promise")}
            </p>

            <div className="mt-7 flex gap-2.5 md:mt-9" data-anim="copy">
              <CtaButton
                aria-label={t("voice")}
                href="/voice"
                iconLeft={<AudioWaveform aria-hidden="true" size={22} strokeWidth={1.7} />}
                size="icon"
                tone="dark"
                variant="outline"
              />

              <CtaButton
                className="text-base"
                data-cta=""
                flex1
                href="/start"
                iconRight={<ArrowRight aria-hidden="true" size={18} strokeWidth={2} />}
                tone="dark"
                variant="primary"
              >
                {t("cta")}
              </CtaButton>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
