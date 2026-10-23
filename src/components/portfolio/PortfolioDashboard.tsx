"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PortfolioAnalyticsSummary } from "@/lib/portfolio-service";
import PortfolioSummaryCards from "./PortfolioSummaryCards";
import PortfolioAllocationCharts from "./PortfolioAllocationCharts";
import PositionsTable from "./PositionsTable";
import BenchmarkAttribution from "./BenchmarkAttribution";
import DividendForecastCalendar from "./DividendForecastCalendar";
import ConnectBrokerModal from "./ConnectBrokerModal";
import CsvImportModal from "./CsvImportModal";
import AddPositionModal from "./AddPositionModal";
import TransactionLedgerModal from "./TransactionLedgerModal";
import { SUPPORTED_BROKERS, BrokerType } from "@/lib/brokers/types";
import CashFlowSummary from "./CashFlowSummary";
import OverlapMatrix from "./OverlapMatrix";
import RebalancePanel from "./RebalancePanel";
import { ago, dateTime } from "@/lib/format";

export default function PortfolioDashboard({
  initialAnalytics,
}: {
  initialAnalytics: PortfolioAnalyticsSummary;
}) {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<PortfolioAnalyticsSummary>(initialAnalytics);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>("all");
  const [syncing, setSyncing] = useState(false);

  // Modals
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);

  const refreshData = async (portId = selectedPortfolioId) => {
    try {
      const url =
        portId === "all" ? "/api/portfolios" : `/api/portfolios/${portId}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch {
      router.refresh();
    }
  };

  const handleSelectPortfolio = async (portId: string) => {
    setSelectedPortfolioId(portId);
    await refreshData(portId);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      if (selectedPortfolioId !== "all") {
        await fetch(`/api/portfolios/${selectedPortfolioId}/sync`, { method: "POST" });
      } else {
        // Sync all portfolios sequentially
        for (const p of analytics.portfolios) {
          await fetch(`/api/portfolios/${p.id}/sync`, { method: "POST" });
        }
      }
      await refreshData();
    } catch {
      alert("Sync encountered an error");
    } finally {
      setSyncing(false);
    }
  };

  const currentPort = analytics.portfolios.find((p) => p.id === selectedPortfolioId);
  const lastSyncTime = currentPort?.lastSyncedAt || analytics.portfolios[0]?.lastSyncedAt;

  return (
    <div className="space-y-6">
      {/* Top Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Active Workspace
            </label>
            <div className="mt-1 flex items-center gap-2">
              <select
                value={selectedPortfolioId}
                onChange={(e) => handleSelectPortfolio(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="all">
                  🌐 All Accounts Combined ({analytics.portfolioCount} brokers)
                </option>
                {analytics.portfolios.map((p) => {
                  const meta = SUPPORTED_BROKERS[p.brokerType as BrokerType];
                  return (
                    <option key={p.id} value={p.id}>
                      {meta ? `🏦 ${meta.name}: ${p.name}` : p.name} ({p.accountNumberMasked || "Active"}){p.isDemo ? " · DEMO" : ""}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {lastSyncTime && (
            <div className="hidden border-l border-slate-200 pl-3 sm:block">
              <div className="text-[10px] uppercase tracking-wide text-slate-400">Last Synced</div>
              <div className="text-xs font-medium text-slate-600" title={dateTime(lastSyncTime?.toString())}>
                {ago(lastSyncTime?.toString())}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
            title="Refresh prices from live engine & sync connected accounts"
          >
            <span>{syncing ? "🔄 Syncing…" : "🔄 Refresh Prices"}</span>
          </button>

          <a
            href={`/api/portfolios/export?id=${selectedPortfolioId}`}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            title="Download current positions as CSV"
          >
            <span>⬇ Export CSV</span>
          </a>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
          >
            <span>+ Add Holding</span>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <span>📄 Import CSV</span>
          </button>

          <button
            onClick={() => setShowTxModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <span>📋 Transactions</span>
          </button>

          <button
            onClick={() => setShowConnectModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-indigo-500"
          >
            <span>🔗 Connect Broker</span>
          </button>
        </div>
      </div>

      {/* 1. Summary Cards */}
      <PortfolioSummaryCards analytics={analytics} />

      {/* 1b. Sprint B — Cashflow & Realized P&L (deposit-aware, IRR) */}
      <CashFlowSummary analytics={analytics} />

      {/* 2. Allocation Charts */}
      <PortfolioAllocationCharts analytics={analytics} />

      {/* 2b. Sprint B — Overlap + Rebalance */}
      <OverlapMatrix analytics={analytics} />
      <RebalancePanel analytics={analytics} />

      {/* 3. Benchmark Attribution & NAV Erosion Diagnostics */}
      <BenchmarkAttribution analytics={analytics} />

      {/* 4. Projected Dividend Income Calendar */}
      <DividendForecastCalendar
        monthlyDividends={analytics.monthlyDividends}
        annualTotal={analytics.annualDividendIncome}
      />

      {/* 5. Positions & Holdings Table */}
      <PositionsTable
        positions={analytics.positions}
        onPositionDeleted={() => refreshData()}
      />

      {/* Security & Provenance Banner */}
      <div className="flex flex-wrap items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs text-slate-500 shadow-sm">
        <div className="flex items-center gap-2">
          <span>🔒</span>
          <span>
            Multi-broker security: Sensitive credentials encrypted at rest with{" "}
            <strong className="text-slate-800">AES-256-GCM</strong>. Market values and performance metrics
            are resolved dynamically through the ETF pricing engine.
          </span>
        </div>
        <div className="text-slate-400">
          Tracking {analytics.portfolioCount} accounts ({analytics.positionCount} total positions)
        </div>
      </div>

      {/* Modals */}
      <ConnectBrokerModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        onSuccess={() => refreshData()}
      />

      <CsvImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        portfolios={analytics.portfolios}
        selectedPortfolioId={selectedPortfolioId}
        onSuccess={() => refreshData()}
      />

      <AddPositionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        portfolios={analytics.portfolios}
        selectedPortfolioId={selectedPortfolioId}
        onSuccess={() => refreshData()}
      />

      <TransactionLedgerModal
        isOpen={showTxModal}
        onClose={() => setShowTxModal(false)}
        portfolios={analytics.portfolios}
        selectedPortfolioId={selectedPortfolioId}
      />
    </div>
  );
}
