// ============================================================
// Server-side SSE streaming utilities
// ============================================================

import { callLLMStreaming, type LLMMessage } from "./api-client";
import { extractJSON } from "./extract-json";

/**
 * SSE event types:
 * - progress: Raw text chunk from LLM (for "thinking" animation)
 * - result:   Final parsed JSON result
 * - error:    Error message
 * - done:     Stream complete signal
 */
export interface SSEEvent {
  type: "progress" | "result" | "error" | "done";
  data?: unknown;
  text?: string;
}

function encodeSSE(event: SSEEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

/**
 * Creates an SSE Response that streams LLM output and returns parsed JSON.
 *
 * @param system    - System prompt
 * @param messages  - Chat messages
 * @param maxTokens - Max tokens for LLM
 * @param postProcess - Optional function to transform the parsed JSON before sending
 */
export function createStreamingResponse({
  system,
  messages,
  maxTokens = 8000,
  postProcess,
}: {
  system: string;
  messages: LLMMessage[];
  maxTokens?: number;
  postProcess?: (parsed: Record<string, unknown>) => Record<string, unknown>;
}): Response {
  const encoder = new TextEncoder();
  let cancelled = false;

  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (event: SSEEvent) => {
        if (cancelled) return;
        try {
          controller.enqueue(encoder.encode(encodeSSE(event)));
        } catch {
          cancelled = true;
        }
      };

      try {
        // Accumulate chunks and send progress events
        let chunkCount = 0;
        const raw = await callLLMStreaming({
          system,
          messages,
          maxTokens,
          onChunk: (text) => {
            chunkCount++;
            // Send progress every chunk (frontend will throttle display)
            enqueue({ type: "progress", text });
          },
        });

        // Parse the complete response
        let { data: parsed, error: parseError } = extractJSON(raw);

        // Retry: if initial parse fails, attempt a second LLM call to repair the JSON
        if (!parsed && parseError && raw.length > 200) {
          console.warn(
            "[stream-utils] Initial parse failed, attempting LLM-assisted repair...",
            parseError
          );
          try {
            const repairRaw = await callLLMStreaming({
              system: "你是一个JSON修复工具。用户会提供一段格式有问题的JSON文本。你需要修复它并直接输出修复后的合法JSON。只输出JSON，不要任何解释。",
              messages: [{
                role: "user",
                content: `以下JSON文本解析出错（${parseError}），请修复后直接输出完整的合法JSON：\n\n${raw.substring(0, 12000)}`,
              }],
              maxTokens: Math.min(maxTokens, 16000),
              onChunk: () => {},
            });
            const repairResult = extractJSON(repairRaw);
            if (repairResult.data) {
              parsed = repairResult.data;
              parseError = null;
              console.info("[stream-utils] LLM-assisted JSON repair succeeded");
            }
          } catch (repairErr) {
            console.warn("[stream-utils] LLM-assisted repair failed:", repairErr);
          }
        }

        if (!parsed || parseError) {
          console.error(
            "[stream-utils] JSON parse failed:",
            parseError,
            `\nResponse length: ${raw.length} chars, ${chunkCount} chunks`,
            "\nRaw head:", raw.substring(0, 300),
            "\nRaw tail:", raw.substring(Math.max(0, raw.length - 500))
          );
          enqueue({
            type: "error",
            text: `解析失败: ${parseError}`,
            data: { raw: raw.substring(0, 500) },
          });
        } else {
          const result = postProcess
            ? postProcess(parsed as Record<string, unknown>)
            : parsed;
          enqueue({ type: "result", data: result });
        }

        enqueue({ type: "done" });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        enqueue({ type: "error", text: message });
        enqueue({ type: "done" });
      } finally {
        if (!cancelled) {
          try {
            controller.close();
          } catch {
            // already closed
          }
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
