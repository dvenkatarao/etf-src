import MarketTickerBar, { type TapeItem } from "@/components/MarketTickerBar";
import Nav from "@/components/Nav";
import type { RegimeChipData } from "@/components/RegimeChip";
import { getQuotes } from "@/lib/etf-service";
import { getFomcCalendar, getMacroSnapshot, getPolicyRates, getYieldCurve } from "@/lib/macro";
import { deriveRegime } from "@/lib/macro-regime";

const TAPE: { symbol: string; ticker: string; kind: TapeItem["kind"] }[] = [
  { symbol: "SPY", ticker: "SPY", kind: "index" },
  { symbol: "QQQ", ticker: "QQQ", kind: "index" },
  { symbol: "^VIX", ticker: "VIX", kind: "vol" },
  { symbol: "SCHD", ticker: "SCHD", kind: "index" },
];

export default async function AppChrome() {
  let items: TapeItem[] = TAPE.map((t) => ({ ticker: t.ticker, price: null, changePct: null, kind: t.kind }));
  let regime: RegimeChipData | null = null;
  let nextFomcDays: number | null = null;

  try {
    const [idx, snap, curve, policy, fomc] = await Promise.all([
      getQuotes(TAPE.map((t) => t.symbol)),
      getMacroSnapshot(),
      getYieldCurve(),
      getPolicyRates(),
      getFomcCalendar(),
    ]);
    items = TAPE.map((t) => {
      const q = idx.quotes.get(t.symbol);
      return { ticker: t.ticker, price: q?.price ?? null, changePct: q?.changePct ?? null, kind: t.kind };
    });
    const dgs = snap?.data?.find((p) => p.def.id === "DGS10");
    if (dgs) {
      const prev = dgs.history.length >= 2 ? dgs.history[dgs.history.length - 2]?.value : null;
      const chg = dgs.latest != null && prev != null && prev !== 0 ? ((dgs.latest - prev) / prev) * 100 : null;
      items.splice(3, 0, { ticker: "US10Y", price: dgs.latest, changePct: chg, kind: "rate" });
    }
    const r = deriveRegime({ snap: snap?.data ?? null, curve: curve?.data ?? null, policy: policy?.data ?? null });
    if (r) regime = { title: r.title, summary: r.summary, asOf: r.asOf, label: r.label };
    const today = new Date().toISOString().slice(0, 10);
    const next = fomc?.data.find((m) => m.end >= today);
    if (next) {
      nextFomcDays = Math.round((Date.parse(next.start + "T12:00:00Z") - Date.now()) / 86_400_000);
    }
  } catch {
    /* tape still renders with N/A */
  }

  return (
    <>
      <MarketTickerBar items={items} nextFomcDays={nextFomcDays} />
      <Nav regime={regime} />
    </>
  );
}
