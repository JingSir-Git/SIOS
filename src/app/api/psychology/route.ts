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
import Anthropic from "@anthropic-ai/sdk";

type ImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

function parseDataURL(dataUrl: string): { media_type: ImageMediaType; data: string } | null {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/);
  if (!match) return null;
  let mime = match[1].toLowerCase();
  if (mime === "image/jpg") mime = "image/jpeg";
  const allowed: ImageMediaType[] = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowed.includes(mime as ImageMediaType)) mime = "image/jpeg";
  return { media_type: mime as ImageMediaType, data: match[2] };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, profilesSummary, selfDescription, conversationHistory, systemPromptOverride, rawTextMode, languageInstruction, images } = body;

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

    // Build rich content if images are provided
    let richContent: Anthropic.ContentBlockParam[] | undefined;
    if (Array.isArray(images) && images.length > 0) {
      richContent = [];
      for (const img of images) {
        if (typeof img === "string") {
          const parsed = parseDataURL(img);
          if (parsed) {
            richContent.push({
              type: "image",
              source: { type: "base64", media_type: parsed.media_type, data: parsed.data },
            });
          }
        }
      }
      richContent.push({ type: "text", text: userPrompt });
    }

    const llmMessages = [{ role: "user" as const, content: userPrompt, ...(richContent ? { richContent } : {}) }];
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
