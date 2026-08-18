import { initializeFirebase } from '@/firebase/init';
import { collection, addDoc } from 'firebase/firestore';

// Lazy-initialized instances
let firebaseAdminApp: any = null;
let adminDb: any = null;
let messaging: any = null;
let twilioClient: any = null;

async function getFirebaseAdmin() {
    if (!firebaseAdminApp) {
        const { getApps, initializeApp, cert } = await import('firebase-admin/app');
        const apps = getApps();
        if (apps.length) {
            firebaseAdminApp = apps[0];
        } else {
            const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
            if (key) {
                try {
                    const serviceAccount = JSON.parse(key);
                    firebaseAdminApp = initializeApp({
                        credential: cert(serviceAccount)
                    });
                } catch (error) {
                    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY, using default credentials:', error);
                    try {
                        firebaseAdminApp = initializeApp();
                    } catch (e) {
                        console.error('Failed to initialize default Firebase Admin:', e);
                    }
                }
            } else {
                try {
                    firebaseAdminApp = initializeApp();
                } catch (e) {
                    console.error('Failed to initialize default Firebase Admin:', e);
                }
            }
        }
    }
    return firebaseAdminApp;
}

async function getDb() {
    if (!adminDb) {
        const adminApp = await getFirebaseAdmin();
        if (adminApp) {
            const { getFirestore } = await import('firebase-admin/firestore');
            adminDb = getFirestore(adminApp);
        }
    }
    return adminDb;
}

async function getMessagingClient() {
    if (!messaging) {
        const adminApp = await getFirebaseAdmin();
        if (adminApp) {
            const { getMessaging } = await import('firebase-admin/messaging');
            messaging = getMessaging(adminApp);
        }
    }
    return messaging;
}

async function getTwilioClient() {
    if (!twilioClient) {
        const sid = process.env.TWILIO_ACCOUNT_SID;
        const token = process.env.TWILIO_AUTH_TOKEN;
        if (!sid || !token) {
            throw new Error('TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN is missing');
        }
        const { Twilio } = await import('twilio');
        twilioClient = new Twilio(sid, token);
    }
    return twilioClient;
}

export async function sendInAppNotification(userId: string, title: string, body: string, type: string) {
    try {
        const firestoreDb = await getDb();
        if (firestoreDb) {
            await firestoreDb.collection('users').doc(userId).collection('notifications').add({
                title,
                body,
                type,
                read: false,
                createdAt: new Date()
            });
            return;
        }
        // Fallback to applet client firestore
        const { firestore } = initializeFirebase();
        if (firestore) {
            await addDoc(collection(firestore, 'users', userId, 'notifications'), {
                title,
                body,
                type,
                read: false,
                createdAt: new Date().toISOString()
            });
        }
    } catch (error) {
        console.error('Error sending in-app notification:', error);
    }
}

export async function sendPushNotification(fcmToken: string, title: string, body: string) {
    try {
        const messagingClient = await getMessagingClient();
        if (messagingClient) {
            await messagingClient.send({
                token: fcmToken,
                notification: { title, body }
            });
        }
    } catch (error) {
        console.error('Error sending push notification:', error);
    }
}

export async function sendSMS(to: string, body: string) {
    try {
        const client = await getTwilioClient();
        if (client && process.env.TWILIO_PHONE_NUMBER) {
            await client.messages.create({
                body,
                from: process.env.TWILIO_PHONE_NUMBER,
                to
            });
        }
    } catch (error) {
        console.error('Error sending SMS:', error);
    }
}

