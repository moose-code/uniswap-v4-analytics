import { useState, useRef, useEffect } from "react";
import { useHooks } from "../hooks/useHooks";
import { ChevronDown, ExternalLink, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { HookPoolsModal } from "./HookPoolsModal";

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

// Helper function to extract hook address from the ID
const extractHookAddress = (id: string): string => {
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

// Helper function to shorten address for display
const shortenAddress = (address: string): string => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export function HooksSummary() {
  const { hooks, loading, error } = useHooks();
  const [showAllHooks, setShowAllHooks] = useState(false);
  const [selectedHook, setSelectedHook] = useState<{
    address: string;
    chainId: string;
  } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const previousSwapsRef = useRef<Record<string, string>>({});

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

  // Track previous values for animation
  useEffect(() => {
    if (hooks) {
      previousSwapsRef.current = hooks.HookStats.reduce(
        (acc, hook) => ({
          ...acc,
          [hook.id]: hook.numberOfSwaps,
        }),
        {} as Record<string, string>
      );
    }
  }, [hooks]);

  if (loading && !hooks)
    return (
      <div className="py-10 text-center text-muted-foreground">
        Loading hooks...
      </div>
    );
  if (error)
    return <div className="py-10 text-center text-red-500">{error}</div>;
  if (!hooks) return null;

  const displayedHooks = showAllHooks
    ? hooks.HookStats.sort(
        (a, b) =>
          parseFloat(b.totalValueLockedUSD) - parseFloat(a.totalValueLockedUSD)
      )
    : hooks.HookStats.sort(
        (a, b) =>
          parseFloat(b.totalValueLockedUSD) - parseFloat(a.totalValueLockedUSD)
      ).slice(0, 10);

  return (
    <>
      <div className="w-full space-y-6">
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <thead>
                <tr className="border-b border-border/50 bg-secondary/30">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground w-[20%]">
                    Hook Address
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground w-[14%]">
                    Network
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground w-[13%]">
                    TVL
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground w-[13%]">
                    Volume
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground w-[13%]">
                    Fees
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground w-[13%]">
                    Pools
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground w-[14%]">
                    Swaps
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {displayedHooks.map((hook) => {
                  const currentSwaps = parseInt(hook.numberOfSwaps);
                  const previousSwaps = parseInt(
                    previousSwapsRef.current[hook.id] || "0"
                  );
                  const hasIncreased = currentSwaps > previousSwaps;
                  const chainId = extractChainId(hook.chainId);
                  const hookAddress = extractHookAddress(hook.id);
                  const explorerUrl =
                    NETWORK_EXPLORER_URLS[chainId] || "https://etherscan.io";

                  return (
                    <tr
                      key={hook.id}
                      className="hover:bg-secondary/30 transition-colors cursor-pointer"
                      onClick={() =>
                        setSelectedHook({
                          address: hookAddress,
                          chainId: hook.chainId,
                        })
                      }
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 font-mono text-sm">
                          <span className="truncate text-primary hover:text-primary/80 transition-colors">
                            {shortenAddress(hookAddress)}
                          </span>
                          <a
                            href={`${explorerUrl}/address/${hookAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-0.5 rounded hover:bg-secondary/50 transition-colors flex-shrink-0"
                          >
                            <ExternalLink className="w-3 h-3 opacity-70 hover:opacity-100" />
                          </a>
                          <button
                            onClick={(e) => copyToClipboard(hookAddress, e)}
                            className="p-0.5 rounded hover:bg-secondary/50 transition-colors flex-shrink-0"
                            title="Copy hook address"
                          >
                            {copiedId === hookAddress ? (
                              <Check className="w-3 h-3 text-green-500" />
                            ) : (
                              <Copy className="w-3 h-3 opacity-70 hover:opacity-100" />
                            )}
                          </button>
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
                        {formatUSD(hook.totalValueLockedUSD)}
                      </td>
                      <td className="px-4 py-4 font-mono text-sm">
                        {formatUSD(hook.totalVolumeUSD)}
                      </td>
                      <td className="px-4 py-4 font-mono text-sm">
                        {formatUSD(hook.totalFeesUSD)}
                      </td>
                      <td className="px-4 py-4 font-mono text-sm">
                        <div className="flex items-center gap-1">
                          <span>
                            {parseInt(hook.numberOfPools).toLocaleString()}
                          </span>
                          {parseInt(hook.numberOfPools) > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedHook({
                                  address: hookAddress,
                                  chainId: hook.chainId,
                                });
                              }}
                              className="w-4 h-4 rounded-full bg-secondary/50 hover:bg-secondary flex items-center justify-center text-xs"
                              title="View pools"
                            >
                              →
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <motion.span
                          className="font-mono text-sm tabular-nums"
                          animate={{
                            color: hasIncreased
                              ? ["inherit", "hsl(142.1 76.2% 36.3%)", "inherit"]
                              : "inherit",
                          }}
                          transition={{ duration: 0.3 }}
                        >
                          {currentSwaps.toLocaleString()}
                        </motion.span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {hooks.HookStats.length > 10 && (
          <button
            onClick={() => setShowAllHooks(!showAllHooks)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-all duration-200 group"
          >
            <span className="text-sm font-medium">
              {showAllHooks
                ? `Show Top 10 Hooks`
                : `Show All Hooks (${hooks.HookStats.length})`}
            </span>
            <motion.div
              animate={{ rotate: showAllHooks ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          </button>
        )}
      </div>

      <AnimatePresence>
        {selectedHook && (
          <HookPoolsModal
            hookAddress={selectedHook.address}
            hookChainId={selectedHook.chainId}
            onClose={() => setSelectedHook(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
