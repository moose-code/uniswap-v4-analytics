"use client";

import { motion, useSpring, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";

interface AnimatedBarProps {
  label: string;
  value: number;
  maxValue: number;
}

export function AnimatedBar({ label, value, maxValue }: AnimatedBarProps) {
  const numberRef = useRef<HTMLDivElement>(null);
  const previousValueRef = useRef(value);
  const width = (value / maxValue) * 100;

  // Smooth spring animation for the bar
  const springValue = useSpring(0, {
    stiffness: 60,
    damping: 15,
    mass: 0.5,
  });
  const barWidth = useTransform(springValue, [0, 100], ["0%", "100%"]);

  useEffect(() => {
    springValue.set(width);
  }, [width, springValue]);

  // Smooth counter animation from previous value
  useEffect(() => {
    const node = numberRef.current;
    if (!node) return;

    const controls = animate(previousValueRef.current, value, {
      duration: 0.8,
      ease: "easeOut",
      onUpdate(value) {
        node.textContent = Math.round(value).toLocaleString();
      },
    });

    previousValueRef.current = value;
    return () => controls.stop();
  }, [value]);

  return (
    <div className="flex items-center gap-4 w-full">
      <div className="w-24 text-sm font-mono">{label}</div>
      <div className="flex-1 bg-secondary h-8 rounded-md overflow-hidden">
        <motion.div className="h-full bg-primary" style={{ width: barWidth }} />
      </div>
      <div ref={numberRef} className="w-32 text-right font-mono tabular-nums">
        {value.toLocaleString()}
      </div>
    </div>
  );
}
