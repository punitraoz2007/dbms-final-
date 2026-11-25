import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useNotifications } from '../../context/NotificationContext.tsx';
import { User, Phone, Mail, MapPin, CheckCircle2, Shield, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export const TenantProfile: React.FC = () => {
  const { currentUser, updateCurrentProfile } = useAuth();
  const { addToast } = useNotifications();

  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [city, setCity] = useState(currentUser?.city || '');
  const [address, setAddress] = useState(currentUser?.address || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.fullName);
      setPhone(currentUser.phone || '');
      setCity(currentUser.city || '');
      setAddress(currentUser.address || '');
    }
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateCurrentProfile({
        fullName,
        phone,
        city,
        address,
      });
      addToast({
        type: 'success',
        title: 'Profile Updated',
        message: 'Your personal information was updated successfully.',
      });
    } catch {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Could not update profile.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">My Resident Profile</h1>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
            Verified Resident
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Keep your contact information and emergency details up to date with your property landlord.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/70 rounded-2xl border border-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-xl"
      >
        <div className="flex items-center gap-4 pb-6 border-b border-white/10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold text-xl flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.35)]">
            {fullName ? fullName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">{fullName}</h2>
            <p className="text-xs text-cyan-400 font-mono">{currentUser?.email}</p>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active Resident Account
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Full Legal Name *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-white focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Email Address (Login ID)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                disabled
                value={currentUser?.email || ''}
                className="w-full pl-9 pr-3 py-2 bg-slate-950/40 border border-white/5 rounded-xl text-xs text-slate-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Phone Number *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-white font-mono focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-white focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Current Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-white focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
