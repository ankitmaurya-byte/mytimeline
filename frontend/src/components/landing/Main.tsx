'use client';
// Use lazy-loaded animation components
import { LazyTypewriter } from "../lazy-animations";
import Link from "next/link";
import buttonVariants from "../ui/button-variants";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

// Simple gradient background
export function Main() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center max-w-5xl mx-auto"
      >
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="text-2xl relative z-20 md:text-4xl lg:text-7xl font-bold text-center text-black dark:text-white font-sans tracking-tight"
        >
          <div className="relative mx-auto w-max [filter:drop-shadow(0px_1px_3px_rgba(27,_37,_80,_0.14))]">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
              className="relative bg-clip-text text-transparent bg-no-repeat bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 py-4"
            >
              <p className="">Dynamic Teamwork</p>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
            >
              Smart Projects
            </motion.h2>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
            >
              <LazyTypewriter
                words={[
                  { text: "One", className: "text-blue-600" },
                  { text: "Timeline", className: "text-purple-600" },
                ]}
                className="mt-10"
                cursorClassName="bg-red-500"
              />
            </motion.div>
          </div>
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0, ease: "easeOut" }}
          className="flex items-center justify-center gap-x-4 flex-row py-6"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Link
              href="/sign-in"
              className={cn(buttonVariants({
                size: "sm",
                variant: "outline",
              }), "w-32 rounded-xl text-sm")}
            >
              Login
            </Link>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Link
              href="/sign-up"
              className={cn(buttonVariants({
                size: "sm",
              }), "w-32 md:w-40 rounded-xl text-sm")}
            >
              Get started <ArrowRight className="ml-1.5 h-5 w-5" />
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
