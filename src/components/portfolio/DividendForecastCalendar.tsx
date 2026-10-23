import { MonthlyDividendEstimate } from "@/lib/portfolio-service";
import { money } from "@/lib/format";

export default function DividendForecastCalendar({
  monthlyDividends,
  annualTotal,
}: {
  monthlyDividends: MonthlyDividendEstimate[];
  annualTotal: number;
}) {
  const maxAmount = Math.max(...monthlyDividends.map((m) => m.amount), 1);
  const avgMonthly = annualTotal / 12;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            12-Month Projected Dividend Income Calendar
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Estimated cashflow generation based on historical payout schedules &amp; frequencies
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-500">Average monthly cashflow: </span>
          <span className="text-sm font-bold tabular-nums text-emerald-600">
            {money(avgMonthly, 0)}/mo
          </span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-6 gap-2 sm:grid-cols-12">
        {monthlyDividends.map((m) => {
          const heightPct = Math.max(12, Math.round((m.amount / maxAmount) * 100));
          return (
            <div key={m.month} className="flex flex-col items-center">
              <div className="text-[10px] font-semibold tabular-nums text-slate-600">
                {m.amount > 0 ? `$${Math.round(m.amount)}` : "$0"}
              </div>
              <div className="mt-1 flex h-24 w-full items-end justify-center rounded-lg bg-slate-50 p-1">
                <div
                  className="w-full rounded bg-emerald-500 transition-all hover:bg-emerald-600"
                  style={{ height: `${heightPct}%` }}
                  title={`${m.month}: ${money(m.amount)}`}
                />
              </div>
              <div className="mt-1.5 text-[11px] font-medium text-slate-500">{m.month}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span>Includes monthly, quarterly, and semi-annual distribution estimates</span>
        <span className="font-semibold text-slate-700">
          Total Forecast: {money(annualTotal, 0)} / year
        </span>
      </div>
    </div>
  );
}
