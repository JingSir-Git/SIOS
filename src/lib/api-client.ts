// ============================================================
// LLM API Client — supports dynamic user-provided configuration
// ============================================================
// Priority: request-level config > env vars > defaults
// ============================================================

import Anthropic from "@anthropic-ai/sdk";

/** Runtime config passed from API routes (sourced from user settings or env) */
export interface LLMConfig {
  baseURL?: string;
  apiKey?: string;
  model?: string;
}

// Cache clients by baseURL+apiKey to avoid re-creating on every request
const clientCache = new Map<string, Anthropic>();

function getClient(config?: LLMConfig): Anthropic {
  const baseURL = config?.baseURL || process.env.ANTHROPIC_BASE_URL || "https://api.minimaxi.com/anthropic";
  const apiKey = config?.apiKey || process.env.ANTHROPIC_API_KEY || "";

  if (!apiKey) {
    throw new Error(
      "未配置API Key。请在设置中填写API Key，或在服务器环境变量 ANTHROPIC_API_KEY 中配置。"
    );
  }

  const cacheKey = `${baseURL}::${apiKey.slice(0, 8)}`;
  let client = clientCache.get(cacheKey);
  if (!client) {
    client = new Anthropic({ baseURL, apiKey });
    clientCache.set(cacheKey, client);
  }
  return client;
}

function getModel(config?: LLMConfig): string {
  return config?.model || process.env.ANTHROPIC_MODEL || "MiniMax-M2.7-highspeed";
}

/** Extract LLM config from request headers (set by frontend) */
export function extractLLMConfig(request: Request): LLMConfig {
  const baseURL = request.headers.get("x-llm-base-url") || undefined;
  const apiKey = request.headers.get("x-llm-api-key") || undefined;
  const model = request.headers.get("x-llm-model") || undefined;
  return { baseURL, apiKey, model };
}

export interface LLMMessage {
  role: "user" | "assistant";
  content: string;
  /** Optional rich content blocks (images + text) — overrides `content` when present */
  richContent?: Anthropic.ContentBlockParam[];
}

export async function callLLM({
  system,
  messages,
  maxTokens = 8000,
  temperature,
  config,
}: {
  system: string;
  messages: LLMMessage[];
  maxTokens?: number;
  temperature?: number;
  config?: LLMConfig;
}): Promise<string> {
  const client = getClient(config);
  const model = getModel(config);

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.richContent ?? [{ type: "text" as const, text: m.content }],
    })),
    ...(temperature !== undefined ? { temperature } : {}),
  });

  let result = "";
  for (const block of response.content) {
    if (block.type === "text") {
      result += block.text;
    }
  }
  return result;
}

export async function callLLMStreaming({
  system,
  messages,
  maxTokens = 8000,
  onChunk,
  config,
}: {
  system: string;
  messages: LLMMessage[];
  maxTokens?: number;
  onChunk: (text: string) => void;
  config?: LLMConfig;
}): Promise<string> {
  const client = getClient(config);
  const model = getModel(config);

  const stream = client.messages.stream({
    model,
    max_tokens: maxTokens,
    system,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.richContent ?? [{ type: "text" as const, text: m.content }],
    })),
  });

  let result = "";
  try {
    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta &&
        "text" in event.delta
      ) {
        const text = (event.delta as { type: string; text: string }).text;
        result += text;
        onChunk(text);
      }
    }
  } catch (streamErr: unknown) {
    // If we got partial content, return it so extractJSON can attempt repair
    if (result.length > 0) {
      console.warn("[callLLMStreaming] Stream interrupted with partial content, attempting recovery.", streamErr);
      return result;
    }
    throw streamErr;
  }
  return result;
}
