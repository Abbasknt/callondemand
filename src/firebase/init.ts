
import firebaseConfig from '../../firebase-applet-config.json';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { initializeFirestore, getFirestore, Firestore, setLogLevel } from 'firebase/firestore';
import { getVertexAI, VertexAI } from 'firebase/vertexai';

/**
 * Isolated initialization logic to prevent circular dependency cycles.
 * This is the source of truth for Firebase service instances.
 */
export function initializeFirebase() {
  const existingApps = getApps();
  const firebaseApp = existingApps.length ? getApp() : initializeApp(firebaseConfig);
  const dbId = firebaseConfig.firestoreDatabaseId === '(default)' ? undefined : firebaseConfig.firestoreDatabaseId;

  let firestore: Firestore;
  try {
    /**
     * Hardened for Studio/Workstation environments:
     * WebSockets/gRPC streams are restricted in proxied dev environments.
     * Force Long Polling to avoid 'Listen' stream cancellations.
     */
    const settings = {
      experimentalForceLongPolling: true,
      experimentalAutoDetectLongPolling: false,
    };

    firestore = dbId 
      ? initializeFirestore(firebaseApp, settings, dbId)
      : initializeFirestore(firebaseApp, settings);
    
    // Suppress cancelation logs in dev environment
    setLogLevel('error');
  } catch (e) {
    // Fallback if already initialized (persist settings)
    firestore = dbId ? getFirestore(firebaseApp, dbId) : getFirestore(firebaseApp);
  }

  const auth = getAuth(firebaseApp);
  const vertexAI = getVertexAI(firebaseApp);

  // Diagnostic connection warm-up
  (async () => {
    try {
      const { doc, getDocFromServer } = await import('firebase/firestore');
      await getDocFromServer(doc(firestore, '_health', 'check')).catch(() => {});
      console.log("Firestore Hub: Active");
    } catch (e) {
      // Silent fail for background warm-up
    }
  })();

  return {
    firebaseApp,
    auth,
    firestore,
    vertexAI
  };
}
