"use client";

import { motion } from "framer-motion";

export const LogoHeader = () => {
  return (
    <div className="flex flex-col items-center mb-6">
      <div className="flex items-center gap-6">
        {/* Logo with glow */}
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
            className="relative px-6 py-2 rounded-2xl bg-white dark:bg-white/95 shadow-lg"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 relative z-10">
              v4
            </h1>
          </motion.div>
        </div>

        {/* Text content */}
        <div className="flex flex-col items-start">
          <motion.div
            className="text-gray-600 text-sm md:text-base font-medium"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            The hub for Uniswap data and hooks
          </motion.div>
          <motion.div
            className="flex items-center gap-1.5 text-xs text-muted-foreground/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <span>Powered by</span>
            <a
              href="https://docs.envio.dev/docs/HyperIndex/overview"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary/70 hover:text-primary transition-colors font-medium"
            >
              HyperIndex
            </a>
            <span>on</span>
            <a
              href="https://envio.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary/70 hover:text-primary transition-colors font-medium"
            >
              envio.dev
            </a>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
