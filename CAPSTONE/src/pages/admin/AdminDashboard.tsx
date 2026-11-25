import React, { useState, useEffect } from 'react';
import { getAdminStats, getActivityLogs } from '../../services/db.ts';
import { StatCard } from '../../components/common/StatCard.tsx';
import { Users, Building2, UserCheck, FileText, MailCheck, ShieldCheck, Activity, Plus, ArrowUpRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ActivityLog } from '../../types/index.ts';
import { motion } from 'motion/react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalLandlords: 0,
    activeLandlords: 0,
    totalProperties: 0,
    totalTenants: 0,
    activeLeases: 0,
    pendingInvitations: 0,
  });
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statData, logs] = await Promise.all([
          getAdminStats(),
          getActivityLogs(undefined, 8),
        ]);
        setStats(statData);
        setActivities(logs);
      } catch (err) {
        console.error('Failed to load admin dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white font-display">
              Platform Overview
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
              Live Real-Time
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Cross-tenant network telemetry, portfolio infrastructure, and verification pipeline
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/landlords"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            Add Landlord
          </Link>
        </div>
      </div>

      {/* 2026 Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Landlords"
          value={loading ? '...' : stats.totalLandlords}
          icon={Users}
          color="cyan"
          subtitle={`${stats.activeLandlords} Active`}
        />
        <StatCard
          title="Active Landlords"
          value={loading ? '...' : stats.activeLandlords}
          icon={ShieldCheck}
          color="emerald"
        />
        <StatCard
          title="Total Properties"
          value={loading ? '...' : stats.totalProperties}
          icon={Building2}
          color="blue"
        />
        <StatCard
          title="Total Tenants"
          value={loading ? '...' : stats.totalTenants}
          icon={UserCheck}
          color="purple"
        />
        <StatCard
          title="Active Leases"
          value={loading ? '...' : stats.activeLeases}
          icon={FileText}
          color="indigo"
        />
        <StatCard
          title="Pending Invites"
          value={loading ? '...' : stats.pendingInvitations}
          icon={MailCheck}
          color="rose"
        />
      </div>

      {/* Main Grid: Activity & System Security */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent System Activity */}
        <div className="lg:col-span-2 bg-slate-900/70 rounded-2xl border border-white/10 p-6 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white tracking-tight">Recent Activity Stream</h2>
                <p className="text-[11px] text-slate-400">Cryptographically verifiable event log</p>
              </div>
            </div>
            <Link to="/admin/activity" className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
              Full Audit Trail →
            </Link>
          </div>

          <div className="mt-4 divide-y divide-white/5">
            {activities.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No recent activity recorded.</p>
            ) : (
              activities.map((log) => (
                <div key={log.id} className="py-3 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                    <div>
                      <p className="text-xs font-semibold text-slate-200">{log.details}</p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-mono">
                        <span>{log.actorName}</span>
                        <span>·</span>
                        <span className="capitalize px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/5">
                          {log.actorRole}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0 font-mono">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Administration Actions & Security Architecture */}
        <div className="space-y-6">
          <div className="bg-slate-900/70 rounded-2xl border border-white/10 p-6 backdrop-blur-xl shadow-lg">
            <h2 className="text-sm font-bold text-white mb-4 tracking-tight">Quick Shortcuts</h2>
            <div className="space-y-2.5 text-xs">
              <Link
                to="/admin/landlords"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 text-slate-200 hover:text-white border border-white/5 hover:border-cyan-500/30 transition-all font-semibold"
              >
                <span>Landlord Directory</span>
                <span className="text-slate-400">→</span>
              </Link>
              <Link
                to="/admin/properties"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 text-slate-200 hover:text-white border border-white/5 hover:border-cyan-500/30 transition-all font-semibold"
              >
                <span>Inspect Properties</span>
                <span className="text-slate-400">→</span>
              </Link>
              <Link
                to="/admin/invitations"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 text-slate-200 hover:text-white border border-white/5 hover:border-cyan-500/30 transition-all font-semibold"
              >
                <span>Track Invitations</span>
                <span className="text-slate-400">→</span>
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-indigo-950/80 text-white rounded-2xl p-6 border border-white/10 relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
            <h3 className="text-sm font-bold text-white font-display">2026 Security Architecture</h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Row Level Security enforced. Multi-tenant isolation prevents cross-account leakages. Landlords and tenants operate inside sandboxed partitions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
