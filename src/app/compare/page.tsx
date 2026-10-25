import CompareOverlap from "@/components/CompareOverlap";
import LineChart from "@/components/LineChart";
import TickerPicker from "@/components/TickerPicker";
import { Badge, Card, PageHeader, SourceNote, TickerLink, Unavailable } from "@/components/ui";
import { CompareIcon, PageIcon } from "@/components/icons/AppIcons";
import { getRiskFree } from "@/lib/data";
import { getEtf, getHistories, refreshEtf, type EtfRow } from "@/lib/etf-service";
import { NA, big, dateShort, erosionStyle, num, pct } from "@/lib/format";
import { alignedStats, sharpe } from "@/lib/metrics";
import { UNIVERSE, isValidTicker } from "@/lib/universe";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
export const metadata = { title: "Compare ETFs · Capital Lab" };

const COLORS = ["#0f766e", "#059669", "#d97706", "#db2777", "#0891b2"];

type Line = { label: string; group: string; value: (r: EtfRow, extra: { sharpe: number | null; beta: number | null }) => number | null; fmt: (x: number | null) => string; better?: "high" | "low" };

const LINES: Line[] = [
  { group: "Cost & size", label: "Expense ratio", value: (r) => r.expenseRatio, fmt: (x) => pct(x), better: "low" },
  { group: "Cost & size", label: "AUM", value: (r) => r.totalAssets, fmt: big, better: "high" },
  { group: "Cost & size", label: "Portfolio turnover", value: (r) => r.turnover, fmt: (x) => pct(x, 0), better: "low" },
  { group: "Income", label: "Yield (TTM, computed)", value: (r) => r.metrics?.dividends.ttmYield ?? null, fmt: (x) => pct(x), better: "high" },
  { group: "Income", label: "Distribution growth vs prior 12M", value: (r) => r.metrics?.dividends.growth1y ?? null, fmt: (x) => pct(x, 1, true), better: "high" },
  { group: "Income", label: "3Y distribution CAGR", value: (r) => r.metrics?.dividends.cagr3y ?? null, fmt: (x) => pct(x, 1, true), better: "high" },
  { group: "Total return", label: "YTD", value: (r) => r.metrics?.returns.YTD.total ?? null, fmt: (x) => pct(x, 1, true), better: "high" },
  { group: "Total return", label: "1Y", value: (r) => r.metrics?.returns["1Y"].total ?? null, fmt: (x) => pct(x, 1, true), better: "high" },
  { group: "Total return", label: "3Y annualised", value: (r) => r.metrics?.returns["3Y"].total ?? null, fmt: (x) => pct(x, 1, true), better: "high" },
  { group: "Total return", label: "5Y annualised", value: (r) => r.metrics?.returns["5Y"].total ?? null, fmt: (x) => pct(x, 1, true), better: "high" },
  { group: "Total return", label: "10Y annualised", value: (r) => r.metrics?.returns["10Y"].total ?? null, fmt: (x) => pct(x, 1, true), better: "high" },
  { group: "Risk", label: "Volatility 3Y", value: (r) => r.metrics?.vol3y ?? null, fmt: (x) => pct(x, 1), better: "low" },
  { group: "Risk", label: "Max drawdown 3Y", value: (r) => r.metrics?.maxDrawdown3y ?? null, fmt: (x) => pct(x, 1), better: "high" },
  { group: "Risk", label: "Sharpe 3Y", value: (_r, e) => e.sharpe, fmt: (x) => (x == null ? NA : num(x, 2)), better: "high" },
  { group: "Risk", label: "Beta vs SPY (3Y)", value: (_r, e) => e.beta, fmt: (x) => (x == null ? NA : num(x, 2)) },
  { group: "NAV erosion", label: "Price return 3Y ann.", value: (r) => r.metrics?.erosion.priceReturnAnn3y ?? null, fmt: (x) => pct(x, 1, true), better: "high" },
  { group: "NAV erosion", label: "Payout funded by price decay", value: (r) => r.metrics?.erosion.capitalFundedShare3y ?? null, fmt: (x) => pct(x, 0), better: "low" },
];

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  const requested = (t ?? "SPY,QQQ,SCHD").split(",").map((s) => s.trim().toUpperCase()).filter((s) => isValidTicker(s));
  const tickers = Array.from(new Set(requested)).slice(0, 5);

  const loaded = await Promise.all(
    tickers.map(async (tk) => {
      let row = await getEtf(tk);
      let err: string | undefined;
      if (!row?.metrics) {
        try {
          row = await refreshEtf(tk);
        } catch (e) {
          err = e instanceof Error ? e.message : String(e);
        }
      }
      return { tk, row: row?.metrics ? row : null, err };
    }),
  );
  const ok = loaded.filter((x) => x.row) as { tk: string; row: EtfRow; err?: string }[];
  const failed = loaded.filter((x) => !x.row);
  const hist = await getHistories([...ok.map((x) => x.tk), "SPY"]);
  const rf = await getRiskFree();
  const spyH = hist["SPY"];

  const extras = ok.map(({ tk, row }) => ({
    sharpe: sharpe(row.metrics, rf.rate),
    beta: tk === "SPY" ? 1 : hist[tk] && spyH ? alignedStats(hist[tk], spyH, 3).beta : null,
  }));

  const groups = Array.from(new Set(LINES.map((l) => l.group)));

  return (
    <div>
      <PageHeader icon={<PageIcon label="Compare"><CompareIcon size={22} /></PageIcon>} title="Compare ETFs" description="Overlay growth of $10,000 (total return) and compare cost, income, return, risk and NAV-erosion side by side. The best value in each row is highlighted when 'better' is unambiguous." />
      <div className="space-y-6">
        <TickerPicker current={tickers} suggestions={UNIVERSE} />
        {failed.length > 0 && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800">
            Could not load: {failed.map((f) => `${f.tk} (${f.err ?? "no data"})`).join(", ")}. These are omitted rather than estimated.
          </div>
        )}
        {ok.length < 1 ? (
          <Unavailable what="Comparison" why="Pick at least one ETF with provider data." />
        ) : (
          <>
            <Card title="Growth of $10,000">
              <LineChart
                mode="growth"
                defaultRange="5Y"
                height={340}
                series={ok.map(({ tk }, i) => ({ key: tk, name: tk, color: COLORS[i % COLORS.length], t: hist[tk]?.t ?? [], v: hist[tk]?.a ?? [] }))}
              />
              <SourceNote source="Yahoo Finance adjusted-close series (distributions reinvested)" asOf={ok.map((x) => x.row.metrics!.asOf).sort().slice(-1)[0]} />
            </Card>

            <Card title="Side-by-side metrics">
              <div className="cl-table-scroll cl-table-comfy overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left">
                      <th className="py-2 pr-4 text-[11px] font-medium uppercase tracking-wide text-slate-500">Metric</th>
                      {ok.map(({ tk, row }, i) => (
                        <th key={tk} className="px-3 py-2 text-right">
                          <span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                          <TickerLink t={tk} />
                          <div className="max-w-[160px] truncate text-[11px] font-normal text-slate-500" title={row.name ?? ""}>{row.name ?? NA}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="py-2 pr-4 text-slate-600">Category</td>
                      {ok.map(({ tk, row }) => (
                        <td key={tk} className="px-3 py-2 text-right text-xs text-slate-600">{row.category ?? NA}</td>
                      ))}
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-2 pr-4 text-slate-600">NAV-erosion level</td>
                      {ok.map(({ tk, row }) => (
                        <td key={tk} className="px-3 py-2 text-right"><Badge className={erosionStyle[row.metrics!.erosion.level]}>{row.metrics!.erosion.level}</Badge></td>
                      ))}
                    </tr>
                    {groups.map((g) => (
                      <GroupRows key={g} group={g} lines={LINES.filter((l) => l.group === g)} ok={ok} extras={extras} />
                    ))}
                  </tbody>
                </table>
              </div>
              <SourceNote source="Yahoo Finance (profile, prices, distributions) · computed metrics · FRED DGS3MO" asOf={dateShort(ok.map((x) => x.row.metrics!.asOf).sort().slice(-1)[0])} />
            </Card>

            <CompareOverlap rows={ok.map((x) => x.row)} />

            {ok.length > 1 && (
              <Card title="Correlation of daily returns (3Y)" subtitle="Low correlation between holdings = more diversification. Computed on date-aligned daily total returns.">
                <div className="overflow-x-auto">
                  <table className="text-sm">
                    <thead>
                      <tr>
                        <th />
                        {ok.map(({ tk }) => (
                          <th key={tk} className="px-3 py-1 text-xs font-semibold text-slate-600">{tk}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ok.map(({ tk: a }) => (
                        <tr key={a}>
                          <th className="pr-3 text-right text-xs font-semibold text-slate-600">{a}</th>
                          {ok.map(({ tk: b }) => {
                            const c = a === b ? 1 : hist[a] && hist[b] ? alignedStats(hist[a], hist[b], 3).corr : null;
                            const shade = c == null ? "#f1f5f9" : `rgba(79,70,229,${Math.max(0.08, Math.min(0.9, c))})`;
                            return (
                              <td key={b} className="px-1 py-1">
                                <div className="grid h-10 w-16 place-items-center rounded-md text-xs font-semibold tabular-nums" style={{ background: shade, color: c != null && c > 0.55 ? "#fff" : "#1e293b" }}>
                                  {c == null ? NA : c.toFixed(2)}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function GroupRows({ group, lines, ok, extras }: { group: string; lines: Line[]; ok: { tk: string; row: EtfRow }[]; extras: { sharpe: number | null; beta: number | null }[] }) {
  return (
    <>
      <tr>
        <td colSpan={ok.length + 1} className="bg-slate-50 px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{group}</td>
      </tr>
      {lines.map((l) => {
        const vals = ok.map(({ row }, i) => l.value(row, extras[i]));
        let best = -1;
        if (l.better && vals.filter((v) => v != null).length > 1) {
          vals.forEach((v, i) => {
            if (v == null) return;
            if (best < 0 || (l.better === "high" ? v > vals[best]! : v < vals[best]!)) best = i;
          });
        }
        return (
          <tr key={l.label} className="border-b border-slate-100">
            <td className="py-2 pr-4 text-slate-600">{l.label}</td>
            {vals.map((v, i) => (
              <td key={ok[i].tk} className={`px-3 py-2 text-right tabular-nums ${i === best ? "bg-emerald-50 font-semibold text-emerald-700" : ""}`}>{l.fmt(v)}</td>
            ))}
          </tr>
        );
      })}
    </>
  );
}
