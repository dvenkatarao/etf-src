"use client";

import { dateShort, money, pct } from "@/lib/format";
import { expiryEventProximity } from "@/lib/macro-events";
import type { MacroEvent } from "@/lib/macro-events";
import type { PutScan } from "@/lib/wheel";
import { DeltaCellDark, EarningsBadgeDark, AcctFlagDark } from "@/components/wheel/WheelBitsDark";
import { WheelBadgeDark } from "@/components/wheel/WheelStockHeader";

type Props = {
  puts: (PutScan & { source: string; fallbackReason: string | null }) | null;
  putErr: string | null;
  selectedStrike: number | null;
  hoveredStrike?: number | null;
  onStrikeSelect: (strike: number) => void;
  onStrikeHover: (strike: number | null) => void;
  events?: MacroEvent[];
  fundTarget?: number | null;
};

const th = "whitespace-nowrap px-3 py-2 font-medium";

export default function WheelPutsTableInteractive({ puts, putErr, selectedStrike, hoveredStrike, onStrikeSelect, onStrikeHover, events = [], fundTarget }: Props) {
  if (putErr) {
    return <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">Option chain unavailable: {putErr}</div>;
  }
  if (!puts) {
    return <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4 text-sm text-slate-400">No price available.</div>;
  }
  if (puts.candidates.length === 0) {
    return <p className="text-sm text-slate-400">No put passes your filters.</p>;
  }
  return (
    <div className="cl-table-scroll cl-table-comfy overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-[10px] uppercase tracking-[0.12em] text-slate-500 dark:bg-[#020617] dark:text-slate-400">
          <tr>{["Expiry", "Strike", "Credit", "Delta", "Return /yr", "Breakeven", "Cushion", "σ out", "Liquidity", "IV / HV", "Flags", "Acct", "Score"].map((h) => <th key={h} className={th}>{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
          {puts.candidates.slice(0, 20).map((c) => {
            const isSelected = selectedStrike != null && Math.abs(c.contract.strike - selectedStrike) < 0.001;
            const isHovered = hoveredStrike != null && Math.abs(c.contract.strike - hoveredStrike) < 0.001;
            return (
              <tr
                key={c.contract.strike + c.contract.expiration}
                onClick={() => onStrikeSelect(c.contract.strike)}
                onMouseEnter={() => onStrikeHover(c.contract.strike)}
                onMouseLeave={() => onStrikeHover(null)}
                className={`cursor-pointer align-top transition ${isSelected ? "bg-emerald-50 dark:bg-emerald-500/10 ring-1 ring-inset ring-emerald-200 dark:ring-emerald-500/30" : isHovered ? "bg-amber-50 dark:bg-amber-500/10" : "hover:bg-slate-50 dark:hover:bg-white/[0.03]"}`}
              >
                <td className="whitespace-nowrap px-3 py-2 text-slate-700 dark:text-slate-300">{dateShort(c.contract.expiration)}<div className="text-[11px] text-slate-500">{c.dte}d{(() => { const prox = expiryEventProximity(c.contract.expiration, events, 3); return prox.near ? <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/20">● {prox.event!.kind}</span> : null; })()}</div></td>
                <td className="px-3 py-2 font-medium tabular-nums text-slate-900 dark:text-white">{money(c.contract.strike, c.contract.strike % 1 ? 2 : 0)}<div className="text-[11px] text-slate-500">{pct(c.otmPct, 1)} below</div></td>
                <td className="whitespace-nowrap px-3 py-2 tabular-nums text-slate-900 dark:text-white">{money(c.credit)}<div className="text-[11px] text-slate-500">bid {money(c.contract.bid)} · ask {money(c.contract.ask)}</div></td>
                <td className="px-3 py-2 tabular-nums text-slate-700 dark:text-slate-200"><DeltaCellDark c={c.contract} /></td>
                <td className="px-3 py-2 tabular-nums"><b className="text-emerald-600 dark:text-emerald-400">{pct(c.annRoc, 1)}</b><div className="text-[11px] text-slate-500">{pct(c.roc, 2)} / trade</div></td>
                <td className="px-3 py-2 tabular-nums text-slate-900 dark:text-white">{money(c.breakeven)}{fundTarget ? <div className="text-[11px] text-slate-500">{pct(1 - c.breakeven / fundTarget, 0)} below target</div> : null}</td>
                <td className="px-3 py-2 tabular-nums text-slate-700 dark:text-slate-300">{pct(c.breakevenCushion, 1)}</td>
                <td className="px-3 py-2 tabular-nums text-slate-500 dark:text-slate-400">{c.sigmaDistance != null ? c.sigmaDistance.toFixed(1) : "N/A"}</td>
                <td className="px-3 py-2 tabular-nums text-slate-700 dark:text-slate-300">{pct(c.spreadPct, 1)}<div className="text-[11px] text-slate-500">OI {c.contract.oi?.toLocaleString() ?? "N/A"}</div></td>
                <td className="px-3 py-2 tabular-nums text-slate-500 dark:text-slate-400">{c.contract.iv != null ? pct(c.contract.iv, 0) : "N/A"}{c.ivHv != null && <div className="text-[11px] text-slate-500">{c.ivHv.toFixed(2)}× realized</div>}</td>
                <td className="px-3 py-2"><div className="flex flex-col items-start gap-1">
                  <EarningsBadgeDark status={c.earnings} days={c.daysToEarnings} date={null} estimated={false} />
                  {c.exDivInside && <WheelBadgeDark className="bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-500/20">ex-div inside</WheelBadgeDark>}
                  {c.supportAboveStrike && <WheelBadgeDark className="bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/20">support above</WheelBadgeDark>}
                  {c.belowSma200 && <WheelBadgeDark className="bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/20">below 200-day</WheelBadgeDark>}
                </div></td>
                <td className="px-3 py-2"><AcctFlagDark fit={c.account} /></td>
                <td className="px-3 py-2 font-semibold tabular-nums text-slate-900 dark:text-white">{c.score.toFixed(1)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
