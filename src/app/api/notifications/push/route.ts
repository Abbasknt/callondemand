import { NextRequest, NextResponse } from 'next/server';
import { sendPushNotification, sendInAppNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { userId, fcmToken, title, body, type = 'PUSH_ALERT' } = await req.json();

    if (!title || !body) {
      return NextResponse.json({ success: false, error: 'Title and body are required' }, { status: 400 });
    }

    // Send in-app notification to Firestore collection if userId is provided
    if (userId) {
      await sendInAppNotification(userId, title, body, type);
    }

    // Send FCM Push notification if fcmToken is provided
    if (fcmToken) {
      await sendPushNotification(fcmToken, title, body);
    }

    return NextResponse.json({
      success: true,
      message: 'Push notification processed successfully'
    });
  } catch (error: any) {
    console.error('Push Notification API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to dispatch push notification'
    }, { status: 500 });
  }
}
