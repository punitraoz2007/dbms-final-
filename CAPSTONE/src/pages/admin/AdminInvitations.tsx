import React, { useState, useEffect } from 'react';
import { getInvitations } from '../../services/db.ts';
import { Invitation } from '../../types/index.ts';
import { Badge, getStatusBadgeVariant } from '../../components/common/Badge.tsx';
import { useNotifications } from '../../context/NotificationContext.tsx';
import { Search, Mail, ExternalLink, Copy, Check, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AdminInvitations: React.FC = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'landlord' | 'tenant'>('all');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { addToast } = useNotifications();
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      try {
        const invs = await getInvitations();
        setInvitations(invs);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

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

  const filtered = invitations.filter((inv) => {
    const matchesSearch =
      inv.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.token.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || inv.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white font-display">System Invitations Tracker</h1>
        <p className="text-xs text-slate-400 mt-1">
          Monitor all outbound cryptographic onboarding tokens for Landlords and Tenants.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/70 p-4 rounded-2xl border border-white/10 shadow-lg backdrop-blur-xl flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search by name, email, or token..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 bg-slate-950/70 border border-white/10 rounded-xl text-xs text-white focus:ring-2 focus:ring-cyan-500/50 outline-hidden font-mono"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 font-medium">Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-950/70 border border-white/10 rounded-xl text-xs text-slate-200 font-medium focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
          >
            <option value="all">All Invitations</option>
            <option value="landlord">Landlords Only</option>
            <option value="tenant">Tenants Only</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/70 rounded-2xl border border-white/10 shadow-xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/5 text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider font-mono text-[10px]">
              <tr>
                <th className="py-3.5 px-6">Invitee</th>
                <th className="py-3.5 px-6">Target Role</th>
                <th className="py-3.5 px-6">Assignment Details</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Date Dispatched</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No invitations on record.
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-white text-sm">{inv.fullName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{inv.email}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="capitalize font-mono font-semibold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded text-[11px]">
                        {inv.type}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {inv.type === 'tenant' ? (
                        <div className="space-y-0.5">
                          <p className="font-semibold text-white">{inv.propertyName}</p>
                          <p className="text-[11px] text-cyan-400 font-mono">Unit {inv.unitNumber} · ₹{inv.monthlyRent?.toLocaleString()}/mo</p>
                        </div>
                      ) : (
                        <div className="text-slate-300">{inv.city || 'City Location'}</div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <Badge variant={getStatusBadgeVariant(inv.status)}>{inv.status}</Badge>
                    </td>
                    <td className="py-4 px-6 text-slate-400 font-mono">
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => copyInviteLink(inv.token)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-white/10 hover:border-cyan-500/40 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Copy Invitation URL"
                      >
                        {copiedToken === inv.token ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>

                      {inv.status === 'Pending' && (
                        <button
                          onClick={() => navigate(`/invite/${inv.token}`)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium rounded-lg shadow-sm transition-all"
                          title="Open invitation in current session"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Open</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
