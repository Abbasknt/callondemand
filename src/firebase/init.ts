
import firebaseConfig from '../../firebase-applet-config.json';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { initializeFirestore, getFirestore, Firestore, setLogLevel, doc, getDocFromServer } from 'firebase/firestore';

/**
 * Isolated initialization logic to prevent circular dependency cycles.
 * This is the source of truth for Firebase service instances.
 */
export function initializeFirebase() {
  const existingApps = getApps();
  const firebaseApp = existingApps.length ? getApp() : initializeApp(firebaseConfig);
  const dbId = (firebaseConfig as any).firestoreDatabaseId === '(default)' ? undefined : (firebaseConfig as any).firestoreDatabaseId;

  let firestore: Firestore;
  if (typeof window === 'undefined') {
    firestore = dbId ? getFirestore(firebaseApp, dbId) : getFirestore(firebaseApp);
    const auth = getAuth(firebaseApp);
    return {
      firebaseApp,
      auth,
      firestore,
      vertexAI: null as any
    };
  }

  try {
    const settings = {
      experimentalAutoDetectLongPolling: true,
    };

    firestore = dbId 
      ? initializeFirestore(firebaseApp, settings, dbId)
      : initializeFirestore(firebaseApp, settings);
    
    setLogLevel('silent');
  } catch (e) {
    firestore = dbId ? getFirestore(firebaseApp, dbId) : getFirestore(firebaseApp);
  }

  getDocFromServer(doc(firestore, 'test', 'connection')).catch((error) => {
    if (error instanceof Error && error.message.includes('offline')) {
      console.warn("Firestore client operating in offline mode.", error.message);
    }
  });

  const auth = getAuth(firebaseApp);

  return {
    firebaseApp,
    auth,
    firestore,
    vertexAI: null as any
  };
}
