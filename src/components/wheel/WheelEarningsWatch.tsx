"use client";

import Link from "next/link";
import { useState } from "react";
import { dateShort } from "@/lib/format";
import type { WheelResults } from "@/lib/wheel-service";

export default function WheelEarningsWatch({ earningsWatch, q }: { earningsWatch: WheelResults["earningsWatch"]; q: string }) {
  const [open, setOpen] = useState(false);
  if (!earningsWatch.length) return null;

  const count = earningsWatch.length;
  const preview = earningsWatch.slice(0, 5);
  const next = earningsWatch[0];

  return (
    <div className="overflow-hidden rounded-xl border border-amber-500/25 bg-amber-500/10">
      {/* Summary bar — always visible, compact */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-amber-500/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40"
        aria-expanded={open}
        aria-controls="earnings-watch-details"
      >
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-amber-500/20 text-[13px] text-amber-300">◷</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold tracking-[0.08em] text-amber-200">EARNINGS WATCH</span>
            <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-bold text-amber-950">{count}</span>
            <span className="hidden text-xs text-amber-200/70 sm:inline">A/A+ stocks reporting within 3 weeks</span>
            <span className="hidden text-xs text-amber-300/60 sm:inline">•</span>
            <span className="text-xs text-amber-200">
              Next: <b>{next.g.row.ticker}</b> in {next.days}d{next.estimated ? " (est.)" : ""}
            </span>
          </div>
          <p className="mt-0.5 line-clamp-1 hidden text-xs leading-relaxed text-amber-200/65 sm:block">
            Premiums look rich before a report — a gap can run through your strike overnight.
          </p>
        </div>

        {/* Inline preview chips (desktop) */}
        <div className="hidden items-center gap-1.5 lg:flex">
          {preview.map((e) => (
            <span
              key={`prev-${e.g.row.ticker}`}
              className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-[#0F1A3A] px-2.5 py-1 text-[11px] font-medium text-amber-100"
            >
              {e.g.row.ticker} <span className="text-amber-300/70">{e.days}d</span>
            </span>
          ))}
          {count > 5 && <span className="text-xs text-amber-300/60">+{count - 5}</span>}
        </div>

        <span className={`ml-1 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-amber-500/20 bg-[#0F1A3A] text-amber-200 transition ${open ? "rotate-180" : ""}`} aria-hidden>
          ▾
        </span>
      </button>

      {/* Quick horizontal strip — visible when collapsed, saves vertical space vs old flex-wrap block */}
      {!open && (
        <div className="border-t border-amber-500/15 bg-[#0D1632]/60 px-3 py-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-amber-500/20 pb-1 [-ms-overflow-style:none] [scrollbar-width:thin]">
            {earningsWatch.map((e) => (
              <Link
                key={e.g.row.ticker}
                href={`/wheel/${e.g.row.ticker}?${q}`}
                className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-amber-500/15 bg-[#0F1A3A] px-3 py-1.5 text-xs text-slate-100 hover:border-amber-400/30 hover:bg-[#16224A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/30"
              >
                <span className="font-bold text-amber-300">{e.g.row.ticker}</span>
                <span className="text-amber-200/70">{e.days}d</span>
                <span className="hidden text-[11px] text-slate-400 sm:inline">· {dateShort(e.ctx.nextEarnings)}{e.estimated ? " est." : ""}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Expanded details */}
      {open && (
        <div id="earnings-watch-details" className="border-t border-amber-500/20 bg-[#0D1632] px-4 py-4">
          <p className="text-xs leading-relaxed text-amber-200/75">
            Premiums look rich because the market prices a large move. A report can gap the stock through your strike overnight, so options
            expiring after the report are hidden unless you tick “Include options that expire after earnings”.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {earningsWatch.map((e) => (
              <Link
                key={e.g.row.ticker}
                href={`/wheel/${e.g.row.ticker}?${q}`}
                className="flex items-center justify-between gap-2 rounded-lg border border-amber-500/15 bg-[#0F1A3A] px-3 py-2.5 text-sm hover:border-amber-400/25 hover:bg-[#16224A]"
              >
                <span className="min-w-0">
                  <span className="font-bold text-white">{e.g.row.ticker}</span>
                  <span className="ml-2 text-xs text-slate-400">{e.g.row.name ?? ""}</span>
                </span>
                <span className="shrink-0 text-right text-xs leading-none">
                  <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ring-1 ${e.days <= 5 ? "bg-rose-500/15 text-rose-200 ring-rose-500/20" : e.days <= 10 ? "bg-amber-500/15 text-amber-200 ring-amber-500/20" : "bg-slate-700/40 text-slate-300 ring-slate-600/20"}`}>
                    {e.days}d
                  </span>
                  <span className="mt-1 block text-[11px] text-slate-500">{dateShort(e.ctx.nextEarnings)}{e.estimated ? " est." : ""}</span>
                </span>
              </Link>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-400">
            <span>Showing {count} stocks • Tap a ticker for its puts & key levels</span>
            <button type="button" onClick={() => setOpen(false)} className="rounded-md bg-amber-500/15 px-3 py-1.5 text-xs font-medium text-amber-200 hover:bg-amber-500/20">
              Collapse
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
