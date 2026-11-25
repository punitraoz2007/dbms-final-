import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { getProperties, createProperty, updateProperty, deleteProperty, getUnits } from '../../services/db.ts';
import { Property, PropertyType, PropertyStatus, Unit } from '../../types/index.ts';
import { Badge, getStatusBadgeVariant } from '../../components/common/Badge.tsx';
import { Modal } from '../../components/common/Modal.tsx';
import { useNotifications } from '../../context/NotificationContext.tsx';
import { Plus, Search, Building2, MapPin, Edit2, Trash2, DoorOpen, ExternalLink, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

export const LandlordProperties: React.FC = () => {
  const { currentUser } = useAuth();
  const { addToast } = useNotifications();
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [deletingProperty, setDeletingProperty] = useState<Property | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [type, setType] = useState<PropertyType>('Apartment');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [state, setState] = useState('Karnataka');
  const [pinCode, setPinCode] = useState('');
  const [description, setDescription] = useState('');
  const [totalUnits, setTotalUnits] = useState(1);
  const [status, setStatus] = useState<PropertyStatus>('Active');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    if (!currentUser) return;
    try {
      const [props, uList] = await Promise.all([
        getProperties(currentUser.id),
        getUnits(undefined, currentUser.id),
      ]);
      setProperties(props);
      setUnits(uList);
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
    setName('');
    setType('Apartment');
    setAddress('');
    setCity('Bengaluru');
    setState('Karnataka');
    setPinCode('');
    setDescription('');
    setTotalUnits(1);
    setStatus('Active');
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSubmitting(true);
    try {
      await createProperty(
        {
          landlordId: currentUser.id,
          name,
          type,
          address,
          city,
          state,
          pinCode,
          description,
          totalUnits: Number(totalUnits) || 1,
          status,
        },
        { id: currentUser.id, name: currentUser.fullName, role: currentUser.role }
      );
      addToast({
        type: 'success',
        title: 'Property Added',
        message: `Successfully created "${name}". You can now add units to it.`,
      });
      setIsAddOpen(false);
      resetForm();
      loadData();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'Could not create property.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !editingProperty) return;
    setIsSubmitting(true);
    try {
      await updateProperty(
        editingProperty.id,
        {
          name,
          type,
          address,
          city,
          state,
          pinCode,
          description,
          totalUnits: Number(totalUnits) || 1,
          status,
        },
        { id: currentUser.id, name: currentUser.fullName, role: currentUser.role }
      );
      addToast({
        type: 'success',
        title: 'Property Updated',
        message: `Saved changes to "${name}".`,
      });
      setEditingProperty(null);
      resetForm();
      loadData();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'Could not update property.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!currentUser || !deletingProperty) return;
    setIsSubmitting(true);
    try {
      await deleteProperty(
        deletingProperty.id,
        deletingProperty.name,
        currentUser.id,
        { id: currentUser.id, name: currentUser.fullName, role: currentUser.role }
      );
      addToast({
        type: 'info',
        title: 'Property Deleted',
        message: `Removed "${deletingProperty.name}".`,
      });
      setDeletingProperty(null);
      loadData();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'Could not delete property.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (p: Property) => {
    setEditingProperty(p);
    setName(p.name);
    setType(p.type);
    setAddress(p.address);
    setCity(p.city);
    setState(p.state);
    setPinCode(p.pinCode);
    setDescription(p.description || '');
    setTotalUnits(p.totalUnits);
    setStatus(p.status);
  };

  const filtered = properties.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || p.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white font-display">Properties Management</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
              {properties.length} Estates
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Create and maintain your rental properties, apartment buildings, and commercial suites.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsAddOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          Add Property
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
            placeholder="Search by name, city, address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 bg-slate-950/70 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 font-medium">Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950/70 border border-white/10 rounded-xl text-xs font-medium text-slate-200 focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
          >
            <option value="all">All Types</option>
            <option value="Apartment">Apartment</option>
            <option value="House">House</option>
            <option value="Villa">Villa</option>
            <option value="PG">PG</option>
            <option value="Commercial">Commercial</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Properties Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-400 text-xs font-mono">
          <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading your property portfolio...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-dashed border-white/10 p-8 backdrop-blur-md">
          <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white">No properties match your filter</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchTerm || typeFilter !== 'all'
              ? 'Try adjusting your search criteria or reset filters.'
              : 'Start by creating your first property to begin leasing units and managing tenants.'}
          </p>
          <button
            onClick={() => {
              resetForm();
              setIsAddOpen(true);
            }}
            className="mt-4 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-semibold rounded-xl shadow-lg transition-all"
          >
            Create Property
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((prop, idx) => {
            const propUnits = units.filter((u) => u.propertyId === prop.id);
            const occupiedCount = propUnits.filter((u) => u.status === 'Occupied').length;

            return (
              <motion.div
                key={prop.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.25 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group relative bg-slate-900/70 rounded-2xl border border-white/10 p-5 backdrop-blur-xl shadow-xl hover:border-cyan-500/40 transition-all flex flex-col justify-between"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-500/10 transition-all" />

                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-base tracking-tight">{prop.name}</h3>
                        <span className="text-[11px] font-mono text-cyan-400">{prop.type}</span>
                      </div>
                    </div>
                    <Badge variant={getStatusBadgeVariant(prop.status)}>{prop.status}</Badge>
                  </div>

                  <p className="text-xs text-slate-300 mt-3 flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>
                      {prop.address}, {prop.city}, {prop.state} {prop.pinCode}
                    </span>
                  </p>

                  {prop.description && (
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {prop.description}
                    </p>
                  )}

                  {/* Units indicator */}
                  <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5">
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Units Created</span>
                      <span className="font-bold text-white font-mono text-sm">
                        {propUnits.length} / {prop.totalUnits}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5">
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Occupied</span>
                      <span className="font-bold text-emerald-400 font-mono text-sm">
                        {occupiedCount} Units
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions footer */}
                <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between">
                  <Link
                    to={`/landlord/units?propertyId=${prop.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <DoorOpen className="w-3.5 h-3.5" />
                    <span>Manage Units ({propUnits.length})</span>
                  </Link>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(prop)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                      title="Edit Property"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingProperty(prop)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Delete Property"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add Property Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create New Property" subtitle="Register a new residential building or complex in your portfolio" maxWidth="lg">
        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Property Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Green Residency, Horizon Towers"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-white placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Property Type *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as PropertyType)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-slate-200 focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
              >
                <option value="Apartment">Apartment</option>
                <option value="House">House</option>
                <option value="Villa">Villa</option>
                <option value="PG">PG</option>
                <option value="Commercial">Commercial</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Total Unit Capacity *</label>
              <input
                type="number"
                min="1"
                required
                value={totalUnits}
                onChange={(e) => setTotalUnits(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-white focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Address *</label>
            <input
              type="text"
              required
              placeholder="e.g. 42 Palm Avenue, Indiranagar"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-white placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">City *</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-white focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">State *</label>
              <input
                type="text"
                required
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-white focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">PIN Code *</label>
              <input
                type="text"
                required
                placeholder="560038"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-white focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Description (Optional)</label>
            <textarea
              rows={2}
              placeholder="Key amenities, nearby transit stations, guidelines..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-white placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Property Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as PropertyStatus)}
              className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-slate-200 focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Under Maintenance">Under Maintenance</option>
            </select>
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
              {isSubmitting ? 'Creating...' : 'Create Property'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Property Modal */}
      <Modal isOpen={!!editingProperty} onClose={() => setEditingProperty(null)} title="Edit Property" subtitle={`Update configurations for ${editingProperty?.name}`} maxWidth="lg">
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Property Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-white focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Property Type *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as PropertyType)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-slate-200 focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
              >
                <option value="Apartment">Apartment</option>
                <option value="House">House</option>
                <option value="Villa">Villa</option>
                <option value="PG">PG</option>
                <option value="Commercial">Commercial</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Total Unit Capacity *</label>
              <input
                type="number"
                min="1"
                required
                value={totalUnits}
                onChange={(e) => setTotalUnits(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-white focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Address *</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-white focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">City *</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-white focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">State *</label>
              <input
                type="text"
                required
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-white focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">PIN Code *</label>
              <input
                type="text"
                required
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-white focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Description (Optional)</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-white focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Property Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as PropertyStatus)}
              className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-slate-200 focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Under Maintenance">Under Maintenance</option>
            </select>
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditingProperty(null)}
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
      <Modal isOpen={!!deletingProperty} onClose={() => setDeletingProperty(null)} title="Delete Property" subtitle={`Confirm removal of ${deletingProperty?.name}`} maxWidth="sm">
        <div className="space-y-4 text-xs">
          <p className="text-slate-300 leading-relaxed">
            Are you sure you want to permanently delete <strong className="text-white font-semibold">"{deletingProperty?.name}"</strong>?
            This will also remove associated units and lease associations.
          </p>
          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setDeletingProperty(null)}
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
