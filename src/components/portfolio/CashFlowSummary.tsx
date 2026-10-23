"use client";

import { PortfolioAnalyticsSummary } from "@/lib/portfolio-service";
import { money, pct, colorFor } from "@/lib/format";

export default function CashFlowSummary({ analytics }: { analytics: PortfolioAnalyticsSummary }) {
  const cf = analytics.cashFlow;
  const da = analytics.depositAware;
  if (!cf && !da) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-sm text-slate-500">
        <div className="font-semibold text-slate-700">Cashflow & Realized P&L</div>
        <p className="mt-1 text-xs leading-relaxed">No ledger activity yet. Add <span className="font-semibold">DEPOSIT / WITHDRAWAL / DIVIDEND / BUY / SELL</span> transactions via the <em>Transactions</em> ledger to get deposit-aware performance and IRR. Your current holdings already show unrealized gains.</p>
      </div>
    );
  }

  const gainColor = (da?.gainVsDeposits ?? analytics.totalUnrealizedGain) >= 0 ? "text-emerald-600" : "text-rose-600";
  const mwr = da?.mwr;
  const mwrText = da?.mwrLabel ?? "MWR needs dated deposits";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Cashflow & Realized P&L (from ledger)</h3>
        <p className="mt-0.5 text-xs text-slate-500">Deposits/withdrawals + dividends + realized gains tracked from transactions, not guessed.</p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Net Deposits</div>
            <div className="mt-1 text-lg font-bold tabular-nums text-slate-900">{money(cf?.netDeposits ?? analytics.totalCostBasis)}</div>
            <div className="text-[10px] text-slate-400">in {money(cf?.totalDeposits ?? 0)} · out {money(cf?.totalWithdrawals ?? 0)}</div>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Realized Gain</div>
            <div className={`mt-1 text-lg font-bold tabular-nums ${colorFor(cf?.realizedGain ?? 0)}`}>{cf?.realizedGain ? `${cf.realizedGain > 0 ? "+" : ""}${money(cf.realizedGain)}` : money(0)}</div>
            <div className="text-[10px] text-slate-400">{cf?.realizedGainPct != null ? pct(cf.realizedGainPct, 1, true) + " on sales" : `${cf?.tradeCount.sells ?? 0} sells · ${cf?.tradeCount.buys ?? 0} buys`}</div>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Dividends (ledger)</div>
            <div className="mt-1 text-lg font-bold tabular-nums text-emerald-600">{money(cf?.totalDividends ?? 0)}</div>
            <div className="text-[10px] text-slate-400">fees {money(cf?.totalFees ?? 0)}</div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
            <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Gain vs Deposits</div>
            <div className={`mt-1 text-sm font-semibold tabular-nums ${gainColor}`}>{da?.gainVsDeposits != null ? `${da.gainVsDeposits > 0 ? "+" : ""}${money(da.gainVsDeposits)}` : `${analytics.totalUnrealizedGain > 0 ? "+" : ""}${money(analytics.totalUnrealizedGain)}`}</div>
            <div className="text-[10px] text-slate-500">{da?.gainVsDepositsPct != null ? pct(da.gainVsDepositsPct, 1, true) + " vs contributions" : pct(analytics.totalUnrealizedGainPct, 1, true) + " vs cost"}</div>
          </div>
          <div className="col-span-2 rounded-xl border border-indigo-100 bg-indigo-50/40 p-3">
            <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Money-Weighted Return (IRR)</div>
            <div className={`mt-1 text-sm font-semibold tabular-nums ${mwr != null ? (mwr > 0 ? "text-emerald-700" : mwr < 0 ? "text-rose-600" : "text-slate-700") : "text-slate-500"}`}>{mwr != null ? pct(mwr, 2, true) + " annualized" : "N/A"}</div>
            <div className="text-[10px] leading-relaxed text-slate-500">{mwrText}</div>
          </div>
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-slate-400">Realized gains use FIFO lots from your BUY/SELL ledger (cost = price + fees). TWR remains the trailing-1Y current-weights backtest below; MWR above is deposit-aware and includes cash timing. Add DEPOSIT on the day money entered to make IRR accurate.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Deposit-Aware Performance</h3>
        <p className="mt-0.5 text-xs text-slate-500">What you put in vs what you have now, with dividends and fees.</p>
        <div className="mt-4 space-y-3">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Market value now</span>
            <span className="font-semibold tabular-nums text-slate-900">{money(analytics.totalMarketValue)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Net deposits</span>
            <span className="font-semibold tabular-nums text-slate-900">{money(cf?.netDeposits ?? analytics.totalCostBasis)}</span>
          </div>
          <div className="h-px bg-slate-100" />
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-700">Pre-dividend gain vs deposits</span>
            <span className={`tabular-nums ${gainColor}`}>{da?.gainVsDeposits != null ? `${da.gainVsDeposits > 0 ? "+" : ""}${money(da.gainVsDeposits)}` : money(analytics.totalUnrealizedGain)}</span>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 text-xs">
            <div className="flex justify-between"><span className="text-slate-500">Unrealized</span><span className={`font-semibold tabular-nums ${colorFor(analytics.totalUnrealizedGain)}`}>{money(analytics.totalUnrealizedGain)} ({pct(analytics.totalUnrealizedGainPct, 1, true)})</span></div>
            <div className="mt-1 flex justify-between"><span className="text-slate-500">Realized</span><span className={`font-semibold tabular-nums ${colorFor(cf?.realizedGain ?? 0)}`}>{cf?.realizedGain ? money(cf.realizedGain) : "—"}</span></div>
            <div className="mt-1 flex justify-between"><span className="text-slate-500">Dividends</span><span className="font-semibold tabular-nums text-emerald-600">{money(cf?.totalDividends ?? 0)}</span></div>
          </div>
          <p className="text-[11px] text-slate-400">Tip: log a <b>DEPOSIT</b> for every cash transfer in and a <b>WITHDRAWAL</b> for cash out. The IRR becomes a true time-weighted vs your savings.</p>
        </div>
      </div>
    </div>
  );
}
