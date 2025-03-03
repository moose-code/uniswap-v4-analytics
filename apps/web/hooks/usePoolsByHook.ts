import { useEffect, useState } from "react";
import { graphqlClient, POOLS_BY_HOOK_QUERY } from "@/lib/graphql";

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
  createdAtTimestamp: string;
}

interface PoolsByHookResponse {
  Pool: Pool[];
}

export function usePoolsByHook(hookAddress: string | null) {
  const [pools, setPools] = useState<PoolsByHookResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hookAddress) {
      setPools(null);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await graphqlClient.request<PoolsByHookResponse>(
          POOLS_BY_HOOK_QUERY,
          { hookAddress }
        );
        setPools(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching pools by hook:", err);
        setError("Failed to fetch pools for this hook");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [hookAddress]);

  return { pools, loading, error };
}
