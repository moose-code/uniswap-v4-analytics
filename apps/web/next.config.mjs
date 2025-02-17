/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
  env: {
    AIRTABLE_API_KEY: process.env.AIRTABLE_API_KEY,
  },
};

export default nextConfig;
