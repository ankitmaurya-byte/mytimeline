"use client";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import React, { useRef, useState, useEffect, useMemo } from "react";

export const BackgroundBeamsWithCollision = ({
  children,
  className,
  density = 7,
  speedMultiplier = 1,
  colors = ["from-indigo-500 via-purple-500"],
  seed = 1337,
  fullHeight = true,
}: {
  children: React.ReactNode;
  className?: string;
  density?: number;
  speedMultiplier?: number;
  colors?: string[];
  seed?: number;
  fullHeight?: boolean; // if false: no forced viewport height
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const [parentSize, setParentSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const beamsRef = useRef<BeamConfig[] | null>(null); // freeze beam configs after first generation for SSR/CSR parity

  // Measure parent once (and on resize)
  useEffect(() => {
    const measure = () => {
      if (parentRef.current) {
        const r = parentRef.current.getBoundingClientRect();
        setParentSize({ w: r.width, h: r.height });
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Deterministic PRNG (Mulberry32) - pure, no side effects
  const prng = useMemo(() => {
    let s = seed >>> 0;
    return () => {
      s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }, [seed]);

  // Generate beams distributed across full width
  if (!beamsRef.current || beamsRef.current.length !== density) {
    const width = Math.max(parentSize.w || (typeof window !== 'undefined' ? window.innerWidth : 1400), 1400); // Use actual width
    const arr: BeamConfig[] = [];
    for (let i = 0; i < density; i++) {
      // Distribute beams evenly across the full width with some randomness
      const baseX = (i / Math.max(density - 1, 1)) * width;
      const randomOffset = (prng() - 0.5) * (width / density);
      const x = Math.max(0, Math.min(width, baseX + randomOffset));
      const sizeVariant = prng();
      const heightClass = sizeVariant > 0.8 ? 'h-20' : sizeVariant > 0.6 ? 'h-12' : sizeVariant > 0.3 ? 'h-8' : 'h-5';
      const baseDuration = 5 + prng() * 6; // 5-11s
      const duration = baseDuration / speedMultiplier;
      const gradient = colors[i % colors.length];
      arr.push({
        initialX: x,
        translateX: x,
        duration,
        className: `${heightClass} bg-gradient-to-t ${gradient} to-transparent`,
      });
    }
    beamsRef.current = arr;
  }
  const beams = beamsRef.current;

  return (
    <div
      ref={parentRef}
      className={cn(
        // Responsive container: avoid forcing a fixed viewport height on small screens to prevent extra whitespace.
        // Use min-height so content taller than the viewport can expand naturally.
        'relative flex w-full overflow-hidden',
        // Top-align on very small screens (more natural scroll), center from sm+.
        'items-start sm:items-center justify-center',
        fullHeight
          ? 'min-h-[calc(100svh-7vh)] md:min-h-[calc(100vh-7vh)] pt-24 pb-12 sm:py-0'
          : 'py-20 md:py-24 min-h-[60vh]',
        // Horizontal padding for small screens to avoid edge collisions.
        'px-4 sm:px-6',
        className
      )}
    >
      {/* Beams */}
      {beams.map((beam, idx) => (
        <CollisionMechanism
          key={idx}
          beamOptions={beam}
          containerRef={containerRef}
          parentRef={parentRef}
          parentHeight={parentSize.h || 900}
        />
      ))}

      {/* Content overlay (column layout to respect hero vertical stacking) */}
      <div className="relative z-10 w-full flex flex-col justify-center items-center gap-y-4">{children}</div>

      {/* Bottom collision strip */}
    </div>
  );
};

interface BeamConfig {
  initialX?: number;
  translateX?: number;
  initialY?: number;
  translateY?: number;
  rotate?: number;
  className?: string;
  duration?: number;
  delay?: number;
  repeatDelay?: number;
}

const CollisionMechanism = React.forwardRef<
  HTMLDivElement,
  {
    containerRef: React.RefObject<HTMLDivElement>;
    parentRef: React.RefObject<HTMLDivElement>;
    parentHeight: number;
    beamOptions?: BeamConfig;
  }
>(({ parentRef, containerRef, parentHeight, beamOptions = {} }, ref) => {
  const beamRef = useRef<HTMLDivElement>(null);
  const lastTopRef = useRef<number | null>(null);
  const [collision, setCollision] = useState<{
    detected: boolean;
    coordinates: { x: number; y: number } | null;
  }>({ detected: false, coordinates: null });
  const [cycleCollided, setCycleCollided] = useState(false);

  // End position based on parent height (with small overshoot)
  const endY = parentHeight + 150;
  const startY = -200; // just above view to avoid blank start

  // Reset collision state each time the animation repeats
  const handleUpdate = () => {
    if (beamRef.current && containerRef.current && parentRef.current) {
      const beamRect = beamRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      const parentRect = parentRef.current.getBoundingClientRect();

      // Loop detection: when beam jumps back near start (top much less than previous)
      if (lastTopRef.current !== null) {
        if (beamRect.top + 50 < lastTopRef.current && beamRect.top < parentRect.top - 120) {
          // reset for new cycle
          setCycleCollided(false);
          setCollision({ detected: false, coordinates: null });
        }
      }
      lastTopRef.current = beamRect.top;

      if (!cycleCollided && beamRect.bottom >= containerRect.top) {
        const relativeX = beamRect.left - parentRect.left + beamRect.width / 2;
        const relativeY = beamRect.bottom - parentRect.top;
        setCollision({ detected: true, coordinates: { x: relativeX, y: relativeY } });
        setCycleCollided(true);
        setTimeout(() => setCollision({ detected: false, coordinates: null }), 900);
      }
    }
  };

  return (
    <div className="relative">
      <motion.div
        ref={(node) => {
          (beamRef as any).current = node as HTMLDivElement;
          if (typeof ref === 'function') ref(node as HTMLDivElement);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node as HTMLDivElement;
        }}
        initial={{ translateY: startY, translateX: beamOptions.initialX || 0 }}
        animate={{ translateY: endY, translateX: beamOptions.translateX || beamOptions.initialX || 0 }}
        transition={{
          duration: beamOptions.duration || 8,
          repeat: Infinity,
          ease: 'linear',
        }}
        onUpdate={handleUpdate}
        className={cn(
          'absolute left-0 top-0 h-16 w-px rounded-full pointer-events-none will-change-transform bg-gradient-to-t from-indigo-500 via-purple-500 to-transparent',
          beamOptions.className
        )}
        style={{
          // GPU hint
          transformOrigin: 'center top',
        }}
      />
      <AnimatePresence>
        {collision.detected && collision.coordinates && (
          <Explosion
            key={`${collision.coordinates.x}-${collision.coordinates.y}`}
            className=""
            style={{
              left: `${collision.coordinates.x}px`,
              top: `${collision.coordinates.y}px`,
              transform: "translate(-50%, -50%)",
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
});

CollisionMechanism.displayName = "CollisionMechanism";

const Explosion = ({ ...props }: React.HTMLProps<HTMLDivElement>) => {
  const spans = Array.from({ length: 20 }, (_, index) => ({
    id: index,
    initialX: 0,
    initialY: 0,
    directionX: Math.floor(Math.random() * 80 - 40),
    directionY: Math.floor(Math.random() * -50 - 10),
  }));

  return (
    <div {...props} className={cn("absolute z-50 h-2 w-2", props.className)}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute -inset-x-10 top-0 m-auto h-2 w-10 rounded-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent blur-sm"
      ></motion.div>
      {spans.map((span) => (
        <motion.span
          key={span.id}
          initial={{ x: span.initialX, y: span.initialY, opacity: 1 }}
          animate={{
            x: span.directionX,
            y: span.directionY,
            opacity: 0,
          }}
          transition={{ duration: Math.random() * 1.5 + 0.5, ease: "easeOut" }}
          className="absolute h-1 w-1 rounded-full bg-gradient-to-b from-indigo-500 to-purple-500"
        />
      ))}
    </div>
  );
};
