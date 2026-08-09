'use server';

import { ai } from '../genkit';
import { z } from 'genkit';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  setDoc, 
  doc, 
  getDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/firebase/server';

const AdministratorRegisterUserInputSchema = z.object({
  adminId: z.string().describe('UID of the administrator initiating the request'),
  email: z.string().email().describe('Email address of the new user'),
  firstName: z.string().describe('First name of the user'),
  lastName: z.string().describe('Last name of the user'),
  role: z.enum(['Customer', 'Agent', 'Operator', 'Admin']).describe('Role level for the platform'),
  assignedUnit: z.string().describe('Name of the operational unit assigned to this user'),
});

const AdministratorRegisterUserOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  userId: z.string().optional(),
});

export type AdministratorRegisterUserInput = z.infer<typeof AdministratorRegisterUserInputSchema>;
export type AdministratorRegisterUserOutput = z.infer<typeof AdministratorRegisterUserOutputSchema>;

/**
 * @fileOverview Genkit Flow: Admin-Driven User Provisioning.
 * Allows valid administrators to pre-register users with specific roles and operational units.
 */

export async function administratorRegisterUser(
  input: AdministratorRegisterUserInput
): Promise<AdministratorRegisterUserOutput> {
  try {
    return await administratorRegisterUserFlow(input);
  } catch (error) {
    console.error("User Provisioning Error:", error);
    return {
      success: false,
      message: "An internal synchronization error occurred. Please try again.",
    };
  }
}

const administratorRegisterUserFlow = ai.defineFlow(
  {
    name: 'administratorRegisterUserFlow',
    inputSchema: AdministratorRegisterUserInputSchema,
    outputSchema: AdministratorRegisterUserOutputSchema,
  },
  async (input) => {
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
    if (input.assignedUnit !== 'General') {
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
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role,
      assignedUnit: input.assignedUnit,
      status: 'Pending',
      provisionedAt: new Date().toISOString(),
      provisionedBy: input.adminId,
      handshakeVerified: false
    });

    return {
      success: true,
      message: `Access Node Synchronized: ${input.email} is now provisioned with ${input.role} permissions in unit ${input.assignedUnit}.`,
    };
  }
);
