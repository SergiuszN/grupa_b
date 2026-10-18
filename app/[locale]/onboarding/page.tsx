import { Ban, Footprints, Palette, type LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { FlowArrows, FlowSteps, INFO_FLOW } from "@/components/flow/flow-nav";
import { Screen } from "@/components/flow/screen";

const TIPS: { key: string; Icon: LucideIcon }[] = [
  { key: "1", Icon: Palette },
  { key: "2", Icon: Footprints },
  { key: "3", Icon: Ban },
];

export default async function Onboarding() {
  const t = await getTranslations("Onboarding");

  return (
    <Screen>
      <FlowSteps items={INFO_FLOW} step={0} />

      <div className="flex flex-1 flex-col gap-4 px-6 pt-3">
        <div>
          <h1
            className="text-[2rem] leading-9 font-bold tracking-[-0.03em]"
            data-flow="title"
          >
            {t("title")}
          </h1>
          <p
            className="text-muted mt-2 text-[0.9375rem] leading-[1.375rem]"
            data-flow="copy"
          >
            {t("subtitle")}
          </p>
        </div>

        <div
          className="min-h-[220px] flex-1 rounded-[20px] bg-[#E7E2D8] bg-cover bg-[50%]"
          data-flow="media"
          style={{ backgroundImage: "url(/images/hall-symphonic.jpg)" }}
        />

        <div className="bg-surface rounded-[20px] px-[18px] py-4" data-flow="copy">
          {TIPS.map(({ key, Icon }, index) => (
            <div key={key}>
              <div
                className={`flex gap-3.5 ${
                  index === 0
                    ? "pb-3"
                    : index === TIPS.length - 1
                      ? "pt-3"
                      : "py-3"
                }`}
              >
                <Icon
                  aria-hidden="true"
                  className="text-gold-deep mt-0.5 w-5 shrink-0"
                  size={18}
                  strokeWidth={1.7}
                />
                <div className="flex flex-col gap-0.5">
                  <p className="text-[0.875rem] leading-[1.125rem] font-bold text-ink">
                    {t(`tip${key}Title` as never)}
                  </p>
                  <p className="text-muted text-[0.8125rem] leading-[1.0625rem]">
                    {t(`tip${key}Text` as never)}
                  </p>
                </div>
              </div>
              {index < TIPS.length - 1 ? (
                <div className="bg-line h-px w-full" />
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <FlowArrows items={INFO_FLOW} step={0} />
    </Screen>
  );
}
