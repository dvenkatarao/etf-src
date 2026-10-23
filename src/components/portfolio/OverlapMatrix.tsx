"use client";

import { PortfolioAnalyticsSummary } from "@/lib/portfolio-service";

export default function OverlapMatrix({ analytics }: { analytics: PortfolioAnalyticsSummary }) {
  const overlap = analytics.overlap;
  if (!overlap || overlap.tickers.length < 2) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Holdings Overlap (Top-10 Lower Bound)</h3>
        <p className="mt-0.5 text-xs text-slate-500">Common holdings across your ETFs — conservative estimate from top-10 only (full N-PORT would show more).</p>
        <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-400">
          Overlap needs ≥2 ETFs with holdings data. Import at least two equity ETFs and refresh (holdings come from Yahoo topHoldings).
        </div>
      </div>
    );
  }
  const { tickers, cells } = overlap;
  const byPair = new Map<string, (typeof cells)[0]>();
  for (const c of cells) byPair.set(`${c.a}|${c.b}`, c);

  const colOf = (v: number) => {
    if (v >= 0.5) return "bg-rose-600 text-white";
    if (v >= 0.25) return "bg-amber-500 text-white";
    if (v >= 0.1) return "bg-amber-200 text-slate-900";
    if (v >= 0.02) return "bg-slate-100 text-slate-700";
    return "bg-white text-slate-500 ring-1 ring-slate-200";
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Holdings Overlap (Top-10 Lower Bound)</h3>
          <p className="mt-0.5 text-xs text-slate-500">Pairwise overlap = Σ min(weight in A, weight in B) across common names. Full portfolio overlap would be higher.</p>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">{tickers.length} tickers</span>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="text-xs">
          <thead>
            <tr>
              <th className="p-1" />
              {tickers.map((t) => (
                <th key={t} className="px-2 py-1 text-center font-semibold text-slate-600">{t}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tickers.map((a) => (
              <tr key={a}>
                <th className="pr-2 text-right font-semibold text-slate-600">{a}</th>
                {tickers.map((b) => {
                  const c = byPair.get(`${a}|${b}`) ?? byPair.get(`${b}|${a}`);
                  if (!c) return <td key={b} className="p-1"><div className="grid h-8 w-12 place-items-center rounded-md bg-slate-50 text-[11px] text-slate-400">—</div></td>;
                  const commonTip = c.common.slice(0, 5).map((x) => `${x.symbol} ${ (x.wa*100).toFixed(1)}% / ${ (x.wb*100).toFixed(1)}%`).join(" · ") || "No common top-10";
                  return (
                    <td key={b} className="p-1" title={`${a} vs ${b}: ${(c.overlapPct).toFixed(1)}% overlap. ${commonTip}`}>
                      <div className={`grid h-8 w-12 place-items-center rounded-md text-[11px] font-semibold tabular-nums ${colOf(c.overlap)}`}>
                        {a === b ? "—" : `${(c.overlapPct).toFixed(0)}%`}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
        Darker = more overlap. Example: VOO vs SPY often shows <b>~85%+</b> (same S&amp;P 500). VOO+QQQ can show 15-30% (both hold AAPL/MSFT). Diversification isn&apos;t just different tickers — it&apos;s different <em>holdings</em>. Hover a cell for the top common names. Lower bound because only top-10 are known.
      </p>
    </div>
  );
}
