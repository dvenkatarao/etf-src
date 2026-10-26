"use client";

import { useState } from "react";
import WheelPriceChart from "@/components/wheel/WheelPriceChart";
import WheelPutsTableInteractive from "@/components/wheel/WheelPutsTableInteractive";
import { WheelCardDark } from "@/components/wheel/WheelStockHeader";
import { SourceBadgeDark } from "@/components/wheel/WheelBitsDark";
import { REJECT_LABEL } from "@/lib/wheel";
import type { Bar, Technicals, Level } from "@/lib/technicals";
import type { PutScan } from "@/lib/wheel";
import type { MacroEvent } from "@/lib/macro-events";

type Props = {
  ticker: string;
  bars: Bar[];
  technicals: Technicals;
  puts: (PutScan & { source: string; fallbackReason: string | null }) | null;
  putErr: string | null;
  events?: MacroEvent[];
  fundTarget?: number | null;
  allowEarnings?: boolean;
};

function RejectsInline({ rejected, evaluated }: { rejected: PutScan["rejected"]; evaluated: number }) {
  const parts = Object.entries(rejected)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .map(([k, n]) => `${n} ${REJECT_LABEL[k as keyof typeof REJECT_LABEL]}`);
  return (
    <p className="mt-2 text-[11px] text-slate-500">
      {evaluated} contracts checked{parts.length ? `; filtered out: ${parts.join(" · ")}` : ""}.
    </p>
  );
}

export default function WheelChartWithPuts({ ticker, bars, technicals, puts, putErr, events = [], fundTarget, allowEarnings = false }: Props) {
  const [selectedStrike, setSelectedStrike] = useState<number | null>(null);
  const [hoveredStrike, setHoveredStrike] = useState<number | null>(null);

  const supports: Level[] = technicals.supports;
  const resistances: Level[] = technicals.resistances;

  const handleHoverPrice = (price: number | null) => {
    if (price == null || !puts?.candidates.length) {
      setHoveredStrike(null);
      return;
    }
    const strikes = puts.candidates.map((c) => c.contract.strike);
    let nearest = strikes[0];
    let bestDist = Math.abs(strikes[0] - price);
    for (const s of strikes) {
      const d = Math.abs(s - price);
      if (d < bestDist) {
        bestDist = d;
        nearest = s;
      }
    }
    if (bestDist / price < 0.03) setHoveredStrike(nearest);
    else setHoveredStrike(null);
  };

  return (
    <div className="space-y-5">
      <WheelPriceChart
        ticker={ticker}
        bars={bars}
        hi52={technicals.hi52}
        lo52={technicals.lo52}
        supports={supports}
        resistances={resistances}
        selectedStrike={selectedStrike}
        onHoverPrice={handleHoverPrice}
      />

      <WheelCardDark
        title="Step 1 · Cash-secured puts"
        subtitle={`Best first. Tap a row to pin its strike on the chart. ${selectedStrike ? `Pinned: $${selectedStrike.toFixed(2)}` : "Hover chart ↔ table linked."}`}
        right={puts ? <SourceBadgeDark source={puts.source} fallbackReason={puts.fallbackReason} /> : undefined}
      >
        {putErr ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">Option chain unavailable: {putErr}</div>
        ) : !puts ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/30 dark:text-slate-400">No price available.</div>
        ) : puts.candidates.length === 0 ? (
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No put passes your filters.
              <RejectsInline rejected={puts.rejected} evaluated={puts.evaluated} />
              {!allowEarnings && (puts.rejected.earnings ?? 0) > 0 && <span className="text-xs text-amber-600 dark:text-amber-300"> Some were hidden because they expire after earnings; tick the earnings box on the screener to include them.</span>}
            </p>
          </div>
        ) : (
          <>
            <WheelPutsTableInteractive
              puts={puts}
              putErr={null}
              selectedStrike={selectedStrike}
              hoveredStrike={hoveredStrike}
              onStrikeSelect={(s) => setSelectedStrike((prev) => (prev === s ? null : s))}
              onStrikeHover={(s) => setHoveredStrike(s)}
              events={events}
              fundTarget={fundTarget}
            />
            <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 dark:bg-[#020617] border border-slate-200 dark:border-slate-800">
              <RejectsInline rejected={puts.rejected} evaluated={puts.evaluated} />
              <p className="mt-1 text-[11px] text-slate-500">Cash needed per contract = strike × 100. Credit is an estimated limit fill (25% from bid to ask). Place a limit order, never a market order.</p>
            </div>
          </>
        )}
        {puts && puts.candidates.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Click a strike to pin it on the chart · Hover the chart to preview the nearest put · Hover the table to see the strike
            {selectedStrike && (
              <button onClick={() => setSelectedStrike(null)} className="ml-2 rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300">
                Clear pin
              </button>
            )}
          </div>
        )}
      </WheelCardDark>
    </div>
  );
}
