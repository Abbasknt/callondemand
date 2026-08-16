'use server';

import { 
  collection, 
  query, 
  where, 
  getDocs, 
  setDoc, 
  doc, 
  getDoc 
} from 'firebase/firestore';
import { db } from '@/firebase/server';

export interface AdministratorRegisterUserInput {
  adminId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'Customer' | 'Agent' | 'Operator' | 'Admin';
  assignedUnit: string;
}

export interface AdministratorRegisterUserOutput {
  success: boolean;
  message: string;
  userId?: string;
}

/**
 * @fileOverview Admin-Driven User Provisioning.
 * Allows valid administrators to pre-register users with specific roles and operational units.
 */
export async function administratorRegisterUser(
  input: AdministratorRegisterUserInput
): Promise<AdministratorRegisterUserOutput> {
  try {
    if (!input || !input.email || !input.adminId) {
      return {
        success: false,
        message: "Invalid input: Admin ID and email are required."
      };
    }

    // 1. Verify Admin Status (Server-side Enforcement)
    const adminDocRef = doc(db, 'super_admins', input.adminId);
    const adminSnap = await getDoc(adminDocRef);
    
    if (!adminSnap.exists()) {
      return {
        success: false,
        message: "Authorization Violation: The requesting identity does not have administrative clearance to provision users.",
      };
    }

    // 2. Validate Operational Unit
    if (input.assignedUnit && input.assignedUnit !== 'General') {
      const unitsRef = collection(db, 'operational_units');
      const unitQuery = query(unitsRef, where('name', '==', input.assignedUnit));
      const unitSnap = await getDocs(unitQuery);
      
      if (unitSnap.empty) {
        return {
          success: false,
          message: `Operational Unit Error: '${input.assignedUnit}' is not a recognized operational node in the system.`,
        };
      }
    }
    
    // 3. Check if user already exists
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', input.email.toLowerCase()));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return {
        success: false,
        message: `Consistency Conflict: A user with email ${input.email} is already active or pending on the platform.`,
      };
    }

    // 4. Provision the Invitation
    const inviteRef = doc(db, 'invitations', input.email.toLowerCase());

    await setDoc(inviteRef, {
      email: input.email.toLowerCase(),
      firstName: input.firstName || '',
      lastName: input.lastName || '',
      role: input.role || 'Customer',
      assignedUnit: input.assignedUnit || 'General',
      status: 'Pending',
      provisionedAt: new Date().toISOString(),
      provisionedBy: input.adminId,
      handshakeVerified: false
    });

    return {
      success: true,
      message: `Access Node Synchronized: ${input.email} is now provisioned with ${input.role} permissions in unit ${input.assignedUnit}.`,
    };
  } catch (error: any) {
    console.error("User Provisioning Error:", error);
    return {
      success: false,
      message: error?.message || "An internal synchronization error occurred. Please try again.",
    };
  }
}

