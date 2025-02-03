import { useEffect, useState } from "react";
import { graphqlClient, STATS_QUERY } from "@/lib/graphql";

interface Stats {
  GlobalStats: {
    id: string;
    numberOfSwaps: string;
  }[];
  chain_metadata: {
    chain_id: number;
    latest_processed_block: number;
  }[];
}

export function useStats() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const data = await graphqlClient.request<Stats>(STATS_QUERY);
      setStats(data);
    };

    // Initial fetch
    fetchData();

    // Poll every 250 milliseconds
    const interval = setInterval(fetchData, 1000);

    return () => clearInterval(interval);
  }, []);

  return stats;
}
