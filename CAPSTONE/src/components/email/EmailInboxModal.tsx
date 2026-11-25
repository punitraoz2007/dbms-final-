import React from 'react';
import { useNotifications } from '../../context/NotificationContext.tsx';
import { Mail, ExternalLink, Trash2, CheckCircle2, Clock, X, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export const EmailInboxModal: React.FC = () => {
  const { isInboxOpen, setIsInboxOpen, simulatedEmails, clearSimulatedEmails } = useNotifications();
  const navigate = useNavigate();

  if (!isInboxOpen) return null;

  const handleOpenInvite = (token: string) => {
    setIsInboxOpen(false);
    navigate(`/invite/${token}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setIsInboxOpen(false)}
        className="fixed inset-0 bg-black/80 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative z-10 bg-slate-900/95 border border-white/15 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] backdrop-blur-2xl"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.25)]">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2 font-display">
                Simulated Email Inbox
                <span className="text-[11px] font-mono font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                  {simulatedEmails.length} messages
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Real-time invitation dispatch simulation for Landlords and Tenants
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {simulatedEmails.length > 0 && (
              <button
                onClick={clearSimulatedEmails}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                title="Clear Inbox"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setIsInboxOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List of emails */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {simulatedEmails.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-slate-200">No emails dispatched yet</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                When an Admin creates a Landlord or a Landlord invites a Tenant, the invitation email arrives here with an instant test link.
              </p>
            </div>
          ) : (
            simulatedEmails.map((email) => (
              <div
                key={email.id}
                className="bg-slate-800/50 rounded-xl p-5 border border-white/10 shadow-sm hover:border-cyan-500/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 uppercase tracking-wider">
                        {email.invitationType} Invitation
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {email.sentAt}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white mt-2">{email.subject}</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      To: <span className="font-semibold text-slate-200">{email.recipientName}</span> (
                      <span className="font-mono">{email.recipientEmail}</span>)
                    </p>
                  </div>
                </div>

                {/* Email Body Preview */}
                <div className="mt-3.5 p-3.5 bg-slate-950/70 rounded-xl border border-white/10 text-xs text-slate-300 space-y-2 leading-relaxed">
                  <p>
                    Hello <strong>{email.recipientName}</strong>,
                  </p>
                  {email.invitationType === 'tenant' ? (
                    <p>
                      You have been invited to join <strong>RentEase</strong> as a tenant for{' '}
                      <strong className="text-cyan-300">{email.propertyName || 'Property'}</strong> (Unit{' '}
                      {email.unitNumber || '101'}) at{' '}
                      <strong className="text-emerald-400 font-mono">
                        ₹{email.monthlyRent?.toLocaleString() || '20,000'}/month
                      </strong>
                      .
                    </p>
                  ) : (
                    <p>
                      You have been appointed as a verified Landlord on <strong>RentEase</strong>. Please accept your
                      invitation to set your password and access your property workspace.
                    </p>
                  )}
                  <p className="text-slate-400">
                    Click the button below to complete onboarding and activate your credentials.
                  </p>
                </div>

                {/* Action button */}
                <div className="mt-4 flex items-center justify-between pt-2">
                  <span className="text-[11px] font-mono text-slate-400 truncate max-w-xs">
                    Token: {email.invitationToken}
                  </span>
                  <button
                    onClick={() => handleOpenInvite(email.invitationToken)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-cyan-500/20 transition-all"
                  >
                    Open Invitation Page
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-slate-950/80 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <CheckCircle2 className="w-4 h-4" /> Live Engine Active
          </span>
          <span>Security Tokens Valid 14 Days</span>
        </div>
      </motion.div>
    </div>
  );
};
