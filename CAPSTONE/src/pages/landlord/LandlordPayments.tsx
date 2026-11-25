import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { getPayments, recordPayment, updatePayment, getTenants, getUnits, getProperties } from '../../services/db.ts';
import { Payment, PaymentMethod, PaymentStatus, Tenant, Unit, Property } from '../../types/index.ts';
import { Badge, getStatusBadgeVariant } from '../../components/common/Badge.tsx';
import { Modal } from '../../components/common/Modal.tsx';
import { StatCard } from '../../components/common/StatCard.tsx';
import { useNotifications } from '../../context/NotificationContext.tsx';
import { CreditCard, Plus, Search, CheckCircle, Clock, AlertTriangle, Edit2, Sparkles, DollarSign } from 'lucide-react';
import { motion } from 'motion/react';

export const LandlordPayments: React.FC = () => {
  const { currentUser } = useAuth();
  const { addToast } = useNotifications();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);

  // Form fields
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [amount, setAmount] = useState(20000);
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [status, setStatus] = useState<PaymentStatus>('Paid');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    if (!currentUser) return;
    try {
      const [payList, tList, uList, pList] = await Promise.all([
        getPayments(currentUser.id),
        getTenants(currentUser.id),
        getUnits(undefined, currentUser.id),
        getProperties(currentUser.id),
      ]);
      setPayments(payList);
      setTenants(tList);
      setUnits(uList);
      setProperties(pList);
      if (tList.length > 0 && !selectedTenantId) {
        setSelectedTenantId(tList[0].id);
        setAmount(tList[0].monthlyRent);
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

  const handleTenantChange = (tId: string) => {
    setSelectedTenantId(tId);
    const found = tenants.find((t) => t.id === tId);
    if (found) {
      setAmount(found.monthlyRent);
    }
  };

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const chosenTenant = tenants.find((t) => t.id === selectedTenantId);
    if (!chosenTenant) {
      addToast({ type: 'error', title: 'Error', message: 'Please select a tenant.' });
      return;
    }

    const prop = properties.find((p) => p.id === chosenTenant.propertyId);
    const unit = units.find((u) => u.id === chosenTenant.unitId);

    setIsSubmitting(true);
    try {
      await recordPayment(
        {
          landlordId: currentUser.id,
          tenantId: chosenTenant.id,
          tenantName: chosenTenant.fullName,
          propertyId: chosenTenant.propertyId,
          propertyName: prop ? prop.name : 'Estate',
          unitId: chosenTenant.unitId,
          unitNumber: unit ? unit.unitNumber : '101',
          amount: Number(amount),
          dueDate,
          paymentDate: status === 'Paid' ? paymentDate : undefined,
          status,
          paymentMethod: status === 'Paid' ? paymentMethod : undefined,
          transactionRef: transactionRef || undefined,
          notes: notes || undefined,
        },
        { id: currentUser.id, name: currentUser.fullName, role: currentUser.role }
      );
      addToast({
        type: 'success',
        title: 'Payment Recorded',
        message: `₹${Number(amount).toLocaleString()} logged for ${chosenTenant.fullName}.`,
      });
      setIsRecordOpen(false);
      loadData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message || 'Could not record payment.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !editingPayment) return;
    setIsSubmitting(true);
    try {
      await updatePayment(
        editingPayment.id,
        {
          amount: Number(amount),
          dueDate,
          paymentDate: status === 'Paid' ? paymentDate : undefined,
          status,
          paymentMethod: status === 'Paid' ? paymentMethod : undefined,
          transactionRef: transactionRef || undefined,
          notes: notes || undefined,
        },
        { id: currentUser.id, name: currentUser.fullName, role: currentUser.role }
      );
      addToast({ type: 'success', title: 'Payment Updated', message: 'Payment record modified.' });
      setEditingPayment(null);
      loadData();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message || 'Could not update payment.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (p: Payment) => {
    setEditingPayment(p);
    setAmount(p.amount);
    setDueDate(p.dueDate);
    setPaymentDate(p.paymentDate || new Date().toISOString().split('T')[0]);
    setPaymentMethod(p.paymentMethod || 'UPI');
    setStatus(p.status);
    setTransactionRef(p.transactionRef || '');
    setNotes(p.notes || '');
  };

  const totalCollected = payments
    .filter((p) => p.status === 'Paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPending = payments
    .filter((p) => p.status === 'Pending' || p.status === 'Overdue')
    .reduce((sum, p) => sum + p.amount, 0);

  const filtered = payments.filter((p) => {
    const matchesSearch =
      p.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.propertyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.transactionRef && p.transactionRef.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white font-display">Rent & Financial Ledger</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
              Verified Ledger
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Track rent payments, invoices, pending arrears, UPI/Bank references, and ledger logs.
          </p>
        </div>
        <button
          onClick={() => setIsRecordOpen(true)}
          disabled={tenants.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Record Payment
        </button>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Rent Collected"
          value={`₹${totalCollected.toLocaleString()}`}
          icon={CreditCard}
          color="emerald"
          subtitle="Processed & cleared"
        />
        <StatCard
          title="Pending / Overdue"
          value={`₹${totalPending.toLocaleString()}`}
          icon={Clock}
          color="rose"
          subtitle="Awaiting tenant clearing"
        />
        <StatCard
          title="Total Transactions"
          value={payments.length}
          icon={CheckCircle}
          color="cyan"
          subtitle="Recorded ledger receipts"
        />
      </div>

      {/* Search and Filters */}
      <div className="bg-slate-900/70 p-4 rounded-2xl border border-white/10 shadow-lg backdrop-blur-xl flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search tenant, property, or ref..."
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
            <option value="all">All Payments</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-slate-900/70 rounded-2xl border border-white/10 shadow-xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/5 text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider font-mono text-[10px]">
              <tr>
                <th className="py-3.5 px-6">Tenant Resident</th>
                <th className="py-3.5 px-6">Assigned Suite</th>
                <th className="py-3.5 px-6">Amount</th>
                <th className="py-3.5 px-6">Due Date</th>
                <th className="py-3.5 px-6">Payment Method</th>
                <th className="py-3.5 px-6">Payment Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-mono">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                      <span>Syncing financial ledger...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No payment records found.
                  </td>
                </tr>
              ) : (
                filtered.map((pay, idx) => (
                  <motion.tr
                    key={pay.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02, duration: 0.2 }}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="font-semibold text-white text-sm">{pay.tenantName}</div>
                      {pay.transactionRef && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">Ref: {pay.transactionRef}</div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-white">{pay.propertyName}</div>
                      <div className="text-cyan-400 font-mono">Unit {pay.unitNumber}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-emerald-400 font-mono text-sm">
                        ₹{pay.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono text-slate-300">{pay.dueDate}</td>
                    <td className="py-4 px-6">
                      <span className="font-mono text-slate-300">{pay.paymentMethod || '—'}</span>
                    </td>
                    <td className="py-4 px-6">
                      <Badge variant={getStatusBadgeVariant(pay.status)}>{pay.status}</Badge>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => openEdit(pay)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        title="Edit Payment"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal isOpen={isRecordOpen} onClose={() => setIsRecordOpen(false)} title="Record Rent Payment" subtitle="Log an incoming rent receipt or manual cash/UPI collection" maxWidth="md">
        <form onSubmit={handleRecordSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Select Tenant *</label>
            <select
              value={selectedTenantId}
              onChange={(e) => handleTenantChange(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-slate-200 focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName} (Rent: ₹{t.monthlyRent.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Amount (₹) *</label>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-white font-mono focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Due Date *</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-slate-200 focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Payment Status *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PaymentStatus)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-slate-200 focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
              >
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-slate-200 focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
              >
                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                <option value="Bank Transfer">Bank Transfer / NEFT / IMPS</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Transaction Reference / UTR Number</label>
            <input
              type="text"
              placeholder="e.g. UPI-REF-984729124"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-white placeholder:text-slate-500 font-mono focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Notes (Optional)</label>
            <textarea
              rows={2}
              placeholder="e.g. Rent for current month"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-white placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
            />
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsRecordOpen(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Payment Modal */}
      <Modal isOpen={!!editingPayment} onClose={() => setEditingPayment(null)} title="Update Payment Record" subtitle={`Reference: ${editingPayment?.id}`} maxWidth="md">
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Amount (₹)</label>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-white font-mono focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Due Date</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-slate-200 focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Payment Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PaymentStatus)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-slate-200 focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
              >
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-slate-200 focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
              >
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Transaction Ref</label>
            <input
              type="text"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-white font-mono focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
            />
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditingPayment(null)}
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
    </div>
  );
};
