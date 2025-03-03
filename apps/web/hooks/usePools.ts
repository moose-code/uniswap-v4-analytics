import { useEffect, useState } from "react";
import { graphqlClient, POOLS_QUERY } from "@/lib/graphql";

interface Pool {
  chainId: string;
  hooks: string;
  id: string;
  name: string;
  txCount: string;
  token0: string;
  token1: string;
  volumeUSD: string;
  feesUSD: string;
  totalValueLockedUSD: string;
}

interface PoolsResponse {
  Pool: Pool[];
}

export function usePools() {
  const [pools, setPools] = useState<PoolsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await graphqlClient.request<PoolsResponse>(POOLS_QUERY);
        setPools(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching pools:", err);
        setError("Failed to fetch pools data");
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchData();

    // Poll every second
    const interval = setInterval(fetchData, 1000);

    return () => clearInterval(interval);
  }, []);

  return { pools, loading, error };
}
