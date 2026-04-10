"use client";

import { useMemo, useState } from "react";
import {
  Repeat,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Shield,
  Clock,
  ChevronDown,
  ChevronUp,
  Swords,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConversationSession, ConversationAnalysis, PersonProfile } from "@/lib/types";
import { useAppStore } from "@/lib/store";

// ---- Pattern Types ----

interface DetectedPattern {
  id: string;
  type: "recurring_conflict" | "emotion_trigger" | "topic_avoidance" | "timing_pattern" | "escalation_cycle" | "positive_ritual";
  severity: "low" | "medium" | "high";
  title: string;
  description: string;
  evidence: string[];
  suggestion: string;
  frequency: number; // how many conversations this appeared in
  profileId: string;
  profileName: string;
}

const PATTERN_CONFIG: Record<DetectedPattern["type"], { icon: React.ElementType; color: string; label: string }> = {
  recurring_conflict:  { icon: Repeat,         color: "border-red-500/30 bg-red-500/5 text-red-300",     label: "反复冲突" },
  emotion_trigger:     { icon: AlertTriangle,  color: "border-orange-500/30 bg-orange-500/5 text-orange-300", label: "情绪触发" },
  topic_avoidance:     { icon: Shield,         color: "border-blue-500/30 bg-blue-500/5 text-blue-300",   label: "话题回避" },
  timing_pattern:      { icon: Clock,          color: "border-cyan-500/30 bg-cyan-500/5 text-cyan-300",   label: "时间规律" },
  escalation_cycle:    { icon: TrendingUp,     color: "border-amber-500/30 bg-amber-500/5 text-amber-300",label: "升级循环" },
  positive_ritual:     { icon: Lightbulb,      color: "border-emerald-500/30 bg-emerald-500/5 text-emerald-300", label: "积极仪式" },
};

const SEVERITY_LABELS: Record<string, { label: string; color: string }> = {
  low: { label: "低", color: "text-zinc-400 bg-zinc-500/10" },
  medium: { label: "中", color: "text-amber-400 bg-amber-500/10" },
  high: { label: "高", color: "text-red-400 bg-red-500/10" },
};

// ---- Pattern Detection Engine ----

function detectPatterns(
  profile: PersonProfile,
  conversations: ConversationSession[],
): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];
  const analyzed = conversations.filter((c) => c.analysis);
  if (analyzed.length < 2) return patterns;

  const pId = profile.id;
  const pName = profile.name;

  // 1. Recurring conflict topics
  const conflictTopics = new Map<string, number>();
  const conflictEvidence = new Map<string, string[]>();
  for (const c of analyzed) {
    const a = c.analysis!;
    const ch = a.interactionPatterns?.conflictHandling?.toLowerCase() || "";
    if (ch.includes("冲突") || ch.includes("分歧") || ch.includes("争") || ch.includes("激化")) {
      const topics = a.semanticContent?.coreTopics || [];
      for (const t of topics) {
        conflictTopics.set(t, (conflictTopics.get(t) || 0) + 1);
        const ev = conflictEvidence.get(t) || [];
        ev.push(`${c.title || "对话"}: ${ch}`);
        conflictEvidence.set(t, ev);
      }
    }
  }
  for (const [topic, count] of conflictTopics) {
    if (count >= 2) {
      patterns.push({
        id: `conflict-${pId}-${topic}`,
        type: "recurring_conflict",
        severity: count >= 3 ? "high" : "medium",
        title: `围绕「${topic}」的反复冲突`,
        description: `在${count}次对话中，关于「${topic}」的讨论都出现了冲突或分歧`,
        evidence: conflictEvidence.get(topic)?.slice(0, 4) || [],
        suggestion: `建议在下次讨论「${topic}」前，先用共情开场确认对方立场，避免直接对立`,
        frequency: count,
        profileId: pId,
        profileName: pName,
      });
    }
  }

  // 2. Emotion trigger detection — find topics that consistently lower other's emotion
  const topicEmotionImpact = new Map<string, number[]>();
  for (const c of analyzed) {
    const a = c.analysis!;
    if (!a.emotionCurve || a.emotionCurve.length < 2) continue;
    const emotionDelta = a.emotionCurve[a.emotionCurve.length - 1].otherEmotion - a.emotionCurve[0].otherEmotion;
    const topics = a.semanticContent?.coreTopics || [];
    for (const t of topics) {
      const arr = topicEmotionImpact.get(t) || [];
      arr.push(emotionDelta);
      topicEmotionImpact.set(t, arr);
    }
  }
  for (const [topic, deltas] of topicEmotionImpact) {
    if (deltas.length >= 2) {
      const avg = deltas.reduce((a, b) => a + b, 0) / deltas.length;
      if (avg < -0.25) {
        patterns.push({
          id: `trigger-${pId}-${topic}`,
          type: "emotion_trigger",
          severity: avg < -0.5 ? "high" : "medium",
          title: `「${topic}」话题容易引发对方情绪下降`,
          description: `在${deltas.length}次涉及该话题的对话中，对方情绪平均下降${Math.abs(avg).toFixed(2)}`,
          evidence: deltas.map((d, i) => `对话${i + 1}: 情绪变化 ${d > 0 ? "+" : ""}${d.toFixed(2)}`),
          suggestion: `讨论「${topic}」时建议使用更温和的语气，先肯定对方立场再表达不同意见`,
          frequency: deltas.length,
          profileId: pId,
          profileName: pName,
        });
      }
    }
  }

  // 3. Topic avoidance — hedging level consistently high on certain topics
  const highHedgeTopics = new Map<string, number>();
  for (const c of analyzed) {
    const a = c.analysis!;
    const hedge = a.discourseStructure?.hedgingLevel?.toLowerCase() || "";
    if (hedge.includes("高") || hedge.includes("过度") || hedge.includes("回避")) {
      const topics = a.semanticContent?.coreTopics || [];
      for (const t of topics) {
        highHedgeTopics.set(t, (highHedgeTopics.get(t) || 0) + 1);
      }
    }
  }
  for (const [topic, count] of highHedgeTopics) {
    if (count >= 2) {
      patterns.push({
        id: `avoidance-${pId}-${topic}`,
        type: "topic_avoidance",
        severity: "low",
        title: `双方在「${topic}」话题上习惯性回避`,
        description: `在${count}次对话中，涉及「${topic}」时都有明显的回避/模糊化倾向`,
        evidence: [],
        suggestion: `可能需要找一个合适的时机直面这个话题，或通过第三方话题间接切入`,
        frequency: count,
        profileId: pId,
        profileName: pName,
      });
    }
  }

  // 4. Escalation cycle — emotion starts positive but ends negative repeatedly
  let escalationCount = 0;
  const escalationEv: string[] = [];
  for (const c of analyzed) {
    const a = c.analysis!;
    if (!a.emotionCurve || a.emotionCurve.length < 3) continue;
    const start = a.emotionCurve[0].otherEmotion;
    const mid = a.emotionCurve[Math.floor(a.emotionCurve.length / 2)]?.otherEmotion ?? 0;
    const end = a.emotionCurve[a.emotionCurve.length - 1].otherEmotion;
    // Pattern: starts OK, escalates negatively
    if (start > -0.1 && end < -0.2 && end < start - 0.3) {
      escalationCount++;
      escalationEv.push(`${c.title || "对话"}: 开始${start.toFixed(1)} → 结束${end.toFixed(1)}`);
    }
  }
  if (escalationCount >= 2) {
    patterns.push({
      id: `escalation-${pId}`,
      type: "escalation_cycle",
      severity: escalationCount >= 3 ? "high" : "medium",
      title: `对话经常从平和走向恶化`,
      description: `在${escalationCount}次对话中，情绪都从正常/积极开始，最终走向消极`,
      evidence: escalationEv.slice(0, 4),
      suggestion: `注意对话中的情绪拐点，一旦感受到氛围变化就主动降温或转换话题`,
      frequency: escalationCount,
      profileId: pId,
      profileName: pName,
    });
  }

  // 5. Positive rituals — topics that consistently improve emotion
  for (const [topic, deltas] of topicEmotionImpact) {
    if (deltas.length >= 2) {
      const avg = deltas.reduce((a, b) => a + b, 0) / deltas.length;
      if (avg > 0.2) {
        patterns.push({
          id: `positive-${pId}-${topic}`,
          type: "positive_ritual",
          severity: "low",
          title: `「${topic}」是与${pName}的积极话题`,
          description: `涉及该话题的${deltas.length}次对话中，对方情绪平均提升${avg.toFixed(2)}`,
          evidence: deltas.map((d, i) => `对话${i + 1}: 情绪变化 +${d.toFixed(2)}`),
          suggestion: `在对话气氛紧张时，可以适时引入「${topic}」作为缓冲话题`,
          frequency: deltas.length,
          profileId: pId,
          profileName: pName,
        });
      }
    }
  }

  // 6. Timing patterns — when conversations tend to go better
  const hourScores = new Map<number, number[]>();
  for (const c of analyzed) {
    const created = new Date(c.createdAt);
    const hour = created.getHours();
    const a = c.analysis!;
    if (!a.emotionCurve || a.emotionCurve.length === 0) continue;
    const avgEmotion = a.emotionCurve.reduce((s, p) => s + p.otherEmotion, 0) / a.emotionCurve.length;
    const bucket = Math.floor(hour / 3) * 3; // 3-hour buckets
    const arr = hourScores.get(bucket) || [];
    arr.push(avgEmotion);
    hourScores.set(bucket, arr);
  }
  if (hourScores.size >= 2) {
    let bestBucket = -1;
    let bestAvg = -Infinity;
    let worstBucket = -1;
    let worstAvg = Infinity;
    for (const [bucket, scores] of hourScores) {
      if (scores.length < 1) continue;
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avg > bestAvg) { bestAvg = avg; bestBucket = bucket; }
      if (avg < worstAvg) { worstAvg = avg; worstBucket = bucket; }
    }
    if (bestBucket !== worstBucket && bestAvg - worstAvg > 0.15) {
      const formatBucket = (b: number) => `${b}:00-${b + 3}:00`;
      patterns.push({
        id: `timing-${pId}`,
        type: "timing_pattern",
        severity: "low",
        title: `最佳对话时段: ${formatBucket(bestBucket)}`,
        description: `与${pName}在${formatBucket(bestBucket)}时段对话氛围最好，${formatBucket(worstBucket)}时段相对较差`,
        evidence: [`最佳时段平均情绪: ${bestAvg.toFixed(2)}`, `较差时段平均情绪: ${worstAvg.toFixed(2)}`],
        suggestion: `尽量选择${formatBucket(bestBucket)}与对方进行重要对话`,
        frequency: analyzed.length,
        profileId: pId,
        profileName: pName,
      });
    }
  }

  // Sort by severity (high first) then by frequency
  const sevOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  patterns.sort((a, b) => (sevOrder[a.severity] - sevOrder[b.severity]) || (b.frequency - a.frequency));
  return patterns;
}

// ---- Component ----

interface Props {
  profile: PersonProfile;
  conversations: ConversationSession[];
}

export default function ConversationPatternLearner({ profile, conversations }: Props) {
  const { navigateToTab } = useAppStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const patterns = useMemo(
    () => detectPatterns(profile, conversations),
    [profile, conversations]
  );

  if (patterns.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-center">
        <Repeat className="h-5 w-5 text-zinc-700 mx-auto mb-1" />
        <p className="text-[10px] text-zinc-600">需要更多对话数据来识别模式</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      <div className="flex items-center gap-2 border-b border-zinc-800 px-3 py-2">
        <Repeat className="h-3.5 w-3.5 text-violet-400" />
        <span className="text-xs font-medium text-zinc-300">对话模式识别</span>
        <span className="text-[9px] text-zinc-600">基于{conversations.filter((c) => c.analysis).length}次对话分析</span>
      </div>

      <div className="divide-y divide-zinc-800/50">
        {patterns.map((p) => {
          const cfg = PATTERN_CONFIG[p.type];
          const Icon = cfg.icon;
          const sev = SEVERITY_LABELS[p.severity];
          const isExpanded = expandedId === p.id;
          return (
            <div key={p.id} className={cn("transition-colors", cfg.color)}>
              <button
                onClick={() => setExpandedId(isExpanded ? null : p.id)}
                className="w-full flex items-start gap-2 p-3 text-left"
              >
                <Icon className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-medium">{p.title}</span>
                    <span className={cn("text-[8px] px-1 py-0.5 rounded", sev.color)}>{sev.label}</span>
                    <span className="text-[8px] text-zinc-600">{cfg.label} · {p.frequency}次</span>
                  </div>
                  <p className="text-[9px] opacity-60 mt-0.5 line-clamp-1">{p.description}</p>
                </div>
                {isExpanded ? <ChevronUp className="h-3 w-3 shrink-0 mt-0.5 opacity-50" /> : <ChevronDown className="h-3 w-3 shrink-0 mt-0.5 opacity-50" />}
              </button>

              {isExpanded && (
                <div className="px-3 pb-3 pl-9 space-y-2 animate-in fade-in-0 slide-in-from-top-1 duration-150">
                  {/* Evidence */}
                  {p.evidence.length > 0 && (
                    <div className="space-y-0.5">
                      <span className="text-[8px] text-zinc-500 font-medium">证据</span>
                      {p.evidence.map((ev, i) => (
                        <p key={i} className="text-[9px] text-zinc-500">· {ev}</p>
                      ))}
                    </div>
                  )}

                  {/* Suggestion */}
                  <div className="rounded bg-zinc-800/50 border border-zinc-700/50 p-2">
                    <div className="flex items-center gap-1 mb-1">
                      <Lightbulb className="h-2.5 w-2.5 text-amber-400" />
                      <span className="text-[8px] text-amber-400 font-medium">建议策略</span>
                    </div>
                    <p className="text-[9px] text-zinc-400 leading-relaxed">{p.suggestion}</p>
                  </div>

                  {/* Quick action */}
                  {(p.type === "recurring_conflict" || p.type === "escalation_cycle") && (
                    <button
                      onClick={() => navigateToTab("simulate", p.profileId, {
                        context: `${p.title}。${p.description}`,
                        goal: p.suggestion,
                      })}
                      className="flex items-center gap-1 text-[9px] px-2 py-1 rounded border border-violet-500/30 text-violet-300 hover:bg-violet-500/10 transition-colors"
                    >
                      <Swords className="h-2.5 w-2.5" />
                      模拟训练此场景
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
