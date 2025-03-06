import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { graphqlClient } from "@/lib/graphql";

interface Token {
  id: string;
  name: string;
  symbol: string;
  decimals: string;
}

interface Swap {
  id: string;
  amount0: string;
  amount1: string;
  amountUSD: string;
  origin: string;
  sender: string;
  timestamp: string;
  transaction: string;
  token0: Token;
  token1: Token;
  sqrtPriceX96: string;
  tick: string;
  chainId: string;
  uniqueId?: string; // Optional unique identifier to prevent key conflicts
}

interface RecentSwapsResponse {
  Swap: Swap[];
}

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

// Global recent swaps query
const RECENT_SWAPS_QUERY = `
  query recentSwaps($limit: Int!) {
    Swap(
      order_by: {timestamp: desc}, 
      limit: $limit
    ) {
      id
      amount0
      amount1
      amountUSD
      origin
      sender
      timestamp
      transaction
      token0 {
        id
        name
        symbol
        decimals
      }
      token1 {
        id
        name
        symbol
        decimals
      }
      sqrtPriceX96
      tick
      chainId
    }
  }
`;

export function RecentSwapsPopup({ isVisible }: { isVisible: boolean }) {
  const [swaps, setSwaps] = useState<Swap[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const prevSwapsRef = useRef<Swap[]>([]);
  const [newSwapIds, setNewSwapIds] = useState<string[]>([]);
  const [animatingSwaps, setAnimatingSwaps] = useState<boolean>(false);

  // Fetch recent swaps
  useEffect(() => {
    if (!isVisible) return;

    const fetchData = async () => {
      try {
        const data = await graphqlClient.request<RecentSwapsResponse>(
          RECENT_SWAPS_QUERY,
          {
            limit: 20, // Reduced from 50 to show fewer, more relevant swaps
          }
        );

        // Add a unique identifier to each swap to prevent key conflicts
        const swapsWithUniqueIds = data.Swap.map((swap, index) => ({
          ...swap,
          uniqueId: `${swap.id}_${Date.now()}_${index}`,
        }));

        // Identify new swaps
        const newIds: string[] = [];
        swapsWithUniqueIds.forEach((swap) => {
          if (
            !prevSwapsRef.current.some((prevSwap) => prevSwap.id === swap.id)
          ) {
            newIds.push(swap.id);
          }
        });

        // Store previous swaps to identify new ones
        prevSwapsRef.current = [...swaps];

        // Set animating flag if we have new swaps
        if (newIds.length > 0) {
          setAnimatingSwaps(true);

          // Automatically clear the animating flag after all animations complete
          const maxDelay = Math.min(newIds.length * 50, 500); // Cap at 500ms for many swaps
          setTimeout(() => {
            setAnimatingSwaps(false);
          }, maxDelay + 300); // Add 300ms for the animation duration
        }

        setSwaps(swapsWithUniqueIds);
        setNewSwapIds(newIds);
        setError(null);
      } catch (err) {
        console.error("Error fetching recent swaps:", err);
        setError("Failed to fetch recent swaps");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Set up polling for real-time updates - reduced frequency to allow animations to complete
    const intervalId = setInterval(fetchData, 2000);
    return () => clearInterval(intervalId);
  }, [isVisible, swaps.length]);

  // Function to check if a swap is new (not in previous swaps)
  const isNewSwap = (swap: Swap) => {
    return newSwapIds.includes(swap.id);
  };

  if (!isVisible) return null;

  return (
    <motion.div
      className="absolute top-full left-0 mt-2 w-80 sm:w-96 bg-background border border-border/50 rounded-lg shadow-xl z-[9999] overflow-hidden"
      initial={{ opacity: 0, y: -10, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, y: -10, height: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        // Remove any backdrop filters that might cause blurriness
        backdropFilter: "none",
        WebkitBackdropFilter: "none",
      }}
    >
      <div className="p-3 border-b border-border/50 flex justify-between items-center">
        <h3 className="text-sm font-medium">Real-time Swaps</h3>
        <div className="text-xs text-muted-foreground">
          {swaps.length > 0 ? `Showing ${swaps.length} recent swaps` : ""}
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto p-2">
        {loading && swaps.length === 0 ? (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 p-4 text-center text-sm">{error}</div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {swaps.map((swap, index) => {
                const chainId = extractChainId(swap.chainId);
                const networkName =
                  NETWORK_NAMES[chainId] || `Chain ${chainId}`;
                const token0Symbol = swap.token0.symbol || "Token0";
                const token1Symbol = swap.token1.symbol || "Token1";
                const formattedAmount = formatUSD(swap.amountUSD);
                const timestamp = new Date(
                  parseInt(swap.timestamp) * 1000
                ).toLocaleTimeString();
                const isNew = isNewSwap(swap);

                // Calculate a shorter delay for high-frequency updates
                // Use a smaller multiplier (0.05s instead of 0.15s)
                // Cap the maximum delay to ensure responsiveness
                const animationDelay =
                  isNew && animatingSwaps
                    ? Math.min(index * 0.05, 0.5) // Cap at 0.5s max delay
                    : 0;

                return (
                  <motion.div
                    key={swap.uniqueId || `${swap.id}_${Date.now()}`}
                    className="bg-secondary/30 rounded-lg p-3 overflow-hidden"
                    initial={{
                      opacity: 0,
                      y: isNew ? -20 : 0,
                      backgroundColor: isNew
                        ? "rgba(34, 197, 94, 0.2)"
                        : "rgba(0, 0, 0, 0.1)",
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      backgroundColor: "rgba(0, 0, 0, 0.1)",
                      transition: {
                        backgroundColor: { delay: 0.3, duration: 0.5 },
                        // Add staggered delay for new swaps
                        delay: animationDelay,
                      },
                    }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{
                      duration: 0.2, // Faster animation
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                    }}
                    layout="position" // Use position layout to reduce jitter
                  >
                    <div className="flex justify-between items-center mb-1">
                      <div className="text-xs font-medium text-muted-foreground">
                        {timestamp}
                      </div>
                      <div className="text-xs bg-secondary/50 px-2 py-0.5 rounded-full">
                        {networkName}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 font-medium text-sm">
                        {token0Symbol} → {token1Symbol}
                      </div>
                      <motion.div
                        className="text-sm font-mono text-primary"
                        initial={{
                          opacity: isNew ? 0 : 1,
                          scale: isNew ? 0.8 : 1,
                        }}
                        animate={{
                          opacity: 1,
                          scale: isNew ? [0.8, 1.1, 1] : 1,
                          transition: {
                            delay: animationDelay + 0.05, // Slightly delayed after the container appears
                            duration: 0.3,
                          },
                        }}
                      >
                        {formattedAmount}
                      </motion.div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
