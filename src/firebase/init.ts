
import firebaseConfig from '../../firebase-applet-config.json';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { initializeFirestore, getFirestore, Firestore, setLogLevel, doc, getDocFromServer } from 'firebase/firestore';

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;
let cachedFirestore: Firestore | null = null;

/**
 * Isolated initialization logic to prevent circular dependency cycles.
 * This is the source of truth for Firebase service instances.
 */
export function initializeFirebase() {
  if (cachedApp && cachedAuth && cachedFirestore) {
    return {
      firebaseApp: cachedApp,
      auth: cachedAuth,
      firestore: cachedFirestore,
      vertexAI: null as any
    };
  }

  const existingApps = getApps();
  const firebaseApp = existingApps.length ? getApp() : initializeApp(firebaseConfig);
  cachedApp = firebaseApp;

  const rawDbId = (firebaseConfig as any).firestoreDatabaseId;
  const dbId = !rawDbId || rawDbId === '(default)' ? undefined : rawDbId;

  const auth = getAuth(firebaseApp);
  cachedAuth = auth;

  let firestore: Firestore;
  try {
    firestore = dbId ? getFirestore(firebaseApp, dbId) : getFirestore(firebaseApp);
    setLogLevel('silent');
  } catch (e) {
    firestore = dbId ? getFirestore(firebaseApp, dbId) : getFirestore(firebaseApp);
  }

  cachedFirestore = firestore;

  return {
    firebaseApp,
    auth,
    firestore,
    vertexAI: null as any
  };
}
