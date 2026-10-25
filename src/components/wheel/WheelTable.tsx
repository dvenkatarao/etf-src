"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { money, pct, dateShort } from "@/lib/format";
import type { MacroEvent } from "@/lib/macro-events";
import { expiryEventProximity } from "@/lib/macro-events";
import { ivRankLabel } from "@/lib/wheel-iv";
import { calculatorHref } from "@/lib/wheel-cycle";
import { vrpPp } from "@/lib/vol-metrics";
import type { WheelResults } from "@/lib/wheel-service";
import { gradeBadgeClasses } from "@/components/GradePill";
import { DensityToggle, TableScroll } from "@/components/ui";

type Props = {
  res: WheelResults;
  q: string;
  events?: MacroEvent[];
  today?: string;
  ivRanks?: Record<string, number | null>;
};

const scoreTone = (s: number) => {
  if (s >= 16) return "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:ring-emerald-500/30";
  if (s >= 10) return "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/20 dark:text-sky-300 dark:ring-sky-500/30";
  return "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:ring-amber-500/30";
};

const PAGE_TABLE = 20;
const PAGE_CARDS = 12;

function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  if (total <= 1) return null;
  const pages: (number | "...")[] = [];
  if (total <= 7) for (let i = 1; i <= total; i++) pages.push(i);
  else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(total - 1, page + 1); i++) pages.push(i);
    if (page < total - 2) pages.push("...");
    pages.push(total);
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-[#0F1A3A]">
      <span className="text-xs text-slate-500 dark:text-slate-400">
        Page <b className="text-slate-900 dark:text-white">{page}</b> of {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-[#0D1632] dark:text-slate-200"
        >
          ← Prev
        </button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`e-${i}`} className="px-1 text-xs text-slate-400">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p as number)}
              className={`min-w-[32px] rounded-md px-2.5 py-1.5 text-xs font-medium ring-1 ${page === p ? "bg-teal-600 text-white ring-teal-600" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50 dark:bg-[#0D1632] dark:text-slate-300 dark:ring-slate-700"}`}
            >
              {p}
            </button>
          ),
        )}
        <button
          onClick={() => onChange(Math.min(total, page + 1))}
          disabled={page === total}
          className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-[#0D1632] dark:text-slate-200"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

export default function WheelTable({ res, q, events = [], today: _today, ivRanks = {} }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sort, setSort] = useState<"score" | "return" | "delta">("score");
  const [view, setView] = useState<"table" | "cards">("table");
  const [page, setPage] = useState(1);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");

  useEffect(() => {
    if (window.innerWidth < 768) setView("cards");
  }, []);

  const rows = useMemo(
    () =>
      [...res.rows].sort((a, b) => {
        if (sort === "return") return b.best.annRoc - a.best.annRoc;
        if (sort === "delta") return Math.abs(a.best.contract.delta ?? 0) - Math.abs(b.best.contract.delta ?? 0);
        return b.best.score - a.best.score;
      }),
    [res.rows, sort],
  );

  // reset page when sort/view or row count changes
  useEffect(() => setPage(1), [sort, view, res.rows.length]);

  const pageSize = view === "table" ? PAGE_TABLE : PAGE_CARDS;
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const curPage = Math.min(page, totalPages);
  const start = (curPage - 1) * pageSize;
  const paged = rows.slice(start, start + pageSize);
  const end = Math.min(start + pageSize, rows.length);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-900 dark:text-white">
          <span className="h-2 w-2 rounded-full bg-teal-500" /> Filtered Stock Options{" "}
          <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-800 ring-1 ring-teal-200 dark:bg-teal-500/20 dark:text-teal-300 dark:ring-teal-500/30">
            {rows.length} results
          </span>
          {rows.length > pageSize && (
            <span className="hidden text-xs font-normal text-slate-500 sm:inline">
              · showing {start + 1}–{end}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 dark:text-slate-400">Sort by:</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-[#0F1A3A] dark:text-white"
          >
            <option value="score">Score</option>
            <option value="return">Return /yr</option>
            <option value="delta">Delta (low→high)</option>
          </select>
          {view === "table" && <DensityToggle value={density} onChange={setDensity} />}
          <div className="ml-2 inline-flex rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-800 dark:bg-[#0F1A3A]">
            <button
              onClick={() => setView("table")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${view === "table" ? "bg-teal-600 text-white" : "text-slate-500 dark:text-slate-400"}`}
            >
              Table
            </button>
            <button
              onClick={() => setView("cards")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${view === "cards" ? "bg-teal-600 text-white" : "text-slate-500 dark:text-slate-400"}`}
            >
              Cards
            </button>
          </div>
        </div>
      </div>

      {view === "table" ? (
        <>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 md:hidden">
            <span>← swipe to see more</span> <span className="ml-auto">Cards recommended on phone — toggle above</span>
          </div>
          <TableScroll density={density}>
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-[10px] uppercase tracking-[0.12em] text-slate-500 dark:bg-[#0D1632] dark:text-slate-400">
                <tr>
                  <th className="whitespace-nowrap px-2 py-2 font-medium">#</th>
                  <th className="whitespace-nowrap px-3 py-2 font-medium sticky left-0 bg-slate-50 dark:bg-[#0D1632] z-10">STOCK</th>
                  <th className="whitespace-nowrap px-3 py-2 font-medium hidden sm:table-cell">GRADE</th>
                  <th className="whitespace-nowrap px-3 py-2 font-medium hidden lg:table-cell">ACCT</th>
                  <th className="whitespace-nowrap px-3 py-2 font-medium hidden xl:table-cell">PRICE</th>
                  <th className="whitespace-nowrap px-3 py-2 font-medium hidden md:table-cell">EVENTS</th>
                  <th className="whitespace-nowrap px-3 py-2 font-medium">PUT TO SELL</th>
                  <th className="whitespace-nowrap px-3 py-2 font-medium hidden sm:table-cell">CREDIT</th>
                  <th className="whitespace-nowrap px-3 py-2 font-medium hidden lg:table-cell">DELTA</th>
                  <th className="whitespace-nowrap px-3 py-2 font-medium">RETURN /YR</th>
                  <th className="whitespace-nowrap px-3 py-2 font-medium hidden lg:table-cell">CUSHION</th>
                  <th className="whitespace-nowrap px-3 py-2 font-medium hidden xl:table-cell">LIQUIDITY</th>
                  <th className="whitespace-nowrap px-3 py-2 font-medium hidden xl:table-cell">TREND</th>
                  <th className="whitespace-nowrap px-3 py-2 font-medium">SCORE</th>
                  <th className="whitespace-nowrap px-2 py-2 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                {paged.map((r, idx) => {
                  const globalIdx = start + idx;
                  const b = r.best;
                  const c = b.contract;
                  const t = r.g.row.technicals!;
                  const isOpen = expanded === r.g.row.ticker;
                  return (
                    <>
                      <tr
                        key={r.g.row.ticker}
                        className={`align-top hover:bg-slate-50 dark:hover:bg-white/[0.03] ${isOpen ? "bg-slate-50 dark:bg-white/[0.03]" : ""}`}
                      >
                        <td className="px-2 py-3 text-xs text-slate-500 dark:text-slate-400">{globalIdx + 1}</td>
                        <td className="px-3 py-3 sticky left-0 bg-white dark:bg-[#0F1A3A] md:bg-transparent dark:md:bg-transparent z-10">
                          <Link href={`/wheel/${r.g.row.ticker}?${q}`} className="font-semibold text-slate-900 hover:text-teal-700 dark:text-white dark:hover:text-teal-300">
                            {r.g.row.ticker}
                          </Link>
                          <div className="max-w-[150px] truncate text-xs text-slate-500 dark:text-slate-400">{r.g.row.name}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-500">{r.g.row.sector}</div>
                        </td>
                        <td className="px-3 py-3 hidden sm:table-cell">
                          <span
                            className={gradeBadgeClasses(r.g.grade as any)}
                            title={`${r.g.quality.summary} Score ${r.g.quality.score?.toFixed(0) ?? "N/A"}/100 · Coverage ${Math.round(r.g.quality.coverage * 100)}%${r.g.quality.caps.length ? ` · Caps: ${r.g.quality.caps.join("; ")}` : ""} — Grade always computed (weighted 5-pillar). High return ≠ high grade; premium pays for risk — you decide if you want to own it.`}
                          >
                            {r.g.grade}
                          </span>
                        </td>
                        <td className="px-3 py-3 hidden lg:table-cell">
                          <span
                            title={b.account.reasons.join(" ")}
                            className={`inline-flex h-6 w-6 place-items-center justify-center rounded-full text-xs font-bold ring-1 ${
                              b.account.flag === "R"
                                ? "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-500/20 dark:text-violet-300 dark:ring-violet-500/30"
                                : b.account.flag === "T"
                                  ? "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/20 dark:text-sky-300 dark:ring-sky-500/30"
                                  : "bg-slate-100 text-slate-500 ring-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:ring-slate-500/20"
                            }`}
                          >
                            {b.account.flag}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 tabular-nums text-slate-900 dark:text-white hidden xl:table-cell">{money(r.ctx.price)}</td>
                        <td className="px-3 py-3 hidden md:table-cell">
                          <div className="flex flex-col gap-1">
                            {b.earnings === "inside" ? (
                              <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:ring-rose-500/20">
                                earnings in {b.daysToEarnings}d
                              </span>
                            ) : b.daysToEarnings != null ? (
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${b.daysToEarnings <= 14 ? "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/20" : "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-700/40 dark:text-slate-300 dark:ring-slate-600/20"}`}
                              >
                                earnings in {b.daysToEarnings}d
                              </span>
                            ) : (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 dark:bg-slate-700/40 dark:text-slate-400">date unknown</span>
                            )}
                            {b.exDivInside && (
                              <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-700 ring-1 ring-sky-200 dark:bg-sky-500/20 dark:text-sky-300 dark:ring-sky-500/20">
                                ex-div {dateShort(r.ctx.exDividend)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3">
                          <div className="font-semibold tabular-nums text-slate-900 dark:text-white">{money(c.strike, c.strike % 1 ? 2 : 0)} P</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {dateShort(c.expiration)} · {b.dte}d
                            {(() => {
                              const prox = expiryEventProximity(c.expiration, events, 3);
                              return prox.near ? (
                                <span
                                  title={`${prox.event!.title} on ${prox.event!.date} — option expires ${prox.daysAfter}d after. Consider avoiding new puts through this event.`}
                                  className="ml-1 inline-flex items-center gap-1 rounded-full bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/20"
                                >
                                  ● {prox.event!.kind}
                                </span>
                              ) : null;
                            })()}
                          </div>
                          <div className="mt-1 flex items-center gap-1">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${r.source === "alpaca" ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/20" : "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/20"}`}
                            >
                              {r.source === "alpaca" ? "Alpaca" : "Yahoo (backup)"}
                            </span>
                            {r.count > 1 && <span className="text-[10px] text-slate-500">+{r.count - 1} more</span>}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 tabular-nums text-slate-900 dark:text-white hidden sm:table-cell">
                          {money(b.credit)} <div className="text-[11px] text-slate-500">{money(b.credit * 100, 0)} / contract</div>
                        </td>
                        <td className="px-3 py-3 tabular-nums hidden lg:table-cell">
                          <span className="text-slate-900 dark:text-white">
                            {b.contract.delta != null ? Math.abs(b.contract.delta).toFixed(2) + (b.contract.deltaSource === "model" ? " ≈" : "") : "N/A"}
                          </span>
                          <div className="text-[11px] text-emerald-600 dark:text-emerald-400">{pct(b.probOtm, 0)} chance OTM</div>
                        </td>
                        <td className="px-3 py-3 tabular-nums">
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">{pct(b.annRoc, 1)}</span>
                          <div className="text-[11px] text-slate-500">{pct(b.roc, 2)} per trade</div>
                        </td>
                        <td className="px-3 py-3 tabular-nums hidden lg:table-cell">
                          <span className="text-slate-900 dark:text-white">{pct(b.breakevenCushion, 1)}</span>
                          <div className="text-[11px] text-slate-500">breakeven {money(b.breakeven)}</div>
                          {r.g.row.fundamentals?.targetMean ? (
                            <div className="text-[11px] text-slate-500">{pct(1 - b.breakeven / r.g.row.fundamentals.targetMean, 0)} below target</div>
                          ) : null}
                        </td>
                        <td className="px-3 py-3 tabular-nums hidden xl:table-cell">
                          <span className="text-slate-900 dark:text-white">{pct(b.spreadPct, 1)} gap</span>
                          <div className="text-[11px] text-slate-500">OI {c.oi?.toLocaleString() ?? "N/A"}</div>
                        </td>
                        <td className="px-3 py-3 text-xs hidden xl:table-cell">
                          <div className={t.aboveSma200 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>{t.aboveSma200 ? "▲ Above" : "▼ Below"} 200-day</div>
                          <div className="text-slate-500">RSI {t.rsi14?.toFixed(0) ?? "N/A"}</div>
                          {b.supportAboveStrike && <div className="text-emerald-600 dark:text-emerald-400">support ✓</div>}
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex rounded-md px-2 py-1 text-xs font-bold ring-1 ${scoreTone(b.score)}`}>{b.score.toFixed(1)}</span>
                        </td>
                        <td className="px-2 py-3">
                          <button
                            onClick={() => setExpanded(isOpen ? null : r.g.row.ticker)}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/5 dark:hover:text-white"
                            aria-label="Toggle details"
                          >
                            <span className={`inline-block transition ${isOpen ? "rotate-180" : ""}`}>▾</span>
                          </button>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="bg-slate-50 dark:bg-[#0D1632]">
                          <td colSpan={16} className="px-4 py-4">
                            <div className="grid grid-cols-2 gap-4 text-xs md:grid-cols-4">
                              <div className="space-y-1">
                                <div className="text-[10px] tracking-[0.12em] text-slate-500">52 WEEK RANGE</div>
                                <div className="text-sm font-semibold text-slate-900 dark:text-white">{t.lo52 != null && t.hi52 != null ? `${money(t.lo52)} – ${money(t.hi52)}` : "N/A"}</div>
                                <div className="mt-2 text-[10px] tracking-[0.12em] text-slate-500">52W MOVE</div>
                                <div className="text-sm text-slate-700 dark:text-slate-300">{t.offHigh != null ? `${pct(t.offHigh, 1)} below high` : "N/A"}</div>
                              </div>
                              <div className="space-y-1">
                                <div className="text-[10px] tracking-[0.12em] text-slate-500">MARKET CAP</div>
                                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                                  {r.g.row.fundamentals?.marketCap ? `$${(r.g.row.fundamentals.marketCap / 1e9).toFixed(1)}B` : "N/A"}
                                </div>
                                <div className="mt-2 text-[10px] tracking-[0.12em] text-slate-500">ANALYST TARGET</div>
                                <div className="text-sm text-slate-700 dark:text-slate-300">{r.g.row.fundamentals?.targetMean ? money(r.g.row.fundamentals.targetMean) : "N/A"}</div>
                              </div>
                              <div className="space-y-1">
                                <div className="text-[10px] tracking-[0.12em] text-slate-500">IV RANK (1Y)</div>
                                {(() => {
                                  const pctl = ivRanks[r.g.row.ticker] ?? null;
                                  const info = ivRankLabel(pctl);
                                  return (
                                    <>
                                      <div className={`text-sm font-semibold ${info.tone}`}>
                                        {info.label}
                                        {pctl == null ? <span className="ml-1 text-xs font-normal text-slate-500">needs 20 scans</span> : ""}
                                      </div>
                                      <div className="mt-2 text-[10px] tracking-[0.12em] text-slate-500">CURRENT IV</div>
                                      <div className="text-sm text-slate-700 dark:text-slate-300">
                                        {b.contract.iv != null ? `${(b.contract.iv * 100).toFixed(1)}% IV` : "N/A"}
                                        {pctl != null && pctl >= 75 ? " · rich" : pctl != null && pctl < 25 ? " · thin" : ""}
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>
                              <div className="space-y-1">
                                <div className="text-[10px] tracking-[0.12em] text-slate-500">NEXT DIVIDEND</div>
                                <div className="text-sm text-slate-700 dark:text-slate-300">{r.ctx.exDividend ? dateShort(r.ctx.exDividend) : "—"}</div>
                                <div className="mt-2 text-[10px] tracking-[0.12em] text-slate-500">EXPECTED MOVE / VRP</div>
                                <div className="text-sm text-slate-700 dark:text-slate-300">
                                  {b.expMovePct != null ? `±${pct(b.expMovePct, 1)}` : "N/A"}
                                  {b.sigmaDistance != null ? ` · ${b.sigmaDistance.toFixed(1)}σ OTM` : ""}
                                  {(() => {
                                    const v = vrpPp(b.contract.iv, r.ctx.hv30);
                                    return v == null ? "" : ` · VRP ${v >= 0 ? "+" : ""}${v.toFixed(1)}pp`;
                                  })()}
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <Link href={`/wheel/${r.g.row.ticker}?${q}`} className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-500">
                                    View details →
                                  </Link>
                                  <Link
                                    href={calculatorHref({
                                      tab: "payoff",
                                      ticker: r.g.row.ticker,
                                      preset: "short-put",
                                      strike: c.strike,
                                      expiry: c.expiration,
                                      credit: b.credit,
                                      spot: r.ctx.price,
                                      dte: b.dte,
                                      iv: c.iv ?? undefined,
                                      hv: r.ctx.hv30 ?? undefined,
                                      earnDays: b.daysToEarnings,
                                      spreadPct: b.spreadPct,
                                    })}
                                    className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-500"
                                  >
                                    Open payoff
                                  </Link>
                                  <Link
                                    href={calculatorHref({
                                      tab: "cycle",
                                      ticker: r.g.row.ticker,
                                      strike: c.strike,
                                      credit: b.credit,
                                      spot: r.ctx.price,
                                      dte: b.dte,
                                      earnDays: b.daysToEarnings,
                                      spreadPct: b.spreadPct,
                                    })}
                                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-white/5"
                                  >
                                    Wheel cycle
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </TableScroll>
          <Pagination page={curPage} total={totalPages} onChange={setPage} />
        </>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {paged.map((r) => {
              const b = r.best;
              return (
                <div key={r.g.row.ticker} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#0F1A3A]">
                  <div className="flex items-start justify-between">
                    <div>
                      <Link href={`/wheel/${r.g.row.ticker}?${q}`} className="text-sm font-bold text-slate-900 hover:text-teal-700 dark:text-white dark:hover:text-teal-300">
                        {r.g.row.ticker}
                      </Link>
                      <div className="max-w-[180px] truncate text-xs text-slate-500 dark:text-slate-400">{r.g.row.name}</div>
                    </div>
                    <span
                      className={gradeBadgeClasses(r.g.grade as any)}
                      title={`${r.g.quality.summary} Score ${r.g.quality.score?.toFixed(0) ?? "N/A"}/100${r.g.quality.caps.length ? ` · Caps: ${r.g.quality.caps.join("; ")}` : ""}`}
                    >
                      {r.g.grade}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-[10px] tracking-[0.12em] text-slate-500">PUT TO SELL</div>
                      <div className="mt-1 font-semibold text-slate-900 dark:text-white">
                        {money(b.contract.strike)} P · {dateShort(b.contract.expiration)}
                      </div>
                      <div className="text-slate-500">
                        {b.dte}d · credit {money(b.credit)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] tracking-[0.12em] text-slate-500">SCORE</div>
                      <div className={`mt-1 inline-flex rounded-md px-2 py-1 text-sm font-bold ring-1 ${scoreTone(b.score)}`}>{b.score.toFixed(1)}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {b.earnings === "inside" ? (
                      <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:ring-rose-500/20">
                        earnings in {b.daysToEarnings}d
                      </span>
                    ) : b.daysToEarnings != null ? (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${b.daysToEarnings <= 14 ? "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/20" : "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-700/40 dark:text-slate-300 dark:ring-slate-600/20"}`}
                      >
                        earnings in {b.daysToEarnings}d
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 dark:bg-slate-700/40 dark:text-slate-400">earnings unknown</span>
                    )}
                    {b.exDivInside && (
                      <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-700 ring-1 ring-sky-200 dark:bg-sky-500/20 dark:text-sky-300 dark:ring-sky-500/20">
                        ex-div {dateShort(r.ctx.exDividend)}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      Return/yr <b className="text-emerald-600 dark:text-emerald-400">{pct(b.annRoc, 1)}</b>
                    </span>
                    <span className="text-slate-500">
                      Cushion <b className="text-slate-900 dark:text-white">{pct(b.breakevenCushion, 1)}</b>
                    </span>
                  </div>
                  <Link
                    href={calculatorHref({
                      tab: "payoff",
                      ticker: r.g.row.ticker,
                      preset: "short-put",
                      strike: b.contract.strike,
                      expiry: b.contract.expiration,
                      credit: b.credit,
                      spot: r.ctx.price,
                      dte: b.dte,
                      iv: b.contract.iv ?? undefined,
                      hv: r.ctx.hv30 ?? undefined,
                      earnDays: b.daysToEarnings,
                      spreadPct: b.spreadPct,
                    })}
                    className="mt-3 inline-flex text-xs font-medium text-teal-600 hover:underline dark:text-teal-300"
                  >
                    Open payoff →
                  </Link>
                </div>
              );
            })}
          </div>
          <Pagination page={curPage} total={totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
