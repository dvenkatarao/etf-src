"use client";

import { useEffect, useMemo, useState } from "react";
import { money } from "@/lib/format";

type WheelPos = {
  id: string;
  ticker: string;
  side: "put_sold" | "assigned" | "call_sold" | "closed";
  strike: number;
  expiration: string;
  premium: number;
  quantity: number;
  openedAt: string; // YYYY-MM-DD
  closedAt?: string | null;
  costBasis?: number | null;
  notes?: string;
};

const LS_KEY = "wheel:positions:v1";

function load(): WheelPos[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as WheelPos[];
  } catch {
    return [];
  }
}
function save(pos: WheelPos[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(pos));
  } catch {
    /* ignore */
  }
}

export default function WheelPositionsTracker() {
  const [positions, setPositions] = useState<WheelPos[]>([]);
  const [open, setOpen] = useState(false);
  // form
  const [ticker, setTicker] = useState("");
  const [side, setSide] = useState<WheelPos["side"]>("put_sold");
  const [strike, setStrike] = useState("");
  const [expiration, setExpiration] = useState("");
  const [premium, setPremium] = useState("");
  const [qty, setQty] = useState("1");
  const [openedAt, setOpenedAt] = useState(new Date().toISOString().slice(0, 10));
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setPositions(load());
  }, []);

  useEffect(() => {
    if (positions.length || load().length) save(positions);
  }, [positions]);

  const add = () => {
    const t = ticker.trim().toUpperCase();
    const st = Number(strike);
    const pr = Number(premium);
    const q = Number(qty) || 1;
    if (!t || !st || !pr || !expiration) {
      setFormError("Ticker, strike, expiration and premium are required.");
      return;
    }
    setFormError(null);
    const row: WheelPos = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ticker: t,
      side,
      strike: st,
      expiration,
      premium: pr,
      quantity: q,
      openedAt,
      costBasis: side === "assigned" ? st - pr : null,
    };
    const next = [row, ...positions];
    setPositions(next);
    setTicker("");
    setStrike("");
    setPremium("");
    setExpiration("");
  };

  const remove = (id: string) => setPositions((p) => p.filter((x) => x.id !== id));
  const assign = (id: string) => {
    setPositions((p) =>
      p.map((x) => (x.id === id ? { ...x, side: "assigned" as const, costBasis: x.strike - x.premium, closedAt: null } : x)),
    );
  };
  const close = (id: string) => setPositions((p) => p.map((x) => (x.id === id ? { ...x, side: "closed" as const, closedAt: new Date().toISOString().slice(0, 10) } : x)));

  const summary = useMemo(() => {
    const open = positions.filter((x) => x.side !== "closed");
    const cashSecured = open.filter((x) => x.side === "put_sold").reduce((s, x) => s + x.strike * 100 * x.quantity, 0);
    const collected = open.reduce((s, x) => s + x.premium * 100 * x.quantity, 0);
    const assignedCost = open.filter((x) => x.side === "assigned").reduce((s, x) => s + (x.costBasis ?? 0) * 100 * x.quantity, 0);
    return { openCount: open.length, cashSecured, collected, assignedCost };
  }, [positions]);

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0F1A3A] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">My Wheel Positions (local, no broker link)</h3>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
            Track puts sold → pending → assigned → calls sold with running cost basis. Stored in this browser only (localStorage). Not orders, just your ledger.
          </p>
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="rounded-lg bg-[#1B2540] px-3 py-1.5 text-xs font-medium text-teal-300 ring-1 ring-teal-500/20 hover:bg-[#24304F]"
        >
          {open ? "Hide log" : `Open ledger (${positions.length})`}
        </button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-[#111C3E] p-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Open positions</div>
          <div className="mt-1 text-lg font-semibold text-white">{summary.openCount}</div>
        </div>
        <div className="rounded-lg bg-[#111C3E] p-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Cash secured</div>
          <div className="mt-1 text-lg font-semibold text-white">{money(summary.cashSecured)}</div>
        </div>
        <div className="rounded-lg bg-[#111C3E] p-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Premium collected</div>
          <div className="mt-1 text-lg font-semibold text-emerald-300">{money(summary.collected)}</div>
        </div>
      </div>

      {open && (
        <>
          <div className="mt-4 grid gap-3 rounded-xl border border-slate-700/50 bg-[#111C3E] p-4 md:grid-cols-7">
            <input value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} placeholder="Ticker" className="rounded-lg border border-slate-700 bg-[#0F1A3A] px-2 py-1.5 text-xs text-white placeholder:text-slate-500" />
            <select value={side} onChange={(e) => setSide(e.target.value as any)} className="rounded-lg border border-slate-700 bg-[#0F1A3A] px-2 py-1.5 text-xs text-white">
              <option value="put_sold">Put sold</option>
              <option value="assigned">Assigned</option>
              <option value="call_sold">Call sold</option>
            </select>
            <input value={strike} onChange={(e) => setStrike(e.target.value)} placeholder="Strike" inputMode="decimal" className="rounded-lg border border-slate-700 bg-[#0F1A3A] px-2 py-1.5 text-xs text-white placeholder:text-slate-500" />
            <input value={expiration} onChange={(e) => setExpiration(e.target.value)} type="date" className="rounded-lg border border-slate-700 bg-[#0F1A3A] px-2 py-1.5 text-xs text-white" />
            <input value={premium} onChange={(e) => setPremium(e.target.value)} placeholder="Premium $/share" inputMode="decimal" className="rounded-lg border border-slate-700 bg-[#0F1A3A] px-2 py-1.5 text-xs text-white placeholder:text-slate-500" />
            <input value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Contracts" inputMode="numeric" className="w-20 rounded-lg border border-slate-700 bg-[#0F1A3A] px-2 py-1.5 text-xs text-white" />
            <button onClick={add} className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-500">Add</button>
          </div>
          {formError && <p className="mt-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">{formError}</p>}

          {positions.length === 0 ? (
            <p className="mt-3 text-xs text-slate-500">No positions yet. Log the puts you sell — your cost basis after assignment is <b>strike − premium</b> and updates when you add follow-on premiums.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="text-[10px] uppercase tracking-[0.12em] text-slate-400">
                  <tr>
                    <th className="px-2 py-1 text-left">Ticker / Side</th>
                    <th className="px-2 py-1 text-right">Strike</th>
                    <th className="px-2 py-1 text-left">Expiry</th>
                    <th className="px-2 py-1 text-right">Premium</th>
                    <th className="px-2 py-1 text-right">Contracts</th>
                    <th className="px-2 py-1 text-right">Cash needed</th>
                    <th className="px-2 py-1 text-right">Cost basis</th>
                    <th className="px-2 py-1" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {positions.map((p) => (
                    <tr key={p.id} className={p.side === "closed" ? "opacity-50" : ""}>
                      <td className="px-2 py-1.5">
                        <span className="font-semibold text-white">{p.ticker}</span> <span className={`ml-1 rounded px-1.5 py-0.5 text-[10px] font-semibold ${p.side === "put_sold" ? "bg-violet-500/20 text-violet-300" : p.side === "assigned" ? "bg-amber-500/15 text-amber-300" : p.side === "call_sold" ? "bg-sky-500/15 text-sky-300" : "bg-slate-700 text-slate-300"}`}>{p.side}</span>
                        <div className="text-[11px] text-slate-500">{p.openedAt}{p.closedAt ? ` → ${p.closedAt}` : ""}</div>
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-white">{money(p.strike)}</td>
                      <td className="px-2 py-1.5">{p.expiration}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-emerald-300">{money(p.premium)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{p.quantity}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-slate-300">{money(p.strike * 100 * p.quantity)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-white">{p.costBasis != null ? money(p.costBasis) : "—"}</td>
                      <td className="px-2 py-1.5 text-right">
                        <div className="flex justify-end gap-1">
                          {p.side === "put_sold" && <button onClick={() => assign(p.id)} className="rounded bg-amber-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-amber-500">Assign</button>}
                          {p.side !== "closed" && <button onClick={() => close(p.id)} className="rounded bg-slate-700 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-600">Close</button>}
                          <button onClick={() => remove(p.id)} className="rounded bg-rose-700/60 px-2 py-1 text-[11px] text-rose-100 hover:bg-rose-600">✕</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {positions.length > 0 && <p className="mt-2 text-[11px] text-slate-500">Clear your browser storage to reset. For taxes, export your ledger and confirm lots with your broker.</p>}
        </>
      )}
    </div>
  );
}
