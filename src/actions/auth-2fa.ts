"use server"

import { db } from "@/firebase/server"
import { collection, addDoc, query, where, getDocs, orderBy, limit, deleteDoc, Timestamp } from "firebase/firestore"

/**
 * @fileOverview Server-side actions for 2FA Handshake flow.
 */

interface SendOTPResult {
  success: boolean;
  message: string;
  code?: string; // Only for dev/logging in this environment
}

/**
 * Generates and stores a 6-digit OTP for a user.
 * In a production environment, this would integrate with Twilio (SMS) or a Mailer (Email).
 */
export async function sendTwoFactorCode(email: string, method: 'email' | 'sms'): Promise<SendOTPResult> {
  try {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 10); // 10 minute expiry

    const otpData = {
      email: email.toLowerCase(),
      code,
      method,
      expiresAt: Timestamp.fromDate(expiry),
      createdAt: Timestamp.now(),
      used: false
    };

    // Store in Firestore
    await addDoc(collection(db, "otps"), otpData);

    // LOG THE CODE for the user (simulating the "sent" message)
    console.log(`[SECURE HANDSHAKE] 2FA CODE FOR ${email}: ${code} (Method: ${method})`);

    return { 
      success: true, 
      message: `A verification code has been sent to your ${method === 'email' ? 'email address' : 'registered phone'}.`,
      code // Returning code here for simulation purposes if needed, though usually hidden
    };
  } catch (error) {
    console.error("2FA Send Error:", error);
    return { success: false, message: "Failed to dispatch verification code." };
  }
}

/**
 * Verifies the OTP provided by the user.
 */
export async function verifyTwoFactorCode(email: string, code: string): Promise<{ success: boolean; message: string }> {
  try {
    const q = query(
      collection(db, "otps"),
      where("email", "==", email.toLowerCase()),
      where("code", "==", code),
      where("used", "==", false),
      orderBy("createdAt", "desc"),
      limit(1)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return { success: false, message: "Invalid or expired verification code." };
    }

    const otpDoc = snapshot.docs[0];
    const data = otpDoc.data();
    
    const now = new Date();
    if (data.expiresAt.toDate() < now) {
      return { success: false, message: "Verification code has expired." };
    }

    // Mark as used
    await deleteDoc(otpDoc.ref); // Or update to used: true

    return { success: true, message: "Identity verified." };
  } catch (error) {
    console.error("2FA Verify Error:", error);
    return { success: false, message: "Verification protocol failure." };
  }
}
