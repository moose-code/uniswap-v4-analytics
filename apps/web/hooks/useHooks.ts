import { useEffect, useState, useRef } from "react";
import { graphqlClient, STATS_QUERY } from "@/lib/graphql";

type Hook = {
  id: string;
  chainId: string;
  numberOfPools: string;
  numberOfSwaps: string;
  firstPoolCreatedAt: string;
  totalValueLockedUSD: string;
  totalVolumeUSD: string;
  totalFeesUSD: string;
};

type HooksData = {
  HookStats: Hook[];
};

// Add type for the GraphQL response
type StatsQueryResponse = {
  HookStats: Hook[];
  // Add other fields from STATS_QUERY if needed
};

export function useHooks() {
  const [hooks, setHooks] = useState<HooksData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstLoadRef = useRef<boolean>(true);
  const retryCountRef = useRef<number>(0);
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000; // 2 seconds

  // Function to clear any existing retry timeout
  const clearRetryTimeout = () => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    const fetchHooks = async () => {
      try {
        setLoading(true);
        const data =
          await graphqlClient.request<StatsQueryResponse>(STATS_QUERY);
        setHooks({ HookStats: data.HookStats });
        setError(null);
        retryCountRef.current = 0; // Reset retry count on success
        isFirstLoadRef.current = false;
      } catch (err) {
        console.error("Error fetching hooks:", err);

        // Only show error if we've already loaded data once or if we've exceeded max retries
        if (!isFirstLoadRef.current || retryCountRef.current >= MAX_RETRIES) {
          setError("Failed to fetch data. Please refresh the page.");
        }

        // If this is the first load or we haven't exceeded max retries, try again
        if (isFirstLoadRef.current && retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current += 1;
          clearRetryTimeout();
          retryTimeoutRef.current = setTimeout(fetchHooks, RETRY_DELAY);
          return; // Don't set loading to false yet
        }
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchHooks();

    // Set up visibility change listener to refetch when tab becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Clear any existing error when the tab becomes visible again
        if (error) {
          setError(null);
          fetchHooks();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Poll every 10 seconds
    const interval = setInterval(fetchHooks, 10000);

    return () => {
      clearInterval(interval);
      clearRetryTimeout();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [error]);

  return { hooks, loading, error };
}
