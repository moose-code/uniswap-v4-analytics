import { useState, useEffect } from "react";
import { AlertCircle, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";

interface HookInfo {
  id: string;
  fields: Record<string, any>;
}

export function HookInformation() {
  const [hookInfo, setHookInfo] = useState<HookInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllEntries, setShowAllEntries] = useState(false);

  useEffect(() => {
    const fetchHookInfo = async () => {
      try {
        const response = await fetch("/api/hooks/info");
        if (!response.ok) throw new Error("Failed to fetch hook information");
        const data = await response.json();
        setHookInfo(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch hook information"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchHookInfo();
  }, []);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  const displayedEntries = showAllEntries ? hookInfo : hookInfo.slice(0, 10);

  return (
    <div className="w-full space-y-6">
      <div className="mb-6 flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground bg-secondary/30 rounded-lg">
        <AlertCircle className="w-4 h-4" />
        <span>Displaying hook information courtesy of @SilvioBusonero</span>
      </div>

      <div className="rounded-lg border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-secondary/30">
                {hookInfo[0] &&
                  Object.keys(hookInfo[0].fields).map((header) => (
                    <th
                      key={header}
                      className="px-6 py-3 text-left text-xs font-medium text-muted-foreground"
                    >
                      {header}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {displayedEntries.map((entry) => (
                <tr
                  key={entry.id}
                  className="hover:bg-secondary/30 transition-colors"
                >
                  {Object.values(entry.fields).map((value, index) => (
                    <td
                      key={index}
                      className="px-6 py-4 whitespace-nowrap text-sm"
                    >
                      {typeof value === "boolean"
                        ? value
                          ? "Yes"
                          : "No"
                        : String(value)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {hookInfo.length > 10 && (
        <button
          onClick={() => setShowAllEntries(!showAllEntries)}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-all duration-200 group"
        >
          <span className="text-sm font-medium">
            {showAllEntries
              ? `Show Top 10 Entries`
              : `Show All Entries (${hookInfo.length})`}
          </span>
          <motion.div
            animate={{ rotate: showAllEntries ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        </button>
      )}
    </div>
  );
}
