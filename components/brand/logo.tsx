export function Logo({ className }: { className?: string }) {
  return (
    <span className={`flex items-center gap-[9px] ${className ?? ""}`}>
      <span aria-hidden="true" className="logo-mark h-9 w-5 shrink-0" />
      <span className="flex flex-col">
        <span className="text-[9px] leading-[10px] font-bold tracking-[0.04em]">
          FILHARMONIA
        </span>
        <span className="pt-[3px] text-[9px] leading-[10px] font-light tracking-[0.17em]">
          SZCZECIN
        </span>
      </span>
    </span>
  );
}
