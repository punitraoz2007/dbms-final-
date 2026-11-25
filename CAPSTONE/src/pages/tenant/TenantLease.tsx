import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { getLeases, getTenantById, getPropertyById } from '../../services/db.ts';
import { Lease, Tenant, Property } from '../../types/index.ts';
import { Badge, getStatusBadgeVariant } from '../../components/common/Badge.tsx';
import { FileText, Calendar, CreditCard, Shield, CheckCircle2, Building2, Sparkles, Download } from 'lucide-react';
import { motion } from 'motion/react';

export const TenantLease: React.FC = () => {
  const { currentUser } = useAuth();
  const [lease, setLease] = useState<Lease | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!currentUser) return;
      try {
        const tenantId = currentUser.tenantRecordId || currentUser.id;
        const [lList, t] = await Promise.all([getLeases(undefined, tenantId), getTenantById(tenantId)]);
        if (lList.length > 0) {
          setLease(lList[0]);
        }
        if (t) {
          const p = await getPropertyById(t.propertyId);
          setProperty(p);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [currentUser]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">My Lease Agreement</h1>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
            Active Contract
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Review legal tenancy parameters, duration, rental obligations, and deposit escrow status.
        </p>
      </div>

      {!lease ? (
        <div className="bg-slate-900/40 rounded-2xl border border-dashed border-white/10 p-12 text-center text-xs text-slate-400 backdrop-blur-md">
          <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="font-semibold text-white">No active lease record found for this profile.</p>
          <p className="mt-1 text-slate-500">Your landlord will generate your legal tenancy agreement upon unit assignment.</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/70 rounded-2xl border border-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-white/10 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.25)]">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">Residential Tenancy Agreement</h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5">Agreement Reference: {lease.id}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusBadgeVariant(lease.status)} size="md">
                {lease.status}
              </Badge>
            </div>
          </div>

          {/* Key Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Property & Suite</span>
              <p className="text-sm font-bold text-white">{lease.propertyName}</p>
              <p className="text-xs text-cyan-400 font-mono font-medium">Unit {lease.unitNumber}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Monthly Rent</span>
              <p className="text-sm font-bold text-emerald-400 font-mono">
                ₹{lease.monthlyRent.toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-400 font-mono">Due on 5th</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Security Deposit</span>
              <p className="text-sm font-bold text-slate-200 font-mono">
                ₹{lease.securityDeposit.toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-400 font-mono">Held in Escrow</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Contract Validity</span>
              <p className="text-xs font-bold text-white font-mono">{lease.startDate}</p>
              <p className="text-xs text-slate-400 font-mono">to {lease.endDate}</p>
            </div>
          </div>

          {/* Clauses & Governance */}
          <div className="space-y-4 pt-4 border-t border-white/10 text-xs text-slate-300">
            <h3 className="font-bold text-white text-sm tracking-tight flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              Standard Tenancy Provisions & Obligations
            </h3>

            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-white">Monthly Rent Payment Terms</h4>
                  <p className="text-slate-400 mt-0.5 leading-relaxed">
                    Rent of ₹{lease.monthlyRent.toLocaleString()} must be settled by the 5th day of each calendar month. Digital UPI and Netbanking receipts are logged in real time.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-white">Security Deposit Terms</h4>
                  <p className="text-slate-400 mt-0.5 leading-relaxed">
                    The security deposit of ₹{lease.securityDeposit.toLocaleString()} is refundable at the end of the tenancy period, subject to deduction for damages or unpaid utilities.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-white">Maintenance and Repairs</h4>
                  <p className="text-slate-400 mt-0.5 leading-relaxed">
                    Major structural, electrical, and plumbing repairs will be handled by the landlord. Resident submits tickets via the Maintenance Portal.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
