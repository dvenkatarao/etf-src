import { iso } from "@/lib/metrics";

/** Server-rendered bar chart of per-share distributions (ex-date → amount). */
export function DistributionBars({ data, max = 24 }: { data: [number, number][]; max?: number }) {
  const rows = data.slice(-max);
  if (!rows.length) return <div className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">No distributions recorded in the provider history.</div>;
  const W = 720;
  const H = 150;
  const top = Math.max(...rows.map((r) => r[1]));
  const bw = (W - 20) / rows.length;
  return (
    <svg viewBox={`0 0 ${W} ${H + 22}`} className="w-full" role="img" aria-label="Distribution history">
      {rows.map(([t, a], i) => {
        const h = (a / top) * (H - 18);
        return (
          <g key={t}>
            <rect x={10 + i * bw + 1.5} y={H - h} width={Math.max(2, bw - 3)} height={h} rx={2} fill="#6366f1" opacity={0.85}>
              <title>{`${iso(t)}: $${a.toFixed(4)} per share`}</title>
            </rect>
            {(i === 0 || i === rows.length - 1 || i % Math.ceil(rows.length / 6) === 0) && (
              <text x={10 + i * bw + bw / 2} y={H + 14} textAnchor="middle" fontSize={10} fill="#64748b">
                {iso(t).slice(2, 7)}
              </text>
            )}
          </g>
        );
      })}
      <text x={10} y={10} fontSize={10} fill="#64748b">
        max ${top.toFixed(3)}
      </text>
    </svg>
  );
}

export function YieldCurveChart({ points }: { points: { label: string; years: number; now: number | null; yearAgo: number | null }[] }) {
  const W = 640;
  const H = 240;
  const P = { l: 44, r: 16, t: 14, b: 28 };
  const vals = points.flatMap((p) => [p.now, p.yearAgo]).filter((v): v is number => v != null);
  if (!vals.length) return null;
  const min = Math.floor(Math.min(...vals) * 2) / 2 - 0.25;
  const max = Math.ceil(Math.max(...vals) * 2) / 2 + 0.25;
  // evenly spaced categories read better than true-maturity spacing for 1M..30Y
  const x = (i: number) => P.l + (i / (points.length - 1)) * (W - P.l - P.r);
  const y = (v: number) => P.t + (1 - (v - min) / (max - min)) * (H - P.t - P.b);
  const line = (key: "now" | "yearAgo") =>
    points
      .map((p, i) => (p[key] == null ? null : `${x(i).toFixed(1)},${y(p[key]!).toFixed(1)}`))
      .filter(Boolean)
      .join(" ");
  const ticks = Array.from({ length: 5 }, (_, i) => min + ((max - min) * i) / 4);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="US Treasury yield curve">
      {ticks.map((v, i) => (
        <g key={i}>
          <line x1={P.l} x2={W - P.r} y1={y(v)} y2={y(v)} stroke="#e2e8f0" strokeDasharray="3 3" />
          <text x={P.l - 6} y={y(v) + 4} textAnchor="end" fontSize={10} fill="#64748b">
            {v.toFixed(2)}%
          </text>
        </g>
      ))}
      {points.map((p, i) => (
        <text key={p.label} x={x(i)} y={H - 8} textAnchor="middle" fontSize={10} fill="#64748b">
          {p.label}
        </text>
      ))}
      <polyline points={line("yearAgo")} fill="none" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 4" />
      <polyline points={line("now")} fill="none" stroke="#059669" strokeWidth={2.4} />
      {points.map((p, i) => p.now != null && <circle key={p.label} cx={x(i)} cy={y(p.now)} r={3} fill="#059669"><title>{`${p.label}: ${p.now}%`}</title></circle>)}
    </svg>
  );
}
