import Link from "next/link";
import type { Regime } from "@/lib/macro-regime";

export function MacroRegimeBannerLight({ regime }: { regime: Regime | null }) {
  if (!regime) return null;
  const palette: Record<string, string> = {
    stress: "border-rose-200 bg-rose-50 text-rose-900",
    tightening: "border-amber-200 bg-amber-50 text-amber-900",
    easing: "border-emerald-200 bg-emerald-50 text-emerald-900",
    neutral: "border-slate-200 bg-slate-50 text-slate-800",
  };
  const cls = palette[regime.label] ?? palette.neutral;
  const dot: Record<string, string> = { stress: "bg-rose-500", tightening: "bg-amber-500", easing: "bg-emerald-500", neutral: "bg-slate-400" };
  return (
    <div className={`rounded-xl border px-4 py-3.5 ${cls}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em]">
            <span className={`h-2 w-2 rounded-full ${dot[regime.label]}`} />
            Regime — {regime.title}
            <span className="font-normal normal-case tracking-normal text-[11px] opacity-70">as of {regime.asOf ?? "latest"} {regime.signals.effrTarget != null ? `· EFFR ${regime.signals.effrTarget.toFixed(2)}%` : ""} {regime.signals.spread10y2y != null ? `· 10Y−2Y ${regime.signals.spread10y2y >= 0 ? "+" : ""}${regime.signals.spread10y2y.toFixed(2)}pp` : ""} {regime.signals.realYield10y != null ? `· real 10Y ${regime.signals.realYield10y.toFixed(2)}%` : ""}</span>
          </div>
          <p className="mt-1 text-sm leading-relaxed">{regime.summary} <span className="font-medium">→ {regime.implication}</span></p>
          {regime.warnings.length > 0 && <p className="mt-1 text-xs opacity-80">⚠ {regime.warnings.slice(0, 3).join(" · ")}</p>}
        </div>
        <Link href="/macro" className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-black/5 hover:bg-slate-50">
          View macro →
        </Link>
      </div>
    </div>
  );
}

export function MacroRegimeBannerDark({ regime }: { regime: Regime | null }) {
  if (!regime) return null;
  const p = regime.palette;
  return (
    <div className={`rounded-xl border px-4 py-3.5 ${p.border} ${p.bg}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] ${p.text}`}>
            <span className={`h-2 w-2 rounded-full ${p.dot}`} />
            Regime — {regime.title}
            <span className="font-normal normal-case tracking-normal text-[11px] opacity-70">as of {regime.asOf ?? "latest"} {regime.signals.effrTarget != null ? `· EFFR ${regime.signals.effrTarget.toFixed(2)}%` : ""} {regime.signals.spread10y2y != null ? `· 10Y−2Y ${regime.signals.spread10y2y >= 0 ? "+" : ""}${regime.signals.spread10y2y.toFixed(2)}pp` : ""} {regime.signals.realYield10y != null ? `· real 10Y ${regime.signals.realYield10y.toFixed(2)}%` : ""}</span>
          </div>
          <p className={`mt-1 text-sm leading-relaxed ${p.text}`}>{regime.summary} <span className="font-medium text-white">→ {regime.implication}</span></p>
          {regime.warnings.length > 0 && <p className="mt-1 text-xs text-slate-400">⚠ {regime.warnings.slice(0, 3).join(" · ")}</p>}
        </div>
        <Link href="/macro" className="shrink-0 rounded-lg bg-[#1B2540] px-3 py-1.5 text-xs font-medium text-indigo-300 ring-1 ring-indigo-500/20 hover:bg-[#24304F] hover:text-white">
          Macro detail →
        </Link>
      </div>
    </div>
  );
}
