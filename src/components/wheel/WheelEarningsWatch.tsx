import Link from "next/link";
import { dateShort } from "@/lib/format";
import type { WheelResults } from "@/lib/wheel-service";

export default function WheelEarningsWatch({ earningsWatch, q }: { earningsWatch: WheelResults["earningsWatch"]; q: string }) {
  if (!earningsWatch.length) return null;
  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
      <div className="flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-amber-500/20 text-amber-300">⚈</span>
        <h3 className="text-sm font-semibold text-amber-200">Earnings Watch: A/A+ stocks reporting within 3 weeks</h3>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-amber-200/80">
        Premiums on these look rich because the market is pricing in a big move. A report can gap the stock through your strike overnight, so options that expire
        after the report are hidden unless you tick the box above.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {earningsWatch.map((e) => (
          <Link
            key={e.g.row.ticker}
            href={`/wheel/${e.g.row.ticker}?${q}`}
            className="rounded-lg border border-amber-500/20 bg-[#0F1A3A] px-3 py-2 text-xs text-white hover:bg-[#16224A]"
          >
            <span className="font-bold text-amber-300">{e.g.row.ticker}</span>
            <span className="ml-1 text-slate-300">· {e.days}d · {dateShort(e.ctx.nextEarnings)}{e.estimated ? " (est.)" : ""}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
