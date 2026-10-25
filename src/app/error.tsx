"use client";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-rose-700 dark:text-rose-400/80">Something broke</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">This page couldn’t load</h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        {error.message || "An unexpected error occurred."}
        {error.digest ? ` · ${error.digest}` : ""}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500"
      >
        Try again
      </button>
    </div>
  );
}
