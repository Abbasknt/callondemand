import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getMessaging, Messaging } from 'firebase-admin/messaging';
import { Twilio } from 'twilio';

// Lazy-initialized instances
let firebaseAdminApp: App | null = null;
let db: Firestore | null = null;
let messaging: Messaging | null = null;
let twilioClient: Twilio | null = null;

function getFirebaseAdmin(): App {
    if (!firebaseAdminApp) {
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
                    firebaseAdminApp = initializeApp();
                }
            } else {
                firebaseAdminApp = initializeApp();
            }
        }
    }
    return firebaseAdminApp;
}

function getDb(): Firestore {
    if (!db) {
        db = getFirestore(getFirebaseAdmin());
    }
    return db;
}

function getMessagingClient(): Messaging {
    if (!messaging) {
        messaging = getMessaging(getFirebaseAdmin());
    }
    return messaging;
}

function getTwilioClient(): Twilio {
    if (!twilioClient) {
        const sid = process.env.TWILIO_ACCOUNT_SID;
        const token = process.env.TWILIO_AUTH_TOKEN;
        if (!sid || !token) {
            throw new Error('TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN is missing');
        }
        twilioClient = new Twilio(sid, token);
    }
    return twilioClient;
}

export async function sendInAppNotification(userId: string, title: string, body: string, type: string) {
    try {
        const firestoreDb = getDb();
        await firestoreDb.collection('users').doc(userId).collection('notifications').add({
            title,
            body,
            type,
            read: false,
            createdAt: new Date()
        });
    } catch (error) {
        console.error('Error sending in-app notification:', error);
    }
}

export async function sendPushNotification(fcmToken: string, title: string, body: string) {
    try {
        const messagingClient = getMessagingClient();
        await messagingClient.send({
            token: fcmToken,
            notification: { title, body }
        });
    } catch (error) {
        console.error('Error sending push notification:', error);
    }
}

export async function sendSMS(to: string, body: string) {
    try {
        const client = getTwilioClient();
        await client.messages.create({
            body,
            from: process.env.TWILIO_PHONE_NUMBER,
            to
        });
    } catch (error) {
        console.error('Error sending SMS:', error);
    }
}

