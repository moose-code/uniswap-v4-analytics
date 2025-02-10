import { usePools } from "../hooks/usePools";

export function PoolsSummary() {
  const pools = usePools();

  if (!pools) return <div>Loading...</div>;

  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-full table-auto">
        <thead>
          <tr className="border-b border-gray-200 text-left">
            <th className="px-4 py-2">Chain ID</th>
            <th className="px-4 py-2">Fee</th>
            <th className="px-4 py-2">Number of Swaps</th>
            <th className="px-4 py-2">Tick Spacing</th>
            <th className="px-4 py-2">Hooks</th>
          </tr>
        </thead>
        <tbody>
          {pools.Pool.map((pool) => (
            <tr
              key={pool.id}
              className="border-b border-gray-200 hover:bg-gray-50"
            >
              <td className="px-4 py-2">{pool.chainId}</td>
              <td className="px-4 py-2">{pool.fee}</td>
              <td className="px-4 py-2">{pool.numberOfSwaps}</td>
              <td className="px-4 py-2">{pool.tickSpacing}</td>
              <td className="px-4 py-2">
                <span className="font-mono text-sm">
                  {pool.hooks === "0x0000000000000000000000000000000000000000"
                    ? "No Hooks"
                    : `${pool.hooks.slice(0, 6)}...${pool.hooks.slice(-4)}`}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
