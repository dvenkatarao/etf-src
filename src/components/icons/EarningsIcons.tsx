/**
 * App icon set — Earnings Watch + Wheel
 * All icons are 16×16 SVG, stroke-current, no fill, for theme-aware use.
 * Used in Earnings Watch, Grade/Score badges, KPIs, and Wheel header.
 */

type IconProps = { className?: string; size?: number; title?: string };

function Svg({ size = 16, className, title, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function EarningsCalendarIcon(props: IconProps) {
  return (
    <Svg {...props} title={props.title ?? "Earnings calendar"}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <circle cx="12" cy="15" r="3" />
      <path d="M12 13.5v2l1.5 1" />
    </Svg>
  );
}

export function ClockCountdownIcon(props: IconProps) {
  return (
    <Svg {...props} title={props.title ?? "Countdown"}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Svg>
  );
}

export function GradeStarIcon(props: IconProps) {
  return (
    <Svg {...props} title={props.title ?? "Grade"}>
      <path d="M12 2.5l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 14.8 7.2 17.4l.9-5.4L4.2 8.2l5.4-.8L12 2.5z" strokeWidth={1.5} />
    </Svg>
  );
}

export function ScoreGaugeIcon(props: IconProps) {
  return (
    <Svg {...props} title={props.title ?? "Score"}>
      <path d="M12 14a4 4 0 1 0-8 0 4 4 0 0 0 8 0z" />
      <path d="M12 14a7 7 0 0 1 7 7H5a7 7 0 0 1 7-7z" opacity={0.5} />
      <path d="M12 14l3-2.5" strokeWidth={2} />
    </Svg>
  );
}

export function PriceTagIcon(props: IconProps) {
  return (
    <Svg {...props} title={props.title ?? "Price"}>
      <path d="M20 12l-8-8H4a2 2 0 0 0-2 2v8l8 8 10-10z" />
      <circle cx="7.5" cy="7.5" r="1.25" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function TrendUpIcon(props: IconProps) {
  return (
    <Svg {...props} title={props.title ?? "Trend up"}>
      <path d="M5 12l5-5 4 4 5-6" />
      <path d="M15 5h5v5" />
    </Svg>
  );
}

export function TrendDownIcon(props: IconProps) {
  return (
    <Svg {...props} title={props.title ?? "Trend down"}>
      <path d="M5 12l5 5 4-4 5 6" />
      <path d="M15 19h5v-5" />
    </Svg>
  );
}

export function ShieldCheckIcon(props: IconProps) {
  return (
    <Svg {...props} title={props.title ?? "Cushion support"}>
      <path d="M12 3l7 3v6c0 4-3.2 6.5-7 7-3.8-.5-7-3-7-7V6l7-3z" />
      <path d="M8.5 12l2.2 2.2L15.5 9.5" strokeWidth={2} />
    </Svg>
  );
}

export function CashStackIcon(props: IconProps) {
  return (
    <Svg {...props} title={props.title ?? "Credit"}>
      <path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" />
      <path d="M7 11h10M7 15h10" opacity={0.6} />
      <path d="M12 11v4" strokeWidth={1.2} />
    </Svg>
  );
}

export function BuildingIcon(props: IconProps) {
  return (
    <Svg {...props} title={props.title ?? "Market cap"}>
      <rect x="4" y="3" width="16" height="18" rx="1.5" />
      <path d="M8 7h2M12 7h2M16 7h0M8 11h2M12 11h2M8 15h2M12 15h2M16 11h0M16 15h0M8 19h8" />
    </Svg>
  );
}

export function SectorIcon(props: IconProps) {
  return (
    <Svg {...props} title={props.title ?? "Sector"}>
      <path d="M3 9l9-6 9 6v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" />
      <path d="M9 21V12h6v9" />
    </Svg>
  );
}

export function WarningTriangleIcon(props: IconProps) {
  return (
    <Svg {...props} title={props.title ?? "Caps warning"}>
      <path d="M12 3l9 16H3L12 3z" />
      <path d="M12 10v5M12 17h.01" strokeWidth={2} />
    </Svg>
  );
}

export function SparklesIcon(props: IconProps) {
  return (
    <Svg {...props} title={props.title ?? "Best pick"}>
      <path d="M12 3l1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3z" />
      <path d="M19 14l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2zM5 15l1 1.5L7.5 17 6 18l-1 1.5L4 18l-1.5-1 1.5-1L5 15z" opacity={0.8} />
    </Svg>
  );
}

export function WheelIcon(props: IconProps) {
  return (
    <Svg {...props} size={props.size ?? 20} title={props.title ?? "Wheel"}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 2.5v5M12 16.5v5M2.5 12h5M16.5 12h5M5.3 5.3l3.5 3.5M15.2 15.2l3.5 3.5M5.3 18.7l3.5-3.5M15.2 8.8l3.5-3.5" opacity={0.6} />
    </Svg>
  );
}

export function EtfBarsIcon(props: IconProps) {
  return (
    <Svg {...props} title={props.title ?? "ETF"}>
      <rect x="4" y="14" width="4" height="6" rx="1" />
      <rect x="10" y="9" width="4" height="11" rx="1" />
      <rect x="16" y="4" width="4" height="16" rx="1" />
    </Svg>
  );
}

// Small dot indicator for premium color (used inside earnings header)
export function Dot({ color = "bg-amber-400", className }: { color?: string; className?: string }) {
  return <span className={`inline-block h-2 w-2 rounded-full ${color} ${className ?? ""}`} aria-hidden />;
}
