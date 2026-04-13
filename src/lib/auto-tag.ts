import type { ConversationSession } from "./types";

/**
 * N4: Smart Auto-Tagging for Conversations
 * Derives tags from conversation content and analysis results using keyword matching and heuristics.
 */

interface TagRule {
  tag: string;
  keywords: string[];
  minHits?: number;
}

const CONTENT_RULES: TagRule[] = [
  { tag: "工作", keywords: ["项目", "开会", "加班", "老板", "同事", "KPI", "汇报", "deadline", "需求", "排期"] },
  { tag: "感情", keywords: ["喜欢", "在一起", "分手", "暧昧", "约会", "对象", "恋人", "男朋友", "女朋友", "爱"] },
  { tag: "家庭", keywords: ["爸爸", "妈妈", "父母", "孩子", "家里", "老公", "老婆", "婆婆", "公公"] },
  { tag: "金钱", keywords: ["工资", "贷款", "理财", "投资", "买房", "存款", "花钱", "消费", "价格", "便宜"] },
  { tag: "学习", keywords: ["考试", "学习", "课程", "论文", "老师", "学校", "成绩", "作业", "复习", "毕业"] },
  { tag: "健康", keywords: ["医院", "生病", "头疼", "感冒", "体检", "锻炼", "健身", "减肥", "失眠"] },
  { tag: "社交", keywords: ["聚会", "朋友", "吃饭", "party", "旅行", "出去玩", "周末", "约"] },
  { tag: "决策", keywords: ["要不要", "怎么选", "纠结", "应该", "建议", "帮我想想", "两难", "考虑"] },
  { tag: "冲突", keywords: ["吵架", "生气", "不开心", "委屈", "误解", "道歉", "矛盾", "争执"] },
  { tag: "求助", keywords: ["帮忙", "怎么办", "能不能", "请教", "求助", "拜托", "麻烦"] },
];

const EMOTION_TAGS: { tag: string; check: (curve: { selfEmotion: number }[]) => boolean }[] = [
  { tag: "高情绪波动", check: (c) => { if (c.length < 3) return false; const vals = c.map(e => e.selfEmotion); const max = Math.max(...vals); const min = Math.min(...vals); return max - min > 1.0; } },
  { tag: "整体积极", check: (c) => { if (!c.length) return false; const avg = c.reduce((a, e) => a + e.selfEmotion, 0) / c.length; return avg > 0.3; } },
  { tag: "整体消极", check: (c) => { if (!c.length) return false; const avg = c.reduce((a, e) => a + e.selfEmotion, 0) / c.length; return avg < -0.3; } },
];

export function autoTagConversation(conversation: ConversationSession): string[] {
  const tags = new Set<string>();
  const text = (conversation.rawText || conversation.messages.map((m) => m.content).join(" ")).toLowerCase();

  // Content-based tagging
  for (const rule of CONTENT_RULES) {
    const hits = rule.keywords.filter((kw) => text.includes(kw)).length;
    if (hits >= (rule.minHits ?? 2)) tags.add(rule.tag);
  }

  // Emotion-based tagging
  const curve = conversation.analysis?.emotionCurve;
  if (curve && curve.length > 0) {
    for (const et of EMOTION_TAGS) {
      if (et.check(curve)) tags.add(et.tag);
    }
  }

  // Key moments tagging
  const km = conversation.analysis?.keyMoments;
  if (km && km.length > 0) {
    tags.add("有关键时刻");
    const hasConflict = km.some((k) => k.impact === "negative");
    const hasBreakthrough = km.some((k) => k.impact === "positive");
    if (hasConflict) tags.add("含冲突点");
    if (hasBreakthrough) tags.add("含突破点");
  }

  // Message count tagging
  const msgCount = conversation.messages.length || text.split("\n").filter(Boolean).length;
  if (msgCount > 100) tags.add("长对话");
  else if (msgCount < 10) tags.add("短对话");

  // Participant count tagging
  if (conversation.participants.length > 2) tags.add("群聊");
  if (conversation.participants.length === 2) tags.add("双人对话");

  return Array.from(tags);
}

/** Color mapping for common tags */
export function getTagColor(tag: string): string {
  const map: Record<string, string> = {
    "工作": "bg-blue-500/15 text-blue-300 border-blue-500/30",
    "感情": "bg-pink-500/15 text-pink-300 border-pink-500/30",
    "家庭": "bg-orange-500/15 text-orange-300 border-orange-500/30",
    "金钱": "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
    "学习": "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    "健康": "bg-green-500/15 text-green-300 border-green-500/30",
    "社交": "bg-violet-500/15 text-violet-300 border-violet-500/30",
    "决策": "bg-amber-500/15 text-amber-300 border-amber-500/30",
    "冲突": "bg-red-500/15 text-red-300 border-red-500/30",
    "求助": "bg-teal-500/15 text-teal-300 border-teal-500/30",
    "高情绪波动": "bg-red-500/10 text-red-400 border-red-500/20",
    "整体积极": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    "整体消极": "bg-rose-500/10 text-rose-400 border-rose-500/20",
    "有关键时刻": "bg-amber-500/10 text-amber-400 border-amber-500/20",
    "含冲突点": "bg-red-500/10 text-red-400 border-red-500/20",
    "含突破点": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    "长对话": "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    "短对话": "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    "群聊": "bg-purple-500/10 text-purple-400 border-purple-500/20",
    "双人对话": "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  };
  return map[tag] || "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
}
