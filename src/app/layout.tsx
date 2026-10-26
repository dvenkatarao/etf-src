import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import AppChrome from "@/components/AppChrome";
import { Disclaimer } from "@/components/ui";
import { ThemeProvider } from "@/components/ThemeProvider";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/600.css";
import "@fontsource/jetbrains-mono/700.css";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Capital Lab — live, source-verified US market research",
  description:
    "Screen ETFs, run the options wheel, and track a portfolio with live, source-stamped data: returns, dividends, NAV-erosion, holdings, cash-secured puts, macro and market news. Every figure shows its source and timestamp.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k='theme';var s=localStorage.getItem(k);var m=window.matchMedia('(prefers-color-scheme: dark)').matches;var t=s|| (m?'dark':'light'); if(!s) t='dark'; document.documentElement.classList.toggle('dark', t==='dark'); document.documentElement.classList.toggle('light', t!=='dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen bg-[var(--bg-canvas)] font-sans text-[var(--text-primary)] antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
        <ThemeProvider>
          <AppChrome />
          <main className="mx-auto w-full max-w-7xl px-4 pb-6 pt-6 sm:px-6 lg:px-8">{children}</main>
          <footer className="mt-10 border-t border-slate-800 bg-slate-950 py-8 text-xs text-slate-500">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
              <div className="flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-emerald-500/20 font-mono text-[10px] font-bold text-emerald-400">CL</span>
                <span className="font-bold text-slate-300">Capital Lab</span>
                <span className="text-slate-600">|</span>
                <span>US ETF &amp; options wheel research · delayed quotes</span>
              </div>
              <nav className="flex shrink-0 flex-wrap gap-x-4 gap-y-1 text-[11px]" aria-label="Help and data">
                <Link href="/coverage" className="hover:text-emerald-400">
                  Coverage
                </Link>
                <Link href="/sources" className="hover:text-emerald-400">
                  Data sources
                </Link>
                <Link href="/wheel/guide" className="hover:text-emerald-400">
                  Wheel guide
                </Link>
              </nav>
            </div>
            <div className="mx-auto mt-4 max-w-7xl border-t border-slate-900 px-4 pt-4 sm:px-6 lg:px-8">
              <Disclaimer />
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
