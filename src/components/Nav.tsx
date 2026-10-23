"use client";

import Link from "next/link";
import { useState } from "react";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/onboarding", label: "Start" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/screener", label: "Screener" },
  { href: "/compare", label: "Compare" },
  { href: "/recommend", label: "Recommend" },
  { href: "/wheel", label: "Wheel" },
  { href: "/macro", label: "Macro" },
  { href: "/news", label: "News" },
  { href: "/sources", label: "Sources" },
  { href: "/coverage", label: "Coverage" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-slate-900/90">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5">
        <Link href="/" className="flex items-center gap-2 text-white">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-500 text-sm font-bold tracking-tight">E</span>
          <span className="text-[15px] font-semibold tracking-tight">ETF Research Lab</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden flex-wrap gap-1 text-[13px] font-medium lg:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={`rounded-md px-2.5 py-1.5 transition hover:bg-slate-800 hover:text-white ${l.href === "/onboarding" ? "bg-indigo-600 text-white hover:bg-indigo-500" : "text-slate-300"}`}>
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button onClick={() => setOpen((o) => !o)} className="ml-auto grid h-9 w-9 place-items-center rounded-md border border-slate-700 bg-slate-800 text-slate-300 lg:hidden" aria-label="Toggle navigation">
          {open ? "✕" : "☰"}
        </button>

        <form action="/etf" method="GET" className="ml-auto hidden items-center gap-2 lg:flex" id="ticker-form">
          <TickerGo />
        </form>

        {/* Mobile panel */}
        {open && (
          <div className="w-full lg:hidden">
            <nav className="grid grid-cols-2 gap-1 border-t border-slate-800 pt-2 text-[13px] font-medium">
              {LINKS.map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white">
                  {l.label}
                </Link>
              ))}
            </nav>
            <form action="/etf" method="GET" className="mt-2 flex items-center gap-2 border-t border-slate-800 pt-2">
              <TickerGo />
            </form>
          </div>
        )}
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
        className="w-36 rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm uppercase text-white placeholder:normal-case placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none sm:w-40"
        maxLength={10}
        aria-label="Look up an ETF by ticker"
      />
      <button className="rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-400">Go</button>
    </>
  );
}
