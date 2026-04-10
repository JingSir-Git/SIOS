// ============================================================
// MiniMax API Client (Anthropic SDK compatible)
// ============================================================

import Anthropic from "@anthropic-ai/sdk";

let clientInstance: Anthropic | null = null;

function getClient(): Anthropic {
  if (!clientInstance) {
    clientInstance = new Anthropic({
      baseURL: process.env.ANTHROPIC_BASE_URL || "https://api.minimaxi.com/anthropic",
      apiKey: process.env.ANTHROPIC_API_KEY || "",
    });
  }
  return clientInstance;
}

export interface LLMMessage {
  role: "user" | "assistant";
  content: string;
}

export async function callLLM({
  system,
  messages,
  maxTokens = 8000,
  temperature,
}: {
  system: string;
  messages: LLMMessage[];
  maxTokens?: number;
  temperature?: number;
}): Promise<string> {
  const client = getClient();
  const model = process.env.ANTHROPIC_MODEL || "MiniMax-M2.7-highspeed";

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system,
    messages: messages.map((m) => ({
      role: m.role,
      content: [{ type: "text" as const, text: m.content }],
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
}: {
  system: string;
  messages: LLMMessage[];
  maxTokens?: number;
  onChunk: (text: string) => void;
}): Promise<string> {
  const client = getClient();
  const model = process.env.ANTHROPIC_MODEL || "MiniMax-M2.7-highspeed";

  const stream = client.messages.stream({
    model,
    max_tokens: maxTokens,
    system,
    messages: messages.map((m) => ({
      role: m.role,
      content: [{ type: "text" as const, text: m.content }],
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
