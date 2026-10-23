import { PortfolioAnalyticsSummary } from "@/lib/portfolio-service";
import { money, pct, colorFor, num } from "@/lib/format";

export default function PortfolioSummaryCards({
  analytics,
}: {
  analytics: PortfolioAnalyticsSummary;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
          Total Portfolio Value
        </div>
        <div className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
          {money(analytics.totalMarketValue)}
        </div>
        <div className="mt-0.5 text-xs text-slate-500">
          Cost basis: {money(analytics.totalCostBasis)}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
          Today&apos;s Change
        </div>
        <div
          className={`mt-1 text-2xl font-bold tabular-nums ${colorFor(analytics.todayPl)}`}
        >
          {analytics.todayPl > 0 ? "+" : ""}
          {money(analytics.todayPl)}
        </div>
        <div className={`mt-0.5 text-xs font-semibold tabular-nums ${colorFor(analytics.todayPlPct)}`}>
          {pct(analytics.todayPlPct, 2, true)} today
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
          Total Unrealized Gain
        </div>
        <div
          className={`mt-1 text-2xl font-bold tabular-nums ${colorFor(analytics.totalUnrealizedGain)}`}
        >
          {analytics.totalUnrealizedGain > 0 ? "+" : ""}
          {money(analytics.totalUnrealizedGain)}
        </div>
        <div
          className={`mt-0.5 text-xs font-semibold tabular-nums ${colorFor(
            analytics.totalUnrealizedGainPct,
          )}`}
        >
          {pct(analytics.totalUnrealizedGainPct, 2, true)} all-time
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
          TTM Dividend Income
        </div>
        <div className="mt-1 text-2xl font-bold tabular-nums text-emerald-600">
          {money(analytics.annualDividendIncome)}
          <span className="text-xs font-normal text-slate-400">/yr</span>
        </div>
        <div className="mt-0.5 text-xs text-slate-500">
          Yield: <span className="font-semibold text-emerald-700">{pct(analytics.portfolioYieldPct)}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
          Weighted Expense Ratio
        </div>
        <div className="mt-1 text-2xl font-bold tabular-nums text-indigo-700">
          {pct(analytics.weightedExpenseRatio, 2)}
        </div>
        <div className="mt-0.5 text-xs text-slate-500">
          Fee drag: ~{money(analytics.annualFeeDollars, 0)}/yr
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
          Portfolio Beta vs SPY
        </div>
        <div className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
          {analytics.benchmark.portfolioBeta !== null
            ? num(analytics.benchmark.portfolioBeta, 2)
            : "1.00"}
        </div>
        <div className="mt-0.5 text-xs text-slate-500">
          Sharpe:{" "}
          <span className="font-semibold text-slate-700">
            {analytics.benchmark.portfolioSharpe !== null
              ? num(analytics.benchmark.portfolioSharpe, 2)
              : "N/A"}
          </span>
        </div>
      </div>
    </div>
  );
}
