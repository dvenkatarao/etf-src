"use client";

import { useCallback, useEffect, useState } from "react";
import { PortfolioRecord, TransactionRecord } from "@/db/schema";
import { money, dateShort } from "@/lib/format";
import { AccountIcon, ImportExportIcon, TransactionsIcon } from "@/components/icons/AppIcons";

export default function TransactionLedgerModal({
  isOpen,
  onClose,
  portfolios,
  selectedPortfolioId,
}: {
  isOpen: boolean;
  onClose: () => void;
  portfolios: PortfolioRecord[];
  selectedPortfolioId?: string;
}) {
  const [activePortId, setActivePortId] = useState(
    selectedPortfolioId && selectedPortfolioId !== "all"
      ? selectedPortfolioId
      : portfolios[0]?.id || "",
  );
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [ticker, setTicker] = useState("");
  const [type, setType] = useState<"BUY" | "SELL" | "DIVIDEND" | "DEPOSIT" | "WITHDRAWAL">("BUY");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [fee, setFee] = useState("0");
  const [txDate, setTxDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadTransactions = useCallback(async (portId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/portfolios/${portId}/transactions`);
      const data = await res.json();
      setTransactions(data.transactions || []);
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen || !activePortId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-open; loading flag is set inside the async loader
    void loadTransactions(activePortId);
  }, [isOpen, activePortId, loadTransactions]);

  if (!isOpen) return null;

  const handleRecordTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePortId) return;

    setSubmitting(true);
    try {
      const calculatedAmount =
        amount || (parseFloat(quantity || "0") * parseFloat(price || "0")).toString();

      const res = await fetch(`/api/portfolios/${activePortId}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker: ticker.trim().toUpperCase() || null,
          type,
          quantity: quantity ? parseFloat(quantity) : null,
          price: price ? parseFloat(price) : null,
          amount: parseFloat(calculatedAmount),
          fee: parseFloat(fee || "0"),
          transactionDate: txDate,
          notes,
        }),
      });

      if (res.ok) {
        setShowAddForm(false);
        setTicker("");
        setQuantity("");
        setPrice("");
        setAmount("");
        setNotes("");
        loadTransactions(activePortId);
      }
    } catch {
      alert("Failed to record transaction");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="flex h-[90vh] max-h-[700px] w-full max-w-3xl flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-start gap-3">
            <TransactionsIcon size={22} />
            <div>
              <h2 className="text-lg font-bold text-slate-900">Transaction History &amp; Ledger</h2>
              <p className="text-xs text-slate-500">
                Audited log of buys, sells, dividends, and cashflow
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

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <AccountIcon size={12} />
              Account:
            </label>
            <select
              value={activePortId}
              onChange={(e) => setActivePortId(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
            >
              {portfolios.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.brokerType})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const text = await f.text();
                  const lines = text.split(/\r?\n/).filter((l) => l.trim());
                  if (lines.length < 2) { alert("CSV needs header + rows"); return; }
                  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
                  const idx = (k: string) => headers.indexOf(k);
                  const need = ["date", "type", "amount"];
                  if (need.some((k) => idx(k) === -1)) { alert("CSV needs date,type,amount columns (ticker,quantity,price,fee,notes optional)"); return; }
                  const rows: any[] = [];
                  for (let i = 1; i < lines.length; i++) {
                    const cols = lines[i].split(",").map((c) => c.trim().replace(/^\"|\"$/g, ""));
                    const type = (cols[idx("type")] ?? "").toUpperCase();
                    if (!["BUY","SELL","DIVIDEND","DEPOSIT","WITHDRAWAL"].includes(type)) continue;
                    rows.push({
                      transactionDate: cols[idx("date")],
                      type,
                      ticker: cols[idx("ticker")] || null,
                      quantity: cols[idx("quantity")] ? Number(cols[idx("quantity")]) : null,
                      price: cols[idx("price")] ? Number(cols[idx("price")]) : null,
                      amount: Number(cols[idx("amount")]),
                      fee: cols[idx("fee")] ? Number(cols[idx("fee")]) : 0,
                      notes: cols[idx("notes")] || null,
                    });
                  }
                  if (!rows.length) { alert("No valid rows"); return; }
                  const res = await fetch(`/api/portfolios/${activePortId}/transactions/batch`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rows }) });
                  if (res.ok) { alert(`Imported ${rows.length} transactions`); loadTransactions(activePortId); } else { const j = await res.json().catch(()=>({error:"failed"})); alert(j.error ?? "Import failed"); }
                  e.target.value = "";
                }}
              />
              <span className="inline-flex items-center gap-1.5"><ImportExportIcon size={12} /> Import CSV</span>
            </label>
            <a href={`data:text/csv;charset=utf-8,${encodeURIComponent("date,type,ticker,quantity,price,amount,fee,notes\n2024-01-15,DEPOSIT,, , ,10000,0,Initial funding\n2024-02-10,BUY,VOO,10,500,5000,1,DCA\n2024-03-20,SELL,VOO,5,520,2600,1,Trim\n")}`} download="transactions-sample.csv" className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">Sample CSV</a>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="rounded-xl bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
            >
              {showAddForm ? "Hide Form" : "+ Log Transaction"}
            </button>
          </div>
        </div>

        {showAddForm && (
          <form
            onSubmit={handleRecordTransaction}
            className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 text-xs"
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <label className="font-semibold text-slate-700">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5"
                >
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                  <option value="DIVIDEND">DIVIDEND</option>
                  <option value="DEPOSIT">DEPOSIT</option>
                  <option value="WITHDRAWAL">WITHDRAWAL</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Ticker</label>
                <input
                  type="text"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  placeholder="e.g. VOO"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 uppercase"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Quantity</label>
                <input
                  type="number"
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Shares"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Price / Share</label>
                <input
                  type="number"
                  step="any"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Price $"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Total Amount ($)</label>
                <input
                  type="number"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Auto if qty*price"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Date</label>
                <input
                  type="date"
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5"
                />
              </div>

              <div className="col-span-2">
                <label className="font-semibold text-slate-700">Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Monthly DCA"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5"
                />
              </div>
            </div>

            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
              >
                {submitting ? "Saving…" : "Record"}
              </button>
            </div>
          </form>
        )}

        <div className="mt-4 flex-1 overflow-y-auto rounded-2xl border border-slate-100">
          <table className="min-w-full text-xs">
            <thead className="sticky top-0 bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-left">Ticker</th>
                <th className="px-3 py-2 text-right">Shares</th>
                <th className="px-3 py-2 text-right">Price</th>
                <th className="px-3 py-2 text-right">Total Amount</th>
                <th className="px-3 py-2 text-left">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading transactions…
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No transactions recorded for this account.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2 tabular-nums text-slate-600">
                      {dateShort(tx.transactionDate)}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          tx.type === "BUY"
                            ? "bg-blue-50 text-blue-700"
                            : tx.type === "SELL"
                            ? "bg-amber-50 text-amber-700"
                            : tx.type === "DIVIDEND"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-purple-50 text-purple-700"
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-bold text-slate-900">{tx.ticker || "—"}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-600">
                      {tx.quantity ? tx.quantity.toFixed(2) : "—"}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-600">
                      {tx.price ? money(tx.price) : "—"}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-900">
                      {money(tx.amount)}
                    </td>
                    <td className="max-w-[140px] truncate px-3 py-2 text-slate-400">
                      {tx.notes || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
