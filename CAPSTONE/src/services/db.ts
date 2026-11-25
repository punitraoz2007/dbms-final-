import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Query,
  DocumentData,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase.ts';
import {
  UserProfile,
  Landlord,
  Property,
  Unit,
  Tenant,
  Lease,
  Payment,
  Complaint,
  Notice,
  Invitation,
  ActivityLog,
} from '../types/index.ts';

// Helper to strip undefined values so Firestore never rejects payloads
function cleanUndefined<T extends Record<string, any>>(obj: T): T {
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

// -------------------------------------------------------------
// Activity Logging
// -------------------------------------------------------------
export async function logActivity(
  actorId: string,
  actorName: string,
  actorRole: UserProfile['role'],
  action: string,
  details: string,
  targetType: string,
  targetId?: string,
  landlordId?: string
) {
  const path = 'activity_logs';
  try {
    const logId = 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newLog: ActivityLog = {
      id: logId,
      actorId,
      actorName,
      actorRole,
      action,
      details,
      targetType,
      createdAt: new Date().toISOString(),
      ...(targetId ? { targetId } : {}),
      ...(landlordId ? { landlordId } : {}),
    };
    await setDoc(doc(db, path, logId), newLog);
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

export async function getActivityLogs(landlordId?: string, maxLogs: number = 20): Promise<ActivityLog[]> {
  const path = 'activity_logs';
  try {
    const colRef = collection(db, path);
    let q = query(colRef, orderBy('createdAt', 'desc'), limit(maxLogs));
    if (landlordId) {
      q = query(colRef, where('landlordId', '==', landlordId), limit(maxLogs));
    }
    const snap = await getDocs(q);
    const logs = snap.docs.map((d) => d.data() as ActivityLog);
    return logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    // If indexing or rules fail, return empty gracefully without crashing page
    console.warn('Could not fetch activity logs:', error);
    return [];
  }
}

// -------------------------------------------------------------
// Users / Profiles
// -------------------------------------------------------------
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const path = `users/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const path = `users/${profile.id}`;
  try {
    await setDoc(doc(db, 'users', profile.id), cleanUndefined(profile), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// -------------------------------------------------------------
// Landlords
// -------------------------------------------------------------
export async function getLandlords(): Promise<Landlord[]> {
  const path = 'landlords';
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map((d) => d.data() as Landlord);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function getLandlordById(id: string): Promise<Landlord | null> {
  const path = `landlords/${id}`;
  try {
    const snap = await getDoc(doc(db, 'landlords', id));
    return snap.exists() ? (snap.data() as Landlord) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function createLandlord(
  landlordData: Omit<Landlord, 'id' | 'createdAt'>,
  actor: { id: string; name: string; role: UserProfile['role'] }
): Promise<Landlord> {
  const path = 'landlords';
  try {
    const id = 'll_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const newLandlord: Landlord = {
      ...landlordData,
      id,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, path, id), newLandlord);

    // Create landlord invitation
    const token = 'inv_ll_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const invitation: Invitation = {
      id: 'inv_' + Date.now(),
      type: 'landlord',
      email: landlordData.email,
      fullName: landlordData.fullName,
      phone: landlordData.phone,
      city: landlordData.city,
      address: landlordData.address,
      status: 'Pending',
      token,
      expiresAt,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'invitations', invitation.id), invitation);

    await logActivity(
      actor.id,
      actor.name,
      actor.role,
      'Created Landlord',
      `Admin added landlord ${landlordData.fullName} (${landlordData.email})`,
      'landlord',
      id
    );

    return newLandlord;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateLandlord(
  id: string,
  data: Partial<Landlord>,
  actor: { id: string; name: string; role: UserProfile['role'] }
): Promise<void> {
  const path = `landlords/${id}`;
  try {
    await updateDoc(doc(db, 'landlords', id), data);
    await logActivity(
      actor.id,
      actor.name,
      actor.role,
      'Updated Landlord',
      `Updated details for landlord ID: ${id}`,
      'landlord',
      id
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// -------------------------------------------------------------
// Properties
// -------------------------------------------------------------
export async function getProperties(landlordId?: string): Promise<Property[]> {
  const path = 'properties';
  try {
    const colRef = collection(db, path);
    const q: Query<DocumentData> = landlordId ? query(colRef, where('landlordId', '==', landlordId)) : colRef;
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Property);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function getPropertyById(id: string): Promise<Property | null> {
  const path = `properties/${id}`;
  try {
    const snap = await getDoc(doc(db, 'properties', id));
    return snap.exists() ? (snap.data() as Property) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function createProperty(
  data: Omit<Property, 'id' | 'createdAt'>,
  actor: { id: string; name: string; role: UserProfile['role'] }
): Promise<Property> {
  const path = 'properties';
  try {
    const id = 'prop_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const newProperty: Property = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, path, id), newProperty);
    await logActivity(
      actor.id,
      actor.name,
      actor.role,
      'Created Property',
      `${actor.name} added property "${data.name}" in ${data.city}`,
      'property',
      id,
      data.landlordId
    );
    return newProperty;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateProperty(
  id: string,
  data: Partial<Property>,
  actor: { id: string; name: string; role: UserProfile['role'] }
): Promise<void> {
  const path = `properties/${id}`;
  try {
    await updateDoc(doc(db, 'properties', id), data);
    await logActivity(
      actor.id,
      actor.name,
      actor.role,
      'Updated Property',
      `Updated property "${data.name || id}"`,
      'property',
      id
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteProperty(
  id: string,
  propertyName: string,
  landlordId: string,
  actor: { id: string; name: string; role: UserProfile['role'] }
): Promise<void> {
  const path = `properties/${id}`;
  try {
    await deleteDoc(doc(db, 'properties', id));
    await logActivity(
      actor.id,
      actor.name,
      actor.role,
      'Deleted Property',
      `Deleted property "${propertyName}"`,
      'property',
      id,
      landlordId
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// -------------------------------------------------------------
// Units
// -------------------------------------------------------------
export async function getUnits(propertyId?: string, landlordId?: string): Promise<Unit[]> {
  const path = 'units';
  try {
    const colRef = collection(db, path);
    let q: Query<DocumentData> = colRef;
    if (propertyId && landlordId) {
      q = query(colRef, where('landlordId', '==', landlordId), where('propertyId', '==', propertyId));
    } else if (propertyId) {
      q = query(colRef, where('propertyId', '==', propertyId));
    } else if (landlordId) {
      q = query(colRef, where('landlordId', '==', landlordId));
    }
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Unit);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function getUnitById(id: string): Promise<Unit | null> {
  const path = `units/${id}`;
  try {
    const snap = await getDoc(doc(db, 'units', id));
    return snap.exists() ? (snap.data() as Unit) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function createUnit(
  data: Omit<Unit, 'id' | 'createdAt'>,
  actor: { id: string; name: string; role: UserProfile['role'] }
): Promise<Unit> {
  const path = 'units';
  try {
    const id = 'unit_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const newUnit: Unit = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, path, id), newUnit);
    await logActivity(
      actor.id,
      actor.name,
      actor.role,
      'Created Unit',
      `Added Unit ${data.unitNumber} (Rent: ₹${data.monthlyRent.toLocaleString()})`,
      'unit',
      id,
      data.landlordId
    );
    return newUnit;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateUnit(
  id: string,
  data: Partial<Unit>,
  actor: { id: string; name: string; role: UserProfile['role'] }
): Promise<void> {
  const path = `units/${id}`;
  try {
    await updateDoc(doc(db, 'units', id), data);
    await logActivity(
      actor.id,
      actor.name,
      actor.role,
      'Updated Unit',
      `Updated unit ${data.unitNumber || id}`,
      'unit',
      id
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteUnit(
  id: string,
  unitNumber: string,
  landlordId: string,
  actor: { id: string; name: string; role: UserProfile['role'] }
): Promise<void> {
  const path = `units/${id}`;
  try {
    await deleteDoc(doc(db, 'units', id));
    await logActivity(
      actor.id,
      actor.name,
      actor.role,
      'Deleted Unit',
      `Deleted Unit ${unitNumber}`,
      'unit',
      id,
      landlordId
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// -------------------------------------------------------------
// Tenants
// -------------------------------------------------------------
export async function getTenants(landlordId?: string): Promise<Tenant[]> {
  const path = 'tenants';
  try {
    const colRef = collection(db, path);
    const q = landlordId ? query(colRef, where('landlordId', '==', landlordId)) : colRef;
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Tenant);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function getTenantById(id: string): Promise<Tenant | null> {
  const path = `tenants/${id}`;
  try {
    const snap = await getDoc(doc(db, 'tenants', id));
    return snap.exists() ? (snap.data() as Tenant) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function getTenantByUserId(userId: string): Promise<Tenant | null> {
  const path = 'tenants';
  try {
    const q = query(collection(db, path), where('userId', '==', userId), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs[0].data() as Tenant;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// -------------------------------------------------------------
// Tenant Invitations (The Core Workflow)
// -------------------------------------------------------------
export async function inviteTenant(
  invitationData: {
    tenantName: string;
    tenantEmail: string;
    phone: string;
    propertyId: string;
    propertyName: string;
    unitId: string;
    unitNumber: string;
    monthlyRent: number;
    securityDeposit: number;
    leaseStartDate: string;
    leaseEndDate: string;
    landlordId: string;
    landlordName: string;
  },
  actor: { id: string; name: string; role: UserProfile['role'] }
): Promise<Invitation> {
  const path = 'invitations';
  try {
    // 1. Check unit availability
    const unitSnap = await getDoc(doc(db, 'units', invitationData.unitId));
    if (!unitSnap.exists()) {
      throw new Error('Selected unit not found');
    }
    const unit = unitSnap.data() as Unit;
    if (unit.landlordId !== invitationData.landlordId) {
      throw new Error('You do not own this unit.');
    }
    if (unit.status === 'Occupied') {
      throw new Error('This unit is already occupied.');
    }

    const token = 'inv_ten_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const id = 'inv_' + Date.now();

    const invitation: Invitation = {
      id,
      type: 'tenant',
      email: invitationData.tenantEmail,
      fullName: invitationData.tenantName,
      phone: invitationData.phone,
      landlordId: invitationData.landlordId,
      landlordName: invitationData.landlordName,
      propertyId: invitationData.propertyId,
      propertyName: invitationData.propertyName,
      unitId: invitationData.unitId,
      unitNumber: invitationData.unitNumber,
      monthlyRent: invitationData.monthlyRent,
      securityDeposit: invitationData.securityDeposit,
      leaseStartDate: invitationData.leaseStartDate,
      leaseEndDate: invitationData.leaseEndDate,
      status: 'Pending',
      token,
      expiresAt,
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, path, id), invitation);

    await logActivity(
      actor.id,
      actor.name,
      actor.role,
      'Invited Tenant',
      `Invited ${invitationData.tenantName} (${invitationData.tenantEmail}) for ${invitationData.propertyName} Unit ${invitationData.unitNumber}`,
      'invitation',
      id,
      invitationData.landlordId
    );

    return invitation;
  } catch (error) {
    if (error instanceof Error && (error.message.includes('already occupied') || error.message.includes('not own'))) {
      throw error;
    }
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getInvitations(type?: 'landlord' | 'tenant', landlordId?: string): Promise<Invitation[]> {
  const path = 'invitations';
  try {
    const colRef = collection(db, path);
    let q: Query<DocumentData> = colRef;
    if (landlordId && type) {
      q = query(colRef, where('landlordId', '==', landlordId), where('type', '==', type));
    } else if (landlordId) {
      q = query(colRef, where('landlordId', '==', landlordId));
    } else if (type) {
      q = query(colRef, where('type', '==', type));
    }
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Invitation);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function getInvitationByToken(token: string): Promise<Invitation | null> {
  const path = 'invitations';
  try {
    const q = query(collection(db, path), where('token', '==', token), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs[0].data() as Invitation;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// -------------------------------------------------------------
// Accept Invitation & Activate Account
// -------------------------------------------------------------
export async function acceptTenantInvitation(
  invitation: Invitation,
  userId: string,
  tenantDetails: { fullName: string; phone: string; email: string }
): Promise<{ tenant: Tenant; lease: Lease }> {
  try {
    // 1. Mark invitation accepted
    await updateDoc(doc(db, 'invitations', invitation.id), {
      status: 'Accepted',
    });

    // 2. Create Tenant Record
    const tenantId = 'ten_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const newTenant: Tenant = {
      id: tenantId,
      userId,
      landlordId: invitation.landlordId!,
      propertyId: invitation.propertyId!,
      unitId: invitation.unitId!,
      fullName: tenantDetails.fullName,
      email: tenantDetails.email,
      phone: tenantDetails.phone,
      leaseStartDate: invitation.leaseStartDate || new Date().toISOString().split('T')[0],
      leaseEndDate: invitation.leaseEndDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      monthlyRent: invitation.monthlyRent || 0,
      securityDeposit: invitation.securityDeposit || 0,
      status: 'Active',
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'tenants', tenantId), newTenant);

    // 3. Create Lease
    const leaseId = 'lease_' + Date.now();
    const newLease: Lease = {
      id: leaseId,
      landlordId: invitation.landlordId!,
      tenantId,
      propertyId: invitation.propertyId!,
      unitId: invitation.unitId!,
      tenantName: tenantDetails.fullName,
      propertyName: invitation.propertyName || 'Property',
      unitNumber: invitation.unitNumber || '101',
      startDate: newTenant.leaseStartDate,
      endDate: newTenant.leaseEndDate,
      monthlyRent: newTenant.monthlyRent,
      securityDeposit: newTenant.securityDeposit,
      status: 'Active',
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'leases', leaseId), newLease);

    // 4. Update Unit to Occupied
    if (invitation.unitId) {
      await updateDoc(doc(db, 'units', invitation.unitId), {
        status: 'Occupied',
        currentTenantId: tenantId,
        currentTenantName: tenantDetails.fullName,
      });
    }

    // 5. Update user profile
    await saveUserProfile({
      id: userId,
      email: tenantDetails.email,
      fullName: tenantDetails.fullName,
      phone: tenantDetails.phone,
      role: 'tenant',
      status: 'active',
      landlordId: invitation.landlordId,
      propertyId: invitation.propertyId,
      unitId: invitation.unitId,
      tenantRecordId: tenantId,
      createdAt: new Date().toISOString(),
    });

    // 6. Generate initial upcoming rent payment
    const paymentId = 'pay_' + Date.now();
    const nextMonthDate = new Date();
    nextMonthDate.setDate(5); // due on 5th
    const initialPayment: Payment = {
      id: paymentId,
      landlordId: invitation.landlordId!,
      tenantId,
      leaseId,
      propertyId: invitation.propertyId!,
      unitId: invitation.unitId!,
      tenantName: tenantDetails.fullName,
      unitNumber: invitation.unitNumber || '101',
      amount: newTenant.monthlyRent,
      dueDate: nextMonthDate.toISOString().split('T')[0],
      paymentMethod: 'UPI',
      status: 'Pending',
      notes: 'First month rent',
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'payments', paymentId), initialPayment);

    // 7. Activity Log
    await logActivity(
      userId,
      tenantDetails.fullName,
      'tenant',
      'Tenant Accepted Invitation',
      `${tenantDetails.fullName} accepted invitation and moved into ${invitation.propertyName} Unit ${invitation.unitNumber}`,
      'tenant',
      tenantId,
      invitation.landlordId
    );

    return { tenant: newTenant, lease: newLease };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'invitations_accept');
  }
}

export async function acceptLandlordInvitation(
  invitation: Invitation,
  userId: string,
  landlordDetails: { fullName: string; phone: string; email: string; city: string; address: string }
): Promise<Landlord> {
  try {
    // 1. Update invitation
    await updateDoc(doc(db, 'invitations', invitation.id), {
      status: 'Accepted',
    });

    // 2. Create or link landlord record
    const landlordId = userId;
    const newLandlord: Landlord = {
      id: landlordId,
      userId,
      fullName: landlordDetails.fullName,
      email: landlordDetails.email,
      phone: landlordDetails.phone,
      city: landlordDetails.city,
      address: landlordDetails.address,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'landlords', landlordId), newLandlord);

    // 3. Update user profile
    await saveUserProfile({
      id: userId,
      email: landlordDetails.email,
      fullName: landlordDetails.fullName,
      phone: landlordDetails.phone,
      city: landlordDetails.city,
      address: landlordDetails.address,
      role: 'landlord',
      status: 'active',
      createdAt: new Date().toISOString(),
    });

    // 4. Activity Log
    await logActivity(
      userId,
      landlordDetails.fullName,
      'landlord',
      'Landlord Accepted Invitation',
      `${landlordDetails.fullName} activated landlord account`,
      'landlord',
      landlordId
    );

    return newLandlord;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'landlords_accept');
  }
}

// -------------------------------------------------------------
// Leases
// -------------------------------------------------------------
export async function getLeases(landlordId?: string, tenantId?: string): Promise<Lease[]> {
  const path = 'leases';
  try {
    const colRef = collection(db, path);
    let q: Query<DocumentData> = colRef;
    if (landlordId) {
      q = query(colRef, where('landlordId', '==', landlordId));
    } else if (tenantId) {
      q = query(colRef, where('tenantId', '==', tenantId));
    }
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Lease);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function createLease(
  data: Omit<Lease, 'id' | 'createdAt'>,
  actor: { id: string; name: string; role: UserProfile['role'] }
): Promise<Lease> {
  const path = 'leases';
  try {
    const id = 'lease_' + Date.now();
    const newLease: Lease = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, path, id), newLease);
    await logActivity(
      actor.id,
      actor.name,
      actor.role,
      'Created Lease',
      `Created lease for ${data.tenantName} (${data.propertyName} Unit ${data.unitNumber})`,
      'lease',
      id,
      data.landlordId
    );
    return newLease;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateLease(
  id: string,
  data: Partial<Lease>,
  actor: { id: string; name: string; role: UserProfile['role'] }
): Promise<void> {
  const path = `leases/${id}`;
  try {
    await updateDoc(doc(db, 'leases', id), data);
    await logActivity(
      actor.id,
      actor.name,
      actor.role,
      'Updated Lease',
      `Updated lease ID: ${id}`,
      'lease',
      id
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// -------------------------------------------------------------
// Payments
// -------------------------------------------------------------
export async function getPayments(landlordId?: string, tenantId?: string): Promise<Payment[]> {
  const path = 'payments';
  try {
    const colRef = collection(db, path);
    let q: Query<DocumentData> = colRef;
    if (landlordId) {
      q = query(colRef, where('landlordId', '==', landlordId));
    } else if (tenantId) {
      q = query(colRef, where('tenantId', '==', tenantId));
    }
    const snap = await getDocs(q);
    const payments = snap.docs.map((d) => d.data() as Payment);
    return payments.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function recordPayment(
  data: Omit<Payment, 'id' | 'createdAt'>,
  actor: { id: string; name: string; role: UserProfile['role'] }
): Promise<Payment> {
  const path = 'payments';
  try {
    const id = 'pay_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const newPayment: Payment = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, path, id), newPayment);
    await logActivity(
      actor.id,
      actor.name,
      actor.role,
      'Recorded Payment',
      `Payment of ₹${data.amount.toLocaleString()} for Unit ${data.unitNumber} (${data.status})`,
      'payment',
      id,
      data.landlordId
    );
    return newPayment;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updatePayment(
  id: string,
  data: Partial<Payment>,
  actor: { id: string; name: string; role: UserProfile['role'] }
): Promise<void> {
  const path = `payments/${id}`;
  try {
    await updateDoc(doc(db, 'payments', id), data);
    await logActivity(
      actor.id,
      actor.name,
      actor.role,
      'Updated Payment',
      `Updated payment status to ${data.status || 'updated'}`,
      'payment',
      id
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// -------------------------------------------------------------
// Complaints
// -------------------------------------------------------------
export async function getComplaints(landlordId?: string, tenantId?: string): Promise<Complaint[]> {
  const path = 'complaints';
  try {
    const colRef = collection(db, path);
    let q: Query<DocumentData> = colRef;
    if (landlordId) {
      q = query(colRef, where('landlordId', '==', landlordId));
    } else if (tenantId) {
      q = query(colRef, where('tenantId', '==', tenantId));
    }
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => d.data() as Complaint);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function createComplaint(
  data: Omit<Complaint, 'id' | 'createdAt' | 'status'>,
  actor: { id: string; name: string; role: UserProfile['role'] }
): Promise<Complaint> {
  const path = 'complaints';
  try {
    const id = 'cmp_' + Date.now();
    const newComplaint: Complaint = {
      ...data,
      id,
      status: 'Open',
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, path, id), newComplaint);
    await logActivity(
      actor.id,
      actor.name,
      actor.role,
      'Submitted Complaint',
      `Tenant filed complaint "${data.title}" for Unit ${data.unitNumber} (${data.priority} Priority)`,
      'complaint',
      id,
      data.landlordId
    );
    return newComplaint;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateComplaintStatus(
  id: string,
  status: Complaint['status'],
  resolutionNotes: string,
  actor: { id: string; name: string; role: UserProfile['role'] }
): Promise<void> {
  const path = `complaints/${id}`;
  try {
    await updateDoc(doc(db, 'complaints', id), {
      status,
      resolutionNotes,
      updatedAt: new Date().toISOString(),
    });
    await logActivity(
      actor.id,
      actor.name,
      actor.role,
      'Updated Complaint',
      `Complaint marked as ${status} with resolution note`,
      'complaint',
      id
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// -------------------------------------------------------------
// Notices
// -------------------------------------------------------------
export async function getNotices(landlordId?: string, propertyId?: string): Promise<Notice[]> {
  const path = 'notices';
  try {
    const colRef = collection(db, path);
    let q: Query<DocumentData> = colRef;
    if (landlordId) {
      q = query(colRef, where('landlordId', '==', landlordId));
    }
    const snap = await getDocs(q);
    const notices = snap.docs.map((d) => d.data() as Notice);
    if (propertyId) {
      return notices.filter((n) => n.targetTenants === 'All' || n.propertyId === propertyId);
    }
    return notices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function createNotice(
  data: Omit<Notice, 'id' | 'createdAt'>,
  actor: { id: string; name: string; role: UserProfile['role'] }
): Promise<Notice> {
  const path = 'notices';
  try {
    const id = 'not_' + Date.now();
    const newNotice: Notice = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, path, id), newNotice);
    await logActivity(
      actor.id,
      actor.name,
      actor.role,
      'Broadcasted Notice',
      `Notice published: "${data.title}"`,
      'notice',
      id,
      data.landlordId
    );
    return newNotice;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteNotice(
  id: string,
  actor: { id: string; name: string; role: UserProfile['role'] }
): Promise<void> {
  const path = `notices/${id}`;
  try {
    await deleteDoc(doc(db, 'notices', id));
    await logActivity(
      actor.id,
      actor.name,
      actor.role,
      'Deleted Notice',
      `Removed notice ID: ${id}`,
      'notice',
      id
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// -------------------------------------------------------------
// Real Dashboard Stats Calculators (Never Hardcoded)
// -------------------------------------------------------------
export async function getAdminStats() {
  try {
    const [landlords, properties, tenants, leases, invitations] = await Promise.all([
      getLandlords().catch(() => []),
      getProperties().catch(() => []),
      getTenants().catch(() => []),
      getLeases().catch(() => []),
      getInvitations().catch(() => []),
    ]);

    const activeLandlords = landlords.filter((l) => l.status === 'active').length;
    const activeLeases = leases.filter((l) => l.status === 'Active').length;
    const pendingInvitations = invitations.filter((i) => i.status === 'Pending').length;

    return {
      totalLandlords: landlords.length,
      activeLandlords,
      totalProperties: properties.length,
      totalTenants: tenants.length,
      activeLeases,
      pendingInvitations,
    };
  } catch (err) {
    console.warn('Error computing admin stats:', err);
    return {
      totalLandlords: 0,
      activeLandlords: 0,
      totalProperties: 0,
      totalTenants: 0,
      activeLeases: 0,
      pendingInvitations: 0,
    };
  }
}

export async function getLandlordStats(landlordId: string) {
  try {
    const [properties, units, tenants, leases, payments] = await Promise.all([
      getProperties(landlordId).catch(() => []),
      getUnits(undefined, landlordId).catch(() => []),
      getTenants(landlordId).catch(() => []),
      getLeases(landlordId).catch(() => []),
      getPayments(landlordId).catch(() => []),
    ]);

    const occupiedUnits = units.filter((u) => u.status === 'Occupied').length;
    const vacantUnits = units.filter((u) => u.status === 'Available').length;
    const activeLeases = leases.filter((l) => l.status === 'Active').length;

    const monthlyExpectedRent = units
      .filter((u) => u.status === 'Occupied')
      .reduce((sum, u) => sum + (Number(u.monthlyRent) || 0), 0);

    const pendingRent = payments
      .filter((p) => p.status === 'Pending' || p.status === 'Overdue')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const collectedRent = payments
      .filter((p) => p.status === 'Paid')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    return {
      totalProperties: properties.length,
      totalUnits: units.length,
      occupiedUnits,
      vacantUnits,
      totalTenants: tenants.length,
      monthlyExpectedRent,
      pendingRent,
      collectedRent,
      activeLeases,
    };
  } catch (err) {
    console.warn('Error computing landlord stats:', err);
    return {
      totalProperties: 0,
      totalUnits: 0,
      occupiedUnits: 0,
      vacantUnits: 0,
      totalTenants: 0,
      monthlyExpectedRent: 0,
      pendingRent: 0,
      collectedRent: 0,
      activeLeases: 0,
    };
  }
}

// -------------------------------------------------------------
// Database Seed / Demo Setup (Requirement #24)
// -------------------------------------------------------------
export async function seedInitialDataIfEmpty(): Promise<boolean> {
  try {
    const existingProperties = await getProperties();
    if (existingProperties.length > 0) {
      return false; // Already has data
    }

    const landlordId = 'll_rahul_sharma';
    const landlord: Landlord = {
      id: landlordId,
      fullName: 'Rahul Sharma',
      email: 'rahul@example.com',
      phone: '+91 98765 43210',
      city: 'Bengaluru',
      address: '42, Indiranagar 100ft Road',
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'landlords', landlordId), landlord);

    // Landlord profile
    await saveUserProfile({
      id: landlordId,
      email: 'rahul@example.com',
      fullName: 'Rahul Sharma',
      phone: '+91 98765 43210',
      city: 'Bengaluru',
      address: '42, Indiranagar 100ft Road',
      role: 'landlord',
      status: 'active',
      createdAt: new Date().toISOString(),
    });

    // Admin profile
    await saveUserProfile({
      id: 'admin_rentease',
      email: 'admin@rentease.com',
      fullName: 'RentEase Administrator',
      phone: '+91 80000 11222',
      role: 'admin',
      status: 'active',
      createdAt: new Date().toISOString(),
    });

    // Property: Green Residency
    const propId = 'prop_green_residency';
    const property: Property = {
      id: propId,
      landlordId,
      name: 'Green Residency',
      type: 'Apartment',
      address: '12th Cross, Sector 4, HSR Layout',
      city: 'Bengaluru',
      state: 'Karnataka',
      pinCode: '560102',
      description: 'Premium modern apartment building with 24/7 security, power backup and covered parking.',
      totalUnits: 3,
      status: 'Active',
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'properties', propId), property);

    // Units: 101, 102, 103
    const unit101Id = 'unit_101';
    const unit102Id = 'unit_102';
    const unit103Id = 'unit_103';

    const unit101: Unit = {
      id: unit101Id,
      propertyId: propId,
      landlordId,
      unitNumber: '101',
      floor: '1st Floor',
      monthlyRent: 20000,
      securityDeposit: 40000,
      furnishingStatus: 'Furnished',
      status: 'Occupied',
      currentTenantId: 'ten_amit_kumar',
      currentTenantName: 'Amit Kumar',
      createdAt: new Date().toISOString(),
    };

    const unit102: Unit = {
      id: unit102Id,
      propertyId: propId,
      landlordId,
      unitNumber: '102',
      floor: '1st Floor',
      monthlyRent: 18000,
      securityDeposit: 36000,
      furnishingStatus: 'Semi-Furnished',
      status: 'Available',
      createdAt: new Date().toISOString(),
    };

    const unit103: Unit = {
      id: unit103Id,
      propertyId: propId,
      landlordId,
      unitNumber: '103',
      floor: '2nd Floor',
      monthlyRent: 22000,
      securityDeposit: 44000,
      furnishingStatus: 'Furnished',
      status: 'Maintenance',
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'units', unit101Id), unit101);
    await setDoc(doc(db, 'units', unit102Id), unit102);
    await setDoc(doc(db, 'units', unit103Id), unit103);

    // Tenant: Amit Kumar
    const tenantId = 'ten_amit_kumar';
    const tenant: Tenant = {
      id: tenantId,
      userId: 'tenant_amit_user',
      landlordId,
      propertyId: propId,
      unitId: unit101Id,
      fullName: 'Amit Kumar',
      email: 'amit@example.com',
      phone: '+91 99887 76655',
      leaseStartDate: '2026-01-01',
      leaseEndDate: '2026-12-31',
      monthlyRent: 20000,
      securityDeposit: 40000,
      status: 'Active',
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'tenants', tenantId), tenant);

    // Tenant Profile
    await saveUserProfile({
      id: 'tenant_amit_user',
      email: 'amit@example.com',
      fullName: 'Amit Kumar',
      phone: '+91 99887 76655',
      role: 'tenant',
      status: 'active',
      landlordId,
      propertyId: propId,
      unitId: unit101Id,
      tenantRecordId: tenantId,
      createdAt: new Date().toISOString(),
    });

    // Lease
    const leaseId = 'lease_amit_101';
    const lease: Lease = {
      id: leaseId,
      landlordId,
      tenantId,
      propertyId: propId,
      unitId: unit101Id,
      tenantName: 'Amit Kumar',
      propertyName: 'Green Residency',
      unitNumber: '101',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      monthlyRent: 20000,
      securityDeposit: 40000,
      status: 'Active',
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'leases', leaseId), lease);

    // Payments
    const pay1: Payment = {
      id: 'pay_01',
      landlordId,
      tenantId,
      leaseId,
      propertyId: propId,
      unitId: unit101Id,
      tenantName: 'Amit Kumar',
      unitNumber: '101',
      amount: 20000,
      dueDate: '2026-09-05',
      paymentDate: '2026-09-04',
      paymentMethod: 'UPI',
      status: 'Paid',
      transactionRef: 'UPI/923847239482',
      notes: 'September 2026 Rent',
      createdAt: new Date().toISOString(),
    };
    const pay2: Payment = {
      id: 'pay_02',
      landlordId,
      tenantId,
      leaseId,
      propertyId: propId,
      unitId: unit101Id,
      tenantName: 'Amit Kumar',
      unitNumber: '101',
      amount: 20000,
      dueDate: '2026-10-05',
      paymentMethod: 'Bank Transfer',
      status: 'Pending',
      notes: 'October 2026 Rent',
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'payments', 'pay_01'), pay1);
    await setDoc(doc(db, 'payments', 'pay_02'), pay2);

    // Complaint
    const cmpId = 'cmp_01';
    const complaint: Complaint = {
      id: cmpId,
      landlordId,
      tenantId,
      tenantName: 'Amit Kumar',
      propertyId: propId,
      propertyName: 'Green Residency',
      unitId: unit101Id,
      unitNumber: '101',
      title: 'Bathroom tap leaking slowly',
      description: 'The master bathroom sink tap has a slow continuous drip since yesterday.',
      category: 'Plumbing',
      priority: 'Low',
      status: 'In Progress',
      resolutionNotes: 'Plumber scheduled for Saturday morning 11 AM.',
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'complaints', cmpId), complaint);

    // Notice
    const notId = 'not_01';
    const notice: Notice = {
      id: notId,
      landlordId,
      propertyId: propId,
      propertyName: 'Green Residency',
      title: 'Water tank cleaning scheduled',
      message: 'Water maintenance will be carried out on 5 October from 10 AM to 2 PM. Please store sufficient water in advance.',
      targetTenants: 'All',
      date: '2026-10-03',
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'notices', notId), notice);

    // Activity Logs
    await logActivity(
      'admin_rentease',
      'RentEase Administrator',
      'admin',
      'Created Landlord',
      'Rahul Sharma added as landlord',
      'landlord',
      landlordId
    );
    await logActivity(
      landlordId,
      'Rahul Sharma',
      'landlord',
      'Created Property',
      'Green Residency added',
      'property',
      propId,
      landlordId
    );
    await logActivity(
      tenantId,
      'Amit Kumar',
      'tenant',
      'Tenant Accepted Invitation',
      'Amit Kumar accepted tenant invitation for Unit 101',
      'tenant',
      tenantId,
      landlordId
    );
    await logActivity(
      landlordId,
      'Rahul Sharma',
      'landlord',
      'Recorded Payment',
      'Payment recorded for Unit 101 (₹20,000 via UPI)',
      'payment',
      'pay_01',
      landlordId
    );

    return true;
  } catch (error) {
    console.error('Failed to seed initial data:', error);
    return false;
  }
}
