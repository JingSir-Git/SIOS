// ============================================================
// Universal Chat Timestamp Parser
// ============================================================
// Extracts and normalizes timestamps from various chat platform
// export formats: WeChat, QQ, Telegram, WhatsApp, Line, iMessage,
// Messenger, Discord, and generic formats.

export interface ParsedTimestamp {
  /** Original matched string */
  raw: string;
  /** Normalized ISO date string */
  iso: string;
  /** Detected platform source */
  platform: ChatPlatform;
  /** Confidence of the detection (0-1) */
  confidence: number;
}

export type ChatPlatform =
  | "wechat"
  | "qq"
  | "telegram"
  | "whatsapp"
  | "line"
  | "imessage"
  | "discord"
  | "messenger"
  | "generic";

interface TimestampPattern {
  platform: ChatPlatform;
  regex: RegExp;
  /** Parse the match groups into a Date. Return null if invalid. */
  parse: (match: RegExpMatchArray) => Date | null;
  confidence: number;
}

// ---- Platform-specific patterns ----

const PATTERNS: TimestampPattern[] = [
  // WeChat export: "2024-01-15 14:30:21" or "2024/01/15 14:30"
  {
    platform: "wechat",
    regex: /(\d{4})[-/](\d{1,2})[-/](\d{1,2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/,
    parse: (m) => {
      const d = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0));
      return isValidDate(d) ? d : null;
    },
    confidence: 0.9,
  },

  // WeChat Chinese: "2024年1月15日 14:30" or "2024年01月15日 下午2:30"
  {
    platform: "wechat",
    regex: /(\d{4})年(\d{1,2})月(\d{1,2})日\s*(?:上午|下午|AM|PM)?\s*(\d{1,2}):(\d{2})(?::(\d{2}))?/,
    parse: (m) => {
      let hour = +m[4];
      const raw = m[0];
      if ((raw.includes("下午") || raw.includes("PM")) && hour < 12) hour += 12;
      if ((raw.includes("上午") || raw.includes("AM")) && hour === 12) hour = 0;
      const d = new Date(+m[1], +m[2] - 1, +m[3], hour, +m[5], +(m[6] || 0));
      return isValidDate(d) ? d : null;
    },
    confidence: 0.95,
  },

  // QQ export: "2024-01-15 14:30:21" (same as WeChat but often with seconds)
  // QQ also uses "2024/1/15 2:30:21 PM"
  {
    platform: "qq",
    regex: /(\d{4})\/(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)?/i,
    parse: (m) => {
      let hour = +m[4];
      if (m[7]?.toUpperCase() === "PM" && hour < 12) hour += 12;
      if (m[7]?.toUpperCase() === "AM" && hour === 12) hour = 0;
      const d = new Date(+m[1], +m[2] - 1, +m[3], hour, +m[5], +m[6]);
      return isValidDate(d) ? d : null;
    },
    confidence: 0.85,
  },

  // Telegram export: "01.15.2024 14:30" or "15.01.2024 14:30"
  {
    platform: "telegram",
    regex: /(\d{1,2})\.(\d{1,2})\.(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/,
    parse: (m) => {
      // Ambiguous: could be DD.MM.YYYY or MM.DD.YYYY
      // Telegram typically uses DD.MM.YYYY
      const d = new Date(+m[3], +m[2] - 1, +m[1], +m[4], +m[5], +(m[6] || 0));
      return isValidDate(d) ? d : null;
    },
    confidence: 0.8,
  },

  // WhatsApp: "1/15/24, 2:30 PM" or "15/1/24, 14:30" or "[1/15/24, 2:30:21 PM]"
  {
    platform: "whatsapp",
    regex: /\[?(\d{1,2})\/(\d{1,2})\/(\d{2,4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?\]?/i,
    parse: (m) => {
      let year = +m[3];
      if (year < 100) year += 2000;
      let hour = +m[4];
      if (m[7]?.toUpperCase() === "PM" && hour < 12) hour += 12;
      if (m[7]?.toUpperCase() === "AM" && hour === 12) hour = 0;
      // Try M/D/Y first (US WhatsApp format)
      const d = new Date(year, +m[1] - 1, +m[2], hour, +m[5], +(m[6] || 0));
      return isValidDate(d) ? d : null;
    },
    confidence: 0.85,
  },

  // Discord: "01/15/2024 2:30 PM" or "Today at 2:30 PM" (we skip relative)
  {
    platform: "discord",
    regex: /(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)/i,
    parse: (m) => {
      let hour = +m[4];
      if (m[6]?.toUpperCase() === "PM" && hour < 12) hour += 12;
      if (m[6]?.toUpperCase() === "AM" && hour === 12) hour = 0;
      const d = new Date(+m[3], +m[1] - 1, +m[2], hour, +m[5]);
      return isValidDate(d) ? d : null;
    },
    confidence: 0.8,
  },

  // LINE: "2024/01/15 14:30"
  {
    platform: "line",
    regex: /(\d{4})\/(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2})/,
    parse: (m) => {
      const d = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
      return isValidDate(d) ? d : null;
    },
    confidence: 0.75,
  },

  // iMessage / generic: "Jan 15, 2024 at 2:30 PM" or "January 15, 2024 2:30:21 PM"
  {
    platform: "imessage",
    regex: /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{1,2}),?\s+(\d{4})\s+(?:at\s+)?(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i,
    parse: (m) => {
      const months: Record<string, number> = {
        jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
        jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
      };
      const mon = months[m[1].slice(0, 3).toLowerCase()];
      if (mon === undefined) return null;
      let hour = +m[4];
      if (m[7]?.toUpperCase() === "PM" && hour < 12) hour += 12;
      if (m[7]?.toUpperCase() === "AM" && hour === 12) hour = 0;
      const d = new Date(+m[3], mon, +m[2], hour, +m[5], +(m[6] || 0));
      return isValidDate(d) ? d : null;
    },
    confidence: 0.85,
  },

  // Generic bracketed: "[2024-01-15 14:30:21]" or "(2024-01-15 14:30)"
  {
    platform: "generic",
    regex: /[\[(](\d{4})[-/](\d{1,2})[-/](\d{1,2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?[\])]/,
    parse: (m) => {
      const d = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0));
      return isValidDate(d) ? d : null;
    },
    confidence: 0.9,
  },

  // Chinese relative: "昨天 14:30" "今天 14:30" "前天 14:30"
  {
    platform: "wechat",
    regex: /(今天|昨天|前天)\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/,
    parse: (m) => {
      const now = new Date();
      const dayOffset = m[1] === "今天" ? 0 : m[1] === "昨天" ? -1 : -2;
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset, +m[2], +m[3], +(m[4] || 0));
      return isValidDate(d) ? d : null;
    },
    confidence: 0.7,
  },

  // Weekday Chinese: "星期一 14:30" "周三 14:30"
  {
    platform: "wechat",
    regex: /(?:星期|周)(一|二|三|四|五|六|日|天)\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/,
    parse: (m) => {
      const dayMap: Record<string, number> = { "日": 0, "天": 0, "一": 1, "二": 2, "三": 3, "四": 4, "五": 5, "六": 6 };
      const targetDay = dayMap[m[1]];
      if (targetDay === undefined) return null;
      const now = new Date();
      const currentDay = now.getDay();
      let diff = targetDay - currentDay;
      if (diff > 0) diff -= 7; // look backward
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff, +m[2], +m[3], +(m[4] || 0));
      return isValidDate(d) ? d : null;
    },
    confidence: 0.6,
  },
];

function isValidDate(d: Date): boolean {
  return !isNaN(d.getTime()) && d.getFullYear() >= 2000 && d.getFullYear() <= 2100;
}

/**
 * Extract a timestamp from a single line of text.
 * Returns the best (highest confidence) match, or null.
 */
export function extractTimestamp(line: string): ParsedTimestamp | null {
  let best: ParsedTimestamp | null = null;

  for (const pattern of PATTERNS) {
    const match = line.match(pattern.regex);
    if (!match) continue;

    const date = pattern.parse(match);
    if (!date) continue;

    const result: ParsedTimestamp = {
      raw: match[0],
      iso: date.toISOString(),
      platform: pattern.platform,
      confidence: pattern.confidence,
    };

    if (!best || result.confidence > best.confidence) {
      best = result;
    }
  }

  return best;
}

/**
 * Detect the predominant chat platform from a multi-line text.
 * Returns the platform with the most timestamp matches.
 */
export function detectPlatform(text: string): { platform: ChatPlatform; confidence: number; sampleCount: number } {
  const lines = text.split("\n").slice(0, 50); // Sample first 50 lines
  const counts: Partial<Record<ChatPlatform, { count: number; totalConf: number }>> = {};

  for (const line of lines) {
    const ts = extractTimestamp(line);
    if (!ts) continue;
    const entry = counts[ts.platform] || { count: 0, totalConf: 0 };
    entry.count++;
    entry.totalConf += ts.confidence;
    counts[ts.platform] = entry;
  }

  let bestPlatform: ChatPlatform = "generic";
  let bestScore = 0;
  let sampleCount = 0;

  for (const [platform, entry] of Object.entries(counts) as [ChatPlatform, { count: number; totalConf: number }][]) {
    const score = entry.count * entry.totalConf;
    if (score > bestScore) {
      bestScore = score;
      bestPlatform = platform;
      sampleCount = entry.count;
    }
  }

  return {
    platform: bestPlatform,
    confidence: sampleCount > 0 ? bestScore / sampleCount : 0,
    sampleCount,
  };
}

/**
 * Strip the timestamp portion from a line, returning the cleaned line.
 */
export function stripTimestamp(line: string): { cleaned: string; timestamp: ParsedTimestamp | null } {
  const ts = extractTimestamp(line);
  if (!ts) return { cleaned: line, timestamp: null };
  return {
    cleaned: line.replace(ts.raw, "").trim(),
    timestamp: ts,
  };
}

/**
 * Given an array of messages without timestamps, infer approximate
 * timing based on message characteristics (typing speed heuristics).
 *
 * Returns an array of estimated intervals in seconds between consecutive messages.
 */
export function inferMessageIntervals(messages: { content: string; role: string }[]): number[] {
  if (messages.length < 2) return [];

  const intervals: number[] = [];

  for (let i = 1; i < messages.length; i++) {
    const prev = messages[i - 1];
    const curr = messages[i];

    // Base: 5 seconds for quick replies, more for longer messages
    let interval = 5;

    // Reading time for previous message (~300 chars/min for Chinese)
    interval += (prev.content.length / 300) * 60;

    // Typing time for current message (~120 chars/min)
    interval += (curr.content.length / 120) * 60;

    // Speaker change typically adds think time
    if (prev.role !== curr.role) {
      interval += 10;
    }

    // Very short messages (emoji, "ok") → quick exchange
    if (curr.content.length < 5) {
      interval = Math.min(interval, 8);
    }

    // Long messages → more composing time
    if (curr.content.length > 100) {
      interval += 30;
    }

    intervals.push(Math.round(interval));
  }

  return intervals;
}

const PLATFORM_LABELS: Record<ChatPlatform, string> = {
  wechat: "微信",
  qq: "QQ",
  telegram: "Telegram",
  whatsapp: "WhatsApp",
  line: "LINE",
  imessage: "iMessage",
  discord: "Discord",
  messenger: "Messenger",
  generic: "通用格式",
};

export function getPlatformLabel(platform: ChatPlatform): string {
  return PLATFORM_LABELS[platform] || platform;
}

// ============================================================
// Time Sequence Verification
// ============================================================

export interface TimeOrderIssue {
  index: number;
  timestamp: string;
  prevTimestamp: string;
  message: string;
}

/**
 * Verify that messages with timestamps are in chronological order.
 * Returns a list of issues where time goes backwards.
 */
export function verifyTimeOrder(
  messages: { content: string; timestamp?: string }[]
): TimeOrderIssue[] {
  const issues: TimeOrderIssue[] = [];
  let lastTime = 0;
  let lastTs = "";

  for (let i = 0; i < messages.length; i++) {
    const ts = messages[i].timestamp;
    if (!ts) continue;

    const time = new Date(ts).getTime();
    if (isNaN(time)) continue;

    if (lastTime > 0 && time < lastTime) {
      const diff = lastTime - time;
      const diffMinutes = Math.round(diff / 60000);
      issues.push({
        index: i,
        timestamp: ts,
        prevTimestamp: lastTs,
        message: `第${i + 1}条消息时间(${new Date(ts).toLocaleString("zh-CN")})早于前一条(${new Date(lastTs).toLocaleString("zh-CN")})，差距${diffMinutes}分钟`,
      });
    }

    if (time > lastTime) {
      lastTime = time;
      lastTs = ts;
    }
  }

  return issues;
}
