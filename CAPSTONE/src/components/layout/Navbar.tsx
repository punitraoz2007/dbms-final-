import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useNotifications } from '../../context/NotificationContext.tsx';
import { UserRole } from '../../types/index.ts';
import { Building2, Mail, LogOut, Menu, ShieldCheck, Home, Key, Sparkles, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { currentUser, switchDemoRole, logout } = useAuth();
  const { simulatedEmails, setIsInboxOpen } = useNotifications();
  const navigate = useNavigate();

  const handleRoleSwitch = async (role: UserRole) => {
    await switchDemoRole(role);
    if (role === 'admin') navigate('/admin/dashboard');
    else if (role === 'landlord') navigate('/landlord/dashboard');
    else if (role === 'tenant') navigate('/tenant/dashboard');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roles: { id: UserRole; label: string; icon: any }[] = [
    { id: 'admin', label: 'Admin', icon: ShieldCheck },
    { id: 'landlord', label: 'Landlord', icon: Home },
    { id: 'tenant', label: 'Tenant', icon: Key },
  ];

  return (
    <header className="h-16 bg-slate-900/80 border-b border-white/10 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between backdrop-blur-xl">
      {/* Left: Mobile menu & Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-transform group-hover:scale-105">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="absolute -inset-0.5 rounded-xl bg-cyan-400 opacity-20 blur-sm pointer-events-none group-hover:opacity-40 transition-opacity" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-lg tracking-tight font-display">
                RentEase
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                2026 Engine
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-slate-400 -mt-0.5 font-sans">
              Autonomous Rental Infrastructure
            </p>
          </div>
        </div>
      </div>

      {/* Middle: 2026 Animated Sliding Role Switcher */}
      <div className="hidden md:flex items-center bg-slate-950/60 p-1 rounded-xl border border-white/10 relative">
        <span className="text-[11px] font-semibold text-slate-400 px-2.5 py-1">
          Role Switch:
        </span>
        {roles.map((r) => {
          const Icon = r.icon;
          const isActive = currentUser?.role === r.id;
          return (
            <button
              key={r.id}
              onClick={() => handleRoleSwitch(r.id)}
              className={`relative z-10 flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="active-role-pill"
                  transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                  className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg -z-10 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                />
              )}
              <Icon className="w-3.5 h-3.5" />
              <span>{r.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right: Simulated Email Inbox + User Profile + Logout */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Simulated Email Inbox Trigger with 2026 Glow */}
        <button
          onClick={() => setIsInboxOpen(true)}
          className="relative p-2 text-slate-300 hover:text-cyan-300 hover:bg-slate-800/80 rounded-xl border border-white/10 transition-all flex items-center gap-1.5 group"
          title="Open Simulated Email Inbox"
        >
          <Mail className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline text-xs font-medium text-slate-300">Email Simulator</span>
          {simulatedEmails.length > 0 && (
            <span className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(6,182,212,0.5)]">
              {simulatedEmails.length}
            </span>
          )}
        </button>

        {/* User Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-white/10">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-300 font-bold text-xs flex items-center justify-center">
            {currentUser?.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-semibold text-white leading-tight truncate max-w-[120px]">
              {currentUser?.fullName}
            </p>
            <p className="text-[10px] text-cyan-400 capitalize font-mono">{currentUser?.role}</p>
          </div>

          <button
            onClick={handleLogout}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors ml-1"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
