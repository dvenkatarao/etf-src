"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { money, pct } from "@/lib/format";
import {
  PRESET_META,
  applyQuotes,
  nearestQuote,
  presetLegs,
  summarizePayoff,
  type ChainQuote,
  type Leg,
  type PresetId,
} from "@/lib/option-payoff";
import { capitalForMonthlyIncome, expectedMove, vrpPp } from "@/lib/vol-metrics";
import { wheelCycle } from "@/lib/wheel-cycle";
import { daysBetween } from "@/lib/wheel";
import PayoffChart from "./PayoffChart";

export type ToolsInit = {
  tab?: string;
  ticker?: string;
  preset?: string;
  strike?: string;
  expiry?: string;
  credit?: string;
  spot?: string;
  dte?: string;
  iv?: string;
  hv?: string;
  callStrike?: string;
  callCredit?: string;
  earnDays?: string;
  spreadPct?: string;
};

const n = (v: string | undefined, fallback: number) => {
  const x = v != null && v !== "" ? Number(v) : NaN;
  return Number.isFinite(x) ? x : fallback;
};

function Kpi({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "up" | "down" | "muted" }) {
  const color =
    tone === "up" ? "text-emerald-600 dark:text-emerald-400" : tone === "down" ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white";
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 dark:border-slate-800 dark:bg-[#0F1A3A]">
      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</div>
      <div className={`mt-1 font-mono text-lg font-semibold tabular-nums ${color}`}>{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-slate-500">{hint}</div>}
    </div>
  );
}

function Conditions({ iv, hv, dteEarn, spreadPct }: { iv: number | null; hv: number | null; dteEarn: number | null; spreadPct: number | null }) {
  const vrp = vrpPp(iv, hv);
  const tone = (t: "ok" | "warn" | "unknown") =>
    t === "ok"
      ? "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20"
      : t === "warn"
        ? "bg-amber-50 text-amber-900 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/20"
        : "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-700/40 dark:text-slate-400 dark:ring-slate-600/30";
  const dot = (t: "ok" | "warn" | "unknown") => (t === "ok" ? "bg-emerald-500" : t === "warn" ? "bg-amber-500" : "bg-slate-400");
  const pill = (t: "ok" | "warn" | "unknown", label: string, detail: string) => (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${tone(t)}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot(t)}`} />
      {label}: {detail}
    </span>
  );
  const vrpTone: "ok" | "warn" | "unknown" = vrp == null ? "unknown" : vrp >= 0 ? "ok" : "warn";
  const earnTone: "ok" | "warn" | "unknown" = dteEarn == null ? "unknown" : dteEarn > 14 ? "ok" : "warn";
  const liqTone: "ok" | "warn" | "unknown" = spreadPct == null ? "unknown" : spreadPct <= 0.1 ? "ok" : "warn";
  return (
    <div className="flex flex-wrap gap-2">
      {pill(vrpTone, "VRP", vrp == null ? "unknown" : `${vrp >= 0 ? "+" : ""}${vrp.toFixed(1)} pp`)}
      {pill(earnTone, "Earnings", dteEarn == null ? "unknown" : `${dteEarn}d away`)}
      {pill(liqTone, "Liquidity", spreadPct == null ? "unknown" : `${(spreadPct * 100).toFixed(1)}% gap`)}
    </div>
  );
}

function quoteSpread(q: { bid: number | null; ask: number | null } | null): number | null {
  if (!q || q.bid == null || q.ask == null || !(q.bid > 0) || !(q.ask >= q.bid)) return null;
  const mid = (q.bid + q.ask) / 2;
  return mid > 0 ? (q.ask - q.bid) / mid : null;
}

export default function WheelLabTools({ initial }: { initial: ToolsInit }) {
  const [tab, setTab] = useState<"payoff" | "cycle" | "income">((["payoff", "cycle", "income"] as const).includes(initial.tab as never) ? (initial.tab as "payoff" | "cycle" | "income") : "payoff");
  const [ticker, setTicker] = useState(initial.ticker?.toUpperCase() ?? "");
  const [spot, setSpot] = useState(n(initial.spot, 100));
  const [dte, setDte] = useState(n(initial.dte, 30));
  const [iv, setIv] = useState(n(initial.iv, 0.25));
  const [hv, setHv] = useState(n(initial.hv, 0.2));
  const [preset, setPreset] = useState<PresetId>((PRESET_META.some((p) => p.id === initial.preset) ? initial.preset : "short-put") as PresetId);
  const [legs, setLegs] = useState<Leg[]>(() => {
    const base = presetLegs((PRESET_META.some((p) => p.id === initial.preset) ? initial.preset : "short-put") as PresetId, n(initial.spot, 100), n(initial.credit, 1));
    if (initial.strike && base[0] && base[0].right !== "stock") {
      base[0] = { ...base[0], strike: Number(initial.strike), premium: n(initial.credit, base[0].premium) };
    }
    return base;
  });
  const [expiry, setExpiry] = useState(initial.expiry ?? "");
  const [chainMsg, setChainMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [putStrike, setPutStrike] = useState(n(initial.strike, 95));
  const [putCredit, setPutCredit] = useState(n(initial.credit, 1));
  const [contracts, setContracts] = useState(1);
  const [callStrike, setCallStrike] = useState(n(initial.callStrike, 100));
  const [callCredit, setCallCredit] = useState(n(initial.callCredit, 1.25));
  const [callDte, setCallDte] = useState(30);
  const [includeCall, setIncludeCall] = useState(!!initial.callStrike);

  const [monthly, setMonthly] = useState(500);
  const [rocCycle, setRocCycle] = useState(0.8);
  const [dteEarn, setDteEarn] = useState<number | null>(() => {
    const x = n(initial.earnDays, NaN);
    return Number.isFinite(x) ? x : null;
  });
  const [spreadPct, setSpreadPct] = useState<number | null>(() => {
    const x = n(initial.spreadPct, NaN);
    return Number.isFinite(x) ? x : null;
  });

  const emIv = expectedMove(spot, iv, dte);
  const emHv = expectedMove(spot, hv, dte);
  const summary = useMemo(() => summarizePayoff(legs, spot), [legs, spot]);
  const cycle = wheelCycle({
    spot,
    putStrike,
    putCredit,
    putDte: dte,
    contracts,
    callStrike: includeCall ? callStrike : null,
    callCredit: includeCall ? callCredit : null,
    callDte: includeCall ? callDte : null,
  });
  const income = capitalForMonthlyIncome(monthly, rocCycle / 100, dte);

  async function loadChain() {
    const t = ticker.trim().toUpperCase();
    if (!t) return;
    setLoading(true);
    setChainMsg(null);
    try {
      const res = await fetch(`/api/wheel/chain?symbol=${encodeURIComponent(t)}&type=both&dteMin=7&dteMax=75`);
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "chain failed");
      setSpot(j.price);
      const chain = j.contracts as ChainQuote[];
      let nextLegs: Leg[] = [];
      setLegs((prev) => {
        nextLegs = applyQuotes(prev, chain, expiry || undefined);
        return nextLegs;
      });
      const opt = nextLegs.find((l) => l.right === "put" || l.right === "call");
      const q =
        opt && opt.strike != null && (opt.right === "put" || opt.right === "call")
          ? nearestQuote(chain, opt.right, opt.strike, expiry || undefined)
          : null;
      setSpreadPct(quoteSpread(q));
      const first = chain[0];
      if (first?.expiration) setExpiry(first.expiration);
      const earn = typeof j.nextEarnings === "string" ? j.nextEarnings : null;
      const today = new Date().toISOString().slice(0, 10);
      setDteEarn(earn && earn >= today ? daysBetween(today, earn) : null);
      setChainMsg(`${t} ${money(j.price)} · ${chain.length} quotes · ${j.source}${j.stale ? " (stale)" : ""}`);
    } catch (e) {
      setChainMsg(e instanceof Error ? e.message : "Could not load chain");
    } finally {
      setLoading(false);
    }
  }

  function applyPreset(id: PresetId) {
    setPreset(id);
    setLegs(presetLegs(id, spot, putCredit || 1));
  }

  function updateLeg(id: string, patch: Partial<Leg>) {
    setLegs((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  const tabs = [
    { id: "payoff" as const, label: "Payoff" },
    { id: "cycle" as const, label: "Wheel cycle" },
    { id: "income" as const, label: "Income target" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-400/80">Wheel lab</div>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">Payoff, cycle & expected move</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            Expiration P&amp;L from listed quotes (Alpaca / Yahoo). Credits use a 25% bid-to-ask fill. Not a forecast — research only.
          </p>
        </div>
        <Link href="/wheel" className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-800 hover:bg-teal-100 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-200 dark:hover:bg-teal-500/20">
          ← Wheel screener
        </Link>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void loadChain();
        }}
        className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-[#0F1A3A]"
      >
        <label className="grid gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          Ticker
          <input value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} placeholder="AAPL" maxLength={10} className="w-28 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm dark:border-slate-700 dark:bg-[#111C3E] dark:text-white" />
        </label>
        <button type="submit" disabled={loading} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-50">
          {loading ? "Loading…" : "Load live chain"}
        </button>
        {chainMsg && <span className="text-xs text-slate-400">{chainMsg}</span>}
      </form>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Spot" value={money(spot)} />
        <Kpi label="1σ expected move (IV)" value={emIv ? `±${money(emIv.one)}` : "N/A"} hint={emIv ? `${pct(emIv.pct1, 1)} · ${money(emIv.low1)}–${money(emIv.high1)}` : "need IV"} />
        <Kpi label="1σ from HV30" value={emHv ? `±${money(emHv.one)}` : "N/A"} hint={emHv ? `${money(emHv.low1)}–${money(emHv.high1)}` : "need HV"} />
        <Kpi label="VRP (IV − HV)" value={vrpPp(iv, hv) == null ? "N/A" : `${vrpPp(iv, hv)! >= 0 ? "+" : ""}${vrpPp(iv, hv)!.toFixed(1)} pp`} tone={vrpPp(iv, hv) != null && vrpPp(iv, hv)! >= 0 ? "up" : "down"} hint="Positive = options richer than realized" />
      </div>
      <div className="flex flex-wrap gap-3">
        <label className="grid gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          DTE
          <input type="number" value={dte} onChange={(e) => setDte(Number(e.target.value) || 0)} className="w-24 rounded-lg border border-slate-700 bg-[#111C3E] px-2.5 py-1.5 text-sm text-white" />
        </label>
        <label className="grid gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          IV (decimal)
          <input type="number" step="0.01" value={iv} onChange={(e) => setIv(Number(e.target.value) || 0)} className="w-24 rounded-lg border border-slate-700 bg-[#111C3E] px-2.5 py-1.5 text-sm text-white" />
        </label>
        <label className="grid gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          HV30 (decimal)
          <input type="number" step="0.01" value={hv} onChange={(e) => setHv(Number(e.target.value) || 0)} className="w-24 rounded-lg border border-slate-700 bg-[#111C3E] px-2.5 py-1.5 text-sm text-white" />
        </label>
        <label className="grid gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          Spot
          <input type="number" step="0.01" value={spot} onChange={(e) => setSpot(Number(e.target.value) || 0)} className="w-28 rounded-lg border border-slate-700 bg-[#111C3E] px-2.5 py-1.5 text-sm text-white" />
        </label>
      </div>
      <Conditions iv={iv} hv={hv} dteEarn={dteEarn} spreadPct={spreadPct} />

      <div className="inline-flex rounded-lg border border-slate-800 bg-[#0F1A3A] p-0.5">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`rounded-md px-3 py-1.5 text-xs font-medium ${tab === t.id ? "bg-teal-600 text-white" : "text-slate-400 hover:text-white"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "payoff" && (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#0F1A3A]">
          <div className="space-y-2">
            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
              <div className="flex min-w-0 flex-wrap items-center gap-1.5 pb-0.5">
                {PRESET_META.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => applyPreset(p.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium ${preset === p.id ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"}`}
                    title={p.desc}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-end gap-6">
                <div className="grid gap-1">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Example price</div>
                  <div className="flex h-8 items-center font-mono text-xl font-semibold tabular-nums text-slate-900 dark:text-white">{money(spot)}</div>
                </div>
                <div className="grid gap-1">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Model expiration</div>
                  <div className="flex h-8 items-center font-mono text-base font-semibold tabular-nums text-slate-900 dark:text-white">{expiry || `${dte} DTE`}</div>
                </div>
                <label className="grid gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Position size
                  <span className="inline-flex h-8 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                    <button type="button" className="px-2.5 text-sm leading-none text-slate-600 dark:text-slate-300" onClick={() => setLegs((prev) => prev.map((l) => ({ ...l, qty: Math.max(1, l.qty - 1) })))}>
                      −
                    </button>
                    <span className="flex min-w-[2rem] items-center justify-center bg-slate-50 px-2 font-mono text-sm tabular-nums dark:bg-[#111C3E] dark:text-white">{legs[0]?.qty ?? 1}</span>
                    <button type="button" className="px-2.5 text-sm leading-none text-slate-600 dark:text-slate-300" onClick={() => setLegs((prev) => prev.map((l) => ({ ...l, qty: l.qty + 1 })))}>
                      +
                    </button>
                  </span>
                </label>
              </div>
            </div>
            <p className="text-xs text-slate-500">{PRESET_META.find((p) => p.id === preset)?.desc}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Kpi label="Net credit" value={money(summary.netCredit)} tone={summary.netCredit >= 0 ? "up" : "down"} hint="Fees excluded" />
            <Kpi label="Max profit" value={summary.profitUnbounded ? "Unlimited" : money(summary.maxProfit)} tone="up" hint="At expiration" />
            <Kpi label="Max loss" value={summary.lossUnbounded ? "Unlimited" : money(summary.maxLoss)} tone="down" hint="At expiration" />
            <Kpi label="Breakevens" value={summary.breakevens.length ? summary.breakevens.map((b) => money(b)).join(" / ") : "—"} hint="Stock at zero P/L" />
            <Kpi label="ROC" value={summary.roc != null ? pct(summary.roc, 1) : "N/A"} hint={summary.capital ? `capital ${money(summary.capital, 0)}` : undefined} />
          </div>

          <div>
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Profit / loss at expiration</div>
            <PayoffChart
              points={summary.points}
              spot={spot}
              breakevens={summary.breakevens}
              emLow={emIv?.low1}
              emHigh={emIv?.high1}
              maxProfit={summary.maxProfit}
              maxLoss={summary.maxLoss}
              profitUnbounded={summary.profitUnbounded}
              lossUnbounded={summary.lossUnbounded}
              strikes={legs.map((l) => l.strike).filter((x): x is number => x != null)}
            />
            <p className="mt-2 text-[11px] text-slate-500">Green = profit, red = loss. Amber = breakevens. Teal band = 1σ expected move from IV. 100 shares per contract. Not a forecast.</p>
          </div>

          <details open className="rounded-xl border border-slate-200 dark:border-slate-800">
            <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Position legs · {legs.length}</summary>
            <div className="overflow-x-auto border-t border-slate-200 dark:border-slate-800">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-[10px] uppercase tracking-[0.12em] text-slate-500 dark:bg-[#0D1632]">
                  <tr>
                    {["Side", "Type", "Strike", "Premium / sh", "Qty"].map((h) => (
                      <th key={h} className="px-3 py-2 font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {legs.map((l) => (
                    <tr key={l.id}>
                      <td className="px-3 py-2">
                        <select value={l.side} onChange={(e) => updateLeg(l.id, { side: e.target.value as Leg["side"] })} className="rounded border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-[#111C3E] dark:text-white">
                          <option value="sell">Sell</option>
                          <option value="buy">Buy</option>
                        </select>
                      </td>
                      <td className="px-3 py-2 capitalize text-slate-600 dark:text-slate-300">{l.right}</td>
                      <td className="px-3 py-2">
                        {l.right === "stock" ? (
                          <span className="text-slate-500">—</span>
                        ) : (
                          <input type="number" value={l.strike ?? 0} onChange={(e) => updateLeg(l.id, { strike: Number(e.target.value) })} className="w-24 rounded border border-slate-300 bg-white px-2 py-1 font-mono text-xs dark:border-slate-700 dark:bg-[#111C3E] dark:text-white" />
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" step="0.01" value={l.premium} onChange={(e) => updateLeg(l.id, { premium: Number(e.target.value) })} className="w-24 rounded border border-slate-300 bg-white px-2 py-1 font-mono text-xs dark:border-slate-700 dark:bg-[#111C3E] dark:text-white" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min={1} value={l.qty} onChange={(e) => updateLeg(l.id, { qty: Math.max(1, Number(e.target.value) || 1) })} className="w-16 rounded border border-slate-300 bg-white px-2 py-1 font-mono text-xs dark:border-slate-700 dark:bg-[#111C3E] dark:text-white" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      )}

      {tab === "cycle" && cycle && (
        <div className="space-y-4">
          <p className="text-sm text-slate-400">Cash-secured put, then (optional) covered call after assignment. Cost basis = put strike − put credit.</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="grid gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Put strike
              <input type="number" value={putStrike} onChange={(e) => setPutStrike(Number(e.target.value) || 0)} className="rounded-lg border border-slate-700 bg-[#111C3E] px-2.5 py-1.5 text-sm text-white" />
            </label>
            <label className="grid gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Put credit / sh
              <input type="number" step="0.01" value={putCredit} onChange={(e) => setPutCredit(Number(e.target.value) || 0)} className="rounded-lg border border-slate-700 bg-[#111C3E] px-2.5 py-1.5 text-sm text-white" />
            </label>
            <label className="grid gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Contracts
              <input type="number" min={1} value={contracts} onChange={(e) => setContracts(Math.max(1, Number(e.target.value) || 1))} className="rounded-lg border border-slate-700 bg-[#111C3E] px-2.5 py-1.5 text-sm text-white" />
            </label>
            <label className="flex items-center gap-2 pt-5 text-sm text-slate-300">
              <input type="checkbox" checked={includeCall} onChange={(e) => setIncludeCall(e.target.checked)} className="accent-teal-600" />
              Phase 2 · covered call
            </label>
            {includeCall && (
              <>
                <label className="grid gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Call strike
                  <input type="number" value={callStrike} onChange={(e) => setCallStrike(Number(e.target.value) || 0)} className="rounded-lg border border-slate-700 bg-[#111C3E] px-2.5 py-1.5 text-sm text-white" />
                </label>
                <label className="grid gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Call credit / sh
                  <input type="number" step="0.01" value={callCredit} onChange={(e) => setCallCredit(Number(e.target.value) || 0)} className="rounded-lg border border-slate-700 bg-[#111C3E] px-2.5 py-1.5 text-sm text-white" />
                </label>
                <label className="grid gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Call DTE
                  <input type="number" value={callDte} onChange={(e) => setCallDte(Number(e.target.value) || 0)} className="rounded-lg border border-slate-700 bg-[#111C3E] px-2.5 py-1.5 text-sm text-white" />
                </label>
              </>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="Cash required" value={money(cycle.cashRequired, 0)} />
            <Kpi label="Put premium" value={money(cycle.putPremium)} tone="up" />
            <Kpi label="Basis if assigned" value={money(cycle.basisIfAssigned)} hint={cycle.discountIfAssigned != null ? `${pct(cycle.discountIfAssigned, 1)} below spot` : undefined} />
            <Kpi label="Put ROC / yr" value={pct(cycle.putAnnRoc, 1)} hint={`${pct(cycle.putRoc, 2)} this cycle · on cash at risk`} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-[#0F1A3A] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-400">Expires OTM</div>
              <p className="mt-2 text-sm text-slate-300">Keep {money(cycle.otmPnl)} and sell another put. No shares.</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-[#0F1A3A] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-300">Assigned</div>
              <p className="mt-2 text-sm text-slate-300">Own {cycle.contracts * 100} shares at {money(cycle.basisIfAssigned)} effective. {cycle.call ? `If called away at ${money(callStrike)}: ${money(cycle.call.ifCalledTotal)} total (${pct(cycle.call.cycleAnnIfCalled, 1)}/yr over both legs).` : "Tick phase 2 to model a covered call."}</p>
            </div>
          </div>
        </div>
      )}

      {tab === "income" && (
        <div className="space-y-4">
          <p className="text-sm text-slate-400">How much cash to set aside if you repeat a cycle of this ROC and DTE. Assumes continuous deployment — IV and assignment will not cooperate that cleanly.</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="grid gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Monthly target $
              <input type="number" value={monthly} onChange={(e) => setMonthly(Number(e.target.value) || 0)} className="rounded-lg border border-slate-700 bg-[#111C3E] px-2.5 py-1.5 text-sm text-white" />
            </label>
            <label className="grid gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              ROC per cycle %
              <input type="number" step="0.1" value={rocCycle} onChange={(e) => setRocCycle(Number(e.target.value) || 0)} className="rounded-lg border border-slate-700 bg-[#111C3E] px-2.5 py-1.5 text-sm text-white" />
            </label>
            <label className="grid gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              DTE
              <input type="number" value={dte} onChange={(e) => setDte(Number(e.target.value) || 0)} className="rounded-lg border border-slate-700 bg-[#111C3E] px-2.5 py-1.5 text-sm text-white" />
            </label>
          </div>
          {income ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <Kpi label="Capital required" value={money(income.capital, 0)} />
              <Kpi label="Cycles / year" value={income.cyclesPerYear.toFixed(1)} />
              <Kpi label="Annualised ROC" value={pct(income.annualRoc, 1)} />
            </div>
          ) : (
            <p className="text-sm text-slate-500">Enter a positive target, ROC and DTE.</p>
          )}
        </div>
      )}
    </div>
  );
}
