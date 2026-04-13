// ============================================================
// API Route: /api/test-connection — Lightweight LLM connectivity test
// ============================================================
// Sends a minimal request to verify API key + base URL + model work.
// Returns { ok: true, model, latencyMs } on success.

import { NextRequest } from "next/server";
import { extractLLMConfig } from "@/lib/api-client";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const llmConfig = extractLLMConfig(request);

    const baseURL =
      llmConfig.baseURL || process.env.ANTHROPIC_BASE_URL || "https://api.minimaxi.com/anthropic";
    const isLocal = baseURL.includes("localhost") || baseURL.includes("127.0.0.1");
    const apiKey =
      llmConfig.apiKey || process.env.ANTHROPIC_API_KEY || (isLocal ? "ollama" : "");
    const model =
      llmConfig.model || process.env.ANTHROPIC_MODEL || "MiniMax-M2.7-highspeed";

    if (!apiKey) {
      return Response.json(
        {
          ok: false,
          error: "未配置 API Key。请在上方填写您的 API Key，或联系管理员配置服务器环境变量。",
          hint: "no_api_key",
        },
        { status: 400 }
      );
    }

    // Minimal LLM call — just ask it to say "ok"
    const client = new Anthropic({ baseURL, apiKey });
    const response = await client.messages.create({
      model,
      max_tokens: 10,
      messages: [{ role: "user", content: "Reply with exactly one word: ok" }],
    });

    const latencyMs = Date.now() - startTime;
    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    return Response.json({
      ok: true,
      model: response.model || model,
      latencyMs,
      reply: text.trim(),
      usage: {
        input: response.usage?.input_tokens ?? 0,
        output: response.usage?.output_tokens ?? 0,
      },
    });
  } catch (error: unknown) {
    const latencyMs = Date.now() - startTime;
    let message = "未知错误";
    let hint = "unknown";

    if (error instanceof Anthropic.AuthenticationError) {
      message = "API Key 无效或已过期，请检查密钥是否正确。";
      hint = "auth_error";
    } else if (error instanceof Anthropic.PermissionDeniedError) {
      message = "API Key 权限不足，请检查账户配额。";
      hint = "permission_error";
    } else if (error instanceof Anthropic.NotFoundError) {
      message = "模型不存在或 API 端点路径错误，请检查配置。";
      hint = "not_found";
    } else if (error instanceof Anthropic.RateLimitError) {
      message = "API 请求频率超限，请稍后重试。";
      hint = "rate_limit";
    } else if (error instanceof Anthropic.APIConnectionError) {
      message = `无法连接到 API 服务器，请检查网络或端点地址是否正确。`;
      hint = "connection_error";
    } else if (error instanceof Anthropic.BadRequestError) {
      message = `请求格式错误: ${(error as Error).message}`;
      hint = "bad_request";
    } else if (error instanceof Error) {
      message = error.message;
      // Try to detect common issues
      if (message.includes("ECONNREFUSED") || message.includes("ENOTFOUND")) {
        hint = "connection_error";
        message = `无法连接到 API 端点，请检查地址是否正确。原始错误: ${message}`;
      } else if (message.includes("timeout") || message.includes("ETIMEDOUT")) {
        hint = "timeout";
        message = "请求超时，请检查网络连接或稍后重试。";
      }
    }

    console.error("[test-connection]", hint, message);

    return Response.json(
      {
        ok: false,
        error: message,
        hint,
        latencyMs,
      },
      { status: 200 } // Return 200 so the frontend can read the body
    );
  }
}
