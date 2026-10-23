import Link from "next/link";
import { notFound } from "next/navigation";
import { AcctFlagDark, DeltaCellDark, EarningsBadgeDark, SourceBadgeDark } from "@/components/wheel/WheelBitsDark";
import WheelKeyLevelsDark from "@/components/wheel/WheelKeyLevelsDark";
import WheelGradeCardDark from "@/components/wheel/WheelGradeCardDark";
import { WheelCardDark, WheelStatDark, WheelBadgeDark } from "@/components/wheel/WheelStockHeader";
import WheelChartWithPuts from "@/components/wheel/WheelChartWithPuts";
import { dateShort, money, num, pct } from "@/lib/format";
import { yahooBars } from "@/lib/yahoo";
import { getOptionChain } from "@/lib/options-providers";
import { getStock, gradeStock } from "@/lib/stock-service";
import { stockGradeRank } from "@/lib/stock-quality";
import { isValidTicker } from "@/lib/universe";
import { REJECT_LABEL, scanCalls, scanPuts, type CallScan, type PutScan } from "@/lib/wheel";
import { filtersQuery, parseFilters, type SP } from "@/lib/wheel-filters";
import { stockCtx, todayIso } from "@/lib/wheel-service";
import { yahooQuotes } from "@/lib/yahoo";

export const dynamic = "force-dynamic";

const th = "whitespace-nowrap px-3 py-2 font-medium";

function RejectsDark({ rejected, evaluated }: { rejected: PutScan["rejected"]; evaluated: number }) {
  const parts = Object.entries(rejected).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0)).map(([k, n]) => `${n} ${REJECT_LABEL[k as keyof typeof REJECT_LABEL]}`);
  return <p className="mt-2 text-[11px] text-slate-500">{evaluated} contracts checked{parts.length ? `; filtered out: ${parts.join(" · ")}` : ""}.</p>;
}

export default async function WheelStockPage({ params, searchParams }: { params: Promise<{ ticker: string }>; searchParams: Promise<SP> }) {
  const { ticker: raw } = await params;
  const ticker = raw.toUpperCase();
  if (!isValidTicker(ticker)) notFound();
  const sp = await searchParams;
  const f = parseFilters(sp);
  const row = await getStock(ticker);
  if (!row || !row.fundamentals || !row.technicals) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-800 bg-[#0F1A3A] p-6">
          <h1 className="text-xl font-semibold text-white">{ticker}</h1>
          <p className="mt-1 text-sm text-slate-400">This stock has not been analysed yet.</p>
          <p className="mt-2 text-xs text-slate-500">{row?.lastError ?? "Open the Wheel Screener first so the stock universe can load, or add the ticker with WHEEL_EXTRA_SYMBOLS."}</p>
        </div>
        <Link href="/wheel" className="text-sm font-medium text-indigo-300 hover:text-white">← Wheel Screener</Link>
      </div>
    );
  }
  const g = gradeStock(row);
  let live: number | null = null;
  let bars: { t: number; o: number; h: number; l: number; c: number; v: number }[] = [];
  try {
    live = (await yahooQuotes([ticker]))[0]?.price ?? null;
  } catch {
    live = null;
  }
  try {
    const r = await yahooBars(ticker, "2y");
    bars = r.bars;
  } catch {
    bars = [];
  }
  const ctx = stockCtx(g, live);
  const today = todayIso();
  const basisRaw = typeof sp.basis === "string" ? Number(sp.basis) : NaN;
  const basis = Number.isFinite(basisRaw) && basisRaw > 0 ? basisRaw : null;
  const p = f.params;
  const divYield = row.events?.dividendYield ?? 0;

  let puts: (PutScan & { source: string; fallbackReason: string | null; fetchedAt: string }) | null = null;
  let putErr: string | null = null;
  let calls: (CallScan & { source: string; fallbackReason: string | null; fetchedAt: string }) | null = null;
  let callErr: string | null = null;
  if (ctx) {
    try {
      const r = await getOptionChain({ symbol: ticker, type: "put", price: ctx.price, dteMin: p.dteMin, dteMax: p.dteMax, divYield });
      puts = { ...scanPuts(r.contracts, ctx, p, today), source: r.source, fallbackReason: r.fallbackReason, fetchedAt: r.fetchedAt };
    } catch (e) {
      putErr = e instanceof Error ? e.message : String(e);
    }
    if (basis != null) {
      try {
        const r = await getOptionChain({ symbol: ticker, type: "call", price: ctx.price, dteMin: p.dteMin, dteMax: p.dteMax, divYield });
        calls = { ...scanCalls(r.contracts, ctx, basis, p, today), source: r.source, fallbackReason: r.fallbackReason, fetchedAt: r.fetchedAt };
      } catch (e) {
        callErr = e instanceof Error ? e.message : String(e);
      }
    }
  }
  const ev = row.events;
  const fu = row.fundamentals;
  const isA = g.grade != null && stockGradeRank(g.grade) <= stockGradeRank("A");
  const q = filtersQuery(f);
  const earnDays = ev?.nextEarnings && ev.nextEarnings >= today ? Math.round((Date.parse(ev.nextEarnings) - Date.parse(today)) / 86_400_000) : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{ticker}</h1>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">· {row.name ?? ""}</span>
            {g.grade && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold ring-1 ring-emerald-200 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 dark:ring-emerald-500/30">{g.grade}</span>}
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{row.sector ?? ""}{row.industry ? ` · ${row.industry}` : ""}</p>
        </div>
        <Link href={`/wheel?${q}`} className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 dark:border-indigo-500/20 dark:bg-[#1B2540] dark:text-indigo-300 dark:hover:bg-[#24304F] dark:hover:text-white">← Wheel Screener</Link>
      </div>

      {!isA && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">This stock is graded {g.grade ?? "n/a"}, below the A/A+ bar of the screener. Its options are shown for reference only.</div>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <WheelStatDark label="Price" value={money(ctx?.price ?? row.price)} sub={live != null ? "live (delayed)" : `last close ${row.technicals.asOf}`} />
        <WheelStatDark label="Next earnings" value={ev?.nextEarnings ? dateShort(ev.nextEarnings) : "unknown"} sub={earnDays != null ? `in ${earnDays} days${ev?.earningsEstimated ? " (estimated)" : ""}` : undefined} valueClass={earnDays != null && earnDays <= 14 ? "text-amber-300" : "text-white"} />
        <WheelStatDark label="Next ex-dividend" value={ev?.exDividend && ev.exDividend >= today ? dateShort(ev.exDividend) : "none upcoming"} sub={ev?.dividendPerShare != null ? `${money(ev.dividendPerShare)}/share · ${pct(ev.dividendYield, 2)} yield` : "no dividend"} />
        <WheelStatDark label="Analyst view" value={fu.recMean != null ? `${fu.recMean.toFixed(1)} / 5` : "N/A"} sub={fu.targetMean != null && fu.price ? `target ${money(fu.targetMean)} (${pct(fu.targetMean / fu.price - 1, 1, true)}) · ${fu.analystCount ?? "?"} analysts` : "1 = strong buy, 5 = sell"} />
      </div>

      <WheelGradeCardDark quality={g.quality} />
      <WheelKeyLevelsDark t={row.technicals} livePrice={ctx?.price} />

      <WheelChartWithPuts
        ticker={ticker}
        bars={bars}
        technicals={row.technicals}
        puts={puts}
        putErr={putErr}
        events={[]}
        fundTarget={fu.targetMean ?? null}
        allowEarnings={p.allowEarnings}
      />

      <WheelCardDark title="Step 2 · Covered calls (after assignment)" subtitle="Enter your cost per share (strike minus the premiums you collected) to see calls whose strike is at or above it, so being called away never locks in a loss.">
        <form method="GET" className="mb-3 flex flex-wrap items-end gap-3 text-sm">
          {Object.entries({ dteMin: p.dteMin, dteMax: p.dteMax, dMin: p.deltaMin, dMax: p.deltaMax, oi: p.minOi, spread: Math.round(p.maxSpreadPct * 100), ret: Math.round(p.minAnnReturn * 100) }).map(([k, v]) => <input key={k} type="hidden" name={k} value={String(v)} />)}
          {p.allowEarnings && <input type="hidden" name="earn" value="1" />}
          <label className="grid gap-1 text-xs text-slate-400">Your cost basis per share<input name="basis" defaultValue={basis ?? ""} placeholder={ctx ? num(ctx.price, 2) : ""} className="w-32 rounded-lg border border-slate-700 bg-[#111C3E] px-2 py-1.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none" /></label>
          <button className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-500">Find calls</button>
        </form>
        {basis == null ? (
          <p className="text-sm text-slate-400">Enter a cost basis above. The guide explains how to work it out after an assignment.</p>
        ) : callErr ? (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">Call chain unavailable: {callErr}</div>
        ) : calls ? (
          calls.candidates.length === 0 ? (
            <p className="text-sm text-slate-400">No call at or above {money(basis)} passes your filters.<RejectsDark rejected={calls.rejected} evaluated={calls.evaluated} />{ctx && basis > ctx.price * 1.1 && <span className="text-xs text-amber-300"> The stock is well below your cost; strikes at your cost may be too far out to pay much. Consider waiting or a longer expiry.</span>}</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <div className="border-b border-slate-800 bg-[#0D1632] px-3 py-2"><SourceBadgeDark source={calls.source} fallbackReason={calls.fallbackReason} /></div>
              <table className="min-w-full text-sm">
                <thead className="bg-[#0D1632] text-left text-[10px] uppercase tracking-[0.12em] text-slate-400"><tr>{["Expiry", "Strike", "Credit", "Delta", "Yield on cost /yr", "If called", "Upside to strike", "Liquidity", "Flags", "Score"].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-800/60">
                  {calls.candidates.slice(0, 15).map((c) => (
                    <tr key={c.contract.strike + c.contract.expiration} className="align-top hover:bg-white/[0.03]">
                      <td className="whitespace-nowrap px-3 py-2 text-slate-300">{dateShort(c.contract.expiration)}<div className="text-[11px] text-slate-500">{c.dte}d</div></td>
                      <td className="px-3 py-2 font-medium tabular-nums text-white">{money(c.contract.strike, c.contract.strike % 1 ? 2 : 0)}</td>
                      <td className="px-3 py-2 tabular-nums text-white">{money(c.credit)}</td>
                      <td className="px-3 py-2 tabular-nums text-slate-200"><DeltaCellDark c={c.contract} /></td>
                      <td className="px-3 py-2 tabular-nums text-emerald-400"><b>{pct(c.annYield, 1)}</b></td>
                      <td className="px-3 py-2 tabular-nums text-white">{pct(c.ifCalled, 1, true)}<div className="text-[11px] text-slate-500">{pct(c.annIfCalled, 0)}/yr</div></td>
                      <td className="px-3 py-2 tabular-nums text-slate-300">{pct(c.upsideToStrike, 1)}</td>
                      <td className="px-3 py-2 tabular-nums text-slate-300">{pct(c.spreadPct, 1)}<div className="text-[11px] text-slate-500">OI {c.contract.oi?.toLocaleString() ?? "N/A"}</div></td>
                      <td className="px-3 py-2"><div className="flex flex-col items-start gap-1">
                        <EarningsBadgeDark status={c.earnings} days={c.daysToEarnings} date={ctx?.nextEarnings} estimated={ctx?.earningsEstimated} />
                        {c.exDivInside && <WheelBadgeDark className="bg-sky-500/15 text-sky-300 ring-sky-500/20">ex-div {dateShort(ctx?.exDividend)}</WheelBadgeDark>}
                        {c.earlyAssignmentRisk === "high" && <span title="The strike is within 2% of the price and the time value is smaller than the dividend. If the stock rises a little, the buyer may exercise the day before the ex-dividend date to collect the dividend, taking your shares early."><WheelBadgeDark className="bg-rose-500/20 text-rose-300 ring-rose-500/30">early assignment risk</WheelBadgeDark></span>}
                        {c.earlyAssignmentRisk === "check" && <span title="An ex-dividend date falls before expiry. If the stock rallies above the strike before that date, early assignment becomes likely. Consider an expiry before the ex-date or a higher strike."><WheelBadgeDark className="bg-amber-500/15 text-amber-300 ring-amber-500/20">watch before ex-div</WheelBadgeDark></span>}
                      </div></td>
                      <td className="px-3 py-2 font-semibold tabular-nums text-white">{c.score.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t border-slate-800 bg-[#0D1632] px-3 py-2">
                <RejectsDark rejected={calls.rejected} evaluated={calls.evaluated} />
              </div>
            </div>
          )
        ) : null}
      </WheelCardDark>
      <p className="text-[11px] text-slate-500">Selling options carries real risk: a put seller can lose most of the share price if the stock collapses, and assignment ties up the full cash amount. This tool does not place orders or give personal advice.</p>
    </div>
  );
}
