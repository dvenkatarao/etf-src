import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Compass, Layers, PieChart, RotateCw, ShieldAlert } from "lucide-react";
import FirstRunBanner from "@/components/FirstRunBanner";
import HomeCampaigns from "@/components/HomeCampaigns";
import Hydrator from "@/components/Hydrator";
import { Card, SourceNote, Sparkline, Unavailable } from "@/components/ui";
import { gradeBadgeClasses } from "@/components/GradePill";
import { getAllEtfs, getQuotes, staleTickers, type EtfRow } from "@/lib/etf-service";
import { colorFor, dateShort, erosionStyle, isLeveragedOrInverse, macroValue, money, num, pct } from "@/lib/format";
import { getBlsSchedule, getFomcCalendar, getMacroSnapshot, getPolicyRates } from "@/lib/macro";
import { getMacroNews } from "@/lib/news";
import { qualityForRow } from "@/lib/quality";
import { UNIVERSE } from "@/lib/universe";
import { DEFAULT_FILTERS, getIvRanks, getWheelResults, type WheelRow } from "@/lib/wheel-service";
import { ivRankLabel } from "@/lib/wheel-iv";
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
  const [uq, macro, policy, fomc, bls, news, wheel] = await Promise.all([
    getQuotes([...new Set([...tickers, "SPY", "^VIX"])]),
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

  const wheelTop: WheelRow[] = [...(wheel?.rows ?? [])].sort((a, b) => b.best.score - a.best.score).slice(0, 3);
  const wheelTickers = wheelTop.map((r) => r.g.row.ticker);
  const [wheelQuotes, ivRanks] = await Promise.all([getQuotes(wheelTickers), getIvRanks(wheelTickers)]);
  const spotlight = pickSpotlight(rows);
  const spy = uq.quotes.get("SPY");
  const vix = uq.quotes.get("^VIX");

  return (
    <div className="space-y-10 pb-8">
      <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/50 p-6 shadow-2xl md:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-[28rem] w-[28rem] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-400">
              <Compass className="h-3.5 w-3.5" />
              Mission Control · delayed quotes · source-stamped
            </div>
            <h1 className="text-3xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-5xl">
              Screen <span className="bg-gradient-to-r from-emerald-400 to-cyan-300 bg-clip-text text-transparent">ETFs</span> and harvest{" "}
              <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">wheel</span> premium — every figure has a source.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
              US cash session. Quotes delayed. Missing data shows N/A — nothing is guessed.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/screener"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/25 hover:bg-emerald-500"
              >
                <Layers className="h-4 w-4" /> ETF screener
              </Link>
              <Link
                href="/wheel"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/90 px-5 py-2.5 text-sm font-semibold text-slate-100 hover:bg-slate-700"
              >
                <RotateCw className="h-4 w-4" /> Wheel screener
              </Link>
              <Link
                href="/portfolio"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-800/40 px-5 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-700/60"
              >
                <PieChart className="h-4 w-4" /> Portfolio
              </Link>
            </div>
          </div>

          <div className="w-full rounded-xl border border-slate-800 bg-slate-950/85 p-4 shadow-xl lg:w-80">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Desk snapshot</span>
              <span className="font-mono text-[11px] font-bold text-emerald-400">Yahoo · NY Fed</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Kpi label="SPY" value={spy?.price != null ? `$${num(spy.price, 2)}` : "N/A"} sub={chg(spy)} />
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
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Wheel radar</h2>
            <p className="mt-0.5 text-xs text-slate-500">Live A-or-better scan. Score is our 0–100 scan mix (ROC × POP × liquidity × structure). Not a recommendation.</p>
          </div>
          <Link href="/wheel" className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400">
            Open Wheel Lab <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {wheelTop.length ? (
          <div className="grid gap-4 md:grid-cols-3">
            {wheelTop.map((r) => {
              const b = r.best;
              const c = b.contract;
              const q = wheelQuotes.quotes.get(r.g.row.ticker);
              const iv = ivRankLabel(ivRanks.get(r.g.row.ticker) ?? null);
              const score = Math.round(Math.min(100, Math.max(0, b.score)));
              return (
                <article key={r.g.row.ticker} className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-xl shadow-black/30">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link href={`/wheel/${r.g.row.ticker}`} className="font-mono text-3xl font-extrabold tracking-tight text-white hover:text-emerald-400 sm:text-4xl">
                          {r.g.row.ticker}
                        </Link>
                        <div className="mt-1 max-w-[200px] truncate text-xs text-slate-400">{r.g.row.name}</div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div
                          className="grid h-14 w-14 place-items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 text-center"
                          title="Scan score: min(ann. ROC, 100%) × POP × liquidity × structure, scaled to 0–100"
                        >
                          <div>
                            <div className="font-mono text-sm font-extrabold leading-none text-emerald-400">{score}</div>
                            <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-slate-500">/100</div>
                          </div>
                        </div>
                        <span className={gradeBadgeClasses(r.g.grade)}>{r.g.grade ?? "n/a"}</span>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-4 gap-2 rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2.5">
                      <Mini k="Price" v={money(r.ctx.price)} />
                      <Mini k="Day" v={q?.changePct == null ? "N/A" : `${q.changePct > 0 ? "+" : ""}${q.changePct.toFixed(2)}%`} vClass={colorFor(q?.changePct)} />
                      <Mini k="IV rank" v={iv.label} vClass={iv.tone} />
                      <Mini k="POP" v={pct(b.probOtm, 0)} />
                    </div>

                    <div className="mt-3 space-y-2 rounded-lg border border-emerald-800/35 bg-emerald-950/25 p-3.5 text-xs">
                      <Row k="Put to sell" v={`${money(c.strike, c.strike % 1 ? 2 : 0)} P · ${b.dte}d`} vClass="font-mono font-bold text-emerald-300" />
                      <Row k="Credit / expiry" v={`${money(b.credit)} · ${dateShort(c.expiration)}`} />
                      <Row k="Ann. ROC" v={pct(b.annRoc, 1)} vClass="font-mono text-sm font-extrabold text-emerald-400" />
                      <Row k="Cash / contract" v={money(b.cash, 0)} />
                      <Row k="Source" v={r.source ?? "N/A"} />
                    </div>
                  </div>
                  <Link
                    href={`/wheel/${r.g.row.ticker}`}
                    className="mt-4 inline-flex items-center justify-between border-t border-slate-800 pt-3 text-xs font-semibold text-slate-200 hover:text-emerald-400"
                  >
                    Analyze position <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              );
            })}
          </div>
        ) : (
          <Unavailable
            what="Wheel opportunities"
            why="No qualifying puts in the cached scan yet. Open Wheel Lab to run Step 1 + Step 2."
            action={
              <Link href="/wheel" className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Go to Wheel Lab →
              </Link>
            }
          />
        )}
        <SourceNote source="Alpaca / Yahoo option chains · stock grades from Yahoo fundamentals" fetchedAt={wheel?.info.oldest ? wheel.info.oldest.toISOString() : null} />
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">ETF spotlight</h2>
            <p className="mt-0.5 text-xs text-slate-500">Live fund rows — cost, yield, quality, 5Y total, NAV-erosion. Not a model portfolio.</p>
          </div>
          <Link href="/screener" className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400">
            Open ETF Lab <ArrowRight className="h-3.5 w-3.5" />
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
              const r5 = row.metrics?.returns["5Y"];
              const severe = eros === "Severe";
              return (
                <article
                  key={ticker}
                  className={`rounded-xl border p-4 shadow-xl ${
                    severe ? "border-rose-500/50 bg-rose-950/40 shadow-rose-950/40" : "border-slate-800 bg-slate-900 shadow-black/30"
                  }`}
                >
                  {severe && (
                    <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-rose-300 ring-1 ring-rose-500/40">
                      <ShieldAlert className="h-3 w-3" /> NAV-erosion {eros}
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link href={`/etf/${ticker}`} className="font-mono text-2xl font-extrabold tracking-tight text-white hover:text-emerald-400 sm:text-3xl">
                        {ticker}
                      </Link>
                      <div className="mt-0.5 max-w-[180px] truncate text-xs text-slate-400">{row.name ?? "N/A"}</div>
                      <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{row.category ?? role}</div>
                    </div>
                    <span className={gradeBadgeClasses(qual.grade)}>{qual.grade ?? "n/a"}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 font-mono text-xs">
                    <Mini k="Price" v={px == null ? "N/A" : `$${num(px, 2)}`} />
                    <Mini k="Day" v={q?.changePct == null ? "N/A" : `${q.changePct > 0 ? "+" : ""}${q.changePct.toFixed(2)}%`} vClass={`${colorFor(q?.changePct)} text-right`} />
                    <Mini k="Yield TTM" v={pct(yld)} />
                    <Mini k="Expense" v={pct(row.expenseRatio)} vClass="text-right" />
                    <Mini k={r5?.annualised ? "5Y ann." : "5Y"} v={pct(r5?.total ?? null, 1, true)} />
                    <Mini
                      k="Quality"
                      v={qual.score == null ? "N/A" : `${Math.round(qual.score)}/100`}
                      vClass="text-right"
                    />
                  </div>
                  {!severe && (
                    <div className="mt-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${erosionStyle[eros] ?? erosionStyle["n/a"]}`}>
                        Erosion {eros}
                      </span>
                    </div>
                  )}
                  <Link
                    href={`/etf/${ticker}`}
                    className="mt-4 inline-flex w-full items-center justify-between border-t border-slate-800/80 pt-3 text-xs font-semibold text-slate-200 hover:text-emerald-400"
                  >
                    Deep dive <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              );
            })}
          </div>
        ) : (
          <Unavailable what="ETF spotlight" why="Those tickers have not hydrated yet." />
        )}
        <SourceNote source="Yahoo Finance fund profile, distributions and delayed quotes" fetchedAt={uq.fetchedAt} stale={uq.stale} />
      </section>

      <HomeCampaigns />

      <section>
        <div className="mb-4">
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Playbook</h2>
          <p className="mt-0.5 text-xs text-slate-500">How the labs work — the Wheel guide stays in the footer, too.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Play tile="ETF Lab" href="/screener" icon={<Layers className="h-4 w-4" />} blurb="Filter cost, yield, quality and NAV-erosion. Cards on phone, table on desktop." />
          <Play tile="Wheel Lab" href="/wheel" icon={<RotateCw className="h-4 w-4" />} blurb="Cash-secured puts on graded names. Scan score is documented, not a broker rating." />
          <Play tile="Wheel guide" href="/wheel/guide" icon={<BookOpen className="h-4 w-4" />} blurb="CSP → assignment → covered call. Mechanics, not a trade idea." />
          <Play tile="NAV erosion" href="/sources" icon={<ShieldAlert className="h-4 w-4" />} blurb="Price-trend proxy, not 19(a) ROC %. Read how we label Severe." />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Macro snapshot" subtitle="Latest published observations" right={<Link href="/macro" className="text-xs font-medium text-emerald-800 hover:underline dark:text-emerald-300">All indicators →</Link>} className="lg:col-span-2">
          {snap.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {snap.map((p) => (
                <div key={p.def.id} className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/60">
                  <div>
                    <div className="text-xs text-slate-500">{p.def.label}</div>
                    <div className="font-mono text-lg font-semibold tabular-nums">{macroValue(p.latest, p.def.unit, p.def.decimals ?? 2)}</div>
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
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{nextFomc.label}</div>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{nextFomc.hasProjections ? "Includes Summary of Economic Projections." : "No projections scheduled."}</p>
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
                        <span className={`font-mono tabular-nums ${colorFor(q!.changePct)}`}>
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
                  <span className="whitespace-nowrap font-mono text-xs text-slate-500">
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
      <span className="block font-mono text-[10px] uppercase tracking-wider text-slate-400">{label}</span>
      <span className={`mt-0.5 block font-mono text-base font-bold ${valueClass}`}>{value}</span>
      <span className="font-mono text-[10px] text-slate-500">{sub}</span>
    </div>
  );
}

function Mini({ k, v, vClass = "" }: { k: string; v: string; vClass?: string }) {
  return (
    <div className={vClass.includes("text-right") ? "text-right" : undefined}>
      <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">{k}</div>
      <div className={`mt-0.5 font-mono text-xs font-semibold tabular-nums text-slate-100 ${vClass}`}>{v}</div>
    </div>
  );
}

function Row({ k, v, vClass = "font-mono text-slate-200" }: { k: string; v: string; vClass?: string }) {
  return (
    <div className="flex justify-between gap-3 text-slate-300">
      <span className="text-slate-400">{k}</span>
      <span className={vClass}>{v}</span>
    </div>
  );
}

function Play({ tile, href, icon, blurb }: { tile: string; href: string; icon: ReactNode; blurb: string }) {
  return (
    <Link href={href} className="group rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg transition hover:border-emerald-500/40">
      <div className="flex items-center gap-2 text-sm font-bold text-white">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/15 text-emerald-400">{icon}</span>
        {tile}
      </div>
      <p className="mt-2 text-xs leading-relaxed text-slate-400">{blurb}</p>
      <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 group-hover:gap-1.5">
        Open <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  );
}

function chg(q: YahooQuote | undefined) {
  if (!q || q.changePct == null) return "N/A";
  return `${q.changePct > 0 ? "+" : ""}${q.changePct.toFixed(2)}%`;
}
