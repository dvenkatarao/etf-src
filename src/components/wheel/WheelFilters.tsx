import Link from "next/link";
import type { Regime } from "@/lib/macro-regime";
import type { WheelFilters } from "@/lib/wheel-service";
import { FiltersIcon, IconTile, OptionsIcon } from "@/components/icons/AppIcons";

const labelCls = "text-[10px] font-semibold tracking-[0.12em] text-slate-500 dark:text-slate-400";
const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 dark:border-slate-700 dark:bg-[#111C3E] dark:text-white dark:placeholder:text-slate-500";
const selectCls =
  "w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 dark:border-slate-700 dark:bg-[#111C3E] dark:text-white";

export default function WheelFilters({ f, regime, guardrails }: { f: WheelFilters; regime?: Regime | null; guardrails?: { deltaMax: number; minOi: number; maxSpreadPct: number; note: string } | null }) {
  const p = f.params;
  return (
    <form method="GET" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#0F1A3A]">
      {/* Preserve Step 1 stock filter */}
      {f.stockMode === "custom" ? (
        <>
          <input type="hidden" name="mode" value="custom" />
          <input type="hidden" name="preset" value={f.stockPreset} />
          {/* Stock thresholds as hidden — WheelStockFilter is separate form for editing, but preserve here */}
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
        </>
      ) : (
        <>
          {f.stockPreset !== "A" && <input type="hidden" name="preset" value={f.stockPreset} />}
          {f.minGrade === "A+" && <input type="hidden" name="grade" value="A+" />}
          {!f.optionableOnly && <input type="hidden" name="opt" value="0" />}
        </>
      )}

      <div className="mb-2 flex items-center justify-between">
        <h3 className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          <IconTile size={24}><OptionsIcon size={13} /></IconTile>
          Step 2 · Options Filter — options list populates only after Step 1 + Step 2 are set
        </h3>
        <span className="text-xs text-slate-500">Grade in table always computed (weighted + caps) — see tooltips</span>
      </div>

      <div className="grid grid-cols-12 gap-3">
        <label className="col-span-6 flex flex-col gap-1.5 sm:col-span-3 lg:col-span-2">
          <span className={labelCls}>DAYS TO EXPIRY</span>
          <div className="flex items-center gap-1.5">
            <input name="dteMin" defaultValue={p.dteMin} className={inputCls} inputMode="numeric" />
            <span className="text-xs text-slate-500">to</span>
            <input name="dteMax" defaultValue={p.dteMax} className={inputCls} inputMode="numeric" />
          </div>
        </label>
        <label className="col-span-6 flex flex-col gap-1.5 sm:col-span-3 lg:col-span-2">
          <span className={labelCls}>DELTA (ABSOLUTE)</span>
          <div className="flex items-center gap-1.5">
            <input name="dMin" defaultValue={p.deltaMin} className={inputCls} inputMode="decimal" />
            <span className="text-xs text-slate-500">to</span>
            <input name="dMax" defaultValue={p.deltaMax} className={inputCls} inputMode="decimal" />
          </div>
        </label>
        <label className="col-span-6 flex flex-col gap-1.5 sm:col-span-3 lg:col-span-2">
          <span className={labelCls}>MIN OPEN INTEREST</span>
          <input name="oi" defaultValue={p.minOi} className={inputCls} inputMode="numeric" />
        </label>
        <label className="col-span-6 flex flex-col gap-1.5 sm:col-span-3 lg:col-span-2">
          <span className={labelCls}>MAX BID/ASK GAP %</span>
          <input name="spread" defaultValue={Math.round(p.maxSpreadPct * 100)} className={inputCls} inputMode="numeric" />
        </label>
        <label className="col-span-6 flex flex-col gap-1.5 sm:col-span-3 lg:col-span-2">
          <span className={labelCls}>MIN ANNUAL RETURN %</span>
          <input name="ret" defaultValue={Math.round(p.minAnnReturn * 100)} className={inputCls} inputMode="numeric" />
        </label>
        <label className="col-span-6 flex flex-col gap-1.5 sm:col-span-3 lg:col-span-2">
          <span className={labelCls}>MIN WHEEL SCORE</span>
          <input name="minScore" defaultValue={f.minScore ?? 15} className={inputCls} inputMode="numeric" />
        </label>
        <label className="col-span-6 flex flex-col gap-1.5 sm:col-span-4 lg:col-span-2">
          <span className={labelCls}>ACCOUNT</span>
          <select name="acct" defaultValue={f.account} className={selectCls}>
            <option value="all">All</option>
            <option value="R">R (retirement)</option>
            <option value="T">T (taxable)</option>
          </select>
        </label>
        <div className="col-span-12 flex flex-col gap-3 pt-1 sm:col-span-8 lg:col-span-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input type="checkbox" name="earn" value="1" defaultChecked={p.allowEarnings} className="h-4 w-4 rounded border-slate-300 bg-white accent-teal-600 dark:border-slate-600 dark:bg-slate-700" />
              Include options that expire after earnings
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input type="checkbox" name="trend" value="1" defaultChecked={f.trendOnly} className="h-4 w-4 rounded border-slate-300 bg-white accent-teal-600 dark:border-slate-600 dark:bg-slate-700" />
              Only stocks above 200-day
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input type="checkbox" name="divOnly" value="1" defaultChecked={f.divOnly ?? false} className="h-4 w-4 rounded border-slate-300 bg-white accent-teal-600 dark:border-slate-600 dark:bg-slate-700" />
              Dividend plays only
            </label>
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-400/40">
              <FiltersIcon size={14} />
              Apply Filters
            </button>
            <Link href="/wheel" className="rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 hover:underline dark:text-slate-400 dark:hover:text-white">
              Reset all
            </Link>
          </div>
        </div>
      </div>
      {regime && guardrails && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ring-1 ${regime.label === "stress" ? "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20" : regime.label === "tightening" ? "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20" : regime.label === "easing" ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20" : "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${regime.palette.dot}`} /> {regime.title} · {guardrails.note}
          </span>
          <span className="text-slate-500">Suggested: Δ ≤{guardrails.deltaMax.toFixed(2)} · OI ≥{guardrails.minOi} · gap ≤{Math.round(guardrails.maxSpreadPct * 100)}%</span>
        </div>
      )}
    </form>
  );
}
