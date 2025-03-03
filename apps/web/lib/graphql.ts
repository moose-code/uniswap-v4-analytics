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
    }
    HookStats {
      id
      chainId
      numberOfPools
      numberOfSwaps
      firstPoolCreatedAt
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
      feesUSD
      totalValueLockedUSD
    }
  }
`;
