import { useState, useRef, useEffect } from "react";
import { usePools } from "../hooks/usePools";
import { ChevronDown } from "lucide-react";
import { motion } from "framer-motion";

export function PoolsSummary() {
  const pools = usePools();
  const [showAllPools, setShowAllPools] = useState(false);
  const previousSwapsRef = useRef<{ [key: string]: number }>({});

  // Track previous values for animation
  useEffect(() => {
    if (pools) {
      previousSwapsRef.current = pools.Pool.reduce(
        (acc, pool) => ({
          ...acc,
          [pool.id]: parseInt(pool.numberOfSwaps),
        }),
        {}
      );
    }
  }, [pools]);

  if (!pools) return <div>Loading...</div>;

  const displayedPools = showAllPools ? pools.Pool : pools.Pool.slice(0, 10);

  return (
    <div className="w-full space-y-6">
      <div className="rounded-lg border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-secondary/30">
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">
                  Pool ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">
                  Chain ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">
                  Fee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">
                  Number of Swaps
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">
                  Tick Spacing
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">
                  Hooks
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {displayedPools.map((pool) => {
                const currentSwaps = parseInt(pool.numberOfSwaps);
                const previousSwaps =
                  previousSwapsRef.current[pool.id] || currentSwaps;
                const hasIncreased = currentSwaps > previousSwaps;

                return (
                  <tr
                    key={pool.id}
                    className="hover:bg-secondary/30 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm">
                        {`${pool.id.slice(0, 6)}...${pool.id.slice(-4)}`}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary">
                        {pool.chainId}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                      {pool.fee}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <motion.span
                        className="font-mono text-sm tabular-nums"
                        animate={{
                          scale: hasIncreased ? [1, 1.06, 1] : 1,
                          color: hasIncreased
                            ? ["inherit", "hsl(142.1 76.2% 36.3%)", "inherit"]
                            : "inherit",
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        {currentSwaps.toLocaleString()}
                      </motion.span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                      {pool.tickSpacing}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {pool.hooks ===
                      "0x0000000000000000000000000000000000000000" ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary/50 text-muted-foreground">
                          No Hooks
                        </span>
                      ) : (
                        <a
                          href={`https://scope.sh/${pool.chainId}/address/${pool.hooks}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        >
                          <span className="font-mono">
                            {`${pool.hooks.slice(0, 6)}...${pool.hooks.slice(-4)}`}
                          </span>
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {pools.Pool.length > 10 && (
        <button
          onClick={() => setShowAllPools(!showAllPools)}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-all duration-200 group"
        >
          <span className="text-sm font-medium">
            {showAllPools
              ? `Show Top 10 Pools`
              : `Show All Pools (${pools.Pool.length})`}
          </span>
          <motion.div
            animate={{ rotate: showAllPools ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        </button>
      )}
    </div>
  );
}
