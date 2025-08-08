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
  token0: string; // token id
  token1: string; // token id
  feeTier: string;
  liquidity: string;
  sqrtPrice: string;
  token0Price: string;
  token1Price: string;
  tick: string | null;
  tickSpacing: string;
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
  }, [poolId]);

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
  }, [pool, poolId]);

  const ladder = useMemo(() => {
    if (!pool || !ticks.length)
      return { bids: [], asks: [], currentPrice: 0 } as {
        bids: { price: number; liquidity: number }[];
        asks: { price: number; liquidity: number }[];
        currentPrice: number;
      };

    const currentTick = parseInt(pool.tick as string, 10);
    const token0Decimals = parseInt(
      (tokens[pool.token0]?.decimals as string) ?? "18",
      10
    );
    const token1Decimals = parseInt(
      (tokens[pool.token1]?.decimals as string) ?? "18",
      10
    );

    // Price of token0 in terms of token1 (e.g., USDC per ETH for ETH/USDC)
    const priceToken0InToken1FromTick = (tick: number) => {
      const ratio = Math.pow(1.0001, tick);
      return ratio * Math.pow(10, token0Decimals - token1Decimals);
    };
    const bids: { price: number; liquidity: number }[] = [];
    const asks: { price: number; liquidity: number }[] = [];

    for (const t of ticks) {
      const tickIdx = parseInt(t.tickIdx, 10);
      const liq = Math.abs(parseFloat(t.liquidityNet || "0"));
      // Compute price ourselves to avoid orientation/decimals issues from the API
      const price = priceToken0InToken1FromTick(tickIdx);
      if (!isFinite(price) || !isFinite(liq)) continue;
      if (tickIdx <= currentTick) bids.push({ price, liquidity: liq });
      else asks.push({ price, liquidity: liq });
    }

    // aggregate by rounding price for a simple ladder
    const bucket = (
      arr: { price: number; liquidity: number }[],
      stepPct: number
    ) => {
      const map = new Map<number, number>();
      for (const { price, liquidity } of arr) {
        const key = Math.round(price / (price * stepPct)) * (price * stepPct);
        const prev = map.get(key) || 0;
        map.set(key, prev + liquidity);
      }
      const out = Array.from(map.entries()).map(([price, liquidity]) => ({
        price,
        liquidity,
      }));
      return out.sort((a, b) => a.price - b.price);
    };

    const step = 0.001; // 0.1%
    const bidBook = bucket(bids, step);
    const askBook = bucket(asks, step);
    const currentPrice = priceToken0InToken1FromTick(currentTick);
    return {
      bids: bidBook.slice(-30),
      asks: askBook.slice(0, 30),
      currentPrice,
    };
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
  const lastPriceUSD = useMemo(() => {
    if (!token1USD) return null;
    const p = ladder.currentPrice;
    if (!isFinite(p) || p <= 0) return null;
    return p * token1USD;
  }, [token1USD, ladder.currentPrice]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          className="w-full max-w-xl px-3 py-2 rounded-md border border-border/50 bg-background"
          value={poolId}
          onChange={(e) => setPoolId(e.target.value)}
          placeholder="Pool ID (e.g. 130_0x...)"
        />
      </div>
      <div className="text-[10px] text-muted-foreground">
        Enter chainId_poolId to show order book for any pool
      </div>

      {loading && <div>Loading...</div>}
      {error && <div className="text-red-500 text-sm">{error}</div>}

      {pool && (
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">
            Pair: {token0?.symbol ?? "Token0"} / {token1?.symbol ?? "Token1"} •
            Fee: {(Number(pool.feeTier) / 1e4).toFixed(2)}%
          </div>
          <div className="flex items-center gap-3">
            <div className="text-2xl font-semibold">
              {(invertPrices && ladder.currentPrice > 0
                ? 1 / ladder.currentPrice
                : ladder.currentPrice
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
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs mb-2">Bids</div>
          <div className="border border-border/50 rounded-md overflow-hidden">
            <div className="grid grid-cols-2 text-xs px-2 py-1 bg-secondary/40">
              <div>Price</div>
              <div className="text-right">Liquidity</div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {(() => {
                // Optionally invert and sort for display
                const rows = invertPrices
                  ? ladder.bids
                      .map((r) => ({
                        price: r.price > 0 ? 1 / r.price : 0,
                        liquidity: r.liquidity,
                      }))
                      .sort((a, b) => a.price - b.price)
                  : [...ladder.bids];
                const cumulative: number[] = [];
                let run = 0;
                for (const b of rows) {
                  run += b.liquidity;
                  cumulative.push(run);
                }
                const max = Math.max(...cumulative, 1);
                return rows.map((row, idx) => (
                  <motion.div
                    key={`bid-${idx}`}
                    className="relative grid grid-cols-2 px-2 py-1 text-xs"
                  >
                    <div className="relative">
                      <div
                        className="absolute right-0 top-1/2 -translate-y-1/2 h-3 bg-green-500/30 rounded-sm"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(0, ((cumulative[idx] || 0) / max) * 100)
                          )}%`,
                        }}
                      />
                      <span className="relative z-10">
                        {row.price.toFixed(6)}
                      </span>
                    </div>
                    <div className="text-right">{row.liquidity.toFixed(2)}</div>
                  </motion.div>
                ));
              })()}
            </div>
          </div>
        </div>
        <div>
          <div className="text-xs mb-2">Asks</div>
          <div className="border border-border/50 rounded-md overflow-hidden">
            <div className="grid grid-cols-2 text-xs px-2 py-1 bg-secondary/40">
              <div>Price</div>
              <div className="text-right">Liquidity</div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {(() => {
                const rows = invertPrices
                  ? ladder.asks
                      .map((r) => ({
                        price: r.price > 0 ? 1 / r.price : 0,
                        liquidity: r.liquidity,
                      }))
                      .sort((a, b) => a.price - b.price)
                  : [...ladder.asks];
                const cumulative: number[] = [];
                let run = 0;
                for (const a of rows) {
                  run += a.liquidity;
                  cumulative.push(run);
                }
                const max = Math.max(...cumulative, 1);
                return rows.map((row, idx) => (
                  <motion.div
                    key={`ask-${idx}`}
                    className="relative grid grid-cols-2 px-2 py-1 text-xs"
                  >
                    <div className="relative">
                      <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-3 bg-pink-500/30 rounded-sm"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(0, ((cumulative[idx] || 0) / max) * 100)
                          )}%`,
                        }}
                      />
                      <span className="relative z-10">
                        {row.price.toFixed(6)}
                      </span>
                    </div>
                    <div className="text-right">{row.liquidity.toFixed(2)}</div>
                  </motion.div>
                ));
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Orderbook;
