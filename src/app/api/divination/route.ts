// ============================================================
// API Route: /api/divination — Divination / Metaphysics Chat
// ============================================================
// Supports multi-turn conversations with custom system prompts
// for various traditional Chinese and Western divination systems.
// Uses raw text SSE streaming (not JSON-structured) since
// divination responses are free-form prose, not parseable JSON.

import { NextRequest } from "next/server";
import { callLLM, callLLMStreaming, extractLLMConfig, type LLMMessage } from "@/lib/api-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, systemPrompt } = body;

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
      "你是一位学养深厚的玄学研究者，精通中国传统数术文化与西方神秘学体系。请以专业、严谨的态度进行解读。";

    const llmMessages: LLMMessage[] = messages.map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

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
            await callLLMStreaming({
              system,
              messages: llmMessages,
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
    const raw = await callLLM({
      system,
      messages: llmMessages,
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
