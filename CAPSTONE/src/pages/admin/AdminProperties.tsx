import React, { useState, useEffect } from 'react';
import { getProperties, getLandlords, getUnits } from '../../services/db.ts';
import { Property, Landlord, Unit } from '../../types/index.ts';
import { Badge, getStatusBadgeVariant } from '../../components/common/Badge.tsx';
import { Search, Building2, MapPin, DoorOpen, Users } from 'lucide-react';

export const AdminProperties: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [landlords, setLandlords] = useState<Landlord[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLandlord, setSelectedLandlord] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [props, lls, uList] = await Promise.all([getProperties(), getLandlords(), getUnits()]);
        setProperties(props);
        setLandlords(lls);
        setUnits(uList);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const getLandlordName = (llId: string) => {
    const found = landlords.find((l) => l.id === llId);
    return found ? found.fullName : 'Landlord (' + llId.substring(0, 8) + ')';
  };

  const getPropertyUnitCounts = (propId: string) => {
    const propUnits = units.filter((u) => u.propertyId === propId);
    const occupied = propUnits.filter((u) => u.status === 'Occupied').length;
    return { total: propUnits.length, occupied };
  };

  const filtered = properties.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLandlord = selectedLandlord === 'all' || p.landlordId === selectedLandlord;
    return matchesSearch && matchesLandlord;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white font-display">All Platform Properties</h1>
        <p className="text-xs text-slate-400 mt-1">
          Administrative portfolio directory of all residential complexes across the platform.
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
            placeholder="Search properties by name or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 bg-slate-950/70 border border-white/10 rounded-xl text-xs text-white focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 font-medium">Landlord:</span>
          <select
            value={selectedLandlord}
            onChange={(e) => setSelectedLandlord(e.target.value)}
            className="px-3 py-2 bg-slate-950/70 border border-white/10 rounded-xl text-xs text-slate-200 font-medium focus:ring-2 focus:ring-cyan-500/50 outline-hidden"
          >
            <option value="all">All Landlords</option>
            {landlords.map((l) => (
              <option key={l.id} value={l.id}>
                {l.fullName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/70 rounded-2xl border border-white/10 shadow-xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/5 text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider font-mono text-[10px]">
              <tr>
                <th className="py-3.5 px-6">Property Name</th>
                <th className="py-3.5 px-6">Landlord Owner</th>
                <th className="py-3.5 px-6">Type & Location</th>
                <th className="py-3.5 px-6">Units & Occupancy</th>
                <th className="py-3.5 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No properties found.
                  </td>
                </tr>
              ) : (
                filtered.map((prop) => {
                  const counts = getPropertyUnitCounts(prop.id);
                  return (
                    <tr key={prop.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-white text-sm flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-cyan-400" />
                          {prop.name}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs truncate">{prop.description || prop.address}</p>
                      </td>
                      <td className="py-4 px-6 font-medium text-white">
                        {getLandlordName(prop.landlordId)}
                      </td>
                      <td className="py-4 px-6 space-y-1">
                        <div className="font-medium text-slate-200">{prop.type}</div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span>{prop.city}, {prop.state}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-white font-mono">
                          {counts.occupied} / {counts.total || prop.totalUnits} Units
                        </div>
                        <div className="w-28 bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full"
                            style={{
                              width: `${counts.total > 0 ? (counts.occupied / counts.total) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <Badge variant={getStatusBadgeVariant(prop.status)}>{prop.status}</Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
