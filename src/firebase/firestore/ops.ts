'use client';

import {
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  DocumentReference,
  CollectionReference,
  Query,
  SetOptions,
  DocumentData,
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../errors';
import { sanitizeFirestoreData } from '../non-blocking-updates';

/**
 * @fileOverview Hardened Firestore Operation Wrappers.
 * These functions wrap standard Firestore SDK calls with the required error handling
 * and centralized monitoring hooks.
 */

export async function getDocumentSafe<T = DocumentData>(docRef: DocumentReference<T>) {
  try {
    return await getDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, docRef.path);
    throw error; // handleFirestoreError already throws, but for type safety
  }
}

export async function getDocumentsSafe<T = DocumentData>(query: Query<T> | CollectionReference<T>) {
  try {
    return await getDocs(query);
  } catch (error) {
    // Note: Query path canonical string is complex in SDK, using a simplified identifier if possible
    const path = ('path' in query) ? (query as any).path : 'query';
    handleFirestoreError(error, OperationType.LIST, path);
    throw error;
  }
}

export async function setDocumentSafe<T = DocumentData>(
  docRef: DocumentReference<T>, 
  data: Partial<T>, 
  options?: SetOptions
) {
  try {
    const cleanData = sanitizeFirestoreData(data);
    if (options) {
      return await setDoc(docRef, cleanData, options);
    }
    return await setDoc(docRef, cleanData as any);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docRef.path);
    throw error;
  }
}

export async function addDocumentSafe<T = DocumentData>(
  colRef: CollectionReference<T>, 
  data: T
) {
  try {
    const cleanData = sanitizeFirestoreData(data);
    return await addDoc(colRef, cleanData);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, colRef.path);
    throw error;
  }
}

export async function updateDocumentSafe<T = DocumentData>(
  docRef: DocumentReference<T>, 
  data: Partial<T>
) {
  try {
    const cleanData = sanitizeFirestoreData(data);
    return await updateDoc(docRef, cleanData as any);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docRef.path);
    throw error;
  }
}

export async function deleteDocumentSafe(docRef: DocumentReference) {
  try {
    return await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docRef.path);
    throw error;
  }
}
