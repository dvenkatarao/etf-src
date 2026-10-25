import Link from "next/link";
import type { Takeaway } from "@/lib/etf-takeaway";

export default function EtfTakeaway({ t, ticker }: { t: Takeaway; ticker: string }) {
  const border = t.tone === "warn" ? "border-rose-200 bg-rose-50" : t.tone === "caution" ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50";
  const dot = t.tone === "warn" ? "bg-rose-500" : t.tone === "caution" ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className={`rounded-2xl border ${border} p-5 shadow-sm`}>
      <div className="flex items-start gap-3">
        <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${dot}`} />
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Takeaway — what this fund is and isn't</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-800">{t.headline}</p>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">{t.detail}</p>
          <p className="mt-2 text-xs"><span className="font-medium text-slate-800">Suits:</span> <span className="text-slate-600">{t.suitable}</span></p>
          <p className="mt-1 text-xs"><span className="font-medium text-slate-800">Watch:</span> <span className="text-slate-600">{t.watch}</span></p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={`/compare?t=${ticker}`} className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-teal-700 ring-1 ring-slate-200 hover:bg-teal-50">Compare peers →</Link>
            <Link href={`/screener`} className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-white hover:ring-1 hover:ring-slate-200">Screen more like this →</Link>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">One-line synthesis, not advice. Based on price history, distributions and provider fields shown below.</p>
        </div>
      </div>
    </div>
  );
}
