import Link from "next/link";
import type { WheelFilters } from "@/lib/wheel-service";
import { FiltersIcon, IconTile } from "@/components/icons/AppIcons";
import { PRESET_DESC, PRESET_LABEL, PRESET_ORDER, STOCK_PRESETS } from "@/lib/stock-presets";
import type { PresetKey } from "@/lib/stock-presets";

const PRESETS: PresetKey[] = ["A+", "A", "B", "C", "all"];

export default function WheelStockFilter({
  f,
  eligibleCount,
  hydrated,
  missingDropped = 0,
  missingFields = 0,
}: {
  f: WheelFilters;
  eligibleCount: number;
  hydrated: number;
  missingDropped?: number;
  missingFields?: number;
}) {
  const activePreset = f.stockMode === "custom" ? "custom" as any : f.stockPreset;
  const thresholds = f.stockMode === "custom" ? f.stockThresholds : STOCK_PRESETS[f.stockPreset];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#0f172a]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          <IconTile size={24}><FiltersIcon size={13} /></IconTile>
          Step 1 · Stock Filter
        </h3>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {eligibleCount} stocks pass of {hydrated} analysed • {f.optionableOnly ? "Optionable only" : "All"}
          {f.stockMode === "custom" && missingDropped > 0 ? ` • ${missingDropped} skipped for missing data` : ""}
          {f.stockMode === "custom" && f.missingPolicy === "keep" && missingFields > 0 ? ` • ${missingFields} included with missing fields` : ""}
        </span>
      </div>

      {/* Preset pills */}
      <form method="GET" id="stock-preset-form" className="mt-3 flex flex-wrap gap-2">
        {/* Preserve option filter params as hidden */}
        <input type="hidden" name="dteMin" value={f.params.dteMin} />
        <input type="hidden" name="dteMax" value={f.params.dteMax} />
        <input type="hidden" name="dMin" value={f.params.deltaMin} />
        <input type="hidden" name="dMax" value={f.params.deltaMax} />
        <input type="hidden" name="oi" value={f.params.minOi} />
        <input type="hidden" name="spread" value={Math.round(f.params.maxSpreadPct * 100)} />
        <input type="hidden" name="ret" value={Math.round(f.params.minAnnReturn * 100)} />
        <input type="hidden" name="minScore" value={f.minScore} />
        {f.params.allowEarnings && <input type="hidden" name="earn" value="1" />}
        {f.trendOnly && <input type="hidden" name="trend" value="1" />}
        {f.divOnly && <input type="hidden" name="divOnly" value="1" />}
        {f.account !== "all" && <input type="hidden" name="acct" value={f.account} />}
        {f.optionableOnly === false && <input type="hidden" name="opt" value="0" />}
        {f.missingPolicy === "keep" && <input type="hidden" name="miss" value="keep" />}

        {PRESETS.map((p) => {
          const isActive = f.stockMode === "preset" && f.stockPreset === p;
          return (
            <button
              key={p}
              type="submit"
              name="preset"
              value={p}
              title={PRESET_DESC[p]}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ring-1 transition ${
                isActive
                  ? "bg-emerald-600 text-white ring-emerald-600"
                  : p === "A+"
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/20"
                    : "bg-slate-100 text-slate-700 ring-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700"
              }`}
            >
              {p} {p !== "all" ? "and better" : ""} <span className="ml-1 text-[10px] opacity-70">{PRESET_LABEL[p].split(" ")[1] ?? ""}</span>
            </button>
          );
        })}
        <button
          type="submit"
          name="mode"
          value="custom"
          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ring-1 ${
            f.stockMode === "custom" ? "bg-emerald-600 text-white ring-emerald-600" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700"
          }`}
        >
          Custom
        </button>
        <Link href="/wheel" className="rounded-full bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
          Reset
        </Link>
      </form>

      <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        Default is <b className="text-slate-700 dark:text-slate-300">A and better</b> (A, A+). Presets are inclusive: B also includes A and A+. Eligibility uses the weighted grade (A+ ≥ 90, A ≥ 80, B ≥ 65). Custom mode filters fundamentals directly; the grade column is still shown for context.
      </p>

      {/* Threshold preview — explanatory, not editable in preset mode */}
      <details className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-[#0b1220]" open={f.stockMode === "custom"}>
        <summary className="cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
          {f.stockMode === "custom" ? "Custom thresholds — edit values (null = no filter)" : `What ${f.stockPreset} means in fundamentals`}
        </summary>

        {f.stockMode === "preset" ? (
          <div className="mt-2 grid gap-2 text-xs text-slate-600 dark:text-slate-400 sm:grid-cols-2 lg:grid-cols-3">
            <div><b>Quality:</b> OpMargin ≥ {(thresholds.opMarginMin! * 100).toFixed(0)}% · ROE ≥ {(thresholds.roeMin! * 100).toFixed(0)}%</div>
            <div><b>Strength:</b> Debt/Eq ≤ {thresholds.debtEquityMax} · NetDebt/EBITDA ≤ {thresholds.netDebtEbitdaMax} · CR ≥ {thresholds.currentRatioMin}</div>
            <div><b>Valuation:</b> FwdPE ≤ {thresholds.forwardPEMax} · PEG ≤ {thresholds.pegMax} · FCF Yield ≥ {((thresholds.fcfYieldMin ?? 0) * 100).toFixed(1)}%</div>
            <div><b>Analysts:</b> Rec ≤ {thresholds.recMeanMax} (need ≥8) {thresholds.betaMax ? `· Beta ≤ ${thresholds.betaMax}` : ""}</div>
            <div><b>Size:</b> MktCap ≥ {thresholds.marketCapMin ? `$${(thresholds.marketCapMin / 1e9).toFixed(0)}B` : "any"} · DD ≤ {thresholds.ddMax ? `${(thresholds.ddMax * 100).toFixed(0)}%` : "any"}</div>
            <div className="text-slate-500 dark:text-slate-400">Illustration only — a typical {f.stockPreset} profile. The filter uses the weighted grade, not these cutoffs.</div>
          </div>
        ) : (
          <form method="GET" className="mt-3 grid gap-3 text-xs">
            {/* Keep option filters hidden */}
            <input type="hidden" name="mode" value="custom" />
            <input type="hidden" name="preset" value={f.stockPreset} />
            <input type="hidden" name="dteMin" value={f.params.dteMin} />
            <input type="hidden" name="dteMax" value={f.params.dteMax} />
            <input type="hidden" name="dMin" value={f.params.deltaMin} />
            <input type="hidden" name="dMax" value={f.params.deltaMax} />
            <input type="hidden" name="oi" value={f.params.minOi} />
            <input type="hidden" name="spread" value={Math.round(f.params.maxSpreadPct * 100)} />
            <input type="hidden" name="ret" value={Math.round(f.params.minAnnReturn * 100)} />
            <input type="hidden" name="minScore" value={f.minScore} />
            {f.params.allowEarnings && <input type="hidden" name="earn" value="1" />}
            {f.trendOnly && <input type="hidden" name="trend" value="1" />}
            {f.divOnly && <input type="hidden" name="divOnly" value="1" />}
            {f.account !== "all" && <input type="hidden" name="acct" value={f.account} />}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Op Margin ≥ %</span>
                <input name="opMin" defaultValue={thresholds.opMarginMin != null ? (thresholds.opMarginMin * 100).toString() : ""} placeholder="15" className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-[#111827] dark:text-white" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">ROE ≥ %</span>
                <input name="roeMin" defaultValue={thresholds.roeMin != null ? (thresholds.roeMin * 100).toString() : ""} placeholder="15" className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-[#111827] dark:text-white" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Debt/Eq ≤</span>
                <input name="debtMax" defaultValue={thresholds.debtEquityMax ?? ""} placeholder="1.0" className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-[#111827] dark:text-white" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Fwd P/E ≤</span>
                <input name="peMax" defaultValue={thresholds.forwardPEMax ?? ""} placeholder="20" className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-[#111827] dark:text-white" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">PEG ≤</span>
                <input name="pegMax" defaultValue={thresholds.pegMax ?? ""} placeholder="2.0" className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-[#111827] dark:text-white" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">FCF Yield ≥ %</span>
                <input name="fcyMin" defaultValue={thresholds.fcfYieldMin != null ? (thresholds.fcfYieldMin * 100).toString() : ""} placeholder="4" className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-[#111827] dark:text-white" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Mkt Cap ≥ $B</span>
                <input name="mktMin" defaultValue={thresholds.marketCapMin != null ? (thresholds.marketCapMin / 1e9).toString() : ""} placeholder="10" className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-[#111827] dark:text-white" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Beta ≤</span>
                <input name="betaMax" defaultValue={thresholds.betaMax ?? ""} placeholder="1.3" className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-[#111827] dark:text-white" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">DD ≤ %</span>
                <input name="ddMax" defaultValue={thresholds.ddMax != null ? (thresholds.ddMax * 100).toString() : ""} placeholder="25" className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-[#111827] dark:text-white" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Rec ≤ (1=buy)</span>
                <input name="recMax" defaultValue={thresholds.recMeanMax ?? ""} placeholder="2.3" className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-[#111827] dark:text-white" />
              </label>
              <label className="flex items-center gap-2 pt-5">
                <input type="checkbox" name="opt" value="1" defaultChecked={f.optionableOnly} className="h-4 w-4 rounded border-slate-300 accent-emerald-600" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Optionable only</span>
              </label>
              <label className="flex items-center gap-2 pt-5 sm:col-span-2">
                <input type="checkbox" name="miss" value="keep" defaultChecked={f.missingPolicy === "keep"} className="h-4 w-4 rounded border-slate-300 accent-emerald-600" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Keep names when a filtered field is missing</span>
              </label>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              Custom mode filters on fundamentals directly. Empty = no filter on that field. Missing values are never guessed — by default those names are skipped. Tick “keep” to include them anyway.
            </p>
            <div className="flex gap-2">
              <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
                <FiltersIcon size={14} />
                Apply Stock Filter
              </button>
              <Link href="/wheel" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Reset
              </Link>
            </div>
          </form>
        )}
      </details>
    </div>
  );
}
