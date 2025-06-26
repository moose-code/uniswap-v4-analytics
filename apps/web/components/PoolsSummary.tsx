import { useState, useRef, useEffect } from "react";
import { usePools } from "../hooks/usePools";
import { ChevronDown, ExternalLink, Copy, Check, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PoolSwapsModal } from "./PoolSwapsModal";
import { useHookInfo } from "@/hooks/useHookInfo";

// Define the HookInfo interface
interface HookInfo {
  id: string;
  fields: Record<string, any>;
}

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

// Helper function to extract hook address from the hooks field
const extractHookAddress = (hooks: string | null | undefined): string => {
  if (!hooks) return "";
  return hooks;
};

// Helper function to check if an address is the zero address
const isZeroAddress = (address: string): boolean => {
  if (!address) return true;

  // Remove '0x' prefix if present
  const cleanAddress = address.startsWith("0x") ? address.slice(2) : address;

  // Check if the address consists only of zeros or is empty
  return (
    cleanAddress.length === 0 ||
    /^0+$/.test(cleanAddress) ||
    address === "0x0000000000000000000000000000000000000000"
  );
};

// Helper function to shorten address for display
const shortenAddress = (address: string): string => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Network slugs for explorer URLs
const NETWORK_EXPLORER_URLS: Record<string, string> = {
  "1": "https://etherscan.io",
  "10": "https://optimistic.etherscan.io",
  "137": "https://polygonscan.com",
  "42161": "https://arbiscan.io",
  "8453": "https://basescan.org",
  "81457": "https://blastscan.io",
  "7777777": "https://explorer.zora.energy",
  "56": "https://bscscan.com",
  "43114": "https://snowtrace.io",
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

interface PoolsSummaryProps {
  onNavigateToHookInfo?: (hookAddress: string, chainId: string) => void;
}

export function PoolsSummary({ onNavigateToHookInfo }: PoolsSummaryProps) {
  const { pools, loading, error } = usePools();
  const { hookInfo, isLoading: hookInfoLoading } = useHookInfo();
  const [showAllPools, setShowAllPools] = useState(false);
  const [selectedPool, setSelectedPool] = useState<{
    id: string;
    name: string;
    token0: string;
    token1: string;
  } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Function to get hook name by address
  const getHookNameByAddress = (
    hookAddress: string,
    chainId: string
  ): string | null => {
    if (!hookInfo || hookInfoLoading || !hookAddress) return null;

    // Format the address to include chain ID for comparison
    const formattedHookAddress = `${chainId}_${hookAddress}`;

    // Look for a hook with matching address
    const hook = hookInfo.find((h: HookInfo) => {
      const addressField = h.fields?.address || h.fields?.Address || "";
      return addressField === formattedHookAddress;
    });

    return hook?.fields?.Name || null;
  };

  // Function to navigate to hook information tab
  const handleNavigateToHookInfo = (
    hookAddress: string,
    chainId: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation(); // Prevent opening the modal
    if (onNavigateToHookInfo) {
      onNavigateToHookInfo(hookAddress, chainId);
    }
  };

  // Reset copied state after 2 seconds
  useEffect(() => {
    if (copiedId) {
      const timer = setTimeout(() => {
        setCopiedId(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedId]);

  // Function to copy text to clipboard
  const copyToClipboard = (text: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent opening the modal
    navigator.clipboard.writeText(text);
    setCopiedId(text);
  };

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
    : (pools?.Pool || []).slice(0, 8);

  return (
    <>
      <div className="w-full space-y-6">
        <div className="rounded-lg border border-border/50 overflow-hidden w-full">
          <div className="overflow-x-auto w-full">
            <table className="w-full table-auto md:table-fixed">
              <thead>
                <tr className="border-b border-border/50 bg-secondary/30">
                  <th className="px-3 md:px-4 py-3 text-left text-xs font-medium text-muted-foreground md:w-[25%]">
                    Pool Name
                  </th>
                  <th className="px-3 md:px-4 py-3 text-center text-xs font-medium text-muted-foreground md:w-[12%]">
                    Network
                  </th>
                  <th className="px-3 md:px-4 py-3 text-left text-xs font-medium text-muted-foreground md:w-[15%]">
                    TVL
                  </th>
                  <th className="px-3 md:px-4 py-3 text-left text-xs font-medium text-muted-foreground md:w-[15%]">
                    Volume
                  </th>
                  <th className="px-3 md:px-4 py-3 text-left text-xs font-medium text-muted-foreground md:w-[15%]">
                    Fees
                  </th>
                  <th className="px-3 md:px-4 py-3 text-left text-xs font-medium text-muted-foreground md:w-[18%]">
                    Hook
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {displayedPools.map((pool) => {
                  const chainId = extractChainId(pool.chainId);
                  const poolAddress = extractPoolAddress(pool.id);
                  const hookAddress = extractHookAddress(pool.hooks);
                  const explorerUrl =
                    NETWORK_EXPLORER_URLS[chainId] || "https://etherscan.io";
                  const networkSlug = NETWORK_SLUGS[chainId] || chainId;
                  const uniswapPoolUrl = `https://app.uniswap.org/explore/pools/${networkSlug}/${poolAddress}`;
                  const hookName = getHookNameByAddress(hookAddress, chainId);

                  // Extract token symbols or names from the pool name if available
                  // Use type assertion to handle the TypeScript error
                  const poolToken0 = (pool as any).token0 || "Unknown";
                  const poolToken1 = (pool as any).token1 || "Unknown";
                  let token0Display = poolToken0;
                  let token1Display = poolToken1;

                  // If pool name contains a slash, it might be in the format "TOKEN0/TOKEN1"
                  if (pool.name && pool.name.includes("/")) {
                    const parts = pool.name.split("/");
                    if (parts && parts.length === 2) {
                      const part0 = parts[0];
                      const part1 = parts[1];
                      if (part0) token0Display = part0.trim();
                      if (part1) token1Display = part1.trim();
                    }
                  }

                  return (
                    <tr
                      key={pool.id}
                      className="hover:bg-secondary/30 transition-colors cursor-pointer"
                      onClick={() =>
                        setSelectedPool({
                          id: pool.id,
                          name: pool.name,
                          token0: token0Display,
                          token1: token1Display,
                        })
                      }
                    >
                      <td className="px-3 md:px-4 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-sm truncate">
                            {pool.name || "Unnamed Pool"}
                          </span>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <span className="font-mono text-xs truncate max-w-[180px]">
                              {shortenAddress(poolAddress)}
                            </span>
                            <a
                              href={uniswapPoolUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-0.5 rounded hover:bg-secondary/50 transition-colors flex-shrink-0"
                              title="View on Uniswap"
                            >
                              <ExternalLink className="w-3 h-3 opacity-70 hover:opacity-100" />
                            </a>
                            <button
                              onClick={(e) => copyToClipboard(pool.id, e)}
                              className="p-0.5 rounded hover:bg-secondary/50 transition-colors flex-shrink-0"
                              title="Copy pool ID"
                            >
                              {copiedId === pool.id ? (
                                <Check className="w-3 h-3 text-green-500" />
                              ) : (
                                <Copy className="w-3 h-3 opacity-70 hover:opacity-100" />
                              )}
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 md:px-4 py-4">
                        <div className="w-full flex justify-center">
                          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-secondary min-w-[90px] text-center">
                            {NETWORK_NAMES[chainId] || `Chain ${chainId}`}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 md:px-4 py-4 font-mono text-sm">
                        {formatUSD(pool.totalValueLockedUSD)}
                      </td>
                      <td className="px-3 md:px-4 py-4 font-mono text-sm">
                        {formatUSD(
                          parseFloat(pool.volumeUSD) > 0
                            ? pool.volumeUSD
                            : pool.untrackedVolumeUSD
                        )}
                      </td>
                      <td className="px-3 md:px-4 py-4 font-mono text-sm">
                        {formatUSD(
                          parseFloat(pool.feesUSD) > 0
                            ? pool.feesUSD
                            : pool.feesUSDUntracked
                        )}
                      </td>
                      <td className="px-3 md:px-4 py-4">
                        {hookAddress && !isZeroAddress(hookAddress) ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-sm truncate">
                              {hookName || shortenAddress(hookAddress)}
                            </span>
                            {onNavigateToHookInfo && (
                              <button
                                onClick={(e) =>
                                  handleNavigateToHookInfo(
                                    hookAddress,
                                    chainId,
                                    e
                                  )
                                }
                                className="w-4 h-4 rounded-full bg-secondary/50 hover:bg-secondary flex items-center justify-center"
                                title="View hook information"
                              >
                                <Info className="w-3 h-3 opacity-70 hover:opacity-100" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            No Hook
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {pools?.Pool && pools.Pool.length > 8 && (
          <button
            onClick={() => setShowAllPools(!showAllPools)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-all duration-200 group"
          >
            <span className="text-sm font-medium">
              {showAllPools
                ? `Show Top 8 Pools`
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
