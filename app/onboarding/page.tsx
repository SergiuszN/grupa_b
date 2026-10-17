import Link from "next/link";
import { FlowArrows, FlowSteps } from "@/components/flow/flow-nav";
import { Screen } from "@/components/flow/screen";

const TIPS = [
  {
    title: "Ciemna paleta",
    text: "Czerń, granat, grafit. Zawsze bezpieczne.",
  },
  {
    title: "Wygodne buty",
    text: "Obcas na wieczór, płaskie do taksówki.",
  },
  {
    title: "Nic ze sportu",
    text: "Klapki i szorty zostają w domu.",
  },
];

export default function Onboarding() {
  return (
    <Screen>
      <FlowSteps step={7} />

      <div className="flex flex-col gap-4 px-6 pt-3">
        <div className="flex items-center justify-between">
          <p className="text-gold-deep text-[11px] leading-[14px] font-medium tracking-[0.14em]">
            JAK SIĘ UBRAĆ
          </p>
          <p className="text-muted text-[11px] leading-[14px] tracking-[0.1em]">
            08
          </p>
        </div>

        <div
          className="h-[290px] rounded-[20px] bg-[#E7E2D8] bg-cover bg-[50%]"
          style={{ backgroundImage: "url(/images/hall-symphonic.jpg)" }}
        />

        <div className="bg-ink rounded-[20px] px-[18px] py-4">
          {TIPS.map((tip, index) => (
            <div key={tip.title}>
              <div
                className={`flex gap-3.5 ${
                  index === 0
                    ? "pb-3"
                    : index === TIPS.length - 1
                      ? "pt-3"
                      : "py-3"
                }`}
              >
                <span className="w-5 shrink-0 text-[10px] leading-4 font-medium tracking-[0.1em] text-[#D4AF56]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="flex flex-col gap-0.5">
                  <p className="text-[14px] leading-[18px] font-bold text-white">
                    {tip.title}
                  </p>
                  <p className="text-[13px] leading-[17px] text-white/60">
                    {tip.text}
                  </p>
                </div>
              </div>
              {index < TIPS.length - 1 ? (
                <div className="bg-white/15 h-px w-full" />
              ) : null}
            </div>
          ))}
        </div>

        <Link
          className="bg-gold text-ink hover:bg-gold-deep focus-visible:outline-ink flex items-center justify-between rounded-full px-5 py-[13px] text-[14px] leading-[18px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4"
          href="/directions"
        >
          Zobacz przykłady
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      <div className="flex-1" />

      <FlowArrows step={7} />
    </Screen>
  );
}
