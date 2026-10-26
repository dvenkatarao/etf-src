import Link from "next/link";
import FirstRunBanner from "@/components/FirstRunBanner";
import Hydrator from "@/components/Hydrator";
import { OptionsIcon, ScreenerIcon } from "@/components/icons/AppIcons";
import { Card, SourceNote, Sparkline, Unavailable } from "@/components/ui";
import { getAllEtfs, getQuotes, staleTickers } from "@/lib/etf-service";
import { colorFor, dateShort, isLeveragedOrInverse, macroValue, num } from "@/lib/format";
import { getBlsSchedule, getFomcCalendar, getMacroSnapshot, getPolicyRates } from "@/lib/macro";
import { getMacroNews } from "@/lib/news";
import { MARKET_INDEXES, UNIVERSE } from "@/lib/universe";

export const dynamic = "force-dynamic";

const SNAP_IDS = ["DGS10", "DGS2", "T10Y2Y", "CPIAUCSL", "UNRATE", "VIXCLS"];

export default async function Dashboard() {
  const [rows, stale] = await Promise.all([getAllEtfs(), staleTickers()]);
  const tickers = rows.map((r) => r.ticker);
  const [idx, uq, macro, policy, fomc, bls, news] = await Promise.all([
    getQuotes(MARKET_INDEXES.map((i) => i.symbol)),
    getQuotes(tickers),
    getMacroSnapshot(),
    getPolicyRates(),
    getFomcCalendar(),
    getBlsSchedule(),
    getMacroNews(8),
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

  return (
    <div className="space-y-8 pb-8">
      <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 p-6 shadow-2xl md:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
              Delayed US cash quotes · source-stamped
            </div>
            <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl">
              Screen <span className="bg-gradient-to-r from-emerald-400 to-cyan-300 bg-clip-text text-transparent">ETFs</span> and harvest{" "}
              <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">wheel</span> premium — every figure has a source.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
              US cash session. Quotes delayed. Nothing is guessed: missing data shows N/A.
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
              <span className="text-xs font-medium text-slate-400">Live tape (delayed)</span>
              <span className="font-mono text-xs font-bold text-emerald-400">Yahoo</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-slate-800 bg-slate-900/90 p-2.5">
                <span className="block font-mono text-[10px] uppercase text-slate-400">S&amp;P 500</span>
                <span className="mt-0.5 block font-mono text-base font-bold text-white">{spx?.price != null ? num(spx.price, 2) : "N/A"}</span>
                <span className={`text-[10px] font-mono ${colorFor(spx?.changePct)}`}>{spx?.changePct != null ? `${spx.changePct > 0 ? "+" : ""}${spx.changePct.toFixed(2)}%` : "N/A"}</span>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/90 p-2.5">
                <span className="block font-mono text-[10px] uppercase text-slate-400">VIX</span>
                <span className="mt-0.5 block font-mono text-base font-bold text-cyan-400">{vix?.price != null ? num(vix.price, 2) : "N/A"}</span>
                <span className={`text-[10px] font-mono ${colorFor(vix?.changePct)}`}>{vix?.changePct != null ? `${vix.changePct > 0 ? "+" : ""}${vix.changePct.toFixed(2)}%` : "N/A"}</span>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/90 p-2.5">
                <span className="block font-mono text-[10px] uppercase text-slate-400">Fed funds</span>
                <span className="mt-0.5 block font-mono text-base font-bold text-white">{policy?.data.effr?.targetFrom != null ? `${policy.data.effr.targetFrom.toFixed(2)}–${policy.data.effr.targetTo?.toFixed(2)}%` : "N/A"}</span>
                <span className="text-[10px] text-slate-500">NY Fed target</span>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/90 p-2.5">
                <span className="block font-mono text-[10px] uppercase text-slate-400">EFFR / SOFR</span>
                <span className="mt-0.5 block font-mono text-base font-bold text-white">{policy?.data.effr ? `${policy.data.effr.rate.toFixed(2)}%` : "N/A"}</span>
                <span className="text-[10px] text-slate-500">SOFR {policy?.data.sofr ? `${policy.data.sofr.rate.toFixed(2)}%` : "N/A"}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <FirstRunBanner />
      <Hydrator remaining={stale.length} total={UNIVERSE.length} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
        {MARKET_INDEXES.map((i) => {
          const q = idx.quotes.get(i.symbol);
          return (
            <div key={i.symbol} className="rounded-xl border border-slate-800 bg-slate-900/90 px-4 py-3 shadow-md dark:border-slate-800">
              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{i.label}</div>
              <div className="mt-1.5 font-mono text-lg font-semibold tabular-nums text-white">{q?.price != null ? num(q.price, 2) : "N/A"}</div>
              <div className={`text-xs font-medium tabular-nums ${colorFor(q?.changePct)}`}>{q?.changePct != null ? `${q.changePct > 0 ? "+" : ""}${q.changePct.toFixed(2)}%` : "N/A"}</div>
            </div>
          );
        })}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 px-4 py-3 shadow-md">
          <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Fed funds target</div>
          <div className="mt-1.5 font-mono text-lg font-semibold tabular-nums text-white">{policy?.data.effr?.targetFrom != null ? `${policy.data.effr.targetFrom.toFixed(2)}–${policy.data.effr.targetTo?.toFixed(2)}%` : "N/A"}</div>
          <div className="text-xs text-slate-500">EFFR {policy?.data.effr ? `${policy.data.effr.rate.toFixed(2)}%` : "N/A"} · SOFR {policy?.data.sofr ? `${policy.data.sofr.rate.toFixed(2)}%` : "N/A"}</div>
        </div>
      </div>
      <SourceNote source="Yahoo Finance delayed quotes · NY Fed Markets API" fetchedAt={idx.fetchedAt} stale={idx.stale} />

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
              <div className="text-2xl font-semibold text-slate-900">{nextFomc.label}</div>
              <p className="mt-1 text-sm text-slate-600">{nextFomc.hasProjections ? "Includes Summary of Economic Projections." : "No projections scheduled."}</p>
              <p className="mt-3 text-xs text-slate-500">Upcoming meetings</p>
              <ul className="mt-1 space-y-1 text-sm">
                {fomc!.data.filter((m) => m.end >= today).slice(0, 4).map((m) => (
                  <li key={m.start} className="flex justify-between"><span>{m.label}</span>{m.hasProjections && <span className="text-xs text-emerald-700 dark:text-emerald-300">SEP</span>}</li>
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
                        <Link href={`/etf/${r.ticker}`} className="font-semibold text-emerald-800 hover:underline dark:text-emerald-300">{r.ticker}</Link>
                        <span className={`tabular-nums ${colorFor(q!.changePct)}`}>{q!.changePct! > 0 ? "+" : ""}{q!.changePct!.toFixed(2)}%</span>
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
                  <span className="truncate" title={e.title}>{e.title}</span>
                  <span className="whitespace-nowrap text-xs text-slate-500">{dateShort(e.date)} {e.time ?? ""}</span>
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
                  <a href={n.link} target="_blank" rel="noreferrer" className="font-medium text-slate-800 hover:text-emerald-700 dark:text-slate-100 dark:hover:text-emerald-300">{n.title}</a>
                  <div className="text-[11px] text-slate-400">{n.source} · {dateShort(n.date)}</div>
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
