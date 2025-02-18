"use client";

import { motion } from "framer-motion";

export const LogoHeader = () => {
  return (
    <div className="flex flex-col justify-center items-center mb-8">
      <div className="relative">
        {/* Multiple glow layers */}
        <motion.div
          className="absolute inset-[-2px] rounded-2xl blur-md"
          animate={{
            background: [
              "linear-gradient(45deg, #22d3ee, #3b82f6, #22d3ee)",
              "linear-gradient(45deg, #3b82f6, #22d3ee, #3b82f6)",
              "linear-gradient(45deg, #22d3ee, #3b82f6, #22d3ee)",
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
        <motion.div
          className="absolute inset-[-2px] rounded-2xl blur-md opacity-75"
          animate={{
            background: [
              "linear-gradient(190deg, #22d3ee80, #3b82f680)",
              "linear-gradient(190deg, #3b82f680, #22d3ee80)",
              "linear-gradient(190deg, #22d3ee80, #3b82f680)",
            ],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: "reverse",
            delay: 0.5,
          }}
        />
        <motion.div
          className="absolute inset-[-2px] rounded-2xl blur-md opacity-50"
          animate={{
            background: [
              "linear-gradient(320deg, #818cf880, #3b82f680)",
              "linear-gradient(320deg, #3b82f680, #818cf880)",
              "linear-gradient(320deg, #818cf880, #3b82f680)",
            ],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            repeatType: "reverse",
            delay: 1,
          }}
        />

        {/* Main content box */}
        <motion.div
          className="relative px-8 py-3 rounded-2xl bg-white dark:bg-white/95 shadow-lg"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 relative z-10">
            v4
          </h1>
        </motion.div>
      </div>

      {/* Subtext */}
      <motion.div
        className="mt-6 text-gray-600 text-sm md:text-base text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        The hub for Uniswap data and hooks
      </motion.div>
    </div>
  );
};
