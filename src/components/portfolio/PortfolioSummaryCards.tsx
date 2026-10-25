import type { ReactNode } from "react";
import { PortfolioAnalyticsSummary } from "@/lib/portfolio-service";
import { money, pct, colorFor, num } from "@/lib/format";

export default function PortfolioSummaryCards({
  analytics,
}: {
  analytics: PortfolioAnalyticsSummary;
}) {
  const cells: { label: string; value: ReactNode; sub: ReactNode; valueClass?: string }[] = [
    {
      label: "Value",
      value: money(analytics.totalMarketValue),
      sub: <>Cost {money(analytics.totalCostBasis)}</>,
    },
    {
      label: "Today",
      value: (
        <>
          {analytics.todayPl > 0 ? "+" : ""}
          {money(analytics.todayPl)}
        </>
      ),
      sub: <>{pct(analytics.todayPlPct, 2, true)}</>,
      valueClass: colorFor(analytics.todayPl),
    },
    {
      label: "Unrealized",
      value: (
        <>
          {analytics.totalUnrealizedGain > 0 ? "+" : ""}
          {money(analytics.totalUnrealizedGain)}
        </>
      ),
      sub: <>{pct(analytics.totalUnrealizedGainPct, 2, true)}</>,
      valueClass: colorFor(analytics.totalUnrealizedGain),
    },
    {
      label: "TTM yield",
      value: pct(analytics.portfolioYieldPct),
      sub: <>{money(analytics.annualDividendIncome)}/yr</>,
      valueClass: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Expense",
      value: pct(analytics.weightedExpenseRatio, 2),
      sub: <>~{money(analytics.annualFeeDollars, 0)}/yr</>,
    },
    {
      label: "Beta vs SPY",
      value: analytics.benchmark.portfolioBeta !== null ? num(analytics.benchmark.portfolioBeta, 2) : "1.00",
      sub: <>Sharpe {analytics.benchmark.portfolioSharpe !== null ? num(analytics.benchmark.portfolioSharpe, 2) : "N/A"}</>,
    },
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0F1A3A]">
      <div className="flex min-w-[760px] divide-x divide-slate-200 dark:divide-slate-800">
        {cells.map((c) => (
          <div key={c.label} className="flex-1 px-4 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">{c.label}</div>
            <div className={`mt-1 font-mono text-xl font-semibold tabular-nums text-slate-900 dark:text-white ${c.valueClass ?? ""}`}>
              {c.value}
            </div>
            <div className="mt-0.5 text-[11px] text-slate-500">{c.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
