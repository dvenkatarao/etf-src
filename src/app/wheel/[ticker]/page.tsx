import Link from "next/link";
import { notFound } from "next/navigation";
import KeyLevels from "@/components/KeyLevels";
import StockGradeCard from "@/components/StockGradeCard";
import { AcctFlag, DeltaCell, EarningsBadge, SourceBadge } from "@/components/WheelBits";
import { Badge, Card, PageHeader, Stat, Unavailable } from "@/components/ui";
import { dateShort, money, num, pct } from "@/lib/format";
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

function Rejects({ rejected, evaluated }: { rejected: PutScan["rejected"]; evaluated: number }) {
  const parts = Object.entries(rejected).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0)).map(([k, n]) => `${n} ${REJECT_LABEL[k as keyof typeof REJECT_LABEL]}`);
  return <p className="mt-2 text-[11px] text-slate-400">{evaluated} contracts checked{parts.length ? `; filtered out: ${parts.join(" · ")}` : ""}.</p>;
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
      <div>
        <PageHeader title={ticker} description="This stock has not been analysed yet." />
        <Unavailable what="Stock data" why={row?.lastError ?? "Open the Wheel Screener first so the stock universe can load, or add the ticker with WHEEL_EXTRA_SYMBOLS."} />
        <Link href="/wheel" className="text-sm text-indigo-700 underline">← Wheel Screener</Link>
      </div>
    );
  }
  const g = gradeStock(row);
  let live: number | null = null;
  try {
    live = (await yahooQuotes([ticker]))[0]?.price ?? null;
  } catch {
    live = null;
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
      <PageHeader
        title={`${ticker} · ${row.name ?? ""}`}
        description={`${row.sector ?? ""}${row.industry ? ` · ${row.industry}` : ""}`}
        right={<Link href={`/wheel?${q}`} className="text-sm text-indigo-700 underline">← Wheel Screener</Link>}
      />
      {!isA && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">This stock is graded {g.grade ?? "n/a"}, below the A/A+ bar of the screener. Its options are shown for reference only.</div>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Price" value={money(ctx?.price ?? row.price)} sub={live != null ? "live (delayed)" : `last close ${row.technicals.asOf}`} />
        <Stat label="Next earnings" value={ev?.nextEarnings ? dateShort(ev.nextEarnings) : "unknown"} sub={earnDays != null ? `in ${earnDays} days${ev?.earningsEstimated ? " (estimated)" : ""}` : undefined} valueClass={earnDays != null && earnDays <= 14 ? "text-amber-700" : "text-slate-900"} />
        <Stat label="Next ex-dividend" value={ev?.exDividend && ev.exDividend >= today ? dateShort(ev.exDividend) : "none upcoming"} sub={ev?.dividendPerShare != null ? `${money(ev.dividendPerShare)}/yr · ${pct(ev.dividendYield, 2)} yield` : "no dividend"} />
        <Stat label="Analyst view" value={fu.recMean != null ? `${fu.recMean.toFixed(1)} / 5` : "N/A"} sub={fu.targetMean != null && fu.price ? `target ${money(fu.targetMean)} (${pct(fu.targetMean / fu.price - 1, 1, true)}) · ${fu.analystCount ?? "?"} analysts` : "1 = strong buy, 5 = sell"} />
      </div>

      <StockGradeCard quality={g.quality} />
      <KeyLevels t={row.technicals} livePrice={ctx?.price} />

      <Card title="Step 1 · Cash-secured puts" subtitle={`Delta ${p.deltaMin}–${p.deltaMax}, ${p.dteMin}–${p.dteMax} days, best first. If assigned you buy 100 shares at the strike.`} right={puts ? <SourceBadge source={puts.source} fallbackReason={puts.fallbackReason} /> : undefined}>
        {putErr ? (
          <Unavailable what="Option chain" why={putErr} />
        ) : !puts ? (
          <Unavailable what="Option chain" why="No price available." />
        ) : puts.candidates.length === 0 ? (
          <p className="text-sm text-slate-500">No put passes your filters.<Rejects rejected={puts.rejected} evaluated={puts.evaluated} />{!p.allowEarnings && (puts.rejected.earnings ?? 0) > 0 && <span className="text-xs text-amber-700"> Some were hidden because they expire after earnings; tick the earnings box on the screener to include them.</span>}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-[11px] uppercase tracking-wide text-slate-500"><tr>{["Expiry", "Strike", "Credit", "Delta", "Return /yr", "Breakeven", "Cushion", "σ out", "Liquidity", "IV / HV", "Flags", "Acct", "Score"].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100">
                {puts.candidates.slice(0, 20).map((c) => (
                  <tr key={c.contract.strike + c.contract.expiration} className="align-top">
                    <td className="whitespace-nowrap px-3 py-2">{dateShort(c.contract.expiration)}<div className="text-[11px] text-slate-400">{c.dte}d</div></td>
                    <td className="px-3 py-2 font-medium tabular-nums">{money(c.contract.strike, c.contract.strike % 1 ? 2 : 0)}<div className="text-[11px] text-slate-400">{pct(c.otmPct, 1)} below</div></td>
                    <td className="whitespace-nowrap px-3 py-2 tabular-nums">{money(c.credit)}<div className="text-[11px] text-slate-400">bid {money(c.contract.bid)} · ask {money(c.contract.ask)}</div></td>
                    <td className="px-3 py-2 tabular-nums"><DeltaCell c={c.contract} /></td>
                    <td className="px-3 py-2 tabular-nums"><b>{pct(c.annRoc, 1)}</b><div className="text-[11px] text-slate-400">{pct(c.roc, 2)} / trade</div></td>
                    <td className="px-3 py-2 tabular-nums">{money(c.breakeven)}{fu.targetMean ? <div className="text-[11px] text-slate-400" title="Effective cost if assigned vs the average analyst target.">{pct(1 - c.breakeven / fu.targetMean, 0)} below target</div> : null}</td>
                    <td className="px-3 py-2 tabular-nums">{pct(c.breakevenCushion, 1)}</td>
                    <td className="px-3 py-2 tabular-nums">{c.sigmaDistance != null ? c.sigmaDistance.toFixed(1) : "N/A"}</td>
                    <td className="px-3 py-2 tabular-nums">{pct(c.spreadPct, 1)}<div className="text-[11px] text-slate-400">OI {c.contract.oi?.toLocaleString() ?? "N/A"}</div></td>
                    <td className="px-3 py-2 tabular-nums">{c.contract.iv != null ? pct(c.contract.iv, 0) : "N/A"}{c.ivHv != null && <div className="text-[11px] text-slate-400">{c.ivHv.toFixed(2)}× realized</div>}</td>
                    <td className="px-3 py-2"><div className="flex flex-col items-start gap-1">
                      <EarningsBadge status={c.earnings} days={c.daysToEarnings} date={ctx?.nextEarnings} estimated={ctx?.earningsEstimated} />
                      {c.exDivInside && <Badge className="bg-sky-50 text-sky-800 ring-sky-200">ex-div inside</Badge>}
                      {c.supportAboveStrike && <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-200">support above</Badge>}
                      {c.belowSma200 && <Badge className="bg-rose-50 text-rose-700 ring-rose-200">below 200-day</Badge>}
                    </div></td>
                    <td className="px-3 py-2"><AcctFlag fit={c.account} /></td>
                    <td className="px-3 py-2 font-semibold tabular-nums">{c.score.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Rejects rejected={puts.rejected} evaluated={puts.evaluated} />
            <p className="mt-1 text-[11px] text-slate-400">Cash needed per contract = strike × 100. Credit is an estimated limit fill (25% of the way from bid to ask). Place a limit order, never a market order.</p>
          </div>
        )}
      </Card>

      <Card title="Step 2 · Covered calls (after assignment)" subtitle="Enter your cost per share (strike minus the premiums you collected) to see calls whose strike is at or above it, so being called away never locks in a loss.">
        <form method="GET" className="mb-3 flex flex-wrap items-end gap-3 text-sm">
          {Object.entries({ dteMin: p.dteMin, dteMax: p.dteMax, dMin: p.deltaMin, dMax: p.deltaMax, oi: p.minOi, spread: Math.round(p.maxSpreadPct * 100), ret: Math.round(p.minAnnReturn * 100) }).map(([k, v]) => <input key={k} type="hidden" name={k} value={String(v)} />)}
          {p.allowEarnings && <input type="hidden" name="earn" value="1" />}
          <label className="grid gap-1 text-xs text-slate-500">Your cost basis per share<input name="basis" defaultValue={basis ?? ""} placeholder={ctx ? num(ctx.price, 2) : ""} className="w-32 rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-900" /></label>
          <button className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700">Find calls</button>
        </form>
        {basis == null ? (
          <p className="text-sm text-slate-500">Enter a cost basis above. The guide explains how to work it out after an assignment.</p>
        ) : callErr ? (
          <Unavailable what="Call chain" why={callErr} />
        ) : calls ? (
          calls.candidates.length === 0 ? (
            <p className="text-sm text-slate-500">No call at or above {money(basis)} passes your filters.<Rejects rejected={calls.rejected} evaluated={calls.evaluated} />{ctx && basis > ctx.price * 1.1 && <span className="text-xs text-amber-700"> The stock is well below your cost; strikes at your cost may be too far out to pay much. Consider waiting or a longer expiry.</span>}</p>
          ) : (
            <div className="overflow-x-auto">
              <div className="mb-2"><SourceBadge source={calls.source} fallbackReason={calls.fallbackReason} /></div>
              <table className="min-w-full text-sm">
                <thead className="text-left text-[11px] uppercase tracking-wide text-slate-500"><tr>{["Expiry", "Strike", "Credit", "Delta", "Yield on cost /yr", "If called", "Upside to strike", "Liquidity", "Flags", "Score"].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {calls.candidates.slice(0, 15).map((c) => (
                    <tr key={c.contract.strike + c.contract.expiration} className="align-top">
                      <td className="whitespace-nowrap px-3 py-2">{dateShort(c.contract.expiration)}<div className="text-[11px] text-slate-400">{c.dte}d</div></td>
                      <td className="px-3 py-2 font-medium tabular-nums">{money(c.contract.strike, c.contract.strike % 1 ? 2 : 0)}</td>
                      <td className="px-3 py-2 tabular-nums">{money(c.credit)}</td>
                      <td className="px-3 py-2 tabular-nums"><DeltaCell c={c.contract} /></td>
                      <td className="px-3 py-2 tabular-nums"><b>{pct(c.annYield, 1)}</b></td>
                      <td className="px-3 py-2 tabular-nums">{pct(c.ifCalled, 1, true)}<div className="text-[11px] text-slate-400">{pct(c.annIfCalled, 0)}/yr</div></td>
                      <td className="px-3 py-2 tabular-nums">{pct(c.upsideToStrike, 1)}</td>
                      <td className="px-3 py-2 tabular-nums">{pct(c.spreadPct, 1)}<div className="text-[11px] text-slate-400">OI {c.contract.oi?.toLocaleString() ?? "N/A"}</div></td>
                      <td className="px-3 py-2"><div className="flex flex-col items-start gap-1">
                        <EarningsBadge status={c.earnings} days={c.daysToEarnings} date={ctx?.nextEarnings} estimated={ctx?.earningsEstimated} />
                        {c.exDivInside && <Badge className="bg-sky-50 text-sky-800 ring-sky-200">ex-div {dateShort(ctx?.exDividend)}</Badge>}
                        {c.earlyAssignmentRisk === "high" && <span title="The strike is within 2% of the price and the time value is smaller than the dividend. If the stock rises a little, the buyer may exercise the day before the ex-dividend date to collect the dividend, taking your shares early."><Badge className="bg-rose-100 text-rose-800 ring-rose-300">early assignment risk</Badge></span>}
                        {c.earlyAssignmentRisk === "check" && <span title="An ex-dividend date falls before expiry. If the stock rallies above the strike before that date, early assignment becomes likely. Consider an expiry before the ex-date or a higher strike."><Badge className="bg-amber-50 text-amber-800 ring-amber-200">watch before ex-div</Badge></span>}
                      </div></td>
                      <td className="px-3 py-2 font-semibold tabular-nums">{c.score.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Rejects rejected={calls.rejected} evaluated={calls.evaluated} />
            </div>
          )
        ) : null}
      </Card>
      <p className="mt-2 text-[11px] text-slate-400">Selling options carries real risk: a put seller can lose most of the share price if the stock collapses, and assignment ties up the full cash amount. This tool does not place orders or give personal advice.</p>
    </div>
  );
}
