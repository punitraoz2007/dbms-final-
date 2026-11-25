import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInvitationByToken, acceptTenantInvitation, acceptLandlordInvitation } from '../../services/db.ts';
import { Invitation } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useNotifications } from '../../context/NotificationContext.tsx';
import {
  Building2,
  Calendar,
  CreditCard,
  User,
  Phone,
  Lock,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Home,
  ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const InvitationPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState<'preview' | 'register'>('preview');

  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const { addToast } = useNotifications();
  const navigate = useNavigate();

  useEffect(() => {
    async function loadInvite() {
      if (!token) return;
      try {
        const inv = await getInvitationByToken(token);
        if (inv) {
          setInvitation(inv);
          setFullName(inv.fullName || '');
          setEmail(inv.email || '');
          setPhone(inv.phone || '');
          setCity(inv.city || '');
          setAddress(inv.address || '');
        }
      } catch (err) {
        console.error('Error fetching invitation:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadInvite();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation) return;

    if (password !== confirmPassword) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Passwords do not match.',
      });
      return;
    }

    if (password.length < 6) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Password must be at least 6 characters.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const generatedUserId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

      if (invitation.type === 'tenant') {
        await acceptTenantInvitation(invitation, generatedUserId, {
          fullName,
          phone,
          email,
        });

        addToast({
          type: 'success',
          title: 'Account Activated!',
          message: `Welcome to RentEase, ${fullName}! Your unit and lease have been activated.`,
        });

        await login(email, 'tenant');
        navigate('/tenant/dashboard');
      } else {
        await acceptLandlordInvitation(invitation, generatedUserId, {
          fullName,
          phone,
          email,
          city,
          address,
        });

        addToast({
          type: 'success',
          title: 'Landlord Account Activated!',
          message: `Welcome, ${fullName}! You can now manage your properties and units.`,
        });

        await login(email, 'landlord');
        navigate('/landlord/dashboard');
      }
    } catch (err: any) {
      console.error('Failed to accept invitation:', err);
      addToast({
        type: 'error',
        title: 'Activation Failed',
        message: err.message || 'Could not complete registration. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(6,182,212,0.4)]" />
          <p className="text-xs text-slate-400 font-mono">Validating cryptographic invitation token...</p>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-4">
        <div className="bg-slate-900/80 border border-white/10 max-w-md w-full p-8 rounded-3xl shadow-2xl backdrop-blur-xl text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white font-display">Invalid or Expired Invitation</h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            This invitation token cannot be verified or has already expired. Please request a new invitation link from your property manager.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="mt-6 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
          >
            Return to Sign In
          </button>
        </div>
      </div>
    );
  }

  if (invitation.status === 'Accepted') {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-4">
        <div className="bg-slate-900/80 border border-white/10 max-w-md w-full p-8 rounded-3xl shadow-2xl backdrop-blur-xl text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white font-display">Invitation Already Accepted</h3>
          <p className="text-xs text-slate-400 mt-2">
            This invitation was already accepted and the account has been provisioned.
          </p>
          <button
            onClick={() => {
              login(invitation.email, invitation.type);
              navigate(invitation.type === 'tenant' ? '/tenant/dashboard' : '/landlord/dashboard');
            }}
            className="mt-6 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
          >
            Access Workspace Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d16] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden text-slate-100">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[128px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6 relative z-10">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.35)] mb-2.5 border border-cyan-300/30">
          <Building2 className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight font-display">RentEase</h2>
        <p className="text-xs text-slate-400 font-mono">2026 Verified Onboarding Portal</p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        <div className="bg-slate-900/80 backdrop-blur-2xl py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

          {step === 'preview' ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="text-center pb-6 border-b border-white/10">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-300 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30">
                  {invitation.type === 'tenant' ? 'Tenant Assignment' : 'Landlord Appointment'}
                </span>
                <h3 className="text-xl font-bold text-white mt-3 font-display">
                  You've been invited to RentEase
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {invitation.type === 'tenant'
                    ? 'Review your tenancy assignment and contract parameters below.'
                    : 'You have been granted platform access as a verified Landlord.'}
                </p>
              </div>

              {/* Assignment Details Card */}
              <div className="my-6 space-y-3 bg-slate-950/70 p-5 rounded-2xl border border-white/10 text-xs">
                {invitation.type === 'tenant' ? (
                  <>
                    <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                      <span className="text-slate-400 font-medium">Landlord:</span>
                      <span className="font-bold text-white">{invitation.landlordName || 'Rahul Sharma'}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                      <span className="text-slate-400 font-medium">Property:</span>
                      <span className="font-bold text-white">{invitation.propertyName || 'Green Residency'}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                      <span className="text-slate-400 font-medium">Assigned Unit:</span>
                      <span className="font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                        Unit {invitation.unitNumber || '101'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                      <span className="text-slate-400 font-medium">Monthly Rent:</span>
                      <span className="font-bold text-emerald-400 text-sm font-mono">
                        ₹{invitation.monthlyRent?.toLocaleString() || '20,000'}/mo
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                      <span className="text-slate-400 font-medium">Security Deposit:</span>
                      <span className="font-semibold text-slate-200 font-mono">
                        ₹{invitation.securityDeposit?.toLocaleString() || '40,000'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-slate-400 font-medium">Lease Term:</span>
                      <span className="font-mono text-slate-200">
                        {invitation.leaseStartDate || '01 Oct 2026'} - {invitation.leaseEndDate || '30 Sep 2027'}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                      <span className="text-slate-400 font-medium">Assigned Role:</span>
                      <span className="font-bold text-cyan-400">Property Landlord</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                      <span className="text-slate-400 font-medium">Invited Name:</span>
                      <span className="font-bold text-white">{invitation.fullName}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                      <span className="text-slate-400 font-medium">Location:</span>
                      <span className="font-semibold text-slate-200">{invitation.city || 'Bengaluru'}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-slate-400 font-medium">Account Email:</span>
                      <span className="font-mono text-slate-200">{invitation.email}</span>
                    </div>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => setStep('register')}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
              >
                <span>Accept Terms & Create Password</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          ) : (
            <motion.form
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleSubmit}
              className="space-y-4 text-xs"
            >
              <div className="text-center pb-4 border-b border-white/10">
                <h3 className="text-lg font-bold text-white font-display">Set Up Account Credentials</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure your password to finalize your {invitation.type} profile.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Full Name</label>
                <div className="relative rounded-xl">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-white/15 rounded-xl text-xs text-white focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Email Address</label>
                <div className="relative rounded-xl">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="block w-full pl-9 pr-3 py-2.5 bg-slate-950/40 border border-white/5 rounded-xl text-xs text-slate-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Phone Number</label>
                <div className="relative rounded-xl">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-white/15 rounded-xl text-xs text-white focus:ring-2 focus:ring-cyan-500/50 outline-hidden font-mono"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              {invitation.type === 'landlord' && (
                <>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="block w-full px-3 py-2.5 bg-slate-950/80 border border-white/15 rounded-xl text-xs text-white focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Office / Address</label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="block w-full px-3 py-2.5 bg-slate-950/80 border border-white/15 rounded-xl text-xs text-white focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Create Password</label>
                <div className="relative rounded-xl">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-white/15 rounded-xl text-xs text-white focus:ring-2 focus:ring-cyan-500/50 outline-hidden font-mono"
                    placeholder="At least 6 characters"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Confirm Password</label>
                <div className="relative rounded-xl">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-white/15 rounded-xl text-xs text-white focus:ring-2 focus:ring-cyan-500/50 outline-hidden font-mono"
                    placeholder="Repeat password"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('preview')}
                  className="w-1/3 py-2.5 px-3 border border-white/15 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Activating...' : 'Complete Activation'}
                </button>
              </div>
            </motion.form>
          )}
        </div>
      </div>
    </div>
  );
};
