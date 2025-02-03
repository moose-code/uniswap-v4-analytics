import { GraphQLClient } from "graphql-request";

export const graphqlClient = new GraphQLClient(
  "http://localhost:8080/v1/graphql"
);

export const STATS_QUERY = `
  query myQuery {
    GlobalStats {
      id
      numberOfSwaps
    }
    chain_metadata {
      chain_id
      latest_processed_block
    }
  }
`;
