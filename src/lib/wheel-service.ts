import { eq } from "drizzle-orm";
import { db } from "@/db";
import { wheelScans } from "@/db/schema";
import { getOptionChain } from "./options-providers";
import { isUsMarketHours } from "./spread";
import { mapLimit } from "./http";
import { getAllStocks, gradeStock, refreshStockBatch, staleStocks, type GradedStock } from "./stock-service";
import { stockGradeRank, type StockGrade } from "./stock-quality";
import { yahooQuotes } from "./yahoo";
import { DEFAULT_PARAMS, daysBetween, scanPuts, type OptionContract, type PutCandidate, type RejectReason, type StockCtx, type WheelParams } from "./wheel";

/** Chains are scanned only for stocks graded at least this well. */
export const SCAN_MIN_GRADE: StockGrade = "A";
const SCAN_TTL_MARKET_MS = 20 * 60 * 1000;
const SCAN_TTL_CLOSED_MS = 4 * 60 * 60 * 1000;
/** Loose window stored per stock; the page applies the user's own (tighter) filters on top. */
const SCAN_DTE_MIN = 7;
const SCAN_DTE_MAX = 70;

export const todayIso = () => new Date().toISOString().slice(0, 10);

export function stockCtx(g: GradedStock, price: number | null): StockCtx | null {
  const p = price ?? g.row.price;
  const t = g.row.technicals;
  if (p == null || !t) return null;
  const ev = g.row.events;
  return {
    ticker: g.row.ticker,
    price: p,
    nextEarnings: ev?.nextEarnings ?? null,
    earningsEstimated: ev?.earningsEstimated ?? false,
    exDividend: ev?.exDividend ?? null,
    dividendPerShare: ev?.dividendPerShare ?? null,
    dividendYield: ev?.dividendYield ?? null,
    beta: g.row.fundamentals?.beta ?? null,
    hv30: t.hv30,
    sma200: t.sma200,
    supports: t.supports.map((l) => l.price),
  };
}

export function scanIsStale(scannedAt: Date | null | undefined, now = new Date()): boolean {
  if (!scannedAt) return true;
  return now.getTime() - scannedAt.getTime() > (isUsMarketHours(now) ? SCAN_TTL_MARKET_MS : SCAN_TTL_CLOSED_MS);
}

async function scanOne(g: GradedStock, price: number | null) {
  const ticker = g.row.ticker;
  const p = price ?? g.row.price;
  try {
    if (p == null) throw new Error("no price");
    const r = await getOptionChain({ symbol: ticker, type: "put", price: p, dteMin: SCAN_DTE_MIN, dteMax: SCAN_DTE_MAX, divYield: g.row.events?.dividendYield ?? 0 });
    const contracts = r.contracts.filter((c) => c.delta != null && Math.abs(c.delta) <= 0.5 && (c.bid ?? 0) > 0);
    const row = { ticker, scannedAt: new Date(), source: r.source, fallbackReason: r.fallbackReason, price: p, contracts, error: null };
    await db.insert(wheelScans).values(row).onConflictDoUpdate({ target: wheelScans.ticker, set: row });
    return { ticker, ok: true as const };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    // Clear old contracts on failure: showing stale quotes as current would be misleading. Retried after the TTL.
    const row = { ticker, scannedAt: new Date(), source: null, fallbackReason: null, price: p, contracts: null, error };
    await db.insert(wheelScans).values(row).onConflictDoUpdate({ target: wheelScans.ticker, set: row });
    return { ticker, ok: false as const, error };
  }
}

async function eligibleStocks(): Promise<GradedStock[]> {
  return (await getAllStocks())
    .map(gradeStock)
    .filter((g) => g.grade != null && stockGradeRank(g.grade) <= stockGradeRank(SCAN_MIN_GRADE));
}

export async function staleScanTickers(): Promise<GradedStock[]> {
  const [elig, scans] = await Promise.all([eligibleStocks(), db.select({ t: wheelScans.ticker, at: wheelScans.scannedAt }).from(wheelScans)]);
  const at = new Map(scans.map((s) => [s.t, s.at]));
  return elig.filter((g) => scanIsStale(at.get(g.row.ticker)));
}

/** Scan up to `limit` stale A/A+ stocks (live prices first, stored price as fallback). */
export async function runScanBatch(limit: number, concurrency = 3) {
  const stale = await staleScanTickers();
  const batch = stale.slice(0, limit);
  const prices = new Map<string, number>();
  try {
    for (const q of await yahooQuotes(batch.map((b) => b.row.ticker))) if (q.price != null) prices.set(q.symbol, q.price);
  } catch {
    /* fall back to the stored daily close */
  }
  const processed = await mapLimit(batch, concurrency, (g) => scanOne(g, prices.get(g.row.ticker) ?? null));
  return { processed, remaining: Math.max(0, stale.length - batch.length) };
}

/* ------------------------------------------------------------------ */
/* Screen                                                               */
/* ------------------------------------------------------------------ */

export type AccountFilter = "all" | "R" | "T";
export type WheelFilters = { params: WheelParams; minGrade: "A+" | "A"; account: AccountFilter; trendOnly: boolean };
export const DEFAULT_FILTERS: WheelFilters = { params: DEFAULT_PARAMS, minGrade: "A", account: "all", trendOnly: false };

export type WheelRow = {
  g: GradedStock;
  ctx: StockCtx;
  best: PutCandidate;
  count: number;
  source: string | null;
  fallbackReason: string | null;
  scannedAt: Date;
};
export type EarningsWatchRow = { g: GradedStock; ctx: StockCtx; days: number; estimated: boolean };

export type WheelResults = {
  rows: WheelRow[];
  /** Stocks with a qualifying put only if expiries after earnings are allowed. */
  heldBackByEarnings: { ticker: string; days: number | null }[];
  earningsWatch: EarningsWatchRow[];
  rejected: Partial<Record<RejectReason, number>>;
  info: { eligible: number; scanned: number; failed: { ticker: string; error: string }[]; waiting: number; oldest: Date | null; sources: Record<string, number>; fallbacks: number; universe: number; hydrated: number; staleStocks: number };
};

export async function getWheelResults(f: WheelFilters = DEFAULT_FILTERS, today = todayIso()): Promise<WheelResults> {
  const [all, scans, stale] = await Promise.all([getAllStocks(), db.select().from(wheelScans), staleStocks()]);
  const graded = all.map(gradeStock);
  const minRank = stockGradeRank(f.minGrade);
  const eligible = graded.filter((g) => g.grade != null && stockGradeRank(g.grade) <= minRank);
  const scanBy = new Map(scans.map((s) => [s.ticker, s]));

  const rows: WheelRow[] = [];
  const held: WheelResults["heldBackByEarnings"] = [];
  const earningsWatch: EarningsWatchRow[] = [];
  const rejected: WheelResults["rejected"] = {};
  const failed: { ticker: string; error: string }[] = [];
  const sources: Record<string, number> = {};
  let scanned = 0;
  let fallbacks = 0;
  let oldest: Date | null = null;

  for (const g of eligible) {
    const s = scanBy.get(g.row.ticker);
    const ctx = stockCtx(g, s?.price ?? null);
    if (!ctx) continue;
    if (ctx.nextEarnings && ctx.nextEarnings >= today && daysBetween(today, ctx.nextEarnings) <= 21) {
      earningsWatch.push({ g, ctx, days: daysBetween(today, ctx.nextEarnings), estimated: ctx.earningsEstimated });
    }
    if (!s) continue;
    if (s.error || !s.contracts) {
      failed.push({ ticker: g.row.ticker, error: s.error ?? "no contracts" });
      continue;
    }
    scanned++;
    if (!oldest || s.scannedAt < oldest) oldest = s.scannedAt;
    sources[s.source ?? "?"] = (sources[s.source ?? "?"] ?? 0) + 1;
    if (s.fallbackReason) fallbacks++;
    if (f.trendOnly && ctx.sma200 != null && ctx.price < ctx.sma200) continue;

    const scan = scanPuts(s.contracts as OptionContract[], ctx, f.params, today);
    for (const [k, n] of Object.entries(scan.rejected)) rejected[k as RejectReason] = (rejected[k as RejectReason] ?? 0) + (n ?? 0);
    let cands = scan.candidates;
    if (f.account !== "all") cands = cands.filter((c) => c.account.flag === f.account || c.account.flag === "R/T");
    if (cands.length === 0) {
      if (!f.params.allowEarnings && !scan.candidates.length && (scan.rejected.earnings ?? 0) > 0) {
        const without = scanPuts(s.contracts as OptionContract[], ctx, { ...f.params, allowEarnings: true }, today);
        if (without.candidates.length) held.push({ ticker: g.row.ticker, days: ctx.nextEarnings ? daysBetween(today, ctx.nextEarnings) : null });
      }
      continue;
    }
    rows.push({ g, ctx, best: cands[0], count: cands.length, source: s.source, fallbackReason: s.fallbackReason, scannedAt: s.scannedAt });
  }
  rows.sort((a, b) => b.best.score - a.best.score);
  earningsWatch.sort((a, b) => a.days - b.days);
  const universe = stale.length;
  return {
    rows,
    heldBackByEarnings: held,
    earningsWatch,
    rejected,
    info: { eligible: eligible.length, scanned, failed, waiting: eligible.length - scanned - failed.length, oldest, sources, fallbacks, universe: all.length, hydrated: all.length, staleStocks: universe },
  };
}

export { refreshStockBatch };

/* ------------------------------------------------------------------ */
/* Background scanner                                                   */
/* ------------------------------------------------------------------ */

const g = globalThis as typeof globalThis & { __wheelScanner?: boolean };

/** Keeps stock data and option scans fresh while the server runs (production default; WHEEL_SCANNER=true/false overrides). */
export function startWheelScanner() {
  const flag = process.env.WHEEL_SCANNER;
  const on = flag ? flag === "true" : process.env.NODE_ENV === "production";
  if (!on || g.__wheelScanner) return;
  g.__wheelScanner = true;
  let busy = false;
  const tick = async () => {
    if (busy) return;
    busy = true;
    try {
      const r = await refreshStockBatch(12, 4);
      if (r.remaining === 0) await runScanBatch(30, 3);
    } catch (e) {
      console.error("[wheel] background scan failed:", e instanceof Error ? e.message : e);
    } finally {
      busy = false;
    }
  };
  setTimeout(() => {
    void tick();
    setInterval(() => void tick(), 2 * 60 * 1000).unref?.();
  }, 90_000).unref?.();
}

export async function getScan(ticker: string) {
  return (await db.select().from(wheelScans).where(eq(wheelScans.ticker, ticker.toUpperCase())).limit(1))[0] ?? null;
}
