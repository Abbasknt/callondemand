import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { Twilio } from 'twilio';

// Initialize Firebase Admin if not already initialized
let firebaseAdminApp: App;
if (!getApps().length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
    firebaseAdminApp = initializeApp({
        credential: cert(serviceAccount)
    });
} else {
    firebaseAdminApp = getApps()[0];
}

const db = getFirestore(firebaseAdminApp);
const messaging = getMessaging(firebaseAdminApp);
const twilioClient = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export async function sendInAppNotification(userId: string, title: string, body: string, type: string) {
    await db.collection('users').doc(userId).collection('notifications').add({
        title,
        body,
        type,
        read: false,
        createdAt: new Date()
    });
}

export async function sendPushNotification(fcmToken: string, title: string, body: string) {
    try {
        await messaging.send({
            token: fcmToken,
            notification: { title, body }
        });
    } catch (error) {
        console.error('Error sending push notification:', error);
    }
}

export async function sendSMS(to: string, body: string) {
    try {
        await twilioClient.messages.create({
            body,
            from: process.env.TWILIO_PHONE_NUMBER,
            to
        });
    } catch (error) {
        console.error('Error sending SMS:', error);
    }
}
