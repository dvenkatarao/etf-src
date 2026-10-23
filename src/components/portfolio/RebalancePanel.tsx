"use client";

import { useMemo, useState } from "react";
import { PortfolioAnalyticsSummary } from "@/lib/portfolio-service";
import { PRESETS, computeDrift, suggestTrades } from "@/lib/portfolio-rebalance";
import { money, pct } from "@/lib/format";

export default function RebalancePanel({ analytics }: { analytics: PortfolioAnalyticsSummary }) {
  const [presetIdx, setPresetIdx] = useState(0);
  const target = PRESETS[presetIdx].weights;

  const drift = useMemo(() => computeDrift(analytics.assetClassBreakdown as any, target, analytics.totalMarketValue), [analytics.assetClassBreakdown, target, analytics.totalMarketValue]);
  const trades = useMemo(() => {
    const positions = analytics.positions.map((p) => {
      const cls = categorizeFallback(p.category, p.assetType);
      return { ticker: p.ticker, assetClass: cls, marketValue: p.marketValue ?? 0, currentPrice: p.currentPrice ?? null };
    });
    return suggestTrades(drift, positions as any, analytics.totalMarketValue);
  }, [drift, analytics.positions, analytics.totalMarketValue]);

  if (!analytics.assetClassBreakdown.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Rebalance Planner (Drift vs Target)</h3>
        <p className="mt-2 text-xs text-slate-500">Add holdings to see drift.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Rebalance Planner — Drift vs Target</h3>
          <p className="mt-0.5 text-xs text-slate-500">Portfolio weight vs chosen target. Trade list keeps you on allocation with live prices.</p>
        </div>
        <select value={presetIdx} onChange={(e) => setPresetIdx(Number(e.target.value))} className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700">
          {PRESETS.map((p, i) => (
            <option key={p.label} value={i}>{p.label}</option>
          ))}
        </select>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-2 py-1 text-left">Asset Class</th>
              <th className="px-2 py-1 text-right">Actual</th>
              <th className="px-2 py-1 text-right">Target</th>
              <th className="px-2 py-1 text-right">Drift</th>
              <th className="px-2 py-1 text-right">$ Drift</th>
              <th className="px-2 py-1 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {drift.map((d) => (
              <tr key={d.assetClass} className={Math.abs(d.driftWeight) >= 0.02 ? "bg-amber-50/40" : ""}>
                <td className="px-2 py-2 font-medium text-slate-700">{d.assetClass}</td>
                <td className="px-2 py-2 text-right tabular-nums">{pct(d.actualWeight, 1)}</td>
                <td className="px-2 py-2 text-right tabular-nums text-slate-500">{pct(d.targetWeight, 1)}</td>
                <td className={`px-2 py-2 text-right font-semibold tabular-nums ${d.driftWeight > 0 ? "text-emerald-600" : d.driftWeight < 0 ? "text-rose-600" : "text-slate-400"}`}>{pct(d.driftWeight, 1, true)}</td>
                <td className={`px-2 py-2 text-right tabular-nums ${d.driftValue > 0 ? "text-emerald-700" : d.driftValue < 0 ? "text-rose-600" : "text-slate-400"}`}>{money(d.driftValue)}</td>
                <td className="px-2 py-2 text-center"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${d.action === "buy" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : d.action === "sell" ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200" : "bg-slate-100 text-slate-500"}`}>{d.action.toUpperCase()}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 rounded-xl bg-slate-50 p-3">
        <div className="text-xs font-semibold text-slate-700">Suggested trades to rebalance</div>
        <p className="mt-0.5 text-[11px] text-slate-500">Largest holding per drifted asset class is used as the vehicle. Prices are live where available.</p>
        {trades.length === 0 ? (
          <p className="mt-2 text-xs font-medium text-emerald-700">✓ On target — drift under 0.5% in every sleeve.</p>
        ) : (
          <ul className="mt-2 divide-y divide-slate-200">
            {trades.map((t) => (
              <li key={`${t.assetClass}:${t.ticker}`} className="flex items-center justify-between py-2 text-xs">
                <span>
                  <span className={`mr-1.5 rounded px-1.5 py-0.5 text-[10px] font-bold ${t.action === "buy" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"}`}>{t.action.toUpperCase()}</span>
                  <b className="text-slate-900">{t.ticker}</b> <span className="text-slate-500">({t.assetClass})</span>
                </span>
                <span className="text-right tabular-nums">
                  <span className={`font-semibold ${t.action === "buy" ? "text-emerald-700" : "text-rose-700"}`}>{money(t.amount, 0)}</span>
                  <span className="ml-2 text-slate-500">{t.estShares != null ? `${Math.abs(t.estShares).toFixed(2)} shs @ ${money(t.price)}` : ""}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-[11px] text-slate-400">Not advice — review quantities and commissions before trading. Cash sleeves assume new money; for sells, verify lot cost basis in your transaction ledger.</p>
      </div>
    </div>
  );
}

function categorizeFallback(category: string | null | undefined, assetType: string): string {
  const cat = (category ?? "").toLowerCase();
  if (assetType === "FUTURES") return "Futures & Derivatives";
  if (cat.includes("bond") || cat.includes("government") || cat.includes("treasury")) return "Fixed Income / Bonds";
  if (cat.includes("commodity") || cat.includes("precious")) return "Commodities & Real Assets";
  if (cat.includes("cash") || cat.includes("money market")) return "Cash Equivalents";
  return "Equities / Stocks";
}
