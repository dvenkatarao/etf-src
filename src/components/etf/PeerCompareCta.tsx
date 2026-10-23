import Link from "next/link";

export type Peer = { ticker: string; name: string | null; category: string | null; expense: number | null; yieldTtm: number | null };

export default function PeerCompareCta({ ticker, peers }: { ticker: string; peers: Peer[] }) {
  if (!peers.length) return null;
  const tickers = [ticker, ...peers.map((p) => p.ticker)].slice(0, 5).join(",");
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">Peers in this category</h3>
      <p className="mt-1 text-xs text-slate-500">Same category / asset class, sorted by quality + size. Tap to compare head-to-head.</p>
      <ul className="mt-3 divide-y divide-slate-100 text-sm">
        {peers.slice(0, 4).map((p) => (
          <li key={p.ticker} className="flex items-center justify-between py-2">
            <div>
              <Link href={`/etf/${p.ticker}`} className="font-semibold text-indigo-700 hover:underline">{p.ticker}</Link>
              <span className="ml-2 text-xs text-slate-500 truncate max-w-[160px] inline-block align-middle">{p.name ?? ""}</span>
            </div>
            <span className="text-xs tabular-nums text-slate-600">{p.expense != null ? `${(p.expense * 100).toFixed(2)}%` : "—"} · {p.yieldTtm != null ? `${(p.yieldTtm * 100).toFixed(2)}%` : "—"}</span>
          </li>
        ))}
      </ul>
      <Link href={`/compare?t=${tickers}`} className="mt-3 inline-flex rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500">Compare {tickers.split(",").length} together →</Link>
      <p className="mt-2 text-[11px] text-slate-400">Comparison uses price history + holdings; no fee to compare.</p>
    </div>
  );
}
