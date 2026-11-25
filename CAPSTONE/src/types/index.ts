export type UserRole = 'admin' | 'landlord' | 'tenant';

export type UserStatus = 'active' | 'disabled';

export interface UserProfile {
  id: string; // firebase auth uid
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  city?: string;
  address?: string;
  status: UserStatus;
  landlordId?: string; // If tenant, points to landlord id
  propertyId?: string; // If tenant, points to assigned property
  unitId?: string; // If tenant, points to assigned unit
  tenantRecordId?: string; // references tenants collection doc id
  createdAt: string;
  updatedAt?: string;
}

export interface Landlord {
  id: string;
  userId?: string;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  status: 'active' | 'disabled';
  createdAt: string;
}

export type PropertyType = 'Apartment' | 'House' | 'Villa' | 'PG' | 'Commercial' | 'Other';
export type PropertyStatus = 'Active' | 'Under Maintenance' | 'Inactive';

export interface Property {
  id: string;
  landlordId: string;
  name: string;
  type: PropertyType;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  description?: string;
  totalUnits: number;
  status: PropertyStatus;
  createdAt: string;
}

export type FurnishingStatus = 'Furnished' | 'Semi-Furnished' | 'Unfurnished';
export type UnitStatus = 'Available' | 'Occupied' | 'Maintenance';

export interface Unit {
  id: string;
  propertyId: string;
  landlordId: string;
  unitNumber: string;
  floor: string;
  monthlyRent: number;
  securityDeposit: number;
  furnishingStatus: FurnishingStatus;
  status: UnitStatus;
  currentTenantId?: string;
  currentTenantName?: string;
  createdAt: string;
}

export interface Tenant {
  id: string;
  userId?: string;
  landlordId: string;
  propertyId: string;
  unitId: string;
  fullName: string;
  email: string;
  phone: string;
  leaseStartDate: string;
  leaseEndDate: string;
  monthlyRent: number;
  securityDeposit: number;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export type LeaseStatus = 'Active' | 'Expired' | 'Terminated' | 'Pending';

export interface Lease {
  id: string;
  landlordId: string;
  tenantId: string;
  propertyId: string;
  unitId: string;
  tenantName: string;
  propertyName: string;
  unitNumber: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit: number;
  status: LeaseStatus;
  createdAt: string;
}

export type PaymentMethod = 'Bank Transfer' | 'UPI' | 'Cash' | 'Cheque' | 'Card';
export type PaymentStatus = 'Paid' | 'Pending' | 'Overdue';

export interface Payment {
  id: string;
  landlordId: string;
  tenantId: string;
  leaseId?: string;
  propertyId: string;
  propertyName?: string;
  unitId: string;
  tenantName: string;
  unitNumber: string;
  amount: number;
  dueDate: string;
  paymentDate?: string;
  paymentMethod?: PaymentMethod;
  status: PaymentStatus;
  transactionRef?: string;
  notes?: string;
  createdAt: string;
}

export type ComplaintCategory = 'Plumbing' | 'Electricity' | 'Maintenance' | 'Internet' | 'Security' | 'Other';
export type ComplaintPriority = 'Low' | 'Medium' | 'High';
export type ComplaintStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';

export interface Complaint {
  id: string;
  landlordId: string;
  tenantId: string;
  tenantName: string;
  propertyId: string;
  propertyName: string;
  unitId: string;
  unitNumber: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Notice {
  id: string;
  landlordId: string;
  propertyId?: string;
  propertyName?: string;
  title: string;
  message: string;
  targetTenants: string; // 'All' | 'Property'
  date: string;
  expiryDate?: string;
  createdAt: string;
}

export type InvitationType = 'landlord' | 'tenant';
export type InvitationStatus = 'Pending' | 'Accepted' | 'Expired';

export interface Invitation {
  id: string;
  type: InvitationType;
  email: string;
  fullName: string;
  phone?: string;
  landlordId?: string;
  landlordName?: string;
  propertyId?: string;
  propertyName?: string;
  unitId?: string;
  unitNumber?: string;
  monthlyRent?: number;
  securityDeposit?: number;
  leaseStartDate?: string;
  leaseEndDate?: string;
  city?: string;
  address?: string;
  status: InvitationStatus;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  details: string;
  targetType: string;
  targetId?: string;
  landlordId?: string;
  createdAt: string;
}

export interface SimulatedEmail {
  id: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  invitationToken: string;
  invitationType: InvitationType;
  propertyName?: string;
  unitNumber?: string;
  monthlyRent?: number;
  sentAt: string;
}
