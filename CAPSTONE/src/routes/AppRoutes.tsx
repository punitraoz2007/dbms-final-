import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { AppLayout } from '../components/layout/AppLayout.tsx';

// Auth Pages
import { LoginPage } from '../pages/auth/LoginPage.tsx';
import { InvitationPage } from '../pages/auth/InvitationPage.tsx';

// Admin Pages
import { AdminDashboard } from '../pages/admin/AdminDashboard.tsx';
import { AdminLandlords } from '../pages/admin/AdminLandlords.tsx';
import { AdminProperties } from '../pages/admin/AdminProperties.tsx';
import { AdminTenants } from '../pages/admin/AdminTenants.tsx';
import { AdminInvitations } from '../pages/admin/AdminInvitations.tsx';
import { AdminActivity } from '../pages/admin/AdminActivity.tsx';
import { AdminSettings } from '../pages/admin/AdminSettings.tsx';

// Landlord Pages
import { LandlordDashboard } from '../pages/landlord/LandlordDashboard.tsx';
import { LandlordProperties } from '../pages/landlord/LandlordProperties.tsx';
import { LandlordUnits } from '../pages/landlord/LandlordUnits.tsx';
import { LandlordTenants } from '../pages/landlord/LandlordTenants.tsx';
import { LandlordLeases } from '../pages/landlord/LandlordLeases.tsx';
import { LandlordPayments } from '../pages/landlord/LandlordPayments.tsx';
import { LandlordComplaints } from '../pages/landlord/LandlordComplaints.tsx';
import { LandlordNotices } from '../pages/landlord/LandlordNotices.tsx';

// Tenant Pages
import { TenantDashboard } from '../pages/tenant/TenantDashboard.tsx';
import { TenantLease } from '../pages/tenant/TenantLease.tsx';
import { TenantPayments } from '../pages/tenant/TenantPayments.tsx';
import { TenantComplaints } from '../pages/tenant/TenantComplaints.tsx';
import { TenantNotices } from '../pages/tenant/TenantNotices.tsx';
import { TenantProfile } from '../pages/tenant/TenantProfile.tsx';

// Protected Route Guard with strict Role Isolation
const ProtectedRoute: React.FC<{ allowedRole: 'admin' | 'landlord' | 'tenant'; children: React.ReactNode }> = ({
  allowedRole,
  children,
}) => {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#090d16] text-white gap-3">
        <div className="w-9 h-9 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(6,182,212,0.4)]" />
        <p className="text-xs text-slate-400 font-mono tracking-wider">Verifying Session...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Prevent users from manually navigating to another role's dashboard
  if (currentUser.role !== allowedRole) {
    if (currentUser.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (currentUser.role === 'landlord') return <Navigate to="/landlord/dashboard" replace />;
    return <Navigate to="/tenant/dashboard" replace />;
  }

  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  const { currentUser, isLoading } = useAuth();

  const getDefaultRedirect = () => {
    if (!currentUser) return '/login';
    if (currentUser.role === 'admin') return '/admin/dashboard';
    if (currentUser.role === 'landlord') return '/landlord/dashboard';
    return '/tenant/dashboard';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#090d16] text-white gap-3">
        <div className="w-9 h-9 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(6,182,212,0.4)]" />
        <p className="text-xs text-slate-400 font-mono tracking-wider">Loading RentEase Workspace...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/invite/:token" element={<InvitationPage />} />

      {/* Admin Protected Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRole="admin">
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="landlords" element={<AdminLandlords />} />
        <Route path="properties" element={<AdminProperties />} />
        <Route path="tenants" element={<AdminTenants />} />
        <Route path="invitations" element={<AdminInvitations />} />
        <Route path="activity" element={<AdminActivity />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* Landlord Protected Routes */}
      <Route
        path="/landlord"
        element={
          <ProtectedRoute allowedRole="landlord">
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/landlord/dashboard" replace />} />
        <Route path="dashboard" element={<LandlordDashboard />} />
        <Route path="properties" element={<LandlordProperties />} />
        <Route path="units" element={<LandlordUnits />} />
        <Route path="tenants" element={<LandlordTenants />} />
        <Route path="leases" element={<LandlordLeases />} />
        <Route path="payments" element={<LandlordPayments />} />
        <Route path="complaints" element={<LandlordComplaints />} />
        <Route path="notices" element={<LandlordNotices />} />
      </Route>

      {/* Tenant Protected Routes */}
      <Route
        path="/tenant"
        element={
          <ProtectedRoute allowedRole="tenant">
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/tenant/dashboard" replace />} />
        <Route path="dashboard" element={<TenantDashboard />} />
        <Route path="lease" element={<TenantLease />} />
        <Route path="payments" element={<TenantPayments />} />
        <Route path="complaints" element={<TenantComplaints />} />
        <Route path="notices" element={<TenantNotices />} />
        <Route path="profile" element={<TenantProfile />} />
      </Route>

      {/* Root & Catch All */}
      <Route path="/" element={<Navigate to={getDefaultRedirect()} replace />} />
      <Route path="*" element={<Navigate to={getDefaultRedirect()} replace />} />
    </Routes>
  );
};
