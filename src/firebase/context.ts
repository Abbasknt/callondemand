'use client';

import { createContext } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Firestore } from 'firebase/firestore';
import type { Auth, User } from 'firebase/auth';
import type { VertexAI } from 'firebase/vertexai';

/**
 * @fileOverview Definition of the Firebase React Context.
 * Isolated to prevent circular dependency cycles in the barrel file.
 */

export interface FirebaseContextState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  vertexAI: VertexAI | null;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);
