/** Query-string <-> filter mapping for the Wheel pages (a plain GET form, so every view is a shareable URL). */
import { DEFAULT_PARAMS, type WheelParams } from "./wheel";
import type { AccountFilter, WheelFilters } from "./wheel-service";

export type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const numIn = (v: string | string[] | undefined, def: number, lo: number, hi: number) => {
  const s = one(v);
  const n = s == null || s === "" ? NaN : Number(s);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : def;
};

export function parseFilters(sp: SP): WheelFilters {
  const d = DEFAULT_PARAMS;
  let dteMin = Math.round(numIn(sp.dteMin, d.dteMin, 1, 120));
  let dteMax = Math.round(numIn(sp.dteMax, d.dteMax, 1, 120));
  if (dteMin > dteMax) [dteMin, dteMax] = [dteMax, dteMin];
  let deltaMin = numIn(sp.dMin, d.deltaMin, 0.01, 0.9);
  let deltaMax = numIn(sp.dMax, d.deltaMax, 0.01, 0.9);
  if (deltaMin > deltaMax) [deltaMin, deltaMax] = [deltaMax, deltaMin];
  const params: WheelParams = {
    deltaMin,
    deltaMax,
    dteMin,
    dteMax,
    minOi: Math.round(numIn(sp.oi, d.minOi, 0, 100000)),
    maxSpreadPct: numIn(sp.spread, d.maxSpreadPct * 100, 1, 100) / 100,
    minAnnReturn: numIn(sp.ret, d.minAnnReturn * 100, 0, 500) / 100,
    allowEarnings: one(sp.earn) === "1",
  };
  const acct = one(sp.acct);
  const account: AccountFilter = acct === "R" || acct === "T" ? acct : "all";
  return { params, minGrade: one(sp.grade) === "A+" ? "A+" : "A", account, trendOnly: one(sp.trend) === "1" };
}

/** Params for the detail page links so the user's filters carry over. */
export function filtersQuery(f: WheelFilters): string {
  const p = f.params;
  const q = new URLSearchParams({
    dteMin: String(p.dteMin), dteMax: String(p.dteMax), dMin: String(p.deltaMin), dMax: String(p.deltaMax),
    oi: String(p.minOi), spread: String(Math.round(p.maxSpreadPct * 100)), ret: String(Math.round(p.minAnnReturn * 100)),
  });
  if (p.allowEarnings) q.set("earn", "1");
  return q.toString();
}
