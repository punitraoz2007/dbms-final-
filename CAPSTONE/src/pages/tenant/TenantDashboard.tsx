import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  getTenantById,
  getPropertyById,
  getUnitById,
  getLandlordById,
  getLeases,
  getPayments,
  getComplaints,
  getNotices,
} from '../../services/db.ts';
import { Tenant, Property, Unit, Landlord, Lease, Payment, Complaint, Notice } from '../../types/index.ts';
import { Badge, getStatusBadgeVariant } from '../../components/common/Badge.tsx';
import { StatCard } from '../../components/common/StatCard.tsx';
import {
  Building2,
  DoorOpen,
  User,
  CreditCard,
  FileText,
  AlertCircle,
  Bell,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

export const TenantDashboard: React.FC = () => {
  const { currentUser } = useAuth();

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [landlord, setLandlord] = useState<Landlord | null>(null);
  const [activeLease, setActiveLease] = useState<Lease | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTenantData() {
      if (!currentUser) return;
      try {
        const tenantRecId = currentUser.tenantRecordId || currentUser.id;
        const t = await getTenantById(tenantRecId);
        if (t) {
          setTenant(t);
          const [p, u, l, leaseList, payList, cmpList, notList] = await Promise.all([
            getPropertyById(t.propertyId),
            getUnitById(t.unitId),
            getLandlordById(t.landlordId),
            getLeases(undefined, t.id),
            getPayments(undefined, t.id),
            getComplaints(undefined, t.id),
            getNotices(t.landlordId, t.propertyId),
          ]);
          setProperty(p);
          setUnit(u);
          setLandlord(l);
          setActiveLease(leaseList.find((lease) => lease.status === 'Active') || leaseList[0] || null);
          setPayments(payList);
          setComplaints(cmpList);
          setNotices(notList);
        }
      } catch (err) {
        console.error('Error fetching tenant details:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadTenantData();
  }, [currentUser]);

  const upcomingPayment = payments.find((p) => p.status === 'Pending' || p.status === 'Overdue');

  return (
    <div className="space-y-6">
      {/* Welcome Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-white/10 shadow-xl relative overflow-hidden backdrop-blur-xl"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-full">
                Resident Portal
              </span>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active Tenancy
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-2.5 tracking-tight font-display">
              Welcome home, {currentUser?.fullName}
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
              Assigned to{' '}
              <strong className="text-white font-semibold">{property ? property.name : 'Green Residency'}</strong>, Suite{' '}
              <strong className="text-cyan-400 font-mono">{unit ? unit.unitNumber : '101'}</strong>.
            </p>
          </div>

          {upcomingPayment && (
            <div className="bg-slate-950/70 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/15 text-left md:text-right shadow-lg">
              <span className="text-[10px] font-mono text-cyan-300 uppercase tracking-wider font-semibold block">
                Next Rent Due
              </span>
              <span className="text-2xl font-bold text-white mt-0.5 block font-mono">
                ₹{upcomingPayment.amount.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
                Due date: {upcomingPayment.dueDate}
              </span>
              <Link
                to="/tenant/payments"
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all hover:scale-[1.02]"
              >
                <span>Settle Payment</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>
      </motion.div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Assigned Unit"
          value={unit ? `Unit ${unit.unitNumber}` : 'Unit 101'}
          icon={DoorOpen}
          color="cyan"
          subtitle={unit?.floor || '1st Floor'}
        />
        <StatCard
          title="Monthly Rent"
          value={tenant ? `₹${tenant.monthlyRent.toLocaleString()}` : '₹20,000'}
          icon={CreditCard}
          color="emerald"
          subtitle="Due by 5th monthly"
        />
        <StatCard
          title="Security Deposit"
          value={tenant ? `₹${tenant.securityDeposit.toLocaleString()}` : '₹40,000'}
          icon={CreditCard}
          color="purple"
          subtitle="Safely held in escrow"
        />
        <StatCard
          title="Lease Expiration"
          value={tenant?.leaseEndDate ? tenant.leaseEndDate : '31 Dec 2026'}
          icon={Calendar}
          color="amber"
          subtitle="Active legal agreement"
        />
      </div>

      {/* Main Grid: Property & Landlord Details + Recent Notices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Unit & Landlord Details */}
        <div className="bg-slate-900/70 rounded-2xl border border-white/10 p-6 backdrop-blur-xl shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 tracking-tight">
              <Building2 className="w-4 h-4 text-cyan-400" />
              Building & Manager
            </h2>
            <Badge variant="success">Verified Resident</Badge>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <span className="text-slate-400 font-mono text-[11px] block">Property Complex:</span>
              <span className="font-bold text-white text-sm">{property?.name || 'Green Residency'}</span>
              <p className="text-slate-300 mt-1 leading-relaxed">
                {property?.address}, {property?.city} {property?.pinCode}
              </p>
            </div>

            <hr className="border-white/10" />

            <div>
              <span className="text-slate-400 font-mono text-[11px] block">Landlord / Owner:</span>
              <span className="font-bold text-white text-sm">{landlord?.fullName || 'Rahul Sharma'}</span>
              <div className="mt-2.5 space-y-1.5 text-slate-300 font-mono">
                <p className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{landlord?.phone || '+91 98765 43210'}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{landlord?.email || 'rahul@example.com'}</span>
                </p>
              </div>
            </div>

            <hr className="border-white/10" />

            <div className="pt-1">
              <Link
                to="/tenant/complaints"
                className="w-full py-2.5 px-4 bg-slate-800/80 hover:bg-slate-700/80 text-white font-semibold rounded-xl border border-white/10 flex items-center justify-center gap-2 text-xs transition-all hover:scale-[1.01]"
              >
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>Submit Maintenance Request</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Notices and Broadcasts */}
        <div className="bg-slate-900/70 rounded-2xl border border-white/10 p-6 backdrop-blur-xl shadow-xl space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 tracking-tight">
              <Bell className="w-4 h-4 text-cyan-400" />
              Building Announcements
            </h2>
            <Link to="/tenant/notices" className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
              All Notices
            </Link>
          </div>

          <div className="space-y-3">
            {notices.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No active building notices.</p>
            ) : (
              notices.slice(0, 3).map((notice) => (
                <div key={notice.id} className="p-4 rounded-xl bg-slate-950/60 border border-white/5 space-y-1.5 hover:border-cyan-500/20 transition-all">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white text-xs">{notice.title}</h4>
                    <span className="text-[10px] font-mono text-slate-400">{notice.date}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{notice.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Payment History and Open Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Rent Invoices */}
        <div className="bg-slate-900/70 rounded-2xl border border-white/10 p-6 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 tracking-tight">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              Rent Receipts & Invoices
            </h2>
            <Link to="/tenant/payments" className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
              Payment History
            </Link>
          </div>
          <div className="mt-3 divide-y divide-white/5">
            {payments.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No payment history recorded.</p>
            ) : (
              payments.slice(0, 4).map((pay) => (
                <div key={pay.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white font-mono text-sm">
                      ₹{pay.amount.toLocaleString()}
                    </span>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">Due: {pay.dueDate}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={getStatusBadgeVariant(pay.status)}>{pay.status}</Badge>
                    {pay.paymentDate && (
                      <p className="text-[10px] text-slate-400 font-mono mt-1">Paid on {pay.paymentDate}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Maintenance Requests */}
        <div className="bg-slate-900/70 rounded-2xl border border-white/10 p-6 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 tracking-tight">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              Your Maintenance Tickets
            </h2>
            <Link to="/tenant/complaints" className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
              Manage Tickets
            </Link>
          </div>
          <div className="mt-3 divide-y divide-white/5">
            {complaints.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No maintenance requests raised.</p>
            ) : (
              complaints.slice(0, 4).map((c) => (
                <div key={c.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <h4 className="font-semibold text-white">{c.title}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{c.description}</p>
                    <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                      Category: {c.category}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant={getStatusBadgeVariant(c.status)}>{c.status}</Badge>
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
