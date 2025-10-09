import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface Tab {
  id: string;
  label: string;
  isNew?: boolean;
}

interface TabsContainerProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: React.ReactNode;
}

export function TabsContainer({
  tabs,
  activeTab,
  onTabChange,
  children,
}: TabsContainerProps) {
  const [lastRefreshed, setLastRefreshed] = useState("just now");

  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefreshed("1 second ago");
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-center pb-2 px-2 -mx-2">
        <div className="flex gap-3 md:gap-6 flex-wrap justify-center">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`pb-2 text-xs md:text-sm font-medium relative whitespace-nowrap ${
                activeTab === tab.id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="inline-flex items-baseline gap-0.5">
                {tab.label}
                {tab.isNew && (
                  <span className="px-0.5 py-[1px] text-[7px] leading-none font-bold uppercase tracking-tight bg-pink-500/20 text-pink-500 rounded border border-pink-500/30 -translate-y-2 inline-block">
                    New
                  </span>
                )}
              </span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                />
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="relative rounded-xl border border-border/50 p-4 md:p-6 pb-10">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="overflow-x-auto mb-4"
        >
          {children}
        </motion.div>
        <div className="absolute bottom-2 right-4 text-xs text-muted-foreground italic">
          Last refreshed: {lastRefreshed}
        </div>
      </div>
    </div>
  );
}
