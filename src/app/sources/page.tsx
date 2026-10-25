import SourcesBrowser from "@/components/SourcesBrowser";
import { Card, PageHeader } from "@/components/ui";
import { HelpIcon, PageIcon } from "@/components/icons/AppIcons";
import { ANALYST_FINDINGS, KNOWN_GAPS, SOURCES, VERIFIED_ON } from "@/lib/sources";

export const dynamic = "force-dynamic";
export const metadata = { title: "Data source catalog · ETF Research Lab" };

export default function SourcesPage() {
  const categories = Array.from(new Set(SOURCES.map((s) => s.category)));
  const live = SOURCES.filter((s) => s.verification === "live").length;
  const docs = SOURCES.filter((s) => s.verification === "docs").length;
  const failed = SOURCES.filter((s) => s.verification === "failed").length;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<PageIcon label="Help"><HelpIcon size={22} /></PageIcon>}
        title="Free data source catalog"
        description={`Every source below was either called live from this app's environment or read in the provider's official documentation on ${VERIFIED_ON}. ${live} verified live, ${docs} verified in official docs (API key needed), ${failed} flagged do-not-use. Run the live health check to re-test keyless endpoints right now.`}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Analyst opinions: what is actually available" subtitle="Read before promising 'analyst ratings' in an ETF app">
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">{ANALYST_FINDINGS.map((x) => <li key={x}>{x}</li>)}</ul>
        </Card>
        <Card title="Known gaps (not available free)" subtitle="The app shows N/A for these instead of inventing values">
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">{KNOWN_GAPS.map((x) => <li key={x}>{x}</li>)}</ul>
        </Card>
      </div>

      <SourcesBrowser sources={SOURCES} categories={categories} verifiedOn={VERIFIED_ON} />
    </div>
  );
}
