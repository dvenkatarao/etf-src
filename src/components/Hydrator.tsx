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
    <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
      {!done ? (
        <>
          <span className="h-1 w-32 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <span className="block h-full rounded-full bg-teal-500" style={{ width: `${pct}%` }} />
          </span>
          <span>Updating {total - left} of {total} funds…</span>
        </>
      ) : (
        <span className="text-amber-700 dark:text-amber-300">
          {failed.length} ticker(s) could not be fetched and are hidden rather than guessed: {failed.join(", ")}.
        </span>
      )}
    </div>
  );
}
