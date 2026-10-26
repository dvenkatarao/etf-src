"use client";

import { useMemo } from "react";
import type { WheelRow } from "@/lib/wheel-service";
import { sectorConcentration } from "@/lib/wheel-capital";

export default function WheelSectorWarning({ rows }: { rows: WheelRow[] }) {
  const { breakdown, max, warn, total } = useMemo(() => sectorConcentration(rows.map((r) => ({ sector: r.g.row.sector }))), [rows]);
  if (!rows.length) return null;
  return (
    <div className={`rounded-xl border p-4 ${warn ? "border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10" : "border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0f172a]"}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className={`text-sm font-semibold ${warn ? "text-amber-900 dark:text-amber-200" : "text-slate-900 dark:text-white"}`}>
          Sector mix of passing puts
          {warn && ` — ${max.sector} heavy (${Math.round(max.pct * 100)}%)`}
        </h3>
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ${warn ? "bg-amber-100 text-amber-900 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-500/20" : "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-700/40 dark:text-slate-400 dark:ring-slate-600/30"}`}>
          {total} names
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {breakdown.slice(0, 6).map((b) => (
          <span
            key={b.sector}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${
              b.pct >= 0.3
                ? "border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-200"
                : "border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-[#020617] dark:text-slate-300"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> {b.sector}: {b.count} ({Math.round(b.pct * 100)}%)
          </span>
        ))}
      </div>
      {warn ? (
        <p className="mt-3 text-xs leading-relaxed text-amber-900/80 dark:text-amber-200/90">
          {max.count} of {total} puts are in <b>{max.sector}</b>. A sector shock (earnings, OPEC, Fed) can assign several at once. Diversify across sectors or keep a larger cash reserve.
        </p>
      ) : (
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          No single sector dominates (largest {max.sector} {Math.round(max.pct * 100)}%). You&apos;re diversified on purpose — keep it that way and avoid stacking 5 puts in one sector.
        </p>
      )}
    </div>
  );
}
