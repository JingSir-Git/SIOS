/**
 * Adaptive Learning System
 *
 * Tracks user behavior, learns preferences, and adjusts
 * suggestion style weights over time.
 */

// ---- Types ----

export type FeedbackAction = "adopted" | "ignored" | "modified" | "dismissed";

export type SuggestionStyle =
  | "direct"      // 直接了当
  | "gentle"      // 委婉温和
  | "analytical"  // 分析型
  | "empathetic"  // 共情型
  | "strategic";  // 策略型

export interface FeedbackEntry {
  id: string;
  timestamp: string;
  module: "analyze" | "coach" | "strategy" | "simulate" | "realtime" | "quick-assist";
  action: FeedbackAction;
  /** The suggestion style that was shown */
  style?: SuggestionStyle;
  /** What the suggestion was about (brief) */
  context?: string;
  /** Time user spent reading before acting (ms) */
  readDuration?: number;
  /** Whether the user copied the suggestion text */
  wasCopied?: boolean;
}

export interface StyleWeight {
  style: SuggestionStyle;
  weight: number; // 0-100, higher = prefer more
  label: string;
}

export interface EQGrowthPoint {
  date: string;
  score: number;
  module: string;
  conversationCount: number;
}

export interface LearningProfile {
  /** Style preference weights — adapted over time */
  styleWeights: StyleWeight[];
  /** How many total feedback events we've collected */
  totalFeedback: number;
  /** Running stats per module */
  moduleStats: Record<string, { used: number; adopted: number; ignored: number }>;
  /** Preferred response length: "short" | "medium" | "long" */
  preferredLength: "short" | "medium" | "long";
  /** Time of day the user is most active */
  peakHours: number[];
  /** Topics the user engages with most */
  topTopics: string[];
}

// ---- Default Profile ----

export function getDefaultLearningProfile(): LearningProfile {
  return {
    styleWeights: [
      { style: "direct", weight: 50, label: "直接了当" },
      { style: "gentle", weight: 50, label: "委婉温和" },
      { style: "analytical", weight: 50, label: "理性分析" },
      { style: "empathetic", weight: 50, label: "共情理解" },
      { style: "strategic", weight: 50, label: "策略导向" },
    ],
    totalFeedback: 0,
    moduleStats: {},
    preferredLength: "medium",
    peakHours: [],
    topTopics: [],
  };
}

// ---- Feedback Processing ----

/**
 * Process a feedback event and update the learning profile.
 * Returns the updated profile (immutable update).
 */
export function processFeedback(
  profile: LearningProfile,
  feedback: FeedbackEntry
): LearningProfile {
  const updated = { ...profile };

  // Update total feedback count
  updated.totalFeedback = (profile.totalFeedback || 0) + 1;

  // Update module stats
  const mod = feedback.module;
  const stats = { ...(profile.moduleStats[mod] || { used: 0, adopted: 0, ignored: 0 }) };
  stats.used += 1;
  if (feedback.action === "adopted") stats.adopted += 1;
  if (feedback.action === "ignored" || feedback.action === "dismissed") stats.ignored += 1;
  updated.moduleStats = { ...profile.moduleStats, [mod]: stats };

  // Update style weights based on feedback
  if (feedback.style) {
    updated.styleWeights = profile.styleWeights.map((sw) => {
      if (sw.style !== feedback.style) return sw;
      let delta = 0;
      switch (feedback.action) {
        case "adopted":
          delta = 5; // User liked this style
          break;
        case "modified":
          delta = 2; // Partially liked
          break;
        case "ignored":
          delta = -3; // User didn't engage
          break;
        case "dismissed":
          delta = -5; // Actively rejected
          break;
      }
      // Extra boost if user copied the text
      if (feedback.wasCopied) delta += 3;
      // Boost if user spent time reading (> 5 seconds)
      if (feedback.readDuration && feedback.readDuration > 5000) delta += 1;

      return {
        ...sw,
        weight: Math.max(5, Math.min(100, sw.weight + delta)),
      };
    });
  }

  // Update preferred length based on reading patterns
  if (feedback.readDuration) {
    if (feedback.readDuration < 3000 && feedback.action === "adopted") {
      // Quick adoption = prefers short
      updated.preferredLength = "short";
    } else if (feedback.readDuration > 15000 && feedback.action === "adopted") {
      // Long reading + adoption = prefers detailed
      updated.preferredLength = "long";
    }
  }

  // Track peak hours
  const hour = new Date(feedback.timestamp).getHours();
  const hours = [...(profile.peakHours || []), hour].slice(-100); // Keep last 100
  updated.peakHours = hours;

  return updated;
}

// ---- Style Recommendation ----

/**
 * Get the recommended suggestion style based on learning profile.
 * Returns styles sorted by preference weight.
 */
export function getPreferredStyles(profile: LearningProfile): StyleWeight[] {
  return [...profile.styleWeights].sort((a, b) => b.weight - a.weight);
}

/**
 * Get the top preferred style name for prompt injection.
 */
export function getTopStylePrompt(profile: LearningProfile): string {
  const top = getPreferredStyles(profile);
  if (top.length === 0 || profile.totalFeedback < 5) {
    return ""; // Not enough data to personalize
  }

  const topStyle = top[0];
  const styleDescriptions: Record<SuggestionStyle, string> = {
    direct: "请用直接、简洁、不绕弯子的方式给出建议",
    gentle: "请用温和、委婉、照顾对方感受的方式给出建议",
    analytical: "请用理性、有逻辑、数据驱动的方式分析和建议",
    empathetic: "请用富有共情力、站在对方角度思考的方式给出建议",
    strategic: "请用策略性思维、博弈论角度给出高层次的建议",
  };

  const secondary = top.length > 1 && top[1].weight > 40 ? top[1] : null;
  let prompt = `[用户偏好] ${styleDescriptions[topStyle.style]}`;
  if (secondary) {
    prompt += `，同时适当融入${secondary.label}的元素`;
  }

  // Length preference
  if (profile.preferredLength === "short") {
    prompt += "。用户偏好简短精炼的回答。";
  } else if (profile.preferredLength === "long") {
    prompt += "。用户偏好详细深入的分析。";
  }

  return prompt;
}

// ---- EQ Growth Tracking ----

/**
 * Calculate EQ growth trend from historical scores.
 */
export function calculateEQGrowth(
  scores: EQGrowthPoint[]
): {
  trend: "improving" | "stable" | "declining";
  trendLabel: string;
  averageScore: number;
  recentScore: number;
  improvement: number; // percentage change
  streakDays: number;
} {
  if (scores.length === 0) {
    return {
      trend: "stable",
      trendLabel: "暂无数据",
      averageScore: 0,
      recentScore: 0,
      improvement: 0,
      streakDays: 0,
    };
  }

  const sorted = [...scores].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const averageScore = sorted.reduce((sum, s) => sum + s.score, 0) / sorted.length;
  const recentScore = sorted[sorted.length - 1].score;

  // Compare recent (last 25%) vs earlier (first 25%)
  const quarter = Math.max(1, Math.floor(sorted.length / 4));
  const earlyAvg = sorted.slice(0, quarter).reduce((s, p) => s + p.score, 0) / quarter;
  const recentAvg = sorted.slice(-quarter).reduce((s, p) => s + p.score, 0) / quarter;
  const improvement = earlyAvg > 0 ? Math.round(((recentAvg - earlyAvg) / earlyAvg) * 100) : 0;

  // Calculate streak (consecutive days with activity)
  let streakDays = 0;
  const today = new Date();
  for (let i = sorted.length - 1; i >= 0; i--) {
    const d = new Date(sorted[i].date);
    const daysDiff = Math.floor((today.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
    if (daysDiff <= streakDays + 1) {
      streakDays = daysDiff + 1;
    } else {
      break;
    }
  }

  let trend: "improving" | "stable" | "declining";
  let trendLabel: string;
  if (improvement > 5) {
    trend = "improving";
    trendLabel = `进步中 (+${improvement}%)`;
  } else if (improvement < -5) {
    trend = "declining";
    trendLabel = `下滑中 (${improvement}%)`;
  } else {
    trend = "stable";
    trendLabel = "保持稳定";
  }

  return { trend, trendLabel, averageScore: Math.round(averageScore), recentScore, improvement, streakDays };
}

// ---- Module Usage Summary ----

export function getModuleUsageSummary(profile: LearningProfile): {
  module: string;
  label: string;
  used: number;
  adoptionRate: number;
}[] {
  const moduleLabels: Record<string, string> = {
    analyze: "对话分析",
    coach: "沟通教练",
    strategy: "策略规划",
    simulate: "模拟对话",
    realtime: "实时助手",
    "quick-assist": "快速辅助",
  };

  return Object.entries(profile.moduleStats)
    .map(([module, stats]) => ({
      module,
      label: moduleLabels[module] || module,
      used: stats.used,
      adoptionRate: stats.used > 0 ? Math.round((stats.adopted / stats.used) * 100) : 0,
    }))
    .sort((a, b) => b.used - a.used);
}

// ---- Peak Hour Analysis ----

export function getPeakHourAnalysis(profile: LearningProfile): {
  peakHour: number;
  peakLabel: string;
  distribution: { hour: number; count: number }[];
} {
  const hours = profile.peakHours || [];
  if (hours.length === 0) {
    return { peakHour: -1, peakLabel: "暂无数据", distribution: [] };
  }

  const counts = new Map<number, number>();
  for (const h of hours) {
    counts.set(h, (counts.get(h) || 0) + 1);
  }

  const distribution = Array.from(counts.entries())
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => a.hour - b.hour);

  const peakHour = distribution.sort((a, b) => b.count - a.count)[0]?.hour ?? -1;

  const timeLabels: Record<number, string> = {};
  for (let i = 0; i < 24; i++) {
    if (i < 6) timeLabels[i] = "凌晨";
    else if (i < 9) timeLabels[i] = "早晨";
    else if (i < 12) timeLabels[i] = "上午";
    else if (i < 14) timeLabels[i] = "中午";
    else if (i < 18) timeLabels[i] = "下午";
    else if (i < 21) timeLabels[i] = "晚上";
    else timeLabels[i] = "深夜";
  }

  const peakLabel = peakHour >= 0 ? `${timeLabels[peakHour]} ${peakHour}:00` : "暂无数据";

  return {
    peakHour,
    peakLabel,
    distribution: distribution.sort((a, b) => a.hour - b.hour),
  };
}
