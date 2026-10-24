"use client";

import { useId, type ReactNode } from "react";

export type IconProps = { className?: string; size?: number; title?: string };

function Svg({
  size = 24,
  className,
  title,
  children,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

function useGid(name: string) {
  return `${name}-${useId().replace(/:/g, "")}`;
}

/** Rounded tile matching the dark/light icon sheet. */
export function IconTile({
  children,
  size = 36,
  className = "",
  label,
}: {
  children: ReactNode;
  size?: number;
  className?: string;
  label?: string;
}) {
  return (
    <span
      className={`inline-grid shrink-0 place-items-center rounded-[22%] bg-white shadow-[0_4px_14px_rgba(15,23,42,0.08),0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/80 dark:bg-[#161E3A] dark:shadow-[0_10px_24px_rgba(0,0,0,0.35)] dark:ring-white/5 ${className}`}
      style={{ width: size, height: size }}
      aria-hidden={label ? undefined : true}
      title={label}
    >
      {children}
    </span>
  );
}

export function PageIcon({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <IconTile size={40} label={label}>
      {children}
    </IconTile>
  );
}

/* ---------- Navigation ---------- */

export function DashboardIcon({ size = 24, className, title }: IconProps) {
  const g = useGid("dash");
  return (
    <Svg size={size} className={className} title={title ?? "Dashboard"}>
      <defs>
        <linearGradient id={g} x1="4" y1="3" x2="20" y2="22">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${g})`}
        fillRule="evenodd"
        d="M12 3.2 21 10.3V19.5A2.5 2.5 0 0 1 18.5 22h-4.2v-6.6a1.3 1.3 0 0 0-1.3-1.3h-2a1.3 1.3 0 0 0-1.3 1.3V22H5.5A2.5 2.5 0 0 1 3 19.5v-9.2L12 3.2Zm0 2.35L4.8 10.9V19.5c0 .28.22.5.5.5h2.4v-5.1A3.1 3.1 0 0 1 10.8 12.8h2.4A3.1 3.1 0 0 1 16.3 15.9v5.1h2.4a.5.5 0 0 0 .5-.5v-8.6L12 5.55Z"
      />
    </Svg>
  );
}

export function StartIcon({ size = 24, className, title }: IconProps) {
  const g = useGid("start");
  return (
    <Svg size={size} className={className} title={title ?? "Start"}>
      <defs>
        <linearGradient id={g} x1="6" y1="4" x2="20" y2="20">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${g})`}
        d="M8.2 5.15c0-.9 1-1.45 1.75-.95l10.1 6.1a1.15 1.15 0 0 1 0 1.95l-10.1 6.1c-.75.5-1.75-.05-1.75-.95V5.15Z"
      />
    </Svg>
  );
}

export function EtfLabIcon({ size = 24, className, title }: IconProps) {
  const g = useGid("etf");
  return (
    <Svg size={size} className={className} title={title ?? "ETF Lab"}>
      <defs>
        <linearGradient id={g} x1="4" y1="4" x2="20" y2="22">
          <stop offset="0%" stopColor="#4ADE80" />
          <stop offset="100%" stopColor="#16A34A" />
        </linearGradient>
      </defs>
      <rect x="3.5" y="13" width="4.4" height="8" rx="1.2" fill={`url(#${g})`} opacity={0.75} />
      <rect x="9.8" y="8.5" width="4.4" height="12.5" rx="1.2" fill={`url(#${g})`} opacity={0.9} />
      <rect x="16.1" y="3.5" width="4.4" height="17.5" rx="1.2" fill={`url(#${g})`} />
    </Svg>
  );
}

export function WheelLabIcon({ size = 24, className, title }: IconProps) {
  const g1 = useGid("w1");
  const g2 = useGid("w2");
  const slices = 6;
  const cx = 12;
  const cy = 12;
  const r = 9.2;
  const paths = Array.from({ length: slices }, (_, i) => {
    const a0 = (i / slices) * Math.PI * 2 - Math.PI / 2;
    const a1 = ((i + 1) / slices) * Math.PI * 2 - Math.PI / 2;
    const x0 = cx + r * Math.cos(a0);
    const y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy + r * Math.sin(a1);
    return `M ${cx} ${cy} L ${x0.toFixed(3)} ${y0.toFixed(3)} A ${r} ${r} 0 0 1 ${x1.toFixed(3)} ${y1.toFixed(3)} Z`;
  });
  return (
    <Svg size={size} className={className} title={title ?? "Wheel Lab"}>
      <defs>
        <linearGradient id={g1} x1="4" y1="4" x2="20" y2="20">
          <stop offset="0%" stopColor="#C4B5FD" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id={g2} x1="20" y1="4" x2="4" y2="20">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#4F46E5" />
        </linearGradient>
      </defs>
      {paths.map((d, i) => (
        <path key={i} d={d} fill={i % 2 === 0 ? `url(#${g1})` : `url(#${g2})`} />
      ))}
    </Svg>
  );
}

export function PortfolioIcon({ size = 24, className, title }: IconProps) {
  const g = useGid("port");
  return (
    <Svg size={size} className={className} title={title ?? "Portfolio"}>
      <defs>
        <linearGradient id={g} x1="4" y1="4" x2="20" y2="20">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${g})`}
        d="M8.5 7.2V6.4A2.4 2.4 0 0 1 10.9 4h2.2A2.4 2.4 0 0 1 15.5 6.4v.8H19a2.2 2.2 0 0 1 2.2 2.2v9.2A2.2 2.2 0 0 1 19 21H5a2.2 2.2 0 0 1-2.2-2.2V9.4A2.2 2.2 0 0 1 5 7.2h3.5Zm1.8-.8c0-.33.27-.6.6-.6h2.2c.33 0 .6.27.6.6v.8h-3.4V6.4ZM3.8 12.2h16.4v1.6H3.8v-1.6Z"
      />
    </Svg>
  );
}

export function InsightsIcon({ size = 24, className, title }: IconProps) {
  const g = useGid("ins");
  return (
    <Svg size={size} className={className} title={title ?? "Insights"}>
      <defs>
        <linearGradient id={g} x1="8" y1="2" x2="16" y2="22">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="55%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${g})`}
        d="M12 2.2a6.6 6.6 0 0 1 4.1 11.8c-.7.55-1.15 1.2-1.35 1.9H9.25c-.2-.7-.65-1.35-1.35-1.9A6.6 6.6 0 0 1 12 2.2Zm-2.4 16.1h4.8c.1.55.1 1.1 0 1.5l-.3.9A1.6 1.6 0 0 1 12.6 22h-1.2a1.6 1.6 0 0 1-1.5-1.3l-.3-.9c-.1-.4-.1-.95 0-1.5Z"
      />
      <path
        d="M12 4.2v1.6M17.3 6.7l-1.1 1.1M6.7 6.7l1.1 1.1M19.2 12h-1.6M6.4 12H4.8"
        stroke={`url(#${g})`}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function ScreenerIcon({ size = 24, className, title }: IconProps) {
  const g = useGid("scr");
  return (
    <Svg size={size} className={className} title={title ?? "Screener"}>
      <defs>
        <linearGradient id={g} x1="4" y1="3" x2="20" y2="21">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
      </defs>
      <circle cx="10.5" cy="10.5" r="6.3" stroke={`url(#${g})`} strokeWidth="2.4" />
      <path d="M15.4 15.4 20.2 20.2" stroke={`url(#${g})`} strokeWidth="2.6" strokeLinecap="round" />
    </Svg>
  );
}

export function ResearchIcon({ size = 24, className, title }: IconProps) {
  const g = useGid("res");
  return (
    <Svg size={size} className={className} title={title ?? "Research"}>
      <defs>
        <linearGradient id={g} x1="3" y1="4" x2="21" y2="20">
          <stop offset="0%" stopColor="#7DD3FC" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
      </defs>
      <rect x="3.2" y="14.2" width="3.2" height="6.3" rx="0.9" fill={`url(#${g})`} opacity={0.7} />
      <rect x="7.6" y="11.2" width="3.2" height="9.3" rx="0.9" fill={`url(#${g})`} opacity={0.85} />
      <rect x="12" y="7.6" width="3.2" height="12.9" rx="0.9" fill={`url(#${g})`} />
      <path d="M16.2 9.2c1.6-2.1 3.2-3.8 4.6-5.2M20.8 3.6h-3.4v3.3" stroke={`url(#${g})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function WatchlistIcon({ size = 24, className, title }: IconProps) {
  const g = useGid("star");
  return (
    <Svg size={size} className={className} title={title ?? "Watchlist"}>
      <defs>
        <linearGradient id={g} x1="12" y1="2" x2="12" y2="22">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${g})`}
        d="M12 3.1 14.7 8.6l6.1.9-4.4 4.3 1 6.1L12 16.9 6.6 19.9l1-6.1L3.2 9.5l6.1-.9L12 3.1Z"
      />
    </Svg>
  );
}

export function CompareIcon({ size = 24, className, title }: IconProps) {
  const g1 = useGid("c1");
  const g2 = useGid("c2");
  return (
    <Svg size={size} className={className} title={title ?? "Compare"}>
      <defs>
        <linearGradient id={g1} x1="3" y1="6" x2="15" y2="20">
          <stop offset="0%" stopColor="#93C5FD" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id={g2} x1="9" y1="3" x2="21" y2="16">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
      </defs>
      <rect x="2.8" y="7.2" width="11.6" height="11.6" rx="2.6" fill={`url(#${g1})`} />
      <rect x="9.6" y="3.2" width="11.6" height="11.6" rx="2.6" fill={`url(#${g2})`} />
    </Svg>
  );
}

/* ---------- Utility / actions ---------- */

export function FiltersIcon({ size = 24, className, title }: IconProps) {
  const g = useGid("fil");
  return (
    <Svg size={size} className={className} title={title ?? "Filters"}>
      <defs>
        <linearGradient id={g} x1="6" y1="3" x2="18" y2="22">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#6D28D9" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${g})`}
        d="M4.4 4.2h15.2c.9 0 1.4 1 0.9 1.75L14.8 12.4v6.3c0 .5-.28.96-.73 1.2l-3.2 1.7a1.15 1.15 0 0 1-1.67-1.02v-8.18L3.5 5.95c-.5-.75 0-1.75.9-1.75Z"
      />
    </Svg>
  );
}

export function OptionsIcon({ size = 24, className, title }: IconProps) {
  const g = useGid("opt");
  return (
    <Svg size={size} className={className} title={title ?? "Options"}>
      <defs>
        <linearGradient id={g} x1="4" y1="4" x2="20" y2="20">
          <stop offset="0%" stopColor="#4ADE80" />
          <stop offset="100%" stopColor="#16A34A" />
        </linearGradient>
      </defs>
      <circle cx="7.2" cy="16.6" r="3.6" fill={`url(#${g})`} />
      <circle cx="16.8" cy="7.4" r="3.6" fill={`url(#${g})`} />
      <path d="M9.8 14.2 14.2 9.8" stroke={`url(#${g})`} strokeWidth="2.4" strokeLinecap="round" />
    </Svg>
  );
}

export function ImportExportIcon({ size = 24, className, title }: IconProps) {
  const g = useGid("imp");
  return (
    <Svg size={size} className={className} title={title ?? "Import / Export"}>
      <defs>
        <linearGradient id={g} x1="6" y1="2" x2="18" y2="22">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${g})`}
        d="M7 3.2h7.2L18.8 8v11.3A2.5 2.5 0 0 1 16.3 21.8H7.7A2.5 2.5 0 0 1 5.2 19.3V5.7A2.5 2.5 0 0 1 7.7 3.2H7Z"
      />
      <path d="M14.1 3.4v4.2h4.3" fill="#DBEAFE" opacity={0.85} />
      <path d="M12 10.4v6.2M9.4 14.2 12 16.8l2.6-2.6" stroke="#EFF6FF" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function TransactionsIcon({ size = 24, className, title }: IconProps) {
  const g = useGid("tx");
  return (
    <Svg size={size} className={className} title={title ?? "Transactions"}>
      <defs>
        <linearGradient id={g} x1="3" y1="4" x2="21" y2="20">
          <stop offset="0%" stopColor="#FDBA74" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
      </defs>
      <path fill={`url(#${g})`} d="M4 8.2h11.2l-2.6-2.6 1.3-1.3L19.3 8.2 13.9 13.6l-1.3-1.3 2.6-2.6H4V8.2Z" />
      <path fill={`url(#${g})`} d="M20 15.8H8.8l2.6 2.6-1.3 1.3L4.7 15.8 10.1 10.4l1.3 1.3-2.6 2.6H20v1.5Z" />
    </Svg>
  );
}

export function SettingsIcon({ size = 24, className, title }: IconProps) {
  const g = useGid("set");
  return (
    <Svg size={size} className={className} title={title ?? "Settings"}>
      <defs>
        <linearGradient id={g} x1="4" y1="3" x2="20" y2="21">
          <stop offset="0%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${g})`}
        fillRule="evenodd"
        d="M10.05 2.7h3.9l.55 2.15a6.9 6.9 0 0 1 1.85.95l2.15-.7 1.95 3.38-1.6 1.55c.12.5.2 1.02.2 1.55s-.08 1.05-.2 1.55l1.6 1.55-1.95 3.38-2.15-.7a6.9 6.9 0 0 1-1.85.95l-.55 2.15h-3.9l-.55-2.15a6.9 6.9 0 0 1-1.85-.95l-2.15.7L2.7 15.18l1.6-1.55A6.7 6.7 0 0 1 4.1 12c0-.53.08-1.05.2-1.55L2.7 8.9 4.65 5.52l2.15.7a6.9 6.9 0 0 1 1.85-.95l.4-2.57Zm1.95 6.05A3.25 3.25 0 1 0 15.25 12 3.25 3.25 0 0 0 12 8.75Z"
      />
    </Svg>
  );
}

export function HelpIcon({ size = 24, className, title }: IconProps) {
  const g = useGid("help");
  return (
    <Svg size={size} className={className} title={title ?? "Help"}>
      <defs>
        <linearGradient id={g} x1="4" y1="3" x2="20" y2="21">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="9.2" stroke={`url(#${g})`} strokeWidth="2.2" />
      <path
        d="M9.6 9.4a2.4 2.4 0 1 1 3.3 2.22c-.7.32-1.1.78-1.1 1.58v.3"
        stroke={`url(#${g})`}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="16.7" r="1.05" fill={`url(#${g})`} />
    </Svg>
  );
}

export function AccountIcon({ size = 24, className, title }: IconProps) {
  const g = useGid("acc");
  return (
    <Svg size={size} className={className} title={title ?? "Account"}>
      <defs>
        <linearGradient id={g} x1="6" y1="3" x2="18" y2="22">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="8" r="3.6" fill={`url(#${g})`} />
      <path fill={`url(#${g})`} d="M5.2 19.4c.7-3.6 3.3-5.5 6.8-5.5s6.1 1.9 6.8 5.5c.1.55-.3 1.1-.9 1.1H6.1c-.6 0-1-.55-.9-1.1Z" />
    </Svg>
  );
}

export function NotificationsIcon({ size = 24, className, title }: IconProps) {
  const g = useGid("bell");
  return (
    <Svg size={size} className={className} title={title ?? "Notifications"}>
      <defs>
        <linearGradient id={g} x1="6" y1="3" x2="18" y2="20">
          <stop offset="0%" stopColor="#FB7185" />
          <stop offset="100%" stopColor="#E11D48" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${g})`}
        d="M12 3.2a5.6 5.6 0 0 1 5.6 5.6v3.15l1.35 2.7c.28.55-.12 1.2-.74 1.2H5.79c-.62 0-1.02-.65-.74-1.2L6.4 11.95V8.8A5.6 5.6 0 0 1 12 3.2Zm-2.35 14.9h4.7a2.35 2.35 0 0 1-4.7 0Z"
      />
      <circle cx="17.6" cy="6.2" r="2.15" fill="#FB7185" />
    </Svg>
  );
}

export function ThemeIcon({ size = 24, className, title }: IconProps) {
  const g = useGid("moon");
  return (
    <Svg size={size} className={className} title={title ?? "Theme"}>
      <defs>
        <linearGradient id={g} x1="6" y1="3" x2="18" y2="20">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${g})`}
        d="M13.4 3.3A8.7 8.7 0 1 0 20.7 14.2 7.15 7.15 0 0 1 13.4 3.3Z"
      />
    </Svg>
  );
}

export function SearchIcon({ size = 24, className, title }: IconProps) {
  const g = useGid("search");
  return (
    <Svg size={size} className={className} title={title ?? "Search"}>
      <defs>
        <linearGradient id={g} x1="4" y1="3" x2="20" y2="21">
          <stop offset="0%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
      </defs>
      <circle cx="10.6" cy="10.6" r="6.1" stroke={`url(#${g})`} strokeWidth="2.3" />
      <path d="M15.3 15.3 20.1 20.1" stroke={`url(#${g})`} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}


