import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { getComplaints, updateComplaintStatus } from '../../services/db.ts';
import { Complaint, ComplaintStatus } from '../../types/index.ts';
import { Badge, getStatusBadgeVariant } from '../../components/common/Badge.tsx';
import { Modal } from '../../components/common/Modal.tsx';
import { useNotifications } from '../../context/NotificationContext.tsx';
import { AlertCircle, Search, CheckCircle2, Clock, Wrench, Shield, MessageSquare, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export const LandlordComplaints: React.FC = () => {
  const { currentUser } = useAuth();
  const { addToast } = useNotifications();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Updating modal
  const [updatingComplaint, setUpdatingComplaint] = useState<Complaint | null>(null);
  const [newStatus, setNewStatus] = useState<ComplaintStatus>('In Progress');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    if (!currentUser) return;
    try {
      const list = await getComplaints(currentUser.id);
      setComplaints(list);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !updatingComplaint) return;
    setIsSubmitting(true);
    try {
      await updateComplaintStatus(
        updatingComplaint.id,
        newStatus,
        resolutionNotes,
        { id: currentUser.id, name: currentUser.fullName, role: currentUser.role }
      );
      addToast({
        type: 'success',
        title: 'Status Updated',
        message: `Complaint marked as "${newStatus}".`,
      });
      setUpdatingComplaint(null);
      loadData();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'Could not update complaint.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openUpdate = (c: Complaint) => {
    setUpdatingComplaint(c);
    setNewStatus(c.status);
    setResolutionNotes(c.resolutionNotes || '');
  };

  const filtered = complaints.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.propertyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.unitNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white font-display">Maintenance & Complaints</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
              {complaints.filter((c) => c.status !== 'Resolved').length} Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Review, dispatch maintenance contractors, and resolve tickets raised by your tenants.
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-slate-900/70 p-4 rounded-2xl border border-white/10 shadow-lg backdrop-blur-xl flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search by title, tenant, unit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 bg-slate-950/70 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950/70 border border-white/10 rounded-xl text-xs font-medium text-slate-200 focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
            >
              <option value="all">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-medium">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950/70 border border-white/10 rounded-xl text-xs font-medium text-slate-200 focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
            >
              <option value="all">All Categories</option>
              <option value="Plumbing">Plumbing</option>
              <option value="Electrical">Electrical</option>
              <option value="Carpentry">Carpentry</option>
              <option value="Appliance">Appliance</option>
              <option value="Noise / Disturbance">Noise</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Complaints List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12 text-slate-400 font-mono text-xs">
            <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading maintenance queue...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-dashed border-white/10 p-8 backdrop-blur-md">
            <CheckCircle2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-white">No maintenance tickets found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              All resident issues have been addressed or match no current criteria.
            </p>
          </div>
        ) : (
          filtered.map((c, idx) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03, duration: 0.2 }}
              className="bg-slate-900/70 rounded-2xl border border-white/10 p-5 backdrop-blur-xl shadow-xl hover:border-cyan-500/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-white text-sm tracking-tight">{c.title}</span>
                  <Badge variant={getStatusBadgeVariant(c.status)}>{c.status}</Badge>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-950/60 text-slate-400 border border-white/5 uppercase">
                    {c.category}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                      c.priority === 'High'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : c.priority === 'Medium'
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                        : 'bg-slate-800 text-slate-400 border-white/5'
                    }`}
                  >
                    {c.priority} Priority
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{c.description}</p>

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono pt-1">
                  <span>
                    Resident: <strong className="text-slate-200">{c.tenantName}</strong>
                  </span>
                  <span>·</span>
                  <span>
                    {c.propertyName} (Unit {c.unitNumber})
                  </span>
                  <span>·</span>
                  <span>Reported: {new Date(c.createdAt).toLocaleDateString([], { dateStyle: 'medium' })}</span>
                </div>

                {c.resolutionNotes && (
                  <div className="mt-2 p-2.5 bg-slate-950/70 rounded-xl border border-white/5 text-[11px] text-emerald-300">
                    <span className="font-semibold text-slate-400 font-mono block">Landlord Resolution Notes:</span>
                    {c.resolutionNotes}
                  </div>
                )}
              </div>

              <div className="shrink-0 flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                <button
                  onClick={() => openUpdate(c)}
                  className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-cyan-500/20 transition-all"
                >
                  Update Status
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Update Complaint Modal */}
      <Modal isOpen={!!updatingComplaint} onClose={() => setUpdatingComplaint(null)} title="Update Ticket Status" subtitle={`Ticket: ${updatingComplaint?.title}`} maxWidth="md">
        <form onSubmit={handleUpdateSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Status</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as ComplaintStatus)}
              className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-slate-200 focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
            >
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Resolution / Action Notes</label>
            <textarea
              rows={3}
              placeholder="e.g. Plumber dispatched on 3rd Oct. Leaking pipe replaced."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-white placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
            />
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setUpdatingComplaint(null)}
              className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Updating...' : 'Save Status'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
