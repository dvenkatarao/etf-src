"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Pulls live data for the ETF universe in small batches (so no request can time out)
 * and refreshes the page when finished. Existing (older) rows stay visible meanwhile.
 */
export default function Hydrator({ remaining, total }: { remaining: number; total: number }) {
  const router = useRouter();
  const started = useRef(false);
  const [left, setLeft] = useState(remaining);
  const [failed, setFailed] = useState<string[]>([]);
  const [done, setDone] = useState(remaining === 0);

  useEffect(() => {
    if (remaining === 0 || started.current) return;
    started.current = true;
    let cancelled = false;
    (async () => {
      let errors = 0;
      const bad: string[] = [];
      while (!cancelled) {
        try {
          const res = await fetch("/api/etfs/refresh", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ limit: 8 }) });
          if (!res.ok) throw new Error(String(res.status));
          const j: { remaining: number; processed: { ticker: string; ok: boolean }[] } = await res.json();
          for (const p of j.processed) if (!p.ok) bad.push(p.ticker);
          setFailed([...bad]);
          setLeft(j.remaining);
          if (j.processed.length === 0 || j.remaining === 0) break;
          errors = 0;
        } catch {
          errors++;
          if (errors >= 3) break;
          await new Promise((r) => setTimeout(r, 2000));
        }
      }
      if (!cancelled) {
        setDone(true);
        router.refresh();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [remaining, router]);

  if (done && failed.length === 0) return null;
  const pct = total > 0 ? Math.max(0, Math.min(100, Math.round(((total - left) / total) * 100))) : 100;
  return (
    <div className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
      {!done ? (
        <>
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium">Fetching live data from providers… {total - left} / {total} ETFs ready</span>
            <span className="tabular-nums text-xs">{pct}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-indigo-100">
            <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-xs text-indigo-700">Nothing is estimated: rows appear only after real provider data is stored.</p>
        </>
      ) : (
        <span>
          {failed.length} ticker(s) could not be fetched from the provider and are hidden rather than guessed: {failed.join(", ")}.
        </span>
      )}
    </div>
  );
}
