/**
 * Stock filter presets that map A+/A/B/C grades to explicit fundamental thresholds.
 * Inclusive: B means B and better (≥65), etc. Used for transparent stock filtering.
 * Custom mode allows user-supplied thresholds.
 */

import type { StockGrade } from "./stock-quality";
import type { StockInputs } from "./stock-quality";

export type PresetKey = "A+" | "A" | "B" | "C" | "all";
export const PRESET_ORDER: PresetKey[] = ["A+", "A", "B", "C", "all"];

export const PRESET_LABEL: Record<PresetKey, string> = {
  "A+": "A+ Outstanding",
  A: "A Excellent",
  B: "B Good",
  C: "C Fair",
  all: "All graded",
};

export const PRESET_DESC: Record<PresetKey, string> = {
  "A+": "Only Outstanding (≥90) — strongest quality, low debt, cheap, stable",
  A: "Excellent and better (≥80) — default",
  B: "Good and better (≥65) — includes A/A+",
  C: "Fair and better (≥50) — includes B/A/A+",
  all: "All graded stocks (F to A+)",
};

export const PRESET_GRADE_MIN: Record<PresetKey, StockGrade | null> = {
  "A+": "A+",
  A: "A",
  B: "B",
  C: "C",
  all: null,
};

/**
 * Explicit thresholds that populate the Stock Filter UI when a preset is chosen.
 * These are explanatory — preset mode still uses grade engine for eligibility.
 * Custom mode enforces these directly against fundamentals.
 * Values chosen from BAND midpoints for 90/80/65/50 scores.
 */
export type StockThresholds = {
  opMarginMin?: number | null;
  roeMin?: number | null;
  fcfMarginMin?: number | null;
  debtEquityMax?: number | null;
  netDebtEbitdaMax?: number | null;
  currentRatioMin?: number | null;
  forwardPEMax?: number | null;
  pegMax?: number | null;
  fcfYieldMin?: number | null;
  recMeanMax?: number | null;
  marketCapMin?: number | null;
  betaMax?: number | null;
  ddMax?: number | null;
};

export const STOCK_PRESETS: Record<PresetKey, StockThresholds> = {
  "A+": {
    opMarginMin: 0.25,
    roeMin: 0.25,
    fcfMarginMin: 0.12,
    debtEquityMax: 0.5,
    netDebtEbitdaMax: 1.0,
    currentRatioMin: 1.5,
    forwardPEMax: 15,
    pegMax: 1.5,
    fcfYieldMin: 0.06,
    recMeanMax: 1.8,
    marketCapMin: 5e10,
    betaMax: 1.0,
    ddMax: 0.15,
  },
  A: {
    opMarginMin: 0.15,
    roeMin: 0.15,
    fcfMarginMin: 0.05,
    debtEquityMax: 1.0,
    netDebtEbitdaMax: 2.0,
    currentRatioMin: 1.2,
    forwardPEMax: 20,
    pegMax: 2.0,
    fcfYieldMin: 0.04,
    recMeanMax: 2.3,
    marketCapMin: 1e10,
    betaMax: 1.3,
    ddMax: 0.25,
  },
  B: {
    opMarginMin: 0.08,
    roeMin: 0.08,
    fcfMarginMin: 0.02,
    debtEquityMax: 2.0,
    netDebtEbitdaMax: 3.0,
    currentRatioMin: 1.0,
    forwardPEMax: 25,
    pegMax: 2.5,
    fcfYieldMin: 0.02,
    recMeanMax: 3.0,
    marketCapMin: 2e9,
    betaMax: 1.8,
    ddMax: 0.40,
  },
  C: {
    opMarginMin: 0,
    roeMin: 0,
    debtEquityMax: 4.0,
    netDebtEbitdaMax: 5.0,
    currentRatioMin: 0.5,
    forwardPEMax: 35,
    pegMax: 4.0,
    fcfYieldMin: 0,
    recMeanMax: 4.0,
    marketCapMin: null,
    betaMax: 2.5,
    ddMax: 0.55,
  },
  all: {},
};

export function isPresetKey(k: string | undefined): k is PresetKey {
  return !!k && (PRESET_ORDER as string[]).includes(k);
}

/**
 * Check if a graded stock's fundamentals pass custom thresholds.
 * `optionableOnly` is kept for future non-optionable expansion — currently universe is all optionable.
 */
export function passesStockThresholds(inputs: StockInputs | null | undefined, t: StockThresholds): boolean {
  if (!inputs) return false;
  const check = {
    opMargin: t.opMarginMin != null ? (inputs.operatingMargin ?? -Infinity) >= t.opMarginMin : true,
    roe: t.roeMin != null ? (inputs.roe ?? -Infinity) >= t.roeMin : true,
    fcfMargin:
      t.fcfMarginMin != null
        ? inputs.freeCashflow != null && inputs.totalRevenue != null && inputs.totalRevenue > 0
          ? inputs.freeCashflow / inputs.totalRevenue >= t.fcfMarginMin
          : false
        : true,
    debtEquity: t.debtEquityMax != null ? (inputs.debtToEquity ?? Infinity) <= t.debtEquityMax : true,
    netDebtEbitda:
      t.netDebtEbitdaMax != null
        ? inputs.totalDebt != null && inputs.totalCash != null && inputs.ebitda != null && inputs.ebitda > 0
          ? (inputs.totalDebt - inputs.totalCash) / inputs.ebitda <= t.netDebtEbitdaMax
          : true // missing -> don't block
        : true,
    currentRatio: t.currentRatioMin != null ? (inputs.currentRatio ?? -Infinity) >= t.currentRatioMin : true,
    forwardPE: t.forwardPEMax != null ? (inputs.forwardPE != null && inputs.forwardPE > 0 ? inputs.forwardPE <= t.forwardPEMax : true) : true,
    peg: t.pegMax != null ? (inputs.pegRatio != null && inputs.pegRatio > 0 ? inputs.pegRatio <= t.pegMax : true) : true,
    fcfYield:
      t.fcfYieldMin != null
        ? inputs.freeCashflow != null && inputs.marketCap != null && inputs.marketCap > 0
          ? inputs.freeCashflow / inputs.marketCap >= t.fcfYieldMin
          : false
        : true,
    recMean: t.recMeanMax != null ? (inputs.recMean != null ? inputs.recMean <= t.recMeanMax : true) : true,
    marketCap: t.marketCapMin != null ? (inputs.marketCap ?? -Infinity) >= t.marketCapMin : true,
    beta: t.betaMax != null ? (inputs.beta ?? -Infinity) <= t.betaMax : true,
    dd: t.ddMax != null ? (inputs.dd1y ?? -Infinity) <= t.ddMax : true,
  };
  return Object.values(check).every(Boolean);
}
