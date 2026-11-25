import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext.tsx';
import { Building2, ShieldCheck, Home, Key, ArrowRight, Lock, Mail, Sparkles } from 'lucide-react';
import { UserRole } from '../../types/index.ts';
import { motion } from 'motion/react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@rentease.com');
  const [password, setPassword] = useState('password123');
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, switchDemoRole } = useAuth();
  const { addToast } = useNotifications();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const success = await login(email, selectedRole);
      if (success) {
        addToast({
          type: 'success',
          title: 'Authentication Verified',
          message: `Authenticated as ${selectedRole.toUpperCase()}. Access granted.`,
        });
        if (selectedRole === 'admin') navigate('/admin/dashboard');
        else if (selectedRole === 'landlord') navigate('/landlord/dashboard');
        else navigate('/tenant/dashboard');
      } else {
        addToast({
          type: 'error',
          title: 'Authentication Denied',
          message: 'Invalid credentials or user record not found.',
        });
      }
    } catch {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Something went wrong. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemo = async (role: UserRole, demoEmail: string) => {
    setSelectedRole(role);
    setEmail(demoEmail);
    await switchDemoRole(role);
    addToast({
      type: 'info',
      title: `Switched to ${role.toUpperCase()} Workspace`,
      message: `Entering ${role} console...`,
    });
    if (role === 'admin') navigate('/admin/dashboard');
    else if (role === 'landlord') navigate('/landlord/dashboard');
    else navigate('/tenant/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#090d16] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden text-slate-100">
      {/* 2026 Background glowing radial orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-500/15 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/15 rounded-full blur-[128px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10"
      >
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-[0_0_25px_rgba(6,182,212,0.4)] mb-4 border border-cyan-300/30">
          <Building2 className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white font-display">
          RentEase
        </h2>
        <p className="mt-1 text-xs text-slate-400 font-sans tracking-wide">
          2026 Autonomous Tenant & Property Management Engine
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0 relative z-10"
      >
        <div className="bg-slate-900/80 backdrop-blur-2xl py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-white/10 relative overflow-hidden">
          {/* Top highlight bar */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

          {/* Quick Demo Access Switcher */}
          <div className="mb-6 p-4 bg-slate-950/70 rounded-2xl border border-white/10">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 block mb-2.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              1-Click Demo Evaluation Switcher
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('admin', 'admin@rentease.com')}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-900/90 border border-white/10 hover:border-cyan-500/50 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-all shadow-sm hover:scale-[1.02]"
              >
                <ShieldCheck className="w-4 h-4 text-cyan-400 mb-1" />
                <span>Admin</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('landlord', 'rahul@example.com')}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-900/90 border border-white/10 hover:border-emerald-500/50 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-all shadow-sm hover:scale-[1.02]"
              >
                <Home className="w-4 h-4 text-emerald-400 mb-1" />
                <span>Landlord</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('tenant', 'amit@example.com')}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-900/90 border border-white/10 hover:border-amber-500/50 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-all shadow-sm hover:scale-[1.02]"
              >
                <Key className="w-4 h-4 text-amber-400 mb-1" />
                <span>Tenant</span>
              </button>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-semibold text-slate-300">Target Role</label>
              <select
                value={selectedRole}
                onChange={(e) => {
                  const r = e.target.value as UserRole;
                  setSelectedRole(r);
                  if (r === 'admin') setEmail('admin@rentease.com');
                  else if (r === 'landlord') setEmail('rahul@example.com');
                  else setEmail('amit@example.com');
                }}
                className="mt-1 block w-full px-3 py-2.5 bg-slate-950/80 border border-white/15 rounded-xl text-xs font-medium focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 text-white outline-hidden"
              >
                <option value="admin">Platform Administrator (admin@rentease.com)</option>
                <option value="landlord">Property Landlord (rahul@example.com)</option>
                <option value="tenant">Verified Tenant (amit@example.com)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300">Email Address</label>
              <div className="mt-1 relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-white/15 rounded-xl text-xs text-white focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 outline-hidden font-mono"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300">Password</label>
              <div className="mt-1 relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-white/15 rounded-xl text-xs text-white focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 outline-hidden font-mono"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50 hover:scale-[1.01]"
              >
                {isSubmitting ? 'Authenticating...' : 'Enter Workspace Console'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center text-xs text-slate-400">
            Have an invitation token? Use the direct link or open the simulated email inbox.
          </div>
        </div>
      </motion.div>
    </div>
  );
};
