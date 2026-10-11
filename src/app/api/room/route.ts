import { NextResponse } from "next/server";
import { mockRoomState } from "@/lib/cafe";
import { geminiJson } from "@/lib/gemini";

export const runtime = "nodejs";

interface RoomSummary {
  occupancy: number;
  sentiment: number;
  avgWaitMinutes: number;
  tables: ReturnType<typeof mockRoomState>["tables"];
  updatedAt: string;
  // One-line brief for the staff "god view".
  staffBrief: string;
  source: "gemini" | "mock";
}

/**
 * GET /api/room
 * Returns live-ish room state plus a Gemini-written staff brief.
 */
export async function GET() {
  const room = mockRoomState();

  const prompt = `You are Brewmate's operations copilot for cafe staff.
Occupancy: ${Math.round(room.occupancy * 100)}%. Sentiment (-1..1): ${room.sentiment.toFixed(
    2
  )}. Average wait: ${room.avgWaitMinutes} min.
Write ONE actionable sentence (max 20 words) advising staff what to do right now. No emojis.
Respond as JSON: {"staffBrief": string}`;

  const ai = await geminiJson<{ staffBrief: string }>(prompt);

  const staffBrief =
    ai?.staffBrief ||
    (room.occupancy > 0.7
      ? "Peak load — open a second register and pre-batch cold brew to cut the queue."
      : room.sentiment < 0.2
      ? "Vibe is dipping — greet waiting guests and check on seated tables."
      : "Steady flow. Keep stations stocked and the music warm.");

  const result: RoomSummary = {
    occupancy: room.occupancy,
    sentiment: room.sentiment,
    avgWaitMinutes: room.avgWaitMinutes,
    tables: room.tables,
    updatedAt: room.updatedAt,
    staffBrief,
    source: ai ? "gemini" : "mock",
  };
  return NextResponse.json(result);
}
