import { useState, useRef, useEffect } from "react";
import { usePools } from "../hooks/usePools";
import { ChevronDown, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PoolSwapsModal } from "./PoolSwapsModal";

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
  const { pools, loading, error } = usePools();
  const [showAllPools, setShowAllPools] = useState(false);
  const [selectedPool, setSelectedPool] = useState<{
    id: string;
    name: string;
    token0: string;
    token1: string;
  } | null>(null);

  if (loading && !pools)
    return (
      <div className="py-10 text-center text-muted-foreground">
        Loading pools...
      </div>
    );
  if (error)
    return <div className="py-10 text-center text-red-500">{error}</div>;

  const displayedPools = showAllPools
    ? pools?.Pool || []
    : (pools?.Pool || []).slice(0, 10);

  return (
    <>
      <div className="w-full space-y-6">
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <thead>
                <tr className="border-b border-border/50 bg-secondary/30">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground w-[35%]">
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground w-[20%]">
                    Fees
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {displayedPools.map((pool) => {
                  const chainId = extractChainId(pool.chainId);
                  const poolAddress = extractPoolAddress(pool.id);

                  return (
                    <tr
                      key={pool.id}
                      className="hover:bg-secondary/30 transition-colors cursor-pointer"
                      onClick={() =>
                        setSelectedPool({
                          id: pool.id,
                          name: pool.name,
                          token0: pool.token0,
                          token1: pool.token1,
                        })
                      }
                    >
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-sm truncate">
                            {pool.name || "Unnamed Pool"}
                          </span>
                          <div className="inline-flex items-center gap-1 text-xs text-muted-foreground font-mono truncate">
                            <span>{poolAddress}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="w-full overflow-hidden">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary truncate">
                            {NETWORK_NAMES[chainId] || `Chain ${chainId}`}
                          </span>
                        </div>
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {pools?.Pool && pools.Pool.length > 10 && (
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

      <AnimatePresence>
        {selectedPool && (
          <PoolSwapsModal
            poolId={selectedPool.id}
            poolName={selectedPool.name}
            token0={selectedPool.token0}
            token1={selectedPool.token1}
            onClose={() => setSelectedPool(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
