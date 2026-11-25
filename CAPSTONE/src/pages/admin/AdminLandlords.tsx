import React, { useState, useEffect } from 'react';
import { getLandlords, createLandlord, updateLandlord, getInvitations } from '../../services/db.ts';
import { Landlord, Invitation } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useNotifications } from '../../context/NotificationContext.tsx';
import { Badge, getStatusBadgeVariant } from '../../components/common/Badge.tsx';
import { Modal } from '../../components/common/Modal.tsx';
import { Search, Plus, Edit2, ShieldAlert, ShieldCheck, Mail, Phone, MapPin, Send } from 'lucide-react';
import { motion } from 'motion/react';

export const AdminLandlords: React.FC = () => {
  const [landlords, setLandlords] = useState<Landlord[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingLandlord, setEditingLandlord] = useState<Landlord | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<'active' | 'disabled'>('active');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { currentUser } = useAuth();
  const { addToast, addSimulatedEmail } = useNotifications();

  const loadData = async () => {
    try {
      const [llList, invList] = await Promise.all([getLandlords(), getInvitations('landlord')]);
      setLandlords(llList);
      setInvitations(invList);
    } catch (err) {
      console.error('Error fetching landlords:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSubmitting(true);
    try {
      const newLandlord = await createLandlord(
        {
          fullName,
          email,
          phone,
          city,
          address,
          status,
        },
        { id: currentUser.id, name: currentUser.fullName, role: currentUser.role }
      );

      const invs = await getInvitations('landlord');
      const matchedInv = invs.find((i) => i.email.toLowerCase() === email.toLowerCase());

      if (matchedInv) {
        addSimulatedEmail({
          recipientEmail: email,
          recipientName: fullName,
          subject: 'RentEase - Landlord Account Invitation',
          invitationToken: matchedInv.token,
          invitationType: 'landlord',
        });
      }

      addToast({
        type: 'success',
        title: 'Landlord Created & Invitation Sent',
        message: `Invitation email dispatched to ${email}.`,
      });

      setIsAddOpen(false);
      resetForm();
      loadData();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Creation Failed',
        message: err.message || 'Could not create landlord.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !editingLandlord) return;
    setIsSubmitting(true);
    try {
      await updateLandlord(
        editingLandlord.id,
        {
          fullName,
          phone,
          city,
          address,
          status,
        },
        { id: currentUser.id, name: currentUser.fullName, role: currentUser.role }
      );

      addToast({
        type: 'success',
        title: 'Landlord Updated',
        message: `Updated profile for ${fullName}.`,
      });

      setEditingLandlord(null);
      resetForm();
      loadData();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: err.message || 'Could not update landlord.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (landlord: Landlord) => {
    if (!currentUser) return;
    const newStatus = landlord.status === 'active' ? 'disabled' : 'active';
    try {
      await updateLandlord(
        landlord.id,
        { status: newStatus },
        { id: currentUser.id, name: currentUser.fullName, role: currentUser.role }
      );
      addToast({
        type: 'info',
        title: `Landlord ${newStatus === 'active' ? 'Activated' : 'Disabled'}`,
        message: `${landlord.fullName} status updated.`,
      });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPhone('');
    setCity('');
    setAddress('');
    setStatus('active');
  };

  const openEditModal = (ll: Landlord) => {
    setEditingLandlord(ll);
    setFullName(ll.fullName);
    setEmail(ll.email);
    setPhone(ll.phone);
    setCity(ll.city);
    setAddress(ll.address);
    setStatus(ll.status);
  };

  const filteredLandlords = landlords.filter((ll) => {
    const matchesSearch =
      ll.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ll.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ll.phone.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ll.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">Landlords Directory</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage verified landlords, issue cryptographic invitations, and configure access permissions.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsAddOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          Add Landlord
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/70 p-4 rounded-2xl border border-white/10 shadow-lg backdrop-blur-xl flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 bg-slate-950/70 border border-white/10 rounded-xl text-xs text-white focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-950/70 border border-white/10 rounded-xl text-xs text-slate-200 font-medium focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="disabled">Disabled Only</option>
          </select>
        </div>
      </div>

      {/* Landlords Table */}
      <div className="bg-slate-900/70 rounded-2xl border border-white/10 shadow-xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/5 text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider font-mono text-[10px]">
              <tr>
                <th className="py-3.5 px-6">Landlord Details</th>
                <th className="py-3.5 px-6">Contact</th>
                <th className="py-3.5 px-6">Location</th>
                <th className="py-3.5 px-6">Account Status</th>
                <th className="py-3.5 px-6">Invitation</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filteredLandlords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No landlords found matching your search.
                  </td>
                </tr>
              ) : (
                filteredLandlords.map((ll) => {
                  const inv = invitations.find((i) => i.email.toLowerCase() === ll.email.toLowerCase());
                  return (
                    <tr key={ll.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-white text-sm">{ll.fullName}</div>
                        <div className="text-slate-500 font-mono text-[11px] mt-0.5">ID: {ll.id}</div>
                      </td>
                      <td className="py-4 px-6 space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Mail className="w-3.5 h-3.5 text-slate-500" />
                          <span className="font-mono">{ll.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                          <span className="font-mono">{ll.phone}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5 text-slate-200 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          <span>{ll.city}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate max-w-xs">{ll.address}</p>
                      </td>
                      <td className="py-4 px-6">
                        <Badge variant={getStatusBadgeVariant(ll.status)}>{ll.status.toUpperCase()}</Badge>
                      </td>
                      <td className="py-4 px-6">
                        {inv ? (
                          <Badge variant={getStatusBadgeVariant(inv.status)}>{inv.status}</Badge>
                        ) : (
                          <span className="text-slate-500 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(ll)}
                          className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Edit Landlord"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleStatus(ll)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            ll.status === 'active'
                              ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'
                              : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10'
                          }`}
                          title={ll.status === 'active' ? 'Disable Account' : 'Activate Account'}
                        >
                          {ll.status === 'active' ? (
                            <ShieldAlert className="w-4 h-4" />
                          ) : (
                            <ShieldCheck className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Landlord Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add New Landlord"
        subtitle="This will register the landlord record and dispatch an onboarding invitation email."
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full px-3 py-2.5 bg-slate-950/80 border border-white/15 rounded-xl text-white focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="landlord@example.com"
              className="w-full px-3 py-2.5 bg-slate-950/80 border border-white/15 rounded-xl text-white focus:ring-2 focus:ring-cyan-500/50 outline-hidden font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Phone Number</label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-3 py-2.5 bg-slate-950/80 border border-white/15 rounded-xl text-white focus:ring-2 focus:ring-cyan-500/50 outline-hidden font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">City</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Bengaluru"
                className="w-full px-3 py-2.5 bg-slate-950/80 border border-white/15 rounded-xl text-white focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-slate-950/80 border border-white/15 rounded-xl text-white focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
              >
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Office / Address</label>
            <textarea
              rows={2}
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street address, building, landmark..."
              className="w-full px-3 py-2.5 bg-slate-950/80 border border-white/15 rounded-xl text-white focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 border border-white/15 rounded-xl font-semibold text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-cyan-500/25"
            >
              <Send className="w-3.5 h-3.5" />
              {isSubmitting ? 'Sending...' : 'Send Landlord Invitation'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Landlord Modal */}
      <Modal
        isOpen={!!editingLandlord}
        onClose={() => setEditingLandlord(null)}
        title="Edit Landlord Profile"
        subtitle={`Update account profile for ${editingLandlord?.fullName}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950/80 border border-white/15 rounded-xl text-white focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Email</label>
            <input
              type="email"
              disabled
              value={email}
              className="w-full px-3 py-2.5 bg-slate-950/40 border border-white/5 rounded-xl text-slate-500 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Phone Number</label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950/80 border border-white/15 rounded-xl text-white focus:ring-2 focus:ring-cyan-500/50 outline-hidden font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">City</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950/80 border border-white/15 rounded-xl text-white focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-slate-950/80 border border-white/15 rounded-xl text-white focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
              >
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Address</label>
            <textarea
              rows={2}
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950/80 border border-white/15 rounded-xl text-white focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => setEditingLandlord(null)}
              className="px-4 py-2 border border-white/15 rounded-xl font-semibold text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50 shadow-md shadow-cyan-500/25"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
