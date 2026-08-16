'use client';

import { useEffect } from 'react';
import { errorEmitter } from '../firebase/error-emitter';
import { FirestorePermissionError } from '../firebase/errors';

/**
 * An invisible component that listens for globally emitted 'permission-error' events.
 * Logs diagnostics safely without breaking page execution.
 */
export function FirebaseErrorListener() {
  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      console.warn('Firestore Permission Event:', error?.message || error);
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  return null;
}
