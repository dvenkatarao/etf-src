import { PortfolioAnalyticsSummary } from "@/lib/portfolio-service";
import { money, pct } from "@/lib/format";

export default function PortfolioAllocationCharts({
  analytics,
}: {
  analytics: PortfolioAnalyticsSummary;
}) {
  const { sectorBreakdown, assetClassBreakdown, positions } = analytics;
  const topHoldings = positions.slice(0, 5);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* 1. Asset Class Breakdown */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Asset Class Allocation</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Aggregated across all connected broker accounts
        </p>

        <div className="mt-4 space-y-3">
          {assetClassBreakdown.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">No asset data available</div>
          ) : (
            assetClassBreakdown.map((ac) => (
              <div key={ac.assetClass}>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-700">{ac.assetClass}</span>
                  <span className="text-slate-900 tabular-nums">
                    {pct(ac.weight, 1)} ({money(ac.marketValue, 0)})
                  </span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all"
                    style={{ width: `${Math.min(100, Math.max(1, ac.weight * 100))}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 2. Look-Through Sector Breakdown */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Look-Through Sector Exposure</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Weighted underlying sectors from all ETF holdings
        </p>

        <div className="mt-4 space-y-2.5">
          {sectorBreakdown.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">No sector data available</div>
          ) : (
            sectorBreakdown.map((sec) => (
              <div key={sec.sector}>
                <div className="flex justify-between text-xs font-medium">
                  <span className="truncate pr-2 text-slate-700">{sec.sector}</span>
                  <span className="text-slate-900 tabular-nums">{pct(sec.weight, 1)}</span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-600 transition-all"
                    style={{ width: `${Math.min(100, Math.max(1, sec.weight * 100))}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. Holdings Concentration */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Top 5 Holdings Concentration</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Portfolio weight &amp; dollar exposure
        </p>

        <div className="mt-4 space-y-3">
          {topHoldings.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">No positions loaded</div>
          ) : (
            topHoldings.map((p, idx) => (
              <div key={p.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="grid h-5 w-5 place-items-center rounded bg-slate-100 text-[10px] font-bold text-slate-600">
                    {idx + 1}
                  </span>
                  <div>
                    <span className="font-semibold text-indigo-700">{p.ticker}</span>
                    <span className="ml-1 text-[11px] text-slate-400">
                      ({p.quantity.toFixed(1)} shs)
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold tabular-nums text-slate-900">
                    {money(p.marketValue, 0)}
                  </div>
                  <div className="text-[10px] text-slate-500">{pct(p.weight, 1)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
