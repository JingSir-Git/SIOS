// ============================================================
// API Route: /api/eq-review — EQ Training Review
// ============================================================

import { NextRequest } from "next/server";
import { callLLM } from "@/lib/api-client";
import { extractJSON } from "@/lib/extract-json";
import { createStreamingResponse } from "@/lib/stream-utils";
import {
  EQ_REVIEW_SYSTEM_PROMPT,
  buildEQReviewPrompt,
} from "@/lib/prompts";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, targetProfile } = body;

    if (!messages || typeof messages !== "string") {
      return Response.json(
        { error: "messages field is required" },
        { status: 400 }
      );
    }

    const userPrompt = buildEQReviewPrompt(
      messages,
      targetProfile ? JSON.stringify(targetProfile) : undefined
    );

    const llmMessages = [{ role: "user" as const, content: userPrompt }];
    const isStream = request.nextUrl.searchParams.get("stream") === "true";

    if (isStream) {
      return createStreamingResponse({
        system: EQ_REVIEW_SYSTEM_PROMPT,
        messages: llmMessages,
        maxTokens: 8000,
        postProcess: (parsed) => ({ report: parsed }),
      });
    }

    const raw = await callLLM({
      system: EQ_REVIEW_SYSTEM_PROMPT,
      messages: llmMessages,
      maxTokens: 8000,
    });

    const { data: review, error: parseError } = extractJSON(raw);

    if (!review || parseError) {
      console.error("EQ review JSON parse error:", parseError);
      return Response.json(
        { error: `情商复盘解析失败: ${parseError}` },
        { status: 500 }
      );
    }

    return Response.json({ report: review });
  } catch (error: unknown) {
    console.error("EQ review error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
