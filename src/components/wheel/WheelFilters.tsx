import Link from "next/link";
import type { WheelFilters } from "@/lib/wheel-service";

const labelCls = "text-[10px] font-semibold tracking-[0.12em] text-slate-400";
const inputCls =
  "w-full rounded-lg border border-slate-700 bg-[#111C3E] px-2.5 py-2 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30";
const selectCls =
  "w-full rounded-lg border border-slate-700 bg-[#111C3E] px-2.5 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30";

export default function WheelFilters({ f }: { f: WheelFilters }) {
  const p = f.params;
  return (
    <form method="GET" className="rounded-xl border border-slate-800 bg-[#0F1A3A] p-4 shadow-sm">
      <div className="grid grid-cols-12 gap-3">
        {/* Row 1 */}
        <label className="col-span-6 flex flex-col gap-1.5 sm:col-span-3 lg:col-span-2">
          <span className={labelCls}>STOCK GRADE</span>
          <select name="grade" defaultValue={f.minGrade} className={selectCls}>
            <option value="A">A and A+</option>
            <option value="A+">A+ only</option>
          </select>
        </label>
        <label className="col-span-6 flex flex-col gap-1.5 sm:col-span-3 lg:col-span-2">
          <span className={labelCls}>DAYS TO EXPIRY</span>
          <div className="flex items-center gap-1.5">
            <input name="dteMin" defaultValue={p.dteMin} className={inputCls} inputMode="numeric" />
            <span className="text-xs text-slate-500">to</span>
            <input name="dteMax" defaultValue={p.dteMax} className={inputCls} inputMode="numeric" />
          </div>
        </label>
        <label className="col-span-6 flex flex-col gap-1.5 sm:col-span-3 lg:col-span-2">
          <span className={labelCls}>DELTA (ABSOLUTE)</span>
          <div className="flex items-center gap-1.5">
            <input name="dMin" defaultValue={p.deltaMin} className={inputCls} inputMode="decimal" />
            <span className="text-xs text-slate-500">to</span>
            <input name="dMax" defaultValue={p.deltaMax} className={inputCls} inputMode="decimal" />
          </div>
        </label>
        <label className="col-span-6 flex flex-col gap-1.5 sm:col-span-3 lg:col-span-2">
          <span className={labelCls}>MIN OPEN INTEREST</span>
          <input name="oi" defaultValue={p.minOi} className={inputCls} inputMode="numeric" />
        </label>
        <label className="col-span-6 flex flex-col gap-1.5 sm:col-span-3 lg:col-span-2">
          <span className={labelCls}>MAX BID/ASK GAP %</span>
          <input name="spread" defaultValue={Math.round(p.maxSpreadPct * 100)} className={inputCls} inputMode="numeric" />
        </label>
        <label className="col-span-6 flex flex-col gap-1.5 sm:col-span-3 lg:col-span-2">
          <span className={labelCls}>MIN ANNUAL RETURN %</span>
          <input name="ret" defaultValue={Math.round(p.minAnnReturn * 100)} className={inputCls} inputMode="numeric" />
        </label>

        {/* Row 2 */}
        <label className="col-span-6 flex flex-col gap-1.5 sm:col-span-4 lg:col-span-2">
          <span className={labelCls}>MIN WHEEL SCORE</span>
          <input name="minScore" defaultValue={f.minScore ?? 15} className={inputCls} inputMode="numeric" />
        </label>
        <label className="col-span-6 flex flex-col gap-1.5 sm:col-span-4 lg:col-span-2">
          <span className={labelCls}>ACCOUNT</span>
          <select name="acct" defaultValue={f.account} className={selectCls}>
            <option value="all">All</option>
            <option value="R">R (retirement)</option>
            <option value="T">T (taxable)</option>
          </select>
        </label>
        <div className="col-span-12 flex flex-col gap-3 pt-1 sm:col-span-4 lg:col-span-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <label className="inline-flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" name="earn" value="1" defaultChecked={p.allowEarnings} className="h-4 w-4 rounded border-slate-600 bg-slate-700 accent-indigo-600" />
              Include options that expire after earnings
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" name="trend" value="1" defaultChecked={f.trendOnly} className="h-4 w-4 rounded border-slate-600 bg-slate-700 accent-indigo-600" />
              Only stocks above their 200-day average
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" name="divOnly" value="1" defaultChecked={f.divOnly ?? false} className="h-4 w-4 rounded border-slate-600 bg-slate-700 accent-indigo-600" />
              Show dividend plays only
            </label>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-lg bg-[#4F6BFF] px-5 py-2 text-sm font-semibold text-white shadow hover:bg-[#5B78FF] focus:outline-none focus:ring-2 focus:ring-indigo-400/40">
              Apply Filters
            </button>
            <Link href="/wheel" className="rounded-lg px-3 py-2 text-xs font-medium text-slate-400 hover:text-white hover:underline">
              Reset
            </Link>
          </div>
        </div>
      </div>
    </form>
  );
}
