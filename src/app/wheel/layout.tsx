import type { ReactNode } from "react";

// Wheel keeps the dark canvas (ETF is light) but the inner content width
// must match the ETF lab's container (max-w-[1600px]) so switching labs doesn't
// feel like the page shrinks/expands. Negative margins create full-bleed
// background while inner px mirrors the root layout exactly.
export default function WheelLayout({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-4 -my-8 sm:-mx-6 lg:-mx-8">
      <div className="min-h-[calc(100vh-64px)] bg-[#080E28] text-slate-100">
        <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </div>
    </div>
  );
}
