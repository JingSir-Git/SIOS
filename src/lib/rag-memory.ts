// ============================================================
// RAG Memory Retrieval — Local semantic search & relevance scoring
// ============================================================
// Provides TF-IDF-inspired keyword matching + recency + importance
// scoring for retrieving the most relevant memories for a given
// query context. Works entirely client-side with no external API.
// ============================================================

import type { ProfileMemoryEntry, PersonProfile, ConversationSession } from "./types";

// ============================================================
// §1  Text Tokenizer (Chinese + English aware)
// ============================================================

/** Simple tokenizer that handles Chinese characters and English words */
function tokenize(text: string): string[] {
  if (!text) return [];
  // Split Chinese chars individually, English words by whitespace/punctuation
  const tokens: string[] = [];
  // Extract Chinese characters and character bigrams
  const chineseChars = text.match(/[\u4e00-\u9fff]/g) || [];
  tokens.push(...chineseChars);
  // Chinese bigrams for better matching
  for (let i = 0; i < chineseChars.length - 1; i++) {
    tokens.push(chineseChars[i] + chineseChars[i + 1]);
  }
  // Extract English words (lowercase)
  const englishWords = text.match(/[a-zA-Z]{2,}/g) || [];
  tokens.push(...englishWords.map((w) => w.toLowerCase()));
  return tokens;
}

/** Build a term frequency map */
function termFrequency(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const t of tokens) {
    tf.set(t, (tf.get(t) || 0) + 1);
  }
  return tf;
}

// ============================================================
// §2  Relevance Scorer
// ============================================================

interface ScoredMemory {
  memory: ProfileMemoryEntry;
  score: number;
  matchedTerms: string[];
}

/**
 * Score memories against a query using keyword overlap + importance + recency.
 * Returns sorted array of scored memories.
 */
export function scoreMemories(
  memories: ProfileMemoryEntry[],
  query: string,
  options: {
    maxResults?: number;
    minScore?: number;
    recencyBoostDays?: number;
  } = {},
): ScoredMemory[] {
  const { maxResults = 20, minScore = 0.1, recencyBoostDays = 30 } = options;

  const queryTokens = tokenize(query);
  const queryTF = termFrequency(queryTokens);
  const queryTerms = new Set(queryTokens);
  const now = Date.now();

  const scored: ScoredMemory[] = [];

  for (const mem of memories) {
    if (mem.archived) continue;

    const memTokens = tokenize(mem.content + " " + (mem.source || ""));
    const memTF = termFrequency(memTokens);

    // Calculate keyword overlap score (Jaccard-like + TF weighting)
    let keywordScore = 0;
    const matchedTerms: string[] = [];

    for (const [term, queryCount] of queryTF) {
      const memCount = memTF.get(term) || 0;
      if (memCount > 0) {
        // TF-weighted overlap
        keywordScore += Math.min(queryCount, memCount) / Math.max(queryCount, memCount);
        if (!matchedTerms.includes(term)) matchedTerms.push(term);
      }
    }

    // Normalize by query size
    if (queryTerms.size > 0) {
      keywordScore = keywordScore / queryTerms.size;
    }

    // Importance boost (1-5 → 0.6-1.4)
    const importanceBoost = 0.6 + (mem.importance / 5) * 0.8;

    // Recency boost (exponential decay)
    const ageMs = now - new Date(mem.createdAt).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    const recencyBoost = Math.exp(-ageDays / recencyBoostDays);

    // Verified bonus
    const verifiedBonus = mem.verified ? 1.2 : 1.0;

    // Combined score
    const score = keywordScore * importanceBoost * (0.7 + 0.3 * recencyBoost) * verifiedBonus;

    if (score >= minScore) {
      scored.push({ memory: mem, score, matchedTerms });
    }
  }

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, maxResults);
}

// ============================================================
// §3  RAG Context Builder — formats retrieved memories for LLM
// ============================================================

/**
 * Retrieve and format the most relevant memories for a query.
 * This is the main RAG entry point for prompt injection.
 */
export function retrieveRAGContext(
  memories: ProfileMemoryEntry[],
  query: string,
  profile?: PersonProfile,
  maxMemories: number = 10,
): string {
  const scored = scoreMemories(memories, query, { maxResults: maxMemories, minScore: 0.05 });

  if (scored.length === 0) return "";

  const lines: string[] = [
    `## 相关记忆检索 (RAG)${profile ? ` — ${profile.name}` : ""}`,
    `以下是与当前对话最相关的${scored.length}条历史记忆（按相关度排序）：`,
    "",
  ];

  for (let i = 0; i < scored.length; i++) {
    const { memory, score, matchedTerms } = scored[i];
    const date = new Date(memory.createdAt).toLocaleDateString("zh-CN");
    const verified = memory.verified ? " ✓" : "";
    const relevance = Math.round(score * 100);
    lines.push(
      `${i + 1}. [相关度${relevance}%${verified}] ${memory.content} (${date}, 来源: ${memory.source})`
    );
    if (matchedTerms.length > 0 && matchedTerms.length <= 5) {
      lines.push(`   关键词匹配: ${matchedTerms.join(", ")}`);
    }
  }

  lines.push("");
  lines.push("请结合以上检索到的历史记忆进行分析。优先参考标有 ✓ 的已验证记忆。");

  return lines.join("\n");
}

// ============================================================
// §4  Conversation-based RAG — search across conversations
// ============================================================

interface ScoredConversation {
  conversation: ConversationSession;
  score: number;
  matchedTerms: string[];
}

/**
 * Search across conversation history for relevant past discussions.
 */
export function searchConversations(
  conversations: ConversationSession[],
  query: string,
  maxResults: number = 5,
): ScoredConversation[] {
  const queryTokens = tokenize(query);
  const queryTF = termFrequency(queryTokens);
  const queryTerms = new Set(queryTokens);
  const now = Date.now();

  const scored: ScoredConversation[] = [];

  for (const conv of conversations) {
    const text = [
      conv.title || "",
      conv.rawText || "",
      conv.targetName || "",
      conv.context || "",
    ].join(" ");

    const convTokens = tokenize(text.slice(0, 5000)); // limit for performance
    const convTF = termFrequency(convTokens);

    let keywordScore = 0;
    const matchedTerms: string[] = [];

    for (const [term, queryCount] of queryTF) {
      const convCount = convTF.get(term) || 0;
      if (convCount > 0) {
        keywordScore += Math.min(queryCount, convCount) / Math.max(queryCount, convCount);
        if (!matchedTerms.includes(term)) matchedTerms.push(term);
      }
    }

    if (queryTerms.size > 0) {
      keywordScore = keywordScore / queryTerms.size;
    }

    // Recency
    const ageMs = now - new Date(conv.createdAt).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    const recencyBoost = Math.exp(-ageDays / 60);

    const score = keywordScore * (0.7 + 0.3 * recencyBoost);

    if (score > 0.05) {
      scored.push({ conversation: conv, score, matchedTerms });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, maxResults);
}

// ============================================================
// §5  Emotion Prediction — predict emotional trajectory
// ============================================================

export interface EmotionPrediction {
  currentEmotion: string;
  intensity: number; // 0-100
  trend: "escalating" | "stable" | "de-escalating";
  predictedNext: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  suggestions: string[];
}

/** Simple keyword-based emotion detection for real-time use */
const EMOTION_KEYWORDS: Record<string, { keywords: string[]; valence: number }> = {
  愤怒: { keywords: ["生气", "愤怒", "烦", "讨厌", "恨", "怒", "气死", "受够", "混蛋", "滚"], valence: -0.9 },
  焦虑: { keywords: ["担心", "焦虑", "害怕", "紧张", "不安", "着急", "急", "忐忑", "慌"], valence: -0.6 },
  悲伤: { keywords: ["难过", "伤心", "哭", "失望", "痛苦", "心疼", "委屈", "遗憾", "可惜"], valence: -0.7 },
  开心: { keywords: ["开心", "高兴", "快乐", "太好了", "棒", "喜欢", "爱", "幸福", "感谢", "谢谢"], valence: 0.8 },
  平静: { keywords: ["好的", "嗯", "了解", "知道了", "明白", "好吧"], valence: 0.1 },
  惊讶: { keywords: ["真的吗", "不会吧", "天啊", "居然", "没想到", "意外", "惊讶"], valence: 0.0 },
  挫败: { keywords: ["失败", "做不到", "放弃", "算了", "没用", "无所谓", "随便"], valence: -0.5 },
  期待: { keywords: ["期待", "希望", "盼望", "想要", "等不及", "兴奋"], valence: 0.6 },
};

/**
 * Analyze the emotional state of text in real-time (no LLM needed).
 * Useful for quick emotion detection during live conversations.
 */
export function detectEmotion(text: string): {
  primaryEmotion: string;
  secondaryEmotion: string | null;
  valence: number; // -1 to 1
  intensity: number; // 0-100
} {
  const scores: Record<string, number> = {};

  for (const [emotion, { keywords, valence }] of Object.entries(EMOTION_KEYWORDS)) {
    let matchCount = 0;
    for (const kw of keywords) {
      const regex = new RegExp(kw, "gi");
      const matches = text.match(regex);
      if (matches) matchCount += matches.length;
    }
    if (matchCount > 0) {
      scores[emotion] = matchCount * Math.abs(valence);
    }
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  if (sorted.length === 0) {
    return { primaryEmotion: "中性", secondaryEmotion: null, valence: 0, intensity: 20 };
  }

  const primary = sorted[0][0];
  const secondary = sorted.length > 1 ? sorted[1][0] : null;
  const primaryValence = EMOTION_KEYWORDS[primary]?.valence ?? 0;
  const intensity = Math.min(100, Math.round(sorted[0][1] * 25 + 30));

  return {
    primaryEmotion: primary,
    secondaryEmotion: secondary,
    valence: primaryValence,
    intensity,
  };
}

/**
 * Predict emotional trajectory based on a sequence of messages.
 * Returns prediction with trend and risk assessment.
 */
export function predictEmotionTrajectory(
  messages: Array<{ content: string; role: string }>,
): EmotionPrediction {
  if (messages.length === 0) {
    return {
      currentEmotion: "未知",
      intensity: 0,
      trend: "stable",
      predictedNext: "未知",
      riskLevel: "low",
      suggestions: [],
    };
  }

  // Analyze last N messages for trend
  const recentMessages = messages.slice(-6);
  const emotions = recentMessages.map((m) => detectEmotion(m.content));
  const valences = emotions.map((e) => e.valence);

  // Calculate trend
  let trend: EmotionPrediction["trend"] = "stable";
  if (valences.length >= 3) {
    const firstHalf = valences.slice(0, Math.floor(valences.length / 2));
    const secondHalf = valences.slice(Math.floor(valences.length / 2));
    const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    const delta = avgSecond - avgFirst;
    if (delta < -0.2) trend = "escalating"; // getting more negative
    else if (delta > 0.2) trend = "de-escalating";
  }

  const current = emotions[emotions.length - 1];
  const avgValence = valences.reduce((a, b) => a + b, 0) / valences.length;

  // Risk assessment
  let riskLevel: EmotionPrediction["riskLevel"] = "low";
  if (avgValence < -0.7 || (trend === "escalating" && avgValence < -0.3)) {
    riskLevel = "critical";
  } else if (avgValence < -0.4 || trend === "escalating") {
    riskLevel = "high";
  } else if (avgValence < -0.1) {
    riskLevel = "medium";
  }

  // Predict next emotion
  let predictedNext = current.primaryEmotion;
  if (trend === "escalating" && avgValence < -0.3) {
    predictedNext = "愤怒升级";
  } else if (trend === "de-escalating" && avgValence > -0.2) {
    predictedNext = "趋向平静";
  }

  // Generate suggestions based on risk
  const suggestions: string[] = [];
  if (riskLevel === "critical") {
    suggestions.push("建议暂停对话，让双方冷静");
    suggestions.push("使用\"我理解你的感受\"开头回应");
    suggestions.push("避免反驳或否定对方的情绪");
  } else if (riskLevel === "high") {
    suggestions.push("注意对方的情绪变化，适当共情");
    suggestions.push("避免使用可能激化矛盾的词语");
    suggestions.push("尝试转换话题或提出建设性建议");
  } else if (riskLevel === "medium") {
    suggestions.push("保持倾听姿态，给予适当回应");
    suggestions.push("适时表达理解和支持");
  }

  return {
    currentEmotion: current.primaryEmotion,
    intensity: current.intensity,
    trend,
    predictedNext,
    riskLevel,
    suggestions,
  };
}
