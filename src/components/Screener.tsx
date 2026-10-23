"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge, GradeBadge } from "@/components/ui";
import { gradeRank, type QualityGrade } from "@/lib/grades";
import { erosionStyle } from "@/lib/format";

export type ScreenRow = {
  ticker: string;
  name: string | null;
  category: string | null;
  family: string | null;
  leveraged: boolean;
  assetClass: string;
  quality: QualityGrade | null;
  qualityScore: number | null;
  price: number | null;
  changePct: number | null;
  expense: number | null;
  yieldTtm: number | null;
  aum: number | null;
  ytd: number | null;
  r1y: number | null;
  r3y: number | null;
  r5y: number | null;
  vol3y: number | null;
  dd3y: number | null;
  sharpe: number | null;
  erosion: string;
  priceRet3y: number | null;
  capFunded: number | null;
  divCagr3y: number | null;
  freq: string;
};

type SortKey = keyof ScreenRow;

const pctFmt = (x: number | null, dp = 2, sign = false) => (x == null ? "N/A" : `${sign && x > 0 ? "+" : ""}${(x * 100).toFixed(dp)}%`);
const colorOf = (x: number | null) => (x == null ? "text-slate-400" : x > 0 ? "text-emerald-600" : x < 0 ? "text-rose-600" : "text-slate-600");
const aumFmt = (x: number | null) => {
  if (x == null) return "N/A";
  if (x >= 1e12) return `$${(x / 1e12).toFixed(2)}T`;
  if (x >= 1e9) return `$${(x / 1e9).toFixed(1)}B`;
  if (x >= 1e6) return `$${(x / 1e6).toFixed(0)}M`;
  return `$${x.toFixed(0)}`;
};

const COLUMNS: { key: SortKey; label: string; align?: "right"; hint?: string }[] = [
  { key: "ticker", label: "ETF" },
  { key: "category", label: "Category" },
  { key: "qualityScore", label: "Quality", hint: "Fund quality grade A-F: cost, size, trading ease, diversification, income sustainability. Not a performance forecast." },
  { key: "price", label: "Price", align: "right" },
  { key: "changePct", label: "Day", align: "right", hint: "Delayed quote, % change" },
  { key: "expense", label: "Expense", align: "right", hint: "Annual report expense ratio" },
  { key: "yieldTtm", label: "Yield TTM", align: "right", hint: "Sum of distributions in last 12 months ÷ price" },
  { key: "aum", label: "AUM", align: "right" },
  { key: "ytd", label: "YTD", align: "right", hint: "Total return" },
  { key: "r1y", label: "1Y", align: "right", hint: "Total return" },
  { key: "r3y", label: "3Y ann.", align: "right", hint: "Annualised total return" },
  { key: "r5y", label: "5Y ann.", align: "right", hint: "Annualised total return" },
  { key: "vol3y", label: "Vol 3Y", align: "right", hint: "Annualised volatility" },
  { key: "dd3y", label: "Max DD 3Y", align: "right", hint: "Max drawdown on total-return series" },
  { key: "sharpe", label: "Sharpe 3Y", align: "right", hint: "(3Y annualised total return − 3M T-bill) ÷ volatility" },
  { key: "erosion", label: "NAV erosion", hint: "Proxy from annualised 3Y price return (see ETF page)" },
];

export default function Screener({ rows }: { rows: ScreenRow[] }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [minYield, setMinYield] = useState("");
  const [maxExp, setMaxExp] = useState("");
  const [minAum, setMinAum] = useState("");
  const [erosion, setErosion] = useState("");
  const [freq, setFreq] = useState("");
  const [minGrade, setMinGrade] = useState("");
  const [hideLev, setHideLev] = useState(true);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "aum", dir: -1 });
  const [picked, setPicked] = useState<string[]>([]);

  const categories = useMemo(() => Array.from(new Set(rows.map((r) => r.category).filter((x): x is string => !!x))).sort(), [rows]);
  const freqs = useMemo(() => Array.from(new Set(rows.map((r) => r.freq))).sort(), [rows]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    const my = minYield ? Number(minYield) / 100 : null;
    const me = maxExp ? Number(maxExp) / 100 : null;
    const ma = minAum ? Number(minAum) : null;
    const out = rows.filter((r) => {
      if (hideLev && r.leveraged) return false;
      if (ql && !(r.ticker.toLowerCase().includes(ql) || (r.name ?? "").toLowerCase().includes(ql) || (r.family ?? "").toLowerCase().includes(ql))) return false;
      if (cat && r.category !== cat) return false;
      if (my != null && (r.yieldTtm == null || r.yieldTtm < my)) return false;
      if (me != null && (r.expense == null || r.expense > me)) return false;
      if (ma != null && (r.aum == null || r.aum < ma)) return false;
      if (erosion && r.erosion !== erosion) return false;
      if (freq && r.freq !== freq) return false;
      if (minGrade && (r.quality == null || gradeRank(r.quality) > gradeRank(minGrade as QualityGrade))) return false;
      return true;
    });
    const { key, dir } = sort;
    return out.sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      if (av == null && bv == null) return 0;
      if (av == null) return 1; // missing values always last
      if (bv == null) return -1;
      if (typeof av === "string" && typeof bv === "string") return av.localeCompare(bv) * dir;
      return ((av as number) - (bv as number)) * dir;
    });
  }, [rows, q, cat, minYield, maxExp, minAum, erosion, freq, minGrade, hideLev, sort]);

  const toggle = (t: string) => setPicked((p) => (p.includes(t) ? p.filter((x) => x !== t) : p.length >= 5 ? p : [...p, t]));
  const field = "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none";

  return (
    <div>
      <div className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <input className={field} placeholder="Search ticker, name or issuer" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={field} value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <label className="whitespace-nowrap text-xs text-slate-500">Min yield %</label>
          <input className={`${field} w-full`} type="number" step="0.5" min="0" value={minYield} onChange={(e) => setMinYield(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <label className="whitespace-nowrap text-xs text-slate-500">Max expense %</label>
          <input className={`${field} w-full`} type="number" step="0.05" min="0" value={maxExp} onChange={(e) => setMaxExp(e.target.value)} />
        </div>
        <select className={field} value={minAum} onChange={(e) => setMinAum(e.target.value)}>
          <option value="">Any size (AUM)</option>
          <option value="100000000">≥ $100M</option>
          <option value="1000000000">≥ $1B</option>
          <option value="10000000000">≥ $10B</option>
          <option value="100000000000">≥ $100B</option>
        </select>
        <select className={field} value={erosion} onChange={(e) => setErosion(e.target.value)}>
          <option value="">Any NAV-erosion level</option>
          {["None", "Mild", "Moderate", "Severe"].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <select className={field} value={freq} onChange={(e) => setFreq(e.target.value)}>
          <option value="">Any distribution frequency</option>
          {freqs.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <select className={field} value={minGrade} onChange={(e) => setMinGrade(e.target.value)} aria-label="Minimum quality grade">
          <option value="">Any quality grade</option>
          <option value="A">Quality A only</option>
          <option value="B">Quality B or better</option>
          <option value="C">Quality C or better</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={hideLev} onChange={(e) => setHideLev(e.target.checked)} className="h-4 w-4 accent-indigo-600" />
          Hide leveraged / inverse
        </label>
      </div>

      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
        <span>
          {filtered.length} of {rows.length} ETFs
        </span>
        <div className="flex items-center gap-2">
          {picked.length > 0 && <span className="text-xs text-slate-500">{picked.join(", ")}</span>}
          <Link
            href={picked.length >= 2 ? `/compare?t=${picked.join(",")}` : "#"}
            aria-disabled={picked.length < 2}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${picked.length >= 2 ? "bg-indigo-600 text-white hover:bg-indigo-500" : "cursor-not-allowed bg-slate-200 text-slate-500"}`}
          >
            Compare selected ({picked.length}/5)
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="w-8 px-3 py-3" />
              {COLUMNS.map((c) => (
                <th key={c.key} title={c.hint} className={`cursor-pointer whitespace-nowrap px-3 py-3 font-medium hover:text-slate-900 ${c.align === "right" ? "text-right" : "text-left"}`} onClick={() => setSort((s) => (s.key === c.key ? { key: c.key, dir: (s.dir * -1) as 1 | -1 } : { key: c.key, dir: c.key === "ticker" || c.key === "category" || c.key === "expense" || c.key === "vol3y" ? 1 : -1 }))}>
                  {c.label}
                  {sort.key === c.key && <span className="ml-1">{sort.dir === 1 ? "▲" : "▼"}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((r) => (
              <tr key={r.ticker} className="hover:bg-indigo-50/40">
                <td className="px-3 py-2">
                  <input type="checkbox" checked={picked.includes(r.ticker)} onChange={() => toggle(r.ticker)} className="h-4 w-4 accent-indigo-600" aria-label={`Select ${r.ticker} for comparison`} />
                </td>
                <td className="px-3 py-2">
                  <Link href={`/etf/${r.ticker}`} className="font-semibold text-indigo-700 hover:underline">
                    {r.ticker}
                  </Link>
                  <div className="max-w-[220px] truncate text-xs text-slate-500" title={r.name ?? ""}>
                    {r.name ?? "N/A"}
                  </div>
                </td>
                <td className="max-w-[160px] truncate px-3 py-2 text-xs text-slate-600" title={r.category ?? ""}>
                  {r.category ?? "N/A"}
                </td>
                <td className="px-3 py-2">
                  <GradeBadge grade={r.quality} />
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{r.price == null ? "N/A" : `$${r.price.toFixed(2)}`}</td>
                <td className={`px-3 py-2 text-right tabular-nums ${colorOf(r.changePct)}`}>{r.changePct == null ? "N/A" : `${r.changePct > 0 ? "+" : ""}${r.changePct.toFixed(2)}%`}</td>
                <td className="px-3 py-2 text-right tabular-nums">{pctFmt(r.expense)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{pctFmt(r.yieldTtm)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{aumFmt(r.aum)}</td>
                <td className={`px-3 py-2 text-right tabular-nums ${colorOf(r.ytd)}`}>{pctFmt(r.ytd, 1, true)}</td>
                <td className={`px-3 py-2 text-right tabular-nums ${colorOf(r.r1y)}`}>{pctFmt(r.r1y, 1, true)}</td>
                <td className={`px-3 py-2 text-right tabular-nums ${colorOf(r.r3y)}`}>{pctFmt(r.r3y, 1, true)}</td>
                <td className={`px-3 py-2 text-right tabular-nums ${colorOf(r.r5y)}`}>{pctFmt(r.r5y, 1, true)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{pctFmt(r.vol3y, 1)}</td>
                <td className="px-3 py-2 text-right tabular-nums text-rose-600">{pctFmt(r.dd3y, 1)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{r.sharpe == null ? "N/A" : r.sharpe.toFixed(2)}</td>
                <td className="px-3 py-2">
                  <Badge className={erosionStyle[r.erosion] ?? erosionStyle["n/a"]}>{r.erosion}</Badge>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="px-3 py-10 text-center text-slate-500">
                  No ETFs match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
