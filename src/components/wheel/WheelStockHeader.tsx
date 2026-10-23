import Link from "next/link";
import { money, dateShort, pct } from "@/lib/format";

export function WheelStatDark({ label, value, sub, valueClass = "text-white", hint }: { label: string; value: React.ReactNode; sub?: React.ReactNode; valueClass?: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0F1A3A] px-4 py-3" title={hint}>
      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</div>
      <div className={`mt-1 text-lg font-semibold tabular-nums ${valueClass}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

export function WheelCardDark({ title, subtitle, right, children, className = "" }: { title?: React.ReactNode; subtitle?: React.ReactNode; right?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-slate-800 bg-[#0F1A3A] p-5 shadow-sm ${className}`}>
      {(title || right) && (
        <header className="mb-4 flex flex-wrap items-start justify-between gap-2">
          <div>
            {title && <h2 className="text-sm font-semibold text-white">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
          </div>
          {right}
        </header>
      )}
      {children}
    </section>
  );
}

export function WheelBadgeDark({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${className}`}>{children}</span>;
}
