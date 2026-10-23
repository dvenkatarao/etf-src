import Hydrator from "@/components/Hydrator";
import { Badge, Card, GradeBadge, PageHeader, SourceNote, TickerLink, Unavailable } from "@/components/ui";
import { getRiskFree, toScreenRow } from "@/lib/data";
import { getAllEtfs, getQuotes, staleTickers } from "@/lib/etf-service";
import { NA, erosionStyle, pct } from "@/lib/format";
import { isLowGrade } from "@/lib/grades";
import { getSpreadStats } from "@/lib/snapshots";
import { GOALS, METRICS, METRIC_KEYS, resolveWeights, scoreGoal, type Goal, type Metric, type Scored } from "@/lib/recommend";
import { UNIVERSE } from "@/lib/universe";
import RecommendExport from "@/components/RecommendExport";

export const dynamic = "force-dynamic";
export const metadata = { title: "Goal-based ETF picks · ETF Research Lab" };

const AUM_OPTIONS = [
  { v: "0", l: "Any size" },
  { v: "100000000", l: "≥ $100M" },
  { v: "1000000000", l: "≥ $1B" },
  { v: "10000000000", l: "≥ $10B" },
];

export default async function RecommendPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const goal = (sp.goal && sp.goal in GOALS ? sp.goal : "balanced") as Goal;
  const minAum = Number(sp.aum ?? "1000000000") || 0;
  const includeLev = sp.lev === "1";
  const includeSevere = sp.sev === "1";
  // Funds graded D or F on quality are hidden unless asked for: a good-looking chart never outranks a poorly built product.
  const showLow = sp.lowq === "1";
  const catFilter = sp.cat ?? "";
  // Peer group for percentile ranks: within asset class (default, like-for-like) or one pool across all classes.
  const byClass = sp.rank !== "all";
  // Custom weights only apply when the "use my weights" box is ticked, so changing the goal resets to its defaults.
  const useCustom = sp.custom === "1";
  const customWeights: Partial<Record<Metric, number>> = {};
  for (const m of METRIC_KEYS) {
    const v = Number(sp[`w_${m}`]);
    if (Number.isFinite(v) && v > 0) customWeights[m] = Math.min(v, 100);
  }
  const weights = resolveWeights(goal, useCustom ? customWeights : null);
  const customActive = useCustom && weights !== GOALS[goal].weights;
  const weightPct = (m: Metric) => Math.round((weights.find((w) => w.metric === m)?.w ?? 0) * 100);

  const [rows, stale] = await Promise.all([getAllEtfs(), staleTickers()]);
  const [{ quotes }, rf, spreads] = await Promise.all([getQuotes(rows.map((r) => r.ticker)), getRiskFree(), getSpreadStats()]);
  const all = rows.map((r) => toScreenRow(r, quotes.get(r.ticker), rf.rate, { spread: spreads.get(r.ticker) }));
  const categories = Array.from(new Set(all.map((r) => r.category).filter((x): x is string => !!x))).sort();
  // Income picks exclude funds whose share price is decaying fast (NAV erosion "Severe") unless the user opts in:
  // an extreme trailing yield funded by principal loss is not what an income investor is looking for.
  const eligibleBase = all.filter(
    (r) =>
      (includeLev || !r.leveraged) &&
      (r.aum ?? 0) >= minAum &&
      (!catFilter || r.category === catFilter) &&
      (goal !== "income" || includeSevere || r.erosion !== "Severe"),
  );
  const hiddenLowQuality = showLow ? 0 : eligibleBase.filter((r) => isLowGrade(r.quality)).length;
  const eligible = showLow ? eligibleBase : eligibleBase.filter((r) => !isLowGrade(r.quality));
  const excludedSevere = goal === "income" && !includeSevere ? all.filter((r) => r.erosion === "Severe" && (includeLev || !r.leveraged) && (r.aum ?? 0) >= minAum).length : 0;
  const scoredAll = scoreGoal(eligible, goal, { weights, peerKey: byClass ? (r) => r.assetClass : undefined });
  const CLASS_ORDER = ["Equity", "Fixed income", "Commodities & crypto", "Cash-like", "Other"];
  const PER_CLASS = 5;
  const groups: { name: string | null; rows: Scored[]; total: number }[] = byClass
    ? CLASS_ORDER.map((c) => {
        const rows = scoredAll.filter((x) => x.row.assetClass === c);
        return { name: c, rows: rows.slice(0, PER_CLASS), total: rows.length };
      }).filter((g) => g.total > 0)
    : [{ name: null, rows: scoredAll.slice(0, 15), total: scoredAll.length }];
  const shown = groups.reduce((n, g) => n + g.rows.length, 0);
  const unrankedClasses = byClass
    ? CLASS_ORDER.filter((c) => eligible.some((r) => r.assetClass === c) && !scoredAll.some((x) => x.row.assetClass === c))
    : [];
  const spec = GOALS[goal];
  const field = "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none";

  return (
    <div>
      <PageHeader title="Goal-based ETF picks" description="A transparent, rule-based ranking - not personalised advice. Funds graded D or F on quality are hidden by default. Each metric is percentile-ranked against its peers (by default ETFs in the same asset class), then combined with the published weights below. ETFs missing too much data are excluded rather than imputed." />
      <Hydrator remaining={stale.length} total={UNIVERSE.length} />

      <form method="GET" className="mb-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-6">
        <select name="goal" defaultValue={goal} className={field} aria-label="Goal">
          {Object.entries(GOALS).map(([k, g]) => (
            <option key={k} value={k}>{g.label}</option>
          ))}
        </select>
        <select name="aum" defaultValue={String(minAum)} className={field} aria-label="Minimum AUM">
          {AUM_OPTIONS.map((o) => (
            <option key={o.v} value={o.v}>{o.l}</option>
          ))}
        </select>
        <select name="cat" defaultValue={catFilter} className={field} aria-label="Category">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select name="rank" defaultValue={byClass ? "class" : "all"} className={field} aria-label="Ranking peer group">
          <option value="class">Rank within asset class</option>
          <option value="all">Rank across all ETFs</option>
        </select>
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="lev" value="1" defaultChecked={includeLev} className="h-4 w-4 accent-indigo-600" /> Include leveraged / inverse
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="sev" value="1" defaultChecked={includeSevere} className="h-4 w-4 accent-indigo-600" /> Income: include severe NAV erosion
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="lowq" value="1" defaultChecked={showLow} className="h-4 w-4 accent-indigo-600" /> Show low-grade funds (D/F)
          </label>
        </div>
        <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">Rank ETFs</button>

        <details open={useCustom} className="rounded-lg border border-slate-200 bg-slate-50 p-3 sm:col-span-2 lg:col-span-6">
          <summary className="cursor-pointer text-sm font-medium text-slate-700">Edit weights {customActive ? <span className="ml-1 text-xs font-normal text-indigo-600">(custom in use)</span> : null}</summary>
          <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="custom" value="1" defaultChecked={useCustom} className="h-4 w-4 accent-indigo-600" /> Use my weights instead of the goal&apos;s defaults
          </label>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {METRIC_KEYS.map((m) => (
              <label key={m} className="text-xs text-slate-600">
                <span className="block">{METRICS[m].label}</span>
                <span className="mb-1 block text-[10px] text-slate-400">{METRICS[m].hint ?? (METRICS[m].higherIsBetter ? "higher is better" : "lower is better")}</span>
                <input type="number" name={`w_${m}`} min={0} max={100} step={1} defaultValue={weightPct(m)} className={`${field} w-full`} />
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">Enter any relative weights (0 = ignore). They are scaled to total 100%, so 2 and 1 behave the same as 66 and 33. Directions are fixed.</p>
        </details>
      </form>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title={`Top ${spec.label.toLowerCase()} candidates${customActive ? " (custom weights)" : ""}`} subtitle={`${shown} shown from ${eligible.length} eligible ETFs · ranked ${byClass ? "within asset class" : "across all ETFs"}`} className="lg:col-span-2" right={<RecommendExport scored={groups.flatMap((g) => g.rows).map((s) => ({ row: { ticker: s.row.ticker, name: s.row.name, category: s.row.category, quality: s.row.quality, expense: s.row.expense, yieldTtm: s.row.yieldTtm, r3y: s.row.r3y, vol3y: s.row.vol3y, erosion: s.row.erosion }, score: s.score, coverage: s.coverage }))} goal={goal} />}>
          {shown === 0 ? (
            <Unavailable what="Rankings" why="No ETFs passed the filters with enough real data. Loosen the filters or wait for the data load to finish." />
          ) : (
            <div className="space-y-6">
              {groups.map((g) => (
                <div key={g.name ?? "all"} className="overflow-x-auto">
                  {g.name && (
                    <h3 className="mb-1 text-sm font-semibold text-slate-800">
                      {g.name} <span className="text-xs font-normal text-slate-400">top {g.rows.length} of {g.total} ranked</span>
                    </h3>
                  )}
                  <table className="min-w-full text-sm">
                    <thead className="text-[11px] uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-2 py-2 text-left font-medium">#</th>
                        <th className="px-2 py-2 text-left font-medium">ETF</th>
                        <th className="px-2 py-2 text-right font-medium">Score</th>
                        <th className="px-2 py-2 text-left font-medium" title="Fund quality grade A-F (cost, size, trading ease, diversification, income sustainability)">Quality</th>
                        <th className="px-2 py-2 text-right font-medium">Expense</th>
                        <th className="px-2 py-2 text-right font-medium">Yield</th>
                        <th className="px-2 py-2 text-right font-medium">3Y ann.</th>
                        <th className="px-2 py-2 text-right font-medium">Vol 3Y</th>
                        <th className="px-2 py-2 text-left font-medium">NAV erosion</th>
                        <th className="px-2 py-2 text-left font-medium">Strongest factors</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {g.rows.map((sc, i) => {
                        const top = [...sc.parts].sort((x, y) => y.rank * y.weight - x.rank * x.weight).slice(0, 2);
                        return (
                          <tr key={sc.row.ticker} className="align-top">
                            <td className="px-2 py-2 text-slate-400">{i + 1}</td>
                            <td className="px-2 py-2">
                              <TickerLink t={sc.row.ticker} />
                              <div className="max-w-[200px] truncate text-xs text-slate-500">{sc.row.name ?? NA}</div>
                            </td>
                            <td className="px-2 py-2 text-right">
                              <div className="font-semibold tabular-nums">{sc.score.toFixed(0)}</div>
                              <div className="text-[10px] text-slate-400">{Math.round(sc.coverage * 100)}% data</div>
                            </td>
                            <td className="px-2 py-2"><GradeBadge grade={sc.row.quality} /></td>
                            <td className="px-2 py-2 text-right tabular-nums">{pct(sc.row.expense)}</td>
                            <td className="px-2 py-2 text-right tabular-nums">{pct(sc.row.yieldTtm)}</td>
                            <td className="px-2 py-2 text-right tabular-nums">{pct(sc.row.r3y, 1, true)}</td>
                            <td className="px-2 py-2 text-right tabular-nums">{pct(sc.row.vol3y, 1)}</td>
                            <td className="px-2 py-2"><Badge className={erosionStyle[sc.row.erosion]}>{sc.row.erosion}</Badge></td>
                            <td className="px-2 py-2 text-xs text-slate-600">{top.map((p) => `${p.label} (top ${Math.max(1, Math.round((1 - p.rank) * 100))}%)`).join("; ")}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
              {hiddenLowQuality > 0 && (
                <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-800">
                  {hiddenLowQuality} fund{hiddenLowQuality === 1 ? "" : "s"} graded D or F on fund quality {hiddenLowQuality === 1 ? "is" : "are"} hidden. Tick &quot;Show low-grade funds&quot; to include {hiddenLowQuality === 1 ? "it" : "them"}.
                </p>
              )}
              {unrankedClasses.length > 0 && (
                <p className="text-xs text-slate-500">
                  Not ranked (too few funds with data in the class to compute percentiles, need 5+): {unrankedClasses.join(", ")}. Switch to &quot;Rank across all ETFs&quot; to include them.
                </p>
              )}
            </div>
          )}
          <SourceNote source="Scores computed by this app from Yahoo Finance data and FRED risk-free rate" />
        </Card>

        <Card title="How this score works" subtitle={customActive ? "Your custom weights (scaled to 100%)" : spec.description}>
          <ul className="space-y-2 text-sm">
            {weights.map((w) => (
              <li key={w.metric} className="flex items-center justify-between gap-3">
                <span className="text-slate-700">{w.label}<span className="ml-1 text-xs text-slate-400">({w.hint ?? `${w.higherIsBetter ? "higher" : "lower"} is better`})</span></span>
                <span className="font-semibold tabular-nums">{Math.round(w.w * 100)}%</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            {goal === "income" && (
              <span className="mb-2 block rounded-lg bg-amber-50 p-2 text-amber-800">
                Income rule: funds flagged <strong>Severe</strong> NAV erosion (annualised 3Y price return ≤ −6%) are excluded by default{excludedSevere > 0 ? ` - ${excludedSevere} fund(s) currently excluded` : ""}. Tick &quot;include severe NAV erosion&quot; to see them.
              </span>
            )}
            Score = weighted average of each metric&apos;s percentile rank (0–100) among {byClass ? "eligible ETFs of the same asset class (equity, fixed income, commodities & crypto, cash-like; taken from the fund's reported holdings, else its category), so a bond fund is never ranked against an equity fund" : "all eligible ETFs, so different asset classes are ranked against each other"}. If an ETF lacks data for metrics worth more than 30% of the weight it is excluded; otherwise the weights are re-normalised over the available metrics and the data coverage is shown. This ranks <em>past</em> data and does not predict future returns, account for your taxes or risk tolerance, or consider liquidity beyond AUM.
          </p>
        </Card>
      </div>
    </div>
  );
}
