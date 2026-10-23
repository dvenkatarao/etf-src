"use client";

import { useMemo, useState } from "react";
import { money, pct } from "@/lib/format";
import type { WheelRow } from "@/lib/wheel-service";
import { assignmentLoss } from "@/lib/wheel-capital";

export default function WheelCapitalPlanner({ rows }: { rows: WheelRow[] }) {
  const [cashInput, setCashInput] = useState("");
  const [lotsInput, setLotsInput] = useState("1");
  const contractsPerName = Math.max(1, Math.min(10, parseInt(lotsInput, 10) || 1));
  const availableCash = cashInput ? Number(cashInput.replace(/[^0-9.]/g, "")) : NaN;
  const hasCash = Number.isFinite(availableCash) && availableCash > 0;

  // Use top 6 best puts (user likely sells 3-6 at a time)
  const top = rows.slice(0, 6);

  const totalNeededTop = useMemo(() => top.reduce((s, r) => s + r.best.contract.strike * 100 * contractsPerName, 0), [top, contractsPerName]);
  const allNeeded = useMemo(() => rows.reduce((s, r) => s + r.best.contract.strike * 100 * contractsPerName, 0), [rows, contractsPerName]);
  const reserveAfterTop = hasCash ? availableCash - totalNeededTop : null;
  const overTop = hasCash ? totalNeededTop > availableCash : false;

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0F1A3A] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Capital & Assignment Planner</h3>
          <p className="mt-0.5 max-w-2xl text-xs leading-relaxed text-slate-400">
            Each cash-secured put must set aside <b className="text-slate-200">strike × 100 × contracts</b>. Below = cash needed if you sold the top-ranked puts together, and what assignment looks like.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1 text-[11px] font-semibold tracking-[0.08em] text-slate-400">
            AVAILABLE CASH
            <input
              value={cashInput}
              onChange={(e) => setCashInput(e.target.value)}
              placeholder="e.g. 50000"
              inputMode="numeric"
              className="w-36 rounded-lg border border-slate-700 bg-[#111C3E] px-3 py-1.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </label>
          <label className="grid gap-1 text-[11px] font-semibold tracking-[0.08em] text-slate-400">
            CONTRACTS / NAME
            <input
              value={lotsInput}
              onChange={(e) => setLotsInput(e.target.value)}
              inputMode="numeric"
              className="w-20 rounded-lg border border-slate-700 bg-[#111C3E] px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
            />
          </label>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-[#111C3E] p-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">If you sold top {top.length}</div>
          <div className="mt-1 text-lg font-semibold tabular-nums text-white">{money(totalNeededTop)}</div>
          <div className="text-[11px] text-slate-500">cash set aside · {top.length * contractsPerName} contract(s)</div>
        </div>
        <div className="rounded-xl bg-[#111C3E] p-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">If you sold all {rows.length} shown</div>
          <div className="mt-1 text-lg font-semibold tabular-nums text-white">{money(allNeeded)}</div>
          <div className="text-[11px] text-slate-500">worst-case simultaneous assignment</div>
        </div>
        <div className={`rounded-xl p-3 ${overTop ? "bg-rose-500/10 ring-1 ring-rose-500/30" : hasCash ? "bg-emerald-500/10 ring-1 ring-emerald-500/20" : "bg-[#111C3E]"}`}>
          <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Reserve after top {top.length}</div>
          <div className={`mt-1 text-lg font-semibold tabular-nums ${overTop ? "text-rose-300" : hasCash ? "text-emerald-300" : "text-slate-400"}`}>
            {hasCash ? money(reserveAfterTop!) : "—"}
          </div>
          <div className="text-[11px] text-slate-500">{hasCash ? (overTop ? `short ${money(Math.abs(reserveAfterTop!))}` : `covers ~${Math.floor(availableCash / (top[0]?.best.contract.strike * 100 || 1))} similar assignments`) : "enter cash above"}</div>
        </div>
      </div>

      {overTop && (
        <p className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs leading-relaxed text-rose-200">
          You don&apos;t have enough cash to fund assignment on all top puts at once. Sell fewer names, use smaller strikes, or keep 20-30% cash reserve — a gap down can assign several at the same time.
        </p>
      )}

      <div className="mt-4 rounded-xl border border-slate-800 bg-[#0D1632] p-3">
        <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Assignment preview (per put)</div>
        <p className="mt-1 text-xs text-slate-500">If assigned you own 100 shares at the breakeven. Table shows paper loss vs your breakeven and vs analyst target if you were assigned now.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {top.slice(0, 6).map((r) => {
            const loss = assignmentLoss(r.best, r.ctx.price, r.g.row.fundamentals?.targetMean);
            const cash = r.best.contract.strike * 100 * contractsPerName;
            return (
              <div key={r.g.row.ticker} className="rounded-lg border border-slate-700/60 bg-[#0F1A3A] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{r.g.row.ticker}</span>
                  <span className="text-xs text-slate-400">{money(r.best.contract.strike)} P</span>
                </div>
                <div className="mt-1 text-xs text-slate-300">
                  Cash: <b className="text-white">{money(cash)}</b> · breakeven {money(loss.breakeven)}
                </div>
                <div className={`mt-1 text-xs font-semibold tabular-nums ${loss.isLoss ? "text-rose-300" : "text-emerald-300"}`}>
                  vs now {pct(loss.lossPct, 1, true)} {loss.isLoss ? "paper loss" : "paper gain"}
                </div>
                {loss.vsTargetPct != null && <div className="text-[11px] text-slate-500">vs target {pct(loss.vsTargetPct, 1, true)}</div>}
                <div className="mt-1 text-[11px] text-slate-500">Credit {money(r.best.credit)} · cushion {pct(r.best.breakevenCushion, 1)}</div>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] text-slate-500">Tip: check &quot;vs target&quot; — if breakeven is already above the analyst mean target, recovery via a covered call at cost will be slow.</p>
      </div>
    </div>
  );
}
