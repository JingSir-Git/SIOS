// ============================================================
// Achievement System — Hidden & Exploration Achievements
// ============================================================
// Positive, exploration-oriented, and hidden achievements.
// Achievements are checked lazily against current app state.
// ============================================================

export type AchievementCategory = "exploration" | "growth" | "hidden";

export interface AchievementDef {
  id: string;
  icon: string;
  /** zh / en titles */
  title: { zh: string; en: string };
  /** zh / en descriptions */
  description: { zh: string; en: string };
  category: AchievementCategory;
  /** Max level (default 1). Multi-level achievements unlock progressively. */
  maxLevel?: number;
  /** If true, description is hidden until unlocked */
  secret?: boolean;
}

export interface UnlockedAchievement {
  id: string;
  unlockedAt: string; // ISO date
  level: number;      // 1-based
}

// ============================================================
// Achievement Definitions
// ============================================================

export const ACHIEVEMENTS: AchievementDef[] = [
  // ─── Exploration Achievements ───
  {
    id: "first_analysis",
    icon: "🎯",
    title: { zh: "初探心迹", en: "First Insight" },
    description: { zh: "完成第一次对话分析", en: "Complete your first conversation analysis" },
    category: "exploration",
  },
  {
    id: "first_profile",
    icon: "👤",
    title: { zh: "人物速写", en: "Character Sketch" },
    description: { zh: "创建第一个人物画像", en: "Create your first person profile" },
    category: "exploration",
  },
  {
    id: "psychology_start",
    icon: "🧠",
    title: { zh: "心灵对话", en: "Soul Talk" },
    description: { zh: "首次使用心理顾问", en: "Use the psychology counselor for the first time" },
    category: "exploration",
  },
  {
    id: "legal_start",
    icon: "⚖️",
    title: { zh: "法律先锋", en: "Legal Pioneer" },
    description: { zh: "首次使用法律顾问", en: "Consult the legal advisor for the first time" },
    category: "exploration",
  },
  {
    id: "divination_start",
    icon: "🔮",
    title: { zh: "玄学初探", en: "Mystic Novice" },
    description: { zh: "首次进行玄学占卜", en: "Perform your first divination" },
    category: "exploration",
  },
  {
    id: "dashboard_visit",
    icon: "📊",
    title: { zh: "数据鉴赏", en: "Data Connoisseur" },
    description: { zh: "首次访问数据大盘", en: "Visit the dashboard for the first time" },
    category: "exploration",
  },
  {
    id: "drill_start",
    icon: "🎭",
    title: { zh: "实战演练", en: "Drill Sergeant" },
    description: { zh: "首次进行模拟演练", en: "Complete your first simulation drill" },
    category: "exploration",
  },
  {
    id: "plan_start",
    icon: "📝",
    title: { zh: "战略规划", en: "Master Planner" },
    description: { zh: "首次创建社交规划", en: "Create your first social plan" },
    category: "exploration",
  },
  {
    id: "feedback_first",
    icon: "💬",
    title: { zh: "评价达人", en: "Feedback Giver" },
    description: { zh: "首次给AI回复评分", en: "Rate an AI response for the first time" },
    category: "exploration",
  },
  {
    id: "image_upload",
    icon: "📸",
    title: { zh: "火眼金睛", en: "Eagle Eye" },
    description: { zh: "首次上传图片进行分析", en: "Upload an image for analysis for the first time" },
    category: "exploration",
  },

  // ─── Growth Achievements ───
  {
    id: "profile_collector",
    icon: "🌟",
    title: { zh: "人际网络", en: "Social Network" },
    description: { zh: "创建5/15/30个人物画像", en: "Create 5/15/30 person profiles" },
    category: "growth",
    maxLevel: 3,
  },
  {
    id: "conversation_master",
    icon: "💎",
    title: { zh: "对话大师", en: "Conversation Master" },
    description: { zh: "分析10/50/100段对话", en: "Analyze 10/50/100 conversations" },
    category: "growth",
    maxLevel: 3,
  },
  {
    id: "eq_rising",
    icon: "📈",
    title: { zh: "EQ成长", en: "EQ Rising" },
    description: { zh: "EQ评分达到60/75/90", en: "Achieve an EQ score of 60/75/90" },
    category: "growth",
    maxLevel: 3,
  },
  {
    id: "positive_vibes",
    icon: "🌈",
    title: { zh: "正能量", en: "Positive Vibes" },
    description: { zh: "累计获得10/30/60次正向反馈", en: "Receive 10/30/60 positive feedbacks" },
    category: "growth",
    maxLevel: 3,
  },
  {
    id: "divination_explorer",
    icon: "✨",
    title: { zh: "玄学探索者", en: "Mystic Explorer" },
    description: { zh: "尝试3种/全部占卜类型", en: "Try 3 / all divination types" },
    category: "growth",
    maxLevel: 2,
  },
  {
    id: "memory_keeper",
    icon: "🧩",
    title: { zh: "记忆编织", en: "Memory Weaver" },
    description: { zh: "累计创建10/30条AI记忆", en: "Create 10/30 AI memories" },
    category: "growth",
    maxLevel: 2,
  },
  {
    id: "streak_user",
    icon: "🔥",
    title: { zh: "持之以恒", en: "Consistency King" },
    description: { zh: "连续3/7/14天使用", en: "Use the app for 3/7/14 consecutive days" },
    category: "growth",
    maxLevel: 3,
  },

  // ─── Hidden Achievements ───
  {
    id: "night_owl",
    icon: "🦉",
    title: { zh: "夜猫子", en: "Night Owl" },
    description: { zh: "在凌晨0点-4点使用应用", en: "Use the app between midnight and 4 AM" },
    category: "hidden",
    secret: true,
  },
  {
    id: "early_bird",
    icon: "🌅",
    title: { zh: "早起鸟儿", en: "Early Bird" },
    description: { zh: "在早上5点-6点使用应用", en: "Use the app between 5 AM and 6 AM" },
    category: "hidden",
    secret: true,
  },
  {
    id: "jack_of_all_trades",
    icon: "🎪",
    title: { zh: "全能达人", en: "Jack of All Trades" },
    description: { zh: "使用过所有主要功能模块", en: "Use every major feature module at least once" },
    category: "hidden",
    secret: true,
  },
  {
    id: "perfectionist",
    icon: "💯",
    title: { zh: "完美主义者", en: "Perfectionist" },
    description: { zh: "在10次以上反馈中保持100%好评率", en: "Maintain 100% positive feedback rate on 10+ feedbacks" },
    category: "hidden",
    secret: true,
  },
  {
    id: "deep_diver",
    icon: "🔬",
    title: { zh: "深度探索", en: "Deep Diver" },
    description: { zh: "分析一段超过100条消息的对话", en: "Analyze a conversation with 100+ messages" },
    category: "hidden",
    secret: true,
  },
  {
    id: "wordsmith",
    icon: "✍️",
    title: { zh: "妙笔生花", en: "Wordsmith" },
    description: { zh: "累计输入超过10,000字", en: "Type over 10,000 characters total" },
    category: "hidden",
    secret: true,
  },
  {
    id: "relationship_web",
    icon: "🕸️",
    title: { zh: "关系之网", en: "Relationship Web" },
    description: { zh: "建立10条人际关系连接", en: "Create 10 relationship connections" },
    category: "hidden",
    secret: true,
  },
  {
    id: "zen_master",
    icon: "🧘",
    title: { zh: "禅意人生", en: "Zen Master" },
    description: { zh: "在心理顾问中进行10次以上对话", en: "Have 10+ conversations with the psychology counselor" },
    category: "hidden",
    secret: true,
  },
];

// ============================================================
// Achievement Checker — evaluates unlocked achievements
// ============================================================

export interface AchievementCheckContext {
  profileCount: number;
  conversationCount: number;
  maxEQ: number;
  positiveFeedbackCount: number;
  totalFeedbackCount: number;
  divinationCategories: string[];
  divinationCount: number;
  memoryCount: number;
  relationshipCount: number;
  chatSessionDomains: string[];
  chatSessionsByDomain: Record<string, number>;
  maxMessageCount: number; // max msgs in a single conversation
  totalCharactersTyped: number;
  modulesUsed: Set<string>;
  currentHour: number;
  consecutiveDays: number;
  hasFeedback: boolean;
  hasUploadedImage: boolean;
}

const ALL_DIVINATION_CATEGORIES = ["yijing", "bazi", "ziwei", "fengshui", "tarot", "qimen", "mianxiang", "dream", "cezi"];
const ALL_MODULES = ["analyze", "psychology", "legal", "divination", "dashboard", "drill", "plan"];

interface LevelResult { unlocked: boolean; level: number }

function checkLevel(condition: boolean[], maxLevel: number): LevelResult {
  let level = 0;
  for (let i = 0; i < Math.min(condition.length, maxLevel); i++) {
    if (condition[i]) level = i + 1;
    else break;
  }
  return { unlocked: level > 0, level };
}

export function evaluateAchievements(
  ctx: AchievementCheckContext,
  existing: UnlockedAchievement[],
): UnlockedAchievement[] {
  const now = new Date().toISOString();
  const existingMap = new Map(existing.map((e) => [e.id, e]));
  const results: UnlockedAchievement[] = [...existing];

  function tryUnlock(id: string, level: number) {
    const prev = existingMap.get(id);
    if (!prev) {
      const entry: UnlockedAchievement = { id, unlockedAt: now, level };
      results.push(entry);
      return true;
    }
    if (level > prev.level) {
      prev.level = level;
      prev.unlockedAt = now;
      return true;
    }
    return false;
  }

  // ─── Exploration ───
  if (ctx.conversationCount >= 1) tryUnlock("first_analysis", 1);
  if (ctx.profileCount >= 1) tryUnlock("first_profile", 1);
  if ((ctx.chatSessionsByDomain["psychology"] ?? 0) >= 1) tryUnlock("psychology_start", 1);
  if ((ctx.chatSessionsByDomain["legal"] ?? 0) >= 1) tryUnlock("legal_start", 1);
  if (ctx.divinationCount >= 1) tryUnlock("divination_start", 1);
  if (ctx.modulesUsed.has("dashboard")) tryUnlock("dashboard_visit", 1);
  if (ctx.modulesUsed.has("drill")) tryUnlock("drill_start", 1);
  if (ctx.modulesUsed.has("plan")) tryUnlock("plan_start", 1);
  if (ctx.hasFeedback) tryUnlock("feedback_first", 1);
  if (ctx.hasUploadedImage) tryUnlock("image_upload", 1);

  // ─── Growth ───
  {
    const r = checkLevel([ctx.profileCount >= 5, ctx.profileCount >= 15, ctx.profileCount >= 30], 3);
    if (r.unlocked) tryUnlock("profile_collector", r.level);
  }
  {
    const r = checkLevel([ctx.conversationCount >= 10, ctx.conversationCount >= 50, ctx.conversationCount >= 100], 3);
    if (r.unlocked) tryUnlock("conversation_master", r.level);
  }
  {
    const r = checkLevel([ctx.maxEQ >= 60, ctx.maxEQ >= 75, ctx.maxEQ >= 90], 3);
    if (r.unlocked) tryUnlock("eq_rising", r.level);
  }
  {
    const r = checkLevel([ctx.positiveFeedbackCount >= 10, ctx.positiveFeedbackCount >= 30, ctx.positiveFeedbackCount >= 60], 3);
    if (r.unlocked) tryUnlock("positive_vibes", r.level);
  }
  {
    const uniqueDiv = ctx.divinationCategories.length;
    const r = checkLevel([uniqueDiv >= 3, uniqueDiv >= ALL_DIVINATION_CATEGORIES.length], 2);
    if (r.unlocked) tryUnlock("divination_explorer", r.level);
  }
  {
    const r = checkLevel([ctx.memoryCount >= 10, ctx.memoryCount >= 30], 2);
    if (r.unlocked) tryUnlock("memory_keeper", r.level);
  }
  {
    const r = checkLevel([ctx.consecutiveDays >= 3, ctx.consecutiveDays >= 7, ctx.consecutiveDays >= 14], 3);
    if (r.unlocked) tryUnlock("streak_user", r.level);
  }

  // ─── Hidden ───
  if (ctx.currentHour >= 0 && ctx.currentHour < 4) tryUnlock("night_owl", 1);
  if (ctx.currentHour >= 5 && ctx.currentHour < 6) tryUnlock("early_bird", 1);

  {
    const allUsed = ALL_MODULES.every((m) => ctx.modulesUsed.has(m));
    if (allUsed) tryUnlock("jack_of_all_trades", 1);
  }

  if (ctx.totalFeedbackCount >= 10 && ctx.positiveFeedbackCount === ctx.totalFeedbackCount) {
    tryUnlock("perfectionist", 1);
  }

  if (ctx.maxMessageCount >= 100) tryUnlock("deep_diver", 1);
  if (ctx.totalCharactersTyped >= 10000) tryUnlock("wordsmith", 1);
  if (ctx.relationshipCount >= 10) tryUnlock("relationship_web", 1);
  if ((ctx.chatSessionsByDomain["psychology"] ?? 0) >= 10) tryUnlock("zen_master", 1);

  return results;
}

/** Build AchievementCheckContext from store state (called from components) */
export function buildAchievementContext(state: {
  profiles: { id: string }[];
  conversations: { messages?: unknown[] }[];
  eqScores: { overallScore: number }[];
  responseFeedback: { rating: string }[];
  divinationRecords: { category: string }[];
  profileMemories: { id: string }[];
  relationships: { id?: string; profileId?: string }[];
  chatSessions: { domain: string; messages?: unknown[] }[];
  moduleHistory: Record<string, { id: string }[]>;
  achievements: UnlockedAchievement[];
  activeTab: string;
  totalCharactersTyped?: number;
  consecutiveDays?: number;
  hasUploadedImage?: boolean;
}): AchievementCheckContext {
  const chatSessionsByDomain: Record<string, number> = {};
  for (const s of state.chatSessions) {
    chatSessionsByDomain[s.domain] = (chatSessionsByDomain[s.domain] || 0) + 1;
  }

  const divinationCategories = [...new Set(state.divinationRecords.map((r) => r.category))];

  const modulesUsed = new Set<string>();
  if (state.conversations.length > 0) modulesUsed.add("analyze");
  if (chatSessionsByDomain["psychology"]) modulesUsed.add("psychology");
  if (chatSessionsByDomain["legal"]) modulesUsed.add("legal");
  if (state.divinationRecords.length > 0) modulesUsed.add("divination");
  // moduleHistory keys map to modules
  for (const key of Object.keys(state.moduleHistory)) {
    if (state.moduleHistory[key]?.length > 0) modulesUsed.add(key);
  }
  // Current tab counts as visited
  if (state.activeTab) modulesUsed.add(state.activeTab);

  const maxMsgCount = Math.max(
    0,
    ...state.conversations.map((c) => (Array.isArray(c.messages) ? c.messages.length : 0)),
  );

  const positiveFeedbackCount = state.responseFeedback.filter(
    (f) => f.rating === "up" || f.rating === "positive" || f.rating === "good",
  ).length;

  return {
    profileCount: state.profiles.length,
    conversationCount: state.conversations.length,
    maxEQ: state.eqScores.length > 0 ? Math.max(...state.eqScores.map((e) => e.overallScore)) : 0,
    positiveFeedbackCount,
    totalFeedbackCount: state.responseFeedback.length,
    divinationCategories,
    divinationCount: state.divinationRecords.length,
    memoryCount: state.profileMemories.length,
    relationshipCount: state.relationships.length,
    chatSessionDomains: Object.keys(chatSessionsByDomain),
    chatSessionsByDomain,
    maxMessageCount: maxMsgCount,
    totalCharactersTyped: state.totalCharactersTyped ?? 0,
    modulesUsed,
    currentHour: new Date().getHours(),
    consecutiveDays: state.consecutiveDays ?? 1,
    hasFeedback: state.responseFeedback.length > 0,
    hasUploadedImage: state.hasUploadedImage ?? false,
  };
}
