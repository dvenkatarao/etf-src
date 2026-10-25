import WheelLabTools, { type ToolsInit } from "@/components/wheel/WheelLabTools";

export const dynamic = "force-dynamic";
export const metadata = { title: "Wheel payoff & cycle calculator · ETF Research Lab" };

export default async function WheelCalculatorPage({ searchParams }: { searchParams: Promise<ToolsInit> }) {
  const sp = await searchParams;
  return <WheelLabTools initial={sp} />;
}
