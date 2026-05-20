'use client';
import {
  Auth,
  GoogleAuthProvider,
  signInWithRedirect,
  signInWithPopup,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  UserCredential
} from 'firebase/auth';

/** 
 * @fileOverview Consolidated Non-blocking authentication triggers for Call on Demand.
 */

export function initiateGoogleSignInRedirect(authInstance: Auth): void {
  if (!authInstance) return;
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/drive');
  signInWithRedirect(authInstance, provider);
}

export async function initiateGoogleSignInPopup(authInstance: Auth): Promise<UserCredential | null> {
  if (!authInstance) return null;
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/drive');
  return await signInWithPopup(authInstance, provider);
}

export function initiateAnonymousSignIn(authInstance: Auth): void {
  if (!authInstance) return;
  signInAnonymously(authInstance);
}

export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): void {
  if (!authInstance) return;
  createUserWithEmailAndPassword(authInstance, email, password).catch(console.error);
}

export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  if (!authInstance) return;
  signInWithEmailAndPassword(authInstance, email, password).catch(console.error);
}