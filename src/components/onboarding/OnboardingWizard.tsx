"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { STARTER_PORTFOLIOS, starterForAnswers } from "@/lib/starter-portfolios";

const GOALS = [
  { v: "income", l: "Income — regular distributions" },
  { v: "growth", l: "Growth — maximize long-run return" },
  { v: "balanced", l: "Balanced — mix of return & income" },
  { v: "defensive", l: "Defensive — low volatility" },
  { v: "lowcost", l: "Low-cost core — cheap & large" },
];
const HORIZONS = [
  { v: "1-3", l: "1–3 years (need it soon)" },
  { v: "3-7", l: "3–7 years (mid horizon)" },
  { v: "7+", l: "7+ years (can ride cycles)" },
];
const RISKS = [
  { v: "preserve", l: "Preserve — I hate drawdowns" },
  { v: "modest", l: "Modest — some ups/downs OK" },
  { v: "grow", l: "Grow — accept volatility for upside" },
];

export default function OnboardingWizard({ prices }: { prices: Record<string, number | null> }) {
  const [goal, setGoal] = useState("balanced");
  const [horizon, setHorizon] = useState("3-7");
  const [risk, setRisk] = useState("modest");
  const [creating, setCreating] = useState<string | null>(null);
  const [done, setDone] = useState<{ id: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rec = useMemo(() => starterForAnswers(goal, horizon, risk), [goal, horizon, risk]);
  const goalHref = `/recommend?goal=${rec.goal}&aum=1000000000&rank=class`;

  async function buildStarter(s: typeof STARTER_PORTFOLIOS[number]) {
    setCreating(s.id);
    setError(null);
    try {
      const res = await fetch("/api/portfolios", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: `Starter — ${s.name}`, brokerType: "manual" }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error ?? "create failed");
      const id = j.portfolio?.id ?? j.id;
      if (!id) throw new Error("no portfolio id");
      const missingPx = s.holdings.filter((h) => !(prices[h.ticker] != null && prices[h.ticker]! > 0)).map((h) => h.ticker);
      if (missingPx.length) {
        throw new Error(`No live price for ${missingPx.join(", ")} — not guessing $100. Try again when quotes are available.`);
      }
      for (const h of s.holdings) {
        const price = prices[h.ticker]!;
        const notional = 10000 * h.weight;
        const qty = Math.max(0.001, notional / price);
        const pres = await fetch(`/api/portfolios/${id}/positions`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ticker: h.ticker, quantity: Number(qty.toFixed(4)), averageCostBasis: Number(price.toFixed(2)) }),
        });
        const pj = await pres.json().catch(() => ({}));
        if (!pres.ok) throw new Error((pj as { error?: string }).error ?? `Could not add ${h.ticker}`);
      }
      setDone({ id, name: s.name });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setCreating(null);
    }
  }

  const field = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-teal-500 focus:outline-none";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">3 quick questions → your starting point</h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">We map your answer to a goal + horizon + risk model that pre-fills Recommend and suggests a starter portfolio you can tweak. No advice — just a vetted starting allocation.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="text-xs text-slate-600">
            <span className="mb-1 block font-medium">1. What's the job?</span>
            <select value={goal} onChange={(e) => setGoal(e.target.value)} className={field}>{GOALS.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</select>
          </label>
          <label className="text-xs text-slate-600">
            <span className="mb-1 block font-medium">2. When do you need it?</span>
            <select value={horizon} onChange={(e) => setHorizon(e.target.value)} className={field}>{HORIZONS.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</select>
          </label>
          <label className="text-xs text-slate-600">
            <span className="mb-1 block font-medium">3. How much volatility?</span>
            <select value={risk} onChange={(e) => setRisk(e.target.value)} className={field}>{RISKS.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={goalHref} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500">See ranked picks for “{rec.goal}” →</Link>
          <Link href="/screener" className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">Open screener</Link>
        </div>
        <p className="mt-2 text-[11px] text-slate-400">Your answers set <code className="rounded bg-slate-100 px-1">{rec.goal}</code> + <code className="rounded bg-slate-100 px-1">{horizon}</code> + <code className="rounded bg-slate-100 px-1">{risk}</code> → starter <b>{rec.name}</b>. You can change them anytime in Recommend.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {STARTER_PORTFOLIOS.map((s) => {
          const isRec = s.id === rec.id;
          return (
            <div key={s.id} className={`relative rounded-2xl border bg-white p-4 shadow-sm ${isRec ? "border-teal-300 ring-1 ring-teal-200" : "border-slate-200"}`}>
              {isRec && <span className="absolute -top-2 right-3 rounded-full bg-teal-600 px-2 py-0.5 text-[10px] font-semibold text-white">Recommended</span>}
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{s.badge}</div>
              <h3 className="mt-1 text-base font-semibold text-slate-900">{s.name}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">{s.why}</p>
              <ul className="mt-3 space-y-1.5 text-sm">
                {s.holdings.map((h) => (
                  <li key={h.ticker} className="flex justify-between">
                    <span className="font-semibold text-slate-800">{h.ticker} <span className="font-normal text-slate-500">{h.label}</span></span>
                    <span className="tabular-nums text-slate-700">{Math.round(h.weight * 100)}%</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-amber-700 bg-amber-50 rounded-lg p-2">Watch: {s.watch}</p>
              <div className="mt-4 grid gap-2">
                <button onClick={() => buildStarter(s)} disabled={!!creating} className={`rounded-lg px-3 py-2 text-sm font-semibold ${isRec ? "bg-teal-600 text-white hover:bg-teal-500" : "bg-slate-900 text-white hover:bg-slate-800"} disabled:opacity-50`}>
                  {creating === s.id ? "Creating…" : "Build this starter in Portfolio →"}
                </button>
                <Link href={`/recommend?goal=${s.goal}&aum=1000000000`} className="text-center rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">See why these rank →</Link>
              </div>
            </div>
          );
        })}
      </div>

      {done && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Created <b>{done.name}</b> — <Link className="underline" href={`/portfolio?open=${done.id}`}>open this portfolio</Link>.
        </div>
      )}
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-600">
        <b className="text-slate-800">What happens when you click “Build”?</b> We create a manual portfolio named “Starter — {rec.name}” and add the tickers as positions sized to $10k notional at the last price (so allocation % matches the plan). No trades are placed; you can edit quantities, add cash, or delete it. Use it as a target and rebalance toward it.
      </div>
    </div>
  );
}
