// ============================================================
// AI Memory System — Memory Extraction & Injection Utilities
// ============================================================
// Extracts structured memories from analysis results and formats
// them for injection into LLM prompts as contextual history.
// ============================================================

import { v4 as uuidv4 } from "uuid";
import type {
  ProfileMemoryEntry,
  MemoryCategory,
  PersonProfile,
} from "./types";

// ============================================================
// §1  Memory Extraction — Auto-extract from analysis results
// ============================================================

interface AnalysisResultForMemory {
  summary?: string;
  keyMoments?: Array<{ description: string; significance?: string }>;
  emotionCurve?: Array<{ label: string }>;
  manipulationCheck?: {
    detected: boolean;
    tactics?: string[];
    assessment?: string;
  };
  profileUpdate?: {
    communicationStyle?: {
      overallType?: string;
      triggerPoints?: string[];
      strengths?: string[];
      weaknesses?: string[];
    };
    patterns?: {
      conflictStyle?: string;
      decisionStyle?: string;
    };
  };
}

/**
 * Extract memories from a conversation analysis result.
 * Returns an array of memory entries to be persisted.
 */
export function extractMemoriesFromAnalysis(
  profileId: string,
  profileName: string,
  analysis: AnalysisResultForMemory,
  conversationId?: string,
): ProfileMemoryEntry[] {
  const memories: ProfileMemoryEntry[] = [];
  const now = new Date().toISOString();
  const source = `对话分析 ${new Date().toLocaleDateString("zh-CN")}`;

  // 1. Extract key moments as key_event memories
  if (analysis.keyMoments?.length) {
    for (const km of analysis.keyMoments) {
      memories.push(createMemory({
        profileId,
        category: "key_event",
        content: km.description + (km.significance ? ` — ${km.significance}` : ""),
        source,
        conversationId,
        importance: 3,
        now,
      }));
    }
  }

  // 2. Extract manipulation detection as insight
  if (analysis.manipulationCheck?.detected && analysis.manipulationCheck.tactics?.length) {
    memories.push(createMemory({
      profileId,
      category: "insight",
      content: `检测到潜在操控行为: ${analysis.manipulationCheck.tactics.join("、")}。${analysis.manipulationCheck.assessment || ""}`,
      source,
      conversationId,
      importance: 5,
      now,
    }));
  }

  // 3. Extract communication style changes as pattern_change
  if (analysis.profileUpdate?.communicationStyle?.overallType) {
    memories.push(createMemory({
      profileId,
      category: "pattern_change",
      content: `${profileName}的沟通类型更新为: ${analysis.profileUpdate.communicationStyle.overallType}`,
      source,
      conversationId,
      importance: 2,
      now,
    }));
  }

  // 4. Extract trigger points as preference
  if (analysis.profileUpdate?.communicationStyle?.triggerPoints?.length) {
    for (const tp of analysis.profileUpdate.communicationStyle.triggerPoints) {
      memories.push(createMemory({
        profileId,
        category: "preference",
        content: `情绪触发点: ${tp}`,
        source,
        conversationId,
        importance: 4,
        now,
      }));
    }
  }

  // 5. Extract summary as an insight
  if (analysis.summary) {
    memories.push(createMemory({
      profileId,
      category: "insight",
      content: analysis.summary,
      source,
      conversationId,
      importance: 2,
      now,
    }));
  }

  return memories;
}

// ============================================================
// §2  Memory Injection — Format memories for LLM context
// ============================================================

const CATEGORY_LABELS: Record<MemoryCategory, string> = {
  key_event: "重要事件",
  pattern_change: "模式变化",
  commitment: "承诺追踪",
  preference: "偏好记录",
  relationship_shift: "关系转折",
  insight: "深层洞察",
  user_note: "用户备注",
};

/**
 * Format profile memories into a text block for LLM prompt injection.
 * Returns empty string if no memories are available.
 */
export function formatMemoriesForPrompt(
  memories: ProfileMemoryEntry[],
  profile: PersonProfile,
  maxTokenEstimate: number = 2000,
): string {
  if (!memories || memories.length === 0) return "";

  // Sort by importance desc, then recency
  const sorted = [...memories]
    .filter((m) => !m.archived)
    .sort((a, b) => b.importance - a.importance || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Build sections by category
  const sections: Record<string, string[]> = {};
  let charCount = 0;

  for (const mem of sorted) {
    if (charCount > maxTokenEstimate * 2) break; // rough char estimate
    const cat = mem.category;
    if (!sections[cat]) sections[cat] = [];

    const verifiedTag = mem.verified ? " ✓" : "";
    const entry = `- ${mem.content}${verifiedTag} (${new Date(mem.createdAt).toLocaleDateString("zh-CN")})`;
    sections[cat].push(entry);
    charCount += entry.length;
  }

  // Format output
  const parts: string[] = [
    `## AI记忆系统 — ${profile.name}的历史记忆`,
    `以下是关于${profile.name}的累积记忆（共${memories.filter((m) => !m.archived).length}条，基于${profile.conversationCount}次对话）：`,
    "",
  ];

  for (const [cat, entries] of Object.entries(sections)) {
    parts.push(`### ${CATEGORY_LABELS[cat as MemoryCategory] || cat}`);
    parts.push(...entries);
    parts.push("");
  }

  parts.push("请在你的分析中考虑以上历史记忆，注意观察模式变化和承诺兑现情况。标有 ✓ 的记忆已被用户确认为准确。");

  return parts.join("\n");
}

/**
 * Create a user-editable memory entry manually.
 */
export function createUserMemory(
  profileId: string,
  content: string,
  category: MemoryCategory = "user_note",
  importance: number = 3,
): ProfileMemoryEntry {
  const now = new Date().toISOString();
  return createMemory({
    profileId,
    category,
    content,
    source: "用户手动添加",
    importance,
    now,
    verified: true,
  });
}

// ============================================================
// §3  Internal Helpers
// ============================================================

function createMemory({
  profileId,
  category,
  content,
  source,
  conversationId,
  importance,
  now,
  verified = false,
}: {
  profileId: string;
  category: MemoryCategory;
  content: string;
  source: string;
  conversationId?: string;
  importance: number;
  now: string;
  verified?: boolean;
}): ProfileMemoryEntry {
  return {
    id: uuidv4(),
    profileId,
    category,
    content,
    source,
    conversationId,
    importance,
    createdAt: now,
    updatedAt: now,
    verified,
    archived: false,
  };
}
