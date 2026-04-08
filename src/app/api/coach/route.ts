// ============================================================
// API Route: /api/coach — Real-time Coaching
// ============================================================

import { NextRequest } from "next/server";
import { callLLM } from "@/lib/api-client";
import { extractJSON } from "@/lib/extract-json";
import {
  COACHING_SYSTEM_PROMPT,
  buildCoachingPrompt,
} from "@/lib/prompts";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, targetProfile, userGoal } = body;

    if (!messages || typeof messages !== "string") {
      return Response.json(
        { error: "messages field is required" },
        { status: 400 }
      );
    }

    const userPrompt = buildCoachingPrompt(
      messages,
      targetProfile ? JSON.stringify(targetProfile) : undefined,
      userGoal
    );

    const raw = await callLLM({
      system: COACHING_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
      maxTokens: 4000,
    });

    const { data: coaching, error: parseError } = extractJSON(raw);

    if (!coaching || parseError) {
      console.error("Coach JSON parse error:", parseError);
      return Response.json(
        { error: `教练建议解析失败: ${parseError}` },
        { status: 500 }
      );
    }

    return Response.json(coaching);
  } catch (error: unknown) {
    console.error("Coach error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
