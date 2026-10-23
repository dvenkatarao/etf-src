import type { WheelResults } from "@/lib/wheel-service";

type Props = {
  res: WheelResults;
  fMinGrade: string;
};

export default function WheelKpis({ res }: Props) {
  // Derive KPIs from filtered rows + general info
  const putsPassing = res.rows.length;
  const above200 = res.rows.filter((r) => r.ctx.sma200 != null && r.ctx.price >= r.ctx.sma200).length;
  const bestAnn = Math.max(0, ...res.rows.map((r) => r.best.annRoc * 100));
  const avgAnn = res.rows.length ? res.rows.reduce((s, r) => s + r.best.annRoc, 0) / res.rows.length * 100 : 0;
  const avgDelta = res.rows.length ? res.rows.reduce((s, r) => s + Math.abs(r.best.contract.delta ?? 0), 0) / res.rows.length : 0;

  const tiles = [
    { label: "PUTS PASSING", value: String(putsPassing), color: "text-emerald-400" },
    { label: "ABOVE 200-DAY MA", value: String(above200), color: "text-sky-400" },
    { label: "BEST ANNUAL RETURN", value: `${bestAnn.toFixed(1)}%`, color: "text-emerald-400" },
    { label: "AVG ANNUAL RETURN", value: `${avgAnn.toFixed(1)}%`, color: "text-fuchsia-400" },
    { label: "AVG DELTA", value: avgDelta.toFixed(2), color: "text-amber-400" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {tiles.map((t) => (
        <div
          key={t.label}
          className="rounded-xl border border-slate-800 bg-[#0F1A3A] px-4 py-4 text-center shadow-sm"
        >
          <div className={`text-2xl font-bold tracking-tight ${t.color}`}>{t.value || "—"}</div>
          <div className="mt-1 text-[10px] font-semibold tracking-[0.12em] text-slate-400">{t.label}</div>
        </div>
      ))}
    </div>
  );
}
