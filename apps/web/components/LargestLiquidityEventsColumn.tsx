import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { graphqlClient } from "@/lib/graphql";
import { Copy, ExternalLink } from "lucide-react";
import {
  LARGEST_MODIFY_LIQUIDITY_QUERY,
  LARGEST_REMOVE_LIQUIDITY_QUERY,
} from "@/lib/graphql";

interface Token {
  id: string;
  name: string;
  symbol: string;
  decimals: string;
}

interface Pool {
  id: string;
  name: string;
}

interface LiquidityEvent {
  id: string;
  amount: string;
  amount0: string;
  amount1: string;
  amountUSD: string;
  origin: string;
  sender: string;
  timestamp: string;
  transaction: string;
  token0: Token;
  token1: Token;
  tickLower: string;
  tickUpper: string;
  pool: Pool;
  chainId: string;
  uniqueId?: string; // Optional unique identifier to prevent key conflicts
}

interface LiquidityEventsResponse {
  ModifyLiquidity: LiquidityEvent[];
}

// Helper function to format USD values
const formatUSD = (value: string): string => {
  const num = parseFloat(value);
  const absNum = Math.abs(num);
  const sign = num < 0 ? "-" : "";

  if (absNum >= 1_000_000) {
    return `${sign}$${(absNum / 1_000_000).toFixed(2)}M`;
  } else if (absNum >= 1_000) {
    return `${sign}$${(absNum / 1_000).toFixed(2)}K`;
  } else if (absNum >= 0.01) {
    return `${sign}$${absNum.toFixed(2)}`;
  } else if (absNum > 0) {
    // For very small values, use more decimal places
    const decimalPlaces = absNum < 0.0001 ? 8 : absNum < 0.01 ? 4 : 2;
    return `${sign}$${absNum.toFixed(decimalPlaces)}`;
  } else {
    return `$0.00`;
  }
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

// Helper function to extract chain ID from the new format
const extractChainId = (id: string): string => {
  // If the ID contains an underscore, extract the part before it
  if (id.includes("_")) {
    const chainId = id.split("_")[0];
    return chainId || id; // Fallback to original id if split fails
  }
  return id;
};

// Generate a guaranteed unique ID for each event
const generateUniqueId = (eventId: string): string => {
  // Combine event ID with timestamp (ms) + performance.now() (sub-ms precision) and random string
  const timestamp = Date.now();
  const nanoTime =
    typeof performance !== "undefined"
      ? performance.now().toString().replace(".", "")
      : "0";
  const random = Math.random().toString(36).substring(2, 10);

  return `${eventId}_${timestamp}_${nanoTime}_${random}`;
};

export function LargestLiquidityEventsColumn() {
  const [addEvents, setAddEvents] = useState<LiquidityEvent[]>([]);
  const [removeEvents, setRemoveEvents] = useState<LiquidityEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // List of token pairs to filter out (spam tokens)
  const spamTokenPairs = [
    { token0: "USED", token1: "CWS" },
    { token0: "ETH", token1: "FlUID" },
    { token0: "SIGLOS", token1: "FUTURE" },
    { token0: "ETH", token1: "LPT" },
    { token0: "ETH", token1: "tokenA" },
    { token0: "ETH", token1: "DECT" },
  ];

  // Helper function to check if a token pair is in the spam list
  const isSpamTokenPair = (
    token0Symbol: string,
    token1Symbol: string
  ): boolean => {
    // Normalize token symbols for comparison (to uppercase)
    const normalizedToken0 = token0Symbol.toUpperCase();
    const normalizedToken1 = token1Symbol.toUpperCase();

    // Check in both directions (order doesn't matter)
    return spamTokenPairs.some(
      (pair) =>
        (normalizedToken0 === pair.token0.toUpperCase() &&
          normalizedToken1 === pair.token1.toUpperCase()) ||
        (normalizedToken0 === pair.token1.toUpperCase() &&
          normalizedToken1 === pair.token0.toUpperCase())
    );
  };

  // Fetch largest liquidity events - both adds and removes
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        // Fetch largest adds
        const addData = await graphqlClient.request<LiquidityEventsResponse>(
          LARGEST_MODIFY_LIQUIDITY_QUERY,
          {
            limit: 25, // Fetch top N largest add events
          }
        );

        // Fetch largest removes
        const removeData = await graphqlClient.request<LiquidityEventsResponse>(
          LARGEST_REMOVE_LIQUIDITY_QUERY,
          {
            limit: 25, // Fetch top N largest remove events
          }
        );

        if (!isMounted) return;

        // Add a unique identifier to each event
        const addsWithIds = addData.ModifyLiquidity.map((event) => ({
          ...event,
          uniqueId: generateUniqueId(event.id),
        }));

        const removesWithIds = removeData.ModifyLiquidity.map((event) => ({
          ...event,
          uniqueId: generateUniqueId(event.id),
        }));

        setAddEvents(addsWithIds);
        setRemoveEvents(removesWithIds);
        setError(null);
      } catch (err) {
        console.error("Error fetching largest liquidity events:", err);
        if (isMounted) {
          setError("Failed to fetch largest liquidity events");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    // Poll for updates every 30 seconds
    const intervalId = setInterval(fetchData, 30000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  // Combine and sort events by absolute amount
  const combinedEvents = [...addEvents, ...removeEvents]
    .filter(
      (event) =>
        !isSpamTokenPair(
          event.token0.symbol || "Unknown",
          event.token1.symbol || "Unknown"
        )
    )
    .sort((a, b) => {
      return (
        Math.abs(parseFloat(b.amountUSD)) - Math.abs(parseFloat(a.amountUSD))
      );
    })
    .slice(0, 50); // Take top 50 events by absolute size

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    const eventTime = new Date(parseInt(timestamp) * 1000);
    return eventTime.toLocaleString();
  };

  // Get block explorer URL based on chain ID
  const getBlockExplorerUrl = (chainId: string, txHash: string): string => {
    const explorers: Record<string, string> = {
      "1": "https://etherscan.io/tx/",
      "10": "https://optimistic.etherscan.io/tx/",
      "137": "https://polygonscan.com/tx/",
      "42161": "https://arbiscan.io/tx/",
      "8453": "https://basescan.org/tx/",
      "81457": "https://blastscan.io/tx/",
      "7777777": "https://explorer.zora.energy/tx/",
      "56": "https://bscscan.com/tx/",
      "43114": "https://snowtrace.io/tx/",
      "57073": "https://inkscan.io/tx/",
      "1868": "https://sonscan.io/tx/",
      "130": "https://uniscan.xyz/tx/",
    };

    const baseUrl = explorers[chainId] || "https://etherscan.io/tx/"; // Default to Ethereum
    return `${baseUrl}${txHash}`;
  };

  // Copy text to clipboard with feedback
  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        // Could add a toast notification here if desired
        console.log("Copied to clipboard:", text);
      })
      .catch((err) => {
        console.error("Failed to copy:", err);
      });
  };

  return (
    <div className="h-full">
      <div className="p-3 border-b border-border/50 flex justify-between items-center">
        <h3 className="text-sm font-medium">Largest Liquidity Events</h3>
        <div className="text-xs text-muted-foreground">
          {combinedEvents.length > 0
            ? `${combinedEvents.length} events`
            : "Loading events..."}
        </div>
      </div>

      <div
        className="md:max-h-[400px] max-h-[350px] overflow-y-auto p-2 relative"
        style={{ scrollBehavior: "smooth" }}
      >
        {loading ? (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 p-4 text-center text-sm">{error}</div>
        ) : (
          <div className="space-y-1.5">
            <AnimatePresence initial={true}>
              {combinedEvents.map((event, index) => {
                if (!event || !event.uniqueId) return null; // Skip invalid events

                const chainId = extractChainId(event.chainId);
                const networkName =
                  NETWORK_NAMES[chainId] || `Chain ${chainId}`;
                const token0Symbol = event.token0.symbol || "Token0";
                const token1Symbol = event.token1.symbol || "Token1";
                const formattedAmount = formatUSD(event.amountUSD);
                const timestamp = formatTimestamp(event.timestamp);
                const poolName = event.pool?.name || "Unknown Pool";

                // Determine the type of liquidity event (add or remove)
                const isAddLiquidity = parseFloat(event.amount) > 0;
                const eventTypeLabel = isAddLiquidity ? "Add" : "Remove";
                const eventTypeColor = isAddLiquidity
                  ? "text-green-500"
                  : "text-red-500";

                return (
                  <motion.div
                    key={`event_${event.uniqueId}`}
                    className="bg-secondary/30 rounded-lg p-2 overflow-hidden hover:bg-secondary/50 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: index * 0.05,
                      ease: "easeOut",
                    }}
                    whileHover={{
                      backgroundColor: "rgba(50, 50, 50, 0.2)",
                    }}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <span
                          className={`text-xs font-medium px-1.5 py-0.5 rounded mr-2 ${
                            isAddLiquidity
                              ? "bg-green-500/10 text-green-500"
                              : "bg-red-500/10 text-red-500"
                          }`}
                        >
                          {eventTypeLabel}
                        </span>
                        <div className="text-xs rounded px-1.5 py-0.5 bg-secondary/50">
                          {networkName}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {timestamp}
                      </div>
                    </div>

                    <div className="flex items-start gap-2 mt-1">
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {token0Symbol}/{token1Symbol}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {poolName}
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-sm font-mono font-semibold ${isAddLiquidity ? "text-green-500" : "text-red-500"}`}
                        >
                          {formattedAmount}
                        </div>
                        <div className="flex items-center justify-end mt-0.5">
                          <button
                            className="p-1 hover:bg-pink-500/10 rounded-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(event.transaction);
                            }}
                            title="Copy transaction hash"
                          >
                            <Copy size={11} className="text-pink-500" />
                          </button>
                          <a
                            href={getBlockExplorerUrl(
                              chainId,
                              event.transaction
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 hover:bg-pink-500/10 rounded-full"
                            onClick={(e) => e.stopPropagation()}
                            title="View on block explorer"
                          >
                            <ExternalLink size={11} className="text-pink-500" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {combinedEvents.length === 0 && !loading && !error && (
              <div className="text-center p-4 text-muted-foreground text-sm">
                No liquidity events found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
