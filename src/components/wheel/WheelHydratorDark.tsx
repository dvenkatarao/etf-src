"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Phase = "stocks" | "scans" | "done";

/**
 * Loads the stock universe (fundamentals + technicals), then scans option chains for the A/A+ stocks, in small
 * batches so no request can time out. Refreshes the page when finished.
 * Dark variant for Wheel.
 */
export default function WheelHydratorDark({ staleStocks, staleScans, total }: { staleStocks: number; staleScans: number; total: number }) {
  const router = useRouter();
  const started = useRef(false);
  const need = staleStocks > 0 || staleScans > 0;
  const [phase, setPhase] = useState<Phase>(need ? (staleStocks > 0 ? "stocks" : "scans") : "done");
  const [stocksLeft, setStocksLeft] = useState(staleStocks);
  const [scansLeft, setScansLeft] = useState(staleScans);
  const [scansTotal, setScansTotal] = useState(staleScans);
  const [failed, setFailed] = useState<string[]>([]);

  useEffect(() => {
    if (!need || started.current) return;
    started.current = true;
    (async () => {
      const bad: string[] = [];
      const loop = async (url: string, limit: number, onLeft: (n: number) => void) => {
        let errors = 0;
        for (let guard = 0; guard < 200; guard++) {
          try {
            const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ limit }) });
            if (!res.ok) throw new Error(String(res.status));
            const j: { remaining: number; processed: { ticker: string; ok: boolean }[] } = await res.json();
            for (const p of j.processed) if (!p.ok) bad.push(p.ticker);
            setFailed([...bad]);
            onLeft(j.remaining);
            if (j.processed.length === 0 || j.remaining === 0) return;
            errors = 0;
          } catch {
            if (++errors >= 3) return;
            await new Promise((r) => setTimeout(r, 2000));
          }
        }
      };
      if (staleStocks > 0) {
        setPhase("stocks");
        await loop("/api/wheel/refresh", 8, setStocksLeft);
      }
      setPhase("scans");
      try {
        const r = await fetch("/api/wheel/scan");
        const j: { remaining: number } = await r.json();
        setScansTotal(j.remaining);
        setScansLeft(j.remaining);
        if (j.remaining > 0) await loop("/api/wheel/scan", 6, setScansLeft);
      } catch {
        /* the page still shows whatever was stored */
      }
      setPhase("done");
      router.refresh();
    })();
  }, [need, staleStocks, router]);

  if (phase === "done" && failed.length === 0) return null;
  const pct = phase === "stocks" ? Math.round(((total - stocksLeft) / Math.max(1, total)) * 100) : Math.round(((scansTotal - scansLeft) / Math.max(1, scansTotal)) * 100);
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
      {phase !== "done" ? (
        <>
          <span className="h-1 w-32 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <span className="block h-full rounded-full bg-teal-500" style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
          </span>
          <span>
            {phase === "stocks"
              ? `Updating ${total - stocksLeft} of ${total} stocks…`
              : `Scanning chains ${scansTotal - scansLeft} of ${scansTotal}…`}
          </span>
        </>
      ) : (
        <span className="text-amber-700 dark:text-amber-300">{failed.length} item(s) could not be fetched and are left out rather than guessed: {failed.slice(0, 30).join(", ")}{failed.length > 30 ? "…" : ""}.</span>
      )}
    </div>
  );
}
