// ============================================================
// API Route: /api/analyze — Conversation Analysis
// ============================================================

import { NextRequest } from "next/server";
import { callLLM } from "@/lib/api-client";
import { extractJSON } from "@/lib/extract-json";
import {
  ANALYSIS_SYSTEM_PROMPT,
  buildAnalysisPrompt,
} from "@/lib/prompts";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversation, context, existingProfile, targetName, mbtiInfo } = body;

    if (!conversation || typeof conversation !== "string") {
      return Response.json(
        { error: "conversation field is required" },
        { status: 400 }
      );
    }

    const userPrompt = buildAnalysisPrompt(
      conversation,
      context,
      existingProfile ? JSON.stringify(existingProfile) : undefined,
      mbtiInfo
    );

    const raw = await callLLM({
      system: ANALYSIS_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
      maxTokens: 16000,
    });

    const { data: analysis, error: parseError } = extractJSON(raw);

    if (!analysis || parseError) {
      console.error("Analysis JSON parse error:", parseError, "\nRaw:", raw.substring(0, 500));
      return Response.json(
        { error: `分析结果解析失败: ${parseError}`, raw: raw.substring(0, 300) },
        { status: 500 }
      );
    }

    return Response.json({
      analysis: {
        ...(analysis as Record<string, unknown>),
        id: crypto.randomUUID(),
        conversationId: "",
        createdAt: new Date().toISOString(),
      },
      targetName: targetName || "对方",
    });
  } catch (error: unknown) {
    console.error("Analysis error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
