import { useState, useRef, useEffect } from "react";
import { useHooks } from "../hooks/useHooks";
import { ChevronDown, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export function HooksSummary() {
  const hooks = useHooks();
  const [showAllHooks, setShowAllHooks] = useState(false);
  const previousSwapsRef = useRef<{ [key: string]: number }>({});

  // Track previous values for animation
  useEffect(() => {
    if (hooks) {
      previousSwapsRef.current = hooks.HookStats.reduce(
        (acc, hook) => ({
          ...acc,
          [hook.id]: parseInt(hook.numberOfSwaps),
        }),
        {}
      );
    }
  }, [hooks]);

  if (!hooks) return <div>Loading...</div>;

  const displayedHooks = showAllHooks
    ? hooks.HookStats.sort(
        (a, b) => parseInt(b.numberOfPools) - parseInt(a.numberOfPools)
      )
    : hooks.HookStats.sort(
        (a, b) => parseInt(b.numberOfPools) - parseInt(a.numberOfPools)
      ).slice(0, 10);

  return (
    <div className="w-full space-y-6">
      <div className="mb-6 flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground bg-secondary/30 rounded-lg">
        <AlertCircle className="w-4 h-4" />
        <span>
          This page is under active development and will be improved shortly.{" "}
          <a
            href="https://univ4projects.notion.site/15f5a32af0b580249d0ee2e3f16f302f?v=4cbe60597dcb4f4cb52a40847b18b5d7"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 transition-colors"
          >
            Visit this Notion page
          </a>{" "}
          for more information on hooks.
        </span>
      </div>
      <div className="rounded-lg border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-secondary/30">
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">
                  Hook Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">
                  Chain ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">
                  Pools Using Hook
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">
                  Number of Swaps
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">
                  First Pool Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {displayedHooks.map((hook) => {
                const currentSwaps = parseInt(hook.numberOfSwaps);
                const previousSwaps =
                  previousSwapsRef.current[hook.id] || currentSwaps;
                const hasIncreased = currentSwaps > previousSwaps;
                const createdDate = new Date(
                  parseInt(hook.firstPoolCreatedAt) * 1000
                );

                return (
                  <tr
                    key={hook.id}
                    className="hover:bg-secondary/30 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a
                        href={`https://scope.sh/${hook.chainId}/address/${hook.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center font-mono text-sm text-primary hover:text-primary/80 transition-colors"
                      >
                        {`${hook.id.slice(0, 6)}...${hook.id.slice(-4)}`}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary">
                        {hook.chainId}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                      {parseInt(hook.numberOfPools).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <motion.span
                        className="font-mono text-sm tabular-nums"
                        animate={{
                          color: hasIncreased
                            ? ["inherit", "hsl(142.1 76.2% 36.3%)", "inherit"]
                            : "inherit",
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        {currentSwaps.toLocaleString()}
                      </motion.span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {createdDate.toLocaleDateString()}{" "}
                      {createdDate.toLocaleTimeString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {hooks.HookStats.length > 10 && (
        <button
          onClick={() => setShowAllHooks(!showAllHooks)}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-all duration-200 group"
        >
          <span className="text-sm font-medium">
            {showAllHooks
              ? `Show Top 10 Hooks`
              : `Show All Hooks (${hooks.HookStats.length})`}
          </span>
          <motion.div
            animate={{ rotate: showAllHooks ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        </button>
      )}
    </div>
  );
}
