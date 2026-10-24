import type { ReactNode } from "react";

// Wheel keeps the dark canvas (ETF is light) but the inner content width
// must match the ETF lab's container (max-w-7xl) so switching labs doesn't
// feel like the page shrinks/expands.
export default function WheelLayout({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-4 -my-8">
      <div className="min-h-[calc(100vh-64px)] bg-[#080E28] text-slate-100">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </div>
    </div>
  );
}
