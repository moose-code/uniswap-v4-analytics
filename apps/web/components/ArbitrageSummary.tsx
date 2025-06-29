import { motion, animate, useMotionValue, useTransform } from "framer-motion";
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
import { useState, useEffect, useRef } from "react";

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
  "10": "https://optimistic.etherscan.io",
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
  optimismData: ChartData[];
  width?: number;
  height?: number;
  isMobile?: boolean;
}

const PriceChart = ({
  ethData,
  unichainData,
  arbitrumData,
  baseData,
  optimismData,
  width = 800,
  height = 400,
  isMobile = false,
}: PriceChartProps) => {
  // Responsive padding based on mobile
  const horizontalPadding = isMobile ? 60 : 80; // More padding on mobile for Y-axis labels
  const topPadding = 20;
  const bottomPadding = isMobile ? 100 : 80; // More space for mobile legend
  const chartWidth = width - 2 * horizontalPadding;
  const chartHeight = height - topPadding - bottomPadding;

  // Combine all data to find min/max values
  const allData = [
    ...ethData,
    ...unichainData,
    ...arbitrumData,
    ...baseData,
    ...optimismData,
  ];
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
    horizontalPadding +
    ((timestamp - minTime) / (maxTime - minTime)) * chartWidth;

  const scaleY = (price: number) =>
    topPadding + ((maxPrice - price) / (maxPrice - minPrice)) * chartHeight;

  // Scale bubble size based on swap amount for smart visualization
  const scaleBubbleSize = (amountUSD: number): number => {
    // Get all amounts to determine range
    const allAmounts = [
      ...ethData.map((d) => d.amountUSD),
      ...unichainData.map((d) => d.amountUSD),
      ...arbitrumData.map((d) => d.amountUSD),
      ...baseData.map((d) => d.amountUSD),
      ...optimismData.map((d) => d.amountUSD),
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
  const optimismPath = createPath(optimismData);

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
          x={horizontalPadding}
          y={topPadding}
          fill="url(#grid)"
        />

        {/* Y-axis */}
        <line
          x1={horizontalPadding}
          y1={topPadding}
          x2={horizontalPadding}
          y2={height - bottomPadding}
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.3"
        />

        {/* X-axis */}
        <line
          x1={horizontalPadding}
          y1={height - bottomPadding}
          x2={width - horizontalPadding}
          y2={height - bottomPadding}
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.3"
        />

        {/* Y-axis labels */}
        {yTicks.map((price, index) => (
          <g key={index}>
            <line
              x1={horizontalPadding - 5}
              y1={scaleY(price)}
              x2={horizontalPadding}
              y2={scaleY(price)}
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.3"
            />
            <text
              x={horizontalPadding - 10}
              y={scaleY(price)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={isMobile ? "8" : "10"}
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
              y1={height - bottomPadding}
              x2={scaleX(timestamp)}
              y2={height - bottomPadding + 5}
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.3"
            />
            <text
              x={scaleX(timestamp)}
              y={height - bottomPadding + 15}
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

        {optimismPath && (
          <path
            d={optimismPath}
            fill="none"
            stroke="#dc2626"
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

        {optimismData.map((point, index) => (
          <circle
            key={`optimism-${index}`}
            cx={scaleX(point.timestamp)}
            cy={scaleY(point.price)}
            r={scaleBubbleSize(point.amountUSD)}
            fill="#dc2626"
            opacity="0.7"
            stroke="#dc2626"
            strokeWidth="1"
            strokeOpacity="0.9"
          >
            <title>{`Optimism: ${formatPrice(point.price)} | ${formatUSD(point.amountUSD)}`}</title>
          </circle>
        ))}

        {/* Legend - positioned at bottom to avoid covering data */}
        <g
          transform={`translate(${horizontalPadding + 10}, ${height - (isMobile ? 60 : 40)})`}
        >
          <rect
            width={isMobile ? Math.min(520, chartWidth - 20) : "620"}
            height={isMobile ? "40" : "25"}
            fill="rgba(0,0,0,0.1)"
            rx="4"
          />

          {/* Mobile: Stack legend items vertically, Desktop: Horizontal layout */}
          {isMobile ? (
            <>
              {/* First row */}
              <g transform="translate(0, 10)">
                {/* Ethereum */}
                <line
                  x1="10"
                  y1="8"
                  x2="20"
                  y2="8"
                  stroke="#6b7280"
                  strokeWidth="2"
                />
                <circle cx="15" cy="8" r="2" fill="#6b7280" />
                <text x="25" y="11" fontSize="9" fill="currentColor">
                  ETH
                </text>

                {/* Unichain */}
                <line
                  x1="60"
                  y1="8"
                  x2="70"
                  y2="8"
                  stroke="#ec4899"
                  strokeWidth="2"
                />
                <circle cx="65" cy="8" r="2" fill="#ec4899" />
                <text x="75" y="11" fontSize="9" fill="currentColor">
                  UNI
                </text>

                {/* Arbitrum */}
                <line
                  x1="110"
                  y1="8"
                  x2="120"
                  y2="8"
                  stroke="#f97316"
                  strokeWidth="2"
                />
                <circle cx="115" cy="8" r="2" fill="#f97316" />
                <text x="125" y="11" fontSize="9" fill="currentColor">
                  ARB
                </text>

                {/* Base */}
                <line
                  x1="160"
                  y1="8"
                  x2="170"
                  y2="8"
                  stroke="#3b82f6"
                  strokeWidth="2"
                />
                <circle cx="165" cy="8" r="2" fill="#3b82f6" />
                <text x="175" y="11" fontSize="9" fill="currentColor">
                  BASE
                </text>

                {/* Optimism */}
                <line
                  x1="220"
                  y1="8"
                  x2="230"
                  y2="8"
                  stroke="#dc2626"
                  strokeWidth="2"
                />
                <circle cx="225" cy="8" r="2" fill="#dc2626" />
                <text x="235" y="11" fontSize="9" fill="currentColor">
                  OP
                </text>
              </g>

              {/* Second row - Bubble explanation */}
              <g transform="translate(0, 25)">
                <text
                  x="10"
                  y="8"
                  fontSize="8"
                  fill="currentColor"
                  opacity="0.7"
                >
                  Bubble size = Volume
                </text>
                <circle
                  cx="90"
                  cy="5"
                  r="1"
                  fill="currentColor"
                  opacity="0.5"
                />
                <circle
                  cx="95"
                  cy="5"
                  r="2"
                  fill="currentColor"
                  opacity="0.5"
                />
                <circle
                  cx="102"
                  cy="5"
                  r="3"
                  fill="currentColor"
                  opacity="0.5"
                />
              </g>
            </>
          ) : (
            <>
              {/* Desktop layout - horizontal */}
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

              {/* Optimism */}
              <line
                x1="350"
                y1="15"
                x2="365"
                y2="15"
                stroke="#dc2626"
                strokeWidth="2"
              />
              <circle cx="357.5" cy="15" r="3" fill="#dc2626" />
              <text x="370" y="18" fontSize="11" fill="currentColor">
                Optimism
              </text>

              {/* Bubble size explanation */}
              <text
                x="450"
                y="12"
                fontSize="10"
                fill="currentColor"
                opacity="0.7"
              >
                Bubble size = Swap volume
              </text>
              <circle
                cx="460"
                cy="20"
                r="2"
                fill="currentColor"
                opacity="0.5"
              />
              <circle
                cx="470"
                cy="20"
                r="4"
                fill="currentColor"
                opacity="0.5"
              />
              <circle
                cx="485"
                cy="20"
                r="6"
                fill="currentColor"
                opacity="0.5"
              />
            </>
          )}
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
    optimismPool,
    ethChartData,
    unichainChartData,
    arbitrumChartData,
    baseChartData,
    optimismChartData,
  } = useArbitrage();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Motion values for smooth counting animations
  const ethPriceValue = useMotionValue(0);
  const unichainPriceValue = useMotionValue(0);
  const arbitrumPriceValue = useMotionValue(0);
  const basePriceValue = useMotionValue(0);
  const optimismPriceValue = useMotionValue(0);
  const ethToUnichainValue = useMotionValue(0);
  const ethToArbitrumValue = useMotionValue(0);
  const ethToBaseValue = useMotionValue(0);
  const ethToOptimismValue = useMotionValue(0);
  const maxDifferenceValue = useMotionValue(0);

  // Transform motion values to formatted strings
  const ethPriceDisplay = useTransform(ethPriceValue, (v) => formatPrice(v));
  const unichainPriceDisplay = useTransform(unichainPriceValue, (v) =>
    formatPrice(v)
  );
  const arbitrumPriceDisplay = useTransform(arbitrumPriceValue, (v) =>
    formatPrice(v)
  );
  const basePriceDisplay = useTransform(basePriceValue, (v) => formatPrice(v));
  const optimismPriceDisplay = useTransform(optimismPriceValue, (v) =>
    formatPrice(v)
  );
  const ethToUnichainDisplay = useTransform(
    ethToUnichainValue,
    (v) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`
  );
  const ethToArbitrumDisplay = useTransform(
    ethToArbitrumValue,
    (v) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`
  );
  const ethToBaseDisplay = useTransform(
    ethToBaseValue,
    (v) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`
  );
  const ethToOptimismDisplay = useTransform(
    ethToOptimismValue,
    (v) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`
  );
  const maxDifferenceDisplay = useTransform(
    maxDifferenceValue,
    (v) => `${v.toFixed(3)}%`
  );

  // Animate motion values when prices change
  useEffect(() => {
    if (!priceDifferences) return;

    // Animate all values with smooth transitions
    animate(ethPriceValue, priceDifferences.ethPrice, {
      duration: 0.8,
      ease: [0.32, 0.72, 0, 1],
    });
    animate(unichainPriceValue, priceDifferences.unichainPrice, {
      duration: 0.8,
      ease: [0.32, 0.72, 0, 1],
    });
    animate(arbitrumPriceValue, priceDifferences.arbitrumPrice, {
      duration: 0.8,
      ease: [0.32, 0.72, 0, 1],
    });
    animate(basePriceValue, priceDifferences.basePrice, {
      duration: 0.8,
      ease: [0.32, 0.72, 0, 1],
    });
    animate(optimismPriceValue, priceDifferences.optimismPrice, {
      duration: 0.8,
      ease: [0.32, 0.72, 0, 1],
    });
    animate(ethToUnichainValue, priceDifferences.ethToUnichain, {
      duration: 0.8,
      ease: [0.32, 0.72, 0, 1],
    });
    animate(ethToArbitrumValue, priceDifferences.ethToArbitrum, {
      duration: 0.8,
      ease: [0.32, 0.72, 0, 1],
    });
    animate(ethToBaseValue, priceDifferences.ethToBase, {
      duration: 0.8,
      ease: [0.32, 0.72, 0, 1],
    });
    animate(ethToOptimismValue, priceDifferences.ethToOptimism, {
      duration: 0.8,
      ease: [0.32, 0.72, 0, 1],
    });
    animate(maxDifferenceValue, priceDifferences.maxDifference, {
      duration: 0.8,
      ease: [0.32, 0.72, 0, 1],
    });
  }, [
    priceDifferences,
    ethPriceValue,
    unichainPriceValue,
    arbitrumPriceValue,
    basePriceValue,
    optimismPriceValue,
    ethToUnichainValue,
    ethToArbitrumValue,
    ethToBaseValue,
    ethToOptimismValue,
    maxDifferenceValue,
  ]);

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
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center space-y-1">
        <h2 className={`font-bold ${isMobile ? "text-xl" : "text-2xl"}`}>
          Multi-Chain ETH/USDC Price Arbitrage
        </h2>
        <p
          className={`text-muted-foreground ${isMobile ? "text-xs" : "text-sm"}`}
        >
          Real-time price comparison across Ethereum, Unichain, Arbitrum, Base,
          and Optimism networks for ETH/USDC pools
        </p>
      </div>

      {/* Price Chart */}
      {(ethChartData ||
        unichainChartData ||
        arbitrumChartData ||
        baseChartData ||
        optimismChartData) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-border/50 overflow-hidden relative"
        >
          <div
            className={`bg-secondary/30 border-b border-border/50 ${isMobile ? "px-3 py-3" : "px-6 py-4"}`}
          >
            <div
              className={`${isMobile ? "space-y-2" : "flex items-center justify-between"}`}
            >
              <h3 className={`font-semibold ${isMobile ? "text-sm" : ""}`}>
                Real-Time Price Comparison
              </h3>
              <div
                className={`flex items-center gap-2 text-sm ${isMobile ? "flex-wrap gap-1 justify-center" : "gap-4 flex-wrap"}`}
              >
                {ethChartData && ethChartData.length > 0 && (
                  <div className="flex items-center gap-1">
                    <div
                      className={`rounded-full bg-gray-500 ${isMobile ? "w-2 h-2" : "w-3 h-3"}`}
                    ></div>
                    <span className={isMobile ? "text-xs" : ""}>ETH</span>
                  </div>
                )}
                {unichainChartData && unichainChartData.length > 0 && (
                  <div className="flex items-center gap-1">
                    <div
                      className={`rounded-full bg-pink-500 ${isMobile ? "w-2 h-2" : "w-3 h-3"}`}
                    ></div>
                    <span className={isMobile ? "text-xs" : ""}>UNI</span>
                  </div>
                )}
                {arbitrumChartData && arbitrumChartData.length > 0 && (
                  <div className="flex items-center gap-1">
                    <div
                      className={`rounded-full bg-orange-500 ${isMobile ? "w-2 h-2" : "w-3 h-3"}`}
                    ></div>
                    <span className={isMobile ? "text-xs" : ""}>ARB</span>
                  </div>
                )}
                {baseChartData && baseChartData.length > 0 && (
                  <div className="flex items-center gap-1">
                    <div
                      className={`rounded-full bg-blue-500 ${isMobile ? "w-2 h-2" : "w-3 h-3"}`}
                    ></div>
                    <span className={isMobile ? "text-xs" : ""}>BASE</span>
                  </div>
                )}
                {optimismChartData && optimismChartData.length > 0 && (
                  <div className="flex items-center gap-1">
                    <div
                      className={`rounded-full bg-red-600 ${isMobile ? "w-2 h-2" : "w-3 h-3"}`}
                    ></div>
                    <span className={isMobile ? "text-xs" : ""}>OP</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className={`relative ${isMobile ? "p-2" : "p-4"}`}>
            <PriceChart
              ethData={ethChartData || []}
              unichainData={unichainChartData || []}
              arbitrumData={arbitrumChartData || []}
              baseData={baseChartData || []}
              optimismData={optimismChartData || []}
              width={isMobile ? 350 : 700}
              height={isMobile ? 300 : 500}
              isMobile={isMobile}
            />
            {/* Fullscreen button */}
            {!isMobile && (
              <button
                onClick={() => setIsFullscreen(true)}
                className="absolute bottom-4 right-4 p-2 bg-background/80 hover:bg-background border border-border rounded-lg shadow-sm transition-colors group"
                title="Expand chart to fullscreen"
              >
                <Maximize2 className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Current Price Comparison */}
      {priceDifferences && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-lg border border-border/50 bg-gradient-to-r from-background to-secondary/10 ${isMobile ? "p-3" : "p-4"}`}
        >
          <div
            className={`${isMobile ? "space-y-4" : "flex items-start justify-between gap-8"}`}
          >
            {/* Sorted Price List */}
            <div className={`flex-1 ${isMobile ? "" : "max-w-[70%]"}`}>
              <motion.div className="space-y-2" layout>
                {(() => {
                  // Helper function to get motion value for each chain
                  const getMotionValue = (chainName: string) => {
                    switch (chainName) {
                      case "Ethereum":
                        return {
                          priceDisplay: ethPriceDisplay,
                          percentageDisplay: null,
                        };
                      case "Unichain":
                        return {
                          priceDisplay: unichainPriceDisplay,
                          percentageDisplay: ethToUnichainDisplay,
                        };
                      case "Arbitrum":
                        return {
                          priceDisplay: arbitrumPriceDisplay,
                          percentageDisplay: ethToArbitrumDisplay,
                        };
                      case "Base":
                        return {
                          priceDisplay: basePriceDisplay,
                          percentageDisplay: ethToBaseDisplay,
                        };
                      case "Optimism":
                        return {
                          priceDisplay: optimismPriceDisplay,
                          percentageDisplay: ethToOptimismDisplay,
                        };
                      default:
                        return { priceDisplay: null, percentageDisplay: null };
                    }
                  };

                  // Create array of chains with their data for sorting
                  const chains = [
                    {
                      name: "Ethereum",
                      price: priceDifferences.ethPrice,
                      color: "text-gray-500",
                      pool: ethPool,
                    },
                    {
                      name: "Unichain",
                      price: priceDifferences.unichainPrice,
                      color: "text-pink-500",
                      pool: unichainPool,
                    },
                    {
                      name: "Arbitrum",
                      price: priceDifferences.arbitrumPrice,
                      color: "text-orange-500",
                      pool: arbitrumPool,
                    },
                    {
                      name: "Base",
                      price: priceDifferences.basePrice,
                      color: "text-blue-500",
                      pool: basePool,
                    },
                    {
                      name: "Optimism",
                      price: priceDifferences.optimismPrice,
                      color: "text-red-600",
                      pool: optimismPool,
                    },
                  ];

                  // Sort by price (highest first)
                  const sortedChains = chains.sort((a, b) => b.price - a.price);

                  return sortedChains.map((chain, index) => {
                    // Calculate the actual percentage difference from Ethereum
                    const ethPrice = priceDifferences.ethPrice;
                    const priceDiff =
                      ((chain.price - ethPrice) / ethPrice) * 100;
                    const isAboveEth = chain.price > ethPrice;
                    const isEthereum = chain.name === "Ethereum";

                    return (
                      <motion.div
                        key={chain.name}
                        layoutId={`chain-${chain.name}`}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          layout: { duration: 0.5, ease: "easeInOut" },
                          opacity: { duration: 0.3 },
                          scale: { duration: 0.3 },
                        }}
                        className={`flex items-center justify-between bg-secondary/20 hover:bg-secondary/30 transition-colors rounded-md ${isMobile ? "py-2 px-2" : "py-2 px-3"}`}
                      >
                        <div
                          className={`flex items-center ${isMobile ? "gap-2" : "gap-3"}`}
                        >
                          <div
                            className={`font-medium ${isMobile ? "text-xs min-w-[50px]" : "text-sm min-w-[70px]"}`}
                          >
                            {isMobile
                              ? chain.name.slice(0, 3).toUpperCase()
                              : chain.name}
                          </div>
                          <motion.div
                            layoutId={`price-${chain.name}`}
                            className={`font-mono ${chain.color} tabular-nums ${isMobile ? "text-sm" : "text-lg"}`}
                          >
                            {getMotionValue(chain.name).priceDisplay}
                          </motion.div>
                        </div>
                        <div
                          className={`flex items-center ${isMobile ? "gap-1" : "gap-2"}`}
                        >
                          <div
                            className={`text-muted-foreground ${isMobile ? "text-xs" : "text-xs"}`}
                          >
                            TVL:{" "}
                            {chain.pool
                              ? formatUSD(chain.pool.totalValueLockedUSD)
                              : "N/A"}
                          </div>
                          <div
                            className={`text-right ${isMobile ? "min-w-[40px]" : "min-w-[50px]"}`}
                          >
                            {isEthereum ? (
                              <span
                                className={`font-semibold text-gray-500 ${isMobile ? "text-xs" : "text-sm"}`}
                              >
                                0.00%
                              </span>
                            ) : (
                              <motion.span
                                layoutId={`percentage-${chain.name}`}
                                className={`font-semibold tabular-nums ${
                                  isAboveEth ? "text-green-500" : "text-red-500"
                                } ${isMobile ? "text-xs" : "text-sm"}`}
                              >
                                {getMotionValue(chain.name).percentageDisplay}
                              </motion.span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  });
                })()}
              </motion.div>
            </div>

            {/* Max Price Difference */}
            <div
              className={`text-center ${isMobile ? "w-full" : "min-w-[30%]"} flex flex-col justify-center`}
            >
              <div
                className={`flex items-center justify-center gap-2 ${isMobile ? "mb-2" : "mb-3"}`}
              >
                {priceDifferences.maxDifference > 1 ? (
                  <TrendingUp
                    className={`text-orange-500 ${isMobile ? "w-4 h-4" : "w-5 h-5"}`}
                  />
                ) : (
                  <TrendingDown
                    className={`text-green-500 ${isMobile ? "w-4 h-4" : "w-5 h-5"}`}
                  />
                )}
                <span
                  className={`font-semibold ${isMobile ? "text-sm" : "text-base"}`}
                >
                  Max Spread
                </span>
              </div>
              <motion.div
                className={`font-bold tabular-nums ${
                  priceDifferences.maxDifference > 2
                    ? "text-red-500"
                    : priceDifferences.maxDifference > 1
                      ? "text-orange-500"
                      : "text-green-500"
                } ${isMobile ? "text-2xl" : "text-3xl"}`}
              >
                {maxDifferenceDisplay}
              </motion.div>
              <div
                className={`text-muted-foreground ${isMobile ? "text-xs mt-1" : "text-xs mt-2"}`}
              >
                {priceDifferences.maxDifference > 0.1
                  ? "Arbitrage Opportunity"
                  : "Below Fee Threshold (0.1%)"}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Fullscreen Modal - Only shown on desktop */}
      {isFullscreen && !isMobile && (
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
                  {optimismChartData && optimismChartData.length > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-600"></div>
                      <span>Optimism</span>
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
                optimismData={optimismChartData || []}
                width={1200}
                height={900}
                isMobile={false}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
