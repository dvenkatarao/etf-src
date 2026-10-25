import Link from "next/link";
import { PortfolioAnalyticsSummary } from "@/lib/portfolio-service";
import { money, pct, num, erosionStyle } from "@/lib/format";
import { Badge } from "@/components/ui";

export default function BenchmarkAttribution({
  analytics,
}: {
  analytics: PortfolioAnalyticsSummary;
}) {
  const { benchmark, erosionAlerts } = analytics;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Benchmark Risk Attribution */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Benchmark Attribution vs S&P 500 ({benchmark.benchmarkTicker})
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Risk-adjusted performance &amp; sensitivity analysis
            </p>
          </div>
          <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
            {benchmark.benchmarkTicker}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
              Portfolio Beta
            </div>
            <div className="mt-1 text-xl font-bold tabular-nums text-slate-900">
              {benchmark.portfolioBeta !== null ? num(benchmark.portfolioBeta, 2) : "N/A"}
            </div>
            <div className="text-[10px] text-slate-400">
              {benchmark.portfolioBeta === null
                ? "Not enough price history"
                : benchmark.portfolioBeta < 1
                  ? "Less volatile than market"
                  : "More volatile than market"}
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-3">
            <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
              Portfolio Sharpe
            </div>
            <div className="mt-1 text-xl font-bold tabular-nums text-teal-700">
              {benchmark.portfolioSharpe !== null ? num(benchmark.portfolioSharpe, 2) : "N/A"}
            </div>
            <div className="text-[10px] text-slate-400">
              rf = {benchmark.riskFreeRate != null ? `${(benchmark.riskFreeRate * 100).toFixed(2)}%` : "unavailable"}
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-3">
            <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
              Weighted Expense
            </div>
            <div className="mt-1 text-xl font-bold tabular-nums text-slate-900">
              {pct(benchmark.weightedExpenseRatio, 2)}
            </div>
            <div className="text-[10px] text-slate-400">
              SPY = 0.09% · VOO = 0.03%
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-3">
            <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
              Annual Fee Drag
            </div>
            <div className="mt-1 text-xl font-bold tabular-nums text-rose-600">
              ~{money(benchmark.annualFeeDragDollars, 0)}
            </div>
            <div className="text-[10px] text-slate-400">Per year based on AUM</div>
          </div>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          {benchmark.statsBasis
            ? `Beta (vs ${benchmark.benchmarkTicker}) and Sharpe are computed from ${benchmark.statsBasis}. This is a backtest of today's holdings, not your actual account return.`
            : "Beta and Sharpe need at least ~6 months of stored price history covering 80% of the portfolio value; shown as N/A until then."}{" "}
          Fee drag is the annual cost implied by the funds&apos; expense ratios.
        </p>
      </div>

      {/* NAV Erosion Risk Diagnostics */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              NAV Erosion Risk Scanner
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Identifies covered-call or option-income ETFs paying yield out of capital
            </p>
          </div>
          {erosionAlerts.length > 0 ? (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
              {erosionAlerts.length} Flagged
            </span>
          ) : (
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              Healthy (0 Flagged)
            </span>
          )}
        </div>

        <div className="mt-4">
          {erosionAlerts.length === 0 ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-xs text-emerald-900">
              <span className="font-semibold">✓ No severe NAV erosion detected in your portfolio.</span>
              <p className="mt-1 text-emerald-700">
                All of your current holdings have demonstrated positive or stable capital return over the 3-year evaluation window.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {erosionAlerts.map((alert) => (
                <div
                  key={alert.ticker}
                  className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/50 p-3 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/etf/${alert.ticker}`}
                      className="font-bold text-teal-700 hover:underline"
                    >
                      {alert.ticker}
                    </Link>
                    <Badge className={erosionStyle[alert.level] || erosionStyle["n/a"]}>
                      {alert.level} Erosion
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold tabular-nums text-slate-900">
                      {money(alert.marketValue, 0)} ({pct(alert.weight, 1)})
                    </div>
                    <div className="text-[10px] text-amber-700">Share price decaying vs distributions</div>
                  </div>
                </div>
              ))}
              <p className="mt-2 text-[11px] text-slate-500">
                Warning: Funds with Moderate or Severe erosion generate high headline yields at the cost of long-term principal degradation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
