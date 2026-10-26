import Link from "next/link";
import type { Regime } from "@/lib/macro-regime";

const bannerCls: Record<string, string> = {
  stress: "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200",
  tightening: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200",
  easing: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200",
  neutral: "border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-200",
};
const dotCls: Record<string, string> = {
  stress: "bg-rose-500",
  tightening: "bg-amber-500",
  easing: "bg-emerald-500",
  neutral: "bg-slate-400",
};

/** Unified regime banner — same visual in ETF and Wheel labs, theme-aware via html.dark (dark:) */
export function MacroRegimeBanner({ regime }: { regime: Regime | null }) {
  if (!regime) return null;
  const cls = bannerCls[regime.label] ?? bannerCls.neutral;
  const dot = dotCls[regime.label] ?? dotCls.neutral;
  return (
    <div className={`rounded-xl border px-4 py-3.5 ${cls}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em]">
            <span className={`h-2 w-2 rounded-full ${dot}`} />
            Regime — {regime.title}
            <span className="font-normal normal-case tracking-normal text-[11px] opacity-70">
              as of {regime.asOf ?? "latest"} {regime.signals.effrTarget != null ? `· EFFR ${regime.signals.effrTarget.toFixed(2)}%` : ""}{" "}
              {regime.signals.spread10y2y != null ? `· 10Y−2Y ${regime.signals.spread10y2y >= 0 ? "+" : ""}${regime.signals.spread10y2y.toFixed(2)}pp` : ""}{" "}
              {regime.signals.realYield10y != null ? `· real 10Y ${regime.signals.realYield10y.toFixed(2)}%` : ""}
            </span>
          </div>
          <p className="mt-1 text-sm leading-relaxed">
            {regime.summary} <span className="font-medium dark:text-white">→ {regime.implication}</span>
          </p>
          {regime.warnings.length > 0 && <p className="mt-1 text-xs opacity-80 dark:text-slate-400">⚠ {regime.warnings.slice(0, 3).join(" · ")}</p>}
        </div>
        <Link
          href="/macro"
          className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-black/5 hover:bg-slate-50 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-500/20 dark:hover:bg-emerald-900/40 dark:hover:text-white"
        >
          View macro →
        </Link>
      </div>
    </div>
  );
}

// Backward-compat aliases — existing pages import Light/Dark separately; both now render unified banner
export const MacroRegimeBannerLight = MacroRegimeBanner;
export const MacroRegimeBannerDark = MacroRegimeBanner;
