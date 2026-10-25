"use client";

import { money } from "@/lib/format";

type Pt = { price: number; pnl: number };

export default function PayoffChart({
  points,
  spot,
  breakevens,
  emLow,
  emHigh,
  maxProfit,
  maxLoss,
  profitUnbounded,
  lossUnbounded,
  strikes,
}: {
  points: Pt[];
  spot: number;
  breakevens: number[];
  emLow?: number | null;
  emHigh?: number | null;
  maxProfit?: number | null;
  maxLoss?: number | null;
  profitUnbounded?: boolean;
  lossUnbounded?: boolean;
  strikes?: number[];
}) {
  if (points.length < 2) return null;
  const w = 1000;
  const h = 320;
  const pad = { l: 8, r: 8, t: 10, b: 10 };
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

  const pctX = (v: number) => `${((v - minX) / spanX) * 100}%`;
  const pctY = (v: number) => `${((pad.t + (1 - (v - minY) / spanY) * (h - pad.t - pad.b)) / h) * 100}%`;

  const xMarks = uniqueSorted([minX, maxX, spot, ...(strikes ?? []), ...breakevens]).filter((v) => v >= minX && v <= maxX);

  return (
    <div className="w-full">
      <div className="flex gap-2">
        <div className="flex h-80 w-14 shrink-0 flex-col justify-between py-1 text-right font-mono text-[11px] tabular-nums text-slate-500">
          <span className="text-emerald-600 dark:text-emerald-400">{money(maxY, 0)}</span>
          <span>0</span>
          <span className="text-rose-600 dark:text-rose-400">{money(minY, 0)}</span>
        </div>
        <div className="relative h-80 min-w-0 flex-1">
          <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full" preserveAspectRatio="none" role="img" aria-label="Expiration payoff diagram">
            {emLow != null && emHigh != null && emHigh > emLow && (
              <rect x={x(emLow)} y={pad.t} width={Math.max(0, x(emHigh) - x(emLow))} height={h - pad.t - pad.b} fill="#14b8a6" opacity={0.08} />
            )}
            <line x1={pad.l} y1={zeroY} x2={w - pad.r} y2={zeroY} stroke="#64748b" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            {maxProfit != null && Number.isFinite(maxProfit) && (
              <line x1={pad.l} y1={y(maxProfit)} x2={w - pad.r} y2={y(maxProfit)} stroke="#10b981" strokeWidth="1" strokeDasharray="4 4" opacity={0.7} vectorEffect="non-scaling-stroke" />
            )}
            {maxLoss != null && Number.isFinite(maxLoss) && (
              <line x1={pad.l} y1={y(maxLoss)} x2={w - pad.r} y2={y(maxLoss)} stroke="#f43f5e" strokeWidth="1" strokeDasharray="4 4" opacity={0.7} vectorEffect="non-scaling-stroke" />
            )}
            <polygon points={pos} fill="#10b981" opacity={0.35} />
            <polygon points={neg} fill="#f43f5e" opacity={0.28} />
            <path d={line} fill="none" stroke="#38bdf8" strokeWidth="2.25" vectorEffect="non-scaling-stroke" />
            <line x1={x(spot)} y1={pad.t} x2={x(spot)} y2={h - pad.b} stroke="#e2e8f0" strokeWidth="1.25" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
            {breakevens.map((be) => (
              <g key={be}>
                <line x1={x(be)} y1={pad.t} x2={x(be)} y2={h - pad.b} stroke="#f59e0b" strokeWidth="1.15" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
                <circle cx={x(be)} cy={zeroY} r="4" fill="#f59e0b" />
              </g>
            ))}
            <circle cx={x(spot)} cy={zeroY} r="3.5" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.25" />
          </svg>

          <span className="pointer-events-none absolute left-1 top-[42%] -translate-y-1/2 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
            + Profit
          </span>
          <span className="pointer-events-none absolute left-1 top-[58%] text-[10px] font-semibold uppercase tracking-wide text-rose-600 dark:text-rose-400">
            − Loss
          </span>

          <span
            className="pointer-events-none absolute top-1 -translate-x-1/2 rounded-full bg-white px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-800 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-white dark:ring-slate-600"
            style={{ left: pctX(spot) }}
          >
            Spot {money(spot)}
          </span>
          {breakevens.map((be) => (
            <span
              key={`be-${be}`}
              className="pointer-events-none absolute top-1 -translate-x-1/2 rounded-full bg-amber-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-amber-950 dark:bg-amber-500/20 dark:text-amber-200"
              style={{ left: pctX(be) }}
            >
              BE {money(be)}
            </span>
          ))}
          {maxProfit != null && Number.isFinite(maxProfit) && !profitUnbounded && (
            <span
              className="pointer-events-none absolute right-1 -translate-y-1/2 rounded bg-emerald-500 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white"
              style={{ top: pctY(maxProfit) }}
            >
              Max profit {money(maxProfit, 0)}
            </span>
          )}
          {profitUnbounded && (
            <span className="pointer-events-none absolute right-1 top-2 rounded bg-emerald-500 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white">
              Max profit unlimited
            </span>
          )}
          {maxLoss != null && Number.isFinite(maxLoss) && !lossUnbounded && (
            <span
              className="pointer-events-none absolute right-1 -translate-y-1/2 rounded bg-rose-500 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white"
              style={{ top: pctY(maxLoss) }}
            >
              Max loss {money(maxLoss, 0)}
            </span>
          )}
          {lossUnbounded && (
            <span className="pointer-events-none absolute right-1 bottom-2 rounded bg-rose-500 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white">
              Max loss unlimited
            </span>
          )}
        </div>
      </div>
      <div className="ml-16 mt-1 flex justify-between font-mono text-[11px] tabular-nums text-slate-500">
        {xMarks.length <= 8
          ? xMarks.map((t) => <span key={t}>{money(t, t >= 100 ? 0 : 2)}</span>)
          : [minX, (minX + maxX) / 2, maxX].map((t) => (
              <span key={t}>{money(t, t >= 100 ? 0 : 2)}</span>
            ))}
      </div>
    </div>
  );
}

function uniqueSorted(xs: number[]): number[] {
  return [...new Set(xs.map((x) => Math.round(x * 100) / 100))].sort((a, b) => a - b);
}
