import Link from "next/link";
import { MacroRegimeBanner } from "@/components/MacroRegimeBanner";
import WheelKpis from "@/components/wheel/WheelKpis";
import WheelFilters from "@/components/wheel/WheelFilters";
import WheelStockFilter from "@/components/wheel/WheelStockFilter";
import WheelEarningsWatch from "@/components/wheel/WheelEarningsWatch";
import WheelTable from "@/components/wheel/WheelTable";
import WheelHydratorDark from "@/components/wheel/WheelHydratorDark";
import { IconTile, WheelLabIcon } from "@/components/icons/AppIcons";
import { ago, dateShort } from "@/lib/format";
import { getEnv } from "@/lib/env";
import { getBlsSchedule, getFomcCalendar, getMacroSnapshot, getPolicyRates, getYieldCurve } from "@/lib/macro";
import { combineEvents } from "@/lib/macro-events";
import { deriveRegime, regimeGuardrails } from "@/lib/macro-regime";
import { stockUniverse } from "@/lib/stock-universe";
import { staleStocks } from "@/lib/stock-service";
import { REJECT_LABEL } from "@/lib/wheel";
import { filtersQuery, parseFilters, type SP } from "@/lib/wheel-filters";
import { getIvRanks, getWheelResults, staleScanTickers, todayIso } from "@/lib/wheel-service";
import { alpacaConfigured } from "@/lib/options-providers";
import WheelCapitalPlanner from "@/components/wheel/WheelCapitalPlanner";
import WheelSectorWarning from "@/components/wheel/WheelSectorWarning";
import WheelPositionsTracker from "@/components/wheel/WheelPositionsTracker";

export const dynamic = "force-dynamic";
export const metadata = { title: "Wheel Screener · ETF Research Lab" };

export default async function WheelPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const f = parseFilters(sp);
  const [res, staleS, staleScans, snap, curve, policy, fomc, bls] = await Promise.all([
    getWheelResults(f),
    staleStocks(),
    staleScanTickers(),
    getMacroSnapshot(),
    getYieldCurve(),
    getPolicyRates(),
    getFomcCalendar(),
    getBlsSchedule(),
  ]);
  const today = todayIso();
  const env = getEnv();
  const q = filtersQuery(f);
  const regime = deriveRegime({ snap: snap?.data ?? null, curve: curve?.data ?? null, policy: policy?.data ?? null });
  const events = combineEvents(fomc?.data ?? null, bls?.data ?? null);
  const guardrails = regimeGuardrails(regime);
  // Sprint C: IV ranks (Map→Record for client serialization)
  let ivRanksRecord: Record<string, number | null> = {};
  try {
    const m = await getIvRanks(res.rows.map((r) => r.g.row.ticker));
    ivRanksRecord = Object.fromEntries(m.entries());
  } catch { /* ignore */ }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <IconTile size={40}><WheelLabIcon size={22} /></IconTile>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">Wheel Strategy Screener</h1>
            <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300">Two-step filter · Grade always computed</span>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            <b className="text-slate-700 dark:text-slate-200">Step 1: stocks (preset B = B and better)</b> then <b className="text-slate-700 dark:text-slate-200">Step 2: options</b> — grade is always computed (5-pillar weighted + caps), tooltips explain why even when return is high.
            Earnings, ex-dividend dates, key price levels and the optimal account type (<span className="text-violet-600 dark:text-violet-300">R</span> = retirement, <span className="text-sky-600 dark:text-sky-300">T</span> = taxable) are shown for every pick.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/wheel/calculator" className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500">
            Payoff & cycle →
          </Link>
          <Link href="/wheel/guide" className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 dark:border-indigo-500/20 dark:bg-[#1B2540] dark:text-indigo-300 dark:hover:bg-[#24304F] dark:hover:text-white">
            How to use this tool →
          </Link>
        </div>
      </div>

      <MacroRegimeBanner regime={regime} />

      <WheelHydratorDark staleStocks={staleS.length} staleScans={staleScans.length} total={stockUniverse().length} />

      {/* Step 1: Stock Filter — presets inclusive, optionable only default */}
      <WheelStockFilter f={f} eligibleCount={res.info.eligible} hydrated={res.info.hydrated} />

      {res.info.failed.length > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
          <span className="font-semibold">⚠ {res.info.failed.length} item(s) could not be fetched and are left out rather than guessed:</span> {res.info.failed.slice(0, 8).map((x) => x.ticker).join(", ")}
          {res.info.failed.length > 8 ? ` +${res.info.failed.length - 8} more` : ""}
        </div>
      )}

      <WheelFilters f={f} regime={regime} guardrails={guardrails} />

      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span className="text-slate-700 dark:text-slate-300">
          {f.stockMode === "custom"
            ? `${res.info.eligible} stocks pass custom filter of ${res.info.hydrated} analysed`
            : f.stockPreset === "A+"
              ? `${res.info.eligible} stocks graded A+ of ${res.info.hydrated} analysed`
              : f.stockPreset === "A"
                ? `${res.info.eligible} stocks graded A or better (A, A+) of ${res.info.hydrated} analysed`
                : f.stockPreset === "B"
                  ? `${res.info.eligible} stocks graded B or better (A+, A, B) of ${res.info.hydrated} analysed`
                  : f.stockPreset === "C"
                    ? `${res.info.eligible} stocks graded C or better of ${res.info.hydrated} analysed`
                    : `${res.info.eligible} stocks of ${res.info.hydrated} analysed`}
          {f.optionableOnly ? "" : " (incl. non-optionable)"}
        </span>
        <span className="text-slate-400 dark:text-slate-600">•</span>
        <span>{res.info.scanned} option chains scanned</span>
        <span className="text-slate-400 dark:text-slate-600">•</span>
        <span>option data: {Object.entries(res.info.sources).map(([k, n]) => `${k} ${n}`).join(", ") || "none yet"}</span>
        {res.info.oldest && (
          <>
            <span className="text-slate-400 dark:text-slate-600">•</span>
            <span>oldest scan {ago(res.info.oldest.toISOString())}</span>
          </>
        )}
        {res.info.fallbacks > 0 && (
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 ring-1 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/20">{res.info.fallbacks} chain(s) from backup provider</span>
        )}
        {!alpacaConfigured() && env.OPTIONS_PROVIDER === "auto" && (
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-800 ring-1 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/20">Alpaca keys not set: using Yahoo (deltas modelled ≈)</span>
        )}
      </div>

      <WheelEarningsWatch earningsWatch={res.earningsWatch} rows={res.rows} q={q} />

      <WheelKpis res={res} fMinGrade={f.minGrade} />

      {/* Guardrail callout when stress and current filters are loose */}
      {regime?.label === "stress" && (f.params.deltaMax > 0.25 || f.params.minOi < 300) && guardrails && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          <div className="font-semibold">Market stress — consider tightening</div>
          <p className="mt-1 text-xs leading-relaxed text-rose-700 dark:text-rose-200/90">{guardrails.note} High VIX/HY stress means richer premiums but real gap risk. Reduce size and keep 30%+ cash reserve.</p>
          {events.slice(0, 2).length > 0 && <p className="mt-1 text-xs text-rose-600 dark:text-rose-300">Next events: {events.slice(0, 2).map((e) => `${e.title} ${e.date}`).join(" · ")}</p>}
        </div>
      )}

      {res.rows.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-[#0F1A3A]">
          <div className="mx-auto max-w-lg text-sm text-slate-500 dark:text-slate-400">
            {res.info.scanned === 0
              ? "No option chains have been scanned yet. If the progress bar above has finished, check the Data Sources page and your Alpaca keys; failed scans are listed above."
              : "No puts pass these filters right now. Try widening the delta or expiry range, lowering the minimum return, or relaxing the bid/ask limit."}
            {Object.keys(res.rejected).length > 0 && (
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-500">
                Contracts rejected: {Object.entries(res.rejected).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0)).map(([k, n]) => `${n} ${REJECT_LABEL[k as keyof typeof REJECT_LABEL]}`).join(" · ")}
              </p>
            )}
          </div>
        </div>
      ) : (
        <>
          <WheelTable res={res} q={q} events={events} today={today} ivRanks={ivRanksRecord} />
          <WheelSectorWarning rows={res.rows} />
          <WheelCapitalPlanner rows={res.rows} />
          <WheelPositionsTracker />
        </>
      )}

      {res.heldBackByEarnings.length > 0 && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          {res.heldBackByEarnings.length} more stock(s) have good puts only after earnings and are hidden: {res.heldBackByEarnings.map((h) => h.ticker).join(", ")}. Tick &quot;Include options that expire after earnings&quot; to see them (flagged in red).
        </p>
      )}

      {res.info.failed.length > 0 && (
        <details className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-[#0F1A3A] dark:text-slate-400">
          <summary className="cursor-pointer font-medium text-slate-700 dark:text-slate-300">{res.info.failed.length} option scan(s) failed (left out, not guessed)</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {res.info.failed.slice(0, 20).map((x) => (
              <li key={x.ticker}><b className="text-slate-900 dark:text-slate-200">{x.ticker}</b>: {x.error}</li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-500">These are retried automatically after the TTL expires.</p>
        </details>
      )}

      <div className="space-y-1 border-t border-slate-200 pt-4 text-[11px] text-slate-500 dark:border-slate-800">
        <p>Source: <span className="text-slate-500 dark:text-slate-400">Stock data: Yahoo Finance (unofficial) · Options: Alpaca (primary) with Yahoo as backup</span> · as of {dateShort(today)}</p>
        <p>Scores = return per year × chance the put expires worthless × liquidity × structure bonus/penalties. Stock and option data may be delayed. Fills usually land between the bid and the mid price.</p>
        <p className="text-amber-700 dark:text-amber-300/70">Selling options carries real risk: a put seller can lose most of the share price if the stock collapses, and assignment ties up the full cash amount. This tool does not place orders or give personal advice.</p>
      </div>
    </div>
  );
}
