import { redirect } from "next/navigation";
import { isValidTicker } from "@/lib/universe";

export const dynamic = "force-dynamic";

/** /etf?q=TICKER → /etf/TICKER (used by the header search box). */
export default async function EtfIndex({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const t = (q ?? "").trim().toUpperCase();
  if (t && isValidTicker(t)) redirect(`/etf/${t}`);
  redirect("/screener");
}
