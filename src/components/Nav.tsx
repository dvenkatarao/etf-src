"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { UNIVERSE } from "@/lib/universe";
import { BASE_STOCK_UNIVERSE } from "@/lib/stock-universe";

// ---------- Dropdown data ----------
const ETF_LAB = [
  { href: "/screener", label: "Screener", desc: "Filter 115 ETFs by cost, yield, return" },
  { href: "/compare", label: "Compare", desc: "Up to 5 ETFs head-to-head" },
  { href: "/recommend", label: "Recommend", desc: "Goal-based ranked picks" },
  { href: "/coverage", label: "Coverage", desc: "How complete is the data?" },
  { href: "/sources", label: "Data Sources", desc: "Catalog & live health" },
] as const;

const WHEEL_LAB = [
  { href: "/wheel", label: "Wheel Screener", desc: "Cash-secured puts on A/A+ stocks" },
  { href: "/wheel/guide", label: "Guide", desc: "15-step wheel manual" },
] as const;

const INSIGHTS = [
  { href: "/macro", label: "Macro", desc: "Rates, curve, regime & FOMC/BLS" },
  { href: "/news", label: "News & Events", desc: "Fed, SEC 8-K, headline feeds" },
] as const;

// ---------- Helpers ----------
function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}
function labActive(pathname: string | null, links: readonly { href: string }[]) {
  return links.some((l) => isActive(pathname, l.href));
}

// ---------- Smart ticker search ----------
function SmartTickerSearch({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");

  const etfSet = useMemo(() => new Set(UNIVERSE.map((s) => s.toUpperCase())), []);
  const stockSet = useMemo(() => new Set(BASE_STOCK_UNIVERSE.map((s) => s.toUpperCase())), []);

  function go(e?: React.FormEvent) {
    e?.preventDefault();
    const t = q.trim().toUpperCase().replace(/\s+/g, "");
    if (!t) return;
    // Basic ticker validation: 1-10 alphanum + .-
    if (!/^[A-Z0-9.\-]{1,10}$/.test(t)) {
      // Still try ETF page — it will show unavailable with guidance
      router.push(`/etf/${encodeURIComponent(t)}`);
      onNavigate?.();
      return;
    }
    // Prefer ETF universe first (no overlap for most, but clean priority)
    if (etfSet.has(t)) {
      router.push(`/etf/${encodeURIComponent(t)}`);
    } else if (stockSet.has(t)) {
      router.push(`/wheel/${encodeURIComponent(t)}`);
    } else {
      // Unknown: try stock prefix heuristic — $AAPL or leading $?
      // Fall back to ETF page which shows helpful “not an ETF” and links to wheel/screener
      router.push(`/etf/${encodeURIComponent(t)}`);
    }
    setQ("");
    onNavigate?.();
  }

  return (
    <form onSubmit={go} className="flex items-center gap-1.5" role="search" aria-label="Search ticker">
      <div className="relative">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="SCHD or AAPL…"
          className="w-[170px] rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 pr-8 text-sm uppercase tracking-wide text-white placeholder:normal-case placeholder:text-slate-500 placeholder:tracking-normal focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 sm:w-[200px]"
          maxLength={10}
          aria-label="Search ETF or stock ticker"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
        />
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500">↵</span>
      </div>
      <button
        type="submit"
        className="rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
      >
        Go
      </button>
    </form>
  );
}

// ---------- Desktop dropdown ----------
function LabDropdown({
  label,
  icon,
  links,
  pathname,
  onCloseMobile,
}: {
  label: string;
  icon?: string;
  links: readonly { href: string; label: string; desc: string }[];
  pathname: string | null;
  onCloseMobile?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = labActive(pathname, links);

  // Close on outside click / ESC / route change
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);
  // close when path changes
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition ${
          active ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
        }`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {icon && <span className="text-xs opacity-70">{icon}</span>}
        {label}
        <span className={`ml-0.5 text-[10px] transition ${open ? "rotate-180" : ""}`}>▾</span>
      </button>
      {open && (
        <div
          onMouseLeave={() => setOpen(false)}
          className="absolute left-0 top-full z-40 mt-2 min-w-[300px] rounded-xl border border-slate-800 bg-slate-900 p-1.5 shadow-2xl shadow-black/30"
        >
          <div className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-500">{label}</div>
          <div className="grid gap-1">
            {links.map((l) => {
              const a = isActive(pathname, l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => {
                    setOpen(false);
                    onCloseMobile?.();
                  }}
                  className={`rounded-lg px-3 py-2 transition ${a ? "bg-indigo-600 text-white" : "text-slate-200 hover:bg-slate-800 hover:text-white"}`}
                >
                  <div className="text-sm font-medium leading-none">{l.label}</div>
                  <div className={`mt-1 text-xs leading-none ${a ? "text-indigo-100" : "text-slate-400"}`}>{l.desc}</div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Main Nav ----------
export default function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileLabOpen, setMobileLabOpen] = useState<string | null>(null);
  const pathname = usePathname();

  // close mobile when route changes (pathname effect)
  useEffect(() => setMobileOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-slate-900/90">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-2 gap-y-2 px-4 py-2.5">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 text-white shrink-0">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-500 text-sm font-bold tracking-tight">E</span>
          <span className="hidden text-[15px] font-semibold tracking-tight sm:inline">ETF Research Lab</span>
        </Link>

        {/* Desktop primary */}
        <nav className="hidden items-center gap-1 text-[13px] font-medium lg:flex">
          <Link
            href="/"
            className={`rounded-md px-2.5 py-1.5 transition ${isActive(pathname, "/") && pathname === "/" ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}
          >
            Dashboard
          </Link>

          {/* Start CTA */}
          <Link
            href="/onboarding"
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${isActive(pathname, "/onboarding") ? "bg-white text-indigo-700" : "bg-indigo-600 text-white hover:bg-indigo-500"}`}
          >
            Start →
          </Link>

          <LabDropdown label="ETF Lab" icon="📊" links={ETF_LAB} pathname={pathname} />
          <LabDropdown label="Wheel Lab" icon="◎" links={WHEEL_LAB} pathname={pathname} />

          <Link
            href="/portfolio"
            className={`rounded-md px-2.5 py-1.5 transition ${isActive(pathname, "/portfolio") ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}
          >
            Portfolio
          </Link>

          <LabDropdown label="Insights" links={INSIGHTS} pathname={pathname} />
        </nav>

        {/* Search — desktop */}
        <div className="ml-auto hidden lg:flex items-center gap-3">
          <div className="hidden xl:flex items-center gap-2 text-[11px] text-slate-400">
            <span className="hidden 2xl:inline">Search works on both — ETFs & wheel stocks</span>
          </div>
          <SmartTickerSearch />
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen((o) => !o)}
          className="ml-auto grid h-9 w-9 place-items-center rounded-md border border-slate-700 bg-slate-800 text-slate-300 lg:hidden"
          aria-label="Toggle navigation"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? "✕" : "☰"}
        </button>

        {/* Mobile panel */}
        {mobileOpen && (
          <div className="w-full lg:hidden border-t border-slate-800 pt-3 pb-2 space-y-3">
            {/* Quick actions */}
            <Link
              href="/onboarding"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Start in 60s — 3 questions →
            </Link>

            <div className="grid gap-2">
              {/* Dashboard + Portfolio standalone */}
              <div className="grid grid-cols-2 gap-1">
                <Link href="/" onClick={() => setMobileOpen(false)} className={`rounded-md px-3 py-2 text-sm font-medium ${isActive(pathname, "/") && pathname === "/" ? "bg-white text-slate-900" : "bg-slate-800 text-slate-200"}`}>Dashboard</Link>
                <Link href="/portfolio" onClick={() => setMobileOpen(false)} className={`rounded-md px-3 py-2 text-sm font-medium ${isActive(pathname, "/portfolio") ? "bg-white text-slate-900" : "bg-slate-800 text-slate-200"}`}>Portfolio</Link>
              </div>

              {/* Labs - accordion */}
              {[
                { id: "etf", title: "ETF Lab", icon: "📊", links: ETF_LAB, desc: "Funds research" },
                { id: "wheel", title: "Wheel Lab", icon: "◎", links: WHEEL_LAB, desc: "Options strategy" },
                { id: "insights", title: "Insights", icon: "◈", links: INSIGHTS, desc: "Context & health" },
              ].map((sec) => {
                const active = labActive(pathname, sec.links);
                const expanded = mobileLabOpen === sec.id;
                return (
                  <div key={sec.id} className={`overflow-hidden rounded-lg border ${active ? "border-indigo-500/30 bg-indigo-500/10" : "border-slate-800 bg-slate-800/50"}`}>
                    <button
                      onClick={() => setMobileLabOpen(expanded ? null : sec.id)}
                      className="flex w-full items-center justify-between px-3 py-2.5 text-left"
                      aria-expanded={expanded}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{sec.icon}</span>
                        <span className={`text-sm font-semibold ${active ? "text-white" : "text-slate-200"}`}>{sec.title}</span>
                        <span className="text-xs text-slate-400 hidden sm:inline">· {sec.desc}</span>
                      </div>
                      <span className={`text-xs text-slate-400 transition ${expanded ? "rotate-180" : ""}`}>▾</span>
                    </button>
                    {expanded && (
                      <div className="border-t border-slate-700 bg-slate-900 px-1.5 py-1.5 space-y-1">
                        {sec.links.map((l) => (
                          <Link
                            key={l.href}
                            href={l.href}
                            onClick={() => setMobileOpen(false)}
                            className={`flex items-center justify-between rounded-md px-3 py-2.5 ${isActive(pathname, l.href) ? "bg-white text-slate-900" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}
                          >
                            <span className="text-sm font-medium">{l.label}</span>
                            <span className="text-xs text-slate-500 ml-2 truncate max-w-[160px] text-right hidden sm:block">{l.desc}</span>
                            <span className={`ml-auto text-xs ${isActive(pathname, l.href) ? "text-slate-600" : "text-slate-500"}`}>→</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Mobile search — always visible in panel */}
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
              <div className="mb-2 text-xs font-medium text-slate-300">Search any ticker — ETF or stock</div>
              <SmartTickerSearch onNavigate={() => setMobileOpen(false)} />
              <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                <span className="text-slate-300 font-medium">SCHD, VOO, BND</span> → ETF page &nbsp;·&nbsp; <span className="text-slate-300 font-medium">AAPL, NVDA, BRK-B</span> → Wheel page
              </p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
