import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

let aiClient: GoogleGenAI | null = null;

function isInvalidKey(key?: string) {
  if (!key) return true;
  const k = key.trim().toLowerCase();
  return (
    k === '' ||
    k === 'undefined' ||
    k === 'null' ||
    k.includes('dummy') ||
    k.includes('placeholder') ||
    k.includes('your_') ||
    k.includes('change_me')
  );
}

function getAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (isInvalidKey(apiKey)) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey!,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

export async function POST(req: NextRequest) {
  try {
    const { message, history, systemInstruction } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (isInvalidKey(apiKey)) {
      return NextResponse.json({
        text: "I am your Call on Demand (COD) Nigeria AI assistant. Please configure a valid GEMINI_API_KEY in environment settings to enable live AI generation!"
      });
    }
    
    // Convert history format if needed by the SDK
    const formattedHistory = Array.isArray(history) ? history.map((m: any) => ({
        role: m.role === 'ai' ? 'model' : 'user',
        parts: [{ text: m.content || '' }]
    })) : [];

    const ai = getAIClient();
    if (!ai) {
      return NextResponse.json({
        text: "I am your Call on Demand (COD) Nigeria AI assistant. Gemini API client could not be initialized with the provided API key."
      });
    }

    const chat = ai.chats.create({
        model: "gemini-3.6-flash",
        history: formattedHistory,
        config: {
            systemInstruction
        }
    });

    const response = await chat.sendMessage({ message });
    return NextResponse.json({ text: response.text });
  } catch (error: any) {
    const errorMsg = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
    if (errorMsg.includes('API key not valid') || errorMsg.includes('INVALID_ARGUMENT') || errorMsg.includes('400')) {
      console.info("Gemini API key is invalid or restricted; providing fallback assistant response.");
    } else {
      console.warn("Gemini API call failed, providing fallback response:", errorMsg);
    }
    
    return NextResponse.json({ 
      text: "I am your Call on Demand (COD) Nigeria AI assistant. How can I help you optimize your logistics, wallet, food, or shortlet operations today?" 
    });
  }
}
