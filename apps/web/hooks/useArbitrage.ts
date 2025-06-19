import { useEffect, useState } from "react";
import {
  graphqlClient,
  SPECIFIC_POOLS_QUERY,
  ARBITRAGE_SWAPS_QUERY,
} from "@/lib/graphql";

interface Token {
  id: string;
  name: string;
  symbol: string;
  decimals: string;
}

interface Pool {
  chainId: string;
  hooks: string;
  id: string;
  name: string;
  txCount: string;
  token0: string;
  token1: string;
  volumeUSD: string;
  untrackedVolumeUSD: string;
  feesUSD: string;
  feesUSDUntracked: string;
  totalValueLockedUSD: string;
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
  pool: string;
  token0: Token;
  token1: Token;
  sqrtPriceX96: string;
  tick: string;
  chainId: string;
}

interface PoolsResponse {
  Pool: Pool[];
}

interface SwapsResponse {
  Swap: Swap[];
}

// The specific pool IDs we want to track for arbitrage
const ARBITRAGE_POOL_IDS = [
  "1_0x21c67e77068de97969ba93d4aab21826d33ca12bb9f565d8496e8fda8a82ca27", // Ethereum ETH/USDC
  "130_0x3258f413c7a88cda2fa8709a589d221a80f6574f63df5a5b6774485d8acc39d9", // Unichain
];

// Helper function to calculate price from sqrtPriceX96
const calculatePriceFromSqrtPriceX96 = (
  sqrtPriceX96: string,
  token0Decimals: number,
  token1Decimals: number
): number => {
  const Q96 = Math.pow(2, 96);
  const sqrtPrice = parseFloat(sqrtPriceX96) / Q96;
  const price = Math.pow(sqrtPrice, 2);
  return price * Math.pow(10, token0Decimals - token1Decimals);
};

// Helper function to process swaps into chart data
const processSwapsForChart = (
  swaps: Swap[],
  chainId: string,
  maxPoints: number = 50
) => {
  const filteredSwaps = swaps
    .filter((swap) => swap.chainId === chainId)
    .slice(0, maxPoints)
    .reverse(); // Reverse to show chronological order

  return filteredSwaps.map((swap) => {
    const token0Decimals = parseInt(swap.token0.decimals);
    const token1Decimals = parseInt(swap.token1.decimals);
    const price = calculatePriceFromSqrtPriceX96(
      swap.sqrtPriceX96,
      token0Decimals,
      token1Decimals
    );

    return {
      timestamp: parseInt(swap.timestamp),
      price: price,
      amountUSD: parseFloat(swap.amountUSD),
      id: swap.id,
    };
  });
};

export function useArbitrage() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [swaps, setSwaps] = useState<Swap[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch specific pools
        const poolsData = await graphqlClient.request<PoolsResponse>(
          SPECIFIC_POOLS_QUERY,
          { poolIds: ARBITRAGE_POOL_IDS }
        );

        // Fetch recent swaps for these pools
        const swapsData = await graphqlClient.request<SwapsResponse>(
          ARBITRAGE_SWAPS_QUERY,
          { poolIds: ARBITRAGE_POOL_IDS }
        );

        setPools(poolsData.Pool);
        setSwaps(swapsData.Swap);
        setError(null);
      } catch (err) {
        console.error("Error fetching arbitrage data:", err);
        setError("Failed to fetch arbitrage data");
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchData();

    // Poll every 2 seconds for real-time updates
    const interval = setInterval(fetchData, 2000);

    return () => clearInterval(interval);
  }, []);

  // Calculate price difference between the two pools
  const priceData =
    pools.length === 2
      ? {
          ethPool: pools.find((p) => p.chainId === "1"),
          unichainPool: pools.find((p) => p.chainId === "130"),
        }
      : null;

  // Process swaps into chart data
  const ethChartData = processSwapsForChart(swaps, "1", 50);
  const unichainChartData = processSwapsForChart(swaps, "130", 50);

  // Get current prices from most recent swaps
  const currentPrices = (() => {
    if (ethChartData.length === 0 || unichainChartData.length === 0) {
      return null;
    }

    const ethPrice = ethChartData[ethChartData.length - 1]?.price || 0;
    const unichainPrice =
      unichainChartData[unichainChartData.length - 1]?.price || 0;

    if (ethPrice === 0 || unichainPrice === 0) {
      return null;
    }

    const difference = ((ethPrice - unichainPrice) / unichainPrice) * 100;

    return {
      ethPrice,
      unichainPrice,
      difference,
      absoluteDifference: Math.abs(difference),
    };
  })();

  return {
    pools,
    swaps,
    loading,
    error,
    priceDifference: currentPrices,
    ethPool: priceData?.ethPool,
    unichainPool: priceData?.unichainPool,
    ethChartData,
    unichainChartData,
  };
}
