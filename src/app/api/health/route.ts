import { NextResponse } from "next/server";
import { geminiAvailable } from "@/lib/gemini";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    gemini: geminiAvailable() ? "live" : "mock",
    time: new Date().toISOString(),
  });
}
