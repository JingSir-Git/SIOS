// ============================================================
// API Route: /api/legal — Legal Advisor (plain Markdown response)
// ============================================================

import { NextRequest } from "next/server";
import { createStreamingResponse } from "@/lib/stream-utils";
import { extractLLMConfig } from "@/lib/api-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationHistory, systemPrompt } = body;

    if (!message || typeof message !== "string") {
      return Response.json(
        { error: "message field is required" },
        { status: 400 }
      );
    }

    // Build a clean user prompt — no JSON schema, just plain text
    let userPrompt = message;
    if (conversationHistory) {
      userPrompt = `## 对话上下文\n${conversationHistory}\n\n## 用户新问题\n${message}`;
    }

    const llmMessages = [{ role: "user" as const, content: userPrompt }];
    const isStream = request.nextUrl.searchParams.get("stream") === "true";
    const llmConfig = extractLLMConfig(request);

    if (isStream) {
      return createStreamingResponse({
        system: systemPrompt || "你是一位中国法律顾问，用Markdown格式回复。",
        messages: llmMessages,
        maxTokens: 4000,
        config: llmConfig,
        rawTextMode: true,
      });
    }

    // Non-streaming fallback (not used currently)
    return Response.json({ error: "请使用 stream=true 参数" }, { status: 400 });
  } catch (error: unknown) {
    console.error("Legal API error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
