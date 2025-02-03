"use client";

import { useStats } from "@/hooks/useStats";
import { AnimatedBar } from "@/components/AnimatedBar";

const NETWORK_NAMES: Record<string, string> = {
  "1": "Ethereum",
  "10": "Optimism",
  "137": "Polygon",
  "42161": "Arbitrum",
  "8453": "Base",
  "81457": "Blast",
  "7777777": "Zora",
};

export default function Page() {
  const stats = useStats();

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-svh">
        Loading...
      </div>
    );
  }

  // Sort stats by number of swaps in descending order
  const sortedStats = [...stats.GlobalStats].sort(
    (a, b) => parseInt(b.numberOfSwaps) - parseInt(a.numberOfSwaps)
  );

  const maxSwaps = parseInt(sortedStats[0]?.numberOfSwaps ?? "0");

  return (
    <div className="flex items-center justify-center min-h-svh">
      <div className="w-full max-w-3xl space-y-4 p-8">
        <h1 className="text-2xl font-bold mb-8">
          Uniswap V4: Swaps Per Network Leaderboard
        </h1>
        {sortedStats.map((stat) => (
          <AnimatedBar
            key={stat.id}
            label={NETWORK_NAMES[stat.id] || `Chain ${stat.id}`}
            value={parseInt(stat.numberOfSwaps)}
            maxValue={maxSwaps}
          />
        ))}
      </div>
    </div>
  );
}
