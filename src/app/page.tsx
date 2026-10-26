import Link from "next/link";
import FirstRunBanner from "@/components/FirstRunBanner";
import Hydrator from "@/components/Hydrator";
import { OptionsIcon, ScreenerIcon } from "@/components/icons/AppIcons";
import { Card, SourceNote, Sparkline, Unavailable } from "@/components/ui";
import { gradeBadgeClasses } from "@/components/GradePill";
import { getAllEtfs, getQuotes, staleTickers, type EtfRow } from "@/lib/etf-service";
import { colorFor, dateShort, erosionStyle, isLeveragedOrInverse, macroValue, money, num, pct } from "@/lib/format";
import { getBlsSchedule, getFomcCalendar, getMacroSnapshot, getPolicyRates } from "@/lib/macro";
import { getMacroNews } from "@/lib/news";
import { qualityForRow } from "@/lib/quality";
import { MARKET_INDEXES, UNIVERSE } from "@/lib/universe";
import { DEFAULT_FILTERS, getWheelResults, type WheelRow } from "@/lib/wheel-service";
import type { YahooQuote } from "@/lib/yahoo";

export const dynamic = "force-dynamic";

const SNAP_IDS = ["DGS10", "DGS2", "T10Y2Y", "CPIAUCSL", "UNRATE", "VIXCLS"];
const SPOTLIGHT: { ticker: string; role: string }[] = [
  { ticker: "VOO", role: "Core index" },
  { ticker: "SCHD", role: "Dividend growth" },
  { ticker: "JEPI", role: "Covered-call income" },
  { ticker: "TSLY", role: "NAV-erosion check" },
];

function pickSpotlight(rows: EtfRow[]): { ticker: string; role: string; row: EtfRow }[] {
  const byT = new Map(rows.map((r) => [r.ticker, r]));
  const out: { ticker: string; role: string; row: EtfRow }[] = [];
  for (const s of SPOTLIGHT) {
    const row = byT.get(s.ticker);
    if (row?.metrics) out.push({ ...s, row });
  }
  if (!out.some((x) => x.ticker === "TSLY")) {
    const severe = rows.find((r) => r.metrics?.erosion.level === "Severe" && !SPOTLIGHT.some((s) => s.ticker === r.ticker));
    if (severe) out.push({ ticker: severe.ticker, role: "NAV-erosion check", row: severe });
  }
  return out.slice(0, 4);
}

export default async function Dashboard() {
  const [rows, stale] = await Promise.all([getAllEtfs(), staleTickers()]);
  const tickers = rows.map((r) => r.ticker);
  const [idx, uq, macro, policy, fomc, bls, news, wheel] = await Promise.all([
    getQuotes(MARKET_INDEXES.map((i) => i.symbol)),
    getQuotes(tickers),
    getMacroSnapshot(),
    getPolicyRates(),
    getFomcCalendar(),
    getBlsSchedule(),
    getMacroNews(8),
    getWheelResults(DEFAULT_FILTERS).catch(() => null),
  ]);

  const movers = rows
    .filter((r) => !isLeveragedOrInverse(r.category, r.name))
    .map((r) => ({ r, q: uq.quotes.get(r.ticker) }))
    .filter((x) => x.q?.changePct != null && (x.r.totalAssets ?? 0) > 5e8);
  const gainers = [...movers].sort((a, b) => b.q!.changePct! - a.q!.changePct!).slice(0, 5);
  const losers = [...movers].sort((a, b) => a.q!.changePct! - b.q!.changePct!).slice(0, 5);

  const today = new Date().toISOString().slice(0, 10);
  const nextFomc = fomc?.data.find((m) => m.end >= today);
  const snap = (macro?.data ?? []).filter((p) => SNAP_IDS.includes(p.def.id));

  const spx = idx.quotes.get("^GSPC");
  const vix = idx.quotes.get("^VIX");
  const wheelTop: WheelRow[] = [...(wheel?.rows ?? [])].sort((a, b) => b.best.score - a.best.score).slice(0, 3);
  const spotlight = pickSpotlight(rows);

  return (
    <div className="space-y-8 pb-8">
      <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 p-6 shadow-2xl md:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
              Mission Control · delayed quotes · source-stamped
            </div>
            <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl">
              Screen <span className="bg-gradient-to-r from-emerald-400 to-cyan-300 bg-clip-text text-transparent">ETFs</span> and harvest{" "}
              <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">wheel</span> premium — every figure has a source.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
              US cash session. Quotes delayed. Missing data shows N/A — nothing is guessed.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link href="/screener" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-500">
                <ScreenerIcon size={14} /> ETF screener
              </Link>
              <Link href="/wheel" className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/90 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700">
                <OptionsIcon size={14} /> Wheel screener
              </Link>
              <Link href="/portfolio" className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-800/50 px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-700/60">
                Portfolio
              </Link>
            </div>
          </div>

          <div className="w-full rounded-xl border border-slate-800/90 bg-slate-950/80 p-4 shadow-xl lg:w-80">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-medium text-slate-400">Desk snapshot (delayed)</span>
              <span className="font-mono text-xs font-bold text-emerald-400">Yahoo · NY Fed</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Kpi label="S&P 500" value={spx?.price != null ? num(spx.price, 2) : "N/A"} sub={chg(spx)} />
              <Kpi label="VIX" value={vix?.price != null ? num(vix.price, 2) : "N/A"} sub={chg(vix)} valueClass="text-cyan-400" />
              <Kpi
                label="Fed funds"
                value={policy?.data.effr?.targetFrom != null ? `${policy.data.effr.targetFrom.toFixed(2)}–${policy.data.effr.targetTo?.toFixed(2)}%` : "N/A"}
                sub="NY Fed target"
              />
              <Kpi
                label="EFFR / SOFR"
                value={policy?.data.effr ? `${policy.data.effr.rate.toFixed(2)}%` : "N/A"}
                sub={`SOFR ${policy?.data.sofr ? `${policy.data.sofr.rate.toFixed(2)}%` : "N/A"}`}
              />
            </div>
          </div>
        </div>
      </section>

      <FirstRunBanner />
      <Hydrator remaining={stale.length} total={UNIVERSE.length} />

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Wheel radar</h2>
            <p className="mt-0.5 text-xs text-slate-500">Top scores from the live A-or-better scan. Not a recommendation.</p>
          </div>
          <Link href="/wheel" className="text-xs font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400">
            Open Wheel Lab →
          </Link>
        </div>
        {wheelTop.length ? (
          <div className="grid gap-4 md:grid-cols-3">
            {wheelTop.map((r) => {
              const b = r.best;
              const c = b.contract;
              return (
                <article key={r.g.row.ticker} className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-md">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link href={`/wheel/${r.g.row.ticker}`} className="font-mono text-lg font-bold text-white hover:text-emerald-400">
                          {r.g.row.ticker}
                        </Link>
                        <div className="max-w-[180px] truncate text-xs text-slate-400">{r.g.row.name}</div>
                      </div>
                      <span className={gradeBadgeClasses(r.g.grade)}>{r.g.grade ?? "n/a"}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg border border-slate-800/80 bg-slate-950/60 px-3 py-2.5 font-mono text-[11px]">
                      <div>
                        <span className="block text-[10px] text-slate-500">Score</span>
                        <span className="font-bold text-emerald-400">{b.score.toFixed(1)}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-500">Price</span>
                        <span className="font-bold text-slate-200">{money(r.ctx.price)}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-500">Source</span>
                        <span className="font-bold text-slate-200">{r.source ?? "N/A"}</span>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1.5 rounded-lg border border-emerald-800/30 bg-emerald-950/20 p-3 text-xs">
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-400">Put to sell</span>
                        <span className="font-mono font-bold text-emerald-300">
                          {money(c.strike, c.strike % 1 ? 2 : 0)} P · {b.dte}d
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-400">Credit / expiry</span>
                        <span className="font-mono">
                          {money(b.credit)} · {dateShort(c.expiration)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Ann. ROC</span>
                        <span className="font-mono text-sm font-extrabold text-emerald-400">{pct(b.annRoc, 1)}</span>
                      </div>
                    </div>
                  </div>
                  <Link href={`/wheel/${r.g.row.ticker}`} className="mt-4 inline-flex items-center justify-between border-t border-slate-800 pt-3 text-xs font-semibold text-slate-200 hover:text-emerald-400">
                    Open chain <span>→</span>
                  </Link>
                </article>
              );
            })}
          </div>
        ) : (
          <Unavailable what="Wheel opportunities" why="No qualifying puts in the cached scan yet. Open Wheel Lab to run Step 1 + Step 2." action={<Link href="/wheel" className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Go to Wheel Lab →</Link>} />
        )}
        <SourceNote source="Alpaca / Yahoo option chains · stock grades from Yahoo fundamentals" fetchedAt={wheel?.info.oldest ? wheel.info.oldest.toISOString() : null} />
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">ETF spotlight</h2>
            <p className="mt-0.5 text-xs text-slate-500">Live fund rows — cost, yield, quality, NAV-erosion. Not a model portfolio.</p>
          </div>
          <Link href="/screener" className="text-xs font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400">
            Open ETF Lab →
          </Link>
        </div>
        {spotlight.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {spotlight.map(({ ticker, role, row }) => {
              const q = uq.quotes.get(ticker);
              const qual = qualityForRow(row, q);
              const px = q?.price ?? row.lastClose;
              const yld = row.metrics?.dividends.ttmYield ?? null;
              const eros = row.metrics?.erosion.level ?? "n/a";
              return (
                <article key={ticker} className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-md">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link href={`/etf/${ticker}`} className="font-mono text-lg font-bold text-white hover:text-emerald-400">
                        {ticker}
                      </Link>
                      <div className="max-w-[160px] truncate text-xs text-slate-400">{row.name ?? "N/A"}</div>
                      <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{role}</div>
                    </div>
                    <span className={gradeBadgeClasses(qual.grade)}>{qual.grade ?? "n/a"}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-xs">
                    <div>
                      <div className="text-[10px] uppercase text-slate-500">Price</div>
                      <div className="text-slate-100">{px == null ? "N/A" : `$${num(px, 2)}`}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase text-slate-500">Day</div>
                      <div className={colorFor(q?.changePct)}>{q?.changePct == null ? "N/A" : `${q.changePct > 0 ? "+" : ""}${q.changePct.toFixed(2)}%`}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-slate-500">Yield TTM</div>
                      <div className="text-slate-100">{pct(yld)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase text-slate-500">Expense</div>
                      <div className="text-slate-100">{pct(row.expenseRatio)}</div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${erosionStyle[eros] ?? erosionStyle["n/a"]}`}>{eros}</span>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <Unavailable what="ETF spotlight" why="Those tickers have not hydrated yet." />
        )}
        <SourceNote source="Yahoo Finance fund profile, distributions and delayed quotes" fetchedAt={uq.fetchedAt} stale={uq.stale} />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Macro snapshot" subtitle="Latest published observations" right={<Link href="/macro" className="text-xs font-medium text-emerald-800 hover:underline dark:text-emerald-300">All indicators →</Link>} className="lg:col-span-2">
          {snap.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {snap.map((p) => (
                <div key={p.def.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <div>
                    <div className="text-xs text-slate-500">{p.def.label}</div>
                    <div className="text-lg font-semibold tabular-nums">{macroValue(p.latest, p.def.unit, p.def.decimals ?? 2)}</div>
                    <div className="text-[11px] text-slate-400">as of {dateShort(p.date)}</div>
                  </div>
                  <Sparkline values={p.history.slice(-40).map((h) => h.value)} />
                </div>
              ))}
            </div>
          ) : (
            <Unavailable what="Macro data" why="FRED could not be reached and no cached copy exists yet." />
          )}
          <SourceNote source="FRED (St. Louis Fed)" href="https://fred.stlouisfed.org" fetchedAt={macro?.fetchedAt} stale={macro?.stale} />
        </Card>

        <Card title="Next FOMC meeting" subtitle="federalreserve.gov calendar">
          {nextFomc ? (
            <div>
              <div className="text-2xl font-semibold text-slate-900 dark:text-white">{nextFomc.label}</div>
              <p className="mt-1 text-sm text-slate-600">{nextFomc.hasProjections ? "Includes Summary of Economic Projections." : "No projections scheduled."}</p>
              <p className="mt-3 text-xs text-slate-500">Upcoming meetings</p>
              <ul className="mt-1 space-y-1 text-sm">
                {fomc!.data.filter((m) => m.end >= today).slice(0, 4).map((m) => (
                  <li key={m.start} className="flex justify-between">
                    <span>{m.label}</span>
                    {m.hasProjections && <span className="text-xs text-emerald-700 dark:text-emerald-300">SEP</span>}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <Unavailable what="FOMC calendar" />
          )}
          <SourceNote source="Federal Reserve Board" href="https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm" fetchedAt={fomc?.fetchedAt} stale={fomc?.stale} />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Today's movers" subtitle="ETFs with ≥ $500M AUM in the tracked universe (delayed)">
          {gainers.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[{ t: "Gainers", l: gainers }, { t: "Losers", l: losers }].map((g) => (
                <div key={g.t}>
                  <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">{g.t}</div>
                  <ul className="space-y-1.5 text-sm">
                    {g.l.map(({ r, q }) => (
                      <li key={r.ticker} className="flex items-center justify-between">
                        <Link href={`/etf/${r.ticker}`} className="font-semibold text-emerald-800 hover:underline dark:text-emerald-300">
                          {r.ticker}
                        </Link>
                        <span className={`tabular-nums ${colorFor(q!.changePct)}`}>
                          {q!.changePct! > 0 ? "+" : ""}
                          {q!.changePct!.toFixed(2)}%
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <Unavailable what="Mover data" why="Quotes or ETF data are still loading." />
          )}
          <SourceNote source="Yahoo Finance delayed quotes" fetchedAt={uq.fetchedAt} stale={uq.stale} />
        </Card>

        <Card title="Upcoming US data releases" subtitle="Next 45 days, BLS official schedule">
          {bls && bls.data.length ? (
            <ul className="space-y-1.5 text-sm">
              {bls.data.slice(0, 8).map((e, i) => (
                <li key={i} className="flex justify-between gap-3">
                  <span className="truncate" title={e.title}>
                    {e.title}
                  </span>
                  <span className="whitespace-nowrap text-xs text-slate-500">
                    {dateShort(e.date)} {e.time ?? ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Unavailable what="Release calendar" />
          )}
          <SourceNote source="BLS release calendar (ICS)" href="https://www.bls.gov/schedule/news_release/" fetchedAt={bls?.fetchedAt} stale={bls?.stale} />
        </Card>

        <Card title="Latest Fed & regulator headlines" right={<Link href="/news" className="text-xs font-medium text-emerald-800 hover:underline dark:text-emerald-300">More →</Link>}>
          {news.items.length ? (
            <ul className="space-y-2.5 text-sm">
              {news.items.slice(0, 6).map((n) => (
                <li key={n.link}>
                  <a href={n.link} target="_blank" rel="noreferrer" className="font-medium text-slate-800 hover:text-emerald-700 dark:text-slate-100 dark:hover:text-emerald-300">
                    {n.title}
                  </a>
                  <div className="text-[11px] text-slate-400">
                    {n.source} · {dateShort(n.date)}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Unavailable what="News feeds" />
          )}
          <SourceNote source="Federal Reserve, SEC, BEA RSS" />
        </Card>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub, valueClass = "text-white" }: { label: string; value: string; sub: string; valueClass?: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/90 p-2.5">
      <span className="block font-mono text-[10px] uppercase text-slate-400">{label}</span>
      <span className={`mt-0.5 block font-mono text-base font-bold ${valueClass}`}>{value}</span>
      <span className="text-[10px] font-mono text-slate-500">{sub}</span>
    </div>
  );
}

function chg(q: YahooQuote | undefined) {
  if (!q || q.changePct == null) return "N/A";
  return `${q.changePct > 0 ? "+" : ""}${q.changePct.toFixed(2)}%`;
}
