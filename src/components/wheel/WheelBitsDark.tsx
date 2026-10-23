import type { AccountFit, EarningsStatus, OptionContract } from "@/lib/wheel";
import { dateShort } from "@/lib/format";

export function AcctFlagDark({ fit }: { fit: AccountFit }) {
  const cls = fit.flag === "R" ? "bg-violet-500/20 text-violet-300 ring-violet-500/30" : fit.flag === "T" ? "bg-sky-500/20 text-sky-300 ring-sky-500/30" : "bg-slate-700/60 text-slate-300 ring-slate-600/30";
  const full = fit.flag === "R" ? "Retirement account (IRA)" : fit.flag === "T" ? "Taxable account" : "Either account type";
  return (
    <span title={`${full}. ${fit.reasons.join(" ")} General guidance, not tax advice.`}>
      <span className={`inline-flex h-6 w-6 place-items-center justify-center rounded-full text-xs font-bold ring-1 ${cls}`}>{fit.flag}</span>
    </span>
  );
}

export function EarningsBadgeDark({ status, days, date, estimated }: { status: EarningsStatus; days: number | null; date?: string | null; estimated?: boolean }) {
  if (status === "unknown" || days == null) return <span className="rounded-full bg-slate-700/60 px-2 py-1 text-[11px] text-slate-400 ring-1 ring-slate-600/30">date unknown</span>;
  const est = estimated ? " (estimated)" : "";
  if (status === "inside")
    return (
      <span title={`Earnings ${dateShort(date)}${est} fall BEFORE this option expires.`}>
        <span className="rounded-full bg-rose-500/20 px-2 py-1 text-[11px] font-semibold text-rose-300 ring-1 ring-rose-500/30">earnings in {days}d · before expiry</span>
      </span>
    );
  return (
    <span title={`Next earnings ${dateShort(date)}${est}, after this option expires.`}>
      <span className={`rounded-full px-2 py-1 text-[11px] font-medium ring-1 ${days <= 14 ? "bg-amber-500/15 text-amber-300 ring-amber-500/20" : "bg-slate-700/50 text-slate-300 ring-slate-600/20"}`}>earnings in {days}d{estimated ? "~" : ""}</span>
    </span>
  );
}

export function DeltaCellDark({ c }: { c: OptionContract }) {
  if (c.delta == null) return <>N/A</>;
  return (
    <span title={c.deltaSource === "model" ? "Delta modelled with Black-Scholes from the option's implied volatility (the data feed gave none)." : "Delta supplied by the data feed."}>
      {c.deltaSource === "model" ? "≈" : ""}
      {Math.abs(c.delta).toFixed(2)}
    </span>
  );
}

export function SourceBadgeDark({ source, fallbackReason }: { source: string | null; fallbackReason: string | null }) {
  if (!source) return null;
  const backup = source === "yahoo" && !!fallbackReason;
  return (
    <span title={fallbackReason ? `Backup provider used. ${fallbackReason}` : source === "alpaca" ? "Alpaca option data" : "Yahoo option data"}>
      <span className={`rounded-full px-2 py-1 text-[11px] font-medium ring-1 ${backup ? "bg-amber-500/15 text-amber-300 ring-amber-500/20" : "bg-emerald-500/15 text-emerald-300 ring-emerald-500/20"}`}>{source === "alpaca" ? "Alpaca" : backup ? "Yahoo (backup)" : "Yahoo"}</span>
    </span>
  );
}
