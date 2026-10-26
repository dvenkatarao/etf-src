"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { UNIVERSE } from "@/lib/universe";
import { BASE_STOCK_UNIVERSE } from "@/lib/stock-universe";
import { formatNyClock, usCashSession } from "@/lib/market-session";
import { useTheme } from "@/components/ThemeProvider";
import RegimeChip, { type RegimeChipData } from "@/components/RegimeChip";
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
  CloseIcon,
  MenuIcon,
  SearchIcon,
  SunIcon,
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

const WHEEL_SUBPAGES = new Set(["calculator", "guide"]);

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  // /wheel is the screener; /wheel/AAPL is a ticker. Calculator and guide are siblings, not children.
  if (href === "/wheel") {
    if (pathname === "/wheel") return true;
    const seg = pathname.startsWith("/wheel/") ? pathname.slice("/wheel/".length) : "";
    return Boolean(seg) && !seg.includes("/") && !WHEEL_SUBPAGES.has(seg);
  }
  return pathname === href || pathname.startsWith(href + "/");
}
function labActive(pathname: string | null, links: readonly { href: string }[]) {
  if (!pathname) return false;
  if (links.some((l) => l.href === "/screener") && pathname.startsWith("/etf")) return true;
  if (links.some((l) => l.href === "/wheel" || l.href.startsWith("/wheel/"))) {
    return pathname === "/wheel" || pathname.startsWith("/wheel/");
  }
  return links.some((l) => isActive(pathname, l.href));
}

function BrandMark() {
  return (
    <span
      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 font-mono text-[11px] font-extrabold tracking-tight text-slate-950 shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/40"
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
        placeholder="Ticker"
        className="w-28 rounded-lg border border-slate-800 bg-slate-900/90 py-1.5 pl-8 pr-2 font-mono text-xs uppercase tracking-wide text-slate-200 placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-500 focus:border-emerald-500/60 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
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
          className="absolute right-0 z-50 mt-1.5 w-44 overflow-hidden rounded-lg border border-white/10 bg-[#0f172a] py-1 shadow-xl shadow-black/40"
          role="listbox"
        >
          {hits.map((h, i) => (
            <li key={`${h.kind}-${h.ticker}`} role="option" aria-selected={i === hi}>
              <button
                type="button"
                onMouseEnter={() => setHi(i)}
                onClick={() => goTo(h)}
                className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-sm ${i === hi ? "bg-emerald-500/15 text-white" : "text-slate-200 hover:bg-white/5"}`}
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

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      onClick={toggle}
      className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Currently ${isDark ? "dark" : "light"} — click for ${isDark ? "light" : "dark"}`}
    >
      {isDark ? <SunIcon size={15} /> : <ThemeIcon size={15} />}
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
    s.session === "open" ? "bg-emerald-400" : s.session === "closed" ? "bg-slate-500" : "bg-amber-400";
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
  open,
  onOpen,
  onClose,
}: {
  label: string;
  Icon?: ComponentType<IconProps>;
  links: readonly NavLink[];
  pathname: string | null;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const active = labActive(pathname, links);

  return (
    <div className="relative" onMouseEnter={onOpen}>
      <button
        onClick={() => (open ? onClose() : onOpen())}
        className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-all ${
          open || active
            ? "bg-emerald-600 font-semibold text-white shadow-md shadow-emerald-600/30"
            : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
        }`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {Icon && <Icon size={14} />}
        {label}
        <span className={`ml-0.5 text-[10px] transition ${open ? "rotate-180" : ""}`}>▾</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-40 pt-2">
          <div className="min-w-[280px] rounded-xl border border-slate-800 bg-slate-900 p-1.5 shadow-xl shadow-black/40">
            <div className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-500">{label}</div>
            <div className="grid gap-0.5">
              {links.map((l) => {
                const a = isActive(pathname, l.href);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={onClose}
                    className={`flex items-start gap-2.5 rounded-lg px-2.5 py-2 ${
                      a ? "bg-emerald-500/15 text-white" : "text-slate-200 hover:bg-slate-800/80"
                    }`}
                  >
                    <l.Icon size={16} />
                    <div className="min-w-0 pt-0.5">
                      <div className="text-sm font-medium leading-none">{l.label}</div>
                      <div className={`mt-1 text-xs leading-none ${a ? "text-emerald-200/80" : "text-slate-500"}`}>{l.desc}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const navLink = (active: boolean) =>
  `inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-all ${
    active ? "bg-emerald-600 font-semibold text-white shadow-md shadow-emerald-600/30" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
  }`;

export default function Nav({ regime }: { regime?: RegimeChipData | null }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileLabOpen, setMobileLabOpen] = useState<string | null>(null);
  const [openLab, setOpenLab] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
    setOpenLab(null);
  }, [pathname]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenLab(null);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 text-slate-100 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex shrink-0 items-center gap-3">
            <BrandMark />
            <span className="hidden sm:block">
              <span className="flex items-center gap-2">
                <span className="bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-lg font-extrabold tracking-tight text-transparent">
                  Capital Lab
                </span>
              </span>
              <span className="block text-[11px] font-normal text-slate-400">US ETF &amp; options wheel research</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 rounded-xl border border-slate-800/80 bg-slate-900/80 p-1 lg:flex" onMouseLeave={() => setOpenLab(null)}>
            <Link href="/" className={navLink(isActive(pathname, "/") && pathname === "/")}>
              <DashboardIcon size={14} />
              Mission Control
            </Link>
            <LabDropdown
              label="ETF Lab"
              Icon={EtfLabIcon}
              links={ETF_LAB}
              pathname={pathname}
              open={openLab === "etf"}
              onOpen={() => setOpenLab("etf")}
              onClose={() => setOpenLab(null)}
            />
            <LabDropdown
              label="Wheel Lab"
              Icon={WheelLabIcon}
              links={WHEEL_LAB}
              pathname={pathname}
              open={openLab === "wheel"}
              onOpen={() => setOpenLab("wheel")}
              onClose={() => setOpenLab(null)}
            />
            <Link href="/portfolio" className={navLink(isActive(pathname, "/portfolio"))}>
              <PortfolioIcon size={14} />
              Portfolio
            </Link>
            <LabDropdown
              label="Insights"
              Icon={InsightsIcon}
              links={INSIGHTS}
              pathname={pathname}
              open={openLab === "insights"}
              onOpen={() => setOpenLab("insights")}
              onClose={() => setOpenLab(null)}
            />
          </nav>

          <div className="hidden shrink-0 items-center gap-2 lg:flex">
            <SmartTickerSearch />
            <RegimeChip regime={regime ?? null} />
            <ThemeToggle />
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <MarketStatus compact />
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="grid h-9 w-9 place-items-center rounded-lg border border-slate-800 bg-slate-900 text-slate-200"
              aria-label="Toggle navigation"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <CloseIcon size={16} /> : <MenuIcon size={16} />}
            </button>
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto border-t border-slate-800/60 py-2 lg:hidden">
          <Link href="/" className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium ${isActive(pathname, "/") && pathname === "/" ? "bg-emerald-600 text-white" : "text-slate-400 hover:bg-slate-800"}`}>
            Mission Control
          </Link>
          <Link href="/screener" className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium ${labActive(pathname, ETF_LAB) ? "bg-emerald-600 text-white" : "text-slate-400 hover:bg-slate-800"}`}>
            ETF Lab
          </Link>
          <Link href="/wheel" className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium ${labActive(pathname, WHEEL_LAB) || (pathname?.startsWith("/wheel") ?? false) ? "bg-emerald-600 text-white" : "text-slate-400 hover:bg-slate-800"}`}>
            Wheel Lab
          </Link>
          <Link href="/portfolio" className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium ${isActive(pathname, "/portfolio") ? "bg-emerald-600 text-white" : "text-slate-400 hover:bg-slate-800"}`}>
            Portfolio
          </Link>
          <Link href="/macro" className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium ${labActive(pathname, INSIGHTS) ? "bg-emerald-600 text-white" : "text-slate-400 hover:bg-slate-800"}`}>
            Insights
          </Link>
        </div>

        {mobileOpen && (
          <div className="w-full space-y-3 border-t border-slate-800 pb-3 pt-3 lg:hidden">
            <div className="grid grid-cols-2 gap-1">
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${isActive(pathname, "/") && pathname === "/" ? "bg-emerald-500/20 text-white" : "bg-white/5 text-slate-200"}`}
              >
                <DashboardIcon size={14} /> Mission Control
              </Link>
              <Link
                href="/portfolio"
                onClick={() => setMobileOpen(false)}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${isActive(pathname, "/portfolio") ? "bg-emerald-500/20 text-white" : "bg-white/5 text-slate-200"}`}
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
                <div key={sec.id} className={`overflow-hidden rounded-lg border ${active ? "border-emerald-500/30 bg-emerald-500/10" : "border-white/10 bg-white/5"}`}>
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
                    <div className="space-y-1 border-t border-white/10 bg-[#0f172a] px-1.5 py-1.5">
                      {sec.links.map((l) => (
                        <Link
                          key={l.href}
                          href={l.href}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center justify-between rounded-md px-3 py-2.5 ${isActive(pathname, l.href) ? "bg-emerald-500/20 text-white" : "text-slate-300 hover:bg-white/5"}`}
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
