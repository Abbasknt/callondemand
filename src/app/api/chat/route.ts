import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('GEMINI_API_KEY is not defined');
}

const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }
  try {
    const { message, history, systemInstruction } = await req.json();
    
    // Convert history format if needed by the SDK
    const formattedHistory = history.map((m: any) => ({
        role: m.role === 'ai' ? 'model' : 'user',
        parts: [{ text: m.content }]
    }));

    const chat = ai.chats.create({
        model: "gemini-2.0-flash", // Use a standard, supported model
        history: formattedHistory,
        config: {
            systemInstruction
        }
    });

    const response = await chat.sendMessage({ message });
    return NextResponse.json({ text: response.text });
  } catch (error) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
  }
}
