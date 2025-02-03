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

  // More responsive spring animation for the bar
  const springValue = useSpring(0, {
    stiffness: 80, // Increased stiffness for more "snappy" movement
    damping: 12, // Reduced damping for more "bounce"
    mass: 0.3, // Reduced mass for quicker response
  });
  const barWidth = useTransform(springValue, [0, 100], ["0%", "100%"]);

  useEffect(() => {
    springValue.set(width);
  }, [width, springValue]);

  useEffect(() => {
    const node = numberRef.current;
    if (!node) return;

    const controls = animate(previousValueRef.current, value, {
      duration: 1.2, // Slightly longer duration
      ease: [0.32, 0.72, 0, 1], // Custom easing for more "punch"
      onUpdate(value) {
        node.textContent = Math.round(value).toLocaleString();
      },
    });

    previousValueRef.current = value;
    return () => controls.stop();
  }, [value]);

  return (
    <div className="flex items-center gap-4 w-full group">
      <div className="w-24 text-sm font-mono">{label}</div>
      <div className="flex-1 bg-secondary h-8 rounded-md overflow-hidden">
        <motion.div
          className="h-full bg-primary relative"
          style={{ width: barWidth }}
        >
          {/* Optional: Animated gradient overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            initial={{ x: "-100%" }}
            animate={{
              x: "100%",
              transition: {
                repeat: Infinity,
                duration: 2,
                ease: "linear",
              },
            }}
          />
        </motion.div>
      </div>
      <motion.div
        ref={numberRef}
        className="w-32 text-right font-mono tabular-nums"
        animate={{
          scale: value > previousValueRef.current ? [1, 1.06, 1] : 1,
        }}
        transition={{ duration: 0.3 }}
      >
        {value.toLocaleString()}
      </motion.div>
    </div>
  );
}
