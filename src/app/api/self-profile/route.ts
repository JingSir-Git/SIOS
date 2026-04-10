// ============================================================
// API Route: /api/self-profile — Self Communication Profile Analysis
// ============================================================

import { NextRequest } from "next/server";
import { callLLM } from "@/lib/api-client";
import { extractJSON } from "@/lib/extract-json";
import { createStreamingResponse } from "@/lib/stream-utils";
import {
  SELF_PROFILE_SYSTEM_PROMPT,
  buildSelfProfilePrompt,
} from "@/lib/prompts";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationTexts, mbtiType, existingSelfProfile } = body;

    if (
      !conversationTexts ||
      !Array.isArray(conversationTexts) ||
      conversationTexts.length === 0
    ) {
      return Response.json(
        { error: "conversationTexts array is required" },
        { status: 400 }
      );
    }

    const userPrompt = buildSelfProfilePrompt(
      conversationTexts,
      mbtiType || undefined,
      existingSelfProfile || undefined
    );

    const llmMessages = [{ role: "user" as const, content: userPrompt }];
    const isStream = request.nextUrl.searchParams.get("stream") === "true";

    if (isStream) {
      return createStreamingResponse({
        system: SELF_PROFILE_SYSTEM_PROMPT,
        messages: llmMessages,
        maxTokens: 8000,
        postProcess: (parsed) => ({ profile: parsed }),
      });
    }

    const raw = await callLLM({
      system: SELF_PROFILE_SYSTEM_PROMPT,
      messages: llmMessages,
      maxTokens: 8000,
    });

    const { data: profile, error: parseError } = extractJSON(raw);

    if (!profile || parseError) {
      console.error("Self-profile JSON parse error:", parseError);
      return Response.json(
        { error: `自我画像解析失败: ${parseError}` },
        { status: 500 }
      );
    }

    return Response.json({ profile });
  } catch (error: unknown) {
    console.error("Self-profile error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
