
'use client';

import React, { DependencyList, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Firestore } from 'firebase/firestore';
import { type Auth, type User, onAuthStateChanged } from 'firebase/auth';
import type { VertexAI } from 'firebase/vertexai';
import { FirebaseContext, type FirebaseContextState } from './context';
import { FirebaseErrorListener } from '../components/FirebaseErrorListener';

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  vertexAI: VertexAI;
}

/**
 * Isolated Firebase Provider to manage service instances and user session state.
 * Uses relative imports for the error listener to break circular barrel dependencies.
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
  vertexAI,
}) => {
  const [userAuthState, setUserAuthState] = useState<{ user: User | null, isUserLoading: boolean, userError: Error | null }>({
    user: null,
    isUserLoading: true,
    userError: null,
  });

  useEffect(() => {
    if (!auth) {
      setUserAuthState({ user: null, isUserLoading: false, userError: new Error("Auth service not provided.") });
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUserAuthState({ user: firebaseUser, isUserLoading: false, userError: null });
      },
      (error) => {
        console.error("COD Auth Hub Error:", error);
        setUserAuthState({ user: null, isUserLoading: false, userError: error });
      }
    );
    return () => unsubscribe();
  }, [auth]);

  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth && vertexAI);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      vertexAI: servicesAvailable ? vertexAI : null,
      user: userAuthState.user,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
    };
  }, [firebaseApp, firestore, auth, vertexAI, userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) throw new Error('useFirebase must be used within a FirebaseProvider.');
  if (!context.areServicesAvailable) throw new Error('Firebase core services not available.');
  return context as { 
    firebaseApp: FirebaseApp, 
    firestore: Firestore, 
    auth: Auth, 
    vertexAI: VertexAI, 
    user: User | null, 
    isUserLoading: boolean, 
    userError: Error | null 
  };
};

export const useAuth = () => useFirebase().auth;
export const useFirestore = () => useFirebase().firestore;
export const useFirebaseApp = () => useFirebase().firebaseApp;
export const useFirebaseAI = () => useFirebase().vertexAI;
export const useUser = () => {
  const { user, isUserLoading, userError } = useFirebase();
  return { user, isUserLoading, userError };
};

/**
 * Standardized memoization for Firestore references and queries.
 * Prevents infinite re-render loops in real-time listeners.
 */
export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T & {__memo?: boolean} {
  const memoized = useMemo(factory, deps);
  if (typeof memoized !== 'object' || memoized === null) return memoized as any;
  (memoized as any).__memo = true;
  return memoized as any;
}

export { FirebaseContext };
