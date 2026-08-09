'use client';

import React, { useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from './provider';
import { initializeFirebase } from './init';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

/**
 * Ensures Firebase is initialized safely on the client side.
 */
export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [services, setServices] = useState<{
    firebaseApp: any;
    auth: any;
    firestore: any;
    vertexAI: any;
  }>({
    firebaseApp: null,
    auth: null,
    firestore: null,
    vertexAI: null,
  });

  useEffect(() => {
    setServices(initializeFirebase());
  }, []);

  return (
    <FirebaseProvider
      firebaseApp={services.firebaseApp}
      auth={services.auth}
      firestore={services.firestore}
      vertexAI={services.vertexAI}
    >
      {children}
    </FirebaseProvider>
  );
}
