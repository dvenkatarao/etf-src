"use client";

import { useState } from "react";
import { SUPPORTED_BROKERS, BrokerType } from "@/lib/brokers/types";
import { PortfolioRecord } from "@/db/schema";
import { ImportExportIcon } from "@/components/icons/AppIcons";

export default function CsvImportModal({
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
  const [brokerType, setBrokerType] = useState<BrokerType>("schwab");
  const [csvContent, setCsvContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoadSample = () => {
    const meta = SUPPORTED_BROKERS[brokerType];
    setCsvContent(meta.sampleCsv);
    setError(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvContent(content);
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPortId) {
      setError("Please select a target portfolio");
      return;
    }
    if (!csvContent.trim()) {
      setError("CSV content is empty");
      return;
    }

    setLoading(true);
    setError(null);
    setResultMessage(null);

    try {
      const res = await fetch(`/api/portfolios/${targetPortId}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csvContent,
          preferredBroker: brokerType,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to parse CSV");
      }

      const warnings: string[] = [...(data.warnings ?? [])];
      if (data.ignoredRowsCount > 0) warnings.push(`${data.ignoredRowsCount} row(s) were skipped.`);
      setResultMessage(
        `Imported ${data.importedCount} positions.${warnings.length ? " Note: " + warnings.join(" ") : ""}`,
      );
      // Leave the dialog open longer when there is something the user needs to read.
      setTimeout(() => {
        onSuccess();
        onClose();
      }, warnings.length ? 6000 : 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "CSV import failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-start gap-3">
            <ImportExportIcon size={22} />
            <div>
            <h2 className="text-lg font-bold text-slate-900">Import Positions from CSV</h2>
            <p className="text-xs text-slate-500">
              Supports exports from Charles Schwab, Fidelity, Vanguard, NinjaTrader, MooMoo, &amp; Generic CSV
            </p>
            </div>
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
        {resultMessage && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
            {resultMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-slate-700">Target Portfolio</label>
              <select
                value={targetPortId}
                onChange={(e) => setTargetPortId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
              >
                {portfolios.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.brokerType})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Broker Export Format</label>
              <select
                value={brokerType}
                onChange={(e) => setBrokerType(e.target.value as BrokerType)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
              >
                {Object.values(SUPPORTED_BROKERS).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Paste CSV or Upload File
              </label>
              <button
                type="button"
                onClick={handleLoadSample}
                className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                Load {SUPPORTED_BROKERS[brokerType].name} Sample Data
              </button>
            </div>

            <div className="mt-1.5 flex items-center gap-2">
              <input
                type="file"
                accept=".csv,.txt,.tsv"
                onChange={handleFileUpload}
                className="block w-full text-xs text-slate-500 file:mr-3 file:rounded-xl file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
              />
            </div>

            <textarea
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              placeholder="Paste raw CSV text here..."
              rows={7}
              className="mt-2 w-full font-mono rounded-xl border border-slate-300 p-3 text-xs leading-relaxed focus:border-indigo-500 focus:outline-none"
            />
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
              disabled={loading || !csvContent.trim()}
              className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-500 disabled:opacity-50"
            >
              {loading ? "Importing & Resolving Prices…" : "Import Positions"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
