import { useState } from "react";
import { usePools } from "../hooks/usePools";
import { ChevronDown } from "lucide-react";
import { motion } from "framer-motion";

export function PoolsSummary() {
  const pools = usePools();
  const [showAllPools, setShowAllPools] = useState(false);

  if (!pools) return <div>Loading...</div>;

  const displayedPools = showAllPools ? pools.Pool : pools.Pool.slice(0, 10);

  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-full table-auto">
        <thead>
          <tr className="border-b border-gray-200 text-left">
            <th className="px-4 py-2">Pool ID</th>
            <th className="px-4 py-2">Chain ID</th>
            <th className="px-4 py-2">Fee</th>
            <th className="px-4 py-2">Number of Swaps</th>
            <th className="px-4 py-2">Tick Spacing</th>
            <th className="px-4 py-2">Hooks</th>
          </tr>
        </thead>
        <tbody>
          {displayedPools.map((pool) => (
            <tr
              key={pool.id}
              className="border-b border-gray-200 hover:bg-gray-50"
            >
              <td className="px-4 py-2">
                <span className="font-mono text-sm">
                  {`${pool.id.slice(0, 6)}...${pool.id.slice(-4)}`}
                </span>
              </td>
              <td className="px-4 py-2">{pool.chainId}</td>
              <td className="px-4 py-2">{pool.fee}</td>
              <td className="px-4 py-2">{pool.numberOfSwaps}</td>
              <td className="px-4 py-2">{pool.tickSpacing}</td>
              <td className="px-4 py-2">
                {pool.hooks === "0x0000000000000000000000000000000000000000" ? (
                  <span className="font-mono text-sm">No Hooks</span>
                ) : (
                  <a
                    href={`https://scope.sh/${pool.chainId}/address/${pool.hooks}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-500"
                  >
                    <span className="font-mono text-sm">
                      {`${pool.hooks.slice(0, 6)}...${pool.hooks.slice(-4)}`}
                    </span>
                  </a>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {pools.Pool.length > 10 && (
        <button
          onClick={() => setShowAllPools(!showAllPools)}
          className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-all duration-200 group"
        >
          <span className="text-sm font-medium">
            {showAllPools
              ? `Show Top 10 Pools`
              : `Show All Pools (${pools.Pool.length})`}
          </span>
          <motion.div
            animate={{ rotate: showAllPools ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        </button>
      )}
    </div>
  );
}
