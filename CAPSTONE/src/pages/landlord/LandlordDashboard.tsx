import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { getLandlordStats, getPayments, getComplaints, getProperties } from '../../services/db.ts';
import { StatCard } from '../../components/common/StatCard.tsx';
import { Badge, getStatusBadgeVariant } from '../../components/common/Badge.tsx';
import {
  Building2,
  DoorOpen,
  Users,
  CreditCard,
  AlertCircle,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Payment, Complaint, Property } from '../../types/index.ts';
import { motion } from 'motion/react';

export const LandlordDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalUnits: 0,
    occupiedUnits: 0,
    vacantUnits: 0,
    totalTenants: 0,
    monthlyExpectedRent: 0,
    pendingRent: 0,
    collectedRent: 0,
    activeLeases: 0,
  });
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [recentComplaints, setRecentComplaints] = useState<Complaint[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!currentUser) return;
      try {
        const [statData, payments, complaints, props] = await Promise.all([
          getLandlordStats(currentUser.id),
          getPayments(currentUser.id),
          getComplaints(currentUser.id),
          getProperties(currentUser.id),
        ]);
        setStats(statData);
        setRecentPayments(payments.slice(0, 5));
        setRecentComplaints(complaints.slice(0, 5));
        setProperties(props);
      } catch (err) {
        console.error('Error loading landlord dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentUser]);

  const occupancyRate =
    stats.totalUnits > 0 ? Math.round((stats.occupiedUnits / stats.totalUnits) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white font-display">
              Welcome, {currentUser?.fullName || 'Rahul Sharma'}
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
              Portfolio Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time rental revenue telemetry, tenant occupancy status, and maintenance pipeline.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/landlord/properties"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-white/10 text-xs font-semibold rounded-xl shadow-lg transition-all hover:scale-[1.02]"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Property
          </Link>
          <Link
            to="/landlord/tenants"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02]"
          >
            <Users className="w-3.5 h-3.5" />
            Invite Tenant
          </Link>
        </div>
      </div>

      {/* Primary 8 Metrics required by Section 6 */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Properties"
          value={loading ? '...' : stats.totalProperties}
          icon={Building2}
          color="cyan"
          subtitle={`${properties.map((p) => p.name).slice(0, 2).join(', ') || 'No properties'}`}
        />
        <StatCard
          title="Total Units"
          value={loading ? '...' : stats.totalUnits}
          icon={DoorOpen}
          color="indigo"
          subtitle={`${stats.vacantUnits} Currently Vacant`}
        />
        <StatCard
          title="Occupied Units"
          value={loading ? '...' : stats.occupiedUnits}
          icon={DoorOpen}
          color="emerald"
          subtitle={`${occupancyRate}% Occupancy Rate`}
        />
        <StatCard
          title="Vacant Units"
          value={loading ? '...' : stats.vacantUnits}
          icon={DoorOpen}
          color="amber"
          subtitle="Ready to lease"
        />
        <StatCard
          title="Total Tenants"
          value={loading ? '...' : stats.totalTenants}
          icon={Users}
          color="purple"
          subtitle={`${stats.activeLeases} Active Leases`}
        />
        <StatCard
          title="Monthly Expected Rent"
          value={loading ? '...' : `₹${stats.monthlyExpectedRent.toLocaleString()}`}
          icon={CreditCard}
          color="emerald"
          subtitle="Based on occupied units"
        />
        <StatCard
          title="Pending Rent"
          value={loading ? '...' : `₹${stats.pendingRent.toLocaleString()}`}
          icon={CreditCard}
          color="rose"
          subtitle="Awaiting tenant payment"
        />
        <StatCard
          title="Active Leases"
          value={loading ? '...' : stats.activeLeases}
          icon={CreditCard}
          color="blue"
          subtitle="Under legal agreements"
        />
      </div>

      {/* Financial Bar & Occupancy Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Financial Summary */}
        <div className="bg-slate-900/70 rounded-2xl border border-white/10 p-6 backdrop-blur-xl shadow-xl lg:col-span-2">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Rent Collection Overview</h2>
              <p className="text-xs text-slate-400 mt-0.5">Summary of expected vs collected rent this billing cycle</p>
            </div>
            <Link to="/landlord/payments" className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
              Manage Payments →
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-white/10">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block font-mono">
                Expected Monthly
              </span>
              <p className="text-xl font-bold text-white mt-1 font-mono">₹{stats.monthlyExpectedRent.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block font-mono">
                Total Collected
              </span>
              <p className="text-xl font-bold text-emerald-300 mt-1 font-mono">₹{stats.collectedRent.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider block font-mono">
                Pending / Overdue
              </span>
              <p className="text-xl font-bold text-rose-300 mt-1 font-mono">₹{stats.pendingRent.toLocaleString()}</p>
            </div>
          </div>

          {/* Occupancy visual gauge */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-300">Portfolio Occupancy Rate</span>
              <span className="text-cyan-400 font-mono">{occupancyRate}% Occupied</span>
            </div>
            <div className="w-full bg-slate-950/70 h-2.5 rounded-full mt-2.5 overflow-hidden flex border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${occupancyRate}%` }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 h-full rounded-full shadow-[0_0_12px_rgba(6,182,212,0.5)]"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-mono">
              <span>{stats.occupiedUnits} units occupied</span>
              <span>{stats.vacantUnits} units available</span>
            </div>
          </div>
        </div>

        {/* Quick Property List */}
        <div className="bg-slate-900/70 rounded-2xl border border-white/10 p-6 backdrop-blur-xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h2 className="text-sm font-bold text-white tracking-tight">Your Properties</h2>
              <Link to="/landlord/properties" className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
                View All
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {properties.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No properties added yet.</p>
              ) : (
                properties.slice(0, 3).map((prop) => (
                  <div key={prop.id} className="p-3 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-between hover:border-cyan-500/30 transition-all">
                    <div>
                      <h4 className="text-xs font-bold text-white">{prop.name}</h4>
                      <p className="text-[11px] text-slate-400 font-mono">{prop.city} · {prop.type}</p>
                    </div>
                    <Badge variant={getStatusBadgeVariant(prop.status)}>{prop.status}</Badge>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10">
            <Link
              to="/landlord/tenants"
              className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.01]"
            >
              <span>Onboard New Tenant</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Payments and Open Complaints */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <div className="bg-slate-900/70 rounded-2xl border border-white/10 p-6 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 tracking-tight">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              Recent Payments
            </h2>
            <Link to="/landlord/payments" className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
              All Payments
            </Link>
          </div>
          <div className="mt-4 divide-y divide-white/5">
            {recentPayments.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No payment transactions recorded.</p>
            ) : (
              recentPayments.map((pay) => (
                <div key={pay.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-white">{pay.tenantName}</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {pay.propertyName} · Unit {pay.unitNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-400 font-mono text-sm">
                      ₹{pay.amount.toLocaleString()}
                    </p>
                    <Badge variant={getStatusBadgeVariant(pay.status)}>{pay.status}</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Maintenance Complaints */}
        <div className="bg-slate-900/70 rounded-2xl border border-white/10 p-6 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 tracking-tight">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              Recent Maintenance Requests
            </h2>
            <Link to="/landlord/complaints" className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
              All Requests
            </Link>
          </div>
          <div className="mt-4 divide-y divide-white/5">
            {recentComplaints.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No active maintenance requests.</p>
            ) : (
              recentComplaints.map((c) => (
                <div key={c.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                  <div>
                    <h4 className="font-semibold text-white">{c.title}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{c.description}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-1">
                      {c.propertyName} (Unit {c.unitNumber}) · by {c.tenantName}
                    </p>
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <Badge variant={getStatusBadgeVariant(c.status)}>{c.status}</Badge>
                    <div className="text-[10px] font-mono text-slate-400 uppercase">{c.priority} Priority</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
