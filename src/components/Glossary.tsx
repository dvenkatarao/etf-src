import { HelpIcon } from "@/components/icons/AppIcons";

export default function Glossary() {
  return (
    <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <summary className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
        <HelpIcon size={16} />
        Quick glossary — hover the column header for more
      </summary>
      <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-3">
        <div><dt className="font-semibold text-slate-800">TTM yield</dt><dd className="text-slate-600">Sum of last 12 months distributions ÷ current price. Not a forecast.</dd></div>
        <div><dt className="font-semibold text-slate-800">Price return vs total return</dt><dd className="text-slate-600">Price excludes distributions; total reinvests them. Gap is income; long gap without price growth = NAV erosion.</dd></div>
        <div><dt className="font-semibold text-slate-800">Sharpe 3Y</dt><dd className="text-slate-600">(3Y annualised total return − 3M T-bill) ÷ 3Y volatility. Higher is better.</dd></div>
        <div><dt className="font-semibold text-slate-800">Vol 3Y / Max drawdown</dt><dd className="text-slate-600">Annualised volatility = stddev of daily total returns × √252. Drawdown = worst peak-to-trough loss.</dd></div>
        <div><dt className="font-semibold text-slate-800">NAV erosion</dt><dd className="text-slate-600">Proxy: if 3Y price return is negative while paying, distributions are funded by price loss. Severe ≤−6%/yr.</dd></div>
        <div><dt className="font-semibold text-slate-800">Quality grade A–F</dt><dd className="text-slate-600">Cost, size/track, ease of trading, diversification, income sustainability. Not a return forecast.</dd></div>
        <div><dt className="font-semibold text-slate-800">Rates: Defensive / Sensitive</dt><dd className="text-slate-600">Defensive holds up when yields rise (short bonds, low-vol); sensitive falls.</dd></div>
      </dl>
      <p className="mt-2 text-[11px] text-slate-500">Full formulas: <a href="/sources" className="underline">Data Sources & spec</a>. No estimates — missing shows N/A.</p>
    </details>
  );
}
