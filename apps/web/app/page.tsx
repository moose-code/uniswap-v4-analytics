"use client";

import { useState } from "react";
import { useStats } from "@/hooks/useStats";
import { AnimatedBar } from "@/components/AnimatedBar";
import { StatsSummary } from "@/components/StatsSummary";
import { HookStatsSummary } from "@/components/HookStatsSummary";
import { TabsContainer } from "@/components/TabsContainer";
import { ChevronDown, ChevronUp, AlertCircle, Github } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PoolsSummary } from "../components/PoolsSummary";
import { HooksSummary } from "@/components/HooksSummary";
import { HookInformation } from "@/components/HookInformation";
import { LogoHeader } from "@/components/LogoHeader";
import { ApisContent } from "@/components/ApisContent";
import { TvlSummary } from "@/components/TvlSummary";
import { TvlAnimatedBar } from "@/components/TvlAnimatedBar";
import { PulseSwapsColumn } from "@/components/PulseSwapsColumn";
import { PulsePoolsColumn } from "@/components/PulsePoolsColumn";
import { LiquidityEventsColumn } from "@/components/LiquidityEventsColumn";
import { LargestLiquidityEventsColumn } from "@/components/LargestLiquidityEventsColumn";
import { ArbitrageSummary } from "@/components/ArbitrageSummary";

const NETWORK_NAMES: Record<string, string> = {
  "1": "Ethereum",
  "10": "Optimism",
  "137": "Polygon",
  "42161": "Arbitrum",
  "8453": "Base",
  "81457": "Blast",
  "7777777": "Zora",
  "56": "BSC",
  "43114": "Avalanche",
  "57073": "Ink",
  "1868": "Soneium",
  "130": "Unichain",
  "480": "Worldchain",
};

// Helper function to extract chain ID from the new format
const extractChainId = (id: string): string => {
  // If the ID contains an underscore, extract the part before it
  if (id.includes("_")) {
    const chainId = id.split("_")[0];
    return chainId || id; // Fallback to original id if split fails
  }
  return id;
};

const TABS = [
  { id: "overview", label: "Swaps" },
  { id: "pulse", label: "Pulse" },
  { id: "liquidity", label: "Liquidity" },
  { id: "tvl", label: "TVL" },
  { id: "pools", label: "Pools" },
  { id: "hooks", label: "Hooks" },
  { id: "hook-info", label: "Hook Information" },
  { id: "arbitrage", label: "Arbitrage" },
  { id: "apis", label: "APIs" },
];

type PoolManagerStat = {
  id: string;
  chainId: string;
  poolCount: string;
  txCount: string;
  numberOfSwaps: string;
  hookedPools: string;
  hookedSwaps: string;
  totalValueLockedUSD?: string;
  totalVolumeUSD?: string;
  totalFeesUSD?: string;
};

export default function Page() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showAllNetworks, setShowAllNetworks] = useState(false);
  const [showHooksMode, setShowHooksMode] = useState(false);
  const { stats, error } = useStats();
  const [selectedHookInfoAddress, setSelectedHookInfoAddress] = useState<
    string | null
  >(null);

  // Function to navigate to hook information tab and highlight a specific hook
  const navigateToHookInfo = (hookAddress: string, chainId: string) => {
    setActiveTab("hook-info");
    setSelectedHookInfoAddress(`${chainId}_${hookAddress}`);
  };

  // Handle tab changes, with special case for Pulse tab
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-svh">
        <div className="text-center space-y-4">
          <div className="text-red-500">{error}</div>
          {error.includes("Retrying") && (
            <div className="animate-pulse text-muted-foreground">
              Attempting to reconnect...
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-svh">
        Loading...
      </div>
    );
  }

  const sortedStats = [...stats.PoolManager].sort(
    (a, b) => parseInt(b.numberOfSwaps) - parseInt(a.numberOfSwaps)
  ) as PoolManagerStat[];

  const totalSwaps = sortedStats.reduce(
    (acc, stat) => acc + parseInt(stat.numberOfSwaps),
    0
  );
  const totalPools = sortedStats.reduce(
    (acc, stat) => acc + parseInt(stat.poolCount),
    0
  );

  const globalStats = {
    totalSwaps,
    totalPools,
    avgSwapsPerPool: totalPools > 0 ? totalSwaps / totalPools : 0,
  };

  const networkStats = sortedStats.map((stat) => {
    const chainId = extractChainId(stat.id);
    return {
      id: stat.id,
      name: NETWORK_NAMES[chainId] || `Chain ${stat.id}`,
      swaps: parseInt(stat.numberOfSwaps),
      pools: parseInt(stat.poolCount),
      avgSwapsPerPool:
        parseInt(stat.poolCount) > 0
          ? parseInt(stat.numberOfSwaps) / parseInt(stat.poolCount)
          : 0,
    };
  });

  // Calculate TVL-related stats
  const totalTVL = sortedStats.reduce(
    (acc, stat) => acc + parseFloat(stat.totalValueLockedUSD || "0"),
    0
  );

  const totalVolume = sortedStats.reduce(
    (acc, stat) => acc + parseFloat(stat.totalVolumeUSD || "0"),
    0
  );

  const totalFees = sortedStats.reduce(
    (acc, stat) => acc + parseFloat(stat.totalFeesUSD || "0"),
    0
  );

  const tvlNetworkStats = sortedStats.map((stat) => {
    const chainId = extractChainId(stat.id);
    return {
      id: stat.id,
      name: NETWORK_NAMES[chainId] || `Chain ${stat.id}`,
      tvl: parseFloat(stat.totalValueLockedUSD || "0"),
      volume: parseFloat(stat.totalVolumeUSD || "0"),
    };
  });

  return (
    <div className="flex flex-col min-h-svh">
      <div className="flex-1 px-2 sm:px-4 pt-8 sm:pt-12 pb-8">
        <div className="w-full max-w-full sm:max-w-3xl mx-auto">
          <LogoHeader />
          <TabsContainer
            tabs={TABS}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          >
            <AnimatePresence mode="wait">
              {activeTab === "overview" && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex justify-end mb-6">
                    <button
                      onClick={() => setShowHooksMode(!showHooksMode)}
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-secondary/30 hover:bg-secondary/50 transition-colors text-xs font-medium"
                    >
                      <span
                        className={
                          !showHooksMode
                            ? "text-primary"
                            : "text-muted-foreground"
                        }
                      >
                        Swaps
                      </span>
                      <div
                        className={`w-6 h-3 rounded-full transition-colors ${
                          showHooksMode ? "bg-primary" : "bg-secondary"
                        } relative`}
                      >
                        <motion.div
                          className="absolute top-0.5 left-0.5 w-2 h-2 bg-background rounded-full"
                          animate={{ x: showHooksMode ? 12 : 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 30,
                          }}
                        />
                      </div>
                      <span
                        className={
                          showHooksMode
                            ? "text-primary"
                            : "text-muted-foreground"
                        }
                      >
                        + Hooks
                      </span>
                    </button>
                  </div>

                  {showHooksMode ? (
                    <>
                      <HookStatsSummary
                        globalStats={{
                          totalSwaps,
                          hookedSwaps: sortedStats.reduce(
                            (acc, stat) => acc + parseInt(stat.hookedSwaps),
                            0
                          ),
                          totalPools,
                          hookedPools: sortedStats.reduce(
                            (acc, stat) => acc + parseInt(stat.hookedPools),
                            0
                          ),
                        }}
                      />
                      <div className="space-y-3">
                        {sortedStats
                          .sort(
                            (a, b) =>
                              parseInt(b.hookedSwaps) - parseInt(a.hookedSwaps)
                          )
                          .slice(0, showAllNetworks ? undefined : 3)
                          .map((stat) => {
                            const chainId = extractChainId(stat.id);
                            return (
                              <AnimatedBar
                                key={stat.id}
                                label={
                                  NETWORK_NAMES[chainId] || `Chain ${stat.id}`
                                }
                                value={parseInt(stat.numberOfSwaps)}
                                maxValue={totalSwaps}
                                pools={parseInt(stat.poolCount)}
                                maxPools={totalPools}
                                mode="hooks"
                                hookedSwaps={parseInt(stat.hookedSwaps)}
                                hookedPools={parseInt(stat.hookedPools)}
                              />
                            );
                          })}
                      </div>
                    </>
                  ) : (
                    <>
                      <StatsSummary
                        globalStats={globalStats}
                        networkStats={networkStats}
                      />
                      <div className="space-y-3">
                        {sortedStats.map((stat) => {
                          const chainId = extractChainId(stat.id);
                          return (
                            <AnimatedBar
                              key={stat.id}
                              label={
                                NETWORK_NAMES[chainId] || `Chain ${stat.id}`
                              }
                              value={parseInt(stat.numberOfSwaps)}
                              maxValue={totalSwaps}
                              pools={parseInt(stat.poolCount)}
                              maxPools={totalPools}
                              mode="overview"
                            />
                          );
                        })}
                      </div>
                    </>
                  )}

                  {showHooksMode && sortedStats.length > 3 && (
                    <button
                      onClick={() => setShowAllNetworks(!showAllNetworks)}
                      className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-all duration-200 group"
                    >
                      <span className="text-sm font-medium">
                        {showAllNetworks
                          ? `Show Top 3 Networks`
                          : `Show All Networks (${sortedStats.length})`}
                      </span>
                      <motion.div
                        animate={{ rotate: showAllNetworks ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                      </motion.div>
                    </button>
                  )}
                </motion.div>
              )}
              {activeTab === "tvl" && (
                <motion.div
                  key="tvl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="space-y-6">
                    <TvlSummary
                      globalStats={{
                        totalTVL,
                        totalVolume,
                        totalFees,
                      }}
                      networkStats={tvlNetworkStats}
                    />
                    <div className="space-y-3">
                      {tvlNetworkStats
                        .sort((a, b) => b.tvl - a.tvl)
                        .map((stat) => (
                          <TvlAnimatedBar
                            key={stat.id}
                            label={stat.name}
                            tvl={stat.tvl}
                            maxTvl={totalTVL}
                            volume={stat.volume}
                            maxVolume={totalVolume}
                          />
                        ))}
                    </div>
                  </div>
                </motion.div>
              )}
              {activeTab === "pools" && (
                <motion.div
                  key="pools"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold">Pools</h2>
                    <PoolsSummary onNavigateToHookInfo={navigateToHookInfo} />
                  </div>
                </motion.div>
              )}
              {activeTab === "hooks" && (
                <motion.div
                  key="hooks"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <HooksSummary onNavigateToHookInfo={navigateToHookInfo} />
                </motion.div>
              )}
              {activeTab === "hook-info" && (
                <motion.div
                  key="hook-info"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <HookInformation
                    highlightedHookAddress={selectedHookInfoAddress}
                  />
                </motion.div>
              )}
              {activeTab === "arbitrage" && (
                <motion.div
                  key="arbitrage"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <ArbitrageSummary />
                </motion.div>
              )}
              {activeTab === "apis" && (
                <motion.div
                  key="apis"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="mb-6 flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground bg-secondary/30 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    <span>
                      This page is under active development and will be improved
                      shortly
                    </span>
                  </div>
                  <ApisContent />
                </motion.div>
              )}
              {activeTab === "pulse" && (
                <motion.div
                  key="pulse"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left column: Recent Swaps */}
                      <div className="rounded-lg border border-border/50 overflow-hidden">
                        <PulseSwapsColumn />
                      </div>

                      {/* Right column: Recent Pools */}
                      <div className="rounded-lg border border-border/50 overflow-hidden">
                        <PulsePoolsColumn />
                      </div>
                    </div>

                    <div className="text-center text-xs text-muted-foreground mt-2">
                      <p>
                        Recent data from Uniswap V4 pools across all supported
                        networks
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
              {activeTab === "liquidity" && (
                <motion.div
                  key="liquidity"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left column: Largest Liquidity Events */}
                      <div className="rounded-lg border border-border/50 overflow-hidden">
                        <LargestLiquidityEventsColumn />
                      </div>

                      {/* Right column: Recent Liquidity Events */}
                      <div className="rounded-lg border border-border/50 overflow-hidden">
                        <LiquidityEventsColumn />
                      </div>
                    </div>

                    <div className="text-center text-xs text-muted-foreground mt-2">
                      <p>
                        Liquidity events from Uniswap V4 pools across all
                        supported networks
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContainer>
        </div>
      </div>
      {/* <footer className="mt-8 text-center text-sm text-muted-foreground pb-4">
        <p>
          Data indexed by{" "}
          <a
            href="https://docs.envio.dev/docs/HyperIndex/overview"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary/70 hover:text-primary transition-colors"
          >
            HyperIndex
          </a>{" "}
          on{" "}
          <a
            href="https://envio.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary/70 hover:text-primary transition-colors"
          >
            envio.dev
          </a>
        </p>
      </footer> */}
    </div>
  );
}
