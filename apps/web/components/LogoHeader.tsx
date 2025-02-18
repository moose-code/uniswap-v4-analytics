"use client";

import { motion } from "framer-motion";

export const LogoHeader = () => {
  return (
    <div className="flex flex-col justify-center items-center mb-4">
      <div className="relative">
        {/* Multiple glow layers */}
        <motion.div
          className="absolute inset-[-2px] rounded-2xl blur-md"
          animate={{
            background: [
              "linear-gradient(45deg, #fc72ff, #ff99ff, #fc72ff)",
              "linear-gradient(45deg, #ff99ff, #fc72ff, #ff99ff)",
              "linear-gradient(45deg, #fc72ff, #ff99ff, #fc72ff)",
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
              "linear-gradient(190deg, #fc72ff80, #ff99ff80)",
              "linear-gradient(190deg, #ff99ff80, #fc72ff80)",
              "linear-gradient(190deg, #fc72ff80, #ff99ff80)",
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
              "linear-gradient(320deg, #ff99ff80, #fc72ff80)",
              "linear-gradient(320deg, #fc72ff80, #ff99ff80)",
              "linear-gradient(320deg, #ff99ff80, #fc72ff80)",
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
        className="mt-4 text-gray-600 text-sm md:text-base text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        The hub for Uniswap data and hooks
      </motion.div>
    </div>
  );
};
