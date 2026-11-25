import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { getNotices, createNotice, deleteNotice, getProperties } from '../../services/db.ts';
import { Notice, Property } from '../../types/index.ts';
import { Modal } from '../../components/common/Modal.tsx';
import { useNotifications } from '../../context/NotificationContext.tsx';
import { Bell, Plus, Trash2, Calendar, Building2, Send, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export const LandlordNotices: React.FC = () => {
  const { currentUser } = useAuth();
  const { addToast } = useNotifications();

  const [notices, setNotices] = useState<Notice[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [propertyId, setPropertyId] = useState('all');
  const [targetTenants, setTargetTenants] = useState('All');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    if (!currentUser) return;
    try {
      const [nList, pList] = await Promise.all([
        getNotices(currentUser.id),
        getProperties(currentUser.id),
      ]);
      setNotices(nList);
      setProperties(pList);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const chosenProp = properties.find((p) => p.id === propertyId);

    setIsSubmitting(true);
    try {
      await createNotice(
        {
          landlordId: currentUser.id,
          propertyId: propertyId === 'all' ? undefined : propertyId,
          propertyName: chosenProp ? chosenProp.name : 'All Estates',
          title,
          message,
          date,
          expiryDate,
          targetTenants,
        },
        { id: currentUser.id, name: currentUser.fullName, role: currentUser.role }
      );
      addToast({
        type: 'success',
        title: 'Notice Broadcasted',
        message: 'Notice has been published to the tenant resident portals.',
      });
      setIsAddOpen(false);
      setTitle('');
      setMessage('');
      loadData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message || 'Could not send notice.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, nTitle: string) => {
    if (!currentUser) return;
    try {
      await deleteNotice(id, { id: currentUser.id, name: currentUser.fullName, role: currentUser.role });
      addToast({ type: 'info', title: 'Notice Removed', message: `"${nTitle}" deleted.` });
      loadData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message || 'Could not delete notice.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white font-display">Broadcast Notices</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
              {notices.length} Published
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Publish building maintenance schedules, festival advisories, policy updates, and reminders.
          </p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02]"
        >
          <Send className="w-4 h-4" />
          Publish Notice
        </button>
      </div>

      {/* Notices List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12 text-slate-400 font-mono text-xs">
            <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading notice feed...
          </div>
        ) : notices.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-dashed border-white/10 p-8 backdrop-blur-md">
            <Bell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-white">No active notices published</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Broadcast maintenance schedules or announcements to keep residents informed.
            </p>
          </div>
        ) : (
          notices.map((n, idx) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03, duration: 0.2 }}
              className="bg-slate-900/70 rounded-2xl border border-white/10 p-5 backdrop-blur-xl shadow-xl hover:border-cyan-500/30 transition-all flex flex-col sm:flex-row items-start justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                    <Bell className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="font-bold text-white text-base tracking-tight">{n.title}</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-950/60 text-cyan-300 border border-cyan-500/20">
                    {n.propertyName || 'All Estates'}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line pl-9">
                  {n.message}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono pl-9 pt-1">
                  <span>Target: {n.targetTenants || 'All Residents'}</span>
                  <span>·</span>
                  <span>Published: {n.date}</span>
                  {n.expiryDate && (
                    <>
                      <span>·</span>
                      <span className="text-amber-400">Expires: {n.expiryDate}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="shrink-0 flex items-center justify-end w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                <button
                  onClick={() => handleDelete(n.id, n.title)}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                  title="Delete Notice"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Publish Notice Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Broadcast New Notice" subtitle="Announce to all or specific properties" maxWidth="md">
        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Target Property</label>
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-slate-200 focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
            >
              <option value="all">Broadcast to All Properties</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Notice Headline *</label>
            <input
              type="text"
              required
              placeholder="e.g. Scheduled Elevator Maintenance"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-white placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Notice Content *</label>
            <textarea
              rows={4}
              required
              placeholder="Provide detailed timing, instructions, or precautions for residents..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-white placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Publish Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-slate-200 focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Expiry Date</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-slate-200 focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Publishing...' : 'Publish Broadcast'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
