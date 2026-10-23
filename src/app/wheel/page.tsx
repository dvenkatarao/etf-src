import Link from "next/link";
import WheelHydrator from "@/components/WheelHydrator";
import { AcctFlag, DeltaCell, EarningsBadge, SourceBadge } from "@/components/WheelBits";
import { Badge, PageHeader, SourceNote } from "@/components/ui";
import { ago, dateShort, money, pct } from "@/lib/format";
import { stockGradeStyle } from "@/lib/stock-quality";
import { staleStocks } from "@/lib/stock-service";
import { stockUniverse } from "@/lib/stock-universe";
import { REJECT_LABEL } from "@/lib/wheel";
import { filtersQuery, parseFilters, type SP } from "@/lib/wheel-filters";
import { getWheelResults, staleScanTickers, todayIso } from "@/lib/wheel-service";
import { alpacaConfigured } from "@/lib/options-providers";
import { getEnv } from "@/lib/env";

export const dynamic = "force-dynamic";
export const metadata = { title: "Wheel Screener · ETF Research Lab" };

const inp = "w-20 rounded-md border border-slate-300 px-2 py-1 text-sm";

export default async function WheelPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const f = parseFilters(sp);
  const [res, staleS, staleScans] = await Promise.all([getWheelResults(f), staleStocks(), staleScanTickers()]);
  const today = todayIso();
  const env = getEnv();
  const p = f.params;
  const q = filtersQuery(f);

  return (
    <div>
      <PageHeader
        title="Wheel Screener"
        description="Cash-secured puts on A and A+ rated large-cap stocks, ranked by return, safety and liquidity. Earnings, ex-dividend dates, key price levels and the better account type (R = retirement, T = taxable) are shown for every pick."
        right={<Link href="/wheel/guide" className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500">How to use this tool →</Link>}
      />
      <WheelHydrator staleStocks={staleS.length} staleScans={staleScans.length} total={stockUniverse().length} />

      <form method="GET" className="mb-4 rounded-xl border border-slate-200 bg-white p-4 text-sm">
        <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
          <label className="grid gap-1 text-xs text-slate-500">Stock grade
            <select name="grade" defaultValue={f.minGrade} className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-900"><option value="A">A and A+</option><option value="A+">A+ only</option></select>
          </label>
          <label className="grid gap-1 text-xs text-slate-500">Days to expiry
            <span className="flex items-center gap-1"><input name="dteMin" defaultValue={p.dteMin} className={inp} /> to <input name="dteMax" defaultValue={p.dteMax} className={inp} /></span>
          </label>
          <label className="grid gap-1 text-xs text-slate-500">Delta (absolute)
            <span className="flex items-center gap-1"><input name="dMin" defaultValue={p.deltaMin} className={inp} /> to <input name="dMax" defaultValue={p.deltaMax} className={inp} /></span>
          </label>
          <label className="grid gap-1 text-xs text-slate-500">Min open interest <input name="oi" defaultValue={p.minOi} className={inp} /></label>
          <label className="grid gap-1 text-xs text-slate-500">Max bid/ask gap % <input name="spread" defaultValue={Math.round(p.maxSpreadPct * 100)} className={inp} /></label>
          <label className="grid gap-1 text-xs text-slate-500">Min annual return % <input name="ret" defaultValue={Math.round(p.minAnnReturn * 100)} className={inp} /></label>
          <label className="grid gap-1 text-xs text-slate-500">Account
            <select name="acct" defaultValue={f.account} className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-900"><option value="all">All</option><option value="R">R (retirement)</option><option value="T">T (taxable)</option></select>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" name="earn" value="1" defaultChecked={p.allowEarnings} /> Include options that expire after earnings</label>
          <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" name="trend" value="1" defaultChecked={f.trendOnly} /> Only stocks above their 200-day average</label>
          <button className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700">Apply</button>
          <Link href="/wheel" className="text-xs text-slate-500 underline">reset</Link>
        </div>
      </form>

      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-600">
        <span>{res.info.eligible} stocks graded {f.minGrade === "A+" ? "A+" : "A or A+"} of {res.info.hydrated} analysed</span>·
        <span>{res.info.scanned} option chains scanned</span>·
        <span>option data: {Object.entries(res.info.sources).map(([k, n]) => `${k} ${n}`).join(", ") || "none yet"}</span>
        {res.info.oldest && <>· <span>oldest scan {ago(res.info.oldest.toISOString())}</span></>}
        {!alpacaConfigured() && env.OPTIONS_PROVIDER === "auto" && <Badge className="bg-amber-50 text-amber-800 ring-amber-200">Alpaca keys not set: using Yahoo (deltas modelled)</Badge>}
        {res.info.fallbacks > 0 && <Badge className="bg-amber-50 text-amber-800 ring-amber-200">{res.info.fallbacks} chains came from the backup provider</Badge>}
      </div>

      {res.earningsWatch.length > 0 && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="text-sm font-semibold text-amber-900">Earnings watch: A/A+ stocks reporting within 3 weeks</h3>
          <p className="mt-1 text-xs text-amber-800">Premiums on these look rich because the market is pricing in a big move. A report can gap the stock through your strike overnight, so options that expire after the report are hidden unless you tick the box above.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {res.earningsWatch.map((e) => (
              <Link key={e.g.row.ticker} href={`/wheel/${e.g.row.ticker}?${q}`} className="rounded-lg bg-white px-2.5 py-1 text-xs ring-1 ring-amber-200 hover:bg-amber-100">
                <b>{e.g.row.ticker}</b> · {e.days}d · {dateShort(e.ctx.nextEarnings)}{e.estimated ? " (est.)" : ""}
              </Link>
            ))}
          </div>
        </div>
      )}

      {res.rows.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center text-slate-500">
          {res.info.scanned === 0
            ? "No option chains have been scanned yet. If the progress bar above has finished, check the Data Sources page and your Alpaca keys; failed scans are listed below."
            : "No puts pass these filters right now. Try widening the delta or expiry range, lowering the minimum return, or relaxing the bid/ask limit."}
          {Object.keys(res.rejected).length > 0 && (
            <p className="mt-2 text-xs">Contracts rejected: {Object.entries(res.rejected).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0)).map(([k, n]) => `${n} ${REJECT_LABEL[k as keyof typeof REJECT_LABEL]}`).join(" · ")}</p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                {["Stock", "Grade", "Acct", "Price", "Events", "Put to sell", "Credit", "Delta", "Return /yr", "Cushion", "Liquidity", "Trend", "Score"].map((h) => (
                  <th key={h} className="whitespace-nowrap px-3 py-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {res.rows.map((r) => {
                const b = r.best;
                const c = b.contract;
                const t = r.g.row.technicals!;
                return (
                  <tr key={r.g.row.ticker} className="align-top hover:bg-slate-50">
                    <td className="px-3 py-2">
                      <Link href={`/wheel/${r.g.row.ticker}?${q}`} className="font-semibold text-indigo-700 hover:underline">{r.g.row.ticker}</Link>
                      <div className="max-w-[160px] truncate text-xs text-slate-500">{r.g.row.name}</div>
                      <div className="text-[11px] text-slate-400">{r.g.row.sector}</div>
                    </td>
                    <td className="px-3 py-2"><Badge className={stockGradeStyle[r.g.grade ?? "none"]}>{r.g.grade}</Badge></td>
                    <td className="px-3 py-2"><AcctFlag fit={b.account} /></td>
                    <td className="px-3 py-2 tabular-nums">{money(r.ctx.price)}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col items-start gap-1">
                        <EarningsBadge status={b.earnings} days={b.daysToEarnings} date={r.ctx.nextEarnings} estimated={r.ctx.earningsEstimated} />
                        {b.exDivInside && <span title={`Ex-dividend ${dateShort(r.ctx.exDividend)} falls before expiry. The stock drops by about the dividend that day.`}><Badge className="bg-sky-50 text-sky-800 ring-sky-200">ex-div {dateShort(r.ctx.exDividend)}</Badge></span>}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <div className="font-medium tabular-nums">{money(c.strike, c.strike % 1 ? 2 : 0)} P</div>
                      <div className="text-xs text-slate-500">{dateShort(c.expiration)} · {b.dte}d</div>
                      <div className="mt-0.5 flex items-center gap-1"><SourceBadge source={r.source} fallbackReason={r.fallbackReason} />{r.count > 1 && <span className="text-[11px] text-slate-400">+{r.count - 1} more</span>}</div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 tabular-nums">{money(b.credit)}<div className="text-[11px] text-slate-400">{money(b.credit * 100, 0)} / contract</div></td>
                    <td className="px-3 py-2 tabular-nums"><DeltaCell c={c} /><div className="text-[11px] text-slate-400">{pct(b.probOtm, 0)} chance OTM</div></td>
                    <td className="px-3 py-2 tabular-nums"><b>{pct(b.annRoc, 1)}</b><div className="text-[11px] text-slate-400">{pct(b.roc, 2)} per trade</div></td>
                    <td className="px-3 py-2 tabular-nums">{pct(b.breakevenCushion, 1)}<div className="text-[11px] text-slate-400">breakeven {money(b.breakeven)}</div>{r.g.row.fundamentals?.targetMean ? <div className="text-[11px] text-slate-400" title="Your effective cost if assigned (strike minus premium) compared with the average analyst price target.">{pct(1 - b.breakeven / r.g.row.fundamentals.targetMean, 0)} below analyst target</div> : null}{b.sigmaDistance != null && <div className="text-[11px] text-slate-400">{b.sigmaDistance.toFixed(1)}σ out</div>}</td>
                    <td className="px-3 py-2 tabular-nums">{pct(b.spreadPct, 1)} gap<div className="text-[11px] text-slate-400">OI {c.oi?.toLocaleString() ?? "N/A"}</div></td>
                    <td className="px-3 py-2 text-xs">
                      <div className={t.aboveSma200 ? "text-emerald-700" : "text-rose-700"}>{t.aboveSma200 ? "above" : "below"} 200-day</div>
                      <div className="text-slate-500">RSI {t.rsi14?.toFixed(0) ?? "N/A"}</div>
                      {b.supportAboveStrike && <div className="text-emerald-700" title="A support level sits between the strike and today's price.">support above strike ✓</div>}
                    </td>
                    <td className="px-3 py-2 font-semibold tabular-nums">{b.score.toFixed(1)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {res.heldBackByEarnings.length > 0 && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {res.heldBackByEarnings.length} more stock(s) have good puts only after earnings and are hidden: {res.heldBackByEarnings.map((h) => h.ticker).join(", ")}. Tick &quot;Include options that expire after earnings&quot; to see them (flagged in red).
        </p>
      )}
      {res.info.failed.length > 0 && (
        <details className="mt-3 text-xs text-slate-500"><summary className="cursor-pointer">{res.info.failed.length} option scan(s) failed (left out, not guessed)</summary>
          <ul className="mt-1 list-disc pl-5">{res.info.failed.slice(0, 20).map((x) => <li key={x.ticker}><b>{x.ticker}</b>: {x.error}</li>)}</ul>
        </details>
      )}
      <SourceNote source="Stock data: Yahoo Finance (unofficial) · Options: Alpaca (primary) with Yahoo as backup" asOf={today} />
      <p className="mt-1 text-[11px] text-slate-400">Scores = return per year × chance the put expires worthless × liquidity × structure bonus/penalties. Stock and option data may be delayed. Fills usually land between the bid and the mid price.</p>
      <p className="mt-2 text-[11px] text-slate-400">Selling options carries real risk: a put seller can lose most of the share price if the stock collapses, and assignment ties up the full cash amount. This tool does not place orders or give personal advice.</p>
    </div>
  );
}
