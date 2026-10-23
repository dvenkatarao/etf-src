import Link from "next/link";
import { Suspense } from "react";
import LineChart from "@/components/LineChart";
import QualityCard from "@/components/QualityCard";
import { DistributionBars } from "@/components/SvgCharts";
import { Badge, Card, SourceNote, Stat, Unavailable } from "@/components/ui";
import { getRiskFree } from "@/lib/data";
import { REFRESH_TTL_MS, getAllEtfs, getEtf, getHistory, getHoldingsAnalystConsensus, getQuotes, refreshEtf, type EtfRow } from "@/lib/etf-service";
import { NA, big, colorFor, dateShort, erosionStyle, isLeveragedOrInverse, money, num, pct } from "@/lib/format";
import { alignedStats, iso, sharpe } from "@/lib/metrics";
import { qualityForRow } from "@/lib/quality";
import { rateTagForEtf } from "@/lib/etf-rate-sensitivity";
import { assetClassOf } from "@/lib/recommend";
import { getSpreadStats } from "@/lib/snapshots";
import { getSymbolNews } from "@/lib/news";
import { isValidTicker } from "@/lib/universe";
import { buildTakeaway } from "@/lib/etf-takeaway";
import EtfTakeaway from "@/components/etf/EtfTakeaway";
import PeerCompareCta from "@/components/etf/PeerCompareCta";
import { toScreenRow } from "@/lib/data";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function generateMetadata({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  return { title: `${ticker.toUpperCase()} ETF analysis · ETF Research Lab` };
}

const SECTOR_LABEL: Record<string, string> = {
  realestate: "Real estate",
  consumer_cyclical: "Consumer cyclical",
  basic_materials: "Basic materials",
  consumer_defensive: "Consumer defensive",
  technology: "Technology",
  communication_services: "Communication services",
  financial_services: "Financial services",
  utilities: "Utilities",
  industrials: "Industrials",
  energy: "Energy",
  healthcare: "Healthcare",
};

async function ensureEtf(ticker: string): Promise<{ row: EtfRow | null; error?: string }> {
  let row = await getEtf(ticker);
  const fresh = row?.metrics && row.refreshedAt && Date.now() - row.refreshedAt.getTime() < REFRESH_TTL_MS;
  if (fresh) return { row };
  try {
    row = await refreshEtf(ticker);
    return { row };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (row?.metrics) return { row, error: `Refresh failed (${msg}); showing last stored data.` };
    return { row: null, error: msg };
  }
}

function recLabel(x: number) {
  return x < 1.5 ? "Strong Buy" : x < 2.5 ? "Buy" : x < 3.5 ? "Hold" : x < 4.5 ? "Underperform" : "Sell";
}

export default async function EtfPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker: raw } = await params;
  const ticker = raw.toUpperCase();
  if (!isValidTicker(ticker)) return <Unavailable what="ETF" why="That does not look like a valid ticker symbol." />;

  const { row, error } = await ensureEtf(ticker);
  if (!row || !row.metrics) {
    return (
      <div className="mx-auto max-w-xl">
        <Card title={`${ticker} could not be loaded`}>
          <p className="text-sm text-slate-600">The data provider did not return usable ETF data for this symbol: <span className="font-mono text-xs">{error ?? "unknown error"}</span></p>
          <p className="mt-2 text-sm text-slate-500">Nothing is guessed. Check the ticker, or see provider status on the <Link className="text-indigo-700 underline" href="/sources">Data Sources</Link> page.</p>
        </Card>
      </div>
    );
  }

  const m = row.metrics;
  const p = row.profile;
  const [history, spy, { quotes }, rf, spreads, allEtfs] = await Promise.all([
    getHistory(ticker),
    ticker === "SPY" ? Promise.resolve(null) : getHistory("SPY"),
    getQuotes([ticker]),
    getRiskFree(),
    getSpreadStats(),
    getAllEtfs(),
  ]);
  const q = quotes.get(ticker);
  const quality = qualityForRow(row, q, spreads.get(ticker));
  const price = q?.price ?? row.lastClose;
  const stats = history && spy ? alignedStats(history, spy, 3) : null;
  const sh = sharpe(m, rf.rate);
  const leveraged = isLeveragedOrInverse(row.category, row.name);
  const premium = row.navPrice && price ? price / row.navPrice - 1 : null;
  const periods = ["1M", "3M", "6M", "YTD", "1Y", "3Y", "5Y", "10Y"] as const;
  const e = m.erosion;
  const d = m.dividends;
  const lastDivs = history ? history.d.slice(-12).reverse() : [];
  // Sprint D — takeaway
  const sectorTop = p?.sectors?.[0] ? { sector: p.sectors[0].sector, weight: p.sectors[0].weight } : null;
  const ac = assetClassOf(row.category, row.profile?.allocation);
  const rt = rateTagForEtf({ ticker, category: row.category, name: row.name, assetClass: ac });
  const takeaway = buildTakeaway({
    ticker, name: row.name, category: row.category,
    quality, expense: row.expenseRatio, yieldTtm: d.ttmYield, ttmAmount: d.ttmAmount, erosionLevel: e.level, priceRet3y: e.priceReturnAnn3y, capFunded: e.capitalFundedShare3y,
    vol3y: m.vol3y, dd3y: m.maxDrawdown3y, sharpe: sh, aum: row.totalAssets, rateTag: rt.tag, rateLabel: rt.label, leveraged,
    low52w: m.low52w, high52w: m.high52w, fromHigh: m.fromHigh52w, sectorTop, totalReturn3y: m.returns["3Y"].total,
  });
  // Sprint D — peers: same category or same asset class, sorted by AUM desc
  const peers = (() => {
    try {
      const sameCat = allEtfs.filter((r) => r.ticker !== ticker && r.category && row.category && r.category === row.category);
      const pool = sameCat.length >= 3 ? sameCat : allEtfs.filter((r) => r.ticker !== ticker && r.category && assetClassOf(r.category, (r.profile as any)?.allocation) === ac);
      return pool.slice(0, 8).map((r) => ({ ticker: r.ticker, name: r.name, category: r.category, expense: r.expenseRatio, yieldTtm: (r.metrics as any)?.dividends?.ttmYield ?? null }))
        .sort((a, b) => (b.expense != null && a.expense != null ? 0 : 0)); // keep original order (AUM in DB is approx)
    } catch { return []; }
  })();

  return (
    <div className="space-y-6">
      {error && <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800">{error}</div>}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-semibold tracking-tight">{ticker}</h1>
              {row.category && <Badge className="bg-indigo-50 text-indigo-700 ring-indigo-200">{row.category}</Badge>}
              {row.exchange && <Badge className="bg-slate-50 text-slate-600 ring-slate-200">{row.exchange}</Badge>}
              {leveraged && <Badge className="bg-rose-50 text-rose-700 ring-rose-200">Leveraged / inverse - not for buy-and-hold</Badge>}
              {(() => { const ac = assetClassOf(row.category, row.profile?.allocation); const rt = rateTagForEtf({ ticker, category: row.category, name: row.name, assetClass: ac }); return <Badge className={rt.color} title={rt.hint}>{rt.label}</Badge>; })()}
            </div>
            <p className="mt-1 text-slate-600">{row.name ?? NA}</p>
            <p className="text-xs text-slate-500">Issuer: {row.family ?? NA} · Inception {row.inceptionDate ?? NA}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-semibold tabular-nums">{money(price)}</div>
            <div className={`text-sm font-medium tabular-nums ${colorFor(q?.changePct)}`}>
              {q?.changePct != null ? `${q.changePct > 0 ? "+" : ""}${q.changePct.toFixed(2)}% today` : "Day change N/A"}
            </div>
            <div className="text-[11px] text-slate-400">Delayed quote{q?.marketState ? ` · market ${q.marketState.toLowerCase()}` : ""} · last daily bar {dateShort(m.asOf)}</div>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
          <Stat label="Expense ratio" value={pct(row.expenseRatio)} sub="Annual report" hint="Fund-reported annual operating expense ratio" />
          <Stat label="Yield (TTM)" value={pct(d.ttmYield)} sub={`Provider: ${pct(row.reportedYield)}`} hint="Computed: sum of last-12-month distributions ÷ price" />
          <Stat label="AUM" value={big(row.totalAssets)} />
          <Stat label="Distributions" value={d.frequency} sub={d.lastExDate ? `Last ex-date ${dateShort(d.lastExDate)}` : undefined} />
          <Stat label="Beta vs SPY (3Y)" value={stats?.beta != null ? num(stats.beta, 2) : NA} sub={`Provider 3Y beta: ${row.beta3y != null ? num(row.beta3y, 2) : NA}`} />
          <Stat label="Turnover" value={pct(row.turnover, 0)} sub="Annual holdings" />
        </div>
        {row.navPrice != null && (
          <p className="mt-3 text-xs text-slate-500">
            Provider NAV snapshot {money(row.navPrice)} → price {premium != null && premium >= 0 ? "premium" : "discount"} of {pct(premium != null ? Math.abs(premium) : null)}. The NAV date is not supplied by the provider, so treat as indicative only.
          </p>
        )}
      </section>

      <QualityCard quality={quality} />

      <EtfTakeaway t={takeaway} ticker={ticker} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PeerCompareCta ticker={ticker} peers={peers} />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs leading-relaxed text-slate-600">
          <b className="text-slate-800">What to do next</b>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li><Link className="text-indigo-700 underline" href={`/compare?t=${[ticker, ...peers.slice(0,2).map(p=>p.ticker)].join(",")}`}>Compare vs peers head-to-head</Link> — growth overlay + correlation.</li>
            <li><Link className="text-indigo-700 underline" href={`/recommend?goal=balanced`}>See balanced picks</Link> or <Link className="text-indigo-700 underline" href="/screener">screen by yield / expense</Link>.</li>
            <li>New? <Link className="text-indigo-700 underline" href="/onboarding">3-question starter</Link> builds a portfolio you can edit.</li>
          </ul>
        </div>
      </div>

      <Card title="Price history" subtitle="Hover for exact values · split-adjusted close">
        {history ? (
          <LineChart mode="price" defaultRange="3Y" series={[{ key: ticker, name: ticker, color: "#4f46e5", t: history.t, v: history.c }]} />
        ) : (
          <Unavailable what="Price history" />
        )}
        <SourceNote source="Yahoo Finance chart API (unofficial)" asOf={`${dateShort(m.firstBar)} → ${dateShort(m.asOf)} · ${m.bars.toLocaleString()} daily bars`} fetchedAt={row.refreshedAt?.toISOString()} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Performance" subtitle="Price return excludes distributions; total return reinvests them. Periods over 1 year are annualised.">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2 text-left font-medium">Period</th>
                  <th className="py-2 text-right font-medium">Price return</th>
                  <th className="py-2 text-right font-medium">Total return</th>
                  <th className="py-2 text-right font-medium">Distribution effect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {periods.map((k) => {
                  const r = m.returns[k];
                  const diff = r.total != null && r.price != null ? r.total - r.price : null;
                  return (
                    <tr key={k}>
                      <td className="py-2 font-medium">{k}{r.annualised && <span className="ml-1 text-[10px] text-slate-400">ann.</span>}</td>
                      <td className={`py-2 text-right tabular-nums ${colorFor(r.price)}`}>{pct(r.price, 2, true)}</td>
                      <td className={`py-2 text-right tabular-nums font-medium ${colorFor(r.total)}`}>{pct(r.total, 2, true)}</td>
                      <td className="py-2 text-right tabular-nums text-slate-500">{diff != null ? pct(diff, 2, true) : NA}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Provider-reported cross-check (fund-level, may use a different date basis): YTD {pct(p?.reported.ytdReturn)} · 3Y avg {pct(p?.reported.threeYearAvgReturn)} · 5Y avg {pct(p?.reported.fiveYearAvgReturn)}.
          </p>
          <SourceNote source="Computed from Yahoo adjusted-close series" asOf={dateShort(m.asOf)} />
        </Card>

        <Card title="Risk" subtitle="Computed from daily total-return series">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Volatility 1Y" value={pct(m.vol1y, 1)} />
            <Stat label="Volatility 3Y" value={pct(m.vol3y, 1)} />
            <Stat label="Max drawdown 3Y" value={pct(m.maxDrawdown3y, 1)} valueClass="text-rose-600" />
            <Stat label="Max drawdown 5Y" value={pct(m.maxDrawdown5y, 1)} valueClass="text-rose-600" />
            <Stat label="Sharpe 3Y" value={sh != null ? num(sh, 2) : NA} sub={rf.rate != null ? `rf = 3M T-bill ${(rf.rate * 100).toFixed(2)}%` : "risk-free rate unavailable"} />
            <Stat label="Correlation vs SPY" value={stats?.corr != null ? num(stats.corr, 2) : NA} sub={stats ? `${stats.n} aligned days` : undefined} />
            <Stat label="52-week range" value={m.low52w != null && m.high52w != null ? `${num(m.low52w, 2)} – ${num(m.high52w, 2)}` : NA} />
            <Stat label="From 52-week high" value={pct(m.fromHigh52w, 1)} valueClass={colorFor(m.fromHigh52w)} />
          </div>
          <SourceNote source="Computed (formulas in Data Sources spec) · FRED DGS3MO" asOf={dateShort(m.asOf)} />
        </Card>
      </div>

      <Card
        title="Distributions & dividend growth"
        right={<Badge className="bg-slate-50 text-slate-600 ring-slate-200">{d.frequency}</Badge>}
        subtitle="Per-share distributions by ex-dividend date (includes capital-gain and return-of-capital components - the provider does not split them out)"
      >
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
          <Stat label="TTM per share" value={d.ttmAmount != null ? money(d.ttmAmount, 3) : NA} sub={`${d.ttmCount} payments`} />
          <Stat label="TTM yield" value={pct(d.ttmYield)} />
          <Stat label="Last payment" value={d.lastAmount != null ? money(d.lastAmount, 4) : NA} sub={dateShort(d.lastExDate)} />
          <Stat label="Growth vs prior 12M" value={pct(d.growth1y, 1, true)} valueClass={colorFor(d.growth1y)} />
          <Stat label="3Y distribution CAGR" value={pct(d.cagr3y, 1, true)} valueClass={colorFor(d.cagr3y)} />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">{history ? <DistributionBars data={history.d} /> : <Unavailable what="Distribution history" />}</div>
          <div className="max-h-52 overflow-y-auto text-sm">
            <table className="w-full">
              <thead className="text-[11px] uppercase tracking-wide text-slate-500">
                <tr><th className="py-1 text-left font-medium">Ex-date</th><th className="py-1 text-right font-medium">Amount</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lastDivs.map(([t, a]) => (
                  <tr key={t}><td className="py-1">{dateShort(iso(t))}</td><td className="py-1 text-right tabular-nums">{money(a, 4)}</td></tr>
                ))}
                {!lastDivs.length && <tr><td colSpan={2} className="py-3 text-center text-slate-500">No distributions on record</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        <SourceNote source="Yahoo Finance chart API (dividend events)" fetchedAt={row.refreshedAt?.toISOString()} />
      </Card>

      <Card
        title="NAV erosion analysis"
        right={<Badge className={erosionStyle[e.level]}>{e.level === "n/a" ? "Not enough history" : `${e.level} erosion`}</Badge>}
        subtitle="Does the share price decay while the fund pays out income? Market-price based proxy - see method note."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Price return 1Y" value={pct(e.priceReturnAnn1y, 1, true)} valueClass={colorFor(e.priceReturnAnn1y)} />
              <Stat label="Price return 3Y ann." value={pct(e.priceReturnAnn3y, 1, true)} valueClass={colorFor(e.priceReturnAnn3y)} />
              <Stat label="Price return 5Y ann." value={pct(e.priceReturnAnn5y, 1, true)} valueClass={colorFor(e.priceReturnAnn5y)} />
              <Stat label="Distributions / yr (3Y avg)" value={pct(e.distYieldAnn3y, 1)} sub="% of price 3 years ago" />
              <Stat label="Total return 3Y ann." value={pct(e.totalReturnAnn3y, 1, true)} valueClass={colorFor(e.totalReturnAnn3y)} />
              <Stat label="Payout funded by price decay" value={e.capitalFundedShare3y != null ? pct(e.capitalFundedShare3y, 0) : NA} sub="Share of 3Y distributions offset by price loss" />
            </div>
            <p className="mt-4 text-xs leading-relaxed text-slate-500">
              <strong>Method:</strong> level is based on annualised 3-year price return (1-year if 3Y history is unavailable): None ≥ 0%, Mild &gt; −2%/yr, Moderate &gt; −6%/yr, Severe ≤ −6%/yr (heuristic thresholds). Payout funded by price decay = min(1, −price return ÷ distribution yield) when price return is negative. This is a proxy from market prices; the authoritative measure is the return-of-capital percentage in the fund&apos;s Section 19(a) notices, which no free API provides. A falling price can also reflect market declines, not only distributions.
            </p>
          </div>
          <div>
            {history ? (
              <LineChart
                mode="growth"
                defaultRange="3Y"
                label="Growth of $10,000: price only vs total return (gap = distributions reinvested)"
                series={[
                  { key: "tr", name: "Total return", color: "#059669", t: history.t, v: history.a },
                  { key: "pr", name: "Price only", color: "#e11d48", t: history.t, v: history.c },
                ]}
                height={260}
              />
            ) : (
              <Unavailable what="Erosion chart" />
            )}
          </div>
        </div>
        <SourceNote source="Computed from Yahoo close vs adjusted-close series" asOf={dateShort(m.asOf)} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Top holdings" subtitle={p?.holdings.length ? `Top ${p.holdings.length} positions only (provider does not return the full portfolio)` : undefined}>
          {p?.holdings.length ? (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                {p.holdings.map((h, i) => (
                  <tr key={i}>
                    <td className="py-1.5 pr-3 font-semibold text-slate-700">{h.symbol && /^[A-Z.\-]{1,6}$/.test(h.symbol) ? h.symbol : "-"}</td>
                    <td className="py-1.5 pr-3 text-slate-600">{h.name}</td>
                    <td className="py-1.5 text-right tabular-nums">{pct(h.weight)}</td>
                  </tr>
                ))}
                <tr><td colSpan={2} className="pt-2 text-xs text-slate-500">Top positions combined</td><td className="pt-2 text-right text-xs tabular-nums text-slate-500">{pct(p.holdings.reduce((s, h) => s + (h.weight ?? 0), 0))}</td></tr>
              </tbody>
            </table>
          ) : (
            <Unavailable what="Holdings" why="The provider returned no holdings for this fund. Authoritative holdings are in SEC N-PORT filings and the issuer's website." />
          )}
          <SourceNote source="Yahoo Finance quoteSummary: topHoldings" fetchedAt={row.refreshedAt?.toISOString()} />
        </Card>

        <Card title="Sector & asset mix">
          {p?.sectors.length ? (
            <div className="space-y-1.5">
              {p.sectors.filter((s) => s.weight > 0).map((s) => (
                <div key={s.sector} className="flex items-center gap-2 text-xs">
                  <div className="w-36 truncate text-slate-600">{SECTOR_LABEL[s.sector] ?? s.sector}</div>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(100, s.weight * 100)}%` }} /></div>
                  <div className="w-12 text-right tabular-nums">{pct(s.weight, 1)}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Sector weights not provided for this fund type.</p>
          )}
          {p && (
            <p className="mt-4 text-xs text-slate-500">
              Allocation: stocks {pct(p.allocation.stock, 1)} · bonds {pct(p.allocation.bond, 1)} · cash {pct(p.allocation.cash, 1)} · other {pct(p.allocation.other, 1)}
            </p>
          )}
          <SourceNote source="Yahoo Finance quoteSummary: topHoldings" />
        </Card>
      </div>

      <Suspense fallback={<Card title="Analyst consensus"><p className="text-sm text-slate-500">Loading analyst data for top holdings…</p></Card>}>
        <AnalystPanel ticker={ticker} />
      </Suspense>

      <Suspense fallback={<Card title="Latest headlines"><p className="text-sm text-slate-500">Loading headlines…</p></Card>}>
        <NewsPanel ticker={ticker} />
      </Suspense>

      <p className="text-xs text-slate-400">
        Data for {ticker} last refreshed {row.refreshedAt ? row.refreshedAt.toISOString().replace("T", " ").slice(0, 16) + " UTC" : NA}. Sources: {Object.values(row.sources ?? {}).join(" · ")}.
      </p>
    </div>
  );
}

async function AnalystPanel({ ticker }: { ticker: string }) {
  const res = await getHoldingsAnalystConsensus(ticker);
  return (
    <Card
      title="Analyst consensus (holdings-weighted)"
      subtitle="No free source rates ETFs directly. This aggregates Wall Street analyst ratings of the fund's top holdings, weighted by fund weight."
    >
      {!res ? (
        <Unavailable what="Analyst consensus" why="This fund's top holdings are not equities with analyst coverage (e.g. bond, commodity or crypto funds), or the provider returned no coverage. Nothing is estimated." />
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Weighted rating" value={res.consensus.recMean != null ? `${recLabel(res.consensus.recMean)}` : NA} sub={res.consensus.recMean != null ? `${num(res.consensus.recMean, 2)} on 1 (Strong Buy) – 5 (Sell)` : undefined} />
            <Stat label="Implied upside to targets" value={pct(res.consensus.upside, 1, true)} valueClass={colorFor(res.consensus.upside)} sub="Mean analyst target vs price" />
            <Stat label="Fund weight covered" value={pct(res.consensus.coverageWeight, 1)} sub={`of ${pct(res.consensus.totalListedWeight, 1)} listed top-holding weight`} />
            <Stat label="Holdings counted" value={`${res.consensus.counted} / ${res.consensus.listed}`} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2 text-left font-medium">Holding</th>
                  <th className="py-2 text-right font-medium">Weight</th>
                  <th className="py-2 text-right font-medium">Rating (1–5)</th>
                  <th className="py-2 text-right font-medium">Buy / Hold / Sell</th>
                  <th className="py-2 text-right font-medium"># analysts</th>
                  <th className="py-2 text-right font-medium">Mean target</th>
                  <th className="py-2 text-right font-medium">Upside</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {res.items.map((h) => (
                  <tr key={h.symbol}>
                    <td className="py-1.5"><span className="font-semibold">{h.symbol}</span> <span className="text-xs text-slate-500">{h.name}</span></td>
                    <td className="py-1.5 text-right tabular-nums">{pct(h.weight, 1)}</td>
                    <td className="py-1.5 text-right tabular-nums">{h.recMean != null ? `${num(h.recMean, 2)} · ${recLabel(h.recMean)}` : NA}</td>
                    <td className="py-1.5 text-right tabular-nums">{h.trend ? `${h.trend.strongBuy + h.trend.buy} / ${h.trend.hold} / ${h.trend.sell + h.trend.strongSell}` : NA}</td>
                    <td className="py-1.5 text-right tabular-nums">{h.analysts ?? NA}</td>
                    <td className="py-1.5 text-right tabular-nums">{money(h.targetMean)}</td>
                    <td className={`py-1.5 text-right tabular-nums ${colorFor(h.upside)}`}>{pct(h.upside, 1, true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <SourceNote source="Yahoo Finance financialData & recommendationTrend (stock-level analyst data), aggregated by this app" />
    </Card>
  );
}

async function NewsPanel({ ticker }: { ticker: string }) {
  const res = await getSymbolNews(ticker, 8);
  return (
    <Card title="Latest headlines">
      {res && res.data.length ? (
        <ul className="divide-y divide-slate-100 text-sm">
          {res.data.map((n) => (
            <li key={n.link} className="py-2">
              <a href={n.link} target="_blank" rel="noreferrer" className="font-medium text-slate-800 hover:text-indigo-700">{n.title}</a>
              <div className="text-[11px] text-slate-400">{dateShort(n.date)}</div>
            </li>
          ))}
        </ul>
      ) : (
        <Unavailable what="Headlines" />
      )}
      <SourceNote source="Yahoo Finance headline RSS (links to publishers)" fetchedAt={res?.fetchedAt} stale={res?.stale} />
    </Card>
  );
}
