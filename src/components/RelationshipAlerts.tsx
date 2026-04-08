"use client";

import { useMemo } from "react";
import {
  Bell,
  Clock,
  AlertTriangle,
  Heart,
  MessageSquare,
  ChevronRight,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

interface Alert {
  id: string;
  profileId: string;
  profileName: string;
  type: "contact_overdue" | "unresolved_issue" | "relationship_cooling" | "follow_up" | "smart_followup";
  severity: "low" | "medium" | "high";
  title: string;
  description: string;
  action: string;
  topicSuggestions?: string[];
}

const ALERT_CONFIG: Record<
  Alert["type"],
  { icon: React.ElementType; color: string }
> = {
  contact_overdue: {
    icon: Clock,
    color: "border-amber-500/30 bg-amber-500/5 text-amber-300",
  },
  unresolved_issue: {
    icon: AlertTriangle,
    color: "border-red-500/30 bg-red-500/5 text-red-300",
  },
  relationship_cooling: {
    icon: Heart,
    color: "border-blue-500/30 bg-blue-500/5 text-blue-300",
  },
  follow_up: {
    icon: MessageSquare,
    color: "border-violet-500/30 bg-violet-500/5 text-violet-300",
  },
  smart_followup: {
    icon: Lightbulb,
    color: "border-emerald-500/30 bg-emerald-500/5 text-emerald-300",
  },
};

/** Extract topic-based follow-up suggestions from conversation analysis data */
function extractTopicSuggestions(
  profileConversations: { analysis?: { semanticContent?: { coreTopics?: string[]; hiddenAgenda?: string }; nextStepSuggestions?: string[]; keyMoments?: { description?: string }[] } }[]
): string[] {
  const suggestions: string[] = [];
  // Get the most recent conversation with analysis
  const recent = profileConversations.find((c) => c.analysis);
  if (!recent?.analysis) return suggestions;

  const a = recent.analysis;

  // Extract from nextStepSuggestions
  if (a.nextStepSuggestions?.length) {
    suggestions.push(...a.nextStepSuggestions.slice(0, 2));
  }

  // Extract from core topics
  if (a.semanticContent?.coreTopics?.length) {
    const topicStr = a.semanticContent.coreTopics.slice(0, 2).join("、");
    suggestions.push(`围绕「${topicStr}」展开后续话题`);
  }

  // Extract from hidden agenda
  if (a.semanticContent?.hiddenAgenda && a.semanticContent.hiddenAgenda !== "无" && a.semanticContent.hiddenAgenda.length > 2) {
    suggestions.push(`关注对方深层关切：${a.semanticContent.hiddenAgenda.slice(0, 50)}`);
  }

  return suggestions.slice(0, 3);
}

const SEVERITY_INDICATOR: Record<Alert["severity"], string> = {
  low: "bg-zinc-500",
  medium: "bg-amber-500",
  high: "bg-red-500",
};

export default function RelationshipAlerts() {
  const { profiles, relationships, conversations } = useAppStore();

  const alerts = useMemo(() => {
    const result: Alert[] = [];
    const now = Date.now();

    for (const profile of profiles) {
      const relationship = relationships.find(
        (r) => r.profileId === profile.id
      );
      const profileConversations = conversations.filter(
        (c) => c.linkedProfileId === profile.id
      );
      const lastConversation = profileConversations[0];

      // Extract topic suggestions from conversation analysis
      const topicSuggestions = extractTopicSuggestions(
        profileConversations as { analysis?: { semanticContent?: { coreTopics?: string[]; hiddenAgenda?: string }; nextStepSuggestions?: string[]; keyMoments?: { description?: string }[] } }[]
      );

      // Alert: No contact in over 14 days
      if (lastConversation || profile.lastInteraction) {
        const lastContact = lastConversation
          ? new Date(lastConversation.createdAt).getTime()
          : new Date(profile.lastInteraction).getTime();
        const daysSince = Math.floor(
          (now - lastContact) / (1000 * 60 * 60 * 24)
        );

        if (daysSince > 30) {
          const topicHint = profile.communicationStyle?.preferredTopics?.[0];
          const styleHint = profile.communicationStyle?.overallType;
          let smartAction = `发一条简短的问候消息，或找一个自然的话题重新建立联系`;
          if (topicSuggestions.length > 0) {
            smartAction = topicSuggestions[0];
          } else if (topicHint) {
            smartAction = `对方关注「${topicHint}」相关话题，可以围绕此话题自然地重新建立联系`;
          } else if (styleHint && styleHint !== "待分析" && styleHint !== "未知") {
            smartAction = `对方是${styleHint}风格，建议用符合其偏好的方式发起联系`;
          }
          result.push({
            id: `overdue-${profile.id}`,
            profileId: profile.id,
            profileName: profile.name,
            type: "contact_overdue",
            severity: "high",
            title: `已${daysSince}天未联系${profile.name}`,
            description: `上次互动已过去${daysSince}天，关系可能正在疏远`,
            action: smartAction,
            topicSuggestions: topicSuggestions.length > 1 ? topicSuggestions.slice(1) : undefined,
          });
        } else if (daysSince > 14) {
          const topics = profile.communicationStyle?.preferredTopics || [];
          let smartAction = `可以分享一篇对方可能感兴趣的文章，或询问近况`;
          if (topicSuggestions.length > 0) {
            smartAction = topicSuggestions[0];
          } else if (topics.length > 0) {
            const topicList = topics.slice(0, 2).join("、");
            smartAction = `对方对「${topicList}」感兴趣，可以从相关话题切入问候`;
          }
          result.push({
            id: `overdue-${profile.id}`,
            profileId: profile.id,
            profileName: profile.name,
            type: "contact_overdue",
            severity: "medium",
            title: `${daysSince}天未联系${profile.name}`,
            description: `建议保持适当的联系频率以维护关系`,
            action: smartAction,
            topicSuggestions: topicSuggestions.length > 1 ? topicSuggestions.slice(1) : undefined,
          });
        }
      }

      // Smart follow-up: proactive topic-based suggestion when we have analysis data but no overdue alert
      if (topicSuggestions.length > 0 && profileConversations.length >= 2) {
        const lastContact = lastConversation
          ? new Date(lastConversation.createdAt).getTime()
          : 0;
        const daysSince = Math.floor((now - lastContact) / (1000 * 60 * 60 * 24));
        if (daysSince >= 5 && daysSince <= 14) {
          // Subjective impression integration
          const subjective = profile.subjectiveImpression;
          let contextHint = "";
          if (subjective?.unresolved && subjective.unresolved.length > 2) {
            contextHint = `（注意：你记录了未解决事项「${subjective.unresolved.slice(0, 30)}」）`;
          }
          result.push({
            id: `smart-${profile.id}`,
            profileId: profile.id,
            profileName: profile.name,
            type: "smart_followup",
            severity: "low",
            title: `可以主动联系${profile.name}`,
            description: `距上次对话${daysSince}天，正是自然跟进的好时机${contextHint}`,
            action: topicSuggestions[0],
            topicSuggestions: topicSuggestions.slice(1),
          });
        }
      }

      // Alert: Unresolved issues from relationship graph
      if (relationship?.unresolvedIssues?.length) {
        for (const issue of relationship.unresolvedIssues) {
          result.push({
            id: `issue-${profile.id}-${issue.substring(0, 10)}`,
            profileId: profile.id,
            profileName: profile.name,
            type: "unresolved_issue",
            severity: "high",
            title: `与${profile.name}有未解决的问题`,
            description: issue,
            action: `建议找合适的时机主动沟通解决此问题`,
          });
        }
      }

      // Alert: Relationship cooling
      if (relationship?.status === "cooling") {
        const triggers = profile.communicationStyle?.triggerPoints || [];
        let coolAction = `需要主动采取行动修复关系——可以从一次轻松的对话开始`;
        if (triggers.length > 0) {
          coolAction = `注意避开对方的敏感点（${triggers[0]}），选择轻松话题重新拉近距离`;
        }
        result.push({
          id: `cooling-${profile.id}`,
          profileId: profile.id,
          profileName: profile.name,
          type: "relationship_cooling",
          severity: "medium",
          title: `与${profile.name}的关系正在降温`,
          description: `信任度: ${relationship.trustLevel}/100，健康度: ${relationship.healthScore}/100`,
          action: coolAction,
        });
      }

      // Alert: Scheduled follow-up
      if (relationship?.nextFollowUp) {
        const followUpDate = new Date(relationship.nextFollowUp).getTime();
        const daysUntil = Math.floor(
          (followUpDate - now) / (1000 * 60 * 60 * 24)
        );
        if (daysUntil <= 3 && daysUntil >= -7) {
          result.push({
            id: `followup-${profile.id}`,
            profileId: profile.id,
            profileName: profile.name,
            type: "follow_up",
            severity: daysUntil < 0 ? "high" : "low",
            title:
              daysUntil < 0
                ? `与${profile.name}的跟进已逾期${Math.abs(daysUntil)}天`
                : daysUntil === 0
                ? `今天需要跟进${profile.name}`
                : `${daysUntil}天后需要跟进${profile.name}`,
            description: relationship.followUpReason || "计划中的跟进",
            action: `按计划执行跟进`,
          });
        }
      }
    }

    // Sort by severity
    const severityOrder = { high: 0, medium: 1, low: 2 };
    result.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return result;
  }, [profiles, relationships, conversations]);

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Bell className="h-4 w-4 text-violet-400" />
        <h3 className="text-xs font-semibold text-zinc-200">
          关系维护提醒
        </h3>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300">
          {alerts.length}
        </span>
      </div>
      <div className="space-y-2">
        {alerts.slice(0, 5).map((alert) => {
          const config = ALERT_CONFIG[alert.type];
          const Icon = config.icon;
          return (
            <div
              key={alert.id}
              className={cn(
                "rounded-lg border p-3 transition-colors",
                config.color
              )}
            >
              <div className="flex items-start gap-2">
                <div className="shrink-0 mt-0.5">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium truncate">
                      {alert.title}
                    </span>
                    <div
                      className={cn(
                        "h-1.5 w-1.5 rounded-full shrink-0",
                        SEVERITY_INDICATOR[alert.severity]
                      )}
                    />
                  </div>
                  <p className="text-[10px] opacity-70 mt-0.5 leading-relaxed">
                    {alert.description}
                  </p>
                  <div className="flex items-center gap-1 mt-1.5 text-[10px] opacity-60">
                    <ChevronRight className="h-2.5 w-2.5" />
                    <span>{alert.action}</span>
                  </div>
                  {alert.topicSuggestions && alert.topicSuggestions.length > 0 && (
                    <div className="mt-1.5 space-y-0.5">
                      {alert.topicSuggestions.map((s, i) => (
                        <div key={i} className="flex items-center gap-1 text-[9px] opacity-50">
                          <Lightbulb className="h-2 w-2 shrink-0" />
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {alerts.length > 5 && (
          <p className="text-[10px] text-zinc-600 text-center">
            还有 {alerts.length - 5} 条提醒
          </p>
        )}
      </div>
    </div>
  );
}
