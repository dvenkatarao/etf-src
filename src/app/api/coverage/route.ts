import { handle } from "@/lib/api";
import { computeCoverage } from "@/lib/coverage";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** JSON version of the data-coverage audit (same data as the /coverage page). */
export const GET = handle(async () => Response.json(await computeCoverage()));
