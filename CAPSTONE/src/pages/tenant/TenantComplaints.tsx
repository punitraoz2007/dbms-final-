import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { getComplaints, createComplaint, getTenantById, getPropertyById, getUnitById } from '../../services/db.ts';
import { Complaint, ComplaintCategory, ComplaintPriority, Tenant, Property, Unit } from '../../types/index.ts';
import { Badge, getStatusBadgeVariant } from '../../components/common/Badge.tsx';
import { Modal } from '../../components/common/Modal.tsx';
import { useNotifications } from '../../context/NotificationContext.tsx';
import { AlertCircle, Plus, Clock, Wrench, CheckCircle2, Sparkles, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';

export const TenantComplaints: React.FC = () => {
  const { currentUser } = useAuth();
  const { addToast } = useNotifications();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isRaiseOpen, setIsRaiseOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ComplaintCategory>('Plumbing');
  const [priority, setPriority] = useState<ComplaintPriority>('Medium');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    if (!currentUser) return;
    try {
      const tenantId = currentUser.tenantRecordId || currentUser.id;
      const [t, cmpList] = await Promise.all([getTenantById(tenantId), getComplaints(undefined, tenantId)]);
      setComplaints(cmpList);
      if (t) {
        setTenant(t);
        const [p, u] = await Promise.all([getPropertyById(t.propertyId), getUnitById(t.unitId)]);
        setProperty(p);
        setUnit(u);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleRaiseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !tenant) return;

    setIsSubmitting(true);
    try {
      await createComplaint(
        {
          landlordId: tenant.landlordId,
          tenantId: tenant.id,
          tenantName: tenant.fullName,
          propertyId: tenant.propertyId,
          propertyName: property ? property.name : 'Estate',
          unitId: tenant.unitId,
          unitNumber: unit ? unit.unitNumber : '101',
          title,
          description,
          category,
          priority,
        },
        { id: currentUser.id, name: currentUser.fullName, role: currentUser.role }
      );
      addToast({
        type: 'success',
        title: 'Maintenance Ticket Submitted',
        message: 'Your ticket has been routed to your landlord for inspection.',
      });
      setIsRaiseOpen(false);
      setTitle('');
      setDescription('');
      loadData();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Submission Error',
        message: err.message || 'Could not submit complaint.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white font-display">Maintenance & Service Desk</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
              Direct Landlord Route
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Submit service requests for plumbing, electrical, appliance issues, or building maintenance.
          </p>
        </div>
        <button
          onClick={() => setIsRaiseOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          Raise Request
        </button>
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12 text-slate-400 font-mono text-xs">
            <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading maintenance history...
          </div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-dashed border-white/10 p-8 backdrop-blur-md">
            <CheckCircle2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-white">No active maintenance tickets</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
              Everything in your suite appears to be in working condition. Use "Raise Request" if you experience any issue.
            </p>
          </div>
        ) : (
          complaints.map((c, idx) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03, duration: 0.2 }}
              className="bg-slate-900/70 rounded-2xl border border-white/10 p-5 backdrop-blur-xl shadow-xl hover:border-cyan-500/30 transition-all space-y-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-sm tracking-tight">{c.title}</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-950/60 text-slate-400 border border-white/5 uppercase">
                    {c.category}
                  </span>
                </div>
                <div className="flex items-center gap-2">
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
                  <Badge variant={getStatusBadgeVariant(c.status)}>{c.status}</Badge>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{c.description}</p>

              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono pt-1 border-t border-white/5">
                <span>Submitted: {new Date(c.createdAt).toLocaleDateString([], { dateStyle: 'medium' })}</span>
                <span>·</span>
                <span>
                  Unit {c.unitNumber} ({c.propertyName})
                </span>
              </div>

              {c.resolutionNotes && (
                <div className="mt-2 p-3 bg-slate-950/70 rounded-xl border border-white/5 text-[11px] text-emerald-300">
                  <span className="font-semibold text-slate-400 font-mono block">Landlord Resolution Notes:</span>
                  {c.resolutionNotes}
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* Raise Request Modal */}
      <Modal isOpen={isRaiseOpen} onClose={() => setIsRaiseOpen(false)} title="Submit Maintenance Ticket" subtitle={`Unit ${unit?.unitNumber || '101'} · ${property?.name || 'Complex'}`} maxWidth="md">
        <form onSubmit={handleRaiseSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Issue Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Bathroom sink water faucet leaking"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-white placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-slate-200 focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
              >
                <option value="Plumbing">Plumbing</option>
                <option value="Electrical">Electrical</option>
                <option value="Carpentry">Carpentry</option>
                <option value="Appliance">Appliance</option>
                <option value="Noise / Disturbance">Noise / Disturbance</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as ComplaintPriority)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-slate-200 focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
              >
                <option value="Low">Low (General)</option>
                <option value="Medium">Medium (Attention required)</option>
                <option value="High">High (Urgent / Emergency)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Detailed Description *</label>
            <textarea
              rows={4}
              required
              placeholder="Describe the issue, when it started, and if any temporary measures were taken..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-white placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
            />
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsRaiseOpen(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Routing...' : 'Submit Ticket'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
