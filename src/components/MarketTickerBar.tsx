import { usCashSession } from "@/lib/market-session";

export type TapeItem = {
  ticker: string;
  price: number | null;
  changePct: number | null;
  kind?: "index" | "vol";
};

export default function MarketTickerBar({
  items,
  nextFomcDays,
}: {
  items: TapeItem[];
  nextFomcDays?: number | null;
}) {
  const s = usCashSession(new Date());
  const open = s.session === "open";

  return (
    <div className="border-b border-slate-800 bg-slate-900/90 text-xs text-slate-300 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-6 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8">
        <div className="flex shrink-0 items-center gap-1.5 border-r border-slate-700/60 pr-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          <span className={`h-2 w-2 rounded-full ${open ? "bg-emerald-500" : "bg-slate-500"}`} />
          <span>US markets</span>
          <span className="font-normal normal-case tracking-normal text-slate-500">· delayed</span>
        </div>

        <div className="flex min-w-max items-center gap-6">
          {items.map((item) => {
            const up = item.changePct != null && item.changePct > 0;
            const down = item.changePct != null && item.changePct < 0;
            return (
              <div key={item.ticker} className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-200">{item.ticker}</span>
                <span className="font-mono text-slate-400">
                  {item.price == null ? "N/A" : item.kind === "vol" ? item.price.toFixed(2) : item.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span
                  className={`rounded px-1.5 py-0.5 font-mono text-[11px] font-medium ${
                    up
                      ? "border border-emerald-800/40 bg-emerald-950/60 text-emerald-400"
                      : down
                        ? "border border-rose-800/40 bg-rose-950/60 text-rose-400"
                        : "border border-slate-700 bg-slate-800/60 text-slate-400"
                  }`}
                >
                  {item.changePct == null ? "—" : `${item.changePct > 0 ? "+" : ""}${item.changePct.toFixed(2)}%`}
                </span>
              </div>
            );
          })}
        </div>

        <div className="ml-auto hidden shrink-0 items-center gap-3 border-l border-slate-800 pl-4 text-slate-400 lg:flex">
          <span className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${open ? "bg-emerald-500" : s.session === "closed" ? "bg-slate-500" : "bg-amber-400"}`} />
            NYSE/NASDAQ: <strong className="font-normal text-slate-200">{s.label}</strong>
          </span>
          {nextFomcDays != null && (
            <span className="text-[11px] text-slate-500">
              Next FOMC: {nextFomcDays <= 0 ? "today" : `${nextFomcDays}d`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
