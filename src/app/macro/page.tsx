import { Card, PageHeader, SourceNote, Sparkline, Unavailable } from "@/components/ui";
import { InsightsIcon, PageIcon } from "@/components/icons/AppIcons";
import { MacroRegimeBannerLight } from "@/components/MacroRegimeBanner";
import { YieldCurveChart } from "@/components/SvgCharts";
import { colorFor, dateShort, macroValue } from "@/lib/format";
import { MACRO_SERIES, getBlsSchedule, getFomcCalendar, getMacroSnapshot, getPolicyRates, getYieldCurve } from "@/lib/macro";
import { deriveRegime } from "@/lib/macro-regime";

export const dynamic = "force-dynamic";
export const metadata = { title: "Macro dashboard · Capital Lab" };

const GROUPS = Array.from(new Set(MACRO_SERIES.map((s) => s.group)));

export default async function MacroPage() {
  const [snap, curve, policy, fomc, bls] = await Promise.all([getMacroSnapshot(), getYieldCurve(), getPolicyRates(), getFomcCalendar(), getBlsSchedule()]);
  const today = new Date().toISOString().slice(0, 10);
  const spread = curve?.data.points.find((p) => p.label === "10Y")?.now != null && curve?.data.points.find((p) => p.label === "2Y")?.now != null ? curve.data.points.find((p) => p.label === "10Y")!.now! - curve.data.points.find((p) => p.label === "2Y")!.now! : null;

  const regime = deriveRegime({ snap: snap?.data ?? null, curve: curve?.data ?? null, policy: policy?.data ?? null });
  return (
    <div className="space-y-6">
      <PageHeader icon={<PageIcon label="Insights"><InsightsIcon size={22} /></PageIcon>} title="Macro dashboard" description="The backdrop that drives ETF returns: policy rates, the Treasury curve, inflation, labour, growth and market stress. Every value is the latest published observation from the named official series." />
      <MacroRegimeBannerLight regime={regime} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="US Treasury yield curve" subtitle={curve ? `As of ${dateShort(curve.data.asOf)} vs ${dateShort(curve.data.yearAgoDate)}` : undefined} className="lg:col-span-2">
          {curve ? (
            <>
              <YieldCurveChart points={curve.data.points} />
              <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-600">
                <span className="flex items-center gap-1.5"><span className="inline-block h-0.5 w-5 bg-indigo-600" /> Latest</span>
                <span className="flex items-center gap-1.5"><span className="inline-block h-0.5 w-5 border-t-2 border-dashed border-slate-400" /> One year earlier</span>
                {spread != null && <span className="ml-auto font-medium">10Y − 2Y: {spread >= 0 ? "+" : ""}{spread.toFixed(2)} pp {spread < 0 ? "(inverted)" : ""}</span>}
              </div>
            </>
          ) : (
            <Unavailable what="Yield curve" />
          )}
          <SourceNote source="FRED (U.S. Treasury constant-maturity series DGS1MO…DGS30)" href="https://fred.stlouisfed.org/categories/115" fetchedAt={curve?.fetchedAt} stale={curve?.stale} />
        </Card>

        <Card title="Policy rates" subtitle="NY Fed reference rates">
          {policy ? (
            <div className="space-y-3">
              <div>
                <div className="text-xs text-slate-500">Fed funds target range</div>
                <div className="text-2xl font-semibold tabular-nums">{policy.data.effr?.targetFrom != null ? `${policy.data.effr.targetFrom.toFixed(2)}% – ${policy.data.effr.targetTo?.toFixed(2)}%` : "N/A"}</div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-slate-50 p-3"><div className="text-xs text-slate-500">EFFR</div><div className="font-semibold tabular-nums">{policy.data.effr ? `${policy.data.effr.rate.toFixed(2)}%` : "N/A"}</div><div className="text-[11px] text-slate-400">{dateShort(policy.data.effr?.date)}</div></div>
                <div className="rounded-xl bg-slate-50 p-3"><div className="text-xs text-slate-500">SOFR</div><div className="font-semibold tabular-nums">{policy.data.sofr ? `${policy.data.sofr.rate.toFixed(2)}%` : "N/A"}</div><div className="text-[11px] text-slate-400">{dateShort(policy.data.sofr?.date)}</div></div>
              </div>
            </div>
          ) : (
            <Unavailable what="Policy rates" />
          )}
          <SourceNote source="NY Fed Markets Data API" href="https://markets.newyorkfed.org" fetchedAt={policy?.fetchedAt} stale={policy?.stale} />
        </Card>
      </div>

      {GROUPS.map((g) => (
        <Card key={g} title={g}>
          {snap ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {snap.data.filter((p) => p.def.group === g).map((p) => {
                const ch = p.latest != null && p.previous != null ? p.latest - p.previous : null;
                const fmt = (x: number | null) => macroValue(x, p.def.unit, p.def.decimals ?? 2);
                return (
                  <div key={p.def.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4" title={p.def.note}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-medium text-slate-600">{p.def.label}</div>
                        <div className="mt-1 text-xl font-semibold tabular-nums">{p.error ? "Unavailable" : fmt(p.latest)}</div>
                        <div className="text-[11px] text-slate-400">as of {dateShort(p.date)} · prior {fmt(p.previous)}</div>
                        {ch != null && <div className={`text-xs tabular-nums ${p.def.id === "UNRATE" || p.def.id === "VIXCLS" || p.def.id === "BAMLH0A0HYM2" || p.def.id.startsWith("CPI") || p.def.id === "PCEPILFE" ? colorFor(-ch) : colorFor(ch)}`}>{ch > 0 ? "▲" : ch < 0 ? "▼" : "■"} {Math.abs(ch).toFixed(p.def.decimals ?? 2)} vs prior</div>}
                      </div>
                      <Sparkline values={p.history.slice(-48).map((h) => h.value)} width={96} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <Unavailable what="FRED data" />
          )}
          <SourceNote source="FRED series (IDs in tooltips)" href="https://fred.stlouisfed.org" fetchedAt={snap?.fetchedAt} stale={snap?.stale} />
        </Card>
      ))}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="FOMC meeting calendar" subtitle="* = meeting with Summary of Economic Projections">
          {fomc ? (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                {fomc.data.map((m) => {
                  const past = m.end < today;
                  return (
                    <tr key={m.start} className={past ? "text-slate-400" : ""}>
                      <td className="py-1.5 font-medium">{m.label}{m.hasProjections ? " *" : ""}</td>
                      <td className="py-1.5 text-right text-xs">
                        {m.statementUrl ? <a href={m.statementUrl} target="_blank" rel="noreferrer" className="text-indigo-700 hover:underline">Statement</a> : <span>{past ? "-" : "Upcoming"}</span>}
                        {m.minutesUrl && <> · <a href={m.minutesUrl} target="_blank" rel="noreferrer" className="text-indigo-700 hover:underline">Minutes</a></>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <Unavailable what="FOMC calendar" />
          )}
          <SourceNote source="federalreserve.gov FOMC calendars (parsed)" href="https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm" fetchedAt={fomc?.fetchedAt} stale={fomc?.stale} />
        </Card>

        <Card title="Upcoming BLS releases" subtitle="Next 45 days (Eastern time)">
          {bls && bls.data.length ? (
            <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto text-sm">
              {bls.data.map((e, i) => (
                <li key={i} className="flex justify-between gap-3 py-1.5"><span>{e.title}</span><span className="whitespace-nowrap text-xs text-slate-500">{dateShort(e.date)} {e.time ?? ""}</span></li>
              ))}
            </ul>
          ) : (
            <Unavailable what="Release schedule" />
          )}
          <SourceNote source="BLS release calendar (ICS)" href="https://www.bls.gov/schedule/news_release/" fetchedAt={bls?.fetchedAt} stale={bls?.stale} />
          <p className="mt-1 text-[11px] text-slate-400">Consensus forecasts are proprietary and not available from free official sources, so only dates/times are shown.</p>
        </Card>
      </div>
    </div>
  );
}
