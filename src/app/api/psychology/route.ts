// ============================================================
// API Route: /api/psychology — Psychology Counseling
// ============================================================

import { NextRequest } from "next/server";
import { callLLM, extractLLMConfig } from "@/lib/api-client";
import { extractJSON } from "@/lib/extract-json";
import { createStreamingResponse } from "@/lib/stream-utils";
import {
  PSYCHOLOGY_SYSTEM_PROMPT,
  buildPsychologyPrompt,
} from "@/lib/prompts";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, profilesSummary, selfDescription, conversationHistory, systemPromptOverride, rawTextMode, languageInstruction } = body;

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

    const llmMessages = [{ role: "user" as const, content: userPrompt }];
    const isStream = request.nextUrl.searchParams.get("stream") === "true";
    const llmConfig = extractLLMConfig(request);
    const systemPrompt = (systemPromptOverride || PSYCHOLOGY_SYSTEM_PROMPT) + (languageInstruction || "");

    if (isStream) {
      return createStreamingResponse({
        system: systemPrompt,
        messages: llmMessages,
        maxTokens: 4000,
        config: llmConfig,
        rawTextMode: !!rawTextMode,
      });
    }

    const raw = await callLLM({
      system: systemPrompt,
      messages: llmMessages,
      maxTokens: 4000,
      config: llmConfig,
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
