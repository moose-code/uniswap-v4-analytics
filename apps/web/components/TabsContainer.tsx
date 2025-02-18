import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface Tab {
  id: string;
  label: string;
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
      <div className="flex justify-center">
        <div className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`pb-2 text-sm font-medium relative ${
                activeTab === tab.id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
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
      <div className="relative rounded-xl border border-border/50 p-6 pb-12">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {children}
        </motion.div>
        <div className="absolute bottom-3 right-4 text-xs text-muted-foreground italic">
          Last refreshed: {lastRefreshed}
        </div>
      </div>
    </div>
  );
}
