import { useState, useEffect } from "react";
import { AlertCircle, ChevronDown, ExternalLink, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [searchTerm, setSearchTerm] = useState("");

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

  const filteredHooks = hookInfo.filter((h) => {
    const matchesType =
      selectedType === "All" || h.fields.Type.includes(selectedType);
    const matchesSearch =
      searchTerm === "" ||
      h.fields.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.fields["Project Description"]
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const displayedEntries = showAllEntries
    ? filteredHooks
    : filteredHooks.slice(0, 9);

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground bg-secondary/30 rounded-lg">
        <AlertCircle className="w-4 h-4" />
        <span>
          Displaying hook information courtesy of{" "}
          <a
            href="https://twitter.com/SilvioBusonero"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary/70 hover:text-primary transition-colors"
          >
            @SilvioBusonero
          </a>
        </span>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 flex justify-center">
          <div className="flex flex-wrap justify-center gap-1.5">
            {types.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`
                  px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200
                  ${
                    selectedType === type
                      ? "bg-primary/10 text-primary border-primary/20"
                      : "bg-secondary/10 hover:bg-secondary/20 text-muted-foreground hover:text-foreground"
                  }
                  border border-border/50
                `}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
        <div className="relative w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
          <input
            type="text"
            placeholder="Search hooks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border/40 bg-background/30 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-h-[400px]">
        <AnimatePresence mode="popLayout">
          {displayedEntries.map((entry) => (
            <motion.div
              key={entry.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
              transition={{
                duration: 0.3,
                layout: { duration: 0.3 },
              }}
              className="group flex flex-col p-4 rounded-lg border border-border/50 bg-secondary/5 hover:bg-secondary/10 transition-all duration-200 h-full"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-medium group-hover:text-primary transition-colors">
                  {entry.fields.Name}
                </h3>
                <span
                  className={`
                    px-2 py-0.5 rounded-full text-xs font-medium
                    ${getStageStyles(entry.fields["Stage "])}
                  `}
                >
                  {entry.fields["Stage "]}
                </span>
              </div>

              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                {entry.fields["Project Description"]}
              </p>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {entry.fields.Type.split(", ").map((type: string) => (
                  <span
                    key={type}
                    className="px-2 py-0.5 bg-secondary/10 rounded-full text-xs font-medium border border-border/20"
                  >
                    {type}
                  </span>
                ))}
              </div>

              <div className="mt-auto pt-3 border-t border-border/30">
                <div className="flex gap-3">
                  {entry.fields.website && (
                    <a
                      href={entry.fields.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-primary/70 hover:text-primary transition-colors"
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
                      className="flex items-center gap-1 text-xs text-primary/70 hover:text-primary transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />X (Twitter)
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredHooks.length > 9 && (
        <motion.button
          onClick={() => setShowAllEntries(!showAllEntries)}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-secondary/10 hover:bg-secondary/20 transition-all duration-200 group border border-border/50"
          whileHover={{ scale: 1.005 }}
          whileTap={{ scale: 0.995 }}
        >
          <span className="text-sm font-medium">
            {showAllEntries
              ? "Show Less"
              : `Show All Projects (${filteredHooks.length})`}
          </span>
          <motion.div
            animate={{ rotate: showAllEntries ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        </motion.button>
      )}
    </div>
  );
}

function getStageStyles(stage: string): string {
  const baseStyles = "border transition-colors duration-200";
  if (stage.includes("Mainnet")) {
    return `${baseStyles} bg-green-500/10 text-green-500 border-green-500/20`;
  }
  if (stage.includes("Testnet")) {
    return `${baseStyles} bg-blue-500/10 text-blue-500 border-blue-500/20`;
  }
  if (stage.includes("R&D")) {
    return `${baseStyles} bg-yellow-500/10 text-yellow-500 border-yellow-500/20`;
  }
  return `${baseStyles} bg-secondary/20 text-muted-foreground border-border/50`;
}
