"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { UNIVERSE } from "@/lib/universe";
import { BASE_STOCK_UNIVERSE } from "@/lib/stock-universe";
import { formatNyClock, usCashSession } from "@/lib/market-session";
import { useTheme } from "@/components/ThemeProvider";
import {
  CompareIcon,
  DashboardIcon,
  EtfLabIcon,
  InsightsIcon,
  NotificationsIcon,
  OptionsIcon,
  type IconProps,
  PortfolioIcon,
  ResearchIcon,
  ScreenerIcon,
  SearchIcon,
  ThemeIcon,
  WheelLabIcon,
} from "@/components/icons/AppIcons";

type NavLink = { href: string; label: string; desc: string; Icon: ComponentType<IconProps> };

const ETF_LAB: readonly NavLink[] = [
  { href: "/screener", label: "Screener", desc: "Filter ETFs by cost, yield, return", Icon: ScreenerIcon },
  { href: "/compare", label: "Compare", desc: "Up to 5 ETFs head-to-head", Icon: CompareIcon },
  { href: "/recommend", label: "Recommend", desc: "Goal-based ranked picks", Icon: ResearchIcon },
];

const WHEEL_LAB: readonly NavLink[] = [
  { href: "/wheel", label: "Wheel Screener", desc: "Cash-secured puts on A/A+ stocks", Icon: OptionsIcon },
  { href: "/wheel/calculator", label: "Payoff & cycle", desc: "P&L diagram, CSP→CC, expected move", Icon: ResearchIcon },
];

const INSIGHTS: readonly NavLink[] = [
  { href: "/macro", label: "Macro", desc: "Rates, curve, regime & FOMC/BLS", Icon: InsightsIcon },
  { href: "/news", label: "News & Events", desc: "Fed, SEC 8-K, headline feeds", Icon: NotificationsIcon },
];

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}
function labActive(pathname: string | null, links: readonly { href: string }[]) {
  return links.some((l) => isActive(pathname, l.href));
}

function BrandMark() {
  return (
    <span
      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-teal-500/15 font-mono text-[11px] font-semibold tracking-tight text-teal-300 ring-1 ring-teal-400/30"
      aria-hidden
    >
      CL
    </span>
  );
}

type Hit = { ticker: string; kind: "ETF" | "Stock" };

function SmartTickerSearch({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const wrap = useRef<HTMLFormElement>(null);

  const catalog = useMemo<Hit[]>(() => {
    const etfs = UNIVERSE.map((t) => ({ ticker: t, kind: "ETF" as const }));
    const stocks = BASE_STOCK_UNIVERSE.filter((t) => !UNIVERSE.includes(t)).map((t) => ({ ticker: t, kind: "Stock" as const }));
    return [...etfs, ...stocks];
  }, []);

  const needle = q.trim().toUpperCase();
  const hits = useMemo(() => {
    if (needle.length < 1) return [];
    const starts = catalog.filter((h) => h.ticker.startsWith(needle));
    const rest = catalog.filter((h) => !h.ticker.startsWith(needle) && h.ticker.includes(needle));
    return [...starts, ...rest].slice(0, 8);
  }, [catalog, needle]);

  useEffect(() => setHi(0), [needle]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function goTo(hit: Hit) {
    router.push(hit.kind === "Stock" ? `/wheel/${encodeURIComponent(hit.ticker)}` : `/etf/${encodeURIComponent(hit.ticker)}`);
    setQ("");
    setOpen(false);
    onNavigate?.();
  }

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (hits[hi]) {
      goTo(hits[hi]);
      return;
    }
    const t = needle.replace(/\s+/g, "");
    if (!t) return;
    goTo({ ticker: t, kind: catalog.find((h) => h.ticker === t)?.kind ?? "ETF" });
  }

  return (
    <form ref={wrap} onSubmit={submit} className="relative" role="search" aria-label="Jump to ticker">
      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
        <SearchIcon size={14} />
      </span>
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHi((i) => Math.min(i + 1, Math.max(0, hits.length - 1)));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHi((i) => Math.max(i - 1, 0));
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        placeholder="Jump to ticker"
        className="w-[200px] rounded-md border border-white/10 bg-white/5 py-1.5 pl-8 pr-3 font-mono text-sm uppercase tracking-wide text-white placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-500 focus:border-teal-400/60 focus:outline-none focus:ring-1 focus:ring-teal-400/40 sm:w-[240px]"
        maxLength={10}
        aria-label="Jump to ETF or stock ticker"
        aria-autocomplete="list"
        aria-expanded={open && hits.length > 0}
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
      />
      {open && hits.length > 0 && (
        <ul
          className="absolute right-0 z-50 mt-1.5 w-[260px] overflow-hidden rounded-lg border border-white/10 bg-[#0F1A3A] py-1 shadow-xl shadow-black/40"
          role="listbox"
        >
          {hits.map((h, i) => (
            <li key={`${h.kind}-${h.ticker}`} role="option" aria-selected={i === hi}>
              <button
                type="button"
                onMouseEnter={() => setHi(i)}
                onClick={() => goTo(h)}
                className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-sm ${i === hi ? "bg-teal-500/15 text-white" : "text-slate-200 hover:bg-white/5"}`}
              >
                <span className="font-mono font-medium tracking-wide">{h.ticker}</span>
                <span className="text-[10px] uppercase tracking-wider text-slate-500">{h.kind}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}

function ThemeToggle({ compact }: { compact?: boolean }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      onClick={toggle}
      className={`inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-teal-400/50 ${compact ? "px-2" : ""}`}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Currently ${isDark ? "dark" : "light"} — click to switch to ${isDark ? "light" : "dark"}`}
    >
      <ThemeIcon size={14} />
      <span className={compact ? "hidden sm:inline" : ""}>{isDark ? "Light" : "Dark"}</span>
    </button>
  );
}

function MarketStatus({ compact }: { compact?: boolean }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  if (!now) {
    return <span className="hidden h-5 w-40 rounded bg-white/5 xl:inline-block" aria-hidden />;
  }
  const s = usCashSession(now);
  const clock = formatNyClock(now);
  const dot =
    s.session === "open" ? "bg-teal-400" : s.session === "closed" ? "bg-slate-500" : "bg-amber-400";
  if (compact) {
    return (
      <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-300">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        <span className="text-white">{s.label}</span>
      </div>
    );
  }
  return (
    <div className="hidden items-center gap-2 font-mono text-[11px] text-slate-300 xl:flex" title="US cash session. Quotes are delayed.">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      <span className="text-white">{s.label}</span>
      <span className="text-slate-600">·</span>
      <span>{clock}</span>
      <span className="text-slate-600">·</span>
      <span>US cash · Delayed</span>
    </div>
  );
}

function LabDropdown({
  label,
  Icon,
  links,
  pathname,
}: {
  label: string;
  Icon?: ComponentType<IconProps>;
  links: readonly NavLink[];
  pathname: string | null;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = labActive(pathname, links);

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
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition ${
          active ? "bg-teal-500/15 text-teal-200" : "text-slate-300 hover:bg-white/10 hover:text-white"
        }`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {Icon && <Icon size={14} />}
        {label}
        <span className={`ml-0.5 text-[10px] transition ${open ? "rotate-180" : ""}`}>▾</span>
      </button>
      {open && (
        <div
          onMouseLeave={() => setOpen(false)}
          className="absolute left-0 top-full z-40 mt-2 min-w-[280px] rounded-xl border border-white/10 bg-[#0F1A3A] p-1.5 shadow-xl shadow-black/40"
        >
          <div className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-500">{label}</div>
          <div className="grid gap-0.5">
            {links.map((l) => {
              const a = isActive(pathname, l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-start gap-2.5 rounded-lg px-2.5 py-2 transition ${a ? "bg-teal-500/15 text-white" : "text-slate-200 hover:bg-white/5"}`}
                >
                  <l.Icon size={16} />
                  <div className="min-w-0 pt-0.5">
                    <div className="text-sm font-medium leading-none">{l.label}</div>
                    <div className={`mt-1 text-xs leading-none ${a ? "text-teal-200/80" : "text-slate-500"}`}>{l.desc}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const navLink = (active: boolean) =>
  `inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition ${
    active ? "bg-teal-500/15 text-teal-200" : "text-slate-300 hover:bg-white/10 hover:text-white"
  }`;

export default function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileLabOpen, setMobileLabOpen] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => setMobileOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#070D2A]/95 text-slate-100 backdrop-blur supports-[backdrop-filter]:bg-[#070D2A]/90">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-2 gap-y-2 px-4 py-2.5 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-white">
          <BrandMark />
          <span className="hidden text-[15px] font-semibold tracking-tight sm:inline">Capital Lab</span>
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex">
          <Link href="/" className={navLink(isActive(pathname, "/") && pathname === "/")}>
            <DashboardIcon size={14} />
            Dashboard
          </Link>
          <LabDropdown label="ETF Lab" Icon={EtfLabIcon} links={ETF_LAB} pathname={pathname} />
          <LabDropdown label="Wheel Lab" Icon={WheelLabIcon} links={WHEEL_LAB} pathname={pathname} />
          <Link href="/portfolio" className={navLink(isActive(pathname, "/portfolio"))}>
            <PortfolioIcon size={14} />
            Portfolio
          </Link>
          <LabDropdown label="Insights" Icon={InsightsIcon} links={INSIGHTS} pathname={pathname} />
        </nav>

        <div className="ml-auto hidden items-center gap-3 lg:flex">
          <MarketStatus />
          <SmartTickerSearch />
          <ThemeToggle />
        </div>

        <div className="ml-auto flex items-center gap-2 lg:hidden">
          <MarketStatus compact />
          <ThemeToggle compact />
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="grid h-9 w-9 place-items-center rounded-md border border-white/10 bg-white/5 text-slate-200"
            aria-label="Toggle navigation"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>

        {mobileOpen && (
          <div className="w-full space-y-3 border-t border-white/10 pb-2 pt-3 lg:hidden">
            <div className="grid grid-cols-2 gap-1">
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${isActive(pathname, "/") && pathname === "/" ? "bg-teal-500/20 text-white" : "bg-white/5 text-slate-200"}`}
              >
                <DashboardIcon size={14} /> Dashboard
              </Link>
              <Link
                href="/portfolio"
                onClick={() => setMobileOpen(false)}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${isActive(pathname, "/portfolio") ? "bg-teal-500/20 text-white" : "bg-white/5 text-slate-200"}`}
              >
                <PortfolioIcon size={14} /> Portfolio
              </Link>
            </div>

            {[
              { id: "etf", title: "ETF Lab", Icon: EtfLabIcon, links: ETF_LAB, desc: "Funds research" },
              { id: "wheel", title: "Wheel Lab", Icon: WheelLabIcon, links: WHEEL_LAB, desc: "Options strategy" },
              { id: "insights", title: "Insights", Icon: InsightsIcon, links: INSIGHTS, desc: "Context" },
            ].map((sec) => {
              const active = labActive(pathname, sec.links);
              const expanded = mobileLabOpen === sec.id;
              return (
                <div key={sec.id} className={`overflow-hidden rounded-lg border ${active ? "border-teal-500/30 bg-teal-500/10" : "border-white/10 bg-white/5"}`}>
                  <button
                    onClick={() => setMobileLabOpen(expanded ? null : sec.id)}
                    className="flex w-full items-center justify-between px-3 py-2.5 text-left"
                    aria-expanded={expanded}
                  >
                    <div className="flex items-center gap-2">
                      <sec.Icon size={16} />
                      <span className="text-sm font-semibold text-white">{sec.title}</span>
                      <span className="hidden text-xs text-slate-500 sm:inline">· {sec.desc}</span>
                    </div>
                    <span className={`text-xs text-slate-400 transition ${expanded ? "rotate-180" : ""}`}>▾</span>
                  </button>
                  {expanded && (
                    <div className="space-y-1 border-t border-white/10 bg-[#0F1A3A] px-1.5 py-1.5">
                      {sec.links.map((l) => (
                        <Link
                          key={l.href}
                          href={l.href}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center justify-between rounded-md px-3 py-2.5 ${isActive(pathname, l.href) ? "bg-teal-500/20 text-white" : "text-slate-300 hover:bg-white/5"}`}
                        >
                          <span className="inline-flex items-center gap-2 text-sm font-medium">
                            <l.Icon size={14} />
                            {l.label}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="mb-2 inline-flex items-center gap-2 text-xs font-medium text-slate-300">
                <SearchIcon size={14} />
                Jump to ticker
              </div>
              <SmartTickerSearch onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
