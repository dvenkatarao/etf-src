import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import type { RegimeLabel } from "@/lib/macro-regime";

export type RegimeChipData = {
  title: string;
  summary: string;
  asOf: string | null;
  label: RegimeLabel;
};

const TONE: Record<RegimeLabel, string> = {
  stress: "border-rose-800/50 bg-rose-950/60 text-rose-200 hover:border-rose-500/40",
  tightening: "border-amber-800/50 bg-amber-950/60 text-amber-200 hover:border-amber-500/40",
  easing: "border-emerald-800/50 bg-emerald-950/60 text-emerald-200 hover:border-emerald-500/40",
  neutral: "border-slate-800 bg-slate-900 text-cyan-300 hover:border-slate-600",
};

export default function RegimeChip({ regime }: { regime: RegimeChipData | null }) {
  const title = regime?.title ?? "N/A";
  const tip = regime
    ? `${regime.title}${regime.asOf ? ` · as of ${regime.asOf}` : ""}\n${regime.summary}\nOpen Macro for the full picture.`
    : "No FRED snapshot yet. Open Macro.";
  const cls = regime ? TONE[regime.label] : "border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-600";

  return (
    <Link
      href="/macro"
      title={tip}
      className={`hidden max-w-[200px] items-center gap-2 rounded-lg border px-3 py-1.5 font-mono text-xs transition xl:flex ${cls}`}
    >
      <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
      <span className="shrink-0 text-slate-500">Regime:</span>
      <span className="min-w-0 line-clamp-2 font-semibold leading-tight">{title}</span>
    </Link>
  );
}
