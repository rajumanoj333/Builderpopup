import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Thin wrapper around Gemini. If GEMINI_API_KEY is unset, callers should fall
 * back to mock data so the app runs with zero config (great for local dev and
 * for a demo before the key is wired in).
 */

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

export function geminiAvailable(): boolean {
  return Boolean(API_KEY && API_KEY.trim().length > 0);
}

/**
 * Ask Gemini for a JSON object and parse it. Returns null on any failure so the
 * caller can fall back to mock data instead of throwing to the client.
 */
export async function geminiJson<T>(prompt: string): Promise<T | null> {
  if (!geminiAvailable()) return null;

  try {
    const genAI = new GoogleGenerativeAI(API_KEY as string);
    const model = genAI.getGenerativeModel({
      model: MODEL,
      generationConfig: { responseMimeType: "application/json" },
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text) as T;
  } catch (err) {
    // Log server-side; never leak details to the client.
    console.error("[gemini] request failed, falling back to mock:", err);
    return null;
  }
}
