// ============================================================
// Client-side SSE streaming hook
// ============================================================

"use client";

import { useState, useCallback, useRef } from "react";

interface SSEEvent {
  type: "progress" | "result" | "error" | "done";
  data?: unknown;
  text?: string;
}

interface UseStreamingOptions<T> {
  /** API endpoint path, e.g. "/api/analyze" */
  url: string;
  /** Transform the final result before storing */
  transform?: (data: unknown) => T;
  /** Called when streaming completes successfully */
  onSuccess?: (result: T) => void;
  /** Called on error */
  onError?: (error: string) => void;
}

interface UseStreamingReturn<T> {
  /** Start a streaming request */
  startStreaming: (body: Record<string, unknown>) => Promise<void>;
  /** Abort the current stream */
  abort: () => void;
  /** Whether a stream is currently active */
  isStreaming: boolean;
  /** Accumulated raw text from LLM (for "thinking" animation) */
  streamingText: string;
  /** Final parsed result (null until stream completes) */
  result: T | null;
  /** Error message if any */
  error: string;
  /** Reset all state */
  reset: () => void;
}

export function useStreaming<T = unknown>(
  options: UseStreamingOptions<T>
): UseStreamingReturn<T> {
  const { url, transform, onSuccess, onError } = options;

  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [result, setResult] = useState<T | null>(null);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    setIsStreaming(false);
    setStreamingText("");
    setResult(null);
    setError("");
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  const abort = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const startStreaming = useCallback(
    async (body: Record<string, unknown>) => {
      // Abort any existing stream
      if (abortRef.current) {
        abortRef.current.abort();
      }

      const controller = new AbortController();
      abortRef.current = controller;

      setIsStreaming(true);
      setStreamingText("");
      setResult(null);
      setError("");

      try {
        const separator = url.includes("?") ? "&" : "?";
        const streamUrl = `${url}${separator}stream=true`;

        const res = await fetch(streamUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!res.ok) {
          // Fall back to reading error as JSON
          try {
            const errData = await res.json();
            throw new Error(errData.error || `请求失败 (${res.status})`);
          } catch {
            throw new Error(`请求失败 (${res.status})`);
          }
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("无法读取响应流");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Parse SSE events from buffer
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Keep incomplete line in buffer

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            try {
              const event: SSEEvent = JSON.parse(jsonStr);

              switch (event.type) {
                case "progress":
                  if (event.text) {
                    setStreamingText((prev) => prev + event.text);
                  }
                  break;

                case "result": {
                  const finalResult = transform
                    ? transform(event.data)
                    : (event.data as T);
                  setResult(finalResult);
                  onSuccess?.(finalResult);
                  break;
                }

                case "error":
                  setError(event.text || "未知错误");
                  onError?.(event.text || "未知错误");
                  break;

                case "done":
                  setIsStreaming(false);
                  break;
              }
            } catch {
              // Skip malformed events
            }
          }
        }

        setIsStreaming(false);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          // User aborted — not an error
          setIsStreaming(false);
          return;
        }
        const message = err instanceof Error ? err.message : "未知错误";
        setError(message);
        onError?.(message);
        setIsStreaming(false);
      } finally {
        abortRef.current = null;
      }
    },
    [url, transform, onSuccess, onError]
  );

  return {
    startStreaming,
    abort,
    isStreaming,
    streamingText,
    result,
    error,
    reset,
  };
}
