"use client";

import { useState } from "react";
import { SUPPORTED_BROKERS, BrokerType } from "@/lib/brokers/types";

export default function ConnectBrokerModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [selectedBroker, setSelectedBroker] = useState<BrokerType>("schwab");
  const [customName, setCustomName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [method, setMethod] = useState<"sandbox" | "snaptrade" | "plaid">("sandbox");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentMeta = SUPPORTED_BROKERS[selectedBroker];

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/portfolios/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brokerType: selectedBroker,
          customName: customName || `${currentMeta.name} Portfolio`,
          accountNumber: accountNumber || "12345678",
          connectionMethod: method,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Connection failed");
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Connect Brokerage Account</h2>
            <p className="text-xs text-slate-500">
              Direct institutional API integration &amp; AES-256-GCM token encryption
            </p>
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

        <form onSubmit={handleConnect} className="mt-4 space-y-4">
          {/* Broker Selector Grid */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Select Brokerage
            </label>
            <div className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {(
                ["schwab", "fidelity", "vanguard", "ninjatrader", "moomoo", "manual"] as BrokerType[]
              ).map((type) => {
                const b = SUPPORTED_BROKERS[type];
                const isSelected = selectedBroker === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setSelectedBroker(type);
                      setCustomName(`${b.name} Account`);
                    }}
                    className={`flex flex-col items-start rounded-2xl border p-3 text-left transition ${
                      isSelected
                        ? "border-teal-600 bg-teal-50/50 ring-2 ring-teal-600"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="font-bold text-slate-900 text-xs">{b.name}</div>
                    <div className="mt-0.5 line-clamp-1 text-[10px] text-slate-500">{b.tagline}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-slate-700">Account Label</label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={`${currentMeta.name} Primary`}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Account Number (Optional)</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="e.g. 88421098 (auto-masked)"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Connection Method */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
            <div className="text-xs font-semibold text-slate-800">Connection Mode</div>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setMethod("sandbox")}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  method === "sandbox"
                    ? "bg-teal-600 text-white"
                    : "bg-white text-slate-700 border border-slate-200"
                }`}
              >
                Demo account (sample data)
              </button>
              <button
                type="button"
                disabled
                title="Not available in this build"
                className="cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-400"
              >
                SnapTrade (coming soon)
              </button>
              <button
                type="button"
                disabled
                title="Not available in this build"
                className="cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-400"
              >
                Plaid (coming soon)
              </button>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              Creates a clearly-labelled DEMO account with sample positions so you can explore the analytics. These are
              not your real holdings. To track real positions, create an account and use Import CSV with your broker&apos;s
              statement export.
            </p>
          </div>

          {/* Security Note */}
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800">
            <span>🔒</span>
            <span>
              Any credentials stored by this app are encrypted at rest with <strong>AES-256-GCM</strong>. Live broker
              login is not supported, so no brokerage passwords are ever requested.
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
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
              className="rounded-xl bg-teal-600 px-5 py-2 text-xs font-semibold text-white shadow hover:bg-teal-500 disabled:opacity-50"
            >
              {loading ? "Connecting…" : `Connect ${currentMeta.name}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
