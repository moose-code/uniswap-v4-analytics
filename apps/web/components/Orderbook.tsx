"use client";

import { useEffect, useMemo, useState } from "react";
import {
  graphqlClient,
  POOL_BY_ID_QUERY,
  TOKENS_BY_IDS_QUERY,
  TICKS_BY_POOL_RANGE_QUERY,
  BUNDLE_QUERY,
} from "@/lib/graphql";
import { motion } from "framer-motion";

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
  "130_0x3258f413c7a88cda2fa8709a589d221a80f6574f63df5a5b6774485d8acc39d9";

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
    if (!token0 || !token0.derivedETH || !ethPriceUSD) return null;
    return parseFloat(token0.derivedETH) * ethPriceUSD;
  }, [token0, ethPriceUSD]);
  const token1USD = useMemo(() => {
    if (!token1 || !token1.derivedETH || !ethPriceUSD) return null;
    return parseFloat(token1.derivedETH) * ethPriceUSD;
  }, [token1, ethPriceUSD]);
  const tickRows = useMemo(() => {
    if (!pool || !ticks.length)
      return [] as {
        tickIdx: number;
        price: number;
        netLiquidity: number;
        grossLiquidity: number;
        usdValueGross: number | null;
      }[];

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

    return ticks.map((t) => {
      const tickIdx = parseInt(t.tickIdx, 10);
      const price = priceToken0InToken1FromTick(tickIdx);
      const netLiquidity = parseFloat(t.liquidityNet || "0");
      const grossLiquidity = parseFloat(t.liquidityGross || "0");
      // Estimate USD value across one tick range using liquidity and sqrt price delta
      let usdValueGross: number | null = null;
      if (
        token0USD != null &&
        token1USD != null &&
        isFinite(price) &&
        grossLiquidity > 0
      ) {
        const pA = price;
        const pB = priceToken0InToken1FromTick(tickIdx + 1);
        const sA = Math.sqrt(pA);
        const sB = Math.sqrt(pB);
        const deltaS = sB - sA;
        if (deltaS > 0 && isFinite(deltaS) && sA > 0 && sB > 0) {
          const amount0 = grossLiquidity * (deltaS / (sA * sB));
          const amount1 = grossLiquidity * deltaS;
          usdValueGross = amount0 * token0USD + amount1 * token1USD;
        }
      }
      return { tickIdx, price, netLiquidity, grossLiquidity, usdValueGross };
    });
  }, [ticks, pool, tokens, token1USD]);
  const lastPriceUSD = useMemo(() => {
    if (!token1USD) return null;
    const p = currentPrice;
    if (!isFinite(p) || p <= 0) return null;
    return p * token1USD;
  }, [token1USD, currentPrice]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          className="w-full max-w-xl px-3 py-2 rounded-md border border-border/50 bg-background"
          value={poolId}
          onChange={(e) => setPoolId(e.target.value)}
          placeholder="Pool ID (e.g. 130_0x...)"
        />
        <button
          className="px-3 py-2 text-xs rounded-md border border-border/50 hover:bg-secondary/40"
          onClick={() => setRefreshNonce((n) => n + 1)}
          title="Refresh"
        >
          Refresh
        </button>
      </div>
      <div className="text-[10px] text-muted-foreground">
        Enter chainId_poolId to show order book for any pool
      </div>

      {loading && <div>Loading...</div>}
      {error && <div className="text-red-500 text-sm">{error}</div>}

      {pool && (
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            Pair: {token0?.symbol ?? "Token0"} / {token1?.symbol ?? "Token1"} •
            Fee: {(Number(pool.feeTier) / 1e4).toFixed(2)}%
          </div>
          <div className="flex items-center gap-3">
            <div className="text-2xl font-semibold">
              {(invertPrices && currentPrice > 0
                ? 1 / currentPrice
                : currentPrice
              ).toLocaleString(undefined, {
                maximumFractionDigits: 6,
              })}
            </div>
            <button
              className="text-xs px-2 py-1 rounded-md border border-border/50 hover:bg-secondary/40"
              onClick={() => setInvertPrices((v) => !v)}
            >
              {invertPrices
                ? `${token0?.symbol ?? "Token0"}/${token1?.symbol ?? "Token1"}`
                : `${token1?.symbol ?? "Token1"}/${token0?.symbol ?? "Token0"}`}
            </button>
          </div>
          <div className="text-xs">
            <div>
              1 {token0?.symbol ?? "Token0"} ={" "}
              {currentPrice > 0
                ? currentPrice.toLocaleString(undefined, {
                    maximumFractionDigits: 6,
                  })
                : "-"}{" "}
              {token1?.symbol ?? "Token1"}
            </div>
            <div>
              1 {token1?.symbol ?? "Token1"} ={" "}
              {currentPrice > 0
                ? (1 / currentPrice).toLocaleString(undefined, {
                    maximumFractionDigits: 8,
                  })
                : "-"}{" "}
              {token0?.symbol ?? "Token0"}
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {lastPriceUSD
              ? `Last price: $${lastPriceUSD.toLocaleString(undefined, {
                  maximumFractionDigits: 4,
                })} per ${token0?.symbol}`
              : ""}
            {token1USD
              ? ` • ${token1?.symbol} ≈ $${token1USD.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}`
              : ""}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="rounded-md border border-border/50 p-2">
              <div className="text-muted-foreground">TVL</div>
              <div className="font-medium">
                {pool.totalValueLockedUSD
                  ? `$${Number(pool.totalValueLockedUSD).toLocaleString(
                      undefined,
                      {
                        maximumFractionDigits: 0,
                      }
                    )}`
                  : "-"}
              </div>
            </div>
            <div className="rounded-md border border-border/50 p-2">
              <div className="text-muted-foreground">Volume</div>
              <div className="font-medium">
                {pool.volumeUSD
                  ? `$${Number(pool.volumeUSD).toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}`
                  : "-"}
              </div>
            </div>
            <div className="rounded-md border border-border/50 p-2">
              <div className="text-muted-foreground">Fees</div>
              <div className="font-medium">
                {pool.feesUSD
                  ? `$${Number(pool.feesUSD).toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}`
                  : "-"}
              </div>
            </div>
            <div className="rounded-md border border-border/50 p-2">
              <div className="text-muted-foreground">Tx Count</div>
              <div className="font-medium">
                {pool.txCount ? Number(pool.txCount).toLocaleString() : "-"}
              </div>
            </div>
            <div className="rounded-md border border-border/50 p-2">
              <div className="text-muted-foreground">Token0 Price</div>
              <div className="font-medium">
                {token0USD != null
                  ? `$${token0USD.toLocaleString(undefined, { maximumFractionDigits: 6 })}`
                  : "-"}
              </div>
            </div>
            <div className="rounded-md border border-border/50 p-2">
              <div className="text-muted-foreground">Token1 Price</div>
              <div className="font-medium">
                {token1USD != null
                  ? `$${token1USD.toLocaleString(undefined, { maximumFractionDigits: 6 })}`
                  : "-"}
              </div>
            </div>
            <div className="rounded-md border border-border/50 p-2">
              <div className="text-muted-foreground">
                TVL in {token0?.symbol ?? "Token0"} (USD)
              </div>
              <div className="font-medium">
                {pool.totalValueLockedToken0 && token0USD != null
                  ? `$${(Number(pool.totalValueLockedToken0) * token0USD).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                  : "-"}
              </div>
            </div>
            <div className="rounded-md border border-border/50 p-2">
              <div className="text-muted-foreground">
                TVL in {token1?.symbol ?? "Token1"} (USD)
              </div>
              <div className="font-medium">
                {pool.totalValueLockedToken1 && token1USD != null
                  ? `$${(Number(pool.totalValueLockedToken1) * token1USD).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                  : "-"}
              </div>
            </div>
            <div className="rounded-md border border-border/50 p-2">
              <div className="text-muted-foreground">TVL (ETH USD)</div>
              <div className="font-medium">
                {pool.totalValueLockedETH && ethPriceUSD
                  ? `$${(Number(pool.totalValueLockedETH) * ethPriceUSD).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                  : "-"}
              </div>
            </div>

            <div className="rounded-md border border-border/50 p-2 col-span-2">
              <div className="text-muted-foreground">Hook</div>
              <div className="font-mono text-[11px] break-all">
                {pool.hooks ?? "-"}
              </div>
            </div>
            <div className="rounded-md border border-border/50 p-2">
              <div className="text-muted-foreground">Current Tick</div>
              <div className="font-medium">{pool.tick ?? "-"}</div>
            </div>
            <div className="rounded-md border border-border/50 p-2">
              <div className="text-muted-foreground">Created</div>
              <div className="font-medium">
                {pool.createdAtTimestamp
                  ? new Date(
                      Number(pool.createdAtTimestamp) * 1000
                    ).toLocaleString()
                  : "-"}
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <div className="text-xs mb-2">Tick Liquidity</div>
        <div className="border border-border/50 rounded-md overflow-hidden">
          <div
            className="grid text-xs px-2 py-1 bg-secondary/40"
            style={{ gridTemplateColumns: "70px 90px 160px 160px 160px" }}
          >
            <div>Tick</div>
            <div className="text-right">Price</div>
            <div className="text-right">Net</div>
            <div className="text-right">Gross</div>
            <div className="text-right">Gross USD</div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {tickRows.map((row) => {
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
                  style={{ gridTemplateColumns: "70px 90px 160px 160px 160px" }}
                >
                  <div>{row.tickIdx}</div>
                  <div className="text-right">
                    {isFinite(row.price) ? row.price.toFixed(6) : "-"}
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
    </div>
  );
}

export default Orderbook;
