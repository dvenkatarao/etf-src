"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import type { Bar } from "@/lib/technicals";
import { emaSeries } from "@/lib/technicals";
import type { Level } from "@/lib/technicals";

type ChartSeries = { key: string; name: string; color: string; t: number[]; v: number[] };

const RANGES: { key: string; days: number | "ytd" | "max" }[] = [
  { key: "1M", days: 30 },
  { key: "3M", days: 91 },
  { key: "6M", days: 182 },
  { key: "YTD", days: "ytd" },
  { key: "1Y", days: 365 },
  { key: "2Y", days: 365 * 2 },
  { key: "Max", days: "max" },
];

const W = 820;
const PAD = { l: 62, r: 14, t: 12, b: 26 };

function lowerBound(arr: number[], x: number) {
  let lo = 0, hi = arr.length;
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
function smaSeries(closes: number[], n: number): (number | null)[] {
  const out: (number | null)[] = new Array(closes.length).fill(null);
  if (n <= 0) return out;
  let sum = 0;
  for (let i = 0; i < closes.length; i++) {
    sum += closes[i];
    if (i >= n) sum -= closes[i - n];
    if (i >= n - 1) out[i] = sum / n;
  }
  return out;
}

type Props = {
  ticker: string;
  bars: Bar[];
  hi52?: number | null;
  lo52?: number | null;
  supports: Level[];
  resistances: Level[];
  selectedStrike?: number | null;
  onStrikeSelect?: (strike: number) => void;
  onHoverPrice?: (price: number | null) => void;
  hoverPrice?: number | null;
};

type OverlayKey = "sma50" | "sma200" | "ema21" | "ema50" | "ema200";

const OVERLAYS: { key: OverlayKey; label: string; color: string; n: number }[] = [
  { key: "sma50", label: "SMA 50", color: "#f59e0b", n: 50 },
  { key: "sma200", label: "SMA 200", color: "#ef4444", n: 200 },
  { key: "ema21", label: "EMA 21", color: "#8b5cf6", n: 21 },
  { key: "ema50", label: "EMA 50", color: "#06b6d4", n: 50 },
  { key: "ema200", label: "EMA 200", color: "#10b981", n: 200 },
];

export default function WheelPriceChart({ ticker, bars, hi52, lo52, supports, resistances, selectedStrike, onHoverPrice }: Props) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [range, setRange] = useState("1Y");
  const [hover, setHover] = useState<number | null>(null);
  const [showLevels, setShowLevels] = useState(true);
  const [show52w, setShow52w] = useState(true);
  const [overlays, setOverlays] = useState<Record<OverlayKey, boolean>>({
    sma50: true,
    sma200: true,
    ema21: false,
    ema50: false,
    ema200: false,
  });
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const H = 320;

  // Auto-collapse overlays on mobile via CSS not JS, but we handle initial
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) setMobileExpanded(false);
  }, []);

  const closes = useMemo(() => bars.map((b) => b.c), [bars]);
  const times = useMemo(() => bars.map((b) => b.t), [bars]);

  const overlaySeries = useMemo(() => {
    const out: ChartSeries[] = [];
    for (const o of OVERLAYS) {
      if (!overlays[o.key]) continue;
      let vals: (number | null)[] = [];
      if (o.key.startsWith("sma")) vals = smaSeries(closes, o.n);
      else vals = emaSeries(closes, o.n) as (number | null)[];
      const t: number[] = [];
      const v: number[] = [];
      for (let i = 0; i < vals.length; i++) {
        const val = vals[i];
        if (val != null && Number.isFinite(val)) {
          t.push(times[i]);
          v.push(val);
        }
      }
      if (t.length > 1) out.push({ key: o.key, name: o.label, color: o.color, t, v });
    }
    return out;
  }, [closes, times, overlays]);

  const prepared = useMemo(() => {
    const base: ChartSeries = { key: ticker, name: ticker, color: "#059669", t: times, v: closes };
    const all = [base, ...overlaySeries];
    const valid = all.filter((s) => s.t.length > 1);
    if (!valid.length) return null;
    const lastT = Math.max(...valid.map((s) => s.t[s.t.length - 1]));
    const r = RANGES.find((x) => x.key === range) ?? RANGES[4];
    let cutoff = 0;
    if (r.days === "ytd") cutoff = Date.UTC(new Date(lastT * 1000).getUTCFullYear(), 0, 1) / 1000;
    else if (r.days !== "max") cutoff = lastT - (r.days as number) * 86400;
    const starts = valid.map((s) => s.t[Math.min(lowerBound(s.t, cutoff), s.t.length - 1)]);
    const start = Math.max(...starts);
    const cut = valid.map((s) => {
      const i0 = Math.min(lowerBound(s.t, start), s.t.length - 2);
      const t = s.t.slice(i0);
      const v = s.v.slice(i0);
      return { ...s, t, v };
    });
    const allV = cut.flatMap((s) => s.v);
    let min = Math.min(...allV);
    let max = Math.max(...allV);
    // include horizontal levels in min/max if visible
    const levelsInRange: number[] = [];
    if (showLevels) {
      for (const l of [...supports, ...resistances]) levelsInRange.push(l.price);
    }
    if (show52w) {
      if (hi52 != null) levelsInRange.push(hi52);
      if (lo52 != null) levelsInRange.push(lo52);
    }
    if (selectedStrike != null) levelsInRange.push(selectedStrike);
    if (levelsInRange.length) {
      min = Math.min(min, ...levelsInRange);
      max = Math.max(max, ...levelsInRange);
    }
    const padV = (max - min || 1) * 0.08;
    min -= padV;
    max += padV;
    return { cut, baseCut: cut[0], start, end: lastT, min, max };
  }, [times, closes, overlaySeries, range, showLevels, show52w, supports, resistances, hi52, lo52, selectedStrike, ticker]);

  if (!prepared) return <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-8 text-center text-sm text-slate-500">No chart data available.</div>;
  const { cut, start, end, min, max } = prepared;
  const x = (t: number) => PAD.l + ((t - start) / (end - start || 1)) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - (v - min) / (max - min || 1)) * (H - PAD.t - PAD.b);

  const yTicks = Array.from({ length: 5 }, (_, i) => min + ((max - min) * i) / 4);
  const xTicks = Array.from({ length: 5 }, (_, i) => start + ((end - start) * i) / 4);
  const fmtY = (v: number) => v.toLocaleString("en-US", { maximumFractionDigits: v < 10 ? 2 : 0 });

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
    const clamped = Math.min(end, Math.max(start, t));
    setHover(clamped);
    if (onHoverPrice) {
      // find price at hover
      const base = cut[0];
      if (base) {
        const i = Math.min(base.t.length - 1, Math.max(0, lowerBound(base.t, clamped)));
        const j = i > 0 && Math.abs(base.t[i - 1] - clamped) < Math.abs(base.t[i] - clamped) ? i - 1 : i;
        onHoverPrice(base.v[j]);
      }
    }
  };
  const onLeave = () => {
    setHover(null);
    if (onHoverPrice) onHoverPrice(null);
  };

  const hoverRows =
    hover != null
      ? cut.map((s) => {
          const i = Math.min(s.t.length - 1, Math.max(0, lowerBound(s.t, hover)));
          const j = i > 0 && Math.abs(s.t[i - 1] - hover) < Math.abs(s.t[i] - hover) ? i - 1 : i;
          return { s, t: s.t[j], v: s.v[j] };
        })
      : [];

  const toggleOverlay = (k: OverlayKey) => setOverlays((p) => ({ ...p, [k]: !p[k] }));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#0f172a]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Price & key levels</h3>
          <span className="hidden text-xs text-slate-500 dark:text-slate-400 sm:inline">Hover for values · price, MAs, levels</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`rounded-md px-2 py-1 text-xs font-medium transition ${range === r.key ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"}`}
            >
              {r.key}
            </button>
          ))}
        </div>
      </div>

      {/* Overlay toggles */}
      <div className="mb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {OVERLAYS.map((o) => (
            <button
              key={o.key}
              onClick={() => toggleOverlay(o.key)}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 transition ${overlays[o.key] ? "bg-slate-900 text-white ring-slate-900 dark:bg-white dark:text-slate-900 dark:ring-white" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700"}`}
              title={overlays[o.key] ? "Click to hide" : "Click to show"}
            >
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: o.color }} />
              {o.label}
            </button>
          ))}
          <button
            onClick={() => setShowLevels((v) => !v)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${showLevels ? "bg-emerald-600 text-white ring-emerald-600" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700"}`}
          >
            S/R levels
          </button>
          <button
            onClick={() => setShow52w((v) => !v)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${show52w ? "bg-slate-600 text-white ring-slate-600" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700"}`}
          >
            52W H/L
          </button>
          <span className="ml-2 hidden text-xs text-slate-400 sm:inline">{bars.length} bars · {supports.length + resistances.length} S/R levels</span>
        </div>
        {/* Mobile collapse */}
        <div className="mt-2 sm:hidden">
          {!mobileExpanded ? (
            <button onClick={() => setMobileExpanded(true)} className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Show overlays ({overlaySeries.length + (showLevels ? 1 : 0)} active) ▾</button>
          ) : (
            <button onClick={() => setMobileExpanded(false)} className="text-xs font-medium text-slate-500">Hide overlays ▴</button>
          )}
        </div>
      </div>

      <div ref={boxRef} className="relative" onMouseMove={onMove} onMouseLeave={onLeave}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full select-none" role="img" aria-label="Price chart with key levels">
          {/* Grid */}
          {yTicks.map((v, i) => (
            <g key={i}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke={isDark ? "#1e293b" : "#e2e8f0"} strokeDasharray="3 3" />
              <text x={PAD.l - 8} y={y(v) + 4} textAnchor="end" fontSize={11} fill={isDark ? "#94a3b8" : "#64748b"}>
                {fmtY(v)}
              </text>
            </g>
          ))}
          {xTicks.map((t, i) => (
            <text key={i} x={x(t)} y={H - 6} textAnchor={i === 0 ? "start" : i === 4 ? "end" : "middle"} fontSize={11} fill={isDark ? "#94a3b8" : "#64748b"}>
              {fmtDate(t)}
            </text>
          ))}
          {/* Horizontal levels */}
          {showLevels && supports.map((l) => (
            <line key={`s-${l.price}`} x1={PAD.l} x2={W - PAD.r} y1={y(l.price)} y2={y(l.price)} stroke="#10b981" strokeWidth={1} strokeDasharray="6 4" opacity={0.9} />
          ))}
          {showLevels && resistances.map((l) => (
            <line key={`r-${l.price}`} x1={PAD.l} x2={W - PAD.r} y1={y(l.price)} y2={y(l.price)} stroke="#f43f5e" strokeWidth={1} strokeDasharray="6 4" opacity={0.9} />
          ))}
          {show52w && hi52 != null && <line x1={PAD.l} x2={W - PAD.r} y1={y(hi52)} y2={y(hi52)} stroke="#64748b" strokeWidth={1} strokeDasharray="3 3" opacity={0.5} />}
          {show52w && lo52 != null && <line x1={PAD.l} x2={W - PAD.r} y1={y(lo52)} y2={y(lo52)} stroke="#64748b" strokeWidth={1} strokeDasharray="3 3" opacity={0.5} />}
          {selectedStrike != null && <line x1={PAD.l} x2={W - PAD.r} y1={y(selectedStrike)} y2={y(selectedStrike)} stroke="#059669" strokeWidth={1.5} strokeDasharray="8 4" opacity={1} />}
          {/* Price and overlays */}
          {paths.map(({ s, d }) => (
            <polyline key={s.key} points={d} fill="none" stroke={s.color} strokeWidth={s.key === ticker ? 1.8 : 1.4} strokeLinejoin="round" strokeLinecap="round" opacity={s.key === ticker ? 1 : 0.85} />
          ))}
          {hover != null && <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={H - PAD.b} stroke={isDark ? "#475569" : "#94a3b8"} />}
          {hoverRows.map(({ s, t, v }) => (
            <circle key={s.key} cx={x(t)} cy={y(v)} r={3.5} fill={s.color} stroke="#fff" strokeWidth={1.5} />
          ))}
          {/* Level labels on right */}
          {showLevels && [...supports, ...resistances].map((l) => (
            <text key={`lbl-${l.price}`} x={W - PAD.r + 2} y={y(l.price) + 3} fontSize={9} fill={l.kind === "support" ? "#10b981" : "#f43f5e"} fontWeight={600}>
              {l.price.toFixed(0)}
            </text>
          ))}
        </svg>
        {hover != null && hoverRows.length > 0 && (
          <div
            className="pointer-events-none absolute top-2 z-10 min-w-[180px] rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-900/95"
            style={{ left: `${Math.min(78, Math.max(2, (x(hover) / W) * 100 + 1))}%` }}
          >
            <div className="mb-1 font-medium text-slate-700 dark:text-slate-200">{fmtDate(hoverRows[0].t, true)}</div>
            {hoverRows.map(({ s, v }) => (
              <div key={s.key} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full" style={{ background: s.color }} />
                  <span className="text-slate-600 dark:text-slate-300">{s.name}</span>
                </span>
                <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{v.toFixed(2)}</span>
              </div>
            ))}
            {/* Show nearest support/resistance distance */}
            {showLevels && hoverRows[0] && (() => {
              const price = hoverRows[0].v;
              const nearestS = supports.length ? supports.reduce((a, b) => (Math.abs(a.price - price) < Math.abs(b.price - price) ? a : b)) : null;
              const nearestR = resistances.length ? resistances.reduce((a, b) => (Math.abs(a.price - price) < Math.abs(b.price - price) ? a : b)) : null;
              const cand = [nearestS, nearestR].filter(Boolean) as Level[];
              if (!cand.length) return null;
              const nearest = cand.reduce((a, b) => (Math.abs(a.price - price) < Math.abs(b.price - price) ? a : b));
              const dist = ((price - nearest.price) / nearest.price) * 100;
              return <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Nearest {nearest.kind}: {nearest.price.toFixed(2)} ({dist > 0 ? "+" : ""}{dist.toFixed(1)}% away) · {nearest.touches} touches</div>;
            })()}
            {selectedStrike != null && <div className="mt-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Selected put strike: {selectedStrike.toFixed(2)}</div>}
          </div>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
        <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-3 rounded-sm" style={{ background: "#059669" }} /> {ticker} price</span>
        {overlaySeries.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5"><span className="inline-block h-2 w-3 rounded-sm" style={{ background: s.color }} /> {s.name}</span>
        ))}
        {showLevels && supports.length > 0 && <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-3 rounded-sm bg-emerald-500" /> Supports ({supports.length})</span>}
        {showLevels && resistances.length > 0 && <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-3 rounded-sm bg-rose-500" /> Resistances ({resistances.length})</span>}
        {show52w && <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-3 rounded-sm bg-slate-400" /> 52W H/L</span>}
        {selectedStrike != null && <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-3 rounded-sm bg-emerald-500" /> Strike {selectedStrike.toFixed(0)}</span>}
      </div>
      <p className="mt-2 text-[11px] text-slate-500">Daily closes (unadjusted) · S/R = swing pivots ±1.5% · 52W from last year. Hover syncs with puts below.</p>
    </div>
  );
}
