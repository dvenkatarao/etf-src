"use client";

import { useMemo, useState } from "react";
import type { Source } from "@/lib/sources";

type Health = { id: string; status: "ok" | "reachable" | "down"; httpStatus: number | null; ms: number | null; note: string };

const verStyle: Record<Source["verification"], { label: string; cls: string }> = {
  live: { label: "Verified live", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  docs: { label: "Verified in official docs (key needed)", cls: "bg-sky-50 text-sky-700 ring-sky-200" },
  partial: { label: "Partial / caveat", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  failed: { label: "Failed / retired", cls: "bg-rose-50 text-rose-700 ring-rose-200" },
};

const healthStyle = {
  ok: "bg-emerald-500",
  reachable: "bg-amber-500",
  down: "bg-rose-500",
};

export default function SourcesBrowser({ sources, categories, verifiedOn }: { sources: Source[]; categories: string[]; verifiedOn: string }) {
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [health, setHealth] = useState<Record<string, Health>>({});
  const [configured, setConfigured] = useState<Record<string, boolean>>({});
  const [running, setRunning] = useState(false);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);

  const shown = useMemo(
    () =>
      sources.filter((s) => (cat === "All" || s.category === cat) && (!q || `${s.name} ${s.provider} ${s.provides.join(" ")}`.toLowerCase().includes(q.toLowerCase()))),
    [sources, cat, q],
  );

  async function run() {
    setRunning(true);
    try {
      const res = await fetch("/api/sources/health", { cache: "no-store" });
      const j: { checkedAt: string; results: Health[]; configured: Record<string, boolean> } = await res.json();
      setHealth(Object.fromEntries(j.results.map((r) => [r.id, r])));
      setConfigured(j.configured);
      setCheckedAt(j.checkedAt);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search sources or data types…" className="w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
        <div className="flex flex-wrap gap-1.5">
          {["All", ...categories].map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`rounded-full px-3 py-1 text-xs font-medium ${cat === c ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              {c}
            </button>
          ))}
        </div>
        <button onClick={run} disabled={running} className="ml-auto rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60">
          {running ? "Pinging providers…" : "Run live health check"}
        </button>
      </div>
      {checkedAt && <p className="mb-3 text-xs text-slate-500">Last health check {new Date(checkedAt).toLocaleTimeString()} · {Object.values(health).filter((h) => h.status === "ok").length} responding, {Object.values(health).filter((h) => h.status === "reachable").length} reachable with limits/auth, {Object.values(health).filter((h) => h.status === "down").length} down. Keyed APIs are not pinged.</p>}

      <div className="space-y-3">
        {shown.map((s) => {
          const h = health[s.id];
          const isOpen = open[s.id];
          const v = verStyle[s.verification];
          return (
            <article key={s.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <button onClick={() => setOpen((o) => ({ ...o, [s.id]: !o[s.id] }))} className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-5 py-4 text-left">
                {h && <span className={`h-2.5 w-2.5 rounded-full ${healthStyle[h.status]}`} title={`${h.note}${h.ms ? ` · ${h.ms} ms` : ""}`} />}
                <span className="font-semibold text-slate-900">{s.name}</span>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${v.cls}`}>{v.label}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">{s.auth === "None" ? "No key" : s.auth}</span>
                {s.usedInApp && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">Used by this app</span>}
                {s.envVar && configured[s.id] !== undefined && (
                  <span className={`rounded-full px-2 py-0.5 text-[11px] ${configured[s.id] ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{configured[s.id] ? "key configured" : "key not set"}</span>
                )}
                {h && <span className="text-[11px] text-slate-500">{h.note}{h.ms ? ` · ${h.ms} ms` : ""}</span>}
                <span className="ml-auto text-xs text-slate-400">{isOpen ? "Hide" : "Details"}</span>
              </button>
              <div className="px-5 pb-1 text-sm text-slate-600">{s.freeLimits}</div>
              {isOpen && (
                <div className="space-y-3 border-t border-slate-100 px-5 py-4 text-sm">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div><div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Base URL</div><code className="break-all text-xs">{s.baseUrl}</code></div>
                    <div><div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Docs</div><a className="break-all text-xs text-emerald-700 hover:underline" href={s.docsUrl} target="_blank" rel="noreferrer">{s.docsUrl}</a></div>
                  </div>
                  {s.envVar && <div><span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Env var </span><code className="text-xs">{s.envVar}</code></div>}
                  {s.provides.length > 0 && (
                    <div>
                      <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Provides</div>
                      <ul className="mt-1 list-disc space-y-0.5 pl-5">{s.provides.map((p) => <li key={p}>{p}</li>)}</ul>
                    </div>
                  )}
                  {s.endpoints.length > 0 && (
                    <div>
                      <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Endpoints</div>
                      <ul className="mt-1 space-y-1">{s.endpoints.map((p) => <li key={p}><code className="break-all rounded bg-slate-50 px-1.5 py-0.5 text-xs">{p}</code></li>)}</ul>
                    </div>
                  )}
                  <div className="rounded-lg bg-slate-50 p-3 text-xs"><span className="font-semibold">Test result ({verifiedOn}): </span>{s.testedNote}</div>
                  {s.caveats.length > 0 && (
                    <div>
                      <div className="text-[11px] font-medium uppercase tracking-wide text-amber-700">Caveats</div>
                      <ul className="mt-1 list-disc space-y-0.5 pl-5 text-slate-600">{s.caveats.map((p) => <li key={p}>{p}</li>)}</ul>
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
        {shown.length === 0 && <p className="rounded-xl bg-white p-8 text-center text-slate-500">No sources match.</p>}
      </div>
    </div>
  );
}
