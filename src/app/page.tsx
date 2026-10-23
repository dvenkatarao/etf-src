import Link from "next/link";
import Hydrator from "@/components/Hydrator";
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

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-800 p-8 text-white shadow-lg">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-indigo-200">Live · source-verified · no estimates</p>
        <h1 className="mt-2 max-w-3xl text-3xl font-semibold leading-tight sm:text-4xl">Research US ETFs with data you can trace to its source.</h1>
        <p className="mt-3 max-w-2xl text-sm text-indigo-100">
          Screen, compare and analyse returns, distributions, expense ratios, NAV erosion, holdings-based analyst consensus and the macro backdrop. Every figure is provider data or deterministic math on it, stamped with source and time.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/onboarding" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-indigo-900 hover:bg-indigo-50">New? Start in 60s →</Link>
          <Link href="/screener" className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/30 hover:bg-white/20">Open screener</Link>
          <Link href="/recommend" className="rounded-lg bg-indigo-500/40 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/30 hover:bg-indigo-500/60">Goal-based picks</Link>
          <Link href="/wheel" className="rounded-lg bg-violet-500/40 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/30 hover:bg-violet-500/60">Options wheel</Link>
        </div>
        <p className="mt-3 text-xs text-indigo-200">No account needed. <Link href="/onboarding" className="underline">3 questions → ranked picks + starter portfolio you can edit.</Link> No trades placed, no advice.</p>
      </section>

      <Hydrator remaining={stale.length} total={UNIVERSE.length} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
        {MARKET_INDEXES.map((i) => {
          const q = idx.quotes.get(i.symbol);
          return (
            <div key={i.symbol} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="text-xs text-slate-500">{i.label}</div>
              <div className="mt-1 text-lg font-semibold tabular-nums">{q?.price != null ? num(q.price, 2) : "N/A"}</div>
              <div className={`text-xs font-medium tabular-nums ${colorFor(q?.changePct)}`}>{q?.changePct != null ? `${q.changePct > 0 ? "+" : ""}${q.changePct.toFixed(2)}%` : "N/A"}</div>
            </div>
          );
        })}
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="text-xs text-slate-500">Fed funds target (NY Fed)</div>
          <div className="mt-1 text-lg font-semibold tabular-nums">{policy?.data.effr?.targetFrom != null ? `${policy.data.effr.targetFrom.toFixed(2)}–${policy.data.effr.targetTo?.toFixed(2)}%` : "N/A"}</div>
          <div className="text-xs text-slate-500">EFFR {policy?.data.effr ? `${policy.data.effr.rate.toFixed(2)}%` : "N/A"} · SOFR {policy?.data.sofr ? `${policy.data.sofr.rate.toFixed(2)}%` : "N/A"}</div>
        </div>
      </div>
      <SourceNote source="Yahoo Finance delayed quotes · NY Fed Markets API" fetchedAt={idx.fetchedAt} stale={idx.stale} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Macro snapshot" subtitle="Latest published observations" right={<Link href="/macro" className="text-xs font-medium text-indigo-700 hover:underline">All indicators →</Link>} className="lg:col-span-2">
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
                  <li key={m.start} className="flex justify-between"><span>{m.label}</span>{m.hasProjections && <span className="text-xs text-indigo-600">SEP</span>}</li>
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
                        <Link href={`/etf/${r.ticker}`} className="font-semibold text-indigo-700 hover:underline">{r.ticker}</Link>
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

        <Card title="Latest Fed & regulator headlines" right={<Link href="/news" className="text-xs font-medium text-indigo-700 hover:underline">More →</Link>}>
          {news.items.length ? (
            <ul className="space-y-2.5 text-sm">
              {news.items.slice(0, 6).map((n) => (
                <li key={n.link}>
                  <a href={n.link} target="_blank" rel="noreferrer" className="font-medium text-slate-800 hover:text-indigo-700">{n.title}</a>
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
