// ============================================================
// Server-side SSE streaming utilities
// ============================================================

import { callLLMStreaming, type LLMMessage, type LLMConfig, type LLMStreamResult } from "./api-client";
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

/** Maximum continuation attempts when model hits token limit */
const MAX_CONTINUATIONS = 3;

/**
 * Check if a response appears to be truncated JSON
 * (unbalanced braces/brackets or ends mid-string)
 */
function looksLikeTruncatedJSON(text: string): boolean {
  const cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  // Find the first { 
  const startIdx = cleaned.indexOf("{");
  if (startIdx === -1) return false;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = startIdx; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{" || ch === "[") depth++;
    else if (ch === "}" || ch === "]") depth--;
  }

  // If depth > 0, braces are unclosed → truncated
  return depth > 0 || inString;
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
  config,
  rawTextMode = false,
}: {
  system: string;
  messages: LLMMessage[];
  maxTokens?: number;
  postProcess?: (parsed: Record<string, unknown>) => Record<string, unknown>;
  config?: LLMConfig;
  /** When true, skip JSON parsing — send raw accumulated text as the result */
  rawTextMode?: boolean;
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
        let streamResult: LLMStreamResult = await callLLMStreaming({
          system,
          messages,
          maxTokens,
          onChunk: (text) => {
            chunkCount++;
            // Send progress every chunk (frontend will throttle display)
            enqueue({ type: "progress", text });
          },
          config,
        });

        let raw = streamResult.text;

        // ---- Auto-continuation for truncated responses ----
        // If stop_reason is "max_tokens" or the JSON looks truncated,
        // make continuation calls to complete the output.
        if (!rawTextMode) {
          let continuations = 0;
          while (
            continuations < MAX_CONTINUATIONS &&
            (streamResult.stopReason === "max_tokens" || looksLikeTruncatedJSON(raw))
          ) {
            continuations++;
            console.info(
              `[stream-utils] Response truncated (stop_reason=${streamResult.stopReason}, len=${raw.length}), continuation attempt ${continuations}/${MAX_CONTINUATIONS}`
            );

            // Send the accumulated text as assistant message, ask model to continue
            const continuationMessages: LLMMessage[] = [
              ...messages,
              { role: "assistant" as const, content: raw },
              {
                role: "user" as const,
                content: "你的JSON输出被截断了，请从截断处继续输出剩余的JSON内容。只输出剩余部分，不要重复已输出的内容，不要添加任何解释。",
              },
            ];

            try {
              streamResult = await callLLMStreaming({
                system,
                messages: continuationMessages,
                maxTokens,
                onChunk: (text) => {
                  chunkCount++;
                  enqueue({ type: "progress", text });
                },
                config,
              });

              // Strip <think> from continuation and append
              const continuationText = streamResult.text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
              raw += continuationText;
              console.info(
                `[stream-utils] Continuation ${continuations} added ${continuationText.length} chars (total: ${raw.length})`
              );

              // If this continuation completed normally, stop
              if (streamResult.stopReason === "end_turn" && !looksLikeTruncatedJSON(raw)) {
                break;
              }
            } catch (contErr) {
              console.warn(`[stream-utils] Continuation ${continuations} failed:`, contErr);
              break;
            }
          }
        }

        if (rawTextMode) {
          // Raw text mode: skip JSON parsing, send accumulated text as result
          // Strip <think> reasoning blocks from MiniMax models
          const cleanRaw = raw.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
          enqueue({ type: "result", data: { text: cleanRaw } });
        } else {
          // Parse the complete response (strip <think> blocks first)
          const cleanForParse = raw.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
          let { data: parsed, error: parseError } = extractJSON(cleanForParse);

          // Retry: if initial parse fails, attempt a second LLM call to repair the JSON
          if (!parsed && parseError && raw.length > 200) {
            console.warn(
              "[stream-utils] Initial parse failed, attempting LLM-assisted repair...",
              parseError
            );
            try {
              const repairResult = await callLLMStreaming({
                system: "你是一个JSON修复工具。用户会提供一段格式有问题的JSON文本。你需要修复它并直接输出修复后的合法JSON。只输出JSON，不要任何解释。",
                messages: [{
                  role: "user",
                  content: `以下JSON文本解析出错（${parseError}），请修复后直接输出完整的合法JSON：\n\n${cleanForParse.substring(0, 12000)}`,
                }],
                maxTokens: Math.min(maxTokens, 16000),
                onChunk: () => {},
                config,
              });
              const repairParsed = extractJSON(repairResult.text);
              if (repairParsed.data) {
                parsed = repairParsed.data;
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
