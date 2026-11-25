import React, { useState, useEffect } from 'react';
import { getTenants, getProperties, getLandlords, getUnits } from '../../services/db.ts';
import { Tenant, Property, Landlord, Unit } from '../../types/index.ts';
import { Badge, getStatusBadgeVariant } from '../../components/common/Badge.tsx';
import { Search, Mail, Phone, Calendar, UserCheck } from 'lucide-react';

export const AdminTenants: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [landlords, setLandlords] = useState<Landlord[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [tList, pList, lList, uList] = await Promise.all([
          getTenants(),
          getProperties(),
          getLandlords(),
          getUnits(),
        ]);
        setTenants(tList);
        setProperties(pList);
        setLandlords(lList);
        setUnits(uList);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const getPropertyName = (pId: string) => {
    const found = properties.find((p) => p.id === pId);
    return found ? found.name : 'Unknown Property';
  };

  const getLandlordName = (lId: string) => {
    const found = landlords.find((l) => l.id === lId);
    return found ? found.fullName : 'Landlord';
  };

  const getUnitNumber = (uId: string) => {
    const found = units.find((u) => u.id === uId);
    return found ? found.unitNumber : '—';
  };

  const filtered = tenants.filter((t) => {
    return (
      t.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.phone.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white font-display">All Platform Tenants</h1>
        <p className="text-xs text-slate-400 mt-1">Directory of all tenants registered across properties.</p>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900/70 p-4 rounded-2xl border border-white/10 shadow-lg backdrop-blur-xl flex items-center justify-between">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search tenant by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 bg-slate-950/70 border border-white/10 rounded-xl text-xs text-white focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/70 rounded-2xl border border-white/10 shadow-xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/5 text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider font-mono text-[10px]">
              <tr>
                <th className="py-3.5 px-6">Tenant Name</th>
                <th className="py-3.5 px-6">Assigned Property & Unit</th>
                <th className="py-3.5 px-6">Landlord</th>
                <th className="py-3.5 px-6">Monthly Rent</th>
                <th className="py-3.5 px-6">Lease Validity</th>
                <th className="py-3.5 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No tenants found.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-white text-sm flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-cyan-400" />
                        {t.fullName}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 space-x-2 font-mono">
                        <span>{t.email}</span>
                        <span>·</span>
                        <span>{t.phone}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 space-y-0.5">
                      <div className="font-semibold text-white">{getPropertyName(t.propertyId)}</div>
                      <div className="text-cyan-400 font-mono font-medium">Unit {getUnitNumber(t.unitId)}</div>
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-200">{getLandlordName(t.landlordId)}</td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-white font-mono">₹{t.monthlyRent?.toLocaleString()}</div>
                      <div className="text-[11px] text-slate-400 font-mono">Deposit: ₹{t.securityDeposit?.toLocaleString()}</div>
                    </td>
                    <td className="py-4 px-6 text-slate-300">
                      <div className="flex items-center gap-1.5 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>
                          {t.leaseStartDate} to {t.leaseEndDate}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Badge variant={getStatusBadgeVariant(t.status)}>{t.status}</Badge>
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
