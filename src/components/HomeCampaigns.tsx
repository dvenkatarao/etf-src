"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Briefcase } from "lucide-react";
import { money } from "@/lib/format";

type WheelPos = {
  id: string;
  ticker: string;
  side: "put_sold" | "assigned" | "call_sold" | "closed";
  strike: number;
  expiration: string;
  premium: number;
  quantity: number;
  openedAt: string;
};

const LS_KEY = "wheel:positions:v1";
const SIDE: Record<WheelPos["side"], string> = {
  put_sold: "CSP sold",
  assigned: "Assigned",
  call_sold: "Call sold",
  closed: "Closed",
};

export default function HomeCampaigns() {
  const [pos, setPos] = useState<WheelPos[] | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      setPos(raw ? (JSON.parse(raw) as WheelPos[]) : []);
    } catch {
      setPos([]);
    }
  }, []);

  const open = (pos ?? []).filter((p) => p.side !== "closed");

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">Active campaigns</h2>
          <p className="mt-0.5 text-xs text-slate-500">Your tracked wheel positions in this browser. Empty until you add one.</p>
        </div>
        <Link href="/wheel" className="text-xs font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400">
          Open tracker →
        </Link>
      </div>
      {pos === null ? (
        <div className="h-24 rounded-xl border border-dashed border-slate-800 bg-slate-900/40" />
      ) : open.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-slate-700 bg-slate-900/60 p-6">
          <Briefcase className="h-5 w-5 text-slate-500" />
          <div>
            <div className="text-sm font-semibold text-slate-200">No campaigns yet</div>
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-500">
              Add a cash-secured put or covered call in Wheel Lab. We do not invent demo positions.
            </p>
          </div>
          <Link href="/wheel" className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
            Track a position <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {open.slice(0, 6).map((p) => (
            <article key={p.id} className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg">
              <div className="flex items-start justify-between gap-2">
                <Link href={`/wheel/${p.ticker}`} className="font-mono text-2xl font-extrabold text-white hover:text-emerald-400">
                  {p.ticker}
                </Link>
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300 ring-1 ring-emerald-500/30">
                  {SIDE[p.side]}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 font-mono text-[11px]">
                <div>
                  <div className="text-[10px] uppercase text-slate-500">Strike</div>
                  <div className="font-bold text-slate-100">{money(p.strike)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-slate-500">Credit</div>
                  <div className="font-bold text-emerald-400">{money(p.premium)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-slate-500">Qty</div>
                  <div className="font-bold text-slate-100">{p.quantity}</div>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-slate-500">
                Exp {p.expiration} · opened {p.openedAt}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
