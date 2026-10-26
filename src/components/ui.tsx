import type { ReactNode } from "react";
import Link from "next/link";
import { ago, colorFor, dateTime } from "@/lib/format";
import { GRADE_WORD, type QualityGrade } from "@/lib/grades";
import { gradeBadgeClasses } from "@/components/GradePill";

export function Card({ title, subtitle, right, children, className = "" }: { title?: ReactNode; subtitle?: ReactNode; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-slate-200/80 bg-white p-5 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-black/40 ${className}`}>
      {(title || right) && (
        <header className="mb-4 flex flex-wrap items-start justify-between gap-2">
          <div>
            {title && <h2 className="text-sm font-semibold leading-5 tracking-tight text-slate-900 dark:text-white">{title}</h2>}
            {subtitle && <p className="mt-1 text-xs leading-4 text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
          {right}
        </header>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, sub, valueClass = "text-slate-900", hint }: { label: string; value: ReactNode; sub?: ReactNode; valueClass?: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-200/60 bg-slate-50/80 px-4 py-3.5 backdrop-blur-[1px] dark:border-slate-800 dark:bg-slate-900/90" title={hint}>
      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">{label}</div>
      <div className={`mt-1.5 font-mono text-[22px] font-semibold leading-none tracking-tight tabular-nums ${valueClass} dark:text-white`}>{value}</div>
      {sub && <div className="mt-1 text-xs leading-4 text-slate-500 dark:text-slate-400">{sub}</div>}
    </div>
  );
}

export function GradeBadge({ grade, title }: { grade: QualityGrade | null; title?: string }) {
  return (
    <span title={title ?? (grade ? `Fund quality: ${GRADE_WORD[grade]}` : "Not enough data to grade")} className={gradeBadgeClasses(grade)}>
      {grade ?? "n/a"}
    </span>
  );
}

export function Badge({ children, className = "", title }: { children: ReactNode; className?: string; title?: string }) {
  return <span title={title} className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${className}`}>{children}</span>;
}

/** Provenance footer: every data block says where it came from and when. */
export function SourceNote({ source, asOf, fetchedAt, stale, error, href }: { source: string; asOf?: string | null; fetchedAt?: string | null; stale?: boolean; error?: string; href?: string }) {
  return (
    <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] tracking-wide text-slate-400">
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 font-sans text-[10px] font-medium uppercase tracking-[0.08em] text-emerald-800 ring-1 ring-emerald-200/80 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30">
        Verified
      </span>
      <span>
        {href ? (
          <a href={href} target="_blank" rel="noreferrer" className="underline decoration-dotted hover:text-slate-600">
            {source}
          </a>
        ) : (
          source
        )}
      </span>
      {asOf && <span>· as of {asOf}</span>}
      {fetchedAt && <span title={dateTime(fetchedAt)}>· fetched {ago(fetchedAt)}</span>}
      {stale && (
        <span className="rounded bg-amber-100 px-1.5 py-0.5 font-sans font-medium text-amber-800" title={error}>
          STALE — last good copy
        </span>
      )}
    </p>
  );
}

export function Unavailable({ what, why, action }: { what: string; why?: string; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/90">
      <div className="font-medium text-slate-700 dark:text-slate-200">{what} unavailable</div>
      {why && <div className="mt-1 text-xs leading-relaxed">{why}</div>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function QuoteTape({
  ticker,
  name,
  last,
  changePct,
  meta,
  badges,
  actions,
}: {
  ticker: string;
  name?: ReactNode;
  last: ReactNode;
  changePct?: number | null;
  meta?: ReactNode;
  badges?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-mono text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{ticker}</h1>
          {badges}
        </div>
        {name && <p className="mt-1 truncate text-sm text-slate-500">{name}</p>}
        {meta && <p className="mt-0.5 text-[11px] text-slate-400">{meta}</p>}
      </div>
      <div className="flex flex-wrap items-end gap-4 sm:gap-6">
        <div className="sm:text-right">
          <div className="font-mono text-3xl font-semibold tabular-nums text-slate-900 dark:text-white">{last}</div>
          {changePct !== undefined && (
            <div className={`font-mono text-sm tabular-nums ${colorFor(changePct)}`}>
              {changePct == null ? "Day N/A" : `${changePct > 0 ? "+" : ""}${changePct.toFixed(2)}%`}
            </div>
          )}
          <div className="text-[11px] text-slate-400">US cash · Delayed</div>
        </div>
        {actions}
      </div>
    </section>
  );
}

export function PageHeader({ title, description, right, icon }: { title: string; description?: ReactNode; right?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <div className="flex items-center gap-3">
          {icon}
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl dark:text-white">{title}</h1>
        </div>
        {description && <p className={`mt-1.5 max-w-3xl text-xs leading-5 text-slate-500 sm:text-sm dark:text-slate-400 ${icon ? "sm:pl-[52px]" : ""}`}>{description}</p>}
      </div>
      {right}
    </div>
  );
}

export function TickerLink({ t, className = "" }: { t: string; className?: string }) {
  return (
    <Link href={`/etf/${t}`} className={`font-semibold text-emerald-800 hover:underline dark:text-emerald-300 ${className}`}>
      {t}
    </Link>
  );
}

export function Sparkline({ values, width = 120, height = 32, color = "#059669" }: { values: number[]; width?: number; height?: number; color?: string }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values
    .map((v, i) => `${((i / (values.length - 1)) * width).toFixed(1)},${(height - 2 - ((v - min) / span) * (height - 4)).toFixed(1)}`)
    .join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible" aria-hidden>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}

export function Disclaimer() {
  return (
    <p className="max-w-3xl text-xs leading-relaxed text-slate-500">
      Educational research tool, not investment advice. Past performance does not predict future results. Figures are computed from third-party data that may be delayed, incomplete or revised; always confirm with the fund&apos;s prospectus and issuer website.
    </p>
  );
}

export function TableScroll({
  children,
  className = "",
  density = "comfortable",
}: {
  children: ReactNode;
  className?: string;
  density?: "comfortable" | "compact";
}) {
  return (
    <div
      className={`cl-table-scroll rounded-xl border border-slate-200/70 bg-white dark:border-slate-800 dark:bg-[#0f172a] ${density === "compact" ? "cl-table-compact" : "cl-table-comfy"} ${className}`}
    >
      {children}
    </div>
  );
}

export function DensityToggle({
  value,
  onChange,
}: {
  value: "comfortable" | "compact";
  onChange: (v: "comfortable" | "compact") => void;
}) {
  const btn = (id: "comfortable" | "compact", label: string) => (
    <button
      type="button"
      onClick={() => onChange(id)}
      className={`rounded px-2 py-1 text-[11px] font-medium transition ${value === id ? "not-dark:bg-emerald-600 not-dark:text-white dark:bg-slate-800 dark:font-semibold dark:text-emerald-400" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"}`}
    >
      {label}
    </button>
  );
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-800 dark:bg-slate-900" role="group" aria-label="Table density">
      {btn("comfortable", "Comfortable")}
      {btn("compact", "Compact")}
    </div>
  );
}

export function ViewToggle({
  value,
  onChange,
}: {
  value: "table" | "cards";
  onChange: (v: "table" | "cards") => void;
}) {
  const btn = (id: "table" | "cards", label: string) => (
    <button
      type="button"
      onClick={() => onChange(id)}
      className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${value === id ? "not-dark:bg-emerald-600 not-dark:text-white dark:bg-slate-800 dark:font-semibold dark:text-emerald-400" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"}`}
    >
      {label}
    </button>
  );
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900" role="group" aria-label="Result layout">
      {btn("table", "Table")}
      {btn("cards", "Cards")}
    </div>
  );
}
