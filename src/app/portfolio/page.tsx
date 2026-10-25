import { getPortfolioAnalytics } from "@/lib/portfolio-service";
import PortfolioDashboard from "@/components/portfolio/PortfolioDashboard";
import { PageHeader } from "@/components/ui";
import { PageIcon, PortfolioIcon } from "@/components/icons/AppIcons";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const metadata = {
  title: "Multi-Broker Portfolio Tracking · Capital Lab",
  description:
    "Aggregate and analyze holdings from Charles Schwab, Fidelity, Vanguard, NinjaTrader, and MooMoo. Track asset allocation, dividend projections, benchmark alpha, fee drag, and NAV erosion risk.",
};

export default async function PortfolioPage() {
  const initialAnalytics = await getPortfolioAnalytics();

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<PageIcon label="Portfolio"><PortfolioIcon size={22} /></PageIcon>}
        title="Multi-Broker Portfolio Tracking"
        description="Import CSV statements from Charles Schwab, Fidelity, Vanguard, NinjaTrader, MooMoo or any broker (live account linking is not available yet; demo accounts are labelled). Track asset allocation look-through, dividend income cashflow, benchmark beta, and risk diagnostics."
      />

      <PortfolioDashboard initialAnalytics={initialAnalytics} />
    </div>
  );
}
