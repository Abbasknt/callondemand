import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

export async function POST(req: NextRequest) {
  try {
    const { message, history, systemInstruction } = await req.json();
    
    // Convert history format if needed by the SDK
    const formattedHistory = history.map((m: any) => ({
        role: m.role === 'ai' ? 'model' : 'user',
        parts: [{ text: m.content }]
    }));

    const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
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
