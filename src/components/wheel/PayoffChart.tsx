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
  const w = 640;
  const h = 260;
  const pad = { l: 52, r: 16, t: 16, b: 36 };
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
  const pos = `${x(points[0].price).toFixed(1)} ${zeroY.toFixed(1)} ` + points.map((p) => `${x(p.price).toFixed(1)} ${Math.min(y(p.pnl), zeroY).toFixed(1)}`).join(" ") + ` ${x(points[points.length - 1].price).toFixed(1)} ${zeroY.toFixed(1)}`;
  const neg = `${x(points[0].price).toFixed(1)} ${zeroY.toFixed(1)} ` + points.map((p) => `${x(p.price).toFixed(1)} ${Math.max(y(p.pnl), zeroY).toFixed(1)}`).join(" ") + ` ${x(points[points.length - 1].price).toFixed(1)} ${zeroY.toFixed(1)}`;
  const ticks = [minX, (minX + maxX) / 2, maxX];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full" role="img" aria-label="Expiration payoff diagram">
      <rect x="0" y="0" width={w} height={h} fill="transparent" />
      {emLow != null && emHigh != null && emHigh > emLow && (
        <rect x={x(emLow)} y={pad.t} width={Math.max(0, x(emHigh) - x(emLow))} height={h - pad.t - pad.b} fill="#2dd4bf" opacity={0.08} />
      )}
      <line x1={pad.l} y1={zeroY} x2={w - pad.r} y2={zeroY} stroke="#64748b" strokeWidth="1" strokeDasharray="4 4" />
      <polygon points={pos} fill="#10b981" opacity={0.28} />
      <polygon points={neg} fill="#f43f5e" opacity={0.28} />
      <path d={line} fill="none" stroke="#e2e8f0" strokeWidth="2" />
      <line x1={x(spot)} y1={pad.t} x2={x(spot)} y2={h - pad.b} stroke="#fbbf24" strokeWidth="1.25" strokeDasharray="3 3" />
      {breakevens.map((be) => (
        <circle key={be} cx={x(be)} cy={zeroY} r="4" fill="#fbbf24" />
      ))}
      {ticks.map((t) => (
        <text key={t} x={x(t)} y={h - 10} textAnchor="middle" fill="#94a3b8" fontSize="10">
          {money(t, t >= 100 ? 0 : 2)}
        </text>
      ))}
      <text x={pad.l - 6} y={y(maxY) + 4} textAnchor="end" fill="#94a3b8" fontSize="10">
        {money(maxY, 0)}
      </text>
      <text x={pad.l - 6} y={y(minY) + 4} textAnchor="end" fill="#94a3b8" fontSize="10">
        {money(minY, 0)}
      </text>
      <text x={x(spot)} y={pad.t + 12} textAnchor="middle" fill="#fbbf24" fontSize="10">
        Spot
      </text>
    </svg>
  );
}
