import { NextRequest, NextResponse } from "next/server";
import { mockRoomState } from "@/lib/cafe";
import { geminiJson } from "@/lib/gemini";

export const runtime = "nodejs";

interface EtaResult {
  minutes: number;
  narration: string;
  source: "gemini" | "mock";
}

/**
 * POST /api/eta
 * body: { drinkId?: string }
 * Returns an estimated readiness time + a short mascot narration line.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const drinkId: string = typeof body.drinkId === "string" ? body.drinkId : "";

  const room = mockRoomState();
  const baseMinutes = room.avgWaitMinutes;

  const prompt = `You are Brewmate's barista mascot. A customer just ordered.
Current average wait: ${baseMinutes} minutes. Room occupancy: ${Math.round(
    room.occupancy * 100
  )}%. Drink id: ${drinkId || "unknown"}.
Give an ETA in minutes (integer, within 1-20) and a single cheerful spoken line (max 14 words) telling them it's being made.
Respond as JSON: {"minutes": number, "narration": string}`;

  const ai = await geminiJson<{ minutes: number; narration: string }>(prompt);
  if (ai && Number.isFinite(ai.minutes)) {
    const result: EtaResult = {
      minutes: Math.max(1, Math.min(20, Math.round(ai.minutes))),
      narration: ai.narration,
      source: "gemini",
    };
    return NextResponse.json(result);
  }

  const result: EtaResult = {
    minutes: baseMinutes,
    narration: `On it! Your drink should be ready in about ${baseMinutes} minutes.`,
    source: "mock",
  };
  return NextResponse.json(result);
}
