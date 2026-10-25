"use client";

import Link from "next/link";
import { useState } from "react";
import type { Regime } from "@/lib/macro-regime";
import type { WheelFilters } from "@/lib/wheel-service";
import { FiltersIcon, IconTile, OptionsIcon } from "@/components/icons/AppIcons";

const labelCls = "text-[10px] font-semibold tracking-[0.12em] text-slate-500 dark:text-slate-400";
const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white dark:placeholder:text-slate-500";
const selectCls =
  "w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-slate-700 dark:bg-[#0f172a] dark:text-white";

export default function WheelFilters({ f, regime, guardrails }: { f: WheelFilters; regime?: Regime | null; guardrails?: { deltaMax: number; minOi: number; maxSpreadPct: number; note: string } | null }) {
  const p = f.params;
  const [dteMin, setDteMin] = useState(p.dteMin);
  const [dteMax, setDteMax] = useState(p.dteMax);
  const [dMin, setDMin] = useState(p.deltaMin);
  const [dMax, setDMax] = useState(p.deltaMax);
  const [oi, setOi] = useState(p.minOi);
  const [more, setMore] = useState(false);

  return (
    <form method="GET" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#0f172a]">
      {f.stockMode === "custom" ? (
        <>
          <input type="hidden" name="mode" value="custom" />
          <input type="hidden" name="preset" value={f.stockPreset} />
          {f.stockThresholds.opMarginMin != null && <input type="hidden" name="opMin" value={f.stockThresholds.opMarginMin} />}
          {f.stockThresholds.roeMin != null && <input type="hidden" name="roeMin" value={f.stockThresholds.roeMin} />}
          {f.stockThresholds.debtEquityMax != null && <input type="hidden" name="debtMax" value={f.stockThresholds.debtEquityMax} />}
          {f.stockThresholds.forwardPEMax != null && <input type="hidden" name="peMax" value={f.stockThresholds.forwardPEMax} />}
          {f.stockThresholds.pegMax != null && <input type="hidden" name="pegMax" value={f.stockThresholds.pegMax} />}
          {f.stockThresholds.marketCapMin != null && <input type="hidden" name="mktMin" value={(f.stockThresholds.marketCapMin / 1e9).toString()} />}
          {f.stockThresholds.betaMax != null && <input type="hidden" name="betaMax" value={f.stockThresholds.betaMax} />}
          {f.stockThresholds.ddMax != null && <input type="hidden" name="ddMax" value={f.stockThresholds.ddMax} />}
          {f.stockThresholds.fcfYieldMin != null && <input type="hidden" name="fcyMin" value={f.stockThresholds.fcfYieldMin} />}
          {f.stockThresholds.recMeanMax != null && <input type="hidden" name="recMax" value={f.stockThresholds.recMeanMax} />}
          {!f.optionableOnly && <input type="hidden" name="opt" value="0" />}
          {f.missingPolicy === "keep" && <input type="hidden" name="miss" value="keep" />}
        </>
      ) : (
        <>
          {f.stockPreset !== "A" && <input type="hidden" name="preset" value={f.stockPreset} />}
          {f.minGrade === "A+" && <input type="hidden" name="grade" value="A+" />}
          {!f.optionableOnly && <input type="hidden" name="opt" value="0" />}
        </>
      )}

      <div className="mb-3 flex items-center justify-between">
        <h3 className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          <IconTile size={24}>
            <OptionsIcon size={13} />
          </IconTile>
          Step 2 · Options Filter
        </h3>
        <span className="hidden text-xs text-slate-500 sm:inline">Grade in table always computed — see tooltips</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1">
          <span className={labelCls}>
            DAYS TO EXPIRY · {dteMin}–{dteMax}
          </span>
          <div className="mt-1 flex items-center gap-2">
            <input type="range" min={7} max={90} step={1} value={dteMin} onChange={(e) => setDteMin(Number(e.target.value))} className="w-full" aria-label="Minimum days to expiry" />
            <input type="range" min={14} max={180} step={1} value={dteMax} onChange={(e) => setDteMax(Number(e.target.value))} className="w-full" aria-label="Maximum days to expiry" />
          </div>
          <input type="hidden" name="dteMin" value={dteMin} />
          <input type="hidden" name="dteMax" value={dteMax} />
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelCls}>
            DELTA · {dMin.toFixed(2)}–{dMax.toFixed(2)}
          </span>
          <div className="mt-1 flex items-center gap-2">
            <input type="range" min={0.05} max={0.4} step={0.01} value={dMin} onChange={(e) => setDMin(Number(e.target.value))} className="w-full" aria-label="Minimum delta" />
            <input type="range" min={0.1} max={0.5} step={0.01} value={dMax} onChange={(e) => setDMax(Number(e.target.value))} className="w-full" aria-label="Maximum delta" />
          </div>
          <input type="hidden" name="dMin" value={dMin} />
          <input type="hidden" name="dMax" value={dMax} />
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelCls}>MIN OPEN INTEREST · {oi.toLocaleString()}</span>
          <input type="range" min={50} max={5000} step={50} value={oi} onChange={(e) => setOi(Number(e.target.value))} className="mt-2 w-full" aria-label="Minimum open interest" />
          <input type="hidden" name="oi" value={oi} />
        </label>
        <div className="flex flex-col justify-end gap-2 sm:flex-row sm:items-end">
          <button
            type="button"
            onClick={() => setMore((m) => !m)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#0f172a] dark:text-slate-200"
            aria-expanded={more}
          >
            {more ? "Hide filters" : "More filters"}
          </button>
          <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/40">
            <FiltersIcon size={14} />
            Apply
          </button>
          <Link href="/wheel" className="rounded-lg px-3 py-2 text-center text-xs font-medium text-slate-500 hover:text-slate-700 hover:underline dark:text-slate-400 dark:hover:text-white">
            Reset
          </Link>
        </div>
      </div>

      {!more && (
        <>
          <input type="hidden" name="spread" value={Math.round(p.maxSpreadPct * 100)} />
          <input type="hidden" name="ret" value={Math.round(p.minAnnReturn * 100)} />
          <input type="hidden" name="minScore" value={f.minScore ?? 15} />
          {f.account !== "all" && <input type="hidden" name="acct" value={f.account} />}
          {p.allowEarnings && <input type="hidden" name="earn" value="1" />}
          {f.trendOnly && <input type="hidden" name="trend" value="1" />}
          {f.divOnly && <input type="hidden" name="divOnly" value="1" />}
        </>
      )}

      {more && (
        <div className="mt-3 grid gap-3 border-t border-slate-200 pt-3 sm:grid-cols-2 lg:grid-cols-4 dark:border-slate-800">
          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>MAX BID/ASK GAP %</span>
            <input name="spread" defaultValue={Math.round(p.maxSpreadPct * 100)} className={inputCls} inputMode="numeric" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>MIN ANNUAL RETURN %</span>
            <input name="ret" defaultValue={Math.round(p.minAnnReturn * 100)} className={inputCls} inputMode="numeric" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>MIN WHEEL SCORE</span>
            <input name="minScore" defaultValue={f.minScore ?? 15} className={inputCls} inputMode="numeric" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>ACCOUNT</span>
            <select name="acct" defaultValue={f.account} className={selectCls}>
              <option value="all">All</option>
              <option value="R">R (retirement)</option>
              <option value="T">T (taxable)</option>
            </select>
          </label>
          <div className="col-span-full flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input type="checkbox" name="earn" value="1" defaultChecked={p.allowEarnings} className="h-4 w-4 rounded border-slate-300 bg-white accent-emerald-600 dark:border-slate-600 dark:bg-slate-700" />
              Include options that expire after earnings
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input type="checkbox" name="trend" value="1" defaultChecked={f.trendOnly} className="h-4 w-4 rounded border-slate-300 bg-white accent-emerald-600 dark:border-slate-600 dark:bg-slate-700" />
              Only stocks above 200-day
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input type="checkbox" name="divOnly" value="1" defaultChecked={f.divOnly ?? false} className="h-4 w-4 rounded border-slate-300 bg-white accent-emerald-600 dark:border-slate-600 dark:bg-slate-700" />
              Dividend plays only
            </label>
          </div>
        </div>
      )}

      {regime && guardrails && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ring-1 ${
              regime.label === "stress"
                ? "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20"
                : regime.label === "tightening"
                  ? "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20"
                  : regime.label === "easing"
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20"
                    : "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${regime.palette.dot}`} /> {regime.title} · {guardrails.note}
          </span>
          <span className="text-slate-500">
            Suggested: Δ ≤{guardrails.deltaMax.toFixed(2)} · OI ≥{guardrails.minOi} · gap ≤{Math.round(guardrails.maxSpreadPct * 100)}%
          </span>
        </div>
      )}
    </form>
  );
}
