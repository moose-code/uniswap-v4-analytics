import { motion } from "framer-motion";
import { useArbitrage } from "@/hooks/useArbitrage";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  ExternalLink,
  Clock,
  Maximize2,
  X,
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
  return `$${price.toLocaleString("en-US", { maximumFractionDigits: 4, minimumFractionDigits: 2 })}`;
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
  "42161": "https://arbiscan.io",
  "8453": "https://basescan.org",
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
  arbitrumData: ChartData[];
  baseData: ChartData[];
  width?: number;
  height?: number;
}

const PriceChart = ({
  ethData,
  unichainData,
  arbitrumData,
  baseData,
  width = 800,
  height = 400,
}: PriceChartProps) => {
  const padding = 80;
  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;

  // Combine all data to find min/max values
  const allData = [...ethData, ...unichainData, ...arbitrumData, ...baseData];
  if (allData.length === 0) return null;

  // Extreme y-axis zoom for maximum granularity to see tiny price differences
  const dataMinPrice = Math.min(...allData.map((d) => d.price));
  const dataMaxPrice = Math.max(...allData.map((d) => d.price));
  const priceRange = dataMaxPrice - dataMinPrice;

  // Use extremely small padding - zoom in as much as possible
  const padding_percentage = Math.max(
    0.0001, // Absolute minimum 0.01% padding
    (priceRange / dataMinPrice) * 0.01 // Or 1% of the relative range
  ); // Maximum zoom for tiny differences

  const minPrice = dataMinPrice * (1 - padding_percentage);
  const maxPrice = dataMaxPrice * (1 + padding_percentage);
  const minTime = Math.min(...allData.map((d) => d.timestamp));
  const maxTime = Math.max(...allData.map((d) => d.timestamp));

  // Scale functions
  const scaleX = (timestamp: number) =>
    padding + ((timestamp - minTime) / (maxTime - minTime)) * chartWidth;

  const scaleY = (price: number) =>
    padding + ((maxPrice - price) / (maxPrice - minPrice)) * chartHeight;

  // Scale bubble size based on swap amount for smart visualization
  const scaleBubbleSize = (amountUSD: number): number => {
    // Get all amounts to determine range
    const allAmounts = [
      ...ethData.map((d) => d.amountUSD),
      ...unichainData.map((d) => d.amountUSD),
      ...arbitrumData.map((d) => d.amountUSD),
      ...baseData.map((d) => d.amountUSD),
    ].filter((amount) => amount > 0);

    if (allAmounts.length === 0) return 3;

    const minAmount = Math.min(...allAmounts);
    const maxAmount = Math.max(...allAmounts);

    // Scale between 2 and 10 pixels radius for better visibility
    const minRadius = 2;
    const maxRadius = 10;

    if (maxAmount === minAmount) return (minRadius + maxRadius) / 2;

    const scale = (amountUSD - minAmount) / (maxAmount - minAmount);
    return minRadius + scale * (maxRadius - minRadius);
  };

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
  const arbitrumPath = createPath(arbitrumData);
  const basePath = createPath(baseData);

  // Y-axis ticks (maximum ticks for ultra-fine granularity)
  const yTicks = [];
  for (let i = 0; i <= 12; i++) {
    const price = minPrice + (maxPrice - minPrice) * (i / 12);
    yTicks.push(price);
  }

  // X-axis ticks (show 4 time points to reduce clutter)
  const xTicks = [];
  for (let i = 0; i <= 3; i++) {
    const timestamp = minTime + (maxTime - minTime) * (i / 3);
    xTicks.push(timestamp);
  }

  return (
    <div className="w-full">
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="border border-border/20 rounded-lg bg-background max-w-full"
        preserveAspectRatio="xMidYMid meet"
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
            stroke="#6b7280"
            strokeWidth="2"
            opacity="0.8"
          />
        )}

        {unichainPath && (
          <path
            d={unichainPath}
            fill="none"
            stroke="#ec4899"
            strokeWidth="2"
            opacity="0.8"
          />
        )}

        {arbitrumPath && (
          <path
            d={arbitrumPath}
            fill="none"
            stroke="#f97316"
            strokeWidth="2"
            opacity="0.8"
          />
        )}

        {basePath && (
          <path
            d={basePath}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            opacity="0.8"
          />
        )}

        {/* Data points - bubble size based on swap amount */}
        {ethData.map((point, index) => (
          <circle
            key={`eth-${index}`}
            cx={scaleX(point.timestamp)}
            cy={scaleY(point.price)}
            r={scaleBubbleSize(point.amountUSD)}
            fill="#6b7280"
            opacity="0.7"
            stroke="#6b7280"
            strokeWidth="1"
            strokeOpacity="0.9"
          >
            <title>{`Ethereum: ${formatPrice(point.price)} | ${formatUSD(point.amountUSD)}`}</title>
          </circle>
        ))}

        {unichainData.map((point, index) => (
          <circle
            key={`unichain-${index}`}
            cx={scaleX(point.timestamp)}
            cy={scaleY(point.price)}
            r={scaleBubbleSize(point.amountUSD)}
            fill="#ec4899"
            opacity="0.7"
            stroke="#ec4899"
            strokeWidth="1"
            strokeOpacity="0.9"
          >
            <title>{`Unichain: ${formatPrice(point.price)} | ${formatUSD(point.amountUSD)}`}</title>
          </circle>
        ))}

        {arbitrumData.map((point, index) => (
          <circle
            key={`arbitrum-${index}`}
            cx={scaleX(point.timestamp)}
            cy={scaleY(point.price)}
            r={scaleBubbleSize(point.amountUSD)}
            fill="#f97316"
            opacity="0.7"
            stroke="#f97316"
            strokeWidth="1"
            strokeOpacity="0.9"
          >
            <title>{`Arbitrum: ${formatPrice(point.price)} | ${formatUSD(point.amountUSD)}`}</title>
          </circle>
        ))}

        {baseData.map((point, index) => (
          <circle
            key={`base-${index}`}
            cx={scaleX(point.timestamp)}
            cy={scaleY(point.price)}
            r={scaleBubbleSize(point.amountUSD)}
            fill="#3b82f6"
            opacity="0.7"
            stroke="#3b82f6"
            strokeWidth="1"
            strokeOpacity="0.9"
          >
            <title>{`Base: ${formatPrice(point.price)} | ${formatUSD(point.amountUSD)}`}</title>
          </circle>
        ))}

        {/* Legend - positioned at bottom to avoid covering data */}
        <g transform={`translate(${padding + 20}, ${height - 40})`}>
          <rect width="520" height="25" fill="rgba(0,0,0,0.1)" rx="4" />

          {/* Ethereum */}
          <line
            x1="10"
            y1="15"
            x2="25"
            y2="15"
            stroke="#6b7280"
            strokeWidth="2"
          />
          <circle cx="17.5" cy="15" r="3" fill="#6b7280" />
          <text x="30" y="18" fontSize="11" fill="currentColor">
            Ethereum
          </text>

          {/* Unichain */}
          <line
            x1="100"
            y1="15"
            x2="115"
            y2="15"
            stroke="#ec4899"
            strokeWidth="2"
          />
          <circle cx="107.5" cy="15" r="3" fill="#ec4899" />
          <text x="120" y="18" fontSize="11" fill="currentColor">
            Unichain
          </text>

          {/* Arbitrum */}
          <line
            x1="190"
            y1="15"
            x2="205"
            y2="15"
            stroke="#f97316"
            strokeWidth="2"
          />
          <circle cx="197.5" cy="15" r="3" fill="#f97316" />
          <text x="210" y="18" fontSize="11" fill="currentColor">
            Arbitrum
          </text>

          {/* Base */}
          <line
            x1="280"
            y1="15"
            x2="295"
            y2="15"
            stroke="#3b82f6"
            strokeWidth="2"
          />
          <circle cx="287.5" cy="15" r="3" fill="#3b82f6" />
          <text x="300" y="18" fontSize="11" fill="currentColor">
            Base
          </text>

          {/* Bubble size explanation */}
          <text x="350" y="12" fontSize="10" fill="currentColor" opacity="0.7">
            Bubble size = Swap volume
          </text>
          <circle cx="360" cy="20" r="2" fill="currentColor" opacity="0.5" />
          <circle cx="370" cy="20" r="4" fill="currentColor" opacity="0.5" />
          <circle cx="385" cy="20" r="6" fill="currentColor" opacity="0.5" />
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
    priceDifferences,
    ethPool,
    unichainPool,
    arbitrumPool,
    basePool,
    ethChartData,
    unichainChartData,
    arbitrumChartData,
    baseChartData,
  } = useArbitrage();

  const [isFullscreen, setIsFullscreen] = useState(false);

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
        <h2 className="text-2xl font-bold">
          Multi-Chain ETH/USDC Price Arbitrage
        </h2>
        <p className="text-muted-foreground text-sm">
          Real-time price comparison across Ethereum, Unichain, Arbitrum, and
          Base networks
        </p>
      </div>

      {/* Price Chart */}
      {(ethChartData ||
        unichainChartData ||
        arbitrumChartData ||
        baseChartData) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-border/50 overflow-hidden relative"
        >
          <div className="bg-secondary/30 px-6 py-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Real-Time Price Comparison</h3>
              <div className="flex items-center gap-4 text-sm flex-wrap">
                {ethChartData && ethChartData.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                    <span>Ethereum</span>
                  </div>
                )}
                {unichainChartData && unichainChartData.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                    <span>Unichain</span>
                  </div>
                )}
                {arbitrumChartData && arbitrumChartData.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span>Arbitrum</span>
                  </div>
                )}
                {baseChartData && baseChartData.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span>Base</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="p-4 relative">
            <PriceChart
              ethData={ethChartData || []}
              unichainData={unichainChartData || []}
              arbitrumData={arbitrumChartData || []}
              baseData={baseChartData || []}
              width={700}
              height={500}
            />
            {/* Fullscreen button */}
            <button
              onClick={() => setIsFullscreen(true)}
              className="absolute bottom-4 right-4 p-2 bg-background/80 hover:bg-background border border-border rounded-lg shadow-sm transition-colors group"
              title="Expand chart to fullscreen"
            >
              <Maximize2 className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Current Price Comparison */}
      {priceDifferences && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-border/50 bg-gradient-to-r from-background to-secondary/10 p-6"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">Ethereum</div>
              <div className="text-xl font-mono text-gray-500">
                {formatPrice(priceDifferences.ethPrice)}
              </div>
              <div className="text-xs text-muted-foreground">
                TVL: {ethPool ? formatUSD(ethPool.totalValueLockedUSD) : "N/A"}
              </div>
              <div className="text-xs text-center mt-1">
                <span className="font-semibold text-gray-500">0.00%</span>
              </div>
            </div>

            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">Unichain</div>
              <div className="text-xl font-mono text-pink-500">
                {formatPrice(priceDifferences.unichainPrice)}
              </div>
              <div className="text-xs text-muted-foreground">
                TVL:{" "}
                {unichainPool
                  ? formatUSD(unichainPool.totalValueLockedUSD)
                  : "N/A"}
              </div>
              <div className="text-xs text-center mt-1">
                <span
                  className={`font-semibold ${Math.abs(priceDifferences.ethToUnichain) > 1 ? "text-orange-500" : "text-green-500"}`}
                >
                  {priceDifferences.ethToUnichain.toFixed(2)}%
                </span>
              </div>
            </div>

            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">Arbitrum</div>
              <div className="text-xl font-mono text-orange-500">
                {formatPrice(priceDifferences.arbitrumPrice)}
              </div>
              <div className="text-xs text-muted-foreground">
                TVL:{" "}
                {arbitrumPool
                  ? formatUSD(arbitrumPool.totalValueLockedUSD)
                  : "N/A"}
              </div>
              <div className="text-xs text-center mt-1">
                <span
                  className={`font-semibold ${Math.abs(priceDifferences.ethToArbitrum) > 1 ? "text-orange-500" : "text-green-500"}`}
                >
                  {priceDifferences.ethToArbitrum.toFixed(2)}%
                </span>
              </div>
            </div>

            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">Base</div>
              <div className="text-xl font-mono text-blue-500">
                {formatPrice(priceDifferences.basePrice)}
              </div>
              <div className="text-xs text-muted-foreground">
                TVL:{" "}
                {basePool ? formatUSD(basePool.totalValueLockedUSD) : "N/A"}
              </div>
              <div className="text-xs text-center mt-1">
                <span
                  className={`font-semibold ${Math.abs(priceDifferences.ethToBase) > 1 ? "text-orange-500" : "text-green-500"}`}
                >
                  {priceDifferences.ethToBase.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          <div className="text-center mt-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              {priceDifferences.maxDifference > 1 ? (
                <TrendingUp className="w-5 h-5 text-orange-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-green-500" />
              )}
              <span className="text-sm font-semibold">
                Max Price Difference
              </span>
            </div>
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 0.5 }}
              className={`text-2xl font-bold ${
                priceDifferences.maxDifference > 2
                  ? "text-red-500"
                  : priceDifferences.maxDifference > 1
                    ? "text-orange-500"
                    : "text-green-500"
              }`}
            >
              {priceDifferences.maxDifference.toFixed(3)}%
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground">
        <p>
          Chart shows prices calculated from sqrtPriceX96 values of the most
          recent swaps across all networks. Data updates every 2 seconds.
        </p>
        <p className="mt-1">
          Price differences are calculated relative to Ethereum mainnet prices.
        </p>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setIsFullscreen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-background rounded-lg shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fullscreen Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-xl font-semibold">
                  Multi-Chain ETH/USDC Price Arbitrage
                </h2>
                <p className="text-sm text-muted-foreground">
                  Expanded view - Bubble size indicates swap volume
                </p>
              </div>
              <div className="flex items-center gap-6">
                {/* Legend */}
                <div className="flex items-center gap-4 text-sm">
                  {ethChartData && ethChartData.length > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                      <span>Ethereum</span>
                    </div>
                  )}
                  {unichainChartData && unichainChartData.length > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                      <span>Unichain</span>
                    </div>
                  )}
                  {arbitrumChartData && arbitrumChartData.length > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      <span>Arbitrum</span>
                    </div>
                  )}
                  {baseChartData && baseChartData.length > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span>Base</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setIsFullscreen(false)}
                  className="p-2 hover:bg-secondary rounded-lg transition-colors"
                  title="Close fullscreen"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Fullscreen Chart */}
            <div className="flex-1 p-6">
              <PriceChart
                ethData={ethChartData || []}
                unichainData={unichainChartData || []}
                arbitrumData={arbitrumChartData || []}
                baseData={baseChartData || []}
                width={1200}
                height={900}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
