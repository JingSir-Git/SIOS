// ============================================================
// Conversation Text Parser  (v2)
// Supports: structured "Name: content", unstructured raw lines,
// WeChat-style rapid-fire messages, and multi-party chat.
// ============================================================

import type { ChatMessage } from "./types";
import { v4 as uuidv4 } from "uuid";

/** The result of parsing, plus a flag indicating whether attribution is needed. */
export interface ParseResult {
  messages: ChatMessage[];
  participants: string[];
  format: "structured" | "unstructured";
  needsAttribution: boolean;
}

/**
 * Parse raw conversation text into structured ChatMessage array.
 *
 * Supports:
 *   Structured:   "张三：你好"  "张三: 你好"  "[2024-01-01 10:00] 张三：你好"
 *   Unstructured:  raw lines without any "Name:" prefix (WeChat copy-paste)
 *
 * When the text is unstructured, each non-empty line becomes a separate
 * message with role="other" and senderName="未归属".  The UI must then
 * show the attribution editor so the user can assign speakers.
 */
export function parseConversation(raw: string): ParseResult {
  const lines = raw.split("\n").filter((l) => l.trim());
  if (lines.length === 0) {
    return { messages: [], participants: [], format: "structured", needsAttribution: false };
  }

  // ---- Step 1: Detect format ----
  // A line is "structured" if it matches  Name：content  or  Name: content
  // We require the name portion to be short (≤15 chars) and NOT look like
  // a normal sentence, to avoid false positives like "我不喝了：真的"
  const colonPattern = /^(?:\[.*?\]\s*)?(.{1,15}?)[：:]\s*(.+)$/;
  const timestampPattern =
    /^\[(\d{4}[-/]\d{2}[-/]\d{2}\s+\d{2}:\d{2}(?::\d{2})?)\]\s*/;

  let structuredCount = 0;
  for (const line of lines) {
    const clean = line.trim().replace(timestampPattern, "");
    if (colonPattern.test(clean)) structuredCount++;
  }

  // If ≥40% of lines look structured, treat as structured format
  const isStructured = structuredCount / lines.length >= 0.4;

  if (isStructured) {
    return parseStructured(lines, colonPattern, timestampPattern);
  } else {
    return parseUnstructured(lines);
  }
}

// ---- Structured parser (original logic, improved) ----
function parseStructured(
  lines: string[],
  colonPattern: RegExp,
  timestampPattern: RegExp
): ParseResult {
  const messages: ChatMessage[] = [];
  const participantSet = new Set<string>();

  let currentSender = "";
  let currentContent = "";
  let currentTimestamp: string | undefined;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let timestamp: string | undefined;
    let cleanLine = trimmed;
    const tsMatch = trimmed.match(timestampPattern);
    if (tsMatch) {
      timestamp = tsMatch[1];
      cleanLine = trimmed.slice(tsMatch[0].length);
    }

    const colonMatch = cleanLine.match(colonPattern);
    if (colonMatch) {
      if (currentSender && currentContent) {
        participantSet.add(currentSender);
        messages.push({
          id: uuidv4(),
          role: "other",
          senderName: currentSender,
          content: currentContent.trim(),
          timestamp: currentTimestamp,
        });
      }
      currentSender = colonMatch[1].trim();
      currentContent = colonMatch[2];
      currentTimestamp = timestamp;
    } else {
      if (currentSender) {
        currentContent += "\n" + cleanLine;
      } else {
        currentSender = "未知";
        currentContent = cleanLine;
        currentTimestamp = timestamp;
      }
    }
  }

  if (currentSender && currentContent) {
    participantSet.add(currentSender);
    messages.push({
      id: uuidv4(),
      role: "other",
      senderName: currentSender,
      content: currentContent.trim(),
      timestamp: currentTimestamp,
    });
  }

  const participants = Array.from(participantSet);

  // Determine self vs other
  const selfNames = ["我", "自己", "me", "Me", "ME"];
  let selfName = participants.find((p) => selfNames.includes(p));
  if (!selfName && participants.length > 0) {
    selfName = participants[0];
  }
  for (const msg of messages) {
    msg.role = msg.senderName === selfName ? "self" : "other";
  }

  return {
    messages,
    participants,
    format: "structured",
    needsAttribution: false,
  };
}

// ---- Unstructured parser with smart auto-attribution ----
function parseUnstructured(lines: string[]): ParseResult {
  const messages: ChatMessage[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    messages.push({
      id: uuidv4(),
      role: "other",
      senderName: "未归属",
      content: trimmed,
    });
  }

  // Run smart auto-attribution to guess speaker turns
  smartAutoAttribute(messages);

  return {
    messages,
    participants: ["我", "对方"],
    format: "unstructured",
    needsAttribution: true, // still show editor, but with pre-filled guesses
  };
}

// ============================================================
// Smart Auto-Attribution Heuristics
// ============================================================
// Uses linguistic cues, message length patterns, and conversational
// flow to guess which messages belong to which speaker.  The result
// is a *best-guess* that the user can then correct in the UI.
// ============================================================

/** Response starters — usually a *different* speaker replying */
const RESPONSE_STARTERS =
  /^(嗯|好的|好吧|好|对|是的|没错|可以|行|行吧|哦|啊|嗯嗯|哈哈|呵呵|OK|ok|收到|明白|了解|没事|不是|不行|不要|算了|随便|无所谓|确实|也是|真的|谢谢|感谢|不客气|不用)/;

/** Continuation starters — same speaker adding more */
const CONTINUATION_STARTERS =
  /^(然后|而且|还有|另外|对了|不过|但是|所以|就是|反正|其实|主要是|关键是|顺便|或者|比如|像是)/;

/** Pure emoji / sticker line — likely a reaction from other speaker */
const EMOJI_ONLY = /^\[.+\]$|^[\u{1F600}-\u{1FFFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]+$/u;

function smartAutoAttribute(messages: ChatMessage[]): void {
  if (messages.length === 0) return;

  // Phase 1: Group consecutive messages into "bursts" from the same speaker.
  // A burst ends when heuristics suggest the speaker has changed.
  const groups: number[][] = [];
  let currentGroup: number[] = [0];

  for (let i = 1; i < messages.length; i++) {
    const prev = messages[i - 1].content;
    const curr = messages[i].content;

    if (shouldSwitchSpeaker(prev, curr, currentGroup.length)) {
      groups.push([...currentGroup]);
      currentGroup = [i];
    } else {
      currentGroup.push(i);
    }
  }
  if (currentGroup.length > 0) groups.push(currentGroup);

  // Phase 2: Alternate groups between "我" (self) and "对方" (other).
  // First group is assumed to be "self" — user can swap later.
  let isSelf = true;
  for (const group of groups) {
    for (const idx of group) {
      messages[idx].role = isSelf ? "self" : "other";
      messages[idx].senderName = isSelf ? "我" : "对方";
    }
    isSelf = !isSelf;
  }
}

/**
 * Decide whether the current message is from a *different* speaker
 * than the previous one.
 */
function shouldSwitchSpeaker(
  prevMsg: string,
  currentMsg: string,
  groupSize: number
): boolean {
  const prev = prevMsg.trim();
  const curr = currentMsg.trim();

  // 1. Continuation markers → same speaker
  if (CONTINUATION_STARTERS.test(curr)) return false;

  // 2. Pure emoji reaction → different speaker
  if (EMOJI_ONLY.test(curr) && !EMOJI_ONLY.test(prev)) return true;

  // 3. Previous ends with question mark → response = different speaker
  if (/[？?]$/.test(prev)) return true;

  // 4. Response starters → different speaker
  if (RESPONSE_STARTERS.test(curr)) return true;

  // 5. Rapid-fire short messages cluster together (same speaker typing fast)
  //    Both short and group hasn't grown too large
  if (prev.length < 10 && curr.length < 10 && groupSize < 4) return false;

  // 6. Long burst that's been going on — a shift to much longer/shorter msg
  //    suggests a different speaker
  if (groupSize >= 3 && prev.length < 12 && curr.length > 25) return true;
  if (groupSize >= 3 && prev.length > 25 && curr.length < 8) return true;

  // 7. Previous was medium-long complete thought and current looks independent
  if (prev.length > 20 && curr.length > 15) return true;

  // 8. Short messages keep clustering
  if (prev.length < 15 && curr.length < 15 && groupSize < 5) return false;

  // Default: switch (alternating is the most common pattern)
  return true;
}

/**
 * Format messages back to readable text for LLM consumption.
 * Uses senderName to label each message.
 */
export function formatMessagesForLLM(messages: ChatMessage[]): string {
  return messages
    .map((m) => `${m.senderName}：${m.content}`)
    .join("\n");
}
