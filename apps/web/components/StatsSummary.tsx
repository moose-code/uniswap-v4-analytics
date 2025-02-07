import { motion, animate } from "framer-motion";
import { useEffect, useRef } from "react";

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
      <div className="p-4 rounded-lg bg-secondary/50 space-y-1">
        <div className="text-sm text-muted-foreground">Total Swaps</div>
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
      </div>
      <div className="p-4 rounded-lg bg-secondary/50 space-y-1">
        <div className="text-sm text-muted-foreground">Total Pools</div>
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
