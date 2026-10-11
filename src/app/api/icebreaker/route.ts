import { NextRequest, NextResponse } from "next/server";
import { geminiJson } from "@/lib/gemini";

export const runtime = "nodejs";

interface IcebreakerResult {
  line: string;
  source: "gemini" | "mock";
}

/**
 * POST /api/icebreaker
 * body: { interests: string[] }
 * Generates a light, friendly opener for a shared-interest table.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const interests: string[] = Array.isArray(body.interests)
    ? body.interests.filter((x: unknown) => typeof x === "string")
    : [];

  const prompt = `Two cafe guests share these interests: ${
    interests.join(", ") || "coffee"
  }.
Write ONE warm, low-pressure icebreaker question (max 16 words) one could send the other. No emojis, no names.
Respond as JSON: {"line": string}`;

  const ai = await geminiJson<{ line: string }>(prompt);
  if (ai?.line) {
    return NextResponse.json({ line: ai.line, source: "gemini" } as IcebreakerResult);
  }

  const topic = interests[0] || "coffee";
  const result: IcebreakerResult = {
    line: `I noticed we're both into ${topic} — what got you started?`,
    source: "mock",
  };
  return NextResponse.json(result);
}
