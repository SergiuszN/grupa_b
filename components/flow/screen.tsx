import type { ReactNode } from "react";
import { SiteHeader } from "@/components/landing/site-header";

export function Screen({ children }: { children: ReactNode }) {
  return (
    <main className="bg-paper text-ink flex min-h-dvh flex-col">
      <div className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col">
        <SiteHeader tone="light" />
        <div className="flex flex-1 flex-col">
          {children}
        </div>
      </div>
    </main>
  );
}
