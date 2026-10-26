"use client";

import { useState } from "react";
import { PortfolioRecord } from "@/db/schema";
import { UNIVERSE } from "@/lib/universe";

export default function AddPositionModal({
  isOpen,
  onClose,
  portfolios,
  selectedPortfolioId,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  portfolios: PortfolioRecord[];
  selectedPortfolioId?: string;
  onSuccess: () => void;
}) {
  const [targetPortId, setTargetPortId] = useState(
    selectedPortfolioId && selectedPortfolioId !== "all"
      ? selectedPortfolioId
      : portfolios[0]?.id || "",
  );
  const [ticker, setTicker] = useState("");
  const [quantity, setQuantity] = useState("");
  const [averageCostBasis, setAverageCostBasis] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [assetType, setAssetType] = useState<"ETF" | "EQUITY" | "BOND" | "FUTURES">("ETF");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPortId) {
      setError("Please select a target portfolio");
      return;
    }
    if (!ticker.trim()) {
      setError("Please enter a ticker symbol");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/portfolios/${targetPortId}/positions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker: ticker.trim().toUpperCase(),
          quantity: parseFloat(quantity),
          averageCostBasis: parseFloat(averageCostBasis),
          purchaseDate,
          assetType,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add position");
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error saving position");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Add Holding</h2>
            <p className="text-xs text-slate-500">Add an individual position manually</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-slate-700">Account</label>
            <select
              value={targetPortId}
              onChange={(e) => setTargetPortId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
            >
              {portfolios.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.brokerType})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700">Ticker Symbol</label>
              <input
                type="text"
                list="ticker-suggestions"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="e.g. VOO, SCHD"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs uppercase focus:border-emerald-500 focus:outline-none"
                required
              />
              <datalist id="ticker-suggestions">
                {UNIVERSE.slice(0, 30).map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Asset Type</label>
              <select
                value={assetType}
                onChange={(e) =>
                  setAssetType(e.target.value as "ETF" | "EQUITY" | "BOND" | "FUTURES")
                }
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
              >
                <option value="ETF">ETF</option>
                <option value="EQUITY">Individual Stock</option>
                <option value="BOND">Fixed Income / Bond</option>
                <option value="FUTURES">Futures / Derivative</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700">Quantity (Shares)</label>
              <input
                type="number"
                step="any"
                min="0.0001"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 50"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Avg Cost Basis ($)</label>
              <input
                type="number"
                step="any"
                min="0"
                value={averageCostBasis}
                onChange={(e) => setAverageCostBasis(e.target.value)}
                placeholder="e.g. 485.50"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">Purchase Date</label>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-500 disabled:opacity-50"
            >
              {loading ? "Saving…" : "Save Position"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
