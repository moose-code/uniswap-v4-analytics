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

  useEffect(() => {
    const fetchData = async () => {
      const data = await graphqlClient.request<PoolsResponse>(POOLS_QUERY);
      setPools(data);
    };

    // Initial fetch
    fetchData();

    // Poll every second
    const interval = setInterval(fetchData, 1000);

    return () => clearInterval(interval);
  }, []);

  return pools;
}
