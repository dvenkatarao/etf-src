import MarketTickerBar, { type TapeItem } from "@/components/MarketTickerBar";
import Nav from "@/components/Nav";
import { getQuotes } from "@/lib/etf-service";
import { getFomcCalendar, getMacroSnapshot, getPolicyRates, getYieldCurve } from "@/lib/macro";
import { deriveRegime } from "@/lib/macro-regime";
import { MARKET_INDEXES } from "@/lib/universe";

const SHORT: Record<string, { ticker: string; kind: "index" | "vol" }> = {
  "^GSPC": { ticker: "SPX", kind: "index" },
  "^DJI": { ticker: "DJI", kind: "index" },
  "^IXIC": { ticker: "COMP", kind: "index" },
  "^RUT": { ticker: "RUT", kind: "index" },
  "^VIX": { ticker: "VIX", kind: "vol" },
};

export default async function AppChrome() {
  let items: TapeItem[] = MARKET_INDEXES.map((i) => ({
    ticker: SHORT[i.symbol]?.ticker ?? i.label,
    price: null,
    changePct: null,
    kind: SHORT[i.symbol]?.kind ?? "index",
  }));
  let regimeTitle: string | null = null;
  let nextFomcDays: number | null = null;

  try {
    const [idx, snap, curve, policy, fomc] = await Promise.all([
      getQuotes(MARKET_INDEXES.map((i) => i.symbol)),
      getMacroSnapshot(),
      getYieldCurve(),
      getPolicyRates(),
      getFomcCalendar(),
    ]);
    items = MARKET_INDEXES.map((i) => {
      const q = idx.quotes.get(i.symbol);
      const meta = SHORT[i.symbol];
      return {
        ticker: meta?.ticker ?? i.label,
        price: q?.price ?? null,
        changePct: q?.changePct ?? null,
        kind: meta?.kind ?? "index",
      };
    });
    const regime = deriveRegime({ snap: snap?.data ?? null, curve: curve?.data ?? null, policy: policy?.data ?? null });
    regimeTitle = regime?.title ?? null;
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
      <Nav regimeTitle={regimeTitle} />
    </>
  );
}
