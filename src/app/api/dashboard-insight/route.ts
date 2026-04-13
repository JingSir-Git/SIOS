// ============================================================
// API Route: /api/dashboard-insight — AI Data Insight Generator
// Supports ?stream=true for SSE typewriter effect
// ============================================================

import { NextRequest } from "next/server";
import { callLLM, callLLMStreaming, extractLLMConfig } from "@/lib/api-client";

const SYSTEM_PROMPT = `你是 Social Intelligence OS 的数据分析引擎。你根据用户的数据大盘统计数据，生成一段简明专业的数据洞察报告。

要求：
1. 用2-4段简洁的中文自然语言输出，无需JSON格式
2. 融入统计学术语（如置信区间、趋势显著性、相关性等）
3. 给出明确的结论和可操作建议
4. 如果发现异常模式或值得关注的趋势，重点标注
5. 语气专业但易读，像Nature正刊的研究摘要风格
6. 控制在200字以内`;

function buildUserPrompt(statsSnapshot: string): string {
  return `以下是用户的数据大盘统计快照，请生成专业的数据洞察报告：

${statsSnapshot}

请直接输出洞察文本（纯文本，不要JSON或markdown代码块）。`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { statsSnapshot, languageInstruction } = body;

    if (!statsSnapshot || typeof statsSnapshot !== "string") {
      return Response.json(
        { error: "statsSnapshot field is required" },
        { status: 400 }
      );
    }

    const userPrompt = buildUserPrompt(statsSnapshot);
    const llmConfig = extractLLMConfig(request);
    const isStream = request.nextUrl.searchParams.get("stream") === "true";

    if (isStream) {
      const encoder = new TextEncoder();
      let cancelled = false;
      const stream = new ReadableStream({
        async start(controller) {
          const enqueue = (event: { type: string; text?: string }) => {
            if (cancelled) return;
            try {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
            } catch { cancelled = true; }
          };
          try {
            await callLLMStreaming({
              system: SYSTEM_PROMPT + (languageInstruction || ""),
              messages: [{ role: "user" as const, content: userPrompt }],
              maxTokens: 600,
              onChunk: (text) => enqueue({ type: "chunk", text }),
              config: llmConfig,
            });
            enqueue({ type: "done" });
          } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Unknown error";
            enqueue({ type: "error", text: msg });
            enqueue({ type: "done" });
          } finally {
            if (!cancelled) { try { controller.close(); } catch { /* already closed */ } }
          }
        },
        cancel() { cancelled = true; },
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

    const raw = await callLLM({
      system: SYSTEM_PROMPT + (languageInstruction || ""),
      messages: [{ role: "user" as const, content: userPrompt }],
      maxTokens: 600,
      config: llmConfig,
    });

    return Response.json({ insight: raw.trim() });
  } catch (error: unknown) {
    console.error("Dashboard insight error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
