import Hydrator from "@/components/Hydrator";
import Screener from "@/components/Screener";
import { PageHeader, SourceNote } from "@/components/ui";
import { getRiskFree, toScreenRow } from "@/lib/data";
import { getAllEtfs, getQuotes, staleTickers } from "@/lib/etf-service";
import { getSpreadStats } from "@/lib/snapshots";
import { UNIVERSE } from "@/lib/universe";

export const dynamic = "force-dynamic";
export const metadata = { title: "ETF Screener · ETF Research Lab" };

export default async function ScreenerPage() {
  const [rows, stale] = await Promise.all([getAllEtfs(), staleTickers()]);
  const [{ quotes, fetchedAt, stale: qStale }, rf, spreads] = await Promise.all([getQuotes(rows.map((r) => r.ticker)), getRiskFree(), getSpreadStats()]);
  const data = rows.map((r) => toScreenRow(r, quotes.get(r.ticker), rf.rate, { spread: spreads.get(r.ticker) }));
  const asOf = rows.map((r) => r.metrics?.asOf).filter(Boolean).sort().slice(-1)[0];

  return (
    <div>
      <PageHeader
        title="ETF Screener"
        description="Filter and rank US-listed ETFs on cost, income, return, risk and NAV-erosion. Every column is either a provider value or computed from provider price and distribution history - hover column headers for definitions. Missing values show N/A and sort last."
      />
      <Hydrator remaining={stale.length} total={UNIVERSE.length} />
      {data.length > 0 ? <Screener rows={data} /> : stale.length === 0 && <p className="rounded-xl bg-white p-8 text-center text-slate-500">No ETF data could be loaded from the provider. Check the Data Sources page for provider status.</p>}
      <SourceNote source="Yahoo Finance (unofficial): prices, distributions, fund profile · FRED DGS3MO: risk-free rate for Sharpe" asOf={asOf ? `last daily bar ${asOf}` : null} fetchedAt={fetchedAt} stale={qStale} />
      <p className="mt-1 text-[11px] text-slate-400">
        Daily bars/profile refresh every 12 h; prices are delayed quotes refreshed every 60 s. Sharpe uses 3M T-bill {rf.rate != null ? `${(rf.rate * 100).toFixed(2)}% (${rf.date})` : "unavailable → Sharpe shown as N/A"}.
      </p>
    </div>
  );
}
