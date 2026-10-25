# Capital Lab

Live, source-verified US market research (ETFs, options wheel, portfolio) — Next.js 16 App Router + PostgreSQL/Drizzle.

* **Screener** – filter/sort ~115 ETFs on expense ratio, TTM yield, AUM, returns, volatility, drawdown, Sharpe, NAV-erosion level.
* **ETF page** – price chart, price vs total return, risk, distributions, NAV-erosion analysis, holdings, sector mix, holdings-weighted analyst consensus, headlines.
* **Compare** – growth of $10,000 overlay, side-by-side metrics, correlation matrix.
* **Recommend** – transparent goal-based scoring (income / growth / low-cost / defensive / balanced). Percentile ranks are computed within asset class by default (toggle to rank across all ETFs), and every metric weight is editable on the page.
* **Macro** – Treasury curve, policy rates, inflation, labour, growth, market stress (FRED, NY Fed), FOMC and BLS calendars.
* **News & Events** – Fed/SEC/BEA feeds, SEC 8-K earnings releases, market headlines.
* **Portfolio** – track positions from CSV statement imports (Schwab, Fidelity, Vanguard, NinjaTrader, MooMoo, generic) or manual entry: allocation look-through, dividend calendar, fee drag, NAV-erosion alerts, beta/Sharpe vs VOO computed from real price history.
* **Options Wheel** (`/wheel`) – scans ~330 large US stocks, keeps only **A/A+ rated** companies (business quality, balance sheet, valuation, analysts, size), and ranks cash-secured puts by return on cash, chance of expiring worthless, liquidity and safety cushions. Shows earnings (excluded by default; checkbox to include) and ex-dividend flags, key levels (support/resistance, VWAP, VWMA, RSI, MACD, Bollinger, ATR, moving averages), margin of safety vs the analyst target, and an **R (retirement) / T (taxable)** account hint. Per-stock page has every qualifying strike plus a covered-call finder for after assignment. Option data: **Alpaca primary, Yahoo automatic backup**. Step-by-step manual at `/wheel/guide`. Research only: it never places orders.
* **Coverage** – audit of which fields are actually populated across the ETF universe (and live quotes), mapped to feature readiness. JSON at `/api/coverage`.
* **Fund quality grade (A–F)** – on every ETF page, a Screener column/filter, and Recommend (D/F funds hidden by default; tick *Show low-grade funds*). Five pillars on fixed bands (cost, size & track record, ease of trading, diversification, income sustainability); leveraged/inverse, <$100M and <2-year-old funds are capped at C; under 70% data coverage means no grade. It rates how well a product is built, not future returns.
* **Data Sources** – catalog of free sources, live health check, downloadable AI-agent build spec (`/api/spec`).

## Data integrity

Every number is provider data or deterministic math on it (`src/lib/metrics.ts`). Missing values render `N/A`; stale cache copies are badged; nothing is estimated. Specifically: CSV rows without a cost basis or price are rejected (never defaulted), positions without a market price are flagged `COST`/`LAST`, and portfolio beta/Sharpe are `N/A` unless computable from stored history.

**Not implemented:** live broker linking (SnapTrade/Plaid). The UI shows them as "coming soon" and the API returns 501. "Demo account" creates clearly-labelled sample positions.

## Access control

The app has **no user accounts**: it is gated by one shared login (HTTP Basic, `APP_USERNAME`/`APP_PASSWORD`) enforced in `src/proxy.ts` for every page and API route except `/api/health`. In production it refuses to serve without `APP_PASSWORD`. Everyone with the password sees and edits the same portfolios, so treat it as a single-user / small-team tool. Multi-user support would need real auth and per-user ownership of portfolios.

## Configuration

See `.env.example`. Required: `DATABASE_URL`, `APP_PASSWORD`, `PORTFOLIO_ENCRYPTION_KEY` (≥32 random chars), `SEC_USER_AGENT` (your contact email). Optional Wheel settings: `ALPACA_API_KEY`/`ALPACA_SECRET_KEY` (primary option source), `OPTIONS_PROVIDER`, `WHEEL_SCANNER`, `WHEEL_EXTRA_SYMBOLS` (see `.env.example`). Optional: `QUOTE_SNAPSHOTS=false` disables the background sampler that stores bid/ask quotes every 30 minutes during US market hours (on by default in production, off in dev unless `true`). The buy/sell-spread part of the grade only counts after ≥20 samples over ≥5 days, so the app must keep running for that to build up. In production the process refuses to start with missing/placeholder secrets.

## Run

```bash
# Docker (app + Postgres)
cp .env.example .env   # fill in APP_PASSWORD, PORTFOLIO_ENCRYPTION_KEY, POSTGRES_PASSWORD, SEC_USER_AGENT
docker compose up --build -d     # http://localhost:3000, migrations run automatically on start

# Native
npm ci
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/app_db
npm run db:migrate
npm run dev
```

On first visit the page hydrates the ETF universe in small batches from the live providers (progress bar shown). This needs outbound HTTPS to Yahoo Finance, FRED, SEC, etc.

## Quality gates

`npm run lint && npm run typecheck && npm test && npm run build` (also run in `.github/workflows/ci.yml`, which additionally fails if `src/db/schema.ts` changed without a new migration: run `npm run db:generate`).

See `DEPLOYMENT.md` for hosting.
