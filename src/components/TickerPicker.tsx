"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function TickerPicker({ current, suggestions, max = 5 }: { current: string[]; suggestions: string[]; max?: number }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const go = (list: string[]) => router.push(`/compare?t=${list.join(",")}`);
  const add = () => {
    const t = value.trim().toUpperCase();
    if (!t || !/^[A-Z0-9.\-]{1,10}$/.test(t) || current.includes(t) || current.length >= max) return;
    setValue("");
    go([...current, t]);
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        {current.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-3 py-1 text-sm font-semibold text-teal-800 ring-1 ring-inset ring-teal-200">
            {t}
            <button aria-label={`Remove ${t}`} className="text-teal-400 hover:text-teal-700" onClick={() => go(current.filter((x) => x !== t))}>
              ×
            </button>
          </span>
        ))}
        {current.length < max && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              add();
            }}
            className="flex items-center gap-2"
          >
            <input
              list="etf-suggestions"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Add ETF ticker…"
              className="w-44 rounded-lg border border-slate-300 px-3 py-1.5 text-sm uppercase placeholder:normal-case focus:border-teal-500 focus:outline-none"
              maxLength={10}
            />
            <datalist id="etf-suggestions">
              {suggestions.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
            <button className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-500">Add</button>
          </form>
        )}
        <span className="ml-auto text-xs text-slate-500">
          {current.length}/{max} selected
        </span>
      </div>
    </div>
  );
}
