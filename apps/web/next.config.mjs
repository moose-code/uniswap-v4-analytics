/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
  env: {
    AIRTABLE_API_KEY: process.env.AIRTABLE_API_KEY,
    ENVIO_GRAPHQL_ENDPOINT: process.env.ENVIO_GRAPHQL_ENDPOINT,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "d30nibem0g3f7u.cloudfront.net",
      },
    ],
  },
};

export default nextConfig;
