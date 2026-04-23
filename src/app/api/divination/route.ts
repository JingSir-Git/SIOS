// ============================================================
// API Route: /api/divination — Divination / Metaphysics Chat
// ============================================================
// Supports multi-turn conversations with custom system prompts
// for various traditional Chinese and Western divination systems.
// Uses raw text SSE streaming (not JSON-structured) since
// divination responses are free-form prose, not parseable JSON.

import { NextRequest } from "next/server";
import { callLLM, callLLMStreaming, extractLLMConfig, type LLMMessage } from "@/lib/api-client";
import Anthropic from "@anthropic-ai/sdk";

type ImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

/** Parse a data-URL into media_type + raw base64 string */
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
    const { messages, systemPrompt, images } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        { error: "messages array is required and must not be empty" },
        { status: 400 }
      );
    }

    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        return Response.json(
          { error: "Each message must have role and content" },
          { status: 400 }
        );
      }
    }

    const system =
      systemPrompt ||
      "你是一位学养深厚的玄学研究者，精通中国传统数术文化与西方神秘学体系。请以专业、严谨的态度进行解读。解读时注重心理关怀，以积极赋能为导向，遇到不利之处要委婉表达并给出化解建议，最终以鼓励和祝福收尾。";

    // Check if first user message has attached images (for face/palm reading)
    const hasImages = Array.isArray(images) && images.length > 0;

    const llmMessages: LLMMessage[] = messages.map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // If images provided, build rich content for the first user message
    let richFirstContent: Anthropic.ContentBlockParam[] | null = null;
    if (hasImages) {
      richFirstContent = [];
      for (const img of images) {
        if (typeof img === "string") {
          const parsed = parseDataURL(img);
          if (parsed) {
            richFirstContent.push({
              type: "image",
              source: { type: "base64", media_type: parsed.media_type, data: parsed.data },
            });
          }
        }
      }
      // Add the text of the first user message
      const firstUserMsg = messages.find((m: { role: string }) => m.role === "user");
      if (firstUserMsg) {
        richFirstContent.push({ type: "text", text: firstUserMsg.content });
      }
    }

    const isStream = request.nextUrl.searchParams.get("stream") === "true";
    const llmConfig = extractLLMConfig(request);

    if (isStream) {
      // Raw text SSE streaming — each chunk is sent as { text: "..." }
      const encoder = new TextEncoder();
      let cancelled = false;

      const stream = new ReadableStream({
        async start(controller) {
          const enqueue = (data: string) => {
            if (cancelled) return;
            try {
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            } catch {
              cancelled = true;
            }
          };

          try {
            // If images present, inject rich content into the first user message
            const streamMessages = hasImages && richFirstContent
              ? llmMessages.map((m, i) => {
                  const isFirstUser = i === llmMessages.findIndex(mm => mm.role === "user");
                  return isFirstUser ? { ...m, richContent: richFirstContent! } : m;
                })
              : llmMessages;

            await callLLMStreaming({
              system,
              messages: streamMessages,
              maxTokens: 8000,
              onChunk: (text) => {
                enqueue(JSON.stringify({ text }));
              },
              config: llmConfig,
            });
            enqueue("[DONE]");
          } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Unknown error";
            enqueue(JSON.stringify({ error: msg }));
            enqueue("[DONE]");
          } finally {
            if (!cancelled) {
              try { controller.close(); } catch { /* already closed */ }
            }
          }
        },
        cancel() {
          cancelled = true;
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          "X-Accel-Buffering": "no",
        },
      });
    }

    // Non-streaming fallback
    const nonStreamMessages = hasImages && richFirstContent
      ? llmMessages.map((m, i) => {
          const isFirstUser = i === llmMessages.findIndex(mm => mm.role === "user");
          return isFirstUser ? { ...m, richContent: richFirstContent! } : m;
        })
      : llmMessages;

    const raw = await callLLM({
      system,
      messages: nonStreamMessages,
      maxTokens: 8000,
      config: llmConfig,
    });

    return Response.json({ text: raw });
  } catch (error: unknown) {
    console.error("Divination API error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
