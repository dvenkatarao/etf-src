"use client";

import { useMemo, useRef, useState } from "react";

export type ChartSeries = { key: string; name: string; color: string; t: number[]; v: number[] };

const RANGES: { key: string; days: number | "ytd" | "max" }[] = [
  { key: "1M", days: 30 },
  { key: "3M", days: 91 },
  { key: "6M", days: 182 },
  { key: "YTD", days: "ytd" },
  { key: "1Y", days: 365 },
  { key: "3Y", days: 365 * 3 },
  { key: "5Y", days: 365 * 5 },
  { key: "10Y", days: 365 * 10 },
  { key: "Max", days: "max" },
];

const W = 820;
const PAD = { l: 62, r: 14, t: 12, b: 26 };

function lowerBound(arr: number[], x: number) {
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] < x) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

function fmtDate(ts: number, long = false) {
  return new Date(ts * 1000).toLocaleDateString("en-US", long ? { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" } : { month: "short", year: "2-digit", timeZone: "UTC" });
}

export default function LineChart({
  series,
  mode,
  defaultRange = "1Y",
  height = 320,
  label,
}: {
  series: ChartSeries[];
  mode: "growth" | "price";
  defaultRange?: string;
  height?: number;
  label?: string;
}) {
  const [range, setRange] = useState(defaultRange);
  const [hover, setHover] = useState<number | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const H = height;

  const prepared = useMemo(() => {
    const valid = series.filter((s) => s.t.length > 1);
    if (!valid.length) return null;
    const lastT = Math.max(...valid.map((s) => s.t[s.t.length - 1]));
    const r = RANGES.find((x) => x.key === range) ?? RANGES[4];
    let cutoff = 0;
    if (r.days === "ytd") cutoff = Date.UTC(new Date(lastT * 1000).getUTCFullYear(), 0, 1) / 1000;
    else if (r.days !== "max") cutoff = lastT - r.days * 86400;
    // common start so that curves are comparable
    const starts = valid.map((s) => s.t[Math.min(lowerBound(s.t, cutoff), s.t.length - 1)]);
    const start = Math.max(...starts);
    const cut = valid.map((s) => {
      const i0 = Math.min(lowerBound(s.t, start), s.t.length - 2);
      const t = s.t.slice(i0);
      const raw = s.v.slice(i0);
      const base = raw[0];
      const v = mode === "growth" ? raw.map((x) => (x / base) * 10000) : raw;
      return { ...s, t, v };
    });
    const allV = cut.flatMap((s) => s.v);
    let min = Math.min(...allV);
    let max = Math.max(...allV);
    const padV = (max - min || 1) * 0.06;
    min -= padV;
    max += padV;
    return { cut, start, end: lastT, min, max };
  }, [series, range, mode]);

  if (!prepared) return <div className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">No chart data available.</div>;
  const { cut, start, end, min, max } = prepared;
  const x = (t: number) => PAD.l + ((t - start) / (end - start || 1)) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - (v - min) / (max - min || 1)) * (H - PAD.t - PAD.b);

  const yTicks = Array.from({ length: 5 }, (_, i) => min + ((max - min) * i) / 4);
  const xTicks = Array.from({ length: 5 }, (_, i) => start + ((end - start) * i) / 4);
  const fmtY = (v: number) => (mode === "growth" ? `$${Math.round(v).toLocaleString("en-US")}` : v.toLocaleString("en-US", { maximumFractionDigits: v < 10 ? 2 : 0 }));

  const paths = cut.map((s) => {
    const stride = Math.max(1, Math.floor(s.t.length / 700));
    const pts: string[] = [];
    for (let i = 0; i < s.t.length; i += stride) pts.push(`${x(s.t[i]).toFixed(1)},${y(s.v[i]).toFixed(1)}`);
    const li = s.t.length - 1;
    if ((li % stride) !== 0) pts.push(`${x(s.t[li]).toFixed(1)},${y(s.v[li]).toFixed(1)}`);
    return { s, d: pts.join(" ") };
  });

  const onMove = (e: React.MouseEvent) => {
    const rect = boxRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const t = start + ((px - PAD.l) / (W - PAD.l - PAD.r)) * (end - start);
    setHover(Math.min(end, Math.max(start, t)));
  };

  const hoverRows =
    hover != null
      ? cut.map((s) => {
          const i = Math.min(s.t.length - 1, Math.max(0, lowerBound(s.t, hover)));
          const j = i > 0 && Math.abs(s.t[i - 1] - hover) < Math.abs(s.t[i] - hover) ? i - 1 : i;
          return { s, t: s.t[j], v: s.v[j] };
        })
      : [];

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-slate-500">{label ?? (mode === "growth" ? "Growth of $10,000 (total return, distributions reinvested)" : "Price (split-adjusted close)")}</div>
        <div className="flex flex-wrap gap-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`rounded-md px-2 py-1 text-xs font-medium transition ${range === r.key ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {r.key}
            </button>
          ))}
        </div>
      </div>
      <div ref={boxRef} className="relative" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none" role="img" aria-label="Line chart">
          {yTicks.map((v, i) => (
            <g key={i}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke="#e2e8f0" strokeDasharray="3 3" />
              <text x={PAD.l - 8} y={y(v) + 4} textAnchor="end" fontSize={11} fill="#64748b">
                {fmtY(v)}
              </text>
            </g>
          ))}
          {xTicks.map((t, i) => (
            <text key={i} x={x(t)} y={H - 6} textAnchor={i === 0 ? "start" : i === 4 ? "end" : "middle"} fontSize={11} fill="#64748b">
              {fmtDate(t)}
            </text>
          ))}
          {paths.map(({ s, d }) => (
            <polyline key={s.key} points={d} fill="none" stroke={s.color} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" />
          ))}
          {hover != null && <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={H - PAD.b} stroke="#94a3b8" />}
          {hoverRows.map(({ s, t, v }) => (
            <circle key={s.key} cx={x(t)} cy={y(v)} r={3.5} fill={s.color} stroke="#fff" strokeWidth={1.5} />
          ))}
        </svg>
        {hover != null && hoverRows.length > 0 && (
          <div
            className="pointer-events-none absolute top-2 z-10 min-w-[150px] rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-lg"
            style={{ left: `${Math.min(78, Math.max(2, (x(hover) / W) * 100 + 1))}%` }}
          >
            <div className="mb-1 font-medium text-slate-700">{fmtDate(hoverRows[0].t, true)}</div>
            {hoverRows.map(({ s, v }) => (
              <div key={s.key} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full" style={{ background: s.color }} />
                  {s.name}
                </span>
                <span className="font-semibold tabular-nums">{mode === "growth" ? `$${Math.round(v).toLocaleString("en-US")}` : v.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {cut.length > 1 && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {cut.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-3 rounded-sm" style={{ background: s.color }} />
              {s.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
