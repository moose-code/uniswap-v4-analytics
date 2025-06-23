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
  "130_0x3258f413c7a88cda2fa8709a589d221a80f6574f63df5a5b6774485d8acc39d9", // Unichain ETH/USDC
  "42161_0x864abca0a6202dba5b8868772308da953ff125b0f95015adbf89aaf579e903a8", // Arbitrum ETH/USDC
  "8453_0x96d4b53a38337a5733179751781178a2613306063c511b78cd02684739288c0a", // Base ETH/USDC
  "10_0x51bf4cc5b8d9f7f759e41f572fe2a25bc2aeb42432bf12544a350595e5c8bb43", // Optimism ETH/USDC
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
  maxPoints: number = 25
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

    // Poll every 1 second for real-time updates
    const interval = setInterval(fetchData, 1000);

    return () => clearInterval(interval);
  }, []);

  // Get pools by chain
  const ethPool = pools.find((p) => p.chainId === "1");
  const unichainPool = pools.find((p) => p.chainId === "130");
  const arbitrumPool = pools.find((p) => p.chainId === "42161");
  const basePool = pools.find((p) => p.chainId === "8453");
  const optimismPool = pools.find((p) => p.chainId === "10");

  // Process swaps into chart data for all chains
  const ethChartData = processSwapsForChart(swaps, "1", 20);
  const unichainChartData = processSwapsForChart(swaps, "130", 20);
  const arbitrumChartData = processSwapsForChart(swaps, "42161", 20);
  const baseChartData = processSwapsForChart(swaps, "8453", 20);
  const optimismChartData = processSwapsForChart(swaps, "10", 20);

  // Get current prices from most recent swaps for all chains
  const getCurrentPrice = (chartData: any[]) => {
    if (chartData.length === 0) return 0;
    return chartData[chartData.length - 1]?.price || 0;
  };

  const ethPrice = getCurrentPrice(ethChartData);
  const unichainPrice = getCurrentPrice(unichainChartData);
  const arbitrumPrice = getCurrentPrice(arbitrumChartData);
  const basePrice = getCurrentPrice(baseChartData);
  const optimismPrice = getCurrentPrice(optimismChartData);

  // Calculate price differences (using ETH as base for comparison)
  const priceDifferences =
    ethPrice > 0
      ? {
          ethPrice,
          unichainPrice,
          arbitrumPrice,
          basePrice,
          optimismPrice,
          ethToUnichain: ((ethPrice - unichainPrice) / ethPrice) * 100,
          ethToArbitrum: ((ethPrice - arbitrumPrice) / ethPrice) * 100,
          ethToBase: ((ethPrice - basePrice) / ethPrice) * 100,
          ethToOptimism: ((ethPrice - optimismPrice) / ethPrice) * 100,
          maxDifference: (() => {
            // Find maximum difference between ANY two pools
            const prices = [
              ethPrice,
              unichainPrice,
              arbitrumPrice,
              basePrice,
              optimismPrice,
            ].filter((p) => p > 0);
            if (prices.length < 2) return 0;

            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);

            // Calculate percentage difference between min and max prices
            return ((maxPrice - minPrice) / minPrice) * 100;
          })(),
        }
      : null;

  return {
    pools,
    swaps,
    loading,
    error,
    priceDifferences,
    ethPool,
    unichainPool,
    arbitrumPool,
    basePool,
    optimismPool,
    ethChartData,
    unichainChartData,
    arbitrumChartData,
    baseChartData,
    optimismChartData,
  };
}
