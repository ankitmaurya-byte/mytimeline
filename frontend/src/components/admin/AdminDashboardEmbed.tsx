"use client";
import React, { useEffect, useState } from 'react';
import { Activity, Gauge, Server, Database, Cpu, Zap } from 'lucide-react';

interface MetricsResponse { metrics: any }

export default function AdminDashboardEmbed() {
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/dashboard', { credentials: 'include' });
      if (res.status === 401 || res.status === 403) {
        setVisible(false);
        return;
      }
      if (!res.ok) throw new Error('Failed');
      const data: MetricsResponse = await res.json();
      setMetrics(data.metrics);
      setVisible(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const id = setInterval(fetchMetrics, 10000);
    return () => clearInterval(id);
  }, []);

  if (!visible) return null;

  const core = metrics?.core;
  const perf = metrics?.performance;
  const ai = metrics?.ai;

  const Card = ({ icon: Icon, label, value, sub }: { icon: any; label: string; value: React.ReactNode; sub?: string }) => (
    <div className="rounded-md border bg-white/70 dark:bg-zinc-900/40 p-3 flex flex-col gap-1 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-300"><Icon className="h-3.5 w-3.5" /> {label}</div>
      <div className="text-lg font-semibold leading-none tracking-tight">{value}</div>
      {sub && <div className="text-[10px] text-zinc-500 dark:text-zinc-400">{sub}</div>}
    </div>
  );

  return (
    <section className="mx-auto w-full max-w-6xl px-4 md:px-6 pt-10 md:pt-14">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Admin Snapshot</h2>
        <div className="text-[10px] text-zinc-500">Updated {metrics ? new Date(metrics.generatedAt).toLocaleTimeString() : ''}</div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <Card icon={Activity} label="Tasks" value={core?.tasks.total ?? '—'} sub={core ? `Done ${core.tasks.completed}` : ''} />
        <Card icon={Gauge} label="Completion" value={core ? core.tasks.completionRate.toFixed(1) + '%' : '—'} />
        <Card icon={Server} label="Users" value={core ? core.users.active + core.users.inactive : '—'} sub={core ? `${core.users.active} active` : ''} />
        <Card icon={Database} label="Projects" value={core?.projects ?? '—'} />
        <Card icon={Cpu} label="Avg Q ms" value={perf ? perf.totals.avgMs.toFixed(1) : '—'} sub={perf ? `${perf.totals.slow} slow` : ''} />
        <Card icon={Zap} label="AI" value={ai ? ai.total : 0} sub={ai ? ai.provider : 'none'} />
      </div>
      {error && <div className="mt-3 text-xs text-red-500">{error}</div>}
    </section>
  );
}
