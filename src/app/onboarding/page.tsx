import { PageHeader } from "@/components/ui";
import { PageIcon, StartIcon } from "@/components/icons/AppIcons";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import { getAllEtfs, getQuotes } from "@/lib/etf-service";
import { STARTER_PORTFOLIOS } from "@/lib/starter-portfolios";

export const dynamic = "force-dynamic";
export const metadata = { title: "Get started — 3 questions · Capital Lab" };

export default async function OnboardingPage() {
  const all = await getAllEtfs();
  const starterTickers = Array.from(new Set(STARTER_PORTFOLIOS.flatMap((s) => s.holdings.map((h) => h.ticker))));
  // Try to get live quotes for starter tickers; fallback to null if unavailable
  let prices: Record<string, number | null> = {};
  try {
    const { quotes } = await getQuotes(starterTickers);
    for (const t of starterTickers) prices[t] = quotes.get(t)?.price ?? null;
    // Also fill from stored rows if quote missing
    for (const t of starterTickers) if (prices[t] == null) prices[t] = all.find((r) => r.ticker === t)?.lastClose ?? null;
  } catch { /* ignore */ }

  return (
    <div>
      <PageHeader
        icon={<PageIcon label="Start"><StartIcon size={22} /></PageIcon>}
        title="New here? 3 questions → a starting point"
        description="Answer goal, horizon and risk — we map you to a ranked goal + a starter portfolio you can build in one click and then edit. No advice, no account, no trade placed."
      />
      <div className="mt-6 rounded-2xl border border-teal-200 bg-teal-50 p-4 text-sm leading-relaxed text-teal-900">
        <b>How it works:</b> 1) Pick what you want (income/growth/balanced/defensive) + when you need it + how much drawdown you tolerate → 2) See 3 vetted starter allocations (conservative, balanced, growth) with why + watch-outs → 3) “Build in Portfolio” creates a manual portfolio sized to $10k at last prices — edit from there. All data is provider-sourced; scores are percentile-ranked on past data.
      </div>
      <div className="mt-6">
        <OnboardingWizard prices={prices} />
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3 text-xs text-slate-500">
        <div className="rounded-xl border border-slate-200 bg-white p-3"><b className="text-slate-800">Why not a robo?</b> We don't manage money or know your taxes. We show diversified, low-cost starters and let you compare/rank before you commit.</div>
        <div className="rounded-xl border border-slate-200 bg-white p-3"><b className="text-slate-800">What if my answers change?</b> The wizard is stateless — come back, change goal/horizon/risk, get new picks. Your Portfolio tracker keeps what you built.</div>
        <div className="rounded-xl border border-slate-200 bg-white p-3"><b className="text-slate-800">Jargon?</b> TTM = trailing 12-mo distributions ÷ price. NAV erosion = price decay proxy. Hover any column header for plain-English.</div>
      </div>
    </div>
  );
}
