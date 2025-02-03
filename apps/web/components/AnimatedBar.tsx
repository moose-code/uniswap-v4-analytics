"use client";

import { motion } from "framer-motion";

interface AnimatedBarProps {
  label: string;
  value: number;
  maxValue: number;
}

export function AnimatedBar({ label, value, maxValue }: AnimatedBarProps) {
  const width = (value / maxValue) * 100;

  return (
    <div className="flex items-center gap-4 w-full">
      <div className="w-24 text-sm font-mono">{label}</div>
      <div className="flex-1 bg-secondary h-8 rounded-md overflow-hidden">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${width}%` }}
          transition={{ type: "spring", damping: 15 }}
        />
      </div>
      <div className="w-32 text-right font-mono">{value.toLocaleString()}</div>
    </div>
  );
}
