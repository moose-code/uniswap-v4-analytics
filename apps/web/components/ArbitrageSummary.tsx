import { motion } from "framer-motion";
import { useArbitrage } from "@/hooks/useArbitrage";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  ExternalLink,
  Clock,
} from "lucide-react";
import { useState, useEffect } from "react";

// Helper function to format USD values
const formatUSD = (value: string | number): string => {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (num >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(2)}M`;
  } else if (num >= 1_000) {
    return `$${(num / 1_000).toFixed(2)}K`;
  } else {
    return `$${num.toFixed(2)}`;
  }
};

// Helper function to format price
const formatPrice = (price: number): string => {
  return `$${price.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
};

// Helper function to shorten address
const shortenAddress = (address: string): string => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Helper function to format timestamp
const formatTimeAgo = (timestamp: string): string => {
  const now = Date.now() / 1000;
  const diff = now - parseInt(timestamp);

  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

// Network explorer URLs
const NETWORK_EXPLORER_URLS: Record<string, string> = {
  "1": "https://etherscan.io",
  "130": "https://unichain.org", // Placeholder for Unichain explorer
};

// Helper function to format timestamp for chart
const formatChartTime = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Simple SVG Line Chart Component
interface ChartData {
  timestamp: number;
  price: number;
  amountUSD: number;
  id: string;
}

interface PriceChartProps {
  ethData: ChartData[];
  unichainData: ChartData[];
  width?: number;
  height?: number;
}

const PriceChart = ({
  ethData,
  unichainData,
  width = 800,
  height = 400,
}: PriceChartProps) => {
  const padding = 60;
  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;

  // Combine all data to find min/max values
  const allData = [...ethData, ...unichainData];
  if (allData.length === 0) return null;

  const minPrice = Math.min(...allData.map((d) => d.price)) * 0.999;
  const maxPrice = Math.max(...allData.map((d) => d.price)) * 1.001;
  const minTime = Math.min(...allData.map((d) => d.timestamp));
  const maxTime = Math.max(...allData.map((d) => d.timestamp));

  // Scale functions
  const scaleX = (timestamp: number) =>
    padding + ((timestamp - minTime) / (maxTime - minTime)) * chartWidth;

  const scaleY = (price: number) =>
    padding + ((maxPrice - price) / (maxPrice - minPrice)) * chartHeight;

  // Create path strings
  const createPath = (data: ChartData[]) => {
    if (data.length === 0) return "";
    const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);

    return sortedData.reduce((path, point, index) => {
      const x = scaleX(point.timestamp);
      const y = scaleY(point.price);
      return index === 0 ? `M ${x} ${y}` : `${path} L ${x} ${y}`;
    }, "");
  };

  const ethPath = createPath(ethData);
  const unichainPath = createPath(unichainData);

  // Y-axis ticks
  const yTicks = [];
  for (let i = 0; i <= 5; i++) {
    const price = minPrice + (maxPrice - minPrice) * (i / 5);
    yTicks.push(price);
  }

  // X-axis ticks (show 5 time points)
  const xTicks = [];
  for (let i = 0; i <= 4; i++) {
    const timestamp = minTime + (maxTime - minTime) * (i / 4);
    xTicks.push(timestamp);
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg
        width={width}
        height={height}
        className="border border-border/20 rounded-lg bg-background"
      >
        {/* Grid lines */}
        <defs>
          <pattern
            id="grid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              opacity="0.1"
            />
          </pattern>
        </defs>
        <rect
          width={chartWidth}
          height={chartHeight}
          x={padding}
          y={padding}
          fill="url(#grid)"
        />

        {/* Y-axis */}
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.3"
        />

        {/* X-axis */}
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.3"
        />

        {/* Y-axis labels */}
        {yTicks.map((price, index) => (
          <g key={index}>
            <line
              x1={padding - 5}
              y1={scaleY(price)}
              x2={padding}
              y2={scaleY(price)}
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.3"
            />
            <text
              x={padding - 10}
              y={scaleY(price)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize="10"
              fill="currentColor"
              opacity="0.7"
            >
              {formatPrice(price)}
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {xTicks.map((timestamp, index) => (
          <g key={index}>
            <line
              x1={scaleX(timestamp)}
              y1={height - padding}
              x2={scaleX(timestamp)}
              y2={height - padding + 5}
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.3"
            />
            <text
              x={scaleX(timestamp)}
              y={height - padding + 15}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="10"
              fill="currentColor"
              opacity="0.7"
            >
              {formatChartTime(timestamp)}
            </text>
          </g>
        ))}

        {/* Price lines */}
        {ethPath && (
          <path
            d={ethPath}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            opacity="0.8"
          />
        )}

        {unichainPath && (
          <path
            d={unichainPath}
            fill="none"
            stroke="#ef4444"
            strokeWidth="2"
            opacity="0.8"
          />
        )}

        {/* Data points */}
        {ethData.map((point, index) => (
          <circle
            key={`eth-${index}`}
            cx={scaleX(point.timestamp)}
            cy={scaleY(point.price)}
            r="3"
            fill="#3b82f6"
            opacity="0.7"
          />
        ))}

        {unichainData.map((point, index) => (
          <circle
            key={`unichain-${index}`}
            cx={scaleX(point.timestamp)}
            cy={scaleY(point.price)}
            r="3"
            fill="#ef4444"
            opacity="0.7"
          />
        ))}

        {/* Legend */}
        <g transform={`translate(${width - 150}, ${padding + 20})`}>
          <rect width="140" height="50" fill="rgba(0,0,0,0.1)" rx="4" />
          <line
            x1="10"
            y1="15"
            x2="30"
            y2="15"
            stroke="#3b82f6"
            strokeWidth="2"
          />
          <circle cx="20" cy="15" r="3" fill="#3b82f6" />
          <text x="35" y="18" fontSize="12" fill="currentColor">
            Ethereum
          </text>

          <line
            x1="10"
            y1="35"
            x2="30"
            y2="35"
            stroke="#ef4444"
            strokeWidth="2"
          />
          <circle cx="20" cy="35" r="3" fill="#ef4444" />
          <text x="35" y="38" fontSize="12" fill="currentColor">
            Unichain
          </text>
        </g>
      </svg>
    </div>
  );
};

export function ArbitrageSummary() {
  const {
    pools,
    swaps,
    loading,
    error,
    priceDifference,
    ethPool,
    unichainPool,
    ethChartData,
    unichainChartData,
  } = useArbitrage();

  if (loading && !pools.length) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Activity className="w-4 h-4 animate-pulse" />
          <span>Loading arbitrage data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-red-500 text-center">
          <p>{error}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Please try refreshing the page
          </p>
        </div>
      </div>
    );
  }

  const ethSwaps = swaps.filter((swap) => swap.chainId === "1");
  const unichainSwaps = swaps.filter((swap) => swap.chainId === "130");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">ETH/USDC Price Arbitrage</h2>
        <p className="text-muted-foreground text-sm">
          Real-time price comparison from the last 50 swaps on each network
        </p>
      </div>

      {/* Current Price Difference */}
      {priceDifference && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-border/50 bg-gradient-to-r from-background to-secondary/10 p-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">Ethereum</div>
              <div className="text-2xl font-mono text-blue-500">
                {formatPrice(priceDifference.ethPrice)}
              </div>
              <div className="text-xs text-muted-foreground">
                TVL: {ethPool ? formatUSD(ethPool.totalValueLockedUSD) : "N/A"}
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                {priceDifference.difference > 0 ? (
                  <TrendingUp className="w-5 h-5 text-green-500" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-500" />
                )}
                <span className="text-sm font-semibold">Difference</span>
              </div>
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 0.5 }}
                className={`text-3xl font-bold ${
                  priceDifference.absoluteDifference > 1
                    ? "text-orange-500"
                    : priceDifference.absoluteDifference > 0.5
                      ? "text-yellow-500"
                      : "text-green-500"
                }`}
              >
                {priceDifference.absoluteDifference.toFixed(3)}%
              </motion.div>
            </div>

            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">Unichain</div>
              <div className="text-2xl font-mono text-red-500">
                {formatPrice(priceDifference.unichainPrice)}
              </div>
              <div className="text-xs text-muted-foreground">
                TVL:{" "}
                {unichainPool
                  ? formatUSD(unichainPool.totalValueLockedUSD)
                  : "N/A"}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Price Chart */}
      {ethChartData && unichainChartData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-border/50 overflow-hidden"
        >
          <div className="bg-secondary/30 px-6 py-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Price History Comparison</h3>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span>Ethereum ({ethChartData.length} swaps)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>Unichain ({unichainChartData.length} swaps)</span>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6">
            <PriceChart
              ethData={ethChartData}
              unichainData={unichainChartData}
              width={800}
              height={400}
            />
          </div>
        </motion.div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-border/50 p-4">
          <h4 className="font-semibold mb-3 text-blue-500">Ethereum Pool</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Recent Swaps:</span>
              <span>{ethChartData?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg Price:</span>
              <span className="font-mono">
                {ethChartData?.length > 0
                  ? formatPrice(
                      ethChartData.reduce((sum, d) => sum + d.price, 0) /
                        ethChartData.length
                    )
                  : "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price Range:</span>
              <span className="font-mono text-xs">
                {ethChartData?.length > 0
                  ? `${formatPrice(Math.min(...ethChartData.map((d) => d.price)))} - ${formatPrice(Math.max(...ethChartData.map((d) => d.price)))}`
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border/50 p-4">
          <h4 className="font-semibold mb-3 text-red-500">Unichain Pool</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Recent Swaps:</span>
              <span>{unichainChartData?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg Price:</span>
              <span className="font-mono">
                {unichainChartData?.length > 0
                  ? formatPrice(
                      unichainChartData.reduce((sum, d) => sum + d.price, 0) /
                        unichainChartData.length
                    )
                  : "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price Range:</span>
              <span className="font-mono text-xs">
                {unichainChartData?.length > 0
                  ? `${formatPrice(Math.min(...unichainChartData.map((d) => d.price)))} - ${formatPrice(Math.max(...unichainChartData.map((d) => d.price)))}`
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground">
        <p>
          Chart shows prices calculated from sqrtPriceX96 values of the most
          recent swaps. Data updates every 2 seconds.
        </p>
      </div>
    </div>
  );
}
