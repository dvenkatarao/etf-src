import { Badge, Card, PageHeader, SourceNote, Unavailable } from "@/components/ui";
import { dateShort } from "@/lib/format";
import { getBlsSchedule, getFomcCalendar } from "@/lib/macro";
import { getLatest8Ks, getMacroNews, getRecentEarningsReleases, getSymbolNews, getUpcomingEarnings } from "@/lib/news";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
export const metadata = { title: "News & events · ETF Research Lab" };

export default async function NewsPage() {
  const [macro, earnings, eights, mkt, fomc, bls, upcoming] = await Promise.all([
    getMacroNews(30),
    getRecentEarningsReleases(7),
    getLatest8Ks(30),
    getSymbolNews("^GSPC", 12),
    getFomcCalendar(),
    getBlsSchedule(),
    getUpcomingEarnings(),
  ]);
  const today = new Date().toISOString().slice(0, 10);
  const nextFomc = fomc?.data.filter((m) => m.end >= today).slice(0, 3) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="News & events" description="Official, primary-source feeds: Federal Reserve (FOMC), SEC filings (earnings releases and company announcements), BEA/BLS releases, plus market headlines. Headlines link out to the publisher; nothing is summarised or altered." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Federal Reserve, SEC & BEA announcements" subtitle="FOMC statements and minutes, press releases, speeches, regulation" className="lg:col-span-2">
          {macro.items.length ? (
            <ul className="divide-y divide-slate-100 text-sm">
              {macro.items.map((n) => (
                <li key={n.link} className="py-2.5">
                  <a href={n.link} target="_blank" rel="noreferrer" className="font-medium text-slate-800 hover:text-indigo-700">{n.title}</a>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                    <Badge className="bg-slate-50 text-slate-600 ring-slate-200">{n.source}</Badge>
                    {n.tag && <span>{n.tag}</span>}
                    <span>{dateShort(n.date)}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Unavailable what="Official news feeds" />
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {macro.status.map((s) => (
              <span key={s.id} className={`rounded px-2 py-0.5 text-[11px] ${s.ok ? (s.stale ? "bg-amber-100 text-amber-800" : "bg-emerald-50 text-emerald-700") : "bg-rose-50 text-rose-700"}`}>
                {s.id}: {s.ok ? (s.stale ? "stale" : `${s.count} items`) : "unavailable"}
              </span>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card title="Next FOMC meetings">
            {nextFomc.length ? (
              <ul className="space-y-1.5 text-sm">
                {nextFomc.map((m) => (
                  <li key={m.start} className="flex justify-between"><span className="font-medium">{m.label}</span>{m.hasProjections && <Badge className="bg-indigo-50 text-indigo-700 ring-indigo-200">SEP</Badge>}</li>
                ))}
              </ul>
            ) : (
              <Unavailable what="FOMC calendar" />
            )}
            <SourceNote source="federalreserve.gov" href="https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm" fetchedAt={fomc?.fetchedAt} stale={fomc?.stale} />
          </Card>
          <Card title="Key data releases (BLS)" subtitle="Next 45 days">
            {bls && bls.data.length ? (
              <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto text-sm">
                {bls.data.slice(0, 14).map((e, i) => (
                  <li key={i} className="flex justify-between gap-2 py-1.5"><span>{e.title}</span><span className="whitespace-nowrap text-xs text-slate-500">{dateShort(e.date)}</span></li>
                ))}
              </ul>
            ) : (
              <Unavailable what="Release schedule" />
            )}
            <SourceNote source="BLS ICS calendar" fetchedAt={bls?.fetchedAt} stale={bls?.stale} />
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Earnings releases filed (last 7 days)" subtitle="8-K filings with Item 2.02 'Results of Operations and Financial Condition' - straight from SEC EDGAR">
          {earnings && earnings.data.length ? (
            <ul className="max-h-[28rem] divide-y divide-slate-100 overflow-y-auto text-sm">
              {earnings.data.slice(0, 60).map((f) => (
                <li key={f.url} className="flex items-start justify-between gap-3 py-2">
                  <div>
                    <a href={f.url} target="_blank" rel="noreferrer" className="font-medium text-slate-800 hover:text-indigo-700">{f.company}</a>
                    <div className="text-[11px] text-slate-400">{f.tickers.join(", ") || "no ticker listed"}</div>
                  </div>
                  <span className="whitespace-nowrap text-xs text-slate-500">{dateShort(f.filed)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <Unavailable what="Earnings releases" why="SEC EDGAR full-text search did not respond and no cached copy exists." />
          )}
          <SourceNote source="SEC EDGAR full-text search (Form 8-K Item 2.02)" href="https://www.sec.gov/edgar/search/" fetchedAt={earnings?.fetchedAt} stale={earnings?.stale} />
        </Card>

        <Card title="Latest company announcements (Form 8-K)" subtitle="Live EDGAR current-events feed">
          {eights && eights.data.length ? (
            <ul className="max-h-[28rem] divide-y divide-slate-100 overflow-y-auto text-sm">
              {eights.data.map((n) => (
                <li key={n.link} className="py-2">
                  <a href={n.link} target="_blank" rel="noreferrer" className="font-medium text-slate-800 hover:text-indigo-700">{n.title}</a>
                  <div className="text-[11px] text-slate-400">{dateShort(n.date)}</div>
                </li>
              ))}
            </ul>
          ) : (
            <Unavailable what="8-K feed" />
          )}
          <SourceNote source="SEC EDGAR Atom feed" fetchedAt={eights?.fetchedAt} stale={eights?.stale} />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Market headlines (S&P 500)">
          {mkt && mkt.data.length ? (
            <ul className="divide-y divide-slate-100 text-sm">
              {mkt.data.map((n) => (
                <li key={n.link} className="py-2">
                  <a href={n.link} target="_blank" rel="noreferrer" className="font-medium text-slate-800 hover:text-indigo-700">{n.title}</a>
                  <div className="text-[11px] text-slate-400">{dateShort(n.date)}</div>
                </li>
              ))}
            </ul>
          ) : (
            <Unavailable what="Market headlines" />
          )}
          <SourceNote source="Yahoo Finance headline RSS" fetchedAt={mkt?.fetchedAt} stale={mkt?.stale} />
        </Card>

        <Card title="Upcoming earnings (next 10 days)" subtitle="Requires a free Finnhub key (FINNHUB_API_KEY)">
          {!upcoming.enabled ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
              Not enabled. Add <code className="rounded bg-white px-1 py-0.5 text-xs">FINNHUB_API_KEY</code> to the environment to show scheduled earnings with EPS/revenue estimates (free tier: 1-month window, US). No keyless source for future earnings dates passed verification - api.nasdaq.com blocked this environment - so none is shown rather than guessed.
            </div>
          ) : upcoming.data && upcoming.data.data.length ? (
            <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto text-sm">
              {upcoming.data.data.slice(0, 80).map((e, i) => (
                <li key={i} className="flex justify-between gap-3 py-1.5"><span className="font-semibold">{e.symbol}</span><span className="text-xs text-slate-500">{dateShort(e.date)} {e.hour ?? ""} · EPS est. {e.epsEstimate ?? "N/A"}</span></li>
              ))}
            </ul>
          ) : (
            <Unavailable what="Earnings calendar" />
          )}
          <SourceNote source="Finnhub /calendar/earnings" fetchedAt={upcoming.data?.fetchedAt} stale={upcoming.data?.stale} />
        </Card>
      </div>
    </div>
  );
}
