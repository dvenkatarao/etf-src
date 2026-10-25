"use client";

import { money } from "@/lib/format";

type Pt = { price: number; pnl: number };

export default function PayoffChart({
  points,
  spot,
  breakevens,
  emLow,
  emHigh,
}: {
  points: Pt[];
  spot: number;
  breakevens: number[];
  emLow?: number | null;
  emHigh?: number | null;
}) {
  if (points.length < 2) return null;
  const w = 800;
  const h = 240;
  const pad = { l: 2, r: 2, t: 6, b: 6 };
  const xs = points.map((p) => p.price);
  const ys = points.map((p) => p.pnl);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(0, ...ys);
  const maxY = Math.max(0, ...ys);
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;
  const x = (v: number) => pad.l + ((v - minX) / spanX) * (w - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - (v - minY) / spanY) * (h - pad.t - pad.b);
  const zeroY = y(0);
  const line = points.map((p, i) => `${i ? "L" : "M"} ${x(p.price).toFixed(1)} ${y(p.pnl).toFixed(1)}`).join(" ");
  const pos =
    `${x(points[0].price).toFixed(1)} ${zeroY.toFixed(1)} ` +
    points.map((p) => `${x(p.price).toFixed(1)} ${Math.min(y(p.pnl), zeroY).toFixed(1)}`).join(" ") +
    ` ${x(points[points.length - 1].price).toFixed(1)} ${zeroY.toFixed(1)}`;
  const neg =
    `${x(points[0].price).toFixed(1)} ${zeroY.toFixed(1)} ` +
    points.map((p) => `${x(p.price).toFixed(1)} ${Math.max(y(p.pnl), zeroY).toFixed(1)}`).join(" ") +
    ` ${x(points[points.length - 1].price).toFixed(1)} ${zeroY.toFixed(1)}`;
  const ticks = [minX, (minX + maxX) / 2, maxX];
  const spotPct = ((spot - minX) / spanX) * 100;

  return (
    <div className="w-full">
      <div className="flex gap-2">
        <div className="flex h-60 w-14 shrink-0 flex-col justify-between py-1 text-right font-mono text-[11px] tabular-nums text-slate-500">
          <span>{money(maxY, 0)}</span>
          <span>{money(minY, 0)}</span>
        </div>
        <div className="relative h-60 min-w-0 flex-1">
          <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full text-slate-600 dark:text-slate-300" preserveAspectRatio="none" role="img" aria-label="Expiration payoff diagram">
            {emLow != null && emHigh != null && emHigh > emLow && (
              <rect x={x(emLow)} y={pad.t} width={Math.max(0, x(emHigh) - x(emLow))} height={h - pad.t - pad.b} fill="#14b8a6" opacity={0.12} />
            )}
            <line x1={pad.l} y1={zeroY} x2={w - pad.r} y2={zeroY} stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity={0.45} />
            <polygon points={pos} fill="#10b981" opacity={0.28} />
            <polygon points={neg} fill="#f43f5e" opacity={0.28} />
            <path d={line} fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            <line x1={x(spot)} y1={pad.t} x2={x(spot)} y2={h - pad.b} stroke="#f59e0b" strokeWidth="1.25" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
            {breakevens.map((be) => (
              <circle key={be} cx={x(be)} cy={zeroY} r="3.5" fill="#f59e0b" />
            ))}
          </svg>
          <span
            className="pointer-events-none absolute top-0.5 -translate-x-1/2 rounded bg-amber-100 px-1 py-px font-mono text-[10px] font-medium text-amber-900 dark:bg-amber-500/20 dark:text-amber-200"
            style={{ left: `${spotPct}%` }}
          >
            Spot
          </span>
        </div>
      </div>
      <div className="ml-16 flex justify-between font-mono text-[11px] tabular-nums text-slate-500">
        {ticks.map((t) => (
          <span key={t}>{money(t, t >= 100 ? 0 : 2)}</span>
        ))}
      </div>
    </div>
  );
}
