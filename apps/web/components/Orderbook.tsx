"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import {
  graphqlClient,
  POOL_BY_ID_QUERY,
  TOKENS_BY_IDS_QUERY,
  TICKS_BY_POOL_RANGE_QUERY,
  BUNDLE_QUERY,
  RECENT_SWAPS_BY_POOL_QUERY,
  RECENT_MODIFY_LIQUIDITY_QUERY,
  POOLS_QUERY,
} from "@/lib/graphql";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, ExternalLink } from "lucide-react";
import { getAmount0, getAmount1 } from "@/lib/liquidityMath/liquidityAmounts";
import { TickMath } from "@/lib/liquidityMath/tickMath";
import { LiquidityHistogram } from "./LiquidityHistogram";

type Pool = {
  id: string;
  chainId: string;
  name: string;
  createdAtTimestamp?: string;
  createdAtBlockNumber?: string;
  token0: string; // token id
  token1: string; // token id
  feeTier: string;
  liquidity: string;
  sqrtPrice: string;
  token0Price: string;
  token1Price: string;
  tick: string | null;
  tickSpacing: string;
  totalValueLockedUSD?: string;
  totalValueLockedToken0?: string;
  totalValueLockedToken1?: string;
  totalValueLockedETH?: string;
  totalValueLockedUSDUntracked?: string;
  volumeUSD?: string;
  untrackedVolumeUSD?: string;
  volumeToken0?: string;
  volumeToken1?: string;
  feesUSD?: string;
  feesUSDUntracked?: string;
  txCount?: string;
  collectedFeesToken0?: string;
  collectedFeesToken1?: string;
  collectedFeesUSD?: string;
  liquidityProviderCount?: string;
  hooks?: string;
};

type Token = {
  id: string;
  symbol: string;
  name: string;
  decimals: string;
  derivedETH?: string;
};

type Tick = {
  id: string;
  tickIdx: string;
  liquidityNet: string;
  liquidityGross: string;
  price0: string;
  price1: string;
};

const DEFAULT_POOL_ID =
  "1_0x20c3a15e34e5d88aeba004b0753af69e4f6bea80eae2263f7a92e919cd33cc56";

// Helper functions from Pulse page
const formatUSD = (value: string): string => {
  const num = parseFloat(value);
  if (num >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(2)}M`;
  } else if (num >= 1_000) {
    return `$${(num / 1_000).toFixed(2)}K`;
  } else {
    return `$${num.toFixed(2)}`;
  }
};

const formatTokenAmount = (amount: string, decimals: string): string => {
  const num = parseFloat(amount);
  const absNum = Math.abs(num);
  const sign = num < 0 ? "-" : "";
  const decimalPlaces = parseInt(decimals) || 18;

  let displayDecimals = 2;
  if (absNum < 0.01) displayDecimals = 4;
  if (absNum < 0.0001) displayDecimals = 6;

  if (absNum >= 1_000_000) {
    return `${sign}${(absNum / 1_000_000).toFixed(2)}M`;
  } else if (absNum >= 1_000) {
    return `${sign}${(absNum / 1_000).toFixed(2)}K`;
  } else if (absNum === 0) {
    return "0";
  } else {
    return `${sign}${absNum.toFixed(Math.min(displayDecimals, decimalPlaces))}`;
  }
};

const NETWORK_NAMES: Record<string, string> = {
  "1": "Ethereum",
  "10": "Optimism",
  "137": "Polygon",
  "42161": "Arbitrum",
  "8453": "Base",
  "81457": "Blast",
  "7777777": "Zora",
  "56": "BSC",
  "43114": "Avalanche",
  "57073": "Ink",
  "1868": "Soneium",
  "130": "Unichain",
  "480": "Worldchain",
};

// Explorer URLs per network
const NETWORK_EXPLORER_URLS: Record<string, string> = {
  "1": "https://etherscan.io",
  "10": "https://optimistic.etherscan.io",
  "137": "https://polygonscan.com",
  "42161": "https://arbiscan.io",
  "8453": "https://basescan.org",
  "56": "https://bscscan.com",
  "43114": "https://snowtrace.io",
  "130": "https://explorer.unichain.org",
};

const isZeroAddress = (address?: string | null) => {
  if (!address) return true;
  return address.toLowerCase() === "0x0000000000000000000000000000000000000000";
};

const extractChainId = (id: string): string => {
  if (id.includes("_")) {
    const chainId = id.split("_")[0];
    return chainId || id;
  }
  return id;
};

const generateUniqueId = (eventId: string): string => {
  const timestamp = Date.now();
  const nanoTime =
    typeof performance !== "undefined"
      ? performance.now().toString().replace(".", "")
      : "0";
  const random = Math.random().toString(36).substring(2, 10);
  return `${eventId}_${timestamp}_${nanoTime}_${random}`;
};

const getBlockExplorerUrl = (chainId: string, txHash: string): string => {
  const explorers: Record<string, string> = {
    "1": "https://etherscan.io/tx/",
    "10": "https://optimistic.etherscan.io/tx/",
    "137": "https://polygonscan.com/tx/",
    "42161": "https://arbiscan.io/tx/",
    "8453": "https://basescan.org/tx/",
    "81457": "https://blastscan.io/tx/",
    "7777777": "https://explorer.zora.energy/tx/",
    "56": "https://bscscan.com/tx/",
    "43114": "https://snowtrace.io/tx/",
    "57073": "https://inkscan.io/tx/",
    "1868": "https://sonscan.io/tx/",
    "130": "https://uniscan.xyz/tx/",
  };
  const baseUrl = explorers[chainId] || "https://etherscan.io/tx/";
  return `${baseUrl}${txHash}`;
};

const copyToClipboard = (text: string) => {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      console.log("Copied to clipboard:", text);
    })
    .catch((err) => {
      console.error("Failed to copy:", err);
    });
};

// Pool-specific Recent Swaps Component
function PoolRecentSwaps({ poolId }: { poolId: string }) {
  const [swaps, setSwaps] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      // Skip if poolId is empty or invalid
      if (!poolId || !poolId.includes("_")) {
        if (isMounted) {
          setError("Invalid pool ID");
        }
        return;
      }

      try {
        const data = await graphqlClient.request<{ Swap: any[] }>(
          RECENT_SWAPS_BY_POOL_QUERY,
          {
            poolId,
            limit: 20,
          }
        );

        if (!isMounted) return;

        const swapsWithIds = data.Swap.map((swap: any) => ({
          ...swap,
          uniqueId: generateUniqueId(swap.id),
        }));

        setSwaps(swapsWithIds);
        setError(null);
      } catch (err) {
        console.error("Error fetching pool swaps for pool:", poolId, err);
        if (isMounted) {
          setError("Failed to fetch swaps for this pool");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 5000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [poolId]);

  const getSwapTimestamp = (timestamp: string) => {
    const swapTime = new Date(parseInt(timestamp) * 1000);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - swapTime.getTime()) / 1000);

    if (diffSeconds < 5) {
      return "now";
    } else if (diffSeconds < 60) {
      return `${diffSeconds}s ago`;
    } else {
      return swapTime.toLocaleTimeString();
    }
  };

  return (
    <div className="border border-border/50 rounded-md overflow-hidden">
      <div className="p-3 border-b border-border/50 flex justify-between items-center">
        <h3 className="text-sm font-medium">Recent Swaps</h3>
        <div className="text-xs text-muted-foreground">
          {swaps.length} recent swaps
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto p-2">
        {loading ? (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 p-4 text-center text-sm">{error}</div>
        ) : (
          <div className="space-y-1.5">
            {swaps.map((swap) => {
              const chainId = extractChainId(swap.chainId);
              const networkName = NETWORK_NAMES[chainId] || `Chain ${chainId}`;
              const token0Symbol = swap.token0.symbol || "Token0";
              const token1Symbol = swap.token1.symbol || "Token1";
              const formattedAmount = formatUSD(swap.amountUSD);
              const timestamp = getSwapTimestamp(swap.timestamp);

              return (
                <div
                  key={swap.uniqueId}
                  className="bg-secondary/30 rounded-lg p-2 hover:bg-secondary/50 transition-colors group"
                >
                  <div className="flex justify-between items-center mb-0.5">
                    <div className="text-xs font-medium text-muted-foreground">
                      {timestamp}
                    </div>
                    <div className="text-xs bg-secondary/50 px-2 py-0.5 rounded-full">
                      {networkName}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 font-medium text-sm">
                      {token0Symbol} → {token1Symbol}
                    </div>
                    <div className="text-sm font-mono text-pink-500">
                      {formattedAmount}
                    </div>
                  </div>

                  <div className="text-xs mt-1 pt-1 border-t border-border/20 text-muted-foreground group-hover:!block hidden">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span className="whitespace-nowrap font-medium">Tx:</span>
                      <span className="text-xs font-mono">
                        {swap.transaction.substring(0, 6)}...
                        {swap.transaction.substring(
                          swap.transaction.length - 4
                        )}
                      </span>
                      <div className="flex">
                        <button
                          className="p-1 hover:bg-pink-500/10 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(swap.transaction);
                          }}
                          title="Copy transaction hash"
                        >
                          <Copy size={11} className="text-pink-500" />
                        </button>
                        <a
                          href={getBlockExplorerUrl(chainId, swap.transaction)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 hover:bg-pink-500/10 rounded-full"
                          onClick={(e) => e.stopPropagation()}
                          title="View on block explorer"
                        >
                          <ExternalLink size={11} className="text-pink-500" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Pool-specific Recent Liquidity Component
function PoolRecentLiquidity({ poolId }: { poolId: string }) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      // Skip if poolId is empty or invalid
      if (!poolId || !poolId.includes("_")) {
        if (isMounted) {
          setError("Invalid pool ID");
        }
        return;
      }

      try {
        // We need to modify the query to filter by pool
        const POOL_MODIFY_LIQUIDITY_QUERY = `
          query poolModifyLiquidity($poolId: String!, $limit: Int!) {
            ModifyLiquidity(
              where: {pool: {id: {_eq: $poolId}}},
              order_by: {timestamp: desc}, 
              limit: $limit
            ) {
              id
              amount
              amount0
              amount1
              amountUSD
              origin
              sender
              timestamp
              transaction
              token0 {
                id
                name
                symbol
                decimals
              }
              token1 {
                id
                name
                symbol
                decimals
              }
              tickLower
              tickUpper
              pool {
                id
                name
              }
              chainId
            }
          }
        `;

        const data = await graphqlClient.request<{ ModifyLiquidity: any[] }>(
          POOL_MODIFY_LIQUIDITY_QUERY,
          {
            poolId,
            limit: 20,
          }
        );

        if (!isMounted) return;

        const eventsWithIds = data.ModifyLiquidity.map((event: any) => ({
          ...event,
          uniqueId: generateUniqueId(event.id),
        }));

        setEvents(eventsWithIds);
        setError(null);
      } catch (err) {
        console.error(
          "Error fetching pool liquidity events for pool:",
          poolId,
          err
        );
        if (isMounted) {
          setError("Failed to fetch liquidity events for this pool");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 5000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [poolId]);

  const getEventTimestamp = (timestamp: string) => {
    const eventTime = new Date(parseInt(timestamp) * 1000);
    const now = new Date();
    const diffSeconds = Math.floor(
      (now.getTime() - eventTime.getTime()) / 1000
    );

    if (diffSeconds < 5) {
      return "now";
    } else if (diffSeconds < 60) {
      return `${diffSeconds}s ago`;
    } else {
      return eventTime.toLocaleTimeString();
    }
  };

  return (
    <div className="border border-border/50 rounded-md overflow-hidden">
      <div className="p-3 border-b border-border/50 flex justify-between items-center">
        <h3 className="text-sm font-medium">Recent Liquidity Events</h3>
        <div className="text-xs text-muted-foreground">
          {events.length} recent events
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto p-2">
        {loading ? (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 p-4 text-center text-sm">{error}</div>
        ) : (
          <div className="space-y-1.5">
            {events.map((event) => {
              const chainId = extractChainId(event.chainId);
              const networkName = NETWORK_NAMES[chainId] || `Chain ${chainId}`;
              const token0Symbol = event.token0.symbol || "Token0";
              const token1Symbol = event.token1.symbol || "Token1";
              const formattedAmount = formatUSD(event.amountUSD);
              const timestamp = getEventTimestamp(event.timestamp);
              const poolName = event.pool?.name || "Unknown Pool";

              const isAddLiquidity = parseFloat(event.amount) > 0;
              const eventTypeLabel = isAddLiquidity ? "Add" : "Remove";
              const eventTypeColor = isAddLiquidity
                ? "text-green-500"
                : "text-red-500";

              return (
                <div
                  key={event.uniqueId}
                  className="bg-secondary/30 rounded-lg p-2 hover:bg-secondary/50 transition-colors group"
                >
                  <div className="flex justify-between items-center mb-0.5">
                    <div className="text-xs font-medium text-muted-foreground">
                      {timestamp}
                    </div>
                    <div className="text-xs bg-secondary/50 px-2 py-0.5 rounded-full">
                      {networkName}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 text-sm">
                      <span className={`font-medium ${eventTypeColor}`}>
                        {eventTypeLabel}
                      </span>
                      <span className="ml-1 font-medium">
                        {token0Symbol}/{token1Symbol}
                      </span>
                      <div className="text-xs text-muted-foreground truncate">
                        {poolName}
                      </div>
                    </div>
                    <div className="text-sm font-mono text-pink-500">
                      {formattedAmount}
                    </div>
                  </div>

                  <div className="text-xs mt-1 pt-1 border-t border-border/20 group-hover:!block hidden">
                    {(() => {
                      const amount0 = formatTokenAmount(
                        event.amount0,
                        event.token0.decimals
                      );
                      const amount1 = formatTokenAmount(
                        event.amount1,
                        event.token1.decimals
                      );

                      const amount0Value = parseFloat(event.amount0);
                      const amount1Value = parseFloat(event.amount1);

                      const token0Direction =
                        amount0Value > 0 ? "+" : amount0Value < 0 ? "-" : "";
                      const token1Direction =
                        amount1Value > 0 ? "+" : amount1Value < 0 ? "-" : "";

                      const token0Color =
                        amount0Value > 0
                          ? "text-green-500"
                          : amount0Value < 0
                            ? "text-red-500"
                            : "text-muted-foreground";
                      const token1Color =
                        amount1Value > 0
                          ? "text-green-500"
                          : amount1Value < 0
                            ? "text-red-500"
                            : "text-muted-foreground";

                      return (
                        <>
                          <div className={token0Color}>
                            {token0Direction} {amount0} {token0Symbol}
                          </div>
                          <div className={token1Color}>
                            {token1Direction} {amount1} {token1Symbol}
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  <div className="text-xs mt-1 pt-1 border-t border-border/20 text-muted-foreground group-hover:!block hidden">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span className="whitespace-nowrap font-medium">Tx:</span>
                      <span className="text-xs font-mono">
                        {event.transaction.substring(0, 6)}...
                        {event.transaction.substring(
                          event.transaction.length - 4
                        )}
                      </span>
                      <div className="flex">
                        <button
                          className="p-1 hover:bg-pink-500/10 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(event.transaction);
                          }}
                          title="Copy transaction hash"
                        >
                          <Copy size={11} className="text-pink-500" />
                        </button>
                        <a
                          href={getBlockExplorerUrl(chainId, event.transaction)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 hover:bg-pink-500/10 rounded-full"
                          onClick={(e) => e.stopPropagation()}
                          title="View on block explorer"
                        >
                          <ExternalLink size={11} className="text-pink-500" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function Orderbook() {
  const [poolId, setPoolId] = useState<string>(DEFAULT_POOL_ID);
  const [pool, setPool] = useState<Pool | null>(null);
  const [tokens, setTokens] = useState<Record<string, Token>>({});
  const [ticks, setTicks] = useState<Tick[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [ethPriceUSD, setEthPriceUSD] = useState<number | null>(null);
  const [invertPrices, setInvertPrices] = useState<boolean>(false);
  const [refreshNonce, setRefreshNonce] = useState<number>(0);
  const [topPools, setTopPools] = useState<any[]>([]);
  const [showPoolDropdown, setShowPoolDropdown] = useState<boolean>(false);
  const [histogramTickRange, setHistogramTickRange] = useState<number>(60);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // fetch top pools for dropdown
  useEffect(() => {
    let mounted = true;
    const fetchTopPools = async () => {
      try {
        const data = await graphqlClient.request<{ Pool: any[] }>(POOLS_QUERY);
        if (mounted && data.Pool) {
          // Take top 20 pools with meaningful TVL
          const filteredPools = data.Pool.filter(
            (p) =>
              p.totalValueLockedUSD && parseFloat(p.totalValueLockedUSD) > 1000
          ).slice(0, 20);
          setTopPools(filteredPools);
        }
      } catch (err) {
        console.error("Error fetching top pools:", err);
      }
    };

    fetchTopPools();
    return () => {
      mounted = false;
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowPoolDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // fetch pool metadata
  useEffect(() => {
    let mounted = true;
    const fetchPool = async () => {
      try {
        setLoading(true);
        const data = await graphqlClient.request<{ Pool: Pool[] }>(
          POOL_BY_ID_QUERY,
          { poolId }
        );
        const p = data.Pool?.[0] ?? null;
        if (!mounted) return;
        setPool(p);
        setError(null);
        if (p) {
          // fetch tokens
          const tokenIds = [p.token0, p.token1];
          const tokensResp = await graphqlClient.request<{ Token: Token[] }>(
            TOKENS_BY_IDS_QUERY,
            { ids: tokenIds }
          );
          const map: Record<string, Token> = {};
          (tokensResp.Token || []).forEach((t) => (map[t.id] = t));
          if (!mounted) return;
          setTokens(map);

          // fetch bundle for USD conversions
          try {
            const bundleResp = await graphqlClient.request<{
              Bundle: { id: string; ethPriceUSD: string }[];
            }>(BUNDLE_QUERY);
            const price = parseFloat(
              bundleResp.Bundle?.[0]?.ethPriceUSD ?? "0"
            );
            if (mounted && price > 0) setEthPriceUSD(price);
          } catch {}
        }
      } catch (e) {
        if (!mounted) return;
        setError("Failed to load pool");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchPool();
    return () => {
      mounted = false;
    };
  }, [poolId, refreshNonce]);

  // fetch ticks around current tick
  useEffect(() => {
    if (!pool || pool.tick == null) return;
    let mounted = true;
    const fetchTicks = async () => {
      try {
        const currentTick = parseInt(pool.tick as string, 10);
        const range = 4000; // show ticks within +/- range
        const res = await graphqlClient.request<{ Tick: Tick[] }>(
          TICKS_BY_POOL_RANGE_QUERY,
          {
            poolId,
            minTick: currentTick - range,
            maxTick: currentTick + range,
            limit: 2000,
          }
        );
        if (!mounted) return;
        setTicks(res.Tick || []);
      } catch (e) {
        if (!mounted) return;
        setError("Failed to load ticks");
      }
    };
    fetchTicks();
    const id = setInterval(fetchTicks, 5000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [pool, poolId, refreshNonce]);

  const currentPrice = useMemo(() => {
    if (!pool || !ticks.length) return 0;
    const currentTick = parseInt(pool.tick as string, 10);
    const token0Decimals = parseInt(
      (tokens[pool.token0]?.decimals as string) ?? "18",
      10
    );
    const token1Decimals = parseInt(
      (tokens[pool.token1]?.decimals as string) ?? "18",
      10
    );
    const priceToken0InToken1FromTick = (tick: number) => {
      const ratio = Math.pow(1.0001, tick);
      return ratio * Math.pow(10, token0Decimals - token1Decimals);
    };
    return priceToken0InToken1FromTick(currentTick);
  }, [ticks, pool, tokens]);

  const token0 = pool ? tokens[pool.token0] : undefined;
  const token1 = pool ? tokens[pool.token1] : undefined;
  const token0USD = useMemo(() => {
    if (!token0 || token0.derivedETH == null || ethPriceUSD == null)
      return null;
    const derived = parseFloat(token0.derivedETH);
    const ethUsd = ethPriceUSD;
    if (!isFinite(derived) || derived <= 0 || !isFinite(ethUsd) || ethUsd <= 0)
      return null;
    return derived * ethUsd;
  }, [token0, ethPriceUSD]);
  const token1USD = useMemo(() => {
    if (!token1 || token1.derivedETH == null || ethPriceUSD == null)
      return null;
    const derived = parseFloat(token1.derivedETH);
    const ethUsd = ethPriceUSD;
    if (!isFinite(derived) || derived <= 0 || !isFinite(ethUsd) || ethUsd <= 0)
      return null;
    return derived * ethUsd;
  }, [token1, ethPriceUSD]);
  const tickRows = useMemo(() => {
    if (!pool || !ticks.length)
      return [] as {
        tickIdx: number;
        price: number;
        netLiquidity: number;
        grossLiquidity: number;
        usdValueGross: number | null;
        amount0: number | null;
        amount1: number | null;
      }[];

    const token0Decimals = parseInt(
      (tokens[pool.token0]?.decimals as string) ?? "18",
      10
    );
    const token1Decimals = parseInt(
      (tokens[pool.token1]?.decimals as string) ?? "18",
      10
    );
    const spacing = parseInt(pool.tickSpacing as string, 10) || 1;
    const priceToken0InToken1FromTick = (tick: number) => {
      const ratio = Math.pow(1.0001, tick);
      return ratio * Math.pow(10, token0Decimals - token1Decimals);
    };

    // Step 1: cumulative sum of liquidityNet across fetched ticks (raw, unanchored)
    const sortedTicks = [...ticks].sort(
      (a, b) => parseInt(a.tickIdx, 10) - parseInt(b.tickIdx, 10)
    );
    let runningL = 0;
    const rawCumLByTick = new Map<number, number>();
    for (const t of sortedTicks) {
      const idx = parseInt(t.tickIdx, 10);
      const net = parseFloat(t.liquidityNet || "0");
      runningL += net;
      rawCumLByTick.set(idx, runningL);
    }

    // Step 2: anchor to pool.liquidity at the active tick boundary using an offset
    const poolLiquidity = parseFloat(pool.liquidity || "0");
    const activeTick =
      Math.floor(parseInt(pool.tick as string, 10) / spacing) * spacing;
    // find raw cumulative L at the greatest tick <= activeTick
    let rawAtActive = 0;
    for (const idx of Array.from(rawCumLByTick.keys()).sort((a, b) => a - b)) {
      if (idx <= activeTick) {
        rawAtActive = rawCumLByTick.get(idx) || 0;
      } else {
        break;
      }
    }
    const offset = poolLiquidity - rawAtActive;

    // Final anchored active liquidity per tick boundary
    const activeLiquidityByTick = new Map<number, number>();
    for (const [idx, rawL] of rawCumLByTick.entries()) {
      activeLiquidityByTick.set(idx, rawL + offset);
    }

    const currentP = currentPrice;
    const sp = isFinite(currentP) && currentP > 0 ? Math.sqrt(currentP) : null;

    return ticks.map((t) => {
      const tickIdx = parseInt(t.tickIdx, 10);
      const price = priceToken0InToken1FromTick(tickIdx);
      const netLiquidity = parseFloat(t.liquidityNet || "0");
      const grossLiquidity = parseFloat(t.liquidityGross || "0");
      // Compute USD depth across [tickIdx, tickIdx + spacing) using ACTIVE L and proper Uniswap math
      let usdValueGross: number | null = null;
      let amount0: number | null = null; // human units (decimal adjusted)
      let amount1: number | null = null; // human units (decimal adjusted)
      const L = activeLiquidityByTick.get(tickIdx) ?? poolLiquidity; // fallback to pool L if absent

      if (
        token0USD != null &&
        token1USD != null &&
        L > 0 &&
        pool?.tick != null
      ) {
        try {
          // Use proper Uniswap math with bigint precision
          const currentTick = BigInt(parseInt(pool.tick as string, 10));
          const tickLower = BigInt(tickIdx);
          const tickUpper = BigInt(tickIdx + spacing);
          const liquidityBigInt = BigInt(Math.floor(L));

          // Get current sqrt price from current tick
          const currSqrtPriceX96 = TickMath.getSqrtRatioAtTick(currentTick);

          // Calculate amounts using proper Uniswap math
          const amount0BigInt = getAmount0(
            tickLower,
            tickUpper,
            currentTick,
            liquidityBigInt,
            currSqrtPriceX96
          );

          const amount1BigInt = getAmount1(
            tickLower,
            tickUpper,
            currentTick,
            liquidityBigInt,
            currSqrtPriceX96
          );

          // Convert to human units using actual token decimals from fetched token objects
          const token0Dec = parseInt(tokens[pool.token0]?.decimals || "18", 10);
          const token1Dec = parseInt(tokens[pool.token1]?.decimals || "18", 10);

          const amount0Tokens = Number(amount0BigInt) / Math.pow(10, token0Dec);
          const amount1Tokens = Number(amount1BigInt) / Math.pow(10, token1Dec);

          amount0 = amount0Tokens;
          amount1 = amount1Tokens;
          usdValueGross = amount0Tokens * token0USD + amount1Tokens * token1USD;
        } catch (error) {
          // Fallback to null on any calculation error
          console.warn("Liquidity calculation error for tick", tickIdx, error);
          amount0 = null;
          amount1 = null;
          usdValueGross = null;
        }
      }
      return {
        tickIdx,
        price,
        netLiquidity,
        grossLiquidity,
        usdValueGross,
        amount0,
        amount1,
      };
    });
  }, [ticks, pool, tokens, token0USD, token1USD]);
  const lastPriceUSD = useMemo(() => {
    if (!token1USD) return null;
    const p = currentPrice;
    if (!isFinite(p) || p <= 0) return null;
    return p * token1USD;
  }, [token1USD, currentPrice]);

  // Compute the active tick index based on current tick and spacing
  const activeTickIdx = useMemo(() => {
    if (!pool || pool.tick == null || pool.tickSpacing == null)
      return null as number | null;
    const currentTick = parseInt(pool.tick as string, 10);
    const spacing = parseInt(pool.tickSpacing as string, 10) || 1;
    return Math.floor(currentTick / spacing) * spacing;
  }, [pool]);

  // Limit the displayed rows based on histogram tick range, centered around the active tick
  const displayTickRows = useMemo(() => {
    if (!tickRows.length) return tickRows;
    if (activeTickIdx == null || !pool) return tickRows;
    const spacing = parseInt(pool.tickSpacing as string, 10) || 1;
    const halfWindow = Math.floor(histogramTickRange / 2);
    const minTick = activeTickIdx - spacing * halfWindow;
    const maxTick = activeTickIdx + spacing * (halfWindow - 1);
    const filtered = tickRows.filter(
      (r) => r.tickIdx >= minTick && r.tickIdx <= maxTick
    );
    // If more than expected for any reason, trim to expected range centered around active
    if (filtered.length > histogramTickRange) {
      // Ensure active is within slice
      const activeIndex = filtered.findIndex(
        (r) => r.tickIdx === activeTickIdx
      );
      const start = Math.max(
        0,
        Math.min(activeIndex - halfWindow, filtered.length - histogramTickRange)
      );
      return filtered.slice(start, start + histogramTickRange);
    }
    return filtered;
  }, [tickRows, activeTickIdx, pool, histogramTickRange]);

  return (
    <div className="space-y-4">
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-500 text-sm">{error}</div>}

      {pool && (
        <div className="bg-gradient-to-r from-background to-secondary/5 rounded-lg border border-border/30 p-4 space-y-4">
          {/* Header Section */}
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-3">
                <div className="text-lg font-semibold text-foreground">
                  {token0?.symbol ?? "Token0"} / {token1?.symbol ?? "Token1"}
                </div>
                <div className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                  {(Number(pool.feeTier) / 1e4).toFixed(2)}%
                </div>
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                <span>
                  {NETWORK_NAMES[pool.chainId] || `Chain ${pool.chainId}`}
                </span>
                <span>•</span>
                <span className="whitespace-nowrap text-[11px]">
                  Created{" "}
                  {pool.createdAtTimestamp
                    ? new Date(
                        Number(pool.createdAtTimestamp) * 1000
                      ).toLocaleDateString(undefined, {
                        year: "2-digit",
                        month: "2-digit",
                        day: "2-digit",
                      })
                    : "Unknown"}
                </span>
                <span>•</span>
                {pool.hooks && !isZeroAddress(pool.hooks) ? (
                  <a
                    className="px-2 py-0.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    href={`${NETWORK_EXPLORER_URLS[pool.chainId] || "https://etherscan.io"}/address/${pool.hooks}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="View hook contract"
                  >
                    Hooked
                  </a>
                ) : (
                  <span className="text-muted-foreground">Non-hooked</span>
                )}
              </div>
            </div>
            {/* Compact Pool Picker on the right */}
            <div className="flex flex-col items-end gap-1">
              <div ref={dropdownRef} className="relative">
                <input
                  className="w-[360px] max-w-[48vw] px-2 py-1 rounded-md border border-border/50 bg-background pr-14 text-xs font-mono"
                  value={poolId}
                  onChange={(e) => setPoolId(e.target.value)}
                  placeholder="chainId_poolId (e.g. 1_0x...)"
                />
                <button
                  className="absolute right-8 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground rounded"
                  onClick={() => setShowPoolDropdown(!showPoolDropdown)}
                  title="Select from top pools"
                >
                  ▼
                </button>
                {showPoolDropdown && topPools.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border/50 rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
                    {topPools.map((pool) => (
                      <button
                        key={pool.id}
                        className="w-full px-3 py-2 text-left hover:bg-secondary/40 border-b border-border/20 last:border-b-0"
                        onClick={() => {
                          setPoolId(pool.id);
                          setShowPoolDropdown(false);
                        }}
                      >
                        <div className="text-sm font-medium truncate">
                          {pool.name ||
                            `${pool.token0?.slice(0, 6)}.../${pool.token1?.slice(0, 6)}...`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          TVL: $
                          {parseFloat(
                            pool.totalValueLockedUSD || "0"
                          ).toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                <button
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setRefreshNonce((n) => n + 1)}
                  title="Refresh"
                >
                  ↻
                </button>
              </div>
              <div className="text-[10px] text-muted-foreground">
                Enter chainId_poolId to view any pool
              </div>
            </div>
          </div>

          {/* Price Section */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold tracking-tight">
                  {(invertPrices && currentPrice > 0
                    ? 1 / currentPrice
                    : currentPrice
                  ).toLocaleString(undefined, {
                    maximumFractionDigits: 6,
                  })}
                </div>
                <button
                  className="px-2 py-0.5 text-xs font-medium rounded border border-border/50 hover:bg-secondary/50 transition-colors"
                  onClick={() => setInvertPrices((v) => !v)}
                >
                  {invertPrices
                    ? `${token0?.symbol}/${token1?.symbol}`
                    : `${token1?.symbol}/${token0?.symbol}`}
                </button>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div>
                  1 {token0?.symbol} ={" "}
                  {currentPrice > 0
                    ? currentPrice.toLocaleString(undefined, {
                        maximumFractionDigits: 6,
                      })
                    : "-"}{" "}
                  {token1?.symbol}
                </div>
                <div>•</div>
                <div>
                  1 {token1?.symbol} ={" "}
                  {currentPrice > 0
                    ? (1 / currentPrice).toLocaleString(undefined, {
                        maximumFractionDigits: 8,
                      })
                    : "-"}{" "}
                  {token0?.symbol}
                </div>
              </div>
            </div>

            {(lastPriceUSD || token1USD) && (
              <div className="text-right space-y-0.5">
                {lastPriceUSD && (
                  <div className="text-base font-semibold">
                    $
                    {lastPriceUSD.toLocaleString(undefined, {
                      maximumFractionDigits: 4,
                    })}
                  </div>
                )}
                {token1USD && (
                  <div className="text-xs text-muted-foreground">
                    {token1?.symbol} ≈ $
                    {token1USD.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-3">
            <div className="rounded border border-border/40 bg-background/50 p-3 hover:border-border/60 transition-colors">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                TVL
              </div>
              <div className="text-sm font-bold">
                {pool.totalValueLockedUSD
                  ? `$${Number(pool.totalValueLockedUSD).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                  : "-"}
              </div>
            </div>

            <div className="rounded border border-border/40 bg-background/50 p-3 hover:border-border/60 transition-colors">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Volume
              </div>
              <div className="text-sm font-bold">
                {pool.volumeUSD
                  ? `$${Number(pool.volumeUSD).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                  : "-"}
              </div>
            </div>

            <div className="rounded border border-border/40 bg-background/50 p-3 hover:border-border/60 transition-colors">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Fees
              </div>
              <div className="text-sm font-bold">
                {pool.feesUSD
                  ? `$${Number(pool.feesUSD).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                  : "-"}
              </div>
            </div>

            <div className="rounded border border-border/40 bg-background/50 p-3 hover:border-border/60 transition-colors">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Transactions
              </div>
              <div className="text-sm font-bold">
                {pool.txCount ? Number(pool.txCount).toLocaleString() : "-"}
              </div>
            </div>
          </div>

          {/* Hook Address */}
          {pool.hooks &&
            pool.hooks !== "0x0000000000000000000000000000000000000000" && (
              <div className="rounded-lg border border-border/30 bg-secondary/10 p-4">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Hook Contract
                </div>
                <div className="font-mono text-sm break-all text-foreground/90">
                  {pool.hooks}
                </div>
              </div>
            )}
        </div>
      )}

      {/* Liquidity Histogram (Recharts) */}
      <div>
        <div className="text-xs mb-2">Liquidity Distribution</div>
        <LiquidityHistogram
          data={displayTickRows.map((r) => {
            const amt0 = r.amount0 ?? 0;
            const amt1 = r.amount1 ?? 0;
            const usd0 = token0USD != null ? amt0 * token0USD : 0;
            const usd1 = token1USD != null ? amt1 * token1USD : 0;
            return {
              price: r.price,
              usd: (r.usdValueGross ?? 0) || usd0 + usd1,
              tickIdx: r.tickIdx,
              active: activeTickIdx != null && r.tickIdx === activeTickIdx,
              amount0: amt0,
              amount1: amt1,
              usd0,
              usd1,
            };
          })}
          tickRange={histogramTickRange}
          onTickRangeChange={setHistogramTickRange}
          token0Symbol={token0?.symbol}
          token1Symbol={token1?.symbol}
        />
      </div>

      <div>
        <div className="text-xs mb-2">Tick Liquidity</div>
        <div className="border border-border/50 rounded-md overflow-hidden">
          <div className="max-h-72 overflow-auto">
            <div
              className="grid text-xs px-2 py-1 bg-secondary/80 sticky top-0 z-10"
              style={{
                gridTemplateColumns: "70px 90px 120px 120px 140px 140px 180px",
              }}
            >
              <div>Tick</div>
              <div className="text-right">Price</div>
              <div className="text-right">Net</div>
              <div className="text-right">Gross</div>
              <div className="text-right">{token0?.symbol ?? "Token0"}</div>
              <div className="text-right">{token1?.symbol ?? "Token1"}</div>
              <div className="text-right">USD</div>
            </div>
            {displayTickRows.map((row) => {
              const isCurrentTick = (() => {
                if (!pool || pool.tick == null || pool.tickSpacing == null)
                  return false;
                const currentTick = parseInt(pool.tick as string, 10);
                const spacing = parseInt(pool.tickSpacing as string, 10) || 1;
                const activeTick = Math.floor(currentTick / spacing) * spacing;
                return activeTick === row.tickIdx;
              })();
              return (
                <motion.div
                  key={`tick-${row.tickIdx}`}
                  className={`grid px-2 py-1 text-xs ${
                    isCurrentTick
                      ? "bg-yellow-400/30 border-l-4 border-yellow-500 font-semibold text-yellow-900 dark:text-yellow-100"
                      : "hover:bg-secondary/20"
                  }`}
                  style={{
                    gridTemplateColumns:
                      "70px 90px 120px 120px 140px 140px 180px",
                  }}
                >
                  <div>{row.tickIdx}</div>
                  <div className="text-right">
                    {isFinite(row.price) ? row.price.toFixed(2) : "-"}
                  </div>
                  <div className="text-right">
                    {isFinite(row.netLiquidity)
                      ? row.netLiquidity.toLocaleString()
                      : "-"}
                  </div>
                  <div className="text-right">
                    {isFinite(row.grossLiquidity)
                      ? row.grossLiquidity.toLocaleString()
                      : "-"}
                  </div>
                  <div className="text-right">
                    {row.amount0 != null
                      ? row.amount0.toLocaleString(undefined, {
                          maximumFractionDigits: 6,
                        })
                      : "-"}
                  </div>
                  <div className="text-right">
                    {row.amount1 != null
                      ? row.amount1.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })
                      : "-"}
                  </div>
                  <div className="text-right">
                    {row.usdValueGross != null
                      ? `$${row.usdValueGross.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                      : "-"}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Pool Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PoolRecentSwaps poolId={poolId} />
        <PoolRecentLiquidity poolId={poolId} />
      </div>
    </div>
  );
}

export default Orderbook;
