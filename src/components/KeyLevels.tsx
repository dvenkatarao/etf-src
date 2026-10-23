import { Card } from "@/components/ui";
import { money, num, pct } from "@/lib/format";
import { rsiState, type Technicals } from "@/lib/technicals";

const tone = { good: "text-emerald-700", warn: "text-amber-700", bad: "text-rose-700", neutral: "text-slate-600" } as const;

function Line({ label, value, note, cls = "text-slate-600" }: { label: string; value: string; note?: string; cls?: string }) {
  return (
    <tr className="border-t border-slate-100 first:border-0">
      <td className="py-1.5 pr-3 text-slate-600">{label}</td>
      <td className="py-1.5 pr-3 text-right font-medium tabular-nums text-slate-900">{value}</td>
      <td className={`py-1.5 text-xs ${cls}`}>{note}</td>
    </tr>
  );
}

const rel = (price: number, level: number | null) => (level == null ? undefined : price >= level ? `price is ${pct((price - level) / level, 1)} above` : `price is ${pct((level - price) / level, 1)} below`);

export default function KeyLevels({ t, livePrice }: { t: Technicals; livePrice?: number | null }) {
  const p = livePrice ?? t.price;
  const r = rsiState(t.rsi14);
  const m = t.macd;
  return (
    <Card title="Key levels & indicators" subtitle={`Computed from daily bars through ${t.asOf}. States, not predictions.`}>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Trend</h4>
          <table className="w-full text-sm">
            <tbody>
              <Line label="50-day average (SMA)" value={money(t.sma50)} note={rel(p, t.sma50)} />
              <Line label="200-day average (SMA)" value={money(t.sma200)} note={rel(p, t.sma200)} cls={t.aboveSma200 === false ? "text-rose-700" : "text-emerald-700"} />
              <Line label="EMA 21 / 50 / 200" value={`${num(t.ema21)} / ${num(t.ema50)} / ${num(t.ema200)}`} />
              <Line label="50 vs 200-day" value={t.maCross === "golden" ? "50 above 200" : t.maCross === "death" ? "50 below 200" : "n/a"} note={t.maCross === "death" ? "longer-term downtrend: wheel puts are riskier here" : undefined} cls="text-amber-700" />
              <Line label="52-week high / low" value={`${money(t.hi52)} / ${money(t.lo52)}`} note={t.offHigh != null ? `${pct(t.offHigh, 1)} below the high` : undefined} />
            </tbody>
          </table>
          <h4 className="mb-1 mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Volume-weighted levels (daily bars)</h4>
          <table className="w-full text-sm">
            <tbody>
              <Line label="VWMA 20 / 50 days" value={`${num(t.vwma20)} / ${num(t.vwma50)}`} note="average price weighted by volume" />
              <Line label="VWAP since Jan 1" value={money(t.vwapYtd)} note={rel(p, t.vwapYtd)} />
              <Line label="VWAP since 52-week low" value={money(t.vwapFrom52wLow)} note={rel(p, t.vwapFrom52wLow)} />
            </tbody>
          </table>
          <p className="mt-1 text-[11px] text-slate-400">VWAP here is anchored on daily bars (typical price × volume), not the intraday session VWAP.</p>
        </div>
        <div>
          <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Momentum & volatility</h4>
          <table className="w-full text-sm">
            <tbody>
              <Line label="RSI (14)" value={num(t.rsi14, 1)} note={r.label} cls={tone[r.tone]} />
              <Line label="MACD (12,26,9)" value={m ? num(m.hist, 2) : "n/a"} note={m ? `${m.state}${m.crossed ? `, just crossed ${m.crossed}` : ""}` : undefined} cls={m?.state === "bullish" ? "text-emerald-700" : "text-rose-700"} />
              <Line label="Bollinger %B (20,2)" value={t.boll ? num(t.boll.pctB, 2) : "n/a"} note={t.boll ? (t.boll.pctB > 1 ? "above the upper band" : t.boll.pctB < 0 ? "below the lower band" : t.boll.pctB > 0.8 ? "near the upper band" : t.boll.pctB < 0.2 ? "near the lower band" : "inside the bands") : undefined} />
              <Line label="ATR (14)" value={money(t.atr14)} note={t.atrPct != null ? `typical daily range ≈ ${pct(t.atrPct, 1)} of price` : undefined} />
              <Line label="30-day realized volatility" value={t.hv30 != null ? pct(t.hv30, 1) : "n/a"} note="compare with the option's implied volatility" />
              <Line label="Worst 1-year fall" value={t.dd1y != null ? pct(t.dd1y, 1) : "n/a"} />
            </tbody>
          </table>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Support (below price)</h4>
              {t.supports.length ? t.supports.map((l) => (
                <div key={l.price} className="flex justify-between text-sm"><span className="font-medium tabular-nums text-emerald-700">{money(l.price)}</span><span className="text-xs text-slate-500">{l.touches} touches · {pct(Math.abs((l.price - p) / p), 1)} below</span></div>
              )) : <p className="text-xs text-slate-400">No clear level found.</p>}
            </div>
            <div>
              <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Resistance (above price)</h4>
              {t.resistances.length ? t.resistances.map((l) => (
                <div key={l.price} className="flex justify-between text-sm"><span className="font-medium tabular-nums text-rose-700">{money(l.price)}</span><span className="text-xs text-slate-500">{l.touches} touches · {pct(Math.abs((l.price - p) / p), 1)} above</span></div>
              )) : <p className="text-xs text-slate-400">No clear level found.</p>}
            </div>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Levels are swing highs/lows from the past year that were tested at least twice (within 1.5% of each other).</p>
        </div>
      </div>
    </Card>
  );
}
