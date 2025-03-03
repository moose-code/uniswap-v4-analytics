import { useState, useRef, useEffect } from "react";
import { usePools } from "../hooks/usePools";
import { ChevronDown, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

// Helper function to extract chain ID from the new format
const extractChainId = (id: string): string => {
  // If the ID contains an underscore, extract the part before it
  if (id.includes("_")) {
    const chainId = id.split("_")[0];
    return chainId || id; // Fallback to original id if split fails
  }
  return id;
};

// Helper function to format USD values
const formatUSD = (value: string): string => {
  const num = parseFloat(value);
  if (num >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(2)}M`;
  } else if (num >= 1_000) {
    return `$${(num / 1_000).toFixed(2)}K`;
  } else {
    return `$${num.toFixed(2)}`;
  }
};

// Helper function to extract pool address from the ID
const extractPoolAddress = (id: string): string => {
  // If the ID contains an underscore, extract the part after it
  if (id.includes("_")) {
    const address = id.split("_")[1];
    return address || id;
  }
  return id;
};

// Network names mapping
const NETWORK_NAMES: Record<string, string> = {
  "1": "Ethereum",
  "10": "Optimism",
  "137": "Polygon",
  "42161": "Arbitrum",
  "8453": "Base",
  "81457": "Blast",
  "7777777": "Zora",
  "56": "BSC",
  "43114": "Avalanche",
  "57073": "Ink",
  "1868": "Soneium",
  "130": "Unichain",
};

// Network slugs for Uniswap URLs
const NETWORK_SLUGS: Record<string, string> = {
  "1": "ethereum",
  "10": "optimism",
  "137": "polygon",
  "42161": "arbitrum",
  "8453": "base",
  "81457": "blast",
  "7777777": "zora",
};

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
          [pool.id]: parseInt(pool.txCount),
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
          <table className="w-full table-fixed">
            <thead>
              <tr className="border-b border-border/50 bg-secondary/30">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground w-[25%]">
                  Pool Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground w-[15%]">
                  Network
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground w-[15%]">
                  TVL
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground w-[15%]">
                  Volume
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground w-[15%]">
                  Fees
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground w-[15%]">
                  Hooks
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {displayedPools.map((pool) => {
                const currentSwaps = parseInt(pool.txCount);
                const previousSwaps =
                  previousSwapsRef.current[pool.id] || currentSwaps;
                const hasIncreased = currentSwaps > previousSwaps;
                const chainId = extractChainId(pool.chainId);
                const poolAddress = extractPoolAddress(pool.id);
                const networkSlug = NETWORK_SLUGS[chainId] || chainId;
                const uniswapUrl = `https://app.uniswap.org/explore/pools/${networkSlug}/${poolAddress}`;

                return (
                  <tr
                    key={pool.id}
                    className="hover:bg-secondary/30 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-sm truncate">
                          {pool.name || "Unnamed Pool"}
                        </span>
                        <a
                          href={uniswapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center gap-1 hover:text-primary transition-colors"
                        >
                          <span className="text-xs text-muted-foreground font-mono truncate group-hover:text-primary transition-colors">
                            {`${poolAddress.slice(0, 6)}...${poolAddress.slice(-4)}`}
                          </span>
                          <ExternalLink className="w-3 h-3 opacity-70 group-hover:opacity-100" />
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary">
                        {NETWORK_NAMES[chainId] || `Chain ${chainId}`}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-mono text-sm">
                      {formatUSD(pool.totalValueLockedUSD)}
                    </td>
                    <td className="px-4 py-4 font-mono text-sm">
                      {formatUSD(pool.volumeUSD)}
                    </td>
                    <td className="px-4 py-4 font-mono text-sm">
                      {formatUSD(pool.feesUSD)}
                    </td>
                    <td className="px-4 py-4">
                      {pool.hooks ===
                      "0x0000000000000000000000000000000000000000" ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary/50 text-muted-foreground">
                          No Hooks
                        </span>
                      ) : (
                        <a
                          href={`https://scope.sh/${chainId}/address/${pool.hooks}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        >
                          <span className="font-mono truncate">
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
