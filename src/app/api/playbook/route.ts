// ============================================================
// API Route: /api/playbook — AI Coach Playbook Generator
// ============================================================

import { NextRequest } from "next/server";
import { extractLLMConfig } from "@/lib/api-client";
import { createStreamingResponse } from "@/lib/stream-utils";
import {
  PLAYBOOK_SYSTEM_PROMPT,
  buildPlaybookPrompt,
} from "@/lib/prompts";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profileData, conversationSummaries, memories, relationshipData } = body;

    if (!profileData || typeof profileData !== "string") {
      return Response.json(
        { error: "profileData field is required" },
        { status: 400 }
      );
    }

    const userPrompt = buildPlaybookPrompt(
      profileData,
      conversationSummaries || "",
      memories || "",
      relationshipData || "",
    );

    const llmMessages = [{ role: "user" as const, content: userPrompt }];

    const llmConfig = extractLLMConfig(request);

    // Always stream for playbook — it's a large generation
    return createStreamingResponse({
      system: PLAYBOOK_SYSTEM_PROMPT,
      messages: llmMessages,
      maxTokens: 8000,
      config: llmConfig,
    });
  } catch (err: unknown) {
    console.error("[/api/playbook] error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
