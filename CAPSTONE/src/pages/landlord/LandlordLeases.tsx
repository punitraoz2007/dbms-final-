import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { getLeases, updateLease, getProperties, getUnits, getTenants, createLease } from '../../services/db.ts';
import { Lease, LeaseStatus, Property, Unit, Tenant } from '../../types/index.ts';
import { Badge, getStatusBadgeVariant } from '../../components/common/Badge.tsx';
import { Modal } from '../../components/common/Modal.tsx';
import { useNotifications } from '../../context/NotificationContext.tsx';
import { FileText, Search, Plus, Calendar, AlertOctagon, CheckCircle, Edit, Eye, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export const LandlordLeases: React.FC = () => {
  const { currentUser } = useAuth();
  const { addToast } = useNotifications();

  const [leases, setLeases] = useState<Lease[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewingLease, setViewingLease] = useState<Lease | null>(null);
  const [editingLease, setEditingLease] = useState<Lease | null>(null);
  const [terminatingLease, setTerminatingLease] = useState<Lease | null>(null);

  // Add form fields
  const [tenantId, setTenantId] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [monthlyRent, setMonthlyRent] = useState(20000);
  const [securityDeposit, setSecurityDeposit] = useState(40000);
  const [status, setStatus] = useState<LeaseStatus>('Active');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    if (!currentUser) return;
    try {
      const [lList, pList, uList, tList] = await Promise.all([
        getLeases(currentUser.id),
        getProperties(currentUser.id),
        getUnits(undefined, currentUser.id),
        getTenants(currentUser.id),
      ]);
      setLeases(lList);
      setProperties(pList);
      setUnits(uList);
      setTenants(tList);

      if (tList.length > 0 && !tenantId) setTenantId(tList[0].id);
      if (pList.length > 0 && !propertyId) setPropertyId(pList[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  // When property changes in add form, update units
  useEffect(() => {
    if (propertyId) {
      const propUnits = units.filter((u) => u.propertyId === propertyId);
      if (propUnits.length > 0) {
        setUnitId(propUnits[0].id);
        setMonthlyRent(propUnits[0].monthlyRent);
        setSecurityDeposit(propUnits[0].securityDeposit);
      }
    }
  }, [propertyId, units]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const chosenTenant = tenants.find((t) => t.id === tenantId);
    const chosenProperty = properties.find((p) => p.id === propertyId);
    const chosenUnit = units.find((u) => u.id === unitId);

    if (!chosenTenant || !chosenProperty || !chosenUnit) {
      addToast({ type: 'error', title: 'Error', message: 'Please select tenant, property and unit.' });
      return;
    }

    setIsSubmitting(true);
    try {
      await createLease(
        {
          landlordId: currentUser.id,
          tenantId,
          tenantName: chosenTenant.fullName,
          propertyId,
          propertyName: chosenProperty.name,
          unitId,
          unitNumber: chosenUnit.unitNumber,
          startDate,
          endDate,
          monthlyRent: Number(monthlyRent),
          securityDeposit: Number(securityDeposit),
          status,
        },
        { id: currentUser.id, name: currentUser.fullName, role: currentUser.role }
      );
      addToast({
        type: 'success',
        title: 'Lease Created',
        message: `Active lease created for ${chosenTenant.fullName}.`,
      });
      setIsAddOpen(false);
      loadData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message || 'Could not create lease.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !editingLease) return;
    setIsSubmitting(true);
    try {
      await updateLease(
        editingLease.id,
        {
          startDate,
          endDate,
          monthlyRent: Number(monthlyRent),
          securityDeposit: Number(securityDeposit),
          status,
        },
        { id: currentUser.id, name: currentUser.fullName, role: currentUser.role }
      );
      addToast({ type: 'success', title: 'Lease Updated', message: 'Changes committed successfully.' });
      setEditingLease(null);
      loadData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message || 'Could not update lease.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTerminate = async () => {
    if (!currentUser || !terminatingLease) return;
    setIsSubmitting(true);
    try {
      await updateLease(
        terminatingLease.id,
        { status: 'Terminated' },
        { id: currentUser.id, name: currentUser.fullName, role: currentUser.role }
      );
      addToast({
        type: 'info',
        title: 'Lease Terminated',
        message: `Lease for ${terminatingLease.tenantName} set to Terminated.`,
      });
      setTerminatingLease(null);
      loadData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message || 'Could not terminate lease.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (l: Lease) => {
    setEditingLease(l);
    setStartDate(l.startDate);
    setEndDate(l.endDate);
    setMonthlyRent(l.monthlyRent);
    setSecurityDeposit(l.securityDeposit);
    setStatus(l.status);
  };

  const filtered = leases.filter((l) => {
    const matchesSearch =
      l.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.propertyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.unitNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white font-display">Lease Management</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
              {leases.length} Contracts
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Maintain legal tenancy agreements, terms, security deposits, and contract renewals.
          </p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          disabled={tenants.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Create Lease Agreement
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-slate-900/70 p-4 rounded-2xl border border-white/10 shadow-lg backdrop-blur-xl flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search tenant, property, or unit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 bg-slate-950/70 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950/70 border border-white/10 rounded-xl text-xs font-medium text-slate-200 focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
          >
            <option value="all">All Agreements</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Expired">Expired</option>
            <option value="Terminated">Terminated</option>
          </select>
        </div>
      </div>

      {/* Leases Table */}
      <div className="bg-slate-900/70 rounded-2xl border border-white/10 shadow-xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/5 text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider font-mono text-[10px]">
              <tr>
                <th className="py-3.5 px-6">Tenant Resident</th>
                <th className="py-3.5 px-6">Property & Unit</th>
                <th className="py-3.5 px-6">Monthly Rent</th>
                <th className="py-3.5 px-6">Deposit</th>
                <th className="py-3.5 px-6">Term Period</th>
                <th className="py-3.5 px-6">Contract Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-mono">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                      <span>Loading leases...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No lease agreements found.
                  </td>
                </tr>
              ) : (
                filtered.map((lease, idx) => (
                  <motion.tr
                    key={lease.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02, duration: 0.2 }}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="font-semibold text-white text-sm flex items-center gap-2">
                        <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>{lease.tenantName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-white">{lease.propertyName}</div>
                      <div className="text-cyan-400 font-mono">Unit {lease.unitNumber}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-emerald-400 font-mono text-sm">
                        ₹{lease.monthlyRent.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono"> /mo</span>
                    </td>
                    <td className="py-4 px-6 font-mono text-slate-200">
                      ₹{lease.securityDeposit.toLocaleString()}
                    </td>
                    <td className="py-4 px-6 font-mono text-[11px] text-slate-400">
                      <div>{lease.startDate}</div>
                      <div className="text-slate-500">to {lease.endDate}</div>
                    </td>
                    <td className="py-4 px-6">
                      <Badge variant={getStatusBadgeVariant(lease.status)}>{lease.status}</Badge>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingLease(lease)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                          title="View Lease Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEdit(lease)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                          title="Edit Agreement"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {lease.status === 'Active' && (
                          <button
                            onClick={() => setTerminatingLease(lease)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                            title="Terminate Agreement"
                          >
                            <AlertOctagon className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Lease Modal */}
      <Modal isOpen={!!viewingLease} onClose={() => setViewingLease(null)} title="Lease Agreement Summary" subtitle={`Contract Reference: ${viewingLease?.id}`} maxWidth="md">
        {viewingLease && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-950/70 rounded-xl border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Tenant:</span>
                <span className="font-bold text-white text-sm">{viewingLease.tenantName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Property / Unit:</span>
                <span className="font-semibold text-cyan-400">
                  {viewingLease.propertyName} · Unit {viewingLease.unitNumber}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Agreement Period:</span>
                <span className="font-mono text-slate-200">
                  {viewingLease.startDate} to {viewingLease.endDate}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Monthly Rent:</span>
                <span className="font-bold text-emerald-400 font-mono text-sm">
                  ₹{viewingLease.monthlyRent.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Security Deposit:</span>
                <span className="font-mono text-slate-200">₹{viewingLease.securityDeposit.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <span className="text-slate-400">Agreement Status:</span>
                <Badge variant={getStatusBadgeVariant(viewingLease.status)}>{viewingLease.status}</Badge>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setViewingLease(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-xl hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Lease Modal */}
      <Modal isOpen={!!editingLease} onClose={() => setEditingLease(null)} title="Update Lease Parameters" subtitle={`Tenant: ${editingLease?.tenantName}`} maxWidth="md">
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-slate-200 focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">End Date</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-slate-200 focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Monthly Rent (₹)</label>
              <input
                type="number"
                required
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-white font-mono focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Security Deposit (₹)</label>
              <input
                type="number"
                required
                value={securityDeposit}
                onChange={(e) => setSecurityDeposit(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-white font-mono focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Agreement Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as LeaseStatus)}
              className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-slate-200 focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
            >
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Expired">Expired</option>
              <option value="Terminated">Terminated</option>
            </select>
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditingLease(null)}
              className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Agreement'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Terminate Modal */}
      <Modal isOpen={!!terminatingLease} onClose={() => setTerminatingLease(null)} title="Terminate Lease Agreement" subtitle={`Tenant: ${terminatingLease?.tenantName}`} maxWidth="sm">
        <div className="space-y-4 text-xs">
          <p className="text-slate-300 leading-relaxed">
            Are you sure you want to terminate the active agreement for <strong className="text-white font-semibold">{terminatingLease?.tenantName}</strong> (Unit {terminatingLease?.unitNumber})?
          </p>
          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setTerminatingLease(null)}
              className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleTerminate}
              disabled={isSubmitting}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-rose-600/25 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Terminating...' : 'Confirm Termination'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
