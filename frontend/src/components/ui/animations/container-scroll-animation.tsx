"use client";
import React, { useRef, useCallback, useLayoutEffect } from "react";
import { useScroll, useTransform, motion, MotionValue } from "framer-motion";
import { useTheme } from "@/context/theme-context";

export const ContainerScroll = ({
  titleComponent,
  children,
}: {
  titleComponent: string | React.ReactNode;
  children: React.ReactNode;
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Callback ref ensures element is positioned before framer measures offsets
  const setContainerRef = useCallback((el: HTMLDivElement | null) => {
    if (el) {
      if (getComputedStyle(el).position === 'static') {
        el.style.position = 'relative';
      }
    }
    containerRef.current = el;
  }, []);

  // Safety re-check in layout phase (in case of className changes or hydration timing)
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (el && getComputedStyle(el).position === 'static') {
      el.style.position = 'relative';
    }
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
  });
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const scaleDimensions = () => {
    return isMobile ? [0.7, 0.9] : [1.05, 1];
  };

  const rotate = useTransform(scrollYProgress, [0, 0.5, 1], [20, 10, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [scaleDimensions()[0], 1, scaleDimensions()[1]]);
  const translate = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, -30, -70, -100]);

  return (
    <div className="relative w-full overflow-hidden">
      <div
        className="h-[55rem] md:h-[60rem] flex items-center justify-center p-2 md:p-20 w-full transform-gpu"
        ref={setContainerRef}
        style={{
          position: 'relative', // explicit inline to satisfy useScroll requirement
          willChange: 'transform',
          contain: 'layout style paint',
          isolation: 'isolate'
        }}
        data-scroll-container
      >
        <div
          className="py-10 md:py-40 w-full relative"
          style={{
            perspective: "1000px",
          }}
        >
          <Header translate={translate} titleComponent={titleComponent} />
          <Card rotate={rotate} translate={translate} scale={scale}>
            {children}
          </Card>
        </div>
      </div>
    </div>
  );
};

export const Header = ({
  translate,
  titleComponent,
}: {
  translate: MotionValue<number>;
  titleComponent: React.ReactNode;
}) => {
  return (
    <motion.div
      style={{
        translateY: translate,
      }}
      className="relative max-w-5xl mx-auto text-center"
    >
      {titleComponent}
    </motion.div>
  );
};

export const Card = ({
  rotate,
  scale,
  children,
}: {
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  translate: MotionValue<number>;
  children: React.ReactNode;
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <motion.div
      style={{
        rotateX: rotate,
        scale,
        boxShadow: isDark
          ? "0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003"
          : "0 0 #0000002d, 0 9px 20px #0000002a, 0 37px 37px #00000022",
      }}
      className={`max-w-5xl -mt-12 mx-auto h-[30rem] md:h-[40rem] w-full border-4 border-[#6C6C6C] p-2 md:p-6 bg-[#222222] rounded-[30px] relative ${isDark ? 'shadow-2xl' : ''}`}
    >
      <div className=" h-full w-full  overflow-hidden rounded-2xl bg-gray-100 dark:bg-zinc-900 md:rounded-2xl relative">
        {children}
      </div>
    </motion.div>
  );
};

// feels smooth
