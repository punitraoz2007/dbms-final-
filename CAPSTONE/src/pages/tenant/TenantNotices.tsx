import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { getNotices, getTenantById } from '../../services/db.ts';
import { Notice } from '../../types/index.ts';
import { Bell, Calendar, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export const TenantNotices: React.FC = () => {
  const { currentUser } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!currentUser) return;
      try {
        const tenantId = currentUser.tenantRecordId || currentUser.id;
        const t = await getTenantById(tenantId);
        if (t) {
          const list = await getNotices(t.landlordId, t.propertyId);
          setNotices(list);
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
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">Building Notices & Circulars</h1>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
            Verified Announcements
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">Official announcements and maintenance bulletins from management.</p>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12 text-slate-400 font-mono text-xs">
            <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading notice feed...
          </div>
        ) : notices.length === 0 ? (
          <div className="bg-slate-900/40 rounded-2xl border border-dashed border-white/10 p-12 text-center text-xs text-slate-400 backdrop-blur-md">
            <Bell className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="font-semibold text-white">No active notices</p>
            <p className="text-slate-500 mt-0.5">There are currently no circulars or announcements posted for your building.</p>
          </div>
        ) : (
          notices.map((n, idx) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04, duration: 0.2 }}
              className="bg-slate-900/70 rounded-2xl border border-white/10 p-6 backdrop-blur-xl shadow-xl hover:border-cyan-500/30 transition-all space-y-3"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-mono font-semibold text-cyan-300 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/25">
                  {n.propertyName || 'Building Notice'}
                </span>
                <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  {n.date}
                </span>
              </div>

              <h3 className="text-base font-bold text-white tracking-tight">{n.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{n.message}</p>

              {n.expiryDate && (
                <div className="pt-2 border-t border-white/5 text-[11px] font-mono text-slate-400 flex items-center gap-2">
                  <span>Advisory active until:</span>
                  <span className="text-amber-400 font-semibold">{n.expiryDate}</span>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
