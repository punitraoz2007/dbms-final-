import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  getTenants,
  getProperties,
  getUnits,
  getInvitations,
  inviteTenant,
} from '../../services/db.ts';
import { Tenant, Property, Unit, Invitation } from '../../types/index.ts';
import { Badge, getStatusBadgeVariant } from '../../components/common/Badge.tsx';
import { Modal } from '../../components/common/Modal.tsx';
import { useNotifications } from '../../context/NotificationContext.tsx';
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  Calendar,
  Send,
  ExternalLink,
  Copy,
  Check,
  DoorOpen,
  Building2,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

export const LandlordTenants: React.FC = () => {
  const { currentUser } = useAuth();
  const { addToast, addSimulatedEmail } = useNotifications();
  const navigate = useNavigate();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'tenants' | 'invitations'>('tenants');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Invite Tenant Modal Form
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [tenantName, setTenantName] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [monthlyRent, setMonthlyRent] = useState(20000);
  const [securityDeposit, setSecurityDeposit] = useState(40000);
  const [leaseStartDate, setLeaseStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [leaseEndDate, setLeaseEndDate] = useState(
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    if (!currentUser) return;
    try {
      const [tList, pList, uList, iList] = await Promise.all([
        getTenants(currentUser.id),
        getProperties(currentUser.id),
        getUnits(undefined, currentUser.id),
        getInvitations('tenant', currentUser.id),
      ]);
      setTenants(tList);
      setProperties(pList);
      setUnits(uList);
      setInvitations(iList);

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

  // When property selection changes, auto-select first available unit
  useEffect(() => {
    if (propertyId) {
      const propUnits = units.filter((u) => u.propertyId === propertyId);
      const available = propUnits.filter((u) => u.status === 'Available');
      const chosenUnit = available.length > 0 ? available[0] : propUnits[0];
      if (chosenUnit) {
        setUnitId(chosenUnit.id);
        setMonthlyRent(chosenUnit.monthlyRent);
        setSecurityDeposit(chosenUnit.securityDeposit);
      } else {
        setUnitId('');
      }
    }
  }, [propertyId, units]);

  // When unit selection changes, update rent & deposit
  const handleUnitChange = (uId: string) => {
    setUnitId(uId);
    const selected = units.find((u) => u.id === uId);
    if (selected) {
      setMonthlyRent(selected.monthlyRent);
      setSecurityDeposit(selected.securityDeposit);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const chosenProperty = properties.find((p) => p.id === propertyId);
    const chosenUnit = units.find((u) => u.id === unitId);

    if (!chosenProperty || !chosenUnit) {
      addToast({
        type: 'error',
        title: 'Selection Error',
        message: 'Please choose a property and unit.',
      });
      return;
    }

    if (chosenUnit.status === 'Occupied') {
      addToast({
        type: 'error',
        title: 'Occupied Unit',
        message: 'This unit is already occupied. Select an available unit.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const invitation = await inviteTenant(
        {
          tenantName,
          tenantEmail,
          phone,
          propertyId,
          propertyName: chosenProperty.name,
          unitId,
          unitNumber: chosenUnit.unitNumber,
          monthlyRent: Number(monthlyRent),
          securityDeposit: Number(securityDeposit),
          leaseStartDate,
          leaseEndDate,
          landlordId: currentUser.id,
          landlordName: currentUser.fullName,
        },
        { id: currentUser.id, name: currentUser.fullName, role: currentUser.role }
      );

      // Simulate sending the invitation email
      addSimulatedEmail({
        recipientEmail: tenantEmail,
        recipientName: tenantName,
        subject: `Invitation to RentEase - Unit ${chosenUnit.unitNumber} at ${chosenProperty.name}`,
        invitationToken: invitation.token,
        invitationType: 'tenant',
        propertyName: chosenProperty.name,
        unitNumber: chosenUnit.unitNumber,
        monthlyRent: Number(monthlyRent),
      });

      addToast({
        type: 'success',
        title: 'Invitation Dispatched',
        message: `Tenant invitation link sent to ${tenantEmail}. Visible in Email Simulator.`,
      });

      setIsInviteOpen(false);
      resetInviteForm();
      loadData();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Invitation Error',
        message: err.message || 'Failed to dispatch tenant invitation.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetInviteForm = () => {
    setTenantName('');
    setTenantEmail('');
    setPhone('');
    setMonthlyRent(20000);
    setSecurityDeposit(40000);
  };

  const copyInviteLink = (token: string) => {
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    addToast({
      type: 'info',
      title: 'Link Copied',
      message: 'Invitation link copied to clipboard.',
    });
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const getPropertyName = (pId: string) => {
    const found = properties.find((p) => p.id === pId);
    return found ? found.name : 'Unknown Estate';
  };

  const getUnitNumber = (uId: string) => {
    const found = units.find((u) => u.id === uId);
    return found ? found.unitNumber : '101';
  };

  const filteredTenants = tenants.filter((t) => {
    return (
      t.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.phone.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const filteredInvitations = invitations.filter((i) => {
    return (
      i.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.propertyName && i.propertyName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white font-display">Tenants & Invites</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
              {tenants.length} Active Residents
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dispatch digital onboarding invitations, manage resident profiles, and monitor unit assignments.
          </p>
        </div>
        <button
          onClick={() => {
            resetInviteForm();
            setIsInviteOpen(true);
          }}
          disabled={properties.length === 0 || units.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          Invite Tenant
        </button>
      </div>

      {/* Tabs and Search Bar */}
      <div className="bg-slate-900/70 p-4 rounded-2xl border border-white/10 shadow-lg backdrop-blur-xl flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center bg-slate-950/70 p-1 rounded-xl border border-white/10 relative">
          <button
            onClick={() => setActiveTab('tenants')}
            className={`relative z-10 px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'tenants' ? 'text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {activeTab === 'tenants' && (
              <motion.div
                layoutId="active-tenant-tab"
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg -z-10 shadow-[0_0_12px_rgba(6,182,212,0.35)]"
              />
            )}
            Active Tenants ({tenants.length})
          </button>
          <button
            onClick={() => setActiveTab('invitations')}
            className={`relative z-10 px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'invitations' ? 'text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {activeTab === 'invitations' && (
              <motion.div
                layoutId="active-tenant-tab"
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg -z-10 shadow-[0_0_12px_rgba(6,182,212,0.35)]"
              />
            )}
            Sent Invitations ({invitations.length})
          </button>
        </div>

        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder={activeTab === 'tenants' ? 'Search tenants by name or email...' : 'Search invitations...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 bg-slate-950/70 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'tenants' ? (
        <div className="bg-slate-900/70 rounded-2xl border border-white/10 shadow-xl overflow-hidden backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/5 text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider font-mono text-[10px]">
                <tr>
                  <th className="py-3.5 px-6">Resident Details</th>
                  <th className="py-3.5 px-6">Assigned Suite</th>
                  <th className="py-3.5 px-6">Monthly Rent</th>
                  <th className="py-3.5 px-6">Deposit Held</th>
                  <th className="py-3.5 px-6">Lease Term</th>
                  <th className="py-3.5 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-mono">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                        <span>Syncing tenant records...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No active tenants found. Use "Invite Tenant" to onboard residents.
                    </td>
                  </tr>
                ) : (
                  filteredTenants.map((t, idx) => (
                    <motion.tr
                      key={t.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02, duration: 0.2 }}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="font-semibold text-white text-sm">{t.fullName}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5 space-x-2">
                          <span>{t.email}</span>
                          <span>·</span>
                          <span>{t.phone}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-white">{getPropertyName(t.propertyId)}</div>
                        <div className="text-cyan-400 font-mono font-medium">Unit {getUnitNumber(t.unitId)}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-bold text-emerald-400 font-mono text-sm">
                          ₹{t.monthlyRent.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono"> /mo</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-mono text-slate-200">₹{t.securityDeposit.toLocaleString()}</span>
                      </td>
                      <td className="py-4 px-6 font-mono text-[11px] text-slate-400">
                        {t.leaseStartDate} → {t.leaseEndDate}
                      </td>
                      <td className="py-4 px-6">
                        <Badge variant={getStatusBadgeVariant(t.status)}>{t.status}</Badge>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/70 rounded-2xl border border-white/10 shadow-xl overflow-hidden backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/5 text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider font-mono text-[10px]">
                <tr>
                  <th className="py-3.5 px-6">Invited Candidate</th>
                  <th className="py-3.5 px-6">Assigned Suite</th>
                  <th className="py-3.5 px-6">Rent Agreement</th>
                  <th className="py-3.5 px-6">Sent Date</th>
                  <th className="py-3.5 px-6">State</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {filteredInvitations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No invitations dispatched yet.
                    </td>
                  </tr>
                ) : (
                  filteredInvitations.map((inv, idx) => (
                    <motion.tr
                      key={inv.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02, duration: 0.2 }}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="font-semibold text-white text-sm">{inv.fullName}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{inv.email}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-white">{inv.propertyName}</div>
                        <div className="text-cyan-400 font-mono">Unit {inv.unitNumber}</div>
                      </td>
                      <td className="py-4 px-6 space-y-0.5">
                        <div className="font-bold text-emerald-400 font-mono">
                          ₹{inv.monthlyRent?.toLocaleString() || '20,000'}/mo
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          Deposit: ₹{inv.securityDeposit?.toLocaleString() || '40,000'}
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono text-[11px] text-slate-400">
                        {new Date(inv.createdAt).toLocaleDateString([], { dateStyle: 'medium' })}
                      </td>
                      <td className="py-4 px-6">
                        <Badge variant={getStatusBadgeVariant(inv.status)}>{inv.status}</Badge>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => copyInviteLink(inv.token)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-white/10 transition-colors text-xs"
                            title="Copy link"
                          >
                            {copiedToken === inv.token ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            <span>{copiedToken === inv.token ? 'Copied' : 'Copy'}</span>
                          </button>
                          <button
                            onClick={() => navigate(`/invite/${inv.token}`)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-colors text-xs"
                            title="Open invitation page"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Preview</span>
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
      )}

      {/* Invite Tenant Modal */}
      <Modal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} title="Invite Tenant via Email" subtitle="Tenant will receive a secured invitation link to register" maxWidth="lg">
        <form onSubmit={handleInviteSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Tenant Full Name *</label>
              <input
                type="text"
                required
                placeholder="Amit Kumar"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-white placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Tenant Email Address *</label>
              <input
                type="email"
                required
                placeholder="amit@example.com"
                value={tenantEmail}
                onChange={(e) => setTenantEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-white placeholder:text-slate-500 font-mono focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Phone Number *</label>
            <input
              type="text"
              required
              placeholder="+91 91234 56789"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-white placeholder:text-slate-500 font-mono focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Select Unit / Room *</label>
              <select
                value={unitId}
                onChange={(e) => handleUnitChange(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-slate-200 focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
              >
                {units
                  .filter((u) => u.propertyId === propertyId)
                  .map((u) => (
                    <option key={u.id} value={u.id} disabled={u.status === 'Occupied'}>
                      Unit {u.unitNumber} - {u.floor} ({u.status})
                    </option>
                  ))}
              </select>
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
              <label className="block font-semibold text-slate-300 mb-1">Lease Start Date *</label>
              <input
                type="date"
                required
                value={leaseStartDate}
                onChange={(e) => setLeaseStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-slate-200 focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Lease End Date *</label>
              <input
                type="date"
                required
                value={leaseEndDate}
                onChange={(e) => setLeaseEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-slate-200 focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsInviteOpen(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Dispatching...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
