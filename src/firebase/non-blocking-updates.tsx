'use client';

/**
 * @fileOverview Non-blocking Firestore Mutation Utilities.
 * Uses relative imports to resolve Turbopack module cycles.
 */
    
import {
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  CollectionReference,
  DocumentReference,
  SetOptions,
} from 'firebase/firestore';
import { errorEmitter } from './error-emitter';
import { handleFirestoreError, OperationType } from './errors';

function isPlainObject(obj: any): boolean {
  if (typeof obj !== 'object' || obj === null) return false;
  const proto = Object.getPrototypeOf(obj);
  return proto === null || proto === Object.prototype;
}

export function sanitizeFirestoreData<T>(data: T): T {
  if (data === undefined) {
    return null as unknown as T;
  }
  if (data === null || typeof data !== 'object') {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map(item => sanitizeFirestoreData(item)) as unknown as T;
  }
  if (isPlainObject(data)) {
    const sanitized: Record<string, any> = {};
    for (const key of Object.keys(data as Record<string, any>)) {
      const value = (data as Record<string, any>)[key];
      if (value !== undefined) {
        sanitized[key] = sanitizeFirestoreData(value);
      }
    }
    return sanitized as T;
  }
  return data;
}

export function setDocumentNonBlocking(docRef: DocumentReference, data: any, options?: SetOptions) {
  const cleanData = sanitizeFirestoreData(data);
  const promise = options ? setDoc(docRef, cleanData, options) : setDoc(docRef, cleanData);
  promise.catch(error => {
    try {
      handleFirestoreError(error, OperationType.WRITE, docRef.path);
    } catch (e: any) {
      errorEmitter.emit('permission-error', e);
    }
  });
}

export function addDocumentNonBlocking(colRef: CollectionReference, data: any) {
  const cleanData = sanitizeFirestoreData(data);
  const promise = addDoc(colRef, cleanData)
    .catch(error => {
      try {
        handleFirestoreError(error, OperationType.CREATE, colRef.path);
      } catch (e: any) {
        errorEmitter.emit('permission-error', e);
      }
    });
  return promise;
}

export function updateDocumentNonBlocking(docRef: DocumentReference, data: any) {
  const cleanData = sanitizeFirestoreData(data);
  updateDoc(docRef, cleanData)
    .catch(error => {
      try {
        handleFirestoreError(error, OperationType.UPDATE, docRef.path);
      } catch (e: any) {
        errorEmitter.emit('permission-error', e);
      }
    });
}

export function deleteDocumentNonBlocking(docRef: DocumentReference) {
  deleteDoc(docRef)
    .catch(error => {
      try {
        handleFirestoreError(error, OperationType.DELETE, docRef.path);
      } catch (e: any) {
        errorEmitter.emit('permission-error', e);
      }
    });
}
