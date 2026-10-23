"use client";

import { downloadCsv, recommendCsvRows } from "@/lib/csv-export";

export default function RecommendExport({ scored, goal }: { scored: { row: { ticker: string; name: string | null; category: string | null; quality: string | null; expense: number | null; yieldTtm: number | null; r3y: number | null; vol3y: number | null; erosion: string }; score: number; coverage: number }[]; goal: string }) {
  return (
    <button
      onClick={() => {
        const csv = recommendCsvRows(scored);
        downloadCsv(`recommend-${goal}-${new Date().toISOString().slice(0, 10)}.csv`, csv);
      }}
      className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
    >
      Export CSV
    </button>
  );
}
