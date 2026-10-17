import { Link } from "@/i18n/routing";
import { ArrowLeft, Mic } from "lucide-react";
import { Screen } from "@/components/flow/screen";
import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function Voice({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Voice");

  return (
    <Screen>
      <div className="flex flex-1 flex-col items-center justify-center pb-2.5 text-center">
        <p className="text-gold mb-3.5 text-[17px] leading-[22px] font-medium tracking-[0.02em]">
          {t("greeting")}
        </p>

        <h1 className="max-w-[300px] text-[31px] leading-[112%] font-bold tracking-[-0.03em]">
          {t("headline")}
        </h1>

        <p className="text-muted mt-[18px] max-w-[250px] text-[14px] leading-[150%]">
          {t("prompt")}
        </p>

        <div className="relative mt-9 flex size-[190px] items-center justify-center">
          <div className="border-gold-soft absolute inset-0 rounded-full border" />
          <div className="absolute inset-[14px] rounded-full border border-[#E6DDC4]" />
          <div className="bg-gold flex size-[118px] items-center justify-center rounded-full">
            <Mic
              aria-hidden="true"
              className="text-white"
              size={32}
              strokeWidth={1.8}
            />
          </div>
        </div>

        <p className="mt-[22px] text-[12px] leading-4 font-medium tracking-[0.14em]">
          {t("talkCta")}
        </p>
      </div>

      <div className="px-6 pt-2 pb-[calc(env(safe-area-inset-bottom)+20px)]">
        <Link
          className="border-ink text-ink hover:bg-surface focus-visible:outline-gold flex h-14 w-full items-center justify-center gap-2 rounded-full border-[1.5px] text-[15px] leading-5 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-4"
          href="/"
        >
          <ArrowLeft aria-hidden="true" size={18} strokeWidth={1.8} />
          {t("back")}
        </Link>
      </div>
    </Screen>
  );
}
