/**
 * Trend Alert Engine — detects anomalies in user data and produces warnings.
 * Runs purely on local data (no LLM calls). Returns a list of alert objects
 * that the DashboardTab can show inline and optionally push as toasts.
 */

import type { PersonProfile, ConversationSession, ProfileMemoryEntry } from "./types";
import type { ToastItem } from "./store";

export interface TrendAlert {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
  /** Which tab to navigate to for more context */
  actionTab?: string;
  actionLabel?: string;
  /** When this alert was generated (ms) */
  timestamp: number;
}

// ---- Helpers ----

function weeksBetween(d1: Date, d2: Date) {
  return Math.abs(d1.getTime() - d2.getTime()) / (7 * 24 * 60 * 60 * 1000);
}

function daysBetween(d1: Date, d2: Date) {
  return Math.abs(d1.getTime() - d2.getTime()) / (24 * 60 * 60 * 1000);
}

// ---- Main Detection ----

export function detectTrendAlerts(
  profiles: PersonProfile[],
  conversations: ConversationSession[],
  eqScores: { overallScore: number; createdAt: string }[],
  memories: ProfileMemoryEntry[],
): TrendAlert[] {
  const alerts: TrendAlert[] = [];
  const now = new Date();
  const nowMs = now.getTime();

  // 1. Emotion drop detection
  // Check if any profile's recent conversations show a significant emotion decline
  for (const profile of profiles) {
    const linkedConvos = conversations
      .filter((c) =>
        c.linkedProfileId === profile.id ||
        c.participants?.some((p) => p === profile.name) ||
        c.title?.includes(profile.name)
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    if (linkedConvos.length < 3) continue;

    const recentAnalyzed = linkedConvos.filter((c) => c.analysis).slice(-5);
    if (recentAnalyzed.length < 2) continue;

    // Get average emotion from recent analyzed conversations
    const recentEmotions = recentAnalyzed.map((c) => {
      const curve = c.analysis?.emotionCurve || [];
      if (curve.length === 0) return 0;
      return curve.reduce((s, p) => s + p.otherEmotion, 0) / curve.length;
    });

    const avgRecent = recentEmotions.slice(-2).reduce((a, b) => a + b, 0) / 2;
    const avgOlder = recentEmotions.slice(0, -2).reduce((a, b) => a + b, 0) / Math.max(1, recentEmotions.length - 2);

    if (avgRecent < avgOlder - 0.3) {
      alerts.push({
        id: `emotion-drop-${profile.id}`,
        severity: "warning",
        title: `${profile.name} 情绪明显下降`,
        message: `近期对话中对方情绪指标下降了 ${Math.abs(Math.round((avgOlder - avgRecent) * 100))}%，可能需要关注。`,
        actionTab: "profiles",
        actionLabel: "查看画像",
        timestamp: nowMs,
      });
    }
  }

  // 2. Interaction frequency drop
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const thisWeekConvos = conversations.filter(
    (c) => nowMs - new Date(c.createdAt).getTime() < weekMs
  ).length;
  const lastWeekConvos = conversations.filter(
    (c) => {
      const t = nowMs - new Date(c.createdAt).getTime();
      return t >= weekMs && t < 2 * weekMs;
    }
  ).length;

  if (lastWeekConvos >= 5 && thisWeekConvos <= Math.floor(lastWeekConvos * 0.3)) {
    alerts.push({
      id: "activity-drop",
      severity: "info",
      title: "本周对话活跃度骤降",
      message: `本周仅 ${thisWeekConvos} 次对话，上周为 ${lastWeekConvos} 次（下降 ${Math.round((1 - thisWeekConvos / lastWeekConvos) * 100)}%）。`,
      actionTab: "analyze",
      actionLabel: "开始分析",
      timestamp: nowMs,
    });
  }

  // 3. EQ score regression
  if (eqScores.length >= 3) {
    const sorted = [...eqScores].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const recent3 = sorted.slice(-3);
    const older3 = sorted.slice(-6, -3);

    if (older3.length >= 2) {
      const avgRecent = recent3.reduce((s, e) => s + e.overallScore, 0) / recent3.length;
      const avgOlder = older3.reduce((s, e) => s + e.overallScore, 0) / older3.length;

      if (avgRecent < avgOlder - 10) {
        alerts.push({
          id: "eq-regression",
          severity: "warning",
          title: "EQ得分出现回落",
          message: `近3次评估平均 ${Math.round(avgRecent)} 分，此前平均 ${Math.round(avgOlder)} 分，下降 ${Math.round(avgOlder - avgRecent)} 分。建议针对性练习。`,
          actionTab: "eq-training",
          actionLabel: "前往训练",
          timestamp: nowMs,
        });
      }
    }
  }

  // 4. Stale profiles — profiles with no new conversations in 30+ days
  for (const profile of profiles) {
    const linkedConvos = conversations.filter(
      (c) =>
        c.linkedProfileId === profile.id ||
        c.participants?.some((p) => p === profile.name) ||
        c.title?.includes(profile.name)
    );

    if (linkedConvos.length === 0) continue;

    const latest = Math.max(...linkedConvos.map((c) => new Date(c.createdAt).getTime()));
    const days = daysBetween(now, new Date(latest));

    if (days > 30) {
      alerts.push({
        id: `stale-${profile.id}`,
        severity: "info",
        title: `与 ${profile.name} 超过 ${Math.floor(days)} 天未互动`,
        message: `上次对话距今已超一个月，画像数据可能已不够准确。考虑更新分析。`,
        actionTab: "analyze",
        actionLabel: "分析新对话",
        timestamp: nowMs,
      });
    }
  }

  // 5. Unverified important memories
  const unverifiedImportant = memories.filter(
    (m) => !m.archived && !m.verified && m.importance >= 4
  );
  if (unverifiedImportant.length >= 3) {
    alerts.push({
      id: "unverified-memories",
      severity: "info",
      title: `${unverifiedImportant.length} 条高重要性记忆待验证`,
      message: "建议审核这些记忆条目的准确性，以提升画像可靠度。",
      actionTab: "profiles",
      actionLabel: "查看记忆",
      timestamp: nowMs,
    });
  }

  // 6. Relationship risk — high-importance negative memories recently
  const twoWeeksAgo = nowMs - 14 * 24 * 60 * 60 * 1000;
  const recentNegMemories = memories.filter(
    (m) =>
      !m.archived &&
      new Date(m.createdAt).getTime() > twoWeeksAgo &&
      m.importance >= 4 &&
      (m.category === "relationship_shift" || m.category === "key_event")
  );

  if (recentNegMemories.length >= 2) {
    // Group by profile
    const byProfile = new Map<string, number>();
    for (const m of recentNegMemories) {
      byProfile.set(m.profileId, (byProfile.get(m.profileId) || 0) + 1);
    }
    for (const [pid, count] of byProfile.entries()) {
      if (count >= 2) {
        const p = profiles.find((pr) => pr.id === pid);
        if (p) {
          alerts.push({
            id: `relationship-risk-${pid}`,
            severity: "critical",
            title: `与 ${p.name} 的关系可能存在风险`,
            message: `近两周出现 ${count} 条高重要性关系/事件记忆，建议及时沟通处理。`,
            actionTab: "profiles",
            actionLabel: "查看详情",
            timestamp: nowMs,
          });
        }
      }
    }
  }

  // Sort: critical first, then warning, then info
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return alerts;
}

/**
 * Convert a TrendAlert to a toast-compatible object.
 */
export function alertToToast(alert: TrendAlert): Omit<ToastItem, "id" | "createdAt"> {
  const typeMap: Record<TrendAlert["severity"], ToastItem["type"]> = {
    critical: "error",
    warning: "warning",
    info: "info",
  };
  return {
    type: typeMap[alert.severity],
    title: alert.title,
    message: alert.message,
    duration: alert.severity === "critical" ? 10000 : 6000,
    action: alert.actionTab
      ? { label: alert.actionLabel || "查看", tab: alert.actionTab }
      : undefined,
  };
}
