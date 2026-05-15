
/**
 * @fileOverview Unified Firebase Barrel Hub for Call on Demand.com.
 * Hardened to explicitly map all exports to resolve static analysis failures in Next.js 15.
 * Uses explicit relative imports to prevent circular call graph cycles.
 */

import { initializeFirebase } from './init';
import { 
  FirebaseProvider, 
  useFirebase, 
  useAuth, 
  useFirestore, 
  useFirebaseApp, 
  useFirebaseAI, 
  useUser, 
  useMemoFirebase,
  FirebaseContext 
} from './provider';
import { FirebaseClientProvider } from './client-provider';
import { useCollection } from './firestore/use-collection';
import { useDoc } from './firestore/use-doc';
import { 
  setDocumentNonBlocking, 
  addDocumentNonBlocking, 
  updateDocumentNonBlocking, 
  deleteDocumentNonBlocking 
} from './non-blocking-updates';
import {
  getDocumentSafe,
  getDocumentsSafe,
  setDocumentSafe,
  addDocumentSafe,
  updateDocumentSafe,
  deleteDocumentSafe
} from './firestore/ops';
import { 
  initiateGoogleSignInRedirect, 
  initiateGoogleSignInPopup,
  initiateAnonymousSignIn, 
  initiateEmailSignUp, 
  initiateEmailSignIn 
} from './auth-triggers';
import { FirestorePermissionError, handleFirestoreError, OperationType } from './errors';
import { errorEmitter } from './error-emitter';

// Initialize singleton instances for non-hook usage
const firebaseInstances = initializeFirebase();
export const db = firebaseInstances.firestore;
export const auth = firebaseInstances.auth;
export const vertexAI = firebaseInstances.vertexAI;

export {
  initializeFirebase,
  FirebaseProvider,
  useFirebase,
  useAuth,
  useFirestore,
  useFirebaseApp,
  useFirebaseAI,
  useUser,
  useMemoFirebase,
  FirebaseClientProvider,
  FirebaseContext,
  useCollection,
  useDoc,
  setDocumentNonBlocking,
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
  getDocumentSafe,
  getDocumentsSafe,
  setDocumentSafe,
  addDocumentSafe,
  updateDocumentSafe,
  deleteDocumentSafe,
  initiateGoogleSignInRedirect,
  initiateGoogleSignInPopup,
  initiateAnonymousSignIn,
  initiateEmailSignUp,
  initiateEmailSignIn,
  FirestorePermissionError,
  handleFirestoreError,
  OperationType,
  errorEmitter
};
