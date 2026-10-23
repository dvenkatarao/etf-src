import { Card } from "@/components/ui";
import { GRADE_WORD, gradeStyle } from "@/lib/grades";
import type { Pillar, QualityResult } from "@/lib/quality";

const barColor = (s: number) => (s >= 85 ? "bg-emerald-500" : s >= 70 ? "bg-lime-500" : s >= 55 ? "bg-amber-500" : s >= 40 ? "bg-orange-500" : "bg-rose-500");

function PillarRow({ p }: { p: Pillar }) {
  return (
    <li className="py-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-slate-800">
          {p.label} <span className="text-xs font-normal text-slate-400">· {Math.round(p.weight * 100)}% of grade</span>
        </span>
        <span className="tabular-nums text-slate-600">{p.score != null ? Math.round(p.score) : p.status === "not applicable" ? "n/a" : "no data"}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
        {p.score != null && <div className={`h-full ${barColor(p.score)}`} style={{ width: `${Math.round(p.score)}%` }} />}
      </div>
      <p className="mt-1 text-xs text-slate-500">{p.detail}</p>
    </li>
  );
}

export default function QualityCard({ quality: q }: { quality: QualityResult }) {
  return (
    <Card title="Fund quality grade" subtitle="How well built is this product? Cost, size, trading ease, diversification and income sustainability. This is not a forecast of returns.">
      <div className="flex flex-wrap items-center gap-4">
        <div className={`grid h-16 w-16 place-items-center rounded-2xl text-3xl font-bold ring-1 ring-inset ${gradeStyle[q.grade ?? "none"]}`}>{q.grade ?? "–"}</div>
        <div className="min-w-[200px] flex-1">
          <div className="text-lg font-semibold text-slate-900">
            {q.grade ? GRADE_WORD[q.grade] : "Not graded"}
            {q.score != null && <span className="ml-2 text-sm font-normal tabular-nums text-slate-500">{Math.round(q.score)}/100</span>}
          </div>
          <p className="text-sm text-slate-600">{q.summary}</p>
          <p className="text-[11px] text-slate-400">Based on {Math.round(q.coverage * 100)}% of the grading criteria having data.</p>
        </div>
      </div>

      {q.caps.length > 0 && (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          <div className="font-semibold">
            {q.rawGrade && q.rawGrade !== q.grade
              ? `Grade limited to ${q.grade ?? "—"} (would otherwise be ${q.rawGrade})`
              : "Risk flags (grade is capped at C)"}
          </div>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-xs">
            {q.caps.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      <ul className="mt-4 divide-y divide-slate-100">
        {q.pillars.map((p) => (
          <PillarRow key={p.key} p={p} />
        ))}
      </ul>

      {q.notes.length > 0 && (
        <ul className="mt-3 space-y-2">
          {q.notes.map((n) => (
            <li key={n} className="rounded-lg bg-amber-50 p-2 text-xs text-amber-900">
              {n}
            </li>
          ))}
        </ul>
      )}

      <details className="mt-4 text-xs text-slate-500">
        <summary className="cursor-pointer font-medium text-slate-600">How the grade is worked out</summary>
        <div className="mt-2 space-y-2 leading-relaxed">
          <p>Each criterion is scored 0–100 against fixed bands (not against other funds), then combined with these weights: cost 30%, size and track record 20%, ease of trading 20%, diversification 15%, income sustainability 15%. Criteria without data are left out and the rest are re-weighted; with under 70% of the weight available no grade is given.</p>
          <p>A = 85 or more, B = 70–84, C = 55–69, D = 40–54, F = below 40. Leveraged or inverse funds, funds under $100 million, and funds younger than 2 years are held to a maximum of C regardless of score.</p>
          <p>Cost bands depend on the type of fund (for example an equity fund at 0.10% or less scores 100, at 0.40% about 65, and at 1.0% or more scores 0). Income sustainability is only scored for non-bond funds yielding 4% or more, using the price-trend-based NAV-erosion check.</p>
          <p>The buy/sell price gap is measured from samples taken during market hours and only counts once at least 20 samples across 5 days exist. Until then ease of trading uses daily trading volume alone. Data comes from Yahoo Finance and may be delayed or incomplete. This is an educational rating, not personal advice.</p>
        </div>
      </details>
    </Card>
  );
}
