"use client";

import { FlowArrows, FlowSteps } from "@/components/flow/flow-nav";
import { Screen } from "@/components/flow/screen";
import { useFlow } from "@/lib/use-flow";

const BEFORE = [
  { time: "18:30", title: "Drinki", place: "No Name Bar" },
  { time: "19:15", title: "Spacer", place: "Wały Chrobrego" },
  { time: "19:45", title: "Szatnia", place: "Wejście główne" },
];

function Row({
  time,
  title,
  place,
  last = false,
}: {
  time: string;
  title: string;
  place: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline gap-3.5 py-[9px] ${
        last ? "" : "border-line border-b"
      }`}
    >
      <span className="text-muted w-[52px] shrink-0 text-[14px] leading-[18px] font-medium">
        {time}
      </span>
      <span className="text-ink flex-1 text-[16px] leading-5 font-medium">
        {title}
      </span>
      <span className="text-muted w-[118px] shrink-0 text-right text-[13px] leading-4">
        {place}
      </span>
    </div>
  );
}

function Label({ children }: { children: string }) {
  return (
    <p className="text-muted pb-1 text-[12px] leading-4 font-medium tracking-[0.14em]">
      {children}
    </p>
  );
}

export default function Evening() {
  const { event, people } = useFlow();

  return (
    <Screen>
      <FlowSteps step={4} />

      <div className="flex flex-col gap-1.5 px-6 pt-3 pb-2.5">
        <p className="text-gold text-[12px] leading-4 font-medium tracking-[0.14em] uppercase">
          Wokół koncertu
        </p>
        <h1 className="text-[30px] leading-[34px] font-bold tracking-[-0.03em]">
          Najpierw miasto.
        </h1>
      </div>

      <div className="px-6 pt-1.5">
        <Label>PRZED</Label>
        {BEFORE.map((item) => (
          <Row key={item.title} {...item} />
        ))}
      </div>

      <div className="px-6 pt-3">
        <div
          className="bg-ink relative flex h-[148px] flex-col justify-end overflow-clip rounded-[18px] bg-cover bg-[50%]"
          style={{ backgroundImage: `url(${event.image})` }}
        >
          <div className="from-ink/72 flex items-end bg-gradient-to-t to-transparent px-3.5 py-3">
            <div className="flex flex-col gap-0.5">
              <p className="text-gold text-[12px] leading-4 font-medium tracking-[0.12em]">
                20:00 · KONCERT
              </p>
              <p className="text-[22px] leading-[26px] font-bold tracking-[-0.03em] text-white">
                {event.title}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 pt-4">
        <Label>PO</Label>
        <Row last place={`Fino · na ${people}`} time="22:15" title="Kolacja" />
      </div>

      <div className="flex-1" />

      <p className="text-muted px-6 pb-2 text-[14px] leading-5">
        Możesz przesunąć każdy punkt.
      </p>

      <FlowArrows step={4} />
    </Screen>
  );
}
