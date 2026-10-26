import type { WheelResults } from "@/lib/wheel-service";
import {
  CashStackIcon,
  PriceTagIcon,
  ScoreGaugeIcon,
  ShieldCheckIcon,
  TrendUpIcon,
} from "@/components/icons/EarningsIcons";

type Props = {
  res: WheelResults;
  fMinGrade: string;
};

export default function WheelKpis({ res }: Props) {
  const putsPassing = res.rows.length;
  const above200 = res.rows.filter((r) => r.ctx.sma200 != null && r.ctx.price >= r.ctx.sma200).length;
  const bestAnn = Math.max(0, ...res.rows.map((r) => r.best.annRoc * 100));
  const avgAnn = res.rows.length ? res.rows.reduce((s, r) => s + r.best.annRoc, 0) / res.rows.length * 100 : 0;
  const avgDelta = res.rows.length ? res.rows.reduce((s, r) => s + Math.abs(r.best.contract.delta ?? 0), 0) / res.rows.length : 0;

  const tiles = [
    { label: "PUTS PASSING", value: String(putsPassing), color: "text-emerald-600 dark:text-emerald-400", icon: CashStackIcon },
    { label: "ABOVE 200-DAY MA", value: String(above200), color: "text-sky-600 dark:text-sky-400", icon: TrendUpIcon },
    { label: "BEST ANNUAL RETURN", value: `${bestAnn.toFixed(1)}%`, color: "text-emerald-600 dark:text-emerald-400", icon: PriceTagIcon },
    { label: "AVG ANNUAL RETURN", value: `${avgAnn.toFixed(1)}%`, color: "text-fuchsia-600 dark:text-fuchsia-400", icon: ScoreGaugeIcon },
    { label: "AVG DELTA", value: avgDelta.toFixed(2), color: "text-amber-600 dark:text-amber-400", icon: ShieldCheckIcon },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {tiles.map((t) => {
        const Icon = t.icon;
        return (
          <div
            key={t.label}
            className="rounded-xl border border-slate-200 bg-white px-4 py-4 text-center shadow-sm dark:border-slate-800 dark:bg-[#0f172a]"
          >
            <div className="mx-auto mb-1 grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <Icon size={14} />
            </div>
            <div className={`text-2xl font-bold tracking-tight ${t.color}`}>{t.value || "—"}</div>
            <div className="mt-1 text-[10px] font-semibold tracking-[0.12em] text-slate-500 dark:text-slate-400">{t.label}</div>
          </div>
        );
      })}
    </div>
  );
}
