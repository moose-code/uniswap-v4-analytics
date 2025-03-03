import { useEffect, useState } from "react";
import { graphqlClient, RECENT_SWAPS_BY_POOL_QUERY } from "@/lib/graphql";

interface Swap {
  id: string;
  amount0: string;
  amount1: string;
  amountUSD: string;
  origin: string;
  sender: string;
  timestamp: string;
  transaction: string;
  token0: string;
  token1: string;
  sqrtPriceX96: string;
  tick: string;
  chainId: string;
}

interface RecentSwapsResponse {
  Swap: Swap[];
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

// Helper function to extract pool address from the ID
const extractPoolAddress = (id: string): string => {
  // If the ID contains an underscore, extract the part after it
  if (id.includes("_")) {
    const address = id.split("_")[1];
    return address || id;
  }
  return id;
};

export function useRecentSwapsByPool(
  poolId: string | null,
  limit: number = 100
) {
  const [swaps, setSwaps] = useState<RecentSwapsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!poolId) {
      setSwaps(null);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Extract chainId and poolAddress from the combined poolId
        const chainId = extractChainId(poolId);
        const poolAddress = extractPoolAddress(poolId);

        // Convert chainId to number for the GraphQL query
        const numericChainId = parseInt(chainId);
        if (isNaN(numericChainId)) {
          throw new Error("Invalid chain ID");
        }

        const data = await graphqlClient.request<RecentSwapsResponse>(
          RECENT_SWAPS_BY_POOL_QUERY,
          {
            poolAddress,
            chainId: numericChainId,
            limit,
          }
        );
        setSwaps(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching recent swaps:", err);
        setError("Failed to fetch recent swaps for this pool");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [poolId, limit]);

  return { swaps, loading, error };
}
