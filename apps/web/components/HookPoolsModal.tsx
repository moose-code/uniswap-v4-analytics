import { useEffect, useRef, useState } from "react";
import { usePoolsByHook } from "../hooks/usePoolsByHook";
import { X, ExternalLink, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";

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

// Helper function to extract chain ID from the new format
const extractChainId = (id: string): string => {
  // If the ID contains an underscore, extract the part before it
  if (id.includes("_")) {
    const chainId = id.split("_")[0];
    return chainId || id; // Fallback to original id if split fails
  }
  return id;
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
  "480": "Worldchain",
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

interface HookPoolsModalProps {
  hookAddress: string;
  hookChainId: string;
  hookName?: string;
  onClose: () => void;
}

export function HookPoolsModal({
  hookAddress,
  hookChainId,
  hookName,
  onClose,
}: HookPoolsModalProps) {
  const chainId = extractChainId(hookChainId);
  const { pools, loading, error } = usePoolsByHook(hookAddress, chainId);
  const [showAllPools, setShowAllPools] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  // Prevent body scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const networkName = NETWORK_NAMES[chainId] || `Chain ${chainId}`;
  const displayedPools = showAllPools
    ? pools?.Pool || []
    : (pools?.Pool || []).slice(0, 10);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <motion.div
        ref={modalRef}
        className="bg-background rounded-lg shadow-lg w-full max-w-5xl max-h-[90vh] flex flex-col"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border/50">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <h2 className="text-base sm:text-lg font-medium">
              {!loading && pools?.Pool
                ? `Pools using hook (${pools.Pool.length})`
                : "Pools using hook"}
            </h2>
            <div className="flex items-center gap-1 sm:gap-2">
              <a
                href={`https://scope.sh/${chainId}/address/${hookAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-mono text-sm text-primary hover:text-primary/80 transition-colors"
              >
                <span>
                  {`${hookAddress.slice(0, 6)}...${hookAddress.slice(-4)}`}
                </span>
                <ExternalLink className="w-3 h-3 opacity-70 group-hover:opacity-100" />
              </a>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-secondary/50 min-w-[90px] text-center inline-block">
                {networkName}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-secondary/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-2 sm:p-4">
          {loading && (
            <div className="flex items-center justify-center h-40">
              <div className="animate-pulse text-muted-foreground">
                Loading pools...
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-40">
              <div className="text-red-500">{error}</div>
            </div>
          )}

          {!loading && !error && pools?.Pool && pools.Pool.length === 0 && (
            <div className="flex items-center justify-center h-40">
              <div className="text-muted-foreground">
                No pools found for this hook
              </div>
            </div>
          )}

          {!loading && !error && pools?.Pool && pools.Pool.length > 0 && (
            <div className="space-y-4 sm:space-y-6">
              {/* Hook Summary Statistics */}
              <div className="bg-secondary/20 rounded-lg p-3 sm:p-5 border border-border/50">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-xs sm:text-sm font-semibold text-foreground">
                    Hook Performance Summary
                  </h3>
                  <div className="px-2 sm:px-2.5 py-0.5 sm:py-1 bg-secondary rounded-full text-xs font-medium">
                    {pools.Pool.length}{" "}
                    {pools.Pool.length === 1 ? "Pool" : "Pools"}
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
                  {/* Total TVL */}
                  <div className="space-y-1 sm:space-y-1.5">
                    <div className="text-xs font-medium text-muted-foreground">
                      Total TVL
                    </div>
                    <div className="text-lg sm:text-2xl font-mono font-medium">
                      {formatUSD(
                        pools.Pool.reduce(
                          (sum, pool) =>
                            sum + parseFloat(pool.totalValueLockedUSD),
                          0
                        ).toString()
                      )}
                    </div>
                  </div>

                  {/* Total Volume */}
                  <div className="space-y-1 sm:space-y-1.5">
                    <div className="text-xs font-medium text-muted-foreground">
                      Total Volume
                    </div>
                    <div className="text-lg sm:text-2xl font-mono font-medium">
                      {formatUSD(
                        pools.Pool.reduce(
                          (sum, pool) =>
                            sum +
                            parseFloat(
                              parseFloat(pool.volumeUSD) > 0
                                ? pool.volumeUSD
                                : pool.untrackedVolumeUSD
                            ),
                          0
                        ).toString()
                      )}
                    </div>
                  </div>

                  {/* Total Fees */}
                  <div className="space-y-1 sm:space-y-1.5">
                    <div className="text-xs font-medium text-muted-foreground">
                      Total Fees
                    </div>
                    <div className="text-lg sm:text-2xl font-mono font-medium">
                      {formatUSD(
                        pools.Pool.reduce(
                          (sum, pool) =>
                            sum +
                            parseFloat(
                              parseFloat(pool.feesUSD) > 0
                                ? pool.feesUSD
                                : pool.feesUSDUntracked
                            ),
                          0
                        ).toString()
                      )}
                    </div>
                  </div>

                  {/* Total Transactions */}
                  <div className="space-y-1 sm:space-y-1.5">
                    <div className="text-xs font-medium text-muted-foreground">
                      Total Swaps
                    </div>
                    <div className="text-lg sm:text-2xl font-mono font-medium">
                      {pools.Pool.reduce(
                        (sum, pool) => sum + parseInt(pool.txCount),
                        0
                      ).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <h3 className="text-xs sm:text-sm font-medium px-1">
                Pool Details
              </h3>

              <div className="rounded-lg border border-border/50 overflow-hidden">
                {/* Table view (hidden on small screens) */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full min-w-[640px]">
                    <thead>
                      <tr className="border-b border-border/50 bg-secondary/30">
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-muted-foreground w-[25%]">
                          Pool Name
                        </th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs font-medium text-muted-foreground w-[15%]">
                          Network
                        </th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-muted-foreground w-[15%]">
                          TVL
                        </th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-muted-foreground w-[15%]">
                          Volume
                        </th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-muted-foreground w-[15%]">
                          Fees
                        </th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-muted-foreground w-[15%]">
                          Swaps
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {displayedPools.map((pool) => {
                        const poolChainId = extractChainId(pool.chainId);
                        const poolAddress = extractPoolAddress(pool.id);
                        const networkSlug =
                          NETWORK_SLUGS[poolChainId] || poolChainId;
                        const uniswapUrl = `https://app.uniswap.org/explore/pools/${networkSlug}/${poolAddress}`;

                        return (
                          <tr
                            key={pool.id}
                            className="hover:bg-secondary/30 transition-colors"
                          >
                            <td className="px-2 sm:px-4 py-3 sm:py-4">
                              <div className="flex flex-col">
                                <span className="font-medium text-xs sm:text-sm truncate">
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
                            <td className="px-2 sm:px-4 py-3 sm:py-4">
                              <div className="w-full flex justify-center">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary truncate">
                                  {NETWORK_NAMES[poolChainId] ||
                                    `Chain ${poolChainId}`}
                                </span>
                              </div>
                            </td>
                            <td className="px-2 sm:px-4 py-3 sm:py-4 font-mono text-xs sm:text-sm">
                              {formatUSD(pool.totalValueLockedUSD)}
                            </td>
                            <td className="px-2 sm:px-4 py-3 sm:py-4 font-mono text-xs sm:text-sm">
                              {formatUSD(
                                parseFloat(pool.volumeUSD) > 0
                                  ? pool.volumeUSD
                                  : pool.untrackedVolumeUSD
                              )}
                            </td>
                            <td className="px-2 sm:px-4 py-3 sm:py-4 font-mono text-xs sm:text-sm">
                              {formatUSD(
                                parseFloat(pool.feesUSD) > 0
                                  ? pool.feesUSD
                                  : pool.feesUSDUntracked
                              )}
                            </td>
                            <td className="px-2 sm:px-4 py-3 sm:py-4 font-mono text-xs sm:text-sm">
                              {parseInt(pool.txCount).toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile-friendly cards view (hidden on larger screens) */}
                <div className="sm:hidden space-y-4 p-3">
                  {displayedPools.map((pool) => {
                    const poolChainId = extractChainId(pool.chainId);
                    const poolAddress = extractPoolAddress(pool.id);
                    const networkSlug =
                      NETWORK_SLUGS[poolChainId] || poolChainId;
                    const uniswapUrl = `https://app.uniswap.org/explore/pools/${networkSlug}/${poolAddress}`;

                    return (
                      <div
                        key={pool.id}
                        className="border border-border/50 rounded-lg p-3 bg-secondary/5 hover:bg-secondary/10 transition-colors"
                      >
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between items-start">
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
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary truncate">
                              {NETWORK_NAMES[poolChainId] ||
                                `Chain ${poolChainId}`}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <div className="space-y-1">
                              <div className="text-xs font-medium text-muted-foreground">
                                TVL
                              </div>
                              <div className="font-mono text-sm">
                                {formatUSD(pool.totalValueLockedUSD)}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="text-xs font-medium text-muted-foreground">
                                Volume
                              </div>
                              <div className="font-mono text-sm">
                                {formatUSD(
                                  parseFloat(pool.volumeUSD) > 0
                                    ? pool.volumeUSD
                                    : pool.untrackedVolumeUSD
                                )}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="text-xs font-medium text-muted-foreground">
                                Fees
                              </div>
                              <div className="font-mono text-sm">
                                {formatUSD(
                                  parseFloat(pool.feesUSD) > 0
                                    ? pool.feesUSD
                                    : pool.feesUSDUntracked
                                )}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="text-xs font-medium text-muted-foreground">
                                Swaps
                              </div>
                              <div className="font-mono text-sm">
                                {parseInt(pool.txCount).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
          )}
        </div>
      </motion.div>
    </div>
  );
}
