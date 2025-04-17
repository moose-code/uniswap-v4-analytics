import { GraphQLClient } from "graphql-request";

// Use the local API route instead of the direct GraphQL endpoint
export const graphqlClient = new GraphQLClient("/api/graphql");

export const STATS_QUERY = `
  query myQuery {
    PoolManager {
      id
      chainId
      poolCount
      txCount
      numberOfSwaps
      hookedPools
      hookedSwaps
      totalValueLockedUSD
      totalVolumeUSD
      totalFeesUSD
    }
    HookStats {
      id
      chainId
      numberOfPools
      numberOfSwaps
      firstPoolCreatedAt
      totalValueLockedUSD
      totalVolumeUSD
      totalFeesUSD
    }
    chain_metadata {
      chain_id
      latest_processed_block
    }
  }
`;

export const POOLS_QUERY = `
  query myQuery {
    Pool(order_by: {totalValueLockedUSD: desc}, limit: 100) {
      chainId
      hooks
      id
      name
      txCount
      token0
      token1
      volumeUSD
      untrackedVolumeUSD
      feesUSD
      feesUSDUntracked
      totalValueLockedUSD
    }
  }
`;

export const POOLS_BY_HOOK_QUERY = `
  query poolsByHook($hookAddress: String!, $chainId: numeric!) {
    Pool(where: {hooks: {_eq: $hookAddress}, chainId: {_eq: $chainId}}, order_by: {totalValueLockedUSD: desc}) {
      chainId
      hooks
      id
      name
      txCount
      token0
      token1
      volumeUSD
      untrackedVolumeUSD
      feesUSD
      feesUSDUntracked
      totalValueLockedUSD
      createdAtTimestamp
    }
  }
`;

export const RECENT_SWAPS_BY_POOL_QUERY = `
  query recentSwapsByPool($poolId: String!, $limit: Int!) {
    Swap(
      where: {pool: {_eq: $poolId}}, 
      order_by: {timestamp: desc}, 
      limit: $limit
    ) {
      id
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
      sqrtPriceX96
      tick
      chainId
    }
  }
`;

export const RECENT_MODIFY_LIQUIDITY_QUERY = `
  query recentModifyLiquidity($limit: Int!) {
    ModifyLiquidity(
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

export const LARGEST_MODIFY_LIQUIDITY_QUERY = `
  query largestModifyLiquidity($limit: Int!) {
    ModifyLiquidity(
      order_by: {amountUSD: desc}, 
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
