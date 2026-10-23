import type { Metadata } from "next";
import type { ReactNode } from "react";
import Nav from "@/components/Nav";
import { Disclaimer } from "@/components/ui";
import "./globals.css";

export const metadata: Metadata = {
  title: "ETF Research Lab - live, source-verified US ETF analytics",
  description:
    "Screen, compare and analyse US ETFs with live data: returns, dividends, NAV-erosion proxy, expense ratios, holdings, analyst consensus, macro and market news. Every figure shows its source and timestamp.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-100 text-slate-900 antialiased">
        <Nav />
        <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-7xl px-4 pb-10">
          <div className="border-t border-slate-200 pt-4">
            <Disclaimer />
          </div>
        </footer>
      </body>
    </html>
  );
}
