import { Badge } from "@/components/ui";
import { dateShort } from "@/lib/format";
import type { AccountFit, EarningsStatus, OptionContract } from "@/lib/wheel";

export function AcctFlag({ fit }: { fit: AccountFit }) {
  const cls = fit.flag === "R" ? "bg-violet-100 text-violet-800 ring-violet-200" : fit.flag === "T" ? "bg-sky-100 text-sky-800 ring-sky-200" : "bg-slate-100 text-slate-700 ring-slate-200";
  const full = fit.flag === "R" ? "Retirement account (IRA)" : fit.flag === "T" ? "Taxable account" : "Either account type";
  return (
    <span title={`${full}. ${fit.reasons.join(" ")} General guidance, not tax advice.`}>
      <Badge className={cls}>{fit.flag}</Badge>
    </span>
  );
}

export function EarningsBadge({ status, days, date, estimated }: { status: EarningsStatus; days: number | null; date?: string | null; estimated?: boolean }) {
  if (status === "unknown" || days == null) return <Badge className="bg-slate-100 text-slate-500 ring-slate-200">date unknown</Badge>;
  const est = estimated ? " (estimated)" : "";
  if (status === "inside")
    return (
      <span title={`Earnings ${dateShort(date)}${est} fall BEFORE this option expires.`}>
        <Badge className="bg-rose-100 text-rose-800 ring-rose-300">earnings in {days}d · before expiry</Badge>
      </span>
    );
  return (
    <span title={`Next earnings ${dateShort(date)}${est}, after this option expires.`}>
      <Badge className={days <= 14 ? "bg-amber-100 text-amber-800 ring-amber-200" : "bg-slate-100 text-slate-600 ring-slate-200"}>earnings in {days}d{estimated ? "~" : ""}</Badge>
    </span>
  );
}

export function DeltaCell({ c }: { c: OptionContract }) {
  if (c.delta == null) return <>N/A</>;
  return (
    <span title={c.deltaSource === "model" ? "Delta modelled with Black-Scholes from the option's implied volatility (the data feed gave none)." : "Delta supplied by the data feed."}>
      {c.deltaSource === "model" ? "≈" : ""}
      {Math.abs(c.delta).toFixed(2)}
    </span>
  );
}

export function SourceBadge({ source, fallbackReason }: { source: string | null; fallbackReason: string | null }) {
  if (!source) return null;
  const backup = source === "yahoo" && !!fallbackReason;
  return (
    <span title={fallbackReason ? `Backup provider used. ${fallbackReason}` : source === "alpaca" ? "Alpaca option data" : "Yahoo option data"}>
      <Badge className={backup ? "bg-amber-50 text-amber-800 ring-amber-200" : "bg-emerald-50 text-emerald-700 ring-emerald-200"}>{source === "alpaca" ? "Alpaca" : backup ? "Yahoo (backup)" : "Yahoo"}</Badge>
    </span>
  );
}
