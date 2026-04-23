// ============================================================
// API Route: /api/legal — Legal Advisor (plain Markdown response)
// ============================================================

import { NextRequest } from "next/server";
import { createStreamingResponse } from "@/lib/stream-utils";
import { extractLLMConfig } from "@/lib/api-client";
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
    const { message, conversationHistory, systemPrompt, images } = body;

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
