import { useState, useEffect } from "react";
import { AlertCircle, ChevronDown, ExternalLink } from "lucide-react";
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
  const [selectedType, setSelectedType] = useState<string>("All");

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

  const types = [
    "All",
    ...new Set(hookInfo.map((h) => h.fields.Type.split(", ")).flat()),
  ].sort();
  const filteredHooks = hookInfo.filter(
    (h) => selectedType === "All" || h.fields.Type.includes(selectedType)
  );
  const displayedEntries = showAllEntries
    ? filteredHooks
    : filteredHooks.slice(0, 12);

  return (
    <div className="w-full space-y-6">
      <div className="mb-6 flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground bg-secondary/30 rounded-lg">
        <AlertCircle className="w-4 h-4" />
        <span>Displaying hook information courtesy of @SilvioBusonero</span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 px-1">
        {types.map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
              selectedType === type
                ? "bg-primary text-primary-foreground"
                : "bg-secondary/50 hover:bg-secondary/80"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedEntries.map((entry) => (
          <motion.div
            key={entry.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 rounded-lg border border-border/50 bg-secondary/10 hover:bg-secondary/20 transition-colors"
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-medium">{entry.fields.Name}</h3>
              <span
                className={`px-2 py-0.5 rounded-full text-xs ${
                  entry.fields["Stage "].includes("Mainnet")
                    ? "bg-green-500/10 text-green-500"
                    : entry.fields["Stage "].includes("Testnet")
                      ? "bg-blue-500/10 text-blue-500"
                      : "bg-secondary text-muted-foreground"
                }`}
              >
                {entry.fields["Stage "]}
              </span>
            </div>

            <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
              {entry.fields["Project Description"]}
            </p>

            <div className="space-y-2">
              <div className="flex flex-wrap gap-1">
                {entry.fields.Type.split(", ").map((type: string) => (
                  <span
                    key={type}
                    className="px-2 py-0.5 bg-secondary/30 rounded-full text-xs"
                  >
                    {type}
                  </span>
                ))}
              </div>

              <div className="flex gap-2 mt-4">
                {entry.fields.website && (
                  <a
                    href={entry.fields.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Website
                  </a>
                )}
                {entry.fields.X && (
                  <a
                    href={entry.fields.X}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />X (Twitter)
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredHooks.length > 12 && (
        <button
          onClick={() => setShowAllEntries(!showAllEntries)}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-all duration-200 group"
        >
          <span className="text-sm font-medium">
            {showAllEntries
              ? `Show Less`
              : `Show All ${selectedType} Projects (${filteredHooks.length})`}
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
