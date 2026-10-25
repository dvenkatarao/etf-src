import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-400/80">Not found</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">This page isn’t here</h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">The link may be old, or the ticker isn’t in the universe. Nothing was guessed.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link href="/" className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500">
          Home
        </Link>
        <Link href="/screener" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#0F1A3A] dark:text-slate-200">
          ETF screener
        </Link>
        <Link href="/wheel" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#0F1A3A] dark:text-slate-200">
          Wheel lab
        </Link>
      </div>
    </div>
  );
}
