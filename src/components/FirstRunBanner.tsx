"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const KEY = "cl-first-run";

export default function FirstRunBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) !== "done") setShow(true);
    } catch {
      /* ignore */
    }
  }, []);

  if (!show) return null;

  function dismiss() {
    try {
      localStorage.setItem(KEY, "done");
    } catch {
      /* ignore */
    }
    setShow(false);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-teal-500/25 bg-teal-500/10 px-3 py-2 text-sm text-slate-700 dark:text-slate-200">
      <p>Three questions → a starter screen you can edit. No trades, no advice.</p>
      <div className="flex items-center gap-3">
        <Link href="/onboarding" className="font-medium text-teal-800 hover:underline dark:text-teal-300">
          Get started
        </Link>
        <button type="button" onClick={dismiss} className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white">
          Dismiss
        </button>
      </div>
    </div>
  );
}
