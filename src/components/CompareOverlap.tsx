import { Badge } from "@/components/ui";
import type { EtfRow } from "@/lib/etf-service";
import { overlapMatrixForPortfolio } from "@/lib/portfolio-overlap";

export default function CompareOverlap({ rows }: { rows: EtfRow[] }) {
  if (rows.length < 2) return null;
  const profiles = new Map(rows.map((r) => [r.ticker, r.profile?.holdings ?? null] as [string, any]));
  const matrix = overlapMatrixForPortfolio(rows.map((r) => ({ ticker: r.ticker })), profiles);
  const { tickers, cells } = matrix;
  const byPair = new Map(cells.map((c) => [`${c.a}|${c.b}`, c] as const));

  const tone = (v: number) => {
    if (v >= 0.5) return "bg-rose-600 text-white";
    if (v >= 0.25) return "bg-amber-500 text-white";
    if (v >= 0.1) return "bg-amber-200 text-slate-900";
    if (v >= 0.02) return "bg-slate-100 text-slate-700";
    return "bg-white text-slate-500 ring-1 ring-slate-200";
  };

  const maxOverlap = Math.max(...cells.filter((c) => c.a !== c.b).map((c) => c.overlap), 0);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">Holdings Overlap (Top-10 Lower Bound)</h3>
      <p className="mt-0.5 text-xs text-slate-500">Σ min(weight in A, weight in B) over common names. Diagonal = self. {maxOverlap > 0.4 ? `High overlap detected (${(maxOverlap*100).toFixed(0)}%) — you may not be diversifying as much as tickers suggest.` : "Lower values mean more diversification."}</p>
      <div className="mt-4 overflow-x-auto">
        <table className="text-xs">
          <thead>
            <tr><th className="p-1" />{tickers.map((t) => <th key={t} className="px-2 py-1 text-center font-semibold text-slate-600">{t}</th>)}</tr>
          </thead>
          <tbody>
            {tickers.map((a) => (
              <tr key={a}>
                <th className="pr-2 text-right font-semibold text-slate-600">{a}</th>
                {tickers.map((b) => {
                  const c = byPair.get(`${a}|${b}`) ?? byPair.get(`${b}|${a}`);
                  if (!c) return <td key={b} className="p-1"><div className="grid h-8 w-12 place-items-center rounded-md bg-slate-50 text-[11px] text-slate-400">—</div></td>;
                  const tip = c.common.slice(0, 5).map((x) => `${x.symbol} ${(x.wa*100).toFixed(1)}%/${(x.wb*100).toFixed(1)}%`).join(" · ") || "No common top-10";
                  return (
                    <td key={b} className="p-1" title={`${a} vs ${b}: ${(c.overlapPct).toFixed(1)}% overlap. ${tip}`}>
                      <div className={`grid h-8 w-12 place-items-center rounded-md text-[11px] font-semibold tabular-nums ${tone(c.overlap)}`}>{a === b ? "—" : `${(c.overlapPct).toFixed(0)}%`}</div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-slate-400">Only top-10 disclosed holdings are compared, so real overlap is ≥ shown. Hover a cell for the common names. Use this to spot &apos;VOO+SPY&apos; duplicates or &apos;VTI+VXUS&apos; complements.</p>
    </div>
  );
}
