import { NextRequest, NextResponse } from "next/server";
import { MENU, drinkById } from "@/lib/cafe";
import { geminiJson } from "@/lib/gemini";

export const runtime = "nodejs";

interface RecoResult {
  drinkId: string;
  reason: string;
  source: "gemini" | "mock";
}

/**
 * POST /api/recommend
 * body: { hour?: number, mood?: string, history?: string[] }
 * Returns a single personalized "today's pick" the 3D menu will make glow.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const hour: number =
    typeof body.hour === "number" ? body.hour : new Date().getHours();
  const mood: string = typeof body.mood === "string" ? body.mood : "";
  const history: string[] = Array.isArray(body.history) ? body.history : [];

  const menuForPrompt = MENU.map((d) => ({
    id: d.id,
    name: d.name,
    tags: d.tags,
    temp: d.temp,
    caffeineMg: d.caffeineMg,
  }));

  const prompt = `You are Brewmate, a warm cafe barista agent. Pick exactly ONE drink for this customer.
Local hour (0-23): ${hour}
Mood hint: ${mood || "unknown"}
Recently ordered drink ids: ${history.join(", ") || "none"}
Menu: ${JSON.stringify(menuForPrompt)}

Rules:
- Prefer lower caffeine late in the day (after 15:00).
- Avoid repeating the most recent history item if possible.
- Explain the choice in plain English using no more than 8 words.
- Avoid marketing phrases, metaphors, and emojis.
Respond as JSON: {"drinkId": string, "reason": string}`;

  const ai = await geminiJson<{ drinkId: string; reason: string }>(prompt);
  if (ai && drinkById(ai.drinkId)) {
    const result: RecoResult = {
      drinkId: ai.drinkId,
      reason: ai.reason,
      source: "gemini",
    };
    return NextResponse.json(result);
  }

  // Mock fallback: simple time-of-day heuristic.
  const late = hour >= 15;
  const pick =
    [...MENU]
      .sort((a, b) => (late ? a.caffeineMg - b.caffeineMg : b.caffeineMg - a.caffeineMg))
      .find((d) => !history.includes(d.id)) || MENU[0];

  const reason = late
    ? "A lower-caffeine choice for this afternoon."
    : "A smooth pick for your morning.";

  const result: RecoResult = { drinkId: pick.id, reason, source: "mock" };
  return NextResponse.json(result);
}
