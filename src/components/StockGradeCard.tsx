import { Card } from "@/components/ui";
import { STOCK_GRADE_WORD, stockGradeStyle, type StockPillar, type StockQuality } from "@/lib/stock-quality";

const barColor = (s: number) => (s >= 85 ? "bg-emerald-500" : s >= 70 ? "bg-lime-500" : s >= 55 ? "bg-amber-500" : s >= 40 ? "bg-orange-500" : "bg-rose-500");

function Row({ p }: { p: StockPillar }) {
  return (
    <li className="py-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-slate-800">
          {p.label} <span className="text-xs font-normal text-slate-400">· {Math.round(p.weight * 100)}% of grade</span>
        </span>
        <span className="tabular-nums text-slate-600">{p.score != null ? `${p.letter} · ${Math.round(p.score)}` : "no data"}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">{p.score != null && <div className={`h-full ${barColor(p.score)}`} style={{ width: `${Math.round(p.score)}%` }} />}</div>
      <p className="mt-1 text-xs text-slate-500">{p.detail}</p>
    </li>
  );
}

export default function StockGradeCard({ quality: q }: { quality: StockQuality }) {
  return (
    <Card title="Stock quality grade" subtitle="Would you be happy to own this company if a put is assigned? Business quality, balance sheet, valuation, analysts and size. Not a forecast.">
      <div className="flex flex-wrap items-center gap-4">
        <div className={`grid h-16 w-16 place-items-center rounded-2xl text-3xl font-bold ring-1 ring-inset ${stockGradeStyle[q.grade ?? "none"]}`}>{q.grade ?? "–"}</div>
        <div className="min-w-[200px] flex-1">
          <div className="text-lg font-semibold text-slate-900">
            {q.grade ? STOCK_GRADE_WORD[q.grade] : "Not graded"}
            {q.score != null && <span className="ml-2 text-sm font-normal tabular-nums text-slate-500">{Math.round(q.score)}/100</span>}
          </div>
          <p className="text-sm text-slate-600">{q.summary}</p>
          <p className="text-[11px] text-slate-400">Based on {Math.round(q.coverage * 100)}% of the grading criteria having data.</p>
        </div>
      </div>
      {q.caps.length > 0 && (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          <div className="font-semibold">{q.rawGrade && q.rawGrade !== q.grade ? `Grade limited to ${q.grade} (would otherwise be ${q.rawGrade})` : "Risk flags"}</div>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-xs">{q.caps.map((c) => <li key={c}>{c}</li>)}</ul>
        </div>
      )}
      <ul className="mt-4 divide-y divide-slate-100">{q.pillars.map((p) => <Row key={p.key} p={p} />)}</ul>
      <details className="mt-3 text-xs text-slate-500">
        <summary className="cursor-pointer font-medium text-slate-600">How the grade is worked out</summary>
        <p className="mt-2">
          Each criterion is scored 0–100 against fixed bands (never against other stocks) and combined: business quality 30%, financial strength 20%, valuation 20%, analyst view 15%, size and stability 15%.
          A+ = 90 or more, A = 80–89, B = 65–79, C = 50–64, D = 35–49, F = below 35. Losses, negative free cash flow, a market cap under $10B, a sell-leaning analyst consensus or a 40%+ one-year fall cap the grade.
          Criteria without data are left out and the rest re-weighted; under 70% coverage means no grade. Analysts only count when at least 8 cover the stock. Data: Yahoo Finance (unofficial), may be delayed or incomplete.
        </p>
      </details>
    </Card>
  );
}
