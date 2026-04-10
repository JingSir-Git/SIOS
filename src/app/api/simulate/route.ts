// ============================================================
// API Route: /api/simulate — Role-play Simulation
// ============================================================

import { NextRequest } from "next/server";
import { callLLM, extractLLMConfig } from "@/lib/api-client";
import { extractJSON } from "@/lib/extract-json";
import { createStreamingResponse } from "@/lib/stream-utils";
import {
  SIMULATION_SYSTEM_PROMPT,
  buildSimulationPrompt,
} from "@/lib/prompts";
import type { LLMMessage } from "@/lib/api-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profileDescription, scenario, difficulty, history, userMessage } =
      body;

    if (!userMessage) {
      return Response.json(
        { error: "userMessage is required" },
        { status: 400 }
      );
    }

    const systemPrompt =
      SIMULATION_SYSTEM_PROMPT +
      "\n\n" +
      buildSimulationPrompt(
        profileDescription || "一个典型的商务人士",
        scenario || "商务谈判",
        difficulty || "medium"
      );

    const messages: LLMMessage[] = [];

    if (history && Array.isArray(history)) {
      for (const msg of history) {
        messages.push({
          role: msg.role === "user" ? "user" : "assistant",
          content:
            msg.role === "user"
              ? msg.content
              : JSON.stringify({
                  reply: msg.content,
                  coaching: "",
                  emotionalState: "",
                }),
        });
      }
    }

    messages.push({ role: "user", content: userMessage });

    const isStream = request.nextUrl.searchParams.get("stream") === "true";
    const llmConfig = extractLLMConfig(request);

    if (isStream) {
      return createStreamingResponse({
        system: systemPrompt,
        messages,
        maxTokens: 4000,
        config: llmConfig,
      });
    }

    const raw = await callLLM({
      system: systemPrompt,
      messages,
      maxTokens: 4000,
      config: llmConfig,
    });

    const { data: simulation } = extractJSON(raw);

    if (!simulation) {
      return Response.json({
        reply: raw.trim(),
        coaching: "",
        emotionalState: "未知",
      });
    }

    return Response.json(simulation);
  } catch (error: unknown) {
    console.error("Simulate error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
