"use client";

import Link from "next/link";
import { useState } from "react";
import { big, dateShort, money, pct } from "@/lib/format";
import type { WheelResults, WheelRow } from "@/lib/wheel-service";
import { gradeBadgeClasses } from "@/components/GradePill";
import {
  BuildingIcon,
  CashStackIcon,
  ClockCountdownIcon,
  EarningsCalendarIcon,
  GradeStarIcon,
  PriceTagIcon,
  ScoreGaugeIcon,
  SectorIcon,
  ShieldCheckIcon,
  TrendDownIcon,
  TrendUpIcon,
  WarningTriangleIcon,
} from "@/components/icons/EarningsIcons";

type Props = {
  earningsWatch: WheelResults["earningsWatch"];
  rows?: WheelRow[];
  q: string;
};

function daysChip(days: number) {
  if (days <= 5) return "bg-rose-50 text-rose-800 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-200 dark:ring-rose-500/20";
  if (days <= 10) return "bg-amber-50 text-amber-900 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-500/20";
  return "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-700/40 dark:text-slate-300 dark:ring-slate-600/20";
}

export default function WheelEarningsWatch({ earningsWatch, rows = [], q }: Props) {
  const [open, setOpen] = useState(false);
  if (!earningsWatch.length) return null;

  const count = earningsWatch.length;
  const preview = earningsWatch.slice(0, 5);
  const next = earningsWatch[0];
  const rowByTicker = new Map(rows.map((r) => [r.g.row.ticker, r]));

  return (
    <div className="overflow-hidden rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-500/25 dark:bg-amber-500/10">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-amber-100/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40 dark:hover:bg-amber-500/[0.06]"
        aria-expanded={open}
        aria-controls="earnings-watch-details"
      >
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-amber-200/70 text-amber-900 dark:bg-amber-500/20 dark:text-amber-300">
          <EarningsCalendarIcon size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold tracking-[0.08em] text-amber-900 dark:text-amber-200">EARNINGS WATCH</span>
            <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-bold text-amber-950">{count}</span>
            <span className="hidden text-xs text-amber-800/80 sm:inline dark:text-amber-200/70">A/A+ stocks reporting within 3 weeks</span>
            <span className="hidden text-xs text-amber-400 sm:inline">•</span>
            <span className="inline-flex items-center gap-1 text-xs text-amber-900 dark:text-amber-200">
              <ClockCountdownIcon size={12} className="text-amber-700 dark:text-amber-300/80" />
              Next: <b>{next.g.row.ticker}</b> in {next.days}d{next.estimated ? " (est.)" : ""}
            </span>
          </div>
          <p className="mt-0.5 line-clamp-1 hidden text-xs leading-relaxed text-amber-800/75 sm:block dark:text-amber-200/65">
            Premiums look rich before a report — a gap can run through your strike overnight. Tap to see grade, score & best put.
          </p>
        </div>

        <div className="hidden items-center gap-1.5 lg:flex">
          {preview.map((e) => {
            const r = rowByTicker.get(e.g.row.ticker);
            return (
              <span
                key={`prev-${e.g.row.ticker}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-800 dark:border-amber-500/20 dark:bg-[#0F1A3A] dark:text-amber-100"
                title={`${e.g.grade ?? "n/a"} · Score ${e.g.quality.score?.toFixed(0) ?? "—"}/100 · ${r ? `Best put $${r.best.contract.strike} · ${pct(r.best.annRoc, 0)}/yr` : "No put passes filters pre-earnings"}`}
              >
                <span className={gradeBadgeClasses(e.g.grade as any) + " !px-1.5 !py-0 !text-[10px]"}>{e.g.grade ?? "—"}</span>
                {e.g.row.ticker} <span className="text-amber-700 dark:text-amber-300/70">{e.days}d</span>
              </span>
            );
          })}
          {count > 5 && <span className="text-xs text-amber-700 dark:text-amber-300/60">+{count - 5}</span>}
        </div>

        <span
          className={`ml-1 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-amber-200 bg-white text-amber-800 transition dark:border-amber-500/20 dark:bg-[#0F1A3A] dark:text-amber-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          ▾
        </span>
      </button>

      {!open && (
        <div className="border-t border-amber-200 bg-white/80 px-3 py-2 dark:border-amber-500/15 dark:bg-[#0D1632]/60">
          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:thin]">
            {earningsWatch.map((e) => {
              const r = rowByTicker.get(e.g.row.ticker);
              const t = e.g.row.technicals;
              return (
                <Link
                  key={e.g.row.ticker}
                  href={`/wheel/${e.g.row.ticker}?${q}`}
                  className="group inline-flex shrink-0 items-center gap-2 rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs text-slate-800 hover:border-amber-300 hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/30 dark:border-amber-500/15 dark:bg-[#0F1A3A] dark:text-slate-100 dark:hover:border-amber-400/30 dark:hover:bg-[#16224A]"
                >
                  <span className="flex items-center gap-1.5">
                    <span className={gradeBadgeClasses(e.g.grade as any) + " !px-1.5 !py-0 !text-[10px]"}>{e.g.grade ?? "—"}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{e.g.row.ticker}</span>
                  </span>
                  <span className="hidden items-center gap-1 text-amber-800 sm:inline-flex dark:text-amber-200/70">
                    <ScoreGaugeIcon size={12} />
                    {e.g.quality.score != null ? `${e.g.quality.score.toFixed(0)}` : "—"}
                  </span>
                  <span className="hidden text-[11px] text-slate-500 sm:inline dark:text-slate-400">· {money(e.ctx.price)}</span>
                  {t && (
                    <span className={`hidden items-center gap-1 text-[11px] sm:inline-flex ${t.aboveSma200 ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}>
                      {t.aboveSma200 ? <TrendUpIcon size={12} /> : <TrendDownIcon size={12} />}
                      {t.aboveSma200 ? "Above 200D" : "Below 200D"}
                    </span>
                  )}
                  {r && (
                    <span className="hidden items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-800 ring-1 ring-emerald-200 sm:inline-flex dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/20">
                      <CashStackIcon size={10} /> {money(r.best.credit)} · {pct(r.best.annRoc, 0)}/yr
                    </span>
                  )}
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${daysChip(e.days)}`}>
                    <ClockCountdownIcon size={10} /> {e.days}d
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {open && (
        <div id="earnings-watch-details" className="border-t border-amber-200 bg-white px-4 py-4 dark:border-amber-500/20 dark:bg-[#0D1632]">
          <p className="text-xs leading-relaxed text-amber-900/80 dark:text-amber-200/75">
            Premiums look rich because the market prices a large move. A report can gap the stock through your strike overnight, so options
            expiring after the report are hidden unless you tick{" "}
            <span className="font-semibold text-amber-900 dark:text-amber-200">“Include options that expire after earnings”</span>. Each card shows grade, score
            and best put — so you can judge if the premium is worth owning at this quality.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {earningsWatch.map((e) => {
              const best = rowByTicker.get(e.g.row.ticker)?.best ?? null;
              const fund = e.g.row.fundamentals;
              const tech = e.g.row.technicals;
              const caps = e.g.quality.caps;
              const worstPillar = e.g.quality.pillars.filter((p) => p.score != null).sort((a, b) => (a.score as number) - (b.score as number))[0];

              return (
                <div
                  key={e.g.row.ticker}
                  className="group flex flex-col gap-3 rounded-xl border border-amber-200 bg-white p-3.5 hover:border-amber-300 hover:bg-amber-50/60 dark:border-amber-500/15 dark:bg-[#0F1A3A] dark:hover:border-amber-400/25 dark:hover:bg-[#16224A]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/wheel/${e.g.row.ticker}?${q}`} className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 group-hover:text-amber-800 dark:text-white dark:group-hover:text-amber-200">{e.g.row.ticker}</span>
                        <span className={gradeBadgeClasses(e.g.grade as any)} title={`${e.g.quality.summary} Score ${e.g.quality.score?.toFixed(0) ?? "—"}/100`}>
                          {e.g.grade ?? "—"}
                        </span>
                        {e.g.quality.score != null && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600/30" title={`Quality score ${e.g.quality.score.toFixed(0)}/100 · Coverage ${Math.round(e.g.quality.coverage * 100)}%`}>
                            <ScoreGaugeIcon size={12} className="text-teal-700 dark:text-teal-300" /> {e.g.quality.score.toFixed(0)}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">{e.g.row.name}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500">
                        {e.g.row.sector && (
                          <span className="inline-flex items-center gap-1">
                            <SectorIcon size={11} /> {e.g.row.sector}
                          </span>
                        )}
                        {fund?.marketCap && (
                          <span className="inline-flex items-center gap-1">
                            <BuildingIcon size={11} /> {big(fund.marketCap)}
                          </span>
                        )}
                      </div>
                    </Link>
                    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ring-1 ${daysChip(e.days)}`}>
                      <ClockCountdownIcon size={12} /> {e.days}d
                    </span>
                  </div>

                  <div className="flex items-center gap-2 rounded-lg bg-amber-100/80 px-2.5 py-2 text-xs dark:bg-amber-500/10">
                    <EarningsCalendarIcon size={14} className="shrink-0 text-amber-800 dark:text-amber-300" />
                    <span className="font-medium text-amber-950 dark:text-amber-100">{dateShort(e.ctx.nextEarnings)}</span>
                    {e.estimated && <span className="rounded bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-amber-950">EST</span>}
                    <span className="ml-auto text-[11px] text-amber-800/80 dark:text-amber-200/70">{e.days === 0 ? "today" : e.days === 1 ? "tomorrow" : `in ${e.days} days`}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-2 ring-1 ring-slate-200 dark:bg-slate-800/60 dark:ring-slate-700/50">
                      <PriceTagIcon size={14} className="text-emerald-700 dark:text-emerald-300" />
                      <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{money(e.ctx.price)}</span>
                      <span className="text-slate-500 dark:text-slate-400">price</span>
                    </div>
                    <div className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 ring-1 ${tech?.aboveSma200 ? "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/20" : "bg-rose-50 text-rose-800 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-200 dark:ring-rose-500/20"}`}>
                      {tech?.aboveSma200 ? <TrendUpIcon size={14} /> : <TrendDownIcon size={14} />}
                      <span className="text-xs font-medium">{tech?.aboveSma200 ? "Above 200D" : "Below 200D"}</span>
                    </div>
                  </div>

                  {best ? (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700/60 dark:bg-[#080E28]">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                          <CashStackIcon size={12} className="text-teal-700 dark:text-teal-300" /> Best put now
                        </span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ${best.score >= 16 ? "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/20" : best.score >= 10 ? "bg-sky-50 text-sky-800 ring-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-500/20" : "bg-amber-50 text-amber-900 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/20"}`}>
                          <ScoreGaugeIcon size={11} /> {best.score.toFixed(1)}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="font-semibold text-slate-900 dark:text-white">{money(best.contract.strike)}P · {best.dte}d</span>
                        <span className="text-slate-500 dark:text-slate-400">credit {money(best.credit)}</span>
                        <span className="font-semibold text-emerald-700 dark:text-emerald-300">{pct(best.annRoc, 1)}/yr</span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px]">
                        <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
                          <ShieldCheckIcon size={11} /> cushion {pct(best.breakevenCushion, 1)}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">Δ {Math.abs(best.contract.delta ?? 0).toFixed(2)}</span>
                        {best.supportAboveStrike && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 font-medium text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/20">
                            <ShieldCheckIcon size={11} /> support
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-900/80 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200/80">
                      No put passes filters pre-earnings — hidden by earnings guard. Tick “Include after earnings” to see puts expiring after {dateShort(e.ctx.nextEarnings)}.
                    </div>
                  )}

                  {(caps.length > 0 || worstPillar) && (
                    <div className="flex flex-wrap gap-1.5">
                      {caps.slice(0, 2).map((c, i) => (
                        <span key={i} className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[11px] text-amber-900 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/20" title={c}>
                          <WarningTriangleIcon size={11} /> {c.length > 42 ? c.slice(0, 38) + "…" : c}
                        </span>
                      ))}
                      {!caps.length && worstPillar && worstPillar.letter && ["C", "D", "F"].includes(worstPillar.letter) && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700" title={`${worstPillar.label}: ${worstPillar.detail}`}>
                          Weak: {worstPillar.label} ({worstPillar.letter})
                        </span>
                      )}
                    </div>
                  )}

                  <Link
                    href={`/wheel/${e.g.row.ticker}?${q}`}
                    className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-teal-600 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-500"
                  >
                    <GradeStarIcon size={12} /> View grade & puts →
                  </Link>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Showing {count} stocks • Each card: grade · score · best put — icons explain metrics at a glance</span>
            <button type="button" onClick={() => setOpen(false)} className="rounded-md bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:hover:bg-amber-500/20">
              Collapse
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
