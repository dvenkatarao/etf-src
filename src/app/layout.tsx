import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
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
      <body className="min-h-screen bg-[var(--bg-canvas)] font-sans text-[var(--text-primary)] antialiased transition-colors">
        <ThemeProvider>
          <Nav />
          <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">{children}</main>
          <footer className="mx-auto max-w-[1600px] px-4 pb-10 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-4 sm:flex-row sm:items-start sm:justify-between">
              <Disclaimer />
              <nav className="flex shrink-0 flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500" aria-label="Help and data">
                <Link href="/coverage" className="hover:text-emerald-700 dark:hover:text-emerald-400">
                  Coverage
                </Link>
                <Link href="/sources" className="hover:text-emerald-700 dark:hover:text-emerald-400">
                  Data sources
                </Link>
                <Link href="/wheel/guide" className="hover:text-emerald-700 dark:hover:text-emerald-400">
                  Wheel guide
                </Link>
              </nav>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
