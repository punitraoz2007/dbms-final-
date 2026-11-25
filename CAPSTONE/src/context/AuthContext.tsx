import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types/index.ts';
import { getUserProfile, saveUserProfile, seedInitialDataIfEmpty, getLandlords, getTenants } from '../services/db.ts';

interface AuthContextType {
  currentUser: UserProfile | null;
  isLoading: boolean;
  login: (email: string, role?: UserRole) => Promise<boolean>;
  logout: () => void;
  switchDemoRole: (role: UserRole) => Promise<void>;
  updateCurrentProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USERS: Record<UserRole, UserProfile> = {
  admin: {
    id: 'admin_rentease',
    email: 'admin@rentease.com',
    fullName: 'RentEase Admin',
    role: 'admin',
    phone: '+91 80000 11222',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  landlord: {
    id: 'll_rahul_sharma',
    email: 'rahul@example.com',
    fullName: 'Rahul Sharma',
    role: 'landlord',
    phone: '+91 98765 43210',
    city: 'Bengaluru',
    address: '42, Indiranagar 100ft Road',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  tenant: {
    id: 'tenant_amit_user',
    email: 'amit@example.com',
    fullName: 'Amit Kumar',
    role: 'tenant',
    phone: '+91 99887 76655',
    status: 'active',
    landlordId: 'll_rahul_sharma',
    propertyId: 'prop_green_residency',
    unitId: 'unit_101',
    tenantRecordId: 'ten_amit_kumar',
    createdAt: new Date().toISOString(),
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth & check seed data
  useEffect(() => {
    async function initAuth() {
      try {
        // Automatically seed demo data if fresh database
        await seedInitialDataIfEmpty();

        const storedUserId = localStorage.getItem('rentease_current_user_id');
        const storedRole = (localStorage.getItem('rentease_current_role') as UserRole) || 'admin';

        if (storedUserId) {
          const profile = await getUserProfile(storedUserId);
          if (profile && profile.status === 'active') {
            setCurrentUser(profile);
            setIsLoading(false);
            return;
          }
        }

        // Default to admin demo user for effortless first-run testing
        const defaultProfile = DEMO_USERS[storedRole] || DEMO_USERS.admin;
        setCurrentUser(defaultProfile);
        localStorage.setItem('rentease_current_user_id', defaultProfile.id);
        localStorage.setItem('rentease_current_role', defaultProfile.role);
      } catch (err) {
        console.error('Error initializing auth:', err);
        setCurrentUser(DEMO_USERS.admin);
      } finally {
        setIsLoading(false);
      }
    }
    initAuth();
  }, []);

  const login = async (email: string, selectedRole?: UserRole): Promise<boolean> => {
    setIsLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();

      // Check against landlords
      const landlords = await getLandlords();
      const matchedLandlord = landlords.find((l) => l.email.toLowerCase() === cleanEmail);

      if (matchedLandlord) {
        const profile: UserProfile = {
          id: matchedLandlord.id,
          email: matchedLandlord.email,
          fullName: matchedLandlord.fullName,
          phone: matchedLandlord.phone,
          city: matchedLandlord.city,
          address: matchedLandlord.address,
          role: 'landlord',
          status: matchedLandlord.status,
          createdAt: matchedLandlord.createdAt,
        };
        await saveUserProfile(profile);
        setCurrentUser(profile);
        localStorage.setItem('rentease_current_user_id', profile.id);
        localStorage.setItem('rentease_current_role', 'landlord');
        return true;
      }

      // Check against tenants
      const tenants = await getTenants();
      const matchedTenant = tenants.find((t) => t.email.toLowerCase() === cleanEmail);

      if (matchedTenant) {
        const profile: UserProfile = {
          id: matchedTenant.userId || ('usr_' + matchedTenant.id),
          email: matchedTenant.email,
          fullName: matchedTenant.fullName,
          phone: matchedTenant.phone,
          role: 'tenant',
          status: matchedTenant.status === 'Active' ? 'active' : 'disabled',
          landlordId: matchedTenant.landlordId,
          propertyId: matchedTenant.propertyId,
          unitId: matchedTenant.unitId,
          tenantRecordId: matchedTenant.id,
          createdAt: matchedTenant.createdAt,
        };
        await saveUserProfile(profile);
        setCurrentUser(profile);
        localStorage.setItem('rentease_current_user_id', profile.id);
        localStorage.setItem('rentease_current_role', 'tenant');
        return true;
      }

      // Check admin
      if (cleanEmail === 'admin@rentease.com' || cleanEmail.includes('admin')) {
        const adminProfile = DEMO_USERS.admin;
        setCurrentUser(adminProfile);
        localStorage.setItem('rentease_current_user_id', adminProfile.id);
        localStorage.setItem('rentease_current_role', 'admin');
        return true;
      }

      // If user specified role explicitly (e.g. testing)
      if (selectedRole && DEMO_USERS[selectedRole]) {
        const demo = { ...DEMO_USERS[selectedRole], email: cleanEmail };
        setCurrentUser(demo);
        localStorage.setItem('rentease_current_user_id', demo.id);
        localStorage.setItem('rentease_current_role', demo.role);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const switchDemoRole = async (role: UserRole) => {
    setIsLoading(true);
    try {
      const demo = DEMO_USERS[role];
      setCurrentUser(demo);
      localStorage.setItem('rentease_current_user_id', demo.id);
      localStorage.setItem('rentease_current_role', role);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('rentease_current_user_id');
    localStorage.removeItem('rentease_current_role');
  };

  const updateCurrentProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated: UserProfile = { ...currentUser, ...updates, updatedAt: new Date().toISOString() };
    await saveUserProfile(updated);
    setCurrentUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        login,
        logout,
        switchDemoRole,
        updateCurrentProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
