"use client";

import { useState } from "react";
import { useStats } from "@/hooks/useStats";
import { AnimatedBar } from "@/components/AnimatedBar";
import { StatsSummary } from "@/components/StatsSummary";
import { HookStatsSummary } from "@/components/HookStatsSummary";
import { TabsContainer } from "@/components/TabsContainer";
import { ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PoolsSummary } from "../components/PoolsSummary";
import { HooksSummary } from "@/components/HooksSummary";
import { HookInformation } from "@/components/HookInformation";
import { LogoHeader } from "@/components/LogoHeader";

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
};

const TABS = [
  { id: "overview", label: "Swaps" },
  { id: "pools", label: "Pools" },
  { id: "hooks", label: "Hooks" },
  { id: "hook-info", label: "Hook Information" },
];

type GlobalStat = {
  id: string;
  numberOfSwaps: string;
  numberOfPools: string;
  hookedSwaps?: string;
  hookedPools?: string;
};

export default function Page() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showAllNetworks, setShowAllNetworks] = useState(false);
  const [showHooksMode, setShowHooksMode] = useState(false);
  const { stats, error } = useStats();

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

  const sortedStats = [...stats.GlobalStats].sort(
    (a, b) => parseInt(b.numberOfSwaps) - parseInt(a.numberOfSwaps)
  ) as GlobalStat[];

  const totalSwaps = sortedStats.reduce(
    (acc, stat) => acc + parseInt(stat.numberOfSwaps),
    0
  );
  const totalPools = sortedStats.reduce(
    (acc, stat) => acc + parseInt(stat.numberOfPools),
    0
  );

  const globalStats = {
    totalSwaps,
    totalPools,
    avgSwapsPerPool: totalPools > 0 ? totalSwaps / totalPools : 0,
  };

  const networkStats = sortedStats.map((stat) => ({
    id: stat.id,
    name: NETWORK_NAMES[stat.id] || `Chain ${stat.id}`,
    swaps: parseInt(stat.numberOfSwaps),
    pools: parseInt(stat.numberOfPools),
    avgSwapsPerPool:
      parseInt(stat.numberOfPools) > 0
        ? parseInt(stat.numberOfSwaps) / parseInt(stat.numberOfPools)
        : 0,
  }));

  return (
    <div className="flex flex-col min-h-svh">
      <div className="flex items-center justify-center flex-1 p-4">
        <div className="w-full max-w-3xl">
          <LogoHeader />
          <TabsContainer
            tabs={TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
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
                            (acc, stat) =>
                              acc + parseInt(stat.hookedSwaps ?? "0"),
                            0
                          ),
                          totalPools,
                          hookedPools: sortedStats.reduce(
                            (acc, stat) =>
                              acc + parseInt(stat.hookedPools ?? "0"),
                            0
                          ),
                        }}
                      />
                      <div className="space-y-3">
                        {sortedStats
                          .sort(
                            (a, b) =>
                              parseInt(b.hookedSwaps ?? "0") -
                              parseInt(a.hookedSwaps ?? "0")
                          )
                          .slice(0, showAllNetworks ? undefined : 3)
                          .map((stat) => (
                            <AnimatedBar
                              key={stat.id}
                              label={
                                NETWORK_NAMES[stat.id] || `Chain ${stat.id}`
                              }
                              value={parseInt(stat.numberOfSwaps)}
                              maxValue={totalSwaps}
                              pools={parseInt(stat.numberOfPools)}
                              maxPools={totalPools}
                              mode="hooks"
                              hookedSwaps={parseInt(stat.hookedSwaps ?? "0")}
                              hookedPools={parseInt(stat.hookedPools ?? "0")}
                            />
                          ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <StatsSummary
                        globalStats={globalStats}
                        networkStats={networkStats}
                      />
                      <div className="space-y-3">
                        {sortedStats.map((stat) => (
                          <AnimatedBar
                            key={stat.id}
                            label={NETWORK_NAMES[stat.id] || `Chain ${stat.id}`}
                            value={parseInt(stat.numberOfSwaps)}
                            maxValue={totalSwaps}
                            pools={parseInt(stat.numberOfPools)}
                            maxPools={totalPools}
                            mode="overview"
                          />
                        ))}
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
              {activeTab === "pools" && (
                <motion.div
                  key="pools"
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
                  <PoolsSummary />
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
                  <HooksSummary />
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
                  <HookInformation />
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
