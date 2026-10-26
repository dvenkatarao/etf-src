"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { PositionWithAnalytics } from "@/lib/portfolio-service";
import { money, pct, colorFor, erosionStyle } from "@/lib/format";
import { Badge, DensityToggle, TableScroll } from "@/components/ui";
import { SearchIcon } from "@/components/icons/AppIcons";
import { SUPPORTED_BROKERS, BrokerType } from "@/lib/brokers/types";

export default function PositionsTable({
  positions,
  onPositionDeleted,
}: {
  positions: PositionWithAnalytics[];
  onPositionDeleted?: () => void;
}) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<keyof PositionWithAnalytics>("marketValue");
  const [sortDir, setSortDir] = useState<1 | -1>(-1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [pending, setPending] = useState<PositionWithAnalytics | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = positions.filter((p) => {
      if (!q) return true;
      return (
        p.ticker.toLowerCase().includes(q) ||
        (p.name || "").toLowerCase().includes(q) ||
        (p.portfolioName || "").toLowerCase().includes(q) ||
        (p.brokerType || "").toLowerCase().includes(q)
      );
    });

    return list.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      if (typeof aVal === "string" && typeof bVal === "string") {
        return aVal.localeCompare(bVal) * sortDir;
      }
      return ((aVal as number) - (bVal as number)) * sortDir;
    });
  }, [positions, search, sortKey, sortDir]);

  const handleSort = (key: keyof PositionWithAnalytics) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 1 ? -1 : 1));
    } else {
      setSortKey(key);
      setSortDir(-1);
    }
  };

  const deletePosition = async (pos: PositionWithAnalytics) => {
    setNotice(null);
    setDeletingId(pos.id);
    try {
      const res = await fetch(
        `/api/portfolios/${pos.portfolioId}/positions?positionId=${pos.id}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        setPending(null);
        onPositionDeleted?.();
      } else {
        setNotice("Could not delete that position.");
      }
    } catch {
      setNotice("Could not delete that position.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Positions &amp; Holdings</h3>
          <p className="text-xs text-slate-500">
            {positions.length} holdings across connected accounts · Live pricing updated
          </p>
        </div>
        <div className="relative flex items-center">
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 opacity-80">
            <SearchIcon size={14} />
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search positions, tickers or brokers…"
            className="w-64 rounded-lg border border-slate-300 py-1.5 pl-8 pr-3 text-xs focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-[#0f172a]"
          />
        </div>
        <DensityToggle value={density} onChange={setDensity} />
      </div>

      {pending && (
        <div className="mx-4 mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <span>
            Remove <b>{pending.ticker}</b> from {pending.portfolioName || "portfolio"}?
          </span>
          <span className="flex gap-2">
            <button type="button" onClick={() => setPending(null)} className="rounded-lg border border-amber-300 bg-white px-2.5 py-1 font-medium">
              Cancel
            </button>
            <button
              type="button"
              disabled={deletingId === pending.id}
              onClick={() => void deletePosition(pending)}
              className="rounded-lg bg-rose-600 px-2.5 py-1 font-semibold text-white disabled:opacity-50"
            >
              {deletingId === pending.id ? "Removing…" : "Remove"}
            </button>
          </span>
        </div>
      )}
      {notice && <p className="mx-4 mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">{notice}</p>}

      <TableScroll density={density} className="rounded-none border-0">
        <table className="min-w-full text-xs">
          <thead className="bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th
                onClick={() => handleSort("ticker")}
                className="cursor-pointer px-4 py-3 text-left hover:text-slate-900"
              >
                Holding
              </th>
              <th className="px-3 py-3 text-left">Account</th>
              <th
                onClick={() => handleSort("quantity")}
                className="cursor-pointer px-3 py-3 text-right hover:text-slate-900"
              >
                Shares
              </th>
              <th
                onClick={() => handleSort("averageCostBasis")}
                className="cursor-pointer px-3 py-3 text-right hover:text-slate-900"
              >
                Avg Cost
              </th>
              <th
                onClick={() => handleSort("currentPrice")}
                className="cursor-pointer px-3 py-3 text-right hover:text-slate-900"
              >
                Price
              </th>
              <th
                onClick={() => handleSort("dayChangePct")}
                className="cursor-pointer px-3 py-3 text-right hover:text-slate-900"
              >
                Day
              </th>
              <th
                onClick={() => handleSort("marketValue")}
                className="cursor-pointer px-3 py-3 text-right hover:text-slate-900"
              >
                Market Value
              </th>
              <th
                onClick={() => handleSort("unrealizedGain")}
                className="cursor-pointer px-3 py-3 text-right hover:text-slate-900"
              >
                Unrealized P&amp;L
              </th>
              <th
                onClick={() => handleSort("weight")}
                className="cursor-pointer px-3 py-3 text-right hover:text-slate-900"
              >
                Weight
              </th>
              <th
                onClick={() => handleSort("ttmYield")}
                className="cursor-pointer px-3 py-3 text-right hover:text-slate-900"
              >
                Yield (Est. Div)
              </th>
              <th
                onClick={() => handleSort("expenseRatio")}
                className="cursor-pointer px-3 py-3 text-right hover:text-slate-900"
              >
                Expense
              </th>
              <th className="px-3 py-3 text-left">Erosion</th>
              <th className="px-3 py-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={13} className="py-8 text-center text-slate-400">
                  No positions match the search query.
                </td>
              </tr>
            ) : (
              filtered.map((pos) => {
                const brokerMeta = SUPPORTED_BROKERS[pos.brokerType as BrokerType];
                return (
                  <tr key={pos.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <Link
                        href={`/etf/${pos.ticker}`}
                        className="font-bold text-emerald-700 hover:underline"
                      >
                        {pos.ticker}
                      </Link>
                      <div className="max-w-[160px] truncate text-[11px] text-slate-500" title={pos.name}>
                        {pos.name || pos.ticker}
                      </div>
                    </td>

                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${
                          brokerMeta?.badgeColor || "bg-slate-100 text-slate-700 ring-slate-200"
                        }`}
                      >
                        {brokerMeta?.name || pos.portfolioName || "Broker"}
                      </span>
                      <div className="truncate text-[10px] text-slate-400">{pos.portfolioName}</div>
                    </td>

                    <td className="px-3 py-3 text-right tabular-nums text-slate-900">
                      {pos.quantity.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                    </td>

                    <td className="px-3 py-3 text-right tabular-nums text-slate-600">
                      {money(pos.averageCostBasis)}
                    </td>

                    <td className="px-3 py-3 text-right font-medium tabular-nums text-slate-900">
                      {money(pos.currentPrice)}
                      {pos.priceSource === "cost_basis" && (
                        <span className="ml-1 rounded bg-amber-100 px-1 text-[9px] font-semibold text-amber-800" title="No market price available; value shown at cost basis">
                          COST
                        </span>
                      )}
                      {(pos.priceSource === "last_close" || pos.priceSource === "stored") && (
                        <span className="ml-1 rounded bg-slate-100 px-1 text-[9px] font-semibold text-slate-600" title="Live quote unavailable; showing last stored close">
                          LAST
                        </span>
                      )}
                    </td>

                    <td
                      className={`px-3 py-3 text-right font-medium tabular-nums ${colorFor(
                        pos.dayChangePct,
                      )}`}
                    >
                      {pct(pos.dayChangePct, 2, true)}
                    </td>

                    <td className="px-3 py-3 text-right font-bold tabular-nums text-slate-900">
                      {money(pos.marketValue)}
                    </td>

                    <td className="px-3 py-3 text-right tabular-nums">
                      <div className={`font-semibold ${colorFor(pos.unrealizedGain)}`}>
                        {pos.unrealizedGain && pos.unrealizedGain > 0 ? "+" : ""}
                        {money(pos.unrealizedGain)}
                      </div>
                      <div className={`text-[10px] ${colorFor(pos.unrealizedGainPct)}`}>
                        {pct(pos.unrealizedGainPct, 2, true)}
                      </div>
                    </td>

                    <td className="px-3 py-3 text-right font-semibold tabular-nums text-slate-800">
                      {pct(pos.weight, 1)}
                    </td>

                    <td className="px-3 py-3 text-right tabular-nums">
                      <div className="font-semibold text-emerald-700">
                        {pos.ttmYield ? pct(pos.ttmYield, 2) : "N/A"}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {pos.annualDividendIncome > 0
                          ? `${money(pos.annualDividendIncome, 0)}/yr`
                          : "–"}
                      </div>
                    </td>

                    <td className="px-3 py-3 text-right tabular-nums text-slate-600">
                      {pos.expenseRatio !== null && pos.expenseRatio !== undefined
                        ? pct(pos.expenseRatio, 2)
                        : "N/A"}
                    </td>

                    <td className="px-3 py-3">
                      <Badge className={erosionStyle[pos.erosionLevel || "n/a"]}>
                        {pos.erosionLevel || "n/a"}
                      </Badge>
                    </td>

                    <td className="px-3 py-3 text-center">
                      <button
                        onClick={() => {
                          setNotice(null);
                          setPending(pos);
                        }}
                        disabled={deletingId === pos.id}
                        className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                        title="Delete position"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </TableScroll>
    </div>
  );
}
