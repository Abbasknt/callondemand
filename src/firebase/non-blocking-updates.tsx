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

export function setDocumentNonBlocking(docRef: DocumentReference, data: any, options: SetOptions) {
  setDoc(docRef, data, options).catch(error => {
    try {
      handleFirestoreError(error, OperationType.WRITE, docRef.path);
    } catch (e: any) {
      errorEmitter.emit('permission-error', e);
    }
  })
}

export function addDocumentNonBlocking(colRef: CollectionReference, data: any) {
  const promise = addDoc(colRef, data)
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
  updateDoc(docRef, data)
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
