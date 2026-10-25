import type { StockQuality } from "@/lib/stock-quality";
import { gradeBadgeClasses } from "@/components/GradePill";

export default function WheelGradeCardDark({ quality, annReturn }: { quality: StockQuality; annReturn?: number | null }) {
  const g = quality.grade;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0F1A3A]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Stock Quality Grade</h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Business quality, balance sheet, valuation, analysts, size — fixed bands, not ranked vs peers. Hover pillars for why.
          </p>
        </div>
        <span className={gradeBadgeClasses(g as any)}>{g ?? "n/a"}</span>
      </div>
      {quality.score != null && (
        <div className="mt-3">
          <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div className="h-full rounded-full bg-teal-500" style={{ width: `${Math.min(100, Math.max(0, quality.score))}%` }} />
          </div>
          <div className="mt-1 flex flex-wrap justify-between gap-2 text-[11px] text-slate-500">
            <span>Score {quality.score.toFixed(0)}/100 · Coverage {Math.round(quality.coverage * 100)}%</span>
            <span className="max-w-[60%] text-right">{quality.summary}</span>
          </div>
          {annReturn != null && quality.grade && ["B","C","D","F"].includes(quality.grade) && annReturn >= 0.12 && (
            <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
              High return {(annReturn*100).toFixed(1)}%/yr but grade {quality.grade} — premium pays for risk (e.g. beta, drawdown, or caps below). You can still sell if you accept owning it at this quality.
            </div>
          )}
        </div>
      )}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {quality.pillars.map((p) => (
          <div
            key={p.key}
            title={
              p.score != null
                ? `${p.label}: ${p.score.toFixed(0)}/100 (${p.letter}) — ${p.detail} | Weight ${Math.round(p.weight * 100)}%`
                : p.detail
            }
            className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-[#0D1632] cursor-help transition hover:border-teal-200 dark:hover:border-teal-500/30"
          >
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-slate-900 dark:text-white">{p.label}</div>
              <span className={gradeBadgeClasses(p.letter as any)}>{p.letter ?? "—"}</span>
            </div>
            <div className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{p.detail}</div>
            {p.score != null && <div className="mt-1 text-[11px] text-slate-500">Score {p.score.toFixed(0)} · Weight {Math.round(p.weight * 100)}%</div>}
          </div>
        ))}
      </div>
      {quality.caps.length > 0 && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/30 dark:bg-amber-500/10">
          <div className="text-xs font-semibold text-amber-800 dark:text-amber-300">Caps applied — why grade is lower than raw score ({quality.rawGrade} → {quality.grade})</div>
          <ul className="mt-1 list-disc pl-5 text-xs text-amber-800/80 dark:text-amber-200/80">
            {quality.caps.map((c, i) => (
              <li key={i} title="Hard cap: even with strong other pillars, this risk forces grade down">{c}</li>
            ))}
          </ul>
        </div>
      )}
      <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
        Tip: high options return ≠ high grade. Premium is payment for risk. Check {`pillars where score <55`} and caps above before selling — then decide if you're comfortable owning 100 shares at this strike.
      </p>
    </div>
  );
}
