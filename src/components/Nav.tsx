import Link from "next/link";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/screener", label: "Screener" },
  { href: "/compare", label: "Compare" },
  { href: "/recommend", label: "Recommend" },
  { href: "/wheel", label: "Wheel" },
  { href: "/macro", label: "Macro" },
  { href: "/news", label: "News & Events" },
  { href: "/sources", label: "Data Sources" },
  { href: "/coverage", label: "Coverage" },
];

export default function Nav() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-slate-900/90">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-white">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-500 text-sm font-bold tracking-tight">E</span>
          <span className="text-[15px] font-semibold tracking-tight">ETF Research Lab</span>
        </Link>
        <nav className="flex flex-wrap gap-1 text-[13px] font-medium">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-md px-3 py-1.5 text-slate-300 transition hover:bg-slate-800 hover:text-white">
              {l.label}
            </Link>
          ))}
        </nav>
        <form action="/etf" method="GET" className="ml-auto flex items-center gap-2" id="ticker-form">
          <TickerGo />
        </form>
      </div>
    </header>
  );
}

function TickerGo() {
  return (
    <>
      <input
        name="q"
        placeholder="Ticker (e.g. SCHD)"
        className="w-40 rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm uppercase text-white placeholder:normal-case placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none"
        maxLength={10}
        aria-label="Look up an ETF by ticker"
      />
      <button className="rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-400">Go</button>
    </>
  );
}
