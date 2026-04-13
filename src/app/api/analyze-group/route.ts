// ============================================================
// API Route: /api/analyze-group — Group Chat Analysis
// ============================================================
// Analyzes multi-party conversations with focus on group dynamics,
// power structures, and inter-participant relationships.

import { NextRequest } from "next/server";
import { extractLLMConfig } from "@/lib/api-client";
import { createStreamingResponse } from "@/lib/stream-utils";
import {
  GROUP_ANALYSIS_SYSTEM_PROMPT,
  buildGroupAnalysisPrompt,
} from "@/lib/prompts";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversation, participants, context } = body;
    const isStream = request.nextUrl.searchParams.get("stream") === "true";
    const llmConfig = extractLLMConfig(request);

    if (!conversation || typeof conversation !== "string") {
      return Response.json(
        { error: "conversation field is required" },
        { status: 400 }
      );
    }

    if (!participants || !Array.isArray(participants) || participants.length < 3) {
      return Response.json(
        { error: "participants array with at least 3 members is required for group analysis" },
        { status: 400 }
      );
    }

    const userPrompt = buildGroupAnalysisPrompt(
      conversation,
      participants,
      context
    );

    const llmMessages = [{ role: "user" as const, content: userPrompt }];

    if (isStream) {
      return createStreamingResponse({
        system: GROUP_ANALYSIS_SYSTEM_PROMPT,
        messages: llmMessages,
        maxTokens: 16000,
        config: llmConfig,
        postProcess: (parsed) => ({
          groupAnalysis: {
            ...parsed,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
          },
        }),
      });
    }

    // Non-streaming fallback
    return Response.json(
      { error: "请使用 stream=true 参数" },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error("Group analysis error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
