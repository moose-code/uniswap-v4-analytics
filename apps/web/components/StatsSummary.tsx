import { motion, animate, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { RecentSwapsPopup } from "./RecentSwapsPopup";
import { RecentPoolsPopup } from "./RecentPoolsPopup";

interface StatsSummaryProps {
  globalStats: {
    totalSwaps: number;
    totalPools: number;
    avgSwapsPerPool: number;
  };
  networkStats: {
    id: string;
    name: string;
    swaps: number;
    pools: number;
    avgSwapsPerPool: number;
  }[];
}

export function StatsSummary({ globalStats, networkStats }: StatsSummaryProps) {
  const swapsRef = useRef<HTMLDivElement>(null);
  const poolsRef = useRef<HTMLDivElement>(null);
  const avgRef = useRef<HTMLDivElement>(null);
  const [showSwapsPopup, setShowSwapsPopup] = useState(false);
  const [showPoolsPopup, setShowPoolsPopup] = useState(false);

  const previousValues = useRef({
    swaps: globalStats.totalSwaps,
    pools: globalStats.totalPools,
    avg: globalStats.avgSwapsPerPool,
  });

  useEffect(() => {
    const animateValue = (
      ref: React.RefObject<HTMLDivElement>,
      start: number,
      end: number,
      format: (value: number) => string
    ) => {
      if (!ref.current) return;

      const controls = animate(start, end, {
        duration: 1.2,
        ease: [0.32, 0.72, 0, 1],
        onUpdate(value) {
          if (ref.current) {
            ref.current.textContent = format(value);
          }
        },
      });

      return controls.stop;
    };

    const cleanups = [
      animateValue(
        swapsRef,
        previousValues.current.swaps,
        globalStats.totalSwaps,
        (v) => Math.round(v).toLocaleString()
      ),
      animateValue(
        poolsRef,
        previousValues.current.pools,
        globalStats.totalPools,
        (v) => Math.round(v).toLocaleString()
      ),
      animateValue(
        avgRef,
        previousValues.current.avg,
        globalStats.avgSwapsPerPool,
        (v) => v.toFixed(1)
      ),
    ];

    previousValues.current = {
      swaps: globalStats.totalSwaps,
      pools: globalStats.totalPools,
      avg: globalStats.avgSwapsPerPool,
    };

    return () => cleanups.forEach((cleanup) => cleanup?.());
  }, [globalStats]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div
        className={`p-4 rounded-lg ${showSwapsPopup ? "bg-secondary/80" : "bg-secondary/50"} space-y-1 relative cursor-pointer transition-all duration-200 hover:bg-secondary/80 hover:shadow-md hover:scale-[1.02] group z-20`}
        onMouseEnter={() => setShowSwapsPopup(true)}
        onMouseLeave={() => setShowSwapsPopup(false)}
      >
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          Total Swaps
          <span className="inline-block w-2 h-2 rounded-full bg-primary/70 animate-pulse group-hover:bg-primary"></span>
        </div>
        <motion.div
          ref={swapsRef}
          className="text-2xl font-mono tabular-nums"
          animate={{
            color:
              previousValues.current.swaps < globalStats.totalSwaps
                ? ["inherit", "hsl(142.1 76.2% 36.3%)", "inherit"]
                : "inherit",
          }}
          transition={{ duration: 0.3 }}
        >
          {globalStats.totalSwaps.toLocaleString()}
        </motion.div>

        <AnimatePresence>
          {showSwapsPopup && <RecentSwapsPopup isVisible={showSwapsPopup} />}
        </AnimatePresence>
      </div>

      <div
        className={`p-4 rounded-lg ${showPoolsPopup ? "bg-secondary/80" : "bg-secondary/50"} space-y-1 relative cursor-pointer transition-all duration-200 hover:bg-secondary/80 hover:shadow-md hover:scale-[1.02] group z-20`}
        onMouseEnter={() => setShowPoolsPopup(true)}
        onMouseLeave={() => setShowPoolsPopup(false)}
      >
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          Total Pools
          <span className="inline-block w-2 h-2 rounded-full bg-primary/70 animate-pulse group-hover:bg-primary"></span>
        </div>
        <motion.div
          ref={poolsRef}
          className="text-2xl font-mono tabular-nums"
          animate={{
            scale:
              previousValues.current.pools < globalStats.totalPools
                ? [1, 1.06, 1]
                : 1,
            color:
              previousValues.current.pools < globalStats.totalPools
                ? ["inherit", "hsl(142.1 76.2% 36.3%)", "inherit"]
                : "inherit",
          }}
          transition={{ duration: 0.3 }}
        >
          {globalStats.totalPools.toLocaleString()}
        </motion.div>

        <AnimatePresence>
          {showPoolsPopup && <RecentPoolsPopup isVisible={showPoolsPopup} />}
        </AnimatePresence>
      </div>

      <div className="p-4 rounded-lg bg-secondary/50 space-y-1">
        <div className="text-sm text-muted-foreground">Avg Swaps/Pool</div>
        <motion.div
          ref={avgRef}
          className="text-2xl font-mono tabular-nums"
          animate={{
            color:
              previousValues.current.avg < globalStats.avgSwapsPerPool
                ? ["inherit", "hsl(142.1 76.2% 36.3%)", "inherit"]
                : "inherit",
          }}
          transition={{ duration: 0.3 }}
        >
          {globalStats.avgSwapsPerPool.toFixed(1)}
        </motion.div>
      </div>
    </div>
  );
}
