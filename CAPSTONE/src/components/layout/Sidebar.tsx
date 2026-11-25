import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  LayoutDashboard,
  Users,
  Building2,
  Home,
  DoorOpen,
  FileText,
  CreditCard,
  AlertCircle,
  Bell,
  Activity,
  MailCheck,
  Settings,
  LogOut,
  UserCheck,
  X,
  Sparkles,
} from 'lucide-react';
import { motion } from 'motion/react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const role = currentUser?.role || 'admin';

  // Navigation Items per role
  const adminLinks = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/landlords', label: 'Landlords', icon: Users },
    { to: '/admin/properties', label: 'Properties', icon: Building2 },
    { to: '/admin/tenants', label: 'Tenants', icon: UserCheck },
    { to: '/admin/invitations', label: 'Invitations', icon: MailCheck },
    { to: '/admin/activity', label: 'Activity Log', icon: Activity },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  const landlordLinks = [
    { to: '/landlord/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/landlord/properties', label: 'Properties', icon: Building2 },
    { to: '/landlord/units', label: 'Units', icon: DoorOpen },
    { to: '/landlord/tenants', label: 'Tenants & Invites', icon: Users },
    { to: '/landlord/leases', label: 'Leases', icon: FileText },
    { to: '/landlord/payments', label: 'Rent & Payments', icon: CreditCard },
    { to: '/landlord/complaints', label: 'Complaints', icon: AlertCircle },
    { to: '/landlord/notices', label: 'Notices', icon: Bell },
  ];

  const tenantLinks = [
    { to: '/tenant/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/tenant/lease', label: 'My Lease', icon: FileText },
    { to: '/tenant/payments', label: 'Rent & Payments', icon: CreditCard },
    { to: '/tenant/complaints', label: 'Maintenance Requests', icon: AlertCircle },
    { to: '/tenant/notices', label: 'Notices', icon: Bell },
    { to: '/tenant/profile', label: 'My Profile', icon: UserCheck },
  ];

  const links = role === 'admin' ? adminLinks : role === 'landlord' ? landlordLinks : tenantLinks;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 lg:hidden backdrop-blur-md transition-opacity"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900/90 border-r border-white/10 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-0 backdrop-blur-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand in sidebar for mobile view */}
        <div className="h-16 px-6 border-b border-white/10 flex items-center justify-between lg:hidden">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-cyan-400" />
            <span className="font-bold text-white text-base">RentEase</span>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Role Banner */}
        <div className="p-4 mx-3 mt-3 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/90 border border-white/10 shadow-lg relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-cyan-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-cyan-500/20 transition-all" />
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-cyan-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            Active Session
          </span>
          <p className="text-sm font-bold text-white capitalize mt-1 tracking-tight">{role} Workspace</p>
          <p className="text-xs text-slate-400 truncate mt-0.5 font-mono">{currentUser?.email}</p>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onClose}
                className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav-glow"
                    transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                    className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                  />
                )}
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-cyan-400' : 'text-slate-400'
                  }`}
                />
                <span className="relative z-10">{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom sign out */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
