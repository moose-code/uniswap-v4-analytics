import { useEffect, useState, useRef } from "react";
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
  const currentDelay = useRef(INITIAL_RETRY_DELAY);

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
          currentDelay.current = INITIAL_RETRY_DELAY;
          timeoutId = setTimeout(fetchData, 1000);
        }
      } catch (err) {
        const isRateLimit = err?.toString().includes("429");

        if (isRateLimit && retryCount < MAX_RETRIES) {
          currentDelay.current = Math.min(
            currentDelay.current * 2,
            MAX_RETRY_DELAY
          );
          if (mounted) {
            setError(
              `Rate limit reached. Retrying in ${currentDelay.current / 1000} seconds...`
            );
            timeoutId = setTimeout(() => {
              setRetryCount((prev) => prev + 1);
              fetchData();
            }, currentDelay.current);
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

    fetchData();

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return { stats, error };
}
