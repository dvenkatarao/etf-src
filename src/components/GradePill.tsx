/** Single source for grade/quality icons — light pastel + dark translucent, same palette for ETFs and Wheel. */
import { GRADE_WORD, type QualityGrade } from "@/lib/grades";
import { STOCK_GRADE_WORD, type StockGrade } from "@/lib/stock-quality";

type AnyGrade = QualityGrade | StockGrade | null;

const wordFor = (g: string | null): string => {
  if (!g) return "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (GRADE_WORD as any)[g] ?? (STOCK_GRADE_WORD as any)[g] ?? "";
};

/** Badge pill: text-xs, ring-1, theme-aware via tailwind dark: (html.dark) */
export function gradeBadgeClasses(grade: AnyGrade): string {
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset";
  switch (grade) {
    case "A+":
      return `${base} bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:ring-emerald-500/30`;
    case "A":
      return `${base} bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/20`;
    case "B":
      return `${base} bg-lime-50 text-lime-700 ring-lime-200 dark:bg-lime-500/15 dark:text-lime-300 dark:ring-lime-500/20`;
    case "C":
      return `${base} bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/20`;
    case "D":
      return `${base} bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:ring-orange-500/20`;
    case "F":
      return `${base} bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/20`;
    default:
      return `${base} bg-slate-100 text-slate-500 ring-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:ring-slate-600`;
  }
}

/** Large 64×64 grade icon: rounded-2xl, text-3xl */
export function gradeIconClasses(grade: AnyGrade): string {
  const base = "grid h-16 w-16 place-items-center rounded-2xl text-3xl font-bold ring-1 ring-inset";
  switch (grade) {
    case "A+":
      return `${base} bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:ring-emerald-500/30`;
    case "A":
      return `${base} bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/20`;
    case "B":
      return `${base} bg-lime-50 text-lime-700 ring-lime-200 dark:bg-lime-500/15 dark:text-lime-300 dark:ring-lime-500/20`;
    case "C":
      return `${base} bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/20`;
    case "D":
      return `${base} bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:ring-orange-500/20`;
    case "F":
      return `${base} bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/20`;
    default:
      return `${base} bg-slate-100 text-slate-500 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700`;
  }
}

export function GradeBadgeUnified({ grade, withWord }: { grade: AnyGrade; withWord?: boolean }) {
  const w = withWord ? wordFor(grade) : "";
  const title = grade ? `Quality: ${w || grade}` : "Not enough data to grade";
  return (
    <span title={title} className={gradeBadgeClasses(grade)}>
      {grade ?? "n/a"}
      {withWord && w ? ` · ${w}` : ""}
    </span>
  );
}

export function GradeIcon({ grade }: { grade: AnyGrade }) {
  return <div className={gradeIconClasses(grade)}>{grade ?? "–"}</div>;
}
