import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { getUnits, getProperties, createUnit, updateUnit, deleteUnit } from '../../services/db.ts';
import { Unit, Property, FurnishingStatus, UnitStatus } from '../../types/index.ts';
import { Badge, getStatusBadgeVariant } from '../../components/common/Badge.tsx';
import { Modal } from '../../components/common/Modal.tsx';
import { useNotifications } from '../../context/NotificationContext.tsx';
import { Plus, Search, DoorOpen, Building2, Edit2, Trash2, User, Key } from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';

export const LandlordUnits: React.FC = () => {
  const { currentUser } = useAuth();
  const { addToast } = useNotifications();
  const [searchParams] = useSearchParams();
  const initialPropId = searchParams.get('propertyId') || 'all';

  const [units, setUnits] = useState<Unit[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>(initialPropId);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [deletingUnit, setDeletingUnit] = useState<Unit | null>(null);

  // Form
  const [propertyId, setPropertyId] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [floor, setFloor] = useState('1st Floor');
  const [monthlyRent, setMonthlyRent] = useState(20000);
  const [securityDeposit, setSecurityDeposit] = useState(40000);
  const [furnishingStatus, setFurnishingStatus] = useState<FurnishingStatus>('Furnished');
  const [status, setStatus] = useState<UnitStatus>('Available');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    if (!currentUser) return;
    try {
      const [uList, pList] = await Promise.all([
        getUnits(undefined, currentUser.id),
        getProperties(currentUser.id),
      ]);
      setUnits(uList);
      setProperties(pList);
      if (pList.length > 0 && !propertyId) {
        setPropertyId(pList[0].id);
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

  const resetForm = () => {
    setUnitNumber('');
    setFloor('1st Floor');
    setMonthlyRent(20000);
    setSecurityDeposit(40000);
    setFurnishingStatus('Furnished');
    setStatus('Available');
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !propertyId) return;
    setIsSubmitting(true);
    try {
      await createUnit(
        {
          propertyId,
          landlordId: currentUser.id,
          unitNumber,
          floor,
          monthlyRent: Number(monthlyRent),
          securityDeposit: Number(securityDeposit),
          furnishingStatus,
          status,
        },
        { id: currentUser.id, name: currentUser.fullName, role: currentUser.role }
      );
      addToast({
        type: 'success',
        title: 'Unit Added',
        message: `Unit ${unitNumber} created successfully.`,
      });
      setIsAddOpen(false);
      resetForm();
      loadData();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'Could not add unit.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !editingUnit) return;
    setIsSubmitting(true);
    try {
      await updateUnit(
        editingUnit.id,
        {
          propertyId,
          unitNumber,
          floor,
          monthlyRent: Number(monthlyRent),
          securityDeposit: Number(securityDeposit),
          furnishingStatus,
          status,
        },
        { id: currentUser.id, name: currentUser.fullName, role: currentUser.role }
      );
      addToast({
        type: 'success',
        title: 'Unit Updated',
        message: `Unit ${unitNumber} saved successfully.`,
      });
      setEditingUnit(null);
      resetForm();
      loadData();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'Could not update unit.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!currentUser || !deletingUnit) return;
    setIsSubmitting(true);
    try {
      await deleteUnit(
        deletingUnit.id,
        deletingUnit.unitNumber,
        currentUser.id,
        { id: currentUser.id, name: currentUser.fullName, role: currentUser.role }
      );
      addToast({
        type: 'info',
        title: 'Unit Deleted',
        message: `Unit ${deletingUnit.unitNumber} removed.`,
      });
      setDeletingUnit(null);
      loadData();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'Could not delete unit.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (u: Unit) => {
    setEditingUnit(u);
    setPropertyId(u.propertyId);
    setUnitNumber(u.unitNumber);
    setFloor(u.floor);
    setMonthlyRent(u.monthlyRent);
    setSecurityDeposit(u.securityDeposit);
    setFurnishingStatus(u.furnishingStatus);
    setStatus(u.status);
  };

  const getPropertyName = (pId: string) => {
    const found = properties.find((p) => p.id === pId);
    return found ? found.name : 'Unknown Estate';
  };

  const filtered = units.filter((u) => {
    const matchesProperty = selectedProperty === 'all' || u.propertyId === selectedProperty;
    const matchesStatus = selectedStatus === 'all' || u.status === selectedStatus;
    const matchesSearch =
      u.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.floor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getPropertyName(u.propertyId).toLowerCase().includes(searchTerm.toLowerCase());
    return matchesProperty && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white font-display">Units & Suites Inventory</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
              {units.length} Units
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Maintain individual flats, suites, and commercial rooms across your properties.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/landlord/tenants"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-white/10 text-xs font-semibold rounded-xl shadow-lg transition-all hover:scale-[1.02]"
          >
            <Key className="w-3.5 h-3.5" />
            Invite Tenant
          </Link>
          <button
            onClick={() => {
              resetForm();
              setIsAddOpen(true);
            }}
            disabled={properties.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Add Unit
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/70 p-4 rounded-2xl border border-white/10 shadow-lg backdrop-blur-xl flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search unit number or floor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 bg-slate-950/70 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-medium">Property:</span>
            <select
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="px-3 py-2 bg-slate-950/70 border border-white/10 rounded-xl text-xs font-medium text-slate-200 focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
            >
              <option value="all">All Properties</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-medium">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-slate-950/70 border border-white/10 rounded-xl text-xs font-medium text-slate-200 focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
            >
              <option value="all">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Occupied">Occupied</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>
        </div>
      </div>

      {/* Units Table */}
      <div className="bg-slate-900/70 rounded-2xl border border-white/10 shadow-xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/5 text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider font-mono text-[10px]">
              <tr>
                <th className="py-3.5 px-6">Unit Identifier</th>
                <th className="py-3.5 px-6">Parent Property</th>
                <th className="py-3.5 px-6">Financial Parameters</th>
                <th className="py-3.5 px-6">Furnishing</th>
                <th className="py-3.5 px-6">Occupancy Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-mono">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                      <span>Syncing units directory...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No units found matching your search.
                  </td>
                </tr>
              ) : (
                filtered.map((unit, idx) => (
                  <motion.tr
                    key={unit.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02, duration: 0.2 }}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="font-semibold text-white text-sm flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-mono">
                          {unit.unitNumber}
                        </div>
                        <span>Unit {unit.unitNumber}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-mono">{unit.floor}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-white">{getPropertyName(unit.propertyId)}</div>
                    </td>
                    <td className="py-4 px-6 space-y-0.5">
                      <div className="font-bold text-emerald-400 font-mono">
                        ₹{unit.monthlyRent.toLocaleString()}
                        <span className="text-[10px] text-slate-400 font-normal"> /mo</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Deposit: ₹{unit.securityDeposit.toLocaleString()}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Badge variant={getStatusBadgeVariant(unit.furnishingStatus)}>
                        {unit.furnishingStatus}
                      </Badge>
                    </td>
                    <td className="py-4 px-6">
                      <Badge variant={getStatusBadgeVariant(unit.status)}>{unit.status}</Badge>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEdit(unit)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                          title="Edit Unit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingUnit(unit)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Delete Unit"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Unit Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Unit / Room" subtitle="Create an individual rentable suite" maxWidth="md">
        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Select Property *</label>
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-slate-200 focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.city})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Unit Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. 101, 204B"
                value={unitNumber}
                onChange={(e) => setUnitNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-white placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Floor Level</label>
              <input
                type="text"
                placeholder="1st Floor"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-white placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Monthly Rent (₹) *</label>
              <input
                type="number"
                min="0"
                required
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-white font-mono focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Security Deposit (₹) *</label>
              <input
                type="number"
                min="0"
                required
                value={securityDeposit}
                onChange={(e) => setSecurityDeposit(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-white font-mono focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Furnishing Status</label>
              <select
                value={furnishingStatus}
                onChange={(e) => setFurnishingStatus(e.target.value as FurnishingStatus)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-slate-200 focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
              >
                <option value="Furnished">Furnished</option>
                <option value="Semi-Furnished">Semi-Furnished</option>
                <option value="Unfurnished">Unfurnished</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Unit Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as UnitStatus)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-slate-200 focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
              >
                <option value="Available">Available</option>
                <option value="Occupied">Occupied</option>
                <option value="Maintenance">Maintenance</option>
              </select>
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
              {isSubmitting ? 'Adding...' : 'Add Unit'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Unit Modal */}
      <Modal isOpen={!!editingUnit} onClose={() => setEditingUnit(null)} title="Edit Unit" subtitle={`Adjust details for Unit ${editingUnit?.unitNumber}`} maxWidth="md">
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Select Property *</label>
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-slate-200 focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.city})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Unit Number *</label>
              <input
                type="text"
                required
                value={unitNumber}
                onChange={(e) => setUnitNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-white focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Floor Level</label>
              <input
                type="text"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-white focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Monthly Rent (₹) *</label>
              <input
                type="number"
                min="0"
                required
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-white font-mono focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Security Deposit (₹) *</label>
              <input
                type="number"
                min="0"
                required
                value={securityDeposit}
                onChange={(e) => setSecurityDeposit(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-white font-mono focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Furnishing Status</label>
              <select
                value={furnishingStatus}
                onChange={(e) => setFurnishingStatus(e.target.value as FurnishingStatus)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-slate-200 focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
              >
                <option value="Furnished">Furnished</option>
                <option value="Semi-Furnished">Semi-Furnished</option>
                <option value="Unfurnished">Unfurnished</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Unit Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as UnitStatus)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-slate-200 focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
              >
                <option value="Available">Available</option>
                <option value="Occupied">Occupied</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditingUnit(null)}
              className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deletingUnit} onClose={() => setDeletingUnit(null)} title="Delete Unit" subtitle={`Confirm removal of Unit ${deletingUnit?.unitNumber}`} maxWidth="sm">
        <div className="space-y-4 text-xs">
          <p className="text-slate-300 leading-relaxed">
            Are you sure you want to permanently delete Unit <strong className="text-white font-semibold">{deletingUnit?.unitNumber}</strong>?
          </p>
          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setDeletingUnit(null)}
              className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-rose-600/25 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Deleting...' : 'Confirm Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
