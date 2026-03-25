"use client";
import React, { useRef, useCallback } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface MagneticCardProps {
  title: string;
  description: string;
  accent?: string;
}

const MagneticCard: React.FC<MagneticCardProps> = ({ title, description, accent = 'indigo' }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rX = useSpring(useTransform(y, [-60, 60], [12, -12]), { stiffness: 160, damping: 14 });
  const rY = useSpring(useTransform(x, [-60, 60], [-12, 12]), { stiffness: 160, damping: 14 });
  const glow = useSpring(0, { stiffness: 120, damping: 20 });

  const handleMove = useCallback((e: React.PointerEvent) => {
    const el = ref.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    const localX = e.clientX - rect.left - rect.width / 2; // centered
    const localY = e.clientY - rect.top - rect.height / 2;
    x.set(localX); y.set(localY); glow.set(1);
  }, [x, y, glow]);

  const handleLeave = () => { x.set(0); y.set(0); glow.set(0); };

  return (
    <motion.div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      onPointerDown={handleMove}
      className={`group relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 md:p-8 overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_8px_30px_-8px_rgba(0,0,0,0.5)] cursor-pointer select-none`}
      style={{
        transformStyle: 'preserve-3d',
        rotateX: rX,
        rotateY: rY,
      }}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ type: 'spring', stiffness: 200, damping: 26 }}
    >
      <motion.div
        className="absolute -inset-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at 50% 35%, var(--tw-gradient-from), transparent 70%)`,
          filter: glow.get() ? 'blur(22px)' : 'blur(28px)'
        }}
      />
      <div className="relative z-10 space-y-4">
        <h3 className={`text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-${accent}-300 via-${accent}-200 to-white`}>{title}</h3>
        <p className="text-sm leading-relaxed text-slate-300/80 font-medium max-w-sm">{description}</p>
        <div className="pt-2 flex items-center gap-2 text-xs font-mono uppercase tracking-wide text-slate-400">
          <span className="h-[6px] w-[6px] rounded-full bg-emerald-400 animate-pulse" />
          Interactive
        </div>
      </div>
      <div className={`pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-${accent}-500/10 via-${accent}-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
    </motion.div>
  );
};

export const MagneticCardGrid: React.FC = () => {
  const cards: MagneticCardProps[] = [
    { title: 'Chrono Index', description: 'Blazing-fast temporal indexing for multidimensional queries.', accent: 'indigo' },
    { title: 'Time Diff Engine', description: 'Deterministic differencing & drift detection across snapshots.', accent: 'cyan' },
    { title: 'Reactive Timelines', description: 'Live streaming deltas with guaranteed ordering semantics.', accent: 'violet' },
    { title: 'Anomaly Lenses', description: 'Adaptive statistical windows that highlight outliers instantly.', accent: 'emerald' },
    { title: 'Vector Fusion', description: 'Hybrid similarity + time segmentation embeddings pipeline.', accent: 'pink' },
    { title: 'Entropy Scores', description: 'Noise/entropy scoring to surface signal-rich regions.', accent: 'fuchsia' },
  ];

  return (
    <section className="relative w-full py-28 bg-slate-950 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#172554,#0f172a_45%,#020617_80%)]" />
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="text-center mb-20 space-y-6">
          <h2 className="text-4xl md:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-br from-white via-indigo-200 to-blue-300 tracking-tight">Modular Intelligence Stack</h2>
          <p className="text-slate-300/80 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">Each module is a first-class primitive designed to compose into rich temporal analytics flows. Pick, plug, synthesize.</p>
        </div>
        <div className="grid gap-10 md:gap-14 md:grid-cols-2 lg:grid-cols-3">
          {cards.map(card => <MagneticCard key={card.title} {...card} />)}
        </div>
      </div>
    </section>
  );
};
