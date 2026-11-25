import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { getPayments, updatePayment } from '../../services/db.ts';
import { Payment } from '../../types/index.ts';
import { Badge, getStatusBadgeVariant } from '../../components/common/Badge.tsx';
import { Modal } from '../../components/common/Modal.tsx';
import { useNotifications } from '../../context/NotificationContext.tsx';
import { CreditCard, CheckCircle2, Clock, AlertTriangle, Send, Sparkles, QrCode } from 'lucide-react';
import { motion } from 'motion/react';

export const TenantPayments: React.FC = () => {
  const { currentUser } = useAuth();
  const { addToast } = useNotifications();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [payingPayment, setPayingPayment] = useState<Payment | null>(null);
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Bank Transfer'>('UPI');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadPayments = async () => {
    if (!currentUser) return;
    try {
      const tenantId = currentUser.tenantRecordId || currentUser.id;
      const list = await getPayments(undefined, tenantId);
      setPayments(list);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [currentUser]);

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !payingPayment) return;

    setIsSubmitting(true);
    try {
      await updatePayment(
        payingPayment.id,
        {
          status: 'Paid',
          paymentDate: new Date().toISOString().split('T')[0],
          paymentMethod,
          transactionRef,
          notes: 'Paid by tenant online via RentEase portal',
        },
        { id: currentUser.id, name: currentUser.fullName, role: currentUser.role }
      );

      addToast({
        type: 'success',
        title: 'Payment Confirmed!',
        message: `Your payment of ₹${payingPayment.amount.toLocaleString()} was marked as paid with Ref #${transactionRef}.`,
      });

      setPayingPayment(null);
      setTransactionRef('');
      loadPayments();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Payment Error',
        message: err.message || 'Could not process payment.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openPayModal = (p: Payment) => {
    setPayingPayment(p);
    setTransactionRef(`UPI-${Date.now().toString().slice(-6)}`);
  };

  const pendingList = payments.filter((p) => p.status === 'Pending' || p.status === 'Overdue');
  const paidList = payments.filter((p) => p.status === 'Paid');

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">Rent & Payment History</h1>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
            Real-Time Clearing
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Review monthly rent invoices, clear outstanding balances with UPI, and download transaction records.
        </p>
      </div>

      {/* Outstanding dues alert */}
      {pendingList.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900/80 rounded-2xl border border-amber-500/30 p-6 backdrop-blur-xl shadow-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">
                  You have {pendingList.length} pending rent invoice{pendingList.length > 1 ? 's' : ''}
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Total outstanding balance:{' '}
                  <strong className="text-white font-mono font-bold text-sm">
                    ₹{pendingList.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                  </strong>
                </p>
              </div>
            </div>
            <button
              onClick={() => openPayModal(pendingList[0])}
              className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Pay Next Invoice Now
            </button>
          </div>
        </motion.div>
      )}

      {/* Payment History Table */}
      <div className="bg-slate-900/70 rounded-2xl border border-white/10 shadow-xl overflow-hidden backdrop-blur-xl">
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-cyan-400" />
            All Payment Invoices
          </h2>
          <span className="text-xs text-slate-400 font-mono">{payments.length} Records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/5 text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider font-mono text-[10px]">
              <tr>
                <th className="py-3.5 px-6">Invoice Description</th>
                <th className="py-3.5 px-6">Amount</th>
                <th className="py-3.5 px-6">Due Date</th>
                <th className="py-3.5 px-6">Payment Date</th>
                <th className="py-3.5 px-6">Method & Reference</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-mono">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                      <span>Loading invoices...</span>
                    </div>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No payment invoices found for this account.
                  </td>
                </tr>
              ) : (
                payments.map((pay, idx) => (
                  <motion.tr
                    key={pay.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02, duration: 0.2 }}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="font-semibold text-white">Monthly Rent</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {pay.propertyName} (Unit {pay.unitNumber})
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-white font-mono text-sm">
                        ₹{pay.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono text-slate-300">{pay.dueDate}</td>
                    <td className="py-4 px-6 font-mono text-slate-300">
                      {pay.paymentDate ? pay.paymentDate : '—'}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-mono text-slate-200">{pay.paymentMethod || '—'}</div>
                      {pay.transactionRef && (
                        <div className="text-[10px] text-cyan-400 font-mono">Ref: {pay.transactionRef}</div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <Badge variant={getStatusBadgeVariant(pay.status)}>{pay.status}</Badge>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {pay.status !== 'Paid' ? (
                        <button
                          onClick={() => openPayModal(pay)}
                          className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-lg shadow-md transition-all text-xs"
                        >
                          Pay Now
                        </button>
                      ) : (
                        <span className="text-emerald-400 font-mono text-[11px] font-semibold">Cleared</span>
                      )}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pay Modal */}
      <Modal isOpen={!!payingPayment} onClose={() => setPayingPayment(null)} title="Settle Rent Invoice" subtitle={`Unit ${payingPayment?.unitNumber} · ${payingPayment?.propertyName}`} maxWidth="sm">
        {payingPayment && (
          <form onSubmit={handlePaySubmit} className="space-y-4 text-xs">
            <div className="p-4 bg-slate-950/70 rounded-xl border border-white/10 text-center space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Amount Due</span>
              <p className="text-2xl font-bold text-white font-mono">
                ₹{payingPayment.amount.toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-400 font-mono">Due date: {payingPayment.dueDate}</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`py-2 px-3 rounded-xl border font-semibold transition-all ${
                    paymentMethod === 'UPI'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                      : 'bg-slate-950/60 text-slate-400 border-white/10'
                  }`}
                >
                  UPI Payment
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Bank Transfer')}
                  className={`py-2 px-3 rounded-xl border font-semibold transition-all ${
                    paymentMethod === 'Bank Transfer'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                      : 'bg-slate-950/60 text-slate-400 border-white/10'
                  }`}
                >
                  Bank Transfer
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Transaction / UTR Reference ID *
              </label>
              <input
                type="text"
                required
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/70 border border-white/15 rounded-xl text-xs text-white font-mono focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Simulated transaction reference code.
              </span>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPayingPayment(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-xl hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Confirming...' : 'Confirm Payment'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
