import type { StockQuality } from "@/lib/stock-quality";
import { gradeBadgeClasses } from "@/components/GradePill";

export default function WheelGradeCardDark({ quality }: { quality: StockQuality }) {
  const g = quality.grade;
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0F1A3A] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white">Stock Quality Grade</h2>
          <p className="mt-0.5 text-xs text-slate-400">Business quality, balance sheet, valuation, analysts, size — fixed bands, not ranked vs peers</p>
        </div>
        <span className={gradeBadgeClasses(g as any)}>
          {g ?? "n/a"}
        </span>
      </div>
      {quality.score != null && (
        <div className="mt-3">
          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(100, Math.max(0, quality.score))}%` }} />
          </div>
          <div className="mt-1 flex justify-between text-[11px] text-slate-500">
            <span>Score {quality.score.toFixed(0)}/100 · Coverage {Math.round(quality.coverage * 100)}%</span>
            <span>{quality.summary}</span>
          </div>
        </div>
      )}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {quality.pillars.map((p) => (
          <div key={p.key} className="rounded-lg border border-slate-800 bg-[#0D1632] p-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-white">{p.label}</div>
              <span className={gradeBadgeClasses(p.letter as any)}>{p.letter ?? "—"}</span>
            </div>
            <div className="mt-1 text-xs leading-relaxed text-slate-400">{p.detail}</div>
            {p.score != null && <div className="mt-1 text-[11px] text-slate-500">Score {p.score.toFixed(0)} · Weight {Math.round(p.weight * 100)}%</div>}
          </div>
        ))}
      </div>
      {quality.caps.length > 0 && (
        <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <div className="text-xs font-semibold text-amber-300">Caps applied</div>
          <ul className="mt-1 list-disc pl-5 text-xs text-amber-200/80">
            {quality.caps.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
