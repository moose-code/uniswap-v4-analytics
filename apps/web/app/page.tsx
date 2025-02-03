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
    <div className="flex flex-col min-h-svh">
      <div className="flex items-center justify-center flex-1 p-4">
        <div className="w-full max-w-3xl space-y-4">
          <h1 className="text-xl md:text-2xl font-bold mb-8 text-center">
            Swaps Leaderboard (Uniswap v4)
          </h1>
          <div className="space-y-3">
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
      </div>
      <footer className="mt-8 text-center text-sm text-muted-foreground space-y-1">
        <p>
          <a
            href="https://envio.dev/app/moose-code/uniswap-v4-indexer/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            View Indexed Data
          </a>
        </p>
        <p>
          <a
            href="https://github.com/moose-code/uniswap-v4-analytics"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            Contributions Welcome
          </a>
        </p>
      </footer>
    </div>
  );
}
