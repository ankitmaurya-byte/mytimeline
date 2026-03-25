"use client";
import React, { useRef, useState, useCallback } from "react";
import { motion, useMotionValue, useSpring, useMotionTemplate } from "framer-motion";

/** SpotlightReveal
 * A section that reveals vivid content under a soft spotlight that tracks the cursor / touch.
 * Fallbacks gracefully to a centered glow on touch devices.
 */
export const SpotlightReveal: React.FC<{ title?: string; subtitle?: string; children?: React.ReactNode; height?: string; }> = ({
  title = "Effortless Temporal Intelligence",
  subtitle = "Hover or touch to explore the data illuminated in real time.",
  children,
  height = "min-h-[80vh]"
}) => {
  const areaRef = useRef<HTMLDivElement | null>(null);
  const x = useMotionValue(50);
  const y = useMotionValue(50);
  const sX = useSpring(x, { stiffness: 120, damping: 18, mass: 0.5 });
  const sY = useSpring(y, { stiffness: 120, damping: 18, mass: 0.5 });

  const mask = useMotionTemplate`radial-gradient(circle at ${sX}% ${sY}%, rgba(255,255,255,0.95), rgba(255,255,255,0.55) 18%, rgba(255,255,255,0.15) 35%, transparent 60%)`;

  const handleMove = useCallback((e: React.PointerEvent) => {
    const el = areaRef.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;
    x.set(px); y.set(py);
  }, [x, y]);

  const handleLeave = () => { x.set(50); y.set(50); };

  return (
    <section className={`relative w-full ${height} flex items-center justify-center overflow-hidden bg-slate-950`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#1e3a8a_0%,#0f172a_40%,#020617_75%)]" />
      <motion.div
        ref={areaRef}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        onPointerDown={handleMove}
        className="relative z-10 w-full h-full px-8 py-24 cursor-none select-none"
        style={{ WebkitMaskImage: mask, maskImage: mask, transition: 'mask-position .2s' }}
      >
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="space-y-6">
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white via-cyan-200 to-indigo-300 drop-shadow-lg">
              {title}
            </h2>
            <p className="text-lg md:text-2xl text-slate-300/90 max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {children || Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="relative group rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 overflow-hidden">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.25),transparent_70%)]" />
                <h3 className="font-semibold text-white/90 mb-1 tracking-wide text-sm">METRIC #{i + 1}</h3>
                <p className="text-slate-300/80 text-xs leading-relaxed">High fidelity temporal artifact highlighting trends & anomalies.</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
      <div className="pointer-events-none absolute inset-0 mix-blend-overlay bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.15),transparent_60%)]" />
    </section>
  );
};
