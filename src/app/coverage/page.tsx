import { Badge, Card, PageHeader, Stat } from "@/components/ui";
import { PageIcon, SettingsIcon } from "@/components/icons/AppIcons";
import { computeCoverage, type Field, type Readiness } from "@/lib/coverage";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
export const metadata = { title: "Data coverage · Capital Lab" };

const pc = (x: number | null) => (x == null ? "N/A" : `${Math.round(x * 100)}%`);
const tone: Record<Readiness["status"], string> = {
  ready: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  partial: "bg-amber-50 text-amber-800 ring-amber-200",
  "not ready": "bg-rose-50 text-rose-700 ring-rose-200",
  unknown: "bg-slate-100 text-slate-600 ring-slate-200",
  "info only": "bg-sky-50 text-sky-700 ring-sky-200",
};
const bar = (p: number | null) => (p == null ? "bg-slate-300" : p >= 0.9 ? "bg-emerald-500" : p >= 0.6 ? "bg-amber-500" : "bg-rose-500");

function FieldTable({ fields }: { fields: Field[] }) {
  return (
    <table className="min-w-full text-sm">
      <tbody className="divide-y divide-slate-100">
        {fields.map((f) => (
          <tr key={f.key} className="align-top">
            <td className="py-2 pr-3">
              <div className="text-slate-800">{f.label}</div>
              {f.note && <div className="text-[11px] text-slate-400">{f.note}</div>}
            </td>
            <td className="w-40 py-2 pr-3">
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full ${bar(f.pct)}`} style={{ width: `${Math.round((f.pct ?? 0) * 100)}%` }} />
              </div>
            </td>
            <td className="w-24 py-2 text-right tabular-nums text-slate-700">
              {pc(f.pct)} <span className="text-[11px] text-slate-400">({f.have}/{f.total})</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default async function CoveragePage() {
  const c = await computeCoverage();
  const groups = Array.from(new Set(c.fields.map((f) => f.group)));
  const features = Array.from(new Set(c.readiness.map((r) => r.feature)));

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<PageIcon label="Coverage"><SettingsIcon size={22} /></PageIcon>}
        title="Data coverage audit"
        description="How many ETFs actually have each field populated in this database right now, and which planned features that supports. Nothing here is estimated. Percentages are of ETFs with stored metrics (or of live quotes received)."
        right={
          <a href="/api/coverage" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500">
            View raw JSON
          </a>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Seed universe" value={c.universeSize} sub="tickers configured" />
        <Stat label="Hydrated with data" value={c.hydrated} sub={`${c.inDatabase} rows in database`} />
        <Stat label="Failed to load" value={c.failed.length} sub={c.failed.length ? "see list below" : "none"} valueClass={c.failed.length ? "text-rose-600" : "text-slate-900"} />
        <Stat label="Live quotes received" value={c.quotesReceived} sub={c.quotesFetchedAt ? `as of ${new Date(c.quotesFetchedAt).toLocaleTimeString()}` : "quotes unavailable"} />
      </div>

      {c.hydrated === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          No ETFs have been loaded yet. Open the Screener once and let the data load finish, then reload this page.
        </div>
      )}

      <Card title="Spread history (building up automatically)" subtitle="Quote samples are saved every 30 minutes during US market hours while the app is running">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Samples stored" value={c.spreadHistory.samples.toLocaleString()} sub={`${c.spreadHistory.tickers} funds`} />
          <Stat label="Trading days sampled" value={c.spreadHistory.days} sub={`need ${c.spreadHistory.minDays}+ per fund`} />
          <Stat label="Funds with usable spread" value={`${c.spreadHistory.fundsWithUsableSpread}/${c.hydrated}`} sub={`need ${c.spreadHistory.minSamples}+ samples each`} />
          <Stat label="Latest sample" value={c.spreadHistory.last ? new Date(c.spreadHistory.last).toLocaleDateString() : "none yet"} sub={c.spreadHistory.last ? new Date(c.spreadHistory.last).toLocaleTimeString() : "first sample is taken within ~1 minute of server start during market hours"} />
        </div>
      </Card>

      <Card title="Feature readiness" subtitle="Ready ≥ 90% coverage, Partial 60–89%, Not ready < 60%. Info only = shown but never used in a score.">
        <div className="space-y-5">
          {features.map((f) => (
            <div key={f}>
              <h3 className="mb-1 text-sm font-semibold text-slate-800">{f}</h3>
              <table className="min-w-full text-sm">
                <tbody className="divide-y divide-slate-100">
                  {c.readiness
                    .filter((r) => r.feature === f)
                    .map((r) => (
                      <tr key={r.component}>
                        <td className="py-1.5 pr-3 text-slate-700">{r.component}</td>
                        <td className="py-1.5 pr-3 text-[11px] text-slate-400">{r.basis}</td>
                        <td className="w-16 py-1.5 text-right tabular-nums">{pc(r.pct)}</td>
                        <td className="w-24 py-1.5 text-right">
                          <Badge className={tone[r.status]}>{r.status}</Badge>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {groups.map((g) => (
          <Card key={g} title={g}>
            <FieldTable fields={c.fields.filter((f) => f.group === g)} />
          </Card>
        ))}
      </div>

      <Card title="Coverage by asset class" subtitle="Gaps often cluster (e.g. bond or commodity funds lacking holdings)">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="py-2 text-left font-medium">Class</th>
                <th className="py-2 text-right font-medium">ETFs</th>
                <th className="py-2 text-right font-medium">Expense</th>
                <th className="py-2 text-right font-medium">AUM</th>
                <th className="py-2 text-right font-medium">Holdings + weights</th>
                <th className="py-2 text-right font-medium">Allocation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {c.byAssetClass.map((a) => (
                <tr key={a.assetClass}>
                  <td className="py-1.5">{a.assetClass}</td>
                  <td className="py-1.5 text-right tabular-nums">{a.n}</td>
                  <td className="py-1.5 text-right tabular-nums">{pc(a.expense / a.n)}</td>
                  <td className="py-1.5 text-right tabular-nums">{pc(a.aum / a.n)}</td>
                  <td className="py-1.5 text-right tabular-nums">{pc(a.holdings / a.n)}</td>
                  <td className="py-1.5 text-right tabular-nums">{pc(a.alloc / a.n)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {(c.failed.length > 0 || c.missingExpense.length > 0) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {c.failed.length > 0 && (
            <Card title="Tickers that failed to load">
              <ul className="space-y-1 text-sm">
                {c.failed.map((f) => (
                  <li key={f.ticker}>
                    <span className="font-semibold">{f.ticker}</span> <span className="text-xs text-slate-500">{f.error}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {c.missingExpense.length > 0 && (
            <Card title="Loaded but no expense ratio" subtitle="Would be N/A in any cost-based score">
              <p className="text-sm text-slate-700">{c.missingExpense.join(", ")}</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
