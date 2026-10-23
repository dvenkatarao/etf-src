# ETF Research Lab — Critical Product Audit Report
### Role: Financial Advocate / ETF & Options Specialist / Macro Strategist
### Date: 2026-10-23 | Branch: `arena/7ef16559-etf-src` | Commit: `765e198`
### Author stance: *Outstanding is the minimum. Good is not good enough.*

---

## 0. Executive Summary

**ETF Research Lab** is already in the top 10% of retail investment research tools on data integrity alone. It refuses to hallucinate, badges staleness, never imputes, derives every number from verifiable provider data or deterministic math, and catalogs its sources with live health checks. That discipline — rare in fintech — is its moat.

**Current verdict:** **B+ product with A+ integrity.** It can become an A+ product with 4 focused sprints: (1) macro → trade linkage, (2) portfolio → real P&L, (3) wheel → risk & capital management, (4) discovery → guidance for the lost beginner.

**Biggest win:** NAV-erosion proxy + fund quality grade (A–F) + strict income-rule (Severe hidden) — this alone saves users from yield-trap ETFs that competitors actively promote.

**Biggest risk:** The app tells you *what* is cheap/high-yielding, *what* put pays 12%/yr, and *what* the Fed did — but does not connect them into *what to do now* given your capital, risk, taxes, and the macro regime. The user must do that integration mentally. An "outstanding" product must do it for them.

---

## 1. What This Product Is

- **Stack:** Next.js 16 App Router + Postgres/Drizzle + Yahoo Finance (unofficial, with crumb), FRED keyless CSV, NY Fed API, SEC EDGAR, BLS ICS, Alpaca (primary options), with Yahoo fallback.
- **Universe:** ~115 ETFs (curated UNIVERSE) + ~330 large-cap US stocks for wheel (approximation of S&P 500). No live broker link (501, "coming soon").
- **Core promises:**
  1. Every number is provider data or deterministic math (`src/lib/metrics.ts`). Missing = N/A. Stale = badged.
  2. Goal-based transparent ranking (percentile ranks within asset class, editable weights).
  3. Options Wheel on A/A+ rated stocks only (5-pillar stock grade, never forecast).
  4. Portfolio via CSV import or manual entry (cost basis required, no defaulting).
  5. Macro dashboard (20 FRED series, yield curve, Fed funds target, FOMC/BLS calendars).
  6. News & Events from primary feeds (Fed, SEC 8-K Item 2.02, BEA/BLS, market headlines).

---

## 2. BEST FEATURES — What Is Already Outstanding

### 2.1 Data Integrity & Provenance (10/10 — Keep, Extend)
- **Formula transparency:** `metrics.ts` documents price vs. total return, annualisation, volatility (√252), max drawdown, correlation/beta alignment. Reproducible.
- **`N/A` never guessed:** CSV without cost basis is rejected; positions without price flagged `COST`/`LAST`; beta/Sharpe = N/A unless computable. This is *exactly* right — most apps silently invent.
- **SourceNote + staleness:** Every card shows `Source`, `as of`, `fetched X ago`, `STALE` badge, link to provider. Builds trust.
- **Source catalog `/sources` + health + `/api/spec` downloadable spec:** Best-in-class. Lets an AI agent or auditor rebuild the app. No competitor does this.
- **Coverage audit `/coverage`:** Honest about what % of ETF universe has expense, AUM, holdings, spread history, etc. Drives feature readiness — brilliant product management.

**Advocate note:** In a world of AI hallucinations, this discipline is gold. Double down.

### 2.2 Fund Quality Grade A–F (9/10)
- **Why it matters:** ETF *quality* (is product well-built?) ≠ *performance* (will it go up?). Most apps conflate them. Separating them is correct.
- **5 pillars on FIXED bands (not relative):** Cost, Size & track record, Ease of trading (volume + spread after 20 samples/5 days), Diversification (top-10 concentration), Income sustainability (only for ≥4% yield, not bonds). Capped at C for leveraged/inverse, <$100M, <2yr.
- **Plain-English detail:** "Charges 0.09% a year, very low for equity funds. Manages $520B..." — retail can read it.
- **Coverage gate 70%:** No grade when <70% pillars have data. Prevents false precision.
- **Hidden D/F by default** in Recommend (opt-in to show) — protects beginners from junk.

**Minor deduction:** Score-to-letter thresholds (85/70/55/40) are reasonable but could use historical calibration note. Still, fixed bands beat percentile.

### 2.3 NAV-Erosion Analysis (9/10 — Category Leader)
- **Method:** Annualised 3Y price return (1Y fallback) + `capitalFundedShare3y = min(1, -priceRet/distYield)` when price negative. Levels: None ≥0%, Mild >−2%, Moderate >−6%, Severe ≤−6%.
- **Chart:** Growth of $10k price-only vs total-return overlay — the gap IS distributions reinvested, visually exposing decay.
- **Portfolio alerts:** Positions with Moderate/Severe flagged with market value & weight.
- **Income rule:** Severe excluded from Income picks by default — *critical* to avoid covered-call yield traps (QYLD, YMAX, CONY, etc.). Competitors hide this.

**Macro lens:** Correctly notes it's a *proxy* (market-price based), not authoritative return-of-capital % (only in 19(a) notices). Honest.

### 2.4 Options Wheel Screener (8.5/10 — Strongest Wheel Tool in Retail)
This is why an options user stays.

- **Quality gate first:** Only A/A+ stocks (5 pillars: quality, strength, valuation, analysts (≥8), size & stability) — "sell puts only on stocks you want to own" is *the* rule. Enforced in code, not marketing.
- **Scoring is sane:** `min(annRoc,1) × probOTM (1−delta) × liquidity × structureBonus ×100`. Caps return at 100% so crazy OTM illiquid contracts don't rank #1.
- **Realistic fill:** Credit = bid + 0.25×(ask−bid), not mid — respects that you'll never get mid on retail.
- **Cushion & margin of safety:** Breakeven cushion %, σ-distance (strike in expected-move units), vs analyst target. Rare.
- **Earnings discipline:** Excluded by default, watch box for next 3 weeks, red badge if included, `inside|clear|unknown` status with days-to-earnings. Prevents gap-risk that wipes months of premium.
- **Early-assignment for calls:** Correctly flags high (≤2% OTM + time value < dividend) vs check. Most tools ignore this.
- **R/T account hint:** Retirement vs Taxable based on beta (>1.3 → T to preserve loss deductibility) and premium richness (≥15% → R to shelter short-term gain). Not tax advice, but directionally correct.
- **Background scanner:** While app runs, batch refresh 12 stocks + 30 option chains every 2 min (20 min TTL market hours, 4h closed). First load progress bar. Alpaca primary (delta/IV/greeks) → Yahoo backup with BS-modelled delta (~).

**Guide `/wheel/guide` is excellent:** 15 sections, pre-trade checklist, assignment/covered-call lifecycle, ex-div deep dive, rolling, IV crush, troubleshooting. Better than most brokers' docs.

### 2.5 Macro Dashboard (8/10 for data; 6/10 for linkage)
- **Coverage:** 20 FRED series (policy, inflation, labor, growth, markets), yield curve (11 points, now vs 1yr ago), EFFR/SOFR from NY Fed, 30Y mortgage, Fed balance sheet, VIX via FRED.
- **FOMC calendar parsed from federalreserve.gov + BLS ICS next-45-days:** Official, not scraped rumor.
- **Sparklines + grouped cards:** Good info density.
- **Honest about gaps:** "Consensus forecasts are proprietary — only dates/times shown." Correct.

### 2.6 Transparent Recommend Engine (8/10)
- **Within-asset-class ranking (default):** Bonds ranked vs bonds, equities vs equities — prevents comparing apples to oranges. Toggle to cross-asset exists.
- **Editable weights:** User can override any metric (0–100, renormalised). Fixed directions (higherIsBetter) prevents gaming.
- **Coverage 70% gate** + small-group guard (need 5+ funds per metric) — excludes thin data instead of ranking noise.
- **Per-candidate strongest factors** shown (top 2). User sees *why* it ranked.

### 2.7 Portfolio Analytics (7.5/10 for a CSV-based tool)
- **CSV parsers:** Schwab, Fidelity, Vanguard, NinjaTrader, MooMoo, generic — with quantity/cost validation, no invention.
- **Price source transparency:** `live` | `last_close` | `stored` | `cost_basis` flag prevents presenting cost as market value.
- **Benchmark stats from real history:** Beta/Sharpe at current weights via aligned daily total returns (needs 120 days, 80% value covered) — not assumed.
- **Allocation look-through:** Sector weights via holdings + asset-class breakdown.
- **12-month dividend calendar** by frequency (monthly/quarterly/semi), rounded.
- **Fee drag:** Weighted expense × AUM = $/yr — makes cost tangible.
- **Demo portfolios (opt-in):** Lets first user see a rich state without importing.

### 2.8 Engineering & UX Craft
- **Compare up to 5 ETFs:** Growth overlay + side-by-side metrics + correlation matrix (low corr = diversification).
- **ETF page depth:** Performance (price vs total, annualised), risk, distributions bar chart, erosion chart, top holdings, sector mix, holdings-weighted analyst consensus, headlines.
- **LineChart:** Price vs growth modes, 9 ranges, hover tooltip, common start for comparability.
- **Techicals:** SMA/EMA/RSI/MACD/Bollinger/ATR/VWMA/VWAP/support-resistance — with `rsiState` plain-English, golden/death cross, off-high calc.
- **Black-Scholes:** Correct `d1` with optional divYield, provider vs model delta distinction.
- **Access:** Single shared login (HTTP Basic via `proxy.ts`), DB-backed, no user accounts — simple and honest about team use.

---

## 3. FEATURES THAT MUST BE IMPROVED — Critical Lens

> Rated by **impact on user success** × **effort**. 🔴 Critical, 🟡 Important, 🟢 Nice-to-have.

### 🔴 3.1 Macro Is a Museum, Not a Compass

**Current:** Macro page *shows* 20 series + curve + calendar. It does not *interpret* them for ETF/options decisions.

**Why this fails the "outstanding" bar:**
- A user investing in SCHD (dividend) or selling TSLA puts *needs* to know: Are we in easing/tightening? Is curve inverted? Is real yield rising (kills duration/growth multiples)? Is labor cracking (earnings risk)?
- Today, they must mentally map CPI YoY → Fed policy → discount rate → equity risk premium → style rotation → put strategy. Most can't.
- No regime label, no implication, no linkage to Recommend or Wheel.

**Needed to reach outstanding:**
1. **Regime indicator:** E.g., "Policy: Tightening (EFFR 4.0%, curve inverted −0.4pp, real 10Y 2.1%). Implication: favor short duration (SGOV, BIL), defensive equity (SCHD, VYM, USMV), avoid long-duration growth (QQQ) and high-beta put underlyings."
2. **Rate-sensitivity tags on ETFs:** Use existing `category` + `assetClass` + duration proxy to label each ETF's rate regime fit.
3. **Wheel regime filter:** In inverted/crisis (VIX >30, HY spread >500bp), tighten default `deltaMax` to 0.20, raise `minOi` to 500, surface cash-reserve warning. In easing, allow wider.
4. **Calendar → action:** "BLS CPI in 2 days at 8:30 ET — consider avoiding new puts expiring through it" (even without consensus, the event volatility is real).
5. **Cross-link:** From Macro → "See defensive picks" / "See puts for this regime."

**Effort:** Medium. Mostly synthesis + copy + conditional UI, no new data source.

---

### 🔴 3.2 Portfolio Tracking Is Still a Spreadsheet With Charts

**Current:** CSV import or manual entry, allocation look-through, dividend calendar, fee drag, beta/Sharpe, erosion alerts. No live broker link (501), no cost-basis lots, no real P&L vs. benchmark.

**Gaps that lose users:**
- **No transaction ledger used for P&L:** `transactions` table exists but analytics uses only `positions` (current snapshot). No realized gain, no holding-period, no wash-sale awareness, no time-weighted return (only current-weights backtest). A user who traded all year sees a fantasy "trailing 1Y at current weights" that never happened.
- **No rebalancing / drift view:** "You are 68% equity, target 60% — sell $12k VOO, buy BND." Missing. This is the #1 portfolio job.
- **No cash, no contributions:** `positions` only. Net deposits vs growth is unknowable. Can't answer "am I up because I saved or because market did?"
- **No overlap / concentration:** You hold VOO + QQQ + SCHG — 70% overlap, not diversification. The app has `correlation` and could have holdings overlap (coverage says lower bound available) but doesn't surface it in portfolio.
- **Dividend calendar is crude:** Assumes quarterly = Mar/Jun/Sep/Dec; ignores actual record dates. Better than nothing, but will mis-handle monthly and irregular payers.
- **Fee drag ignores ticket/entry differences:** Uses fund expense only, not brokerage fees field (present in transactions).

**Needed:**
1. Compute realized + unrealized P&L from `transactions` + current prices; show TWR & MWR; import transaction types (buy/sell/div/deposit/withdrawal).
2. Rebalance tool: target allocation (by asset class or custom) vs actual, with trade list.
3. Holdings overlap matrix for current portfolio (top-10 based, flagged as lower bound).
4. Cash position & deposits timeline.
5. Tax-lot aware cost basis (FIFO + wash-sale flag), at least for taxable export.

**Effort:** Large (portfolio revamp). But it's the retention engine.

---

### 🔴 3.3 Wheel Strategy Needs Capital & Risk Guardrails

**The wheel is powerful. Without guardrails, users blow up.**

**Missing risk features:**
- **No capital planner:** "Strike ×100 = $42k needed. You have X wheel positions open → $180k at risk if all assigned. Your cash reserve covers Y assignments." No position sizer. A beginner can sell 5 puts on high-price names and discover they're $200k short on a gap.
- **No assignment-loss scenario:** "If assigned, you'd own at $42 breakeven vs $39.50 current (−6%). At analyst target $45, you're −7% below on effective cost — here is the call you could sell for $1.20 / 9%/yr to recover." The per-ticker page shows calls but the screener doesn't project assignment loss.
- **No earnings distance taper:** Currently earnings = reject or allow. Better: scale `score ×0.7` for 5–10 days out, `×0.4` for <5 days, reject <3 days. Matches real gap probability.
- **No IV rank / IV percentile:** You can't know if 12%/yr is rich or cheap without knowing if IV is high for *this* name. `hv30` + `iv/hv` exists but no historical IV percentile (needs stored IV history, noted as deferred).
- **No assignment-tracking:** After you sell, there is no "My wheel positions" (open puts, assigned shares, calls sold, cost basis tracker). The user leaves the app to manage in a spreadsheet.
- **Hard 5% sector-blindness:** Selling XLE + CVX + OXY puts = 3 energy bets that all gap together on an OPEC day. No sector exposure warning.
- **Beta >1.3 → T flag is clever but threshold is blunt:** A 1.31 beta value stock is flagged T; a 1.29 growth stock isn't. Beta is regime-dependent; consider rolling beta or add drawdown to the tier.

**Needed (in order):**
1. Capital-at-risk calculator + cash reserve input → warning threshold.
2. "If assigned" loss & recovery call preview inline.
3. IV rank once snapshot job exists (store IV per scan, build 52-week percentile — small schema change).
4. Open position tracker (local-only, no broker link needed): add put sold → pending assignment → shares owned → call sold, with running cost basis.
5. Sector concentration cap + beta-adjusted position sizing.

**Effort:** Medium. #1 and #2 are frontend only.

---

### 🔴 3.4 Discovery Is Hard for the "What Should I Buy?" User

**Current:** Screener is powerful but cold; Recommend requires understanding goals/weights/asset classes; Dashboard shows movers but not guidance.

**Failure mode:** A new user with $10k asks: "I want income with not too much risk." They face:
- Screener: 16 columns, filters, but no path.
- Recommend: 5 goals, 10 metrics, weights — overwhelming on first visit.
- No wizard, no profile, no glide path.

**Needed:**
1. **Guided onboarding (3 questions):** Goal (income/growth/balanced/defensive) + horizon (1–3/3–7/7+ yr) + risk (preserve/modest/grow) → pre-fills Recommend filters + highlights 3 starter portfolios (conservative: BND+SCHD+VTI; balanced: VOO+VTI+VXUS; growth: QQQ/VUG/SMH) with why.
2. **Starter templates:** One-click "Build this starter portfolio in Portfolio tracker" that creates a manual portfolio with target weights (no transactions yet, just plan).
3. **Jargon tooltips + glossary surface:** "TTM yield," "Sharpe," "price return vs total return" are tooltip-only inside Screener; surface a glossary link + inline explainer on first use.
4. **Empty-state coaching:** When filters return 0, suggest *which* filter to loosen (e.g., "No equity funds match ≥5% yield with AUM ≥$10B — try lowering yield to 3.5%").

---

### 🟡 3.5 ETF Universe Is Too Small & Static

**Current:** 115 tickers hand-curated in `universe.ts`. Covers broad, style, dividend, option-income, sectors, bonds, international, commodities, leveraged. Decent, but:

- No way to discover a new ETF (e.g., just-launched buffer, active, thematic) without code change.
- Includes 5 leveraged (flagged), but no filter for active vs passive, ESG, buffer, 0DTE income, etc.
- No universe refresh job (SEC `company_tickers_exchange` + `company_tickers_mf` + `instrumentType=ETF` filter is documented in sources but not wired).

**Needed:**
1. Background job: weekly pull of SEC tickers → filter ETF instrumentType → diff vs `UNIVERSE` → surface "X new ETFs available, add to universe?"
2. Category filters for active/leveraged/buffer/ETN — derived from `category` text patterns (already done for `isLeveragedOrInverse`, extend).
3. At least 200–300 tickers to be credible as "screener" (add AVUV/AVDV, VT, BIL, MINT, JAAA, PULS, CLOU, etc.). Easy win.

---

### 🟡 3.6 Missing "So What?" on ETF Pages

ETF page is thorough but ends without synthesis.

- No 1-line takeaway: "SCHD: cheap, diversified dividend growth; yield 3.8%, erosion None, quality A — suits Income/Balanced. Watch: concentration in industrials."
- No peer comparison link: "Peers: VYM, DGRO, SDY — Compare."
- No rate-regime fit: "Duration: equity dividend (rates neutral); underperforms in sharp rate spikes vs BIL/SGOV."
- Analyst consensus is great (holdings-weighted, coverage % shown) but buried at bottom; promote to top if coverage ≥50%.

---

### 🟡 3.7 Wheel Detail Page Is Good but Dense

`/wheel/[ticker]` has 3 grades, technicals, puts table, calls table. Excellent but:

- Tables are wide with many numeric columns → mobile-hostile. Needs responsive cards or column hide.
- No chart of stock price vs. support/resistance levels overlay — text levels exist but not visual.
- No "Why this score?" breakdown tooltip per put (show the `×probOtm ×liq ×struct` factors).
- Covered-call finder requires user to type basis manually; could suggest basis from Screener credit if user came via Screener (credit = strike − premium).

---

### 🟡 3.8 Operations & Trust Nits

- **Auth:** Single shared Basic Auth (`APP_PASSWORD` ≥12 chars, `APP_USERNAME` default admin) — fine for small team, but no per-user portfolios. Documented. For growth, need real auth (e.g., Supabase Auth + RLS).
- **Secrets validation:** Production refuses placeholder secrets — excellent. But `SEC_USER_AGENT` warning only logs; should block or degrade SEC fetch with clear error.
- **Rate-limit awareness:** Yahoo crumb logic + retries exists, but no UI for "Yahoo throttling — retry in Xm." Show banner.
- **No export:** Screener/Recommend/Portfolio have no CSV export of ranked results — users live in Sheets.
- **No alerts:** No "SCHD ex-div in 3 days" or "your put expires Friday, stock at 101% of strike" notification layer.
- **Mobile nav:** ~10 nav links + ticker input crowd small screens. Consider collapse.

---

### 🟢 3.9 Nice-to-Have (Don't Block "Outstanding," but Win Loyalty)

- IV percentile sparkline per ticker (after IV history job).
- Holdings overlap heatmap in Compare (top-10 lower bound, flagged).
- Equivalent-fund finder (high correlation + overlapping holdings).
- Factor exposure (value/growth/quality/momentum) via holdings proxy.
- Tax estimator for distributions (qualified vs ROC vs short-term) from 19(a) when available.
- Currency-hedged flag for international ETFs.
- News sentiment tone label (GDELT) with "machine-generated" disclaimer.

---

## 4. Macro → ETF & Options Integration — Deep Assessment

| Current Macro Asset | Quality | Integration Gap |
|---|---|---|
| Policy rates (EFFR target, EFFR, SOFR) | Good, NY Fed official | No mapping to discount rate / ERP implication for equity vs bond allocation |
| Treasury curve (11 points) | Good, FRED + spread calc | No steepening/flattening/trend signal; no duration positioning hint |
| Real yields (10Y − breakeven) | Not computed explicitly | Critical for growth vs value rotation — add derived series |
| Inflation (CPI, core CPI, core PCE, breakeven) | Complete | No "above/below Fed target" framing |
| Labor (UNRATE, payrolls diff, claims) | Good | No Sahm Rule / softening signal |
| Credit stress (HY spread, VIX) | Present (HY OAS, VIXCLS) | No stress flag that tightens wheel filters |
| FOMC/BLS calendar | Working | No "event proximity" warning in wheel/screener |

**Advocate's macro playbook the app should encode:**
- **Tightening + inverted curve + high real yields:** Shorten duration, favor cash-like (BIL/SGOV) + low-vol equity (USMV, SCHD), reduce put-selling beta, keep cash reserve high.
- **Easing + steepening + falling VIX:** Extend duration, rotate to growth (QQQ, VOT, ARKK-adjacent), widen put DTE, accept slightly higher delta.
- **CPI re-acceleration:** Underweight long-duration bonds (TLT), tilt to commodities (DGL, commodity ETFs) and value; expect rate-vol → wider put spreads.
- **HY spread >6%:** Credit event risk → wheel stocks with low debt/equity + high current ratio; avoid high-leverage names even if graded A.

*None of this needs a new data feed. It needs synthesis.*

---

## 5. Options Strategy Assessment — Cash-Secured Puts & Covered Calls

**Strategy correctness: High.** The wheel implementation (sell OTM put → assign → sell OTM call → wheel) is text-book, with correct assignment/ex-div/earnings handling.

**Where this tool diverges from brokers (positively):**
- Brokers rank puts by premium $ or return without quality gate. This ranks after filtering to A/A+ — prevents yield-chasing on junk.
- Brokers hide earnings inside expiry; this hides by default and explains why.
- Brokers quote mid; this estimates realistic limit at 25% bid→ask.

**Where it must mature to be "outstanding":**
- **Probability language:** `probOtm = 1 − |delta|` is used — good as rough. Label it "approx. chance of expiring worthless (delta proxy)" to avoid overstating model precision. The `~` for BS-model delta is correct; keep.
- **Annualised return:** `roc = credit/(strike−credit)`, `annRoc = roc×365/dte` — correct for return on cash at risk. Make clear it excludes assignment loss — i.e., "if not assigned." Add conditional: "If assigned at breakeven, effective yield = ...".
- **Assignment math:** Current cost basis example in guide is clear ($100 − $2.50 = $97.50). Surface this per candidate ("If assigned, your cost = $42.10 vs $39.50 current").
- **Covered-call curation:** Hides calls below basis — excellent (never lock in loss). Could also surface "yield on cost" vs "yield on current" distinction.

---

## 6. Security, Deployment, Performance

- **Production guard:** Refuses start without `DATABASE_URL`, `APP_PASSWORD` (≥12), `PORTFOLIO_ENCRYPTION_KEY` (≥32, no placeholder), with `DATABASE_SSL`, `SEC_USER_AGENT` warnings — correct.
- **Docker:** `docker-compose.yml` builds `app + Postgres`, migrations auto-run (`/migrate` advisory lock), health probe `/api/health`. Correct to warn `never down -v`.
- **Render:** Blueprint `render.yaml` provisions web + Postgres, prompts for `SEC_USER_AGENT`, generates `APP_PASSWORD`/`PORTFOLIO_ENCRYPTION_KEY`. Good test-env path.
- **Caching:** Price/quote/macro/news via `cache.ts` with TTL + stale-on-error — resilient.
- **Concurrency:** `mapLimit` for Yahoo batches (6–8 concurrent) — respects upstream.
- **Lack of user isolation:** All portfolios visible to anyone with password. Documented as single-user/small-team; must not be marketed as multi-tenant.

**Perf note:** First visit hydrates in small batches with progress bar — acceptable. In production with `QUOTE_SNAPSHOTS=true` + scanner, the process must stay up during US market hours to build spread samples (≥20 over ≥5 days before grade counts spread). Documented. Good.

---

## 7. Prioritized Enhancement Roadmap

### Sprint A — Macro → Action (2 weeks, high leverage)
- [ ] Regime banner ( tightening / neutral / easing / stress ) with 2-line implication.
- [ ] ETF rate-sensitivity tag + filter.
- [ ] Wheel market-condition guardrails (auto-tighten on VIX/HY stress).
- [ ] BLS/FOMC proximity warning inside wheel table (red dot if expiry within 3 days after release).

### Sprint B — Portfolio as Source of Truth (3–4 weeks)
- [ ] Use `transactions` for realized P&L, TWR/MWR, deposit-aware performance.
- [ ] Drift vs target allocation + rebalance trade list.
- [ ] Holdings overlap matrix in Portfolio + Compare.
- [ ] Export portfolio to CSV; import improvements (transaction import, not just positions).

### Sprint C — Wheel Capital & Risk (2 weeks)
- [ ] Capital-at-risk input + assignment-loss preview.
- [ ] IV rank (store IV per scan; compute percentile).
- [ ] My Wheel Positions tracker (local, no broker link).
- [ ] Sector concentration warning.

### Sprint D — Discovery & Delight (1–2 weeks)
- [ ] 3-question onboarding → ranked picks → starter portfolio.
- [ ] ETF page takeaway + peer compare CTA.
- [ ] Screener recommend-export (CSV).
- [ ] Mobile-responsive wheel tables.

### Continuous
- Expand universe to 250+; weekly SEC ticker diff job.
- Real auth + per-user portfolios (when team use grows).
- Alert layer (ex-div, put expiry, FOMC) — email/webhook.

---

## 8. Scoring Summary (out of 10)

| Dimension | Score | Comment |
|---|---|---|
| Data integrity & provenance | 10.0 | Best-in-class for retail |
| ETF research depth | 8.5 | Thorough; needs synthesis/takeaway |
| Fund quality grade | 9.0 | Fixed bands, plain English, caps |
| NAV-erosion proxy | 9.0 | Proxy + chart + alerts |
| Recommend ranking | 8.0 | Transparent, editable, gated |
| Macro dashboard (data) | 8.0 | Comprehensive official sources |
| Macro → decision linkage | 5.0 | Biggest gap — museum not compass |
| Options Wheel | 8.5 | Rigorous, disciplined, well-guided |
| Techicals & levels | 8.0 | Complete toolkit, descriptive not predictive |
| Portfolio tracking | 6.5 | Good for CSV, not a P&L ledger |
| UX / navigation | 7.5 | Clean, but onboarding & mobile need work |
| Docs & deployment | 8.5 | Spec, sources, health, Docker/Render all present |
| **Overall** | **8.2 / 10** | **B+ — integrity moat, missing integration layer** |

---

## 9. Final Advocate Note

You have built the hardest part — **trust**. Users can verify every number to its source and know when you're unsure. Most fintechs never earn that.

What remains is **integration**: the user's time + capital are scarce, macro shifts weekly, and a mis-priced put or leaking ETF can cost more in a quarter than years of expense ratios. The product's next job is to **connect** rate regime → allocation → fund pick → option on a stock within that allocation → tax-smart account, in one coherent view.

Get Sprints A–D done and you won't just be a screener vs Morningstar — you'll be the tool that actually sits between the market and the trade ticket.

**Next step when you're ready:** I will draft the detailed enhancement specs (schemas, math, UI copy, acceptance tests) for Sprint A (Macro → Action), then we build.

---

*Appendix: Supporting files audited — `src/lib/metrics`, `quality`, `stock-quality`, `wheel`, `recommend`, `technicals`, `bs`, `portfolio-service`, `etf-service`, `macro`, `sources`, `coverage`, `data`, `universe`, `stock-universe`, `yahoo`, `options-providers/parse`, `spreads`, `cache`, `env`, DB schema, all pages under `src/app`, components `Screener`, `LineChart`, `QualityCard`, `KeyLevels`, `WheelBits`, portfolio modals, tests (132 passing), `docs/BUILD_PLAN`, `docs/ETF_Data_Sources_and_Agent_Spec`, `README`, `DEPLOYMENT`, `docker-compose.yml`, `render.yaml`, `.env.example`.*

