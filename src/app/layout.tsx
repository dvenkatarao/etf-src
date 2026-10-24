import type { Metadata } from "next";
import type { ReactNode } from "react";
import Nav from "@/components/Nav";
import { Disclaimer } from "@/components/ui";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "ETF Research Lab - live, source-verified US ETF analytics",
  description:
    "Screen, compare and analyse US ETFs with live data: returns, dividends, NAV-erosion proxy, expense ratios, holdings, analyst consensus, macro and market news. Every figure shows its source and timestamp.",
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
      <body className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] antialiased transition-colors">
        <ThemeProvider>
          <Nav />
          <main className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">{children}</main>
          <footer className="mx-auto max-w-[1600px] px-4 pb-10 sm:px-6 lg:px-8">
            <div className="border-t border-[var(--border)] pt-4">
              <Disclaimer />
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
