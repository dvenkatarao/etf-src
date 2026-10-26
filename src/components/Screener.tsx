"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge, DensityToggle, GradeBadge, TableScroll, ViewToggle } from "@/components/ui";
import Glossary from "@/components/Glossary";
import { CompareIcon, FiltersIcon, IconTile, ImportExportIcon, SearchIcon } from "@/components/icons/AppIcons";
import { gradeRank, type QualityGrade } from "@/lib/grades";
import { erosionStyle } from "@/lib/format";
import { downloadCsv, screenerCsvRows } from "@/lib/csv-export";

export type ScreenRow = {
  ticker: string;
  name: string | null;
  category: string | null;
  family: string | null;
  leveraged: boolean;
  assetClass: string;
  rateTag: "defensive" | "neutral" | "sensitive";
  rateLabel: string;
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
  { key: "rateTag", label: "Rates", hint: "Rate sensitivity: Defensive holds up when rates rise, Sensitive falls. Derived from category & asset class." },
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

const YIELD_MAX = 15;
const EXP_MAX = 2.5;
const labelCls = "text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400";
const field =
  "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-[#0f172a]";

function RateBadge({ tag, label }: { tag: ScreenRow["rateTag"]; label: string }) {
  return (
    <Badge
      className={
        tag === "defensive"
          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
          : tag === "sensitive"
            ? "bg-rose-50 text-rose-700 ring-rose-200"
            : "bg-slate-100 text-slate-600 ring-slate-200"
      }
      title={label}
    >
      {tag === "defensive" ? "Defensive" : tag === "sensitive" ? "Sensitive" : "Neutral"}
    </Badge>
  );
}

export default function Screener({ rows }: { rows: ScreenRow[] }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [minYield, setMinYield] = useState("");
  const [maxExp, setMaxExp] = useState("");
  const [minAum, setMinAum] = useState("");
  const [erosion, setErosion] = useState("");
  const [freq, setFreq] = useState("");
  const [minGrade, setMinGrade] = useState("");
  const [rateFilter, setRateFilter] = useState("");
  const [hideLev, setHideLev] = useState(true);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "aum", dir: -1 });
  const [picked, setPicked] = useState<string[]>([]);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [view, setView] = useState<"table" | "cards">("table");
  const [more, setMore] = useState(false);

  useEffect(() => {
    if (window.innerWidth < 768) setView("cards");
  }, []);

  const categories = useMemo(() => Array.from(new Set(rows.map((r) => r.category).filter((x): x is string => !!x))).sort(), [rows]);
  const freqs = useMemo(() => Array.from(new Set(rows.map((r) => r.freq))).sort(), [rows]);

  const yieldSlider = minYield === "" ? 0 : Number(minYield);
  const expSlider = maxExp === "" ? EXP_MAX : Number(maxExp);

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
      if (rateFilter && r.rateTag !== rateFilter) return false;
      return true;
    });
    const { key, dir } = sort;
    return out.sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "string" && typeof bv === "string") return av.localeCompare(bv) * dir;
      return ((av as number) - (bv as number)) * dir;
    });
  }, [rows, q, cat, minYield, maxExp, minAum, erosion, freq, minGrade, rateFilter, hideLev, sort]);

  const toggle = (t: string) => setPicked((p) => (p.includes(t) ? p.filter((x) => x !== t) : p.length >= 5 ? p : [...p, t]));

  const clearAll = () => {
    setQ("");
    setCat("");
    setMinYield("");
    setMaxExp("");
    setMinAum("");
    setErosion("");
    setFreq("");
    setMinGrade("");
    setRateFilter("");
    setHideLev(true);
  };

  const extraCount = [minAum, erosion, freq, minGrade, rateFilter, !hideLev].filter(Boolean).length;

  const emptyHint = (
    <div className="px-3 py-6 text-center">
      <p className="font-medium text-slate-700">No ETFs match these filters.</p>
      <p className="mt-1 text-xs text-slate-500">
        Active:{" "}
        {[
          q && `search "${q}"`,
          cat && `category ${cat}`,
          minYield && `yield ≥${minYield}%`,
          maxExp && `expense ≤${maxExp}%`,
          minAum && `AUM ≥$${(Number(minAum) / 1e9).toFixed(0)}B`,
          erosion && `erosion ${erosion}`,
          freq && `dist ${freq}`,
          minGrade && `grade ≥${minGrade}`,
          rateFilter && `${rateFilter}`,
          hideLev && "hide leveraged",
        ]
          .filter(Boolean)
          .join(" · ") || "none"}
      </p>
      <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-300">
        Try: lower <b>Min yield</b> by 0.5–1pp, widen <b>Max expense</b>, lower <b>AUM</b> to $100M, or set <b>erosion</b> to Any.{" "}
        <button onClick={clearAll} className="underline text-emerald-700 dark:text-emerald-300">
          Clear all
        </button>
      </p>
    </div>
  );

  return (
    <div>
      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#0f172a]">
        <div className="mb-3 flex items-center gap-2">
          <IconTile size={28}>
            <FiltersIcon size={16} />
          </IconTile>
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Filters</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <span className={labelCls}>Search</span>
            <span className="pointer-events-none absolute left-3 top-[1.85rem] opacity-80">
              <SearchIcon size={14} />
            </span>
            <input className={`${field} mt-1 w-full pl-9`} placeholder="Ticker, name or issuer" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <label className="flex flex-col gap-1">
            <span className={labelCls}>Category</span>
            <select className={field} value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelCls}>Min yield {yieldSlider === 0 ? "any" : `${yieldSlider.toFixed(1)}%`}</span>
            <input
              type="range"
              min={0}
              max={YIELD_MAX}
              step={0.5}
              value={yieldSlider}
              onChange={(e) => {
                const v = Number(e.target.value);
                setMinYield(v === 0 ? "" : String(v));
              }}
              className="mt-2 w-full"
              aria-label="Minimum yield percent"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelCls}>Max expense {expSlider >= EXP_MAX ? "any" : `${expSlider.toFixed(2)}%`}</span>
            <input
              type="range"
              min={0.05}
              max={EXP_MAX}
              step={0.05}
              value={expSlider}
              onChange={(e) => {
                const v = Number(e.target.value);
                setMaxExp(v >= EXP_MAX ? "" : String(v));
              }}
              className="mt-2 w-full"
              aria-label="Maximum expense ratio percent"
            />
          </label>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setMore((m) => !m)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#0f172a] dark:text-slate-200"
            aria-expanded={more}
          >
            {more ? "Hide filters" : "More filters"}
            {extraCount > 0 && !more ? ` · ${extraCount}` : ""}
          </button>
          {(q || cat || minYield || maxExp || extraCount > 0) && (
            <button type="button" onClick={clearAll} className="text-xs font-medium text-slate-500 underline hover:text-emerald-700 dark:hover:text-emerald-300">
              Reset
            </button>
          )}
        </div>

        {more && (
          <div className="mt-3 grid gap-3 border-t border-slate-200 pt-3 sm:grid-cols-2 lg:grid-cols-4 dark:border-slate-800">
            <label className="flex flex-col gap-1">
              <span className={labelCls}>Size (AUM)</span>
              <select className={field} value={minAum} onChange={(e) => setMinAum(e.target.value)}>
                <option value="">Any size</option>
                <option value="100000000">≥ $100M</option>
                <option value="1000000000">≥ $1B</option>
                <option value="10000000000">≥ $10B</option>
                <option value="100000000000">≥ $100B</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelCls}>NAV erosion</span>
              <select className={field} value={erosion} onChange={(e) => setErosion(e.target.value)}>
                <option value="">Any level</option>
                {["None", "Mild", "Moderate", "Severe"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelCls}>Distribution</span>
              <select className={field} value={freq} onChange={(e) => setFreq(e.target.value)}>
                <option value="">Any frequency</option>
                {freqs.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelCls}>Quality grade</span>
              <select className={field} value={minGrade} onChange={(e) => setMinGrade(e.target.value)} aria-label="Minimum quality grade">
                <option value="">Any quality grade</option>
                <option value="A">Quality A only</option>
                <option value="B">Quality B or better</option>
                <option value="C">Quality C or better</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelCls}>Rate fit</span>
              <select className={field} value={rateFilter} onChange={(e) => setRateFilter(e.target.value)} aria-label="Rate sensitivity">
                <option value="">Any rate fit</option>
                <option value="defensive">Defensive — rates help</option>
                <option value="neutral">Neutral</option>
                <option value="sensitive">Sensitive — rates hurt</option>
              </select>
            </label>
            <label className="flex items-end gap-2 pb-2 text-sm text-slate-700 dark:text-slate-300">
              <input type="checkbox" checked={hideLev} onChange={(e) => setHideLev(e.target.checked)} className="h-4 w-4 accent-emerald-600" />
              Hide leveraged / inverse
            </label>
          </div>
        )}
      </div>

      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
        <span>
          {filtered.length} of {rows.length} ETFs
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {view === "table" && <DensityToggle value={density} onChange={setDensity} />}
          <ViewToggle value={view} onChange={setView} />
          <button
            onClick={() => {
              const csv = screenerCsvRows(
                filtered.map((r) => ({
                  ticker: r.ticker,
                  name: r.name,
                  category: r.category,
                  quality: r.quality,
                  expense: r.expense,
                  yieldTtm: r.yieldTtm,
                  aum: r.aum,
                  ytd: r.ytd,
                  r1y: r.r1y,
                  r3y: r.r3y,
                  vol3y: r.vol3y,
                  dd3y: r.dd3y,
                  sharpe: r.sharpe,
                  erosion: r.erosion,
                  rateTag: r.rateTag,
                })),
              );
              downloadCsv(`screener-${new Date().toISOString().slice(0, 10)}.csv`, csv);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            <ImportExportIcon size={14} />
            Export CSV
          </button>
          {picked.length > 0 && <span className="text-xs text-slate-500">{picked.join(", ")}</span>}
          <Link
            href={picked.length >= 2 ? `/compare?t=${picked.join(",")}` : "#"}
            aria-disabled={picked.length < 2}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${picked.length >= 2 ? "bg-emerald-600 text-white hover:bg-emerald-500" : "cursor-not-allowed bg-slate-200 text-slate-500"}`}
          >
            <CompareIcon size={14} />
            Compare selected ({picked.length}/5)
          </Link>
        </div>
      </div>

      {view === "cards" ? (
        filtered.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0f172a]">{emptyHint}</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((r) => (
              <article
                key={r.ticker}
                className={`rounded-xl border p-4 shadow-lg ${
                  r.erosion === "Severe"
                    ? "border-rose-400 bg-rose-50 dark:border-rose-500/50 dark:bg-rose-950/40"
                    : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={picked.includes(r.ticker)}
                        onChange={() => toggle(r.ticker)}
                        className="h-4 w-4 accent-emerald-600"
                        aria-label={`Select ${r.ticker} for comparison`}
                      />
                      <Link href={`/etf/${r.ticker}`} className="font-mono text-2xl font-extrabold tracking-tight text-slate-900 hover:text-emerald-700 dark:text-white dark:hover:text-emerald-300">
                        {r.ticker}
                      </Link>
                    </div>
                    <div className="mt-0.5 max-w-[240px] truncate text-xs text-slate-500" title={r.name ?? ""}>
                      {r.name ?? "N/A"}
                    </div>
                    <div className="mt-1 truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{r.category ?? "N/A"}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <GradeBadge grade={r.quality} />
                    <RateBadge tag={r.rateTag} label={r.rateLabel} />
                    <span className="font-mono text-[11px] text-slate-500">{r.qualityScore == null ? "Quality N/A" : `${Math.round(r.qualityScore)}/100`}</span>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-x-3 gap-y-2 text-xs">
                  <div>
                    <div className={labelCls}>Price</div>
                    <div className="mt-0.5 font-mono tabular-nums text-slate-900 dark:text-white">{r.price == null ? "N/A" : `$${r.price.toFixed(2)}`}</div>
                  </div>
                  <div>
                    <div className={labelCls}>Day</div>
                    <div className={`mt-0.5 font-mono tabular-nums ${colorOf(r.changePct)}`}>
                      {r.changePct == null ? "N/A" : `${r.changePct > 0 ? "+" : ""}${r.changePct.toFixed(2)}%`}
                    </div>
                  </div>
                  <div>
                    <div className={labelCls}>Yield TTM</div>
                    <div className="mt-0.5 font-mono tabular-nums text-slate-900 dark:text-white">{pctFmt(r.yieldTtm)}</div>
                  </div>
                  <div>
                    <div className={labelCls}>Expense</div>
                    <div className="mt-0.5 font-mono tabular-nums">{pctFmt(r.expense)}</div>
                  </div>
                  <div>
                    <div className={labelCls}>AUM</div>
                    <div className="mt-0.5 font-mono tabular-nums">{aumFmt(r.aum)}</div>
                  </div>
                  <div>
                    <div className={labelCls}>YTD</div>
                    <div className={`mt-0.5 font-mono tabular-nums ${colorOf(r.ytd)}`}>{pctFmt(r.ytd, 1, true)}</div>
                  </div>
                  <div>
                    <div className={labelCls}>1Y</div>
                    <div className={`mt-0.5 font-mono tabular-nums ${colorOf(r.r1y)}`}>{pctFmt(r.r1y, 1, true)}</div>
                  </div>
                  <div>
                    <div className={labelCls}>3Y ann.</div>
                    <div className={`mt-0.5 font-mono tabular-nums ${colorOf(r.r3y)}`}>{pctFmt(r.r3y, 1, true)}</div>
                  </div>
                  <div>
                    <div className={labelCls}>5Y ann.</div>
                    <div className={`mt-0.5 font-mono tabular-nums ${colorOf(r.r5y)}`}>{pctFmt(r.r5y, 1, true)}</div>
                  </div>
                  <div>
                    <div className={labelCls}>Vol 3Y</div>
                    <div className="mt-0.5 font-mono tabular-nums">{pctFmt(r.vol3y, 1)}</div>
                  </div>
                  <div>
                    <div className={labelCls}>Max DD 3Y</div>
                    <div className="mt-0.5 font-mono tabular-nums">{pctFmt(r.dd3y, 1)}</div>
                  </div>
                  <div>
                    <div className={labelCls}>Sharpe 3Y</div>
                    <div className="mt-0.5 font-mono tabular-nums">{r.sharpe == null ? "N/A" : r.sharpe.toFixed(2)}</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <Badge className={erosionStyle[r.erosion] ?? erosionStyle["n/a"]}>Erosion {r.erosion}</Badge>
                  <Link href={`/etf/${r.ticker}`} className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                    Deep dive →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )
      ) : (
        <>
          <p className="mb-2 text-xs text-slate-500 md:hidden">← swipe the table, or switch to Cards</p>
          <p className="mb-2 hidden text-xs text-slate-500 md:block">Hover column headers for definitions.</p>
          <TableScroll density={density} className="shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-[#0b1220] dark:text-slate-400">
                <tr>
                  <th className="w-8 px-3 py-3" />
                  {COLUMNS.map((c) => (
                    <th
                      key={c.key}
                      title={c.hint}
                      className={`cursor-pointer whitespace-nowrap px-3 py-3 font-medium hover:text-slate-900 ${c.align === "right" ? "text-right" : "text-left"}`}
                      onClick={() =>
                        setSort((s) =>
                          s.key === c.key
                            ? { key: c.key, dir: (s.dir * -1) as 1 | -1 }
                            : { key: c.key, dir: c.key === "ticker" || c.key === "category" || c.key === "expense" || c.key === "vol3y" ? 1 : -1 },
                        )
                      }
                    >
                      {c.label}
                      {sort.key === c.key && <span className="ml-1">{sort.dir === 1 ? "▲" : "▼"}</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <tr key={r.ticker} className="hover:bg-emerald-50/40 dark:hover:bg-white/[0.03]">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={picked.includes(r.ticker)}
                        onChange={() => toggle(r.ticker)}
                        className="h-4 w-4 accent-emerald-600"
                        aria-label={`Select ${r.ticker} for comparison`}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Link href={`/etf/${r.ticker}`} className="font-semibold text-emerald-800 hover:underline dark:text-emerald-300">
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
                    <td className="px-3 py-2">
                      <RateBadge tag={r.rateTag} label={r.rateLabel} />
                    </td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums">{r.price == null ? "N/A" : `$${r.price.toFixed(2)}`}</td>
                    <td className={`px-3 py-2 text-right tabular-nums ${colorOf(r.changePct)}`}>
                      {r.changePct == null ? "N/A" : `${r.changePct > 0 ? "+" : ""}${r.changePct.toFixed(2)}%`}
                    </td>
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
                    <td colSpan={COLUMNS.length + 1}>{emptyHint}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </TableScroll>
        </>
      )}
      <Glossary />
    </div>
  );
}
