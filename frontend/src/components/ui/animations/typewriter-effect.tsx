"use client";

import { cn } from "@/lib/utils";
import { motion, useAnimate, useInView } from "framer-motion";
import { useEffect } from "react";

export const TypewriterEffect = ({
  words,
  className,
  cursorClassName,
}: {
  words: {
    text: string;
    className?: string;
  }[];
  className?: string;
  cursorClassName?: string;
}) => {
  const wordsArray = words.map((word) => ({
    ...word,
    text: word.text.split(""),
  }));

  const [scope, animate] = useAnimate();
  const isInView = useInView(scope);

  useEffect(() => {
    if (!isInView) return;

    let isCancelled = false;

    const playAnimation = async () => {
      while (!isCancelled) {
        // const totalDelay = 0;

        for (let wordIndex = 0; wordIndex < wordsArray.length; wordIndex++) {
          const word = wordsArray[wordIndex];
          if (!word) continue;
          for (let charIndex = 0; charIndex < word.text.length; charIndex++) {
            if (!scope.current) return;
            const el = scope.current.querySelector(
              `[data-word="${wordIndex}"][data-char="${charIndex}"]`
            ) as HTMLElement | null;
            if (!el) continue;
            await animate(
              el,
              { opacity: 1, display: "inline-block" },
              {
                delay: 0,
                duration: 0.2,
                ease: "easeInOut",
              }
            );
          }

          // Add delay between words
          await new Promise((r) => setTimeout(r, 400));
        }

        // Pause before clearing
        await new Promise((r) => setTimeout(r, 1500));

        // Reset all characters
        for (let wordIndex = 0; wordIndex < wordsArray.length; wordIndex++) {
          const word = wordsArray[wordIndex];
          if (!word) continue;
          for (let charIndex = 0; charIndex < word.text.length; charIndex++) {
            if (!scope.current) return;
            const el = scope.current.querySelector(
              `[data-word="${wordIndex}"][data-char="${charIndex}"]`
            ) as HTMLElement | null;
            if (!el) continue;
            await animate(
              el,
              { opacity: 0, display: "none" },
              {
                delay: 0,
                duration: 0.05,
              }
            );
          }
        }

        // Tiny delay before starting again
        await new Promise((r) => setTimeout(r, 500));
      }
    };

    playAnimation();

    return () => {
      isCancelled = true;
    };
  }, [isInView, animate, wordsArray, scope]);

  const renderWords = () => (
    <motion.div ref={scope} className="inline relative">
      {wordsArray.map((word, idx) => (
        <div key={`word-${idx}`} className="inline-block">
          {word.text.map((char, index) => (
            <motion.span
              initial={{ opacity: 0, display: "none" }}
              key={`char-${index}`}
              data-word={idx}
              data-char={index}
              className={cn(
                `dark:text-white text-black`,
                word.className
              )}
            >
              {char}
            </motion.span>
          ))}
          &nbsp;
        </div>
      ))}
    </motion.div>
  );

  return (
    <div
      className={cn(
        "text-base sm:text-xl md:text-3xl lg:text-5xl font-bold text-center relative",
        className
      )}
    >
      {renderWords()}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          repeatType: "reverse",
        }}
        className={cn(
          "inline-block rounded-sm w-[4px] h-4 md:h-6 lg:h-10 bg-blue-500",
          cursorClassName
        )}
      />
    </div>
  );
};
