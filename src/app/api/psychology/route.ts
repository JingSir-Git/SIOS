// ============================================================
// API Route: /api/psychology — Psychology Counseling
// ============================================================

import { NextRequest } from "next/server";
import { callLLM } from "@/lib/api-client";
import { extractJSON } from "@/lib/extract-json";
import {
  PSYCHOLOGY_SYSTEM_PROMPT,
  buildPsychologyPrompt,
} from "@/lib/prompts";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, profilesSummary, selfDescription, conversationHistory } = body;

    if (!message || typeof message !== "string") {
      return Response.json(
        { error: "message field is required" },
        { status: 400 }
      );
    }

    const userPrompt = buildPsychologyPrompt(
      message,
      profilesSummary || undefined,
      selfDescription || undefined,
      conversationHistory || undefined
    );

    const raw = await callLLM({
      system: PSYCHOLOGY_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
      maxTokens: 4000,
    });

    const { data: result, error: parseError } = extractJSON(raw);

    if (!result || parseError) {
      console.error("Psychology JSON parse error:", parseError);
      return Response.json(
        { error: `心理分析解析失败: ${parseError}` },
        { status: 500 }
      );
    }

    return Response.json(result);
  } catch (error: unknown) {
    console.error("Psychology error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
