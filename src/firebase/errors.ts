'use client';
import { getAuth, type User } from 'firebase/auth';

/**
 * Standard Firestore Operation Types for error reporting.
 */
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

/**
 * Interface for structured Firestore error metadata.
 */
export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write' | OperationType;
  requestResourceData?: any;
};

interface FirebaseAuthToken {
  name: string | null;
  email: string | null;
  email_verified: boolean;
  phone_number: string | null;
  sub: string;
  firebase: {
    identities: Record<string, string[]>;
    sign_in_provider: string;
    tenant: string | null;
  };
}

interface FirebaseAuthObject {
  uid: string;
  token: FirebaseAuthToken;
}

interface SecurityRuleRequest {
  auth: FirebaseAuthObject | null;
  method: string;
  path: string;
  resource?: {
    data: any;
  };
}

/**
 * Builds a security-rule-compliant auth object from the Firebase User.
 */
function buildAuthObject(currentUser: User | null): FirebaseAuthObject | null {
  if (!currentUser) return null;

  const token: FirebaseAuthToken = {
    name: currentUser.displayName,
    email: currentUser.email,
    email_verified: currentUser.emailVerified,
    phone_number: currentUser.phoneNumber,
    sub: currentUser.uid,
    firebase: {
      identities: currentUser.providerData.reduce((acc, p) => {
        if (p.providerId) acc[p.providerId] = [p.uid];
        return acc;
      }, {} as Record<string, string[]>),
      sign_in_provider: currentUser.providerData[0]?.providerId || 'custom',
      tenant: currentUser.tenantId,
    },
  };

  return { uid: currentUser.uid, token };
}

/**
 * Builds the structure required for centralized logging.
 */
export function buildErrorInfo(error: unknown, operationType: OperationType, path: string | null): FirestoreErrorInfo {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  return {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo: currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    }
  };
}

/**
 * Global Firestore Error Handler.
 * Catches permission errors, builds the required metadata, logs it to a simulated centralized service, 
 * and rethrows as a JSON string to satisfy platform requirements.
 */
export function handleFirestoreError(error: any, operationType: OperationType, path: string | null) {
  const errorInfo = buildErrorInfo(error, operationType, path);
  
  // 1. Centralized logging (Simulating Sentry/LogRocket/Datadog)
  console.group('🛡️ CENTRALIZED MONITORING: FIRESTORE SECURITY EVENT');
  console.error('Type:', errorInfo.operationType);
  console.error('Path:', errorInfo.path);
  console.error('Auth:', !!errorInfo.authInfo.userId ? `User: ${errorInfo.authInfo.userId}` : 'Unauthenticated');
  console.error('Raw Error:', errorInfo.error);
  console.groupEnd();

  // 2. Integration hook for real services
  // if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  //   Sentry.captureException(error, { extra: errorInfo });
  // }
  
  // CRITICAL: The new error's message MUST be a JSON string that conforms to FirestoreErrorInfo
  // this is used by the system to diagnose security rule failures.
  throw new Error(JSON.stringify(errorInfo));
}

/**
 * A custom error class designed to be consumed for debugging.
 */
export class FirestorePermissionError extends Error {
  public readonly request: SecurityRuleRequest;

  constructor(context: SecurityRuleContext) {
    let authObject: FirebaseAuthObject | null = null;
    try {
      const auth = getAuth();
      if (auth.currentUser) authObject = buildAuthObject(auth.currentUser);
    } catch {}

    const requestObject: SecurityRuleRequest = {
      auth: authObject,
      method: context.operation,
      path: `/databases/(default)/documents/${context.path}`,
      resource: context.requestResourceData ? { data: context.requestResourceData } : undefined,
    };

    super(`Missing or insufficient permissions: ${JSON.stringify(requestObject, null, 2)}`);
    this.name = 'FirebaseError';
    this.request = requestObject;
  }
}
