import type { ReactNode } from "react";
import Link from "next/link";
import { ago, dateTime } from "@/lib/format";
import { GRADE_WORD, gradeStyle, type QualityGrade } from "@/lib/grades";

export function Card({ title, subtitle, right, children, className = "" }: { title?: ReactNode; subtitle?: ReactNode; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-slate-200/70 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_12px_rgba(15,23,42,0.06)] ${className}`}>
      {(title || right) && (
        <header className="mb-4 flex flex-wrap items-start justify-between gap-2">
          <div>
            {title && <h2 className="text-sm font-semibold leading-5 tracking-tight text-slate-900">{title}</h2>}
            {subtitle && <p className="mt-1 text-xs leading-4 text-slate-500">{subtitle}</p>}
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
    <div className="rounded-xl border border-slate-200/60 bg-slate-50/80 px-4 py-3.5 backdrop-blur-[1px]" title={hint}>
      <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</div>
      <div className={`mt-1.5 text-[22px] font-semibold leading-none tracking-tight tabular-nums ${valueClass}`}>{value}</div>
      {sub && <div className="mt-1 text-xs leading-4 text-slate-500">{sub}</div>}
    </div>
  );
}

export function GradeBadge({ grade, title }: { grade: QualityGrade | null; title?: string }) {
  return (
    <span title={title ?? (grade ? `Fund quality: ${GRADE_WORD[grade]}` : "Not enough data to grade")}>
      <Badge className={gradeStyle[grade ?? "none"]}>{grade ?? "n/a"}</Badge>
    </span>
  );
}

export function Badge({ children, className = "", title }: { children: ReactNode; className?: string; title?: string }) {
  return <span title={title} className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${className}`}>{children}</span>;
}

/** Provenance footer: every data block says where it came from and when. */
export function SourceNote({ source, asOf, fetchedAt, stale, error, href }: { source: string; asOf?: string | null; fetchedAt?: string | null; stale?: boolean; error?: string; href?: string }) {
  return (
    <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-400">
      <span>
        Source:{" "}
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
        <span className="rounded bg-amber-100 px-1.5 py-0.5 font-medium text-amber-800" title={error}>
          STALE - upstream unavailable, showing last good copy
        </span>
      )}
    </p>
  );
}

export function Unavailable({ what, why }: { what: string; why?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
      <div className="font-medium text-slate-600">{what} unavailable</div>
      {why && <div className="mt-1 text-xs">{why}</div>}
    </div>
  );
}

export function PageHeader({ title, description, right }: { title: string; description?: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-3xl text-[13px] leading-5 text-slate-500">{description}</p>}
      </div>
      {right}
    </div>
  );
}

export function TickerLink({ t, className = "" }: { t: string; className?: string }) {
  return (
    <Link href={`/etf/${t}`} className={`font-semibold text-indigo-700 hover:underline ${className}`}>
      {t}
    </Link>
  );
}

export function Sparkline({ values, width = 120, height = 32, color = "#4f46e5" }: { values: number[]; width?: number; height?: number; color?: string }) {
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
    <p className="text-xs leading-relaxed text-slate-500">
      Educational research tool, not investment advice. Past performance does not predict future results. Figures are computed from third-party data that may be delayed, incomplete or revised; always confirm with the fund&apos;s prospectus and issuer website.
    </p>
  );
}
