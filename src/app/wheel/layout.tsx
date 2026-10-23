import type { ReactNode } from "react";

export default function WheelLayout({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-4 -my-8">
      <div className="min-h-[calc(100vh-64px)] bg-[#080E28] text-slate-100">
        <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </div>
    </div>
  );
}
