import { useEffect, useState } from "react";
import { graphqlClient, STATS_QUERY } from "@/lib/graphql";

type GlobalStat = {
  id: string;
  numberOfSwaps: string;
  numberOfPools: string;
  hookedSwaps: string;
  hookedPools: string;
};

interface Stats {
  GlobalStats: GlobalStat[];
  chain_metadata: {
    chain_id: number;
    latest_processed_block: number;
  }[];
}

const INITIAL_RETRY_DELAY = 1000; // Start with 1 second
const MAX_RETRY_DELAY = 30000; // Max 30 seconds
const MAX_RETRIES = 5;

export function useStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [retryDelay, setRetryDelay] = useState(INITIAL_RETRY_DELAY);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let mounted = true;

    const fetchData = async () => {
      try {
        const data = await graphqlClient.request<Stats>(STATS_QUERY);
        if (mounted) {
          setStats(data);
          setError(null);
          setRetryCount(0);
          setRetryDelay(INITIAL_RETRY_DELAY);
        }
      } catch (err) {
        const isRateLimit = err?.toString().includes("429");

        if (isRateLimit && retryCount < MAX_RETRIES) {
          // Calculate exponential backoff
          const nextDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY);

          if (mounted) {
            setError(
              `Rate limit reached. Retrying in ${nextDelay / 1000} seconds...`
            );
            setRetryDelay(nextDelay);
            setRetryCount((prev) => prev + 1);
            timeoutId = setTimeout(fetchData, nextDelay);
          }
        } else {
          if (mounted) {
            setError(
              isRateLimit
                ? "Rate limit exceeded. Please try again later."
                : "Failed to fetch data. Please refresh the page."
            );
          }
        }
      }
    };

    // Initial fetch
    fetchData();

    const intervalId = setInterval(fetchData, 1000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [retryCount, retryDelay]);

  return { stats, error };
}
