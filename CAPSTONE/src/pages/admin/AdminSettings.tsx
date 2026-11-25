import React, { useState } from 'react';
import { seedInitialDataIfEmpty } from '../../services/db.ts';
import { useNotifications } from '../../context/NotificationContext.tsx';
import { Shield, Database, RefreshCw, Mail, CheckCircle2, Cpu, Lock, Sparkles, Terminal } from 'lucide-react';
import { motion } from 'motion/react';

export const AdminSettings: React.FC = () => {
  const [isSeeding, setIsSeeding] = useState(false);
  const { addToast, setIsInboxOpen } = useNotifications();

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      const seeded = await seedInitialDataIfEmpty();
      if (seeded) {
        addToast({
          type: 'success',
          title: 'Database Initialized',
          message: 'Default production dataset (Rahul Sharma, Green Residency, Amit Kumar) provisioned.',
        });
      } else {
        addToast({
          type: 'info',
          title: 'Database Populated',
          message: 'Live properties and records already verified in the cloud database.',
        });
      }
    } catch {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to populate database.',
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">System Settings & Infrastructure</h1>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
            Admin Tier
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">Platform configuration, email notification gateways, and database telemetry.</p>
      </div>

      <div className="space-y-6">
        {/* Email Simulation Box */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-slate-900/70 rounded-2xl border border-white/10 p-6 backdrop-blur-xl shadow-xl space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Mail className="w-4 h-4" />
              </div>
              Invitation Gateway & Email Simulator
            </h2>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              Online
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            All landlord onboarding tokens and tenant assignment invitations are processed through our simulated real-time email dispatch pipeline.
            Review outgoing messages, test one-click invitation acceptance links, and verify onboarding workflows.
          </p>
          <div>
            <button
              onClick={() => setIsInboxOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02]"
            >
              <Mail className="w-3.5 h-3.5" />
              Open Live Email Simulator
            </button>
          </div>
        </motion.div>

        {/* Database Utility Box */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-slate-900/70 rounded-2xl border border-white/10 p-6 backdrop-blur-xl shadow-xl space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Database className="w-4 h-4" />
              </div>
              Database Seeding & Benchmark Environment
            </h2>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
              Firestore Cloud
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Quickly provision sample properties (Green Residency, Horizon Heights), realistic units (101, 102, 103), verified landlords (Rahul Sharma),
            and registered tenants (Amit Kumar) if your database has been cleared or freshly deployed.
          </p>
          <div>
            <button
              onClick={handleSeed}
              disabled={isSeeding}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 text-white text-xs font-semibold rounded-xl border border-white/10 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin text-cyan-400' : ''}`} />
              {isSeeding ? 'Seeding Database...' : 'Seed Sample Database Records'}
            </button>
          </div>
        </motion.div>

        {/* Security & Access Architecture */}
        <div className="bg-gradient-to-br from-slate-900/90 to-indigo-950/70 rounded-2xl border border-white/10 p-6 backdrop-blur-xl shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-2.5 text-cyan-400 mb-2">
            <Shield className="w-4 h-4" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider">2026 Security Invariants</span>
          </div>
          <h3 className="text-sm font-bold text-white">Row Level Security & Sandboxed Partitions</h3>
          <ul className="mt-3 space-y-2 text-xs text-slate-300">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Multi-tenant partition isolation: Landlords cannot query properties or tenants outside their domain.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Tenants strictly access assigned units, lease agreements, notices, and payment receipts.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Role-based routing guards prevent unauthorized URL manipulation or deep-link escalation.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
