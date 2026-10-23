import Link from "next/link";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "Wheel User Guide · ETF Research Lab" };

const TOC: [string, string][] = [
  ["what", "What this tool is (and is not)"],
  ["wheel", "The wheel in one minute"],
  ["setup", "Before you start"],
  ["steps", "Step-by-step: from screen to trade"],
  ["assigned", "If you are assigned"],
  ["called", "If your shares are called away"],
  ["exdiv", "Ex-dividend dates"],
  ["earnings", "Earnings"],
  ["accounts", "R vs T: which account"],
  ["levels", "Reading the key levels"],
  ["scoring", "How grades and scores work"],
  ["manage", "Managing open trades"],
  ["limits", "Data sources and limits"],
  ["trouble", "Troubleshooting"],
  ["glossary", "Glossary"],
];

function H({ id, children }: { id: string; children: ReactNode }) {
  return <h2 id={id} className="mt-10 scroll-mt-20 border-b border-slate-200 pb-1 text-xl font-semibold text-slate-900">{children}</h2>;
}
const P = ({ children }: { children: ReactNode }) => <p className="mt-3 text-sm leading-relaxed text-slate-700">{children}</p>;
const UL = ({ children }: { children: ReactNode }) => <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-700">{children}</ul>;
function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <div className="mt-4 flex gap-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-indigo-600 text-sm font-bold text-white">{n}</div>
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <div className="text-sm leading-relaxed text-slate-700">{children}</div>
      </div>
    </div>
  );
}
function Callout({ tone = "info", title, children }: { tone?: "info" | "warn" | "danger"; title: string; children: ReactNode }) {
  const c = tone === "danger" ? "border-rose-200 bg-rose-50 text-rose-900" : tone === "warn" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-indigo-200 bg-indigo-50 text-indigo-900";
  return (
    <div className={`mt-4 rounded-xl border p-4 text-sm ${c}`}>
      <div className="font-semibold">{title}</div>
      <div className="mt-1 leading-relaxed">{children}</div>
    </div>
  );
}
const Term = ({ t, children }: { t: string; children: ReactNode }) => (
  <div className="border-t border-slate-100 py-2 first:border-0"><dt className="text-sm font-semibold text-slate-900">{t}</dt><dd className="text-sm text-slate-600">{children}</dd></div>
);

export default function WheelGuide() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Wheel User Guide" description="A step-by-step guide to finding, placing and managing wheel trades with this tool, including what happens on assignment, around ex-dividend dates and around earnings." right={<Link href="/wheel" className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500">Open the Wheel Screener →</Link>} />

      <nav className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">In this guide</div>
        <ol className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          {TOC.map(([id, t], i) => <li key={id}><a href={`#${id}`} className="text-indigo-700 hover:underline">{i + 1}. {t}</a></li>)}
        </ol>
      </nav>

      <H id="what">1. What this tool is (and is not)</H>
      <P>The Wheel Screener is a <b>research tool</b>. It finds high-quality stocks, shows the option contracts that pay well for the risk, and warns you about events (earnings, dividends) that can hurt. It never places orders. You place trades yourself at your broker.</P>
      <UL>
        <li><b>Stock filter:</b> only stocks graded <b>A or A+</b> (business quality, balance sheet, valuation, analysts, size) are scanned. The idea: sell puts only on companies you would be happy to own.</li>
        <li><b>Option ranking:</b> within those stocks, each put is scored on return, chance of finishing worthless, liquidity and safety cushions.</li>
        <li><b>Not advice:</b> grades and scores describe the present; they do not forecast prices. Options can lose money, and a put seller can lose almost the whole share price if the stock collapses.</li>
      </UL>

      <H id="wheel">2. The wheel in one minute</H>
      <ol className="mt-3 space-y-2 text-sm text-slate-700">
        <li><b>A. Sell a cash-secured put.</b> You collect a premium now and promise to buy 100 shares at the <i>strike</i> if the stock is below it at expiry. You set aside strike × 100 in cash.</li>
        <li><b>B1. Put expires worthless</b> (stock stays above the strike): you keep the premium and repeat step A.</li>
        <li><b>B2. You are assigned</b> (stock below the strike): you buy 100 shares at the strike. Your real cost is the strike minus all premiums collected.</li>
        <li><b>C. Sell a covered call</b> against the shares, at a strike at or above your cost. You collect another premium.</li>
        <li><b>D1. Call expires worthless:</b> keep the premium and the shares; sell another call.</li>
        <li><b>D2. Shares are called away</b> (stock above the call strike): you sell at the strike, keep every premium, and go back to step A. The wheel has turned once.</li>
      </ol>
      <Callout title="The trade-off to keep in mind">Premium is payment for taking risk. The wheel earns steady small gains in calm or rising markets, but in a sharp fall you own the stock at the strike while it trades lower. That is why the screener restricts you to A/A+ companies.</Callout>

      <H id="setup">3. Before you start</H>
      <UL>
        <li><b>Broker permissions:</b> you need approval to sell cash-secured puts and covered calls (usually &quot;Level 1&quot; or &quot;Level 2&quot;). Retirement accounts allow both, but not margin.</li>
        <li><b>Data keys (recommended):</b> put <code>ALPACA_API_KEY</code> and <code>ALPACA_SECRET_KEY</code> from a free Alpaca account in the <code>.env</code> file, then restart the app. Alpaca is the primary option data source. If a key is missing or Alpaca fails, Yahoo Finance is used as the backup and every row is labelled with the source. Without Alpaca, deltas are modelled and marked with a ≈ sign.</li>
        <li><b>First load:</b> the first visit to the Wheel Screener loads about 330 large US stocks and then scans option chains for the A/A+ ones. This takes a few minutes. Later visits are instant and data refreshes in the background while the app runs.</li>
        <li><b>Capital:</b> there is no cap in the screener. Check the <i>Cash needed</i> yourself: it is strike × 100 per contract (a $400 strike needs $40,000).</li>
      </UL>

      <H id="steps">4. Step-by-step: from screen to trade</H>
      <Step n={1} title="Check the status line">
        Under the filters you see how many stocks qualified, how many chains were scanned, and which data provider supplied them (<b>Alpaca</b>, <b>Yahoo (backup)</b>). If the oldest scan is hours old during market hours, wait for the background refresh or reload.
      </Step>
      <Step n={2} title="Choose your filters (or keep the defaults)">
        <UL>
          <li><b>Stock grade:</b> A and A+ (default) or A+ only.</li>
          <li><b>Days to expiry 21–50:</b> time decay works best in this range; very short expiries carry more sudden-move risk.</li>
          <li><b>Delta 0.15–0.30:</b> roughly a 70–85% chance the put expires worthless. Higher delta = more premium, more assignment risk.</li>
          <li><b>Open interest ≥ 100 and bid/ask gap ≤ 10%:</b> avoids contracts that are expensive to trade.</li>
          <li><b>Min annual return 8%:</b> hides trades that are barely worth the capital.</li>
          <li><b>Account:</b> show only R (retirement) or T (taxable) friendly trades.</li>
          <li><b>Include options that expire after earnings:</b> off by default (see section 8).</li>
          <li><b>Only above the 200-day average:</b> skips stocks in a long-term downtrend.</li>
        </UL>
      </Step>
      <Step n={3} title="Scan the table, best score first">
        Each row is one stock with its single best put. Columns: <b>Grade</b>, <b>Acct</b> flag (R/T), <b>Events</b> (earnings and ex-dividend badges), <b>Put to sell</b> (strike, expiry, days), <b>Credit</b> (estimated fill per share and per contract), <b>Delta</b>, <b>Return /yr</b> (return on cash set aside, annualised), <b>Cushion</b> (how far the stock can fall before you lose money; σ shows how many expected-move units the strike sits outside), <b>Liquidity</b>, <b>Trend</b> (200-day average, RSI, support) and <b>Score</b>.
      </Step>
      <Step n={4} title="Open the stock and read the key levels">
        Click the ticker. Check the grade breakdown, then the <b>Key levels</b> card (section 10). You want a strike <b>below a support level</b>, a stock not far below its 200-day average, and RSI not in free fall. The put table lists every qualifying strike and expiry, not just the best.
      </Step>
      <Step n={5} title="Check events before expiry">
        Red <i>earnings before expiry</i> badge: skip, or accept the gap risk knowingly. Blue <i>ex-div</i> badge: read section 7. An estimated earnings date (shown with ~ or &quot;estimated&quot;) can move, so allow extra margin.
      </Step>
      <Step n={6} title="Confirm affordability and size">
        Cash needed = strike × 100 per contract. Keep enough free cash for an assignment, and avoid putting more than about 5–10% of the account into one stock. Several wheel positions in the same sector can all be assigned together in a sell-off.
      </Step>
      <Step n={7} title="Place the order at your broker">
        Sell to open, 1 contract, <b>limit order</b> priced between the bid and the mid (the tool&apos;s Credit is a realistic target). Never use a market order on options; the bid/ask gap can cost you real money. If it does not fill, move the limit a cent or two toward the bid, not by chasing.
      </Step>
      <Step n={8} title="Manage until expiry">
        See section 12. Then repeat. If assigned, go to section 5.
      </Step>

      <Callout title="Pre-trade checklist" tone="info">
        <ul className="list-disc space-y-1 pl-5">
          <li>Grade A/A+ and I would happily own 100 shares at the strike?</li>
          <li>Earnings are after expiry (or I accept the risk)?</li>
          <li>Strike is below support and the stock is above its 200-day average?</li>
          <li>Bid/ask gap is small and open interest is healthy?</li>
          <li>I have the cash, and this position is a reasonable share of my account?</li>
          <li>Right account: R for rich premiums, T for volatile names (section 9)?</li>
        </ul>
      </Callout>

      <H id="assigned">5. If you are assigned</H>
      <P>Assignment means the put buyer exercised and you must buy 100 shares at the strike. It is not a failure of the strategy; it is step B2 of the wheel.</P>
      <UL>
        <li><b>When it happens:</b> usually at expiry if the put finishes in the money (even by a cent, it is exercised automatically). Early assignment before expiry is possible but uncommon for puts; it is most likely when the put is deep in the money with little time value left. You normally learn the next morning.</li>
        <li><b>What changes in your account:</b> strike × 100 in cash leaves, 100 shares arrive, and the premium you collected stays with you.</li>
        <li><b>Your cost per share</b> = strike − premium collected (add any later premiums as subtracting from cost). Example: sold the $100 put for $2.50, assigned: cost = $97.50. Your broker may show $100; use $97.50 for decisions.</li>
        <li><b>Do not panic-sell.</b> Re-open the stock page in this tool. Is it still A or A+? If the grade has dropped to B or lower, or the business story changed, treat it as a normal investment decision about whether to keep owning it, not as a wheel step.</li>
        <li><b>Sell a covered call:</b> on the stock page, use <b>Step 2 · Covered calls</b>, enter your cost per share, and pick a call whose strike is at or above it. The tool hides calls below your cost so that being called away never locks in a loss. If the stock sits far under your cost, calls at your cost pay little; a longer expiry or patience may be better than selling a cheaper strike.</li>
        <li><b>Taxes (general):</b> in a taxable account the put premium generally reduces the cost basis of the shares you were assigned, and the holding period starts when you receive them. Check your broker&apos;s tax form and ask a tax professional.</li>
      </UL>
      <Callout tone="warn" title="Keep your own record">Write down each trade: date, strike, premium, expiry and the running cost basis. It makes the covered-call step and tax time much easier.</Callout>

      <H id="called">6. If your shares are called away</H>
      <UL>
        <li>If the stock finishes above the call strike you sell 100 shares at that strike and keep all premiums. You are back to cash and can sell a new put.</li>
        <li>You give up gains above the strike. That is the cost of the premium: the wheel works best when you are content to earn a steady return and not to capture every rally.</li>
        <li><b>Taxable account:</b> the sale is a capital gain, short-term or long-term depending on how long you held the shares. Premiums from options that expired are taxed as short-term gains.</li>
        <li><b>Wash-sale caution:</b> if you sell a stock at a loss and sell a put on the same stock within 30 days before or after, the loss may be disallowed. Inside an IRA, the loss can be lost for good. Ask a tax professional if this applies.</li>
      </UL>

      <H id="exdiv">7. Ex-dividend dates</H>
      <P>To receive a dividend you must own the shares <i>before</i> the ex-dividend date. On that date the stock price typically drops by about the dividend. The tool shows a blue badge whenever an ex-dividend date falls before the option expires.</P>
      <UL>
        <li><b>Short put (step 1):</b> you do not own shares yet, so you get no dividend. The expected price drop on the ex-date makes the put slightly more likely to end in the money, a small headwind. The badge is informational. If you are assigned <i>before</i> the ex-date you will own the shares in time for the dividend.</li>
        <li><b>Short covered call (step 2):</b> this is where it matters. If the call is in the money and its remaining time value is <i>smaller than the dividend</i>, the buyer can profit by exercising the day before the ex-date to collect the dividend. You would lose the dividend and your shares would be called away early. Every call the tool suggests starts out of the money, so the risk appears if the stock rallies. The tool flags <b>early assignment risk</b> (red) when the strike is within 2% of the price and the time value is smaller than the dividend, and <b>watch before ex-div</b> (amber) whenever an ex-dividend date falls inside the term: if the stock climbs above your strike before that date, early assignment becomes likely.</li>
        <li><b>How to avoid it:</b> choose a strike out of the money, pick an expiry <i>before</i> the ex-date, or close or roll the call before the ex-date if it has become in the money.</li>
        <li><b>Qualified dividends:</b> in a taxable account, certain in-the-money covered calls can affect whether dividends get the lower qualified tax rate. If dividends matter to you, check with a tax professional.</li>
      </UL>

      <H id="earnings">8. Earnings</H>
      <P>Option prices rise before an earnings report because the market expects a large move. A rich premium right before earnings is usually payment for a real risk: the stock can gap far past your strike overnight, and you cannot react.</P>
      <UL>
        <li><b>Default:</b> options that expire on or after the next earnings date are hidden. Stocks that only have good puts after earnings are listed under the table so you know they exist.</li>
        <li><b>To include them:</b> tick <i>Include options that expire after earnings</i>. Those rows carry a red badge, and their score is reduced.</li>
        <li><b>Earnings watch:</b> the yellow box above the table lists every A/A+ stock reporting within three weeks, with the date and whether it is confirmed or estimated.</li>
        <li><b>Estimated dates:</b> if the company has not confirmed its date the provider shows a window. The tool uses the earliest date and marks it as estimated. If the date is unknown it says so; treat unknown as a risk.</li>
        <li><b>After earnings:</b> implied volatility usually falls sharply (the &quot;IV crush&quot;). Selling a put <i>after</i> the report, at the new lower volatility and a clearer price, is often the calmer entry.</li>
      </UL>

      <H id="accounts">9. R vs T: which account</H>
      <P>The R/T flag is a simple tax-efficiency hint, shown for each trade. It is general guidance, not tax advice.</P>
      <UL>
        <li><b>R (retirement/IRA):</b> rich premiums (roughly 15% a year or more). In a taxable account that income is taxed as short-term gains; an IRA shelters it.</li>
        <li><b>T (taxable):</b> high-beta stocks (beta above 1.3) and modest premiums (under about 10% a year). A loss after assignment can be deducted in a taxable account but is wasted inside an IRA, and low-yield trades do not justify using scarce retirement room.</li>
        <li><b>R/T:</b> in between; either account works.</li>
        <li><b>Retirement account rules:</b> cash-secured puts only (no margin), and you need approval at your broker. Make sure you could actually fund an assignment.</li>
      </UL>

      <H id="levels">10. Reading the key levels</H>
      <P>All indicators come from daily bars and describe the present state of the stock. They do not predict it.</P>
      <dl className="mt-2 rounded-xl border border-slate-200 bg-white px-4 py-2">
        <Term t="Support and resistance">Price levels where the stock reversed at least twice in the past year. A put strike <b>below support</b> means the stock must break a level buyers defended before you lose money.</Term>
        <Term t="50- and 200-day averages (SMA)">Trend gauges. Above the 200-day = long-term uptrend; below it, put selling is riskier. &quot;50 below 200&quot; is a long-term downtrend.</Term>
        <Term t="EMA 21 / 50 / 200">Faster-reacting averages. A fresh 21-over-50 cross suggests improving momentum.</Term>
        <Term t="VWAP (anchored) and VWMA">Average price weighted by volume, from Jan 1 or from the 52-week low, and over 20/50 days. They show where most shares changed hands. Price above them means buyers are in profit; below means the average holder is under water. These use daily bars, not the intraday VWAP.</Term>
        <Term t="RSI (14)">Momentum from 0 to 100. Above 70 is stretched, below 30 is oversold. A very low RSI can mean a bargain or a falling stock, so use it together with trend and support.</Term>
        <Term t="MACD (12,26,9)">Compares two moving averages. Bullish when the MACD line is above its signal line; the card shows if it just crossed.</Term>
        <Term t="Bollinger %B">Where price sits in its bands: 1 = upper band, 0 = lower band.</Term>
        <Term t="ATR">The stock&apos;s typical daily range. A strike at least 1–2 ATRs (a few days of normal movement) below the price is not a tight call.</Term>
        <Term t="IV / HV">Implied volatility (what options price in) versus realized volatility (what the stock did). Above 1× means premium is rich relative to recent movement.</Term>
      </dl>
      <Callout title="A simple read for put selling" tone="info">Good: above the 200-day, strike below support, RSI between 40 and 65, no earnings before expiry. Caution: price below the 200-day, RSI under 30 and falling, or a strike above the nearest support.</Callout>

      <H id="scoring">11. How grades and scores work</H>
      <UL>
        <li><b>Stock grade (A+ to F):</b> business quality 30% (margins, return on equity, free cash flow), financial strength 20% (debt), valuation 20% (P/E, PEG, free-cash-flow yield), analysts 15% (consensus and target, only with 8+ analysts), size and stability 15% (market cap, beta, worst one-year fall). Scored on fixed bands, not against other stocks. Losses, negative free cash flow, a market cap under $10B, a sell-leaning consensus, or a 40% one-year fall cap the grade. Missing inputs are left out; under 70% coverage means no grade.</li>
        <li><b>Credit:</b> a realistic limit fill, 25% of the way from the bid to the ask.</li>
        <li><b>Return /yr:</b> credit ÷ (strike − credit), annualised by days to expiry. This is the return on the cash you set aside.</li>
        <li><b>Cushion:</b> how far the stock can fall from today to your breakeven (strike − credit) before the trade loses money.</li>
        <li><b>σ out:</b> distance from the price to the strike, in units of the move the options market expects by expiry (1σ). 1.0 or more means the strike is outside the expected range.</li>
        <li><b>Score:</b> annual return (capped at 100%) × chance the put expires worthless (1 − delta) × liquidity factor × structure factor (+ support above the strike, + strike beyond 1σ, − earnings before expiry, − below the 200-day average). Higher is better. Use it for ordering, not as a promise.</li>
        <li><b>Delta:</b> the feed&apos;s delta where available; otherwise modelled with Black-Scholes from implied volatility (shown with ≈). Delta is only a rough guide to the chance of assignment.</li>
      </UL>

      <H id="manage">12. Managing open trades</H>
      <UL>
        <li><b>Take profits early:</b> many traders buy back the option once about 50% of the premium is captured, and redeploy the cash. It lowers risk and speeds up the wheel.</li>
        <li><b>Watch the last week:</b> near expiry a stock sitting right at your strike is hard to predict (&quot;pin risk&quot;). If you do not want shares, close or roll before the last day.</li>
        <li><b>Rolling:</b> closing the option and opening a later one. Roll only for a net credit and only if you still want the stock. Do not roll down repeatedly into a stock that is deteriorating.</li>
        <li><b>If the stock drops sharply:</b> recheck the grade and news. A bad quarter or a broken business is a reason to reconsider, not to average down automatically.</li>
        <li><b>Diversify:</b> spread positions across sectors and keep cash in reserve. Markets fall together.</li>
      </UL>

      <H id="limits">13. Data sources and limits</H>
      <UL>
        <li><b>Option data:</b> Alpaca first; if it errors or returns no usable quotes, Yahoo Finance is used and the row shows a &quot;Yahoo (backup)&quot; badge. Alpaca&apos;s free (&quot;indicative&quot;) feed is not the full exchange feed and can lag or differ slightly; set <code>ALPACA_OPTIONS_FEED=opra</code> if you have the paid subscription. Yahoo quotes are delayed and its implied volatility can be noisy for thinly traded contracts.</li>
        <li><b>Stock data:</b> Yahoo Finance (unofficial). Fundamentals, analyst ratings and earnings dates can be stale or estimated. Always confirm the date and price at your broker before trading.</li>
        <li><b>Stock universe:</b> a bundled list of about 330 large US stocks (an approximation of the S&amp;P 500, not an official index feed). Add your own with <code>WHEEL_EXTRA_SYMBOLS</code> (comma-separated).</li>
        <li><b>Early exercise:</b> US options can be exercised any time. Models and the early-assignment flag are guides.</li>
        <li><b>Nothing is estimated:</b> if data is missing the tool shows N/A or leaves the stock out.</li>
      </UL>

      <H id="trouble">14. Troubleshooting</H>
      <UL>
        <li><b>Table is empty:</b> loosen the filters (delta range, minimum return, bid/ask gap) or wait for the scan progress bar to finish. The page lists why contracts were rejected.</li>
        <li><b>&quot;Alpaca keys not set&quot;:</b> add them to <code>.env</code> and restart; until then Yahoo is used.</li>
        <li><b>A stock is missing:</b> it may not be A/A+, may have no analyst data, or its scan failed (see the failure list). Open <code>/wheel/TICKER</code> to see its grade and options directly.</li>
        <li><b>Data looks old:</b> the scanner refreshes while the app is running (every few minutes in market hours). If you start the app only occasionally, reload and let the progress bar finish.</li>
        <li><b>Rate limits:</b> if Yahoo or Alpaca throttles, affected stocks are skipped and retried later.</li>
      </UL>

      <H id="glossary">15. Glossary</H>
      <dl className="mt-2 rounded-xl border border-slate-200 bg-white px-4 py-2">
        <Term t="Assignment">The option buyer exercises and you must fulfil the contract (buy shares for a put, sell shares for a call).</Term>
        <Term t="Cash-secured put">A short put backed by cash equal to strike × 100.</Term>
        <Term t="Covered call">A short call backed by 100 shares you own.</Term>
        <Term t="Credit / premium">Money you receive for selling the option.</Term>
        <Term t="Delta">How much the option price moves per $1 in the stock; also a rough chance of finishing in the money.</Term>
        <Term t="DTE">Days to expiration.</Term>
        <Term t="Ex-dividend date">First day the stock trades without the next dividend. Own the shares before it to receive the dividend.</Term>
        <Term t="Extrinsic (time) value">The part of an option&apos;s price that is not intrinsic value; it decays to zero at expiry.</Term>
        <Term t="Implied volatility (IV)">The movement the option price implies. Rises before events like earnings.</Term>
        <Term t="Open interest">Number of open contracts; a liquidity gauge.</Term>
        <Term t="Strike">The price at which the option can be exercised.</Term>
        <Term t="Rolling">Closing an option and opening another one with a later date (and sometimes a different strike).</Term>
      </dl>
    </div>
  );
}
