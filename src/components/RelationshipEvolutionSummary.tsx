"use client";

import { useMemo } from "react";
import {
  BookOpen,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Heart,
  MessageSquare,
  Zap,
  Shield,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConversationSession, PersonProfile } from "@/lib/types";

// ---- Analysis Types ----

interface EvolutionPhase {
  id: string;
  label: string;
  period: string;
  conversationCount: number;
  avgSentiment: number;
  sentimentTrend: "up" | "down" | "stable";
  dominantTopics: string[];
  keyInsight: string;
  color: string;
}

interface RelationshipHealthMetric {
  label: string;
  value: number; // 0-100
  trend: "up" | "down" | "stable";
  color: string;
  icon: React.ElementType;
}

interface EvolutionSummary {
  phases: EvolutionPhase[];
  healthMetrics: RelationshipHealthMetric[];
  overallNarrative: string;
  communicationScore: number;
  trustLevel: number;
  conflictResolution: number;
  emotionalDepth: number;
  totalConversations: number;
  totalMessages: number;
  timeSpan: string;
  topPositiveTopics: string[];
  topNegativeTopics: string[];
  turningPoints: { date: string; description: string; impact: "positive" | "negative" }[];
}

// ---- Analysis Engine ----

function analyzeEvolution(
  profile: PersonProfile,
  conversations: ConversationSession[],
): EvolutionSummary | null {
  const analyzed = conversations
    .filter((c) => c.analysis)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  if (analyzed.length < 3) return null;

  const totalMessages = analyzed.reduce((s, c) => s + c.messages.length, 0);
  const firstDate = new Date(analyzed[0].createdAt);
  const lastDate = new Date(analyzed[analyzed.length - 1].createdAt);
  const daySpan = Math.max(1, Math.round((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));

  const timeSpan = daySpan >= 30
    ? `${Math.round(daySpan / 30)} 个月`
    : `${daySpan} 天`;

  // ---- Build Phases (split into 2-4 phases) ----
  const phaseCount = analyzed.length >= 8 ? 4 : analyzed.length >= 5 ? 3 : 2;
  const chunkSize = Math.ceil(analyzed.length / phaseCount);
  const phases: EvolutionPhase[] = [];
  const phaseLabels = ["初识期", "磨合期", "深化期", "稳定期"];
  const phaseColors = [
    "border-sky-500/30 bg-sky-500/5",
    "border-amber-500/30 bg-amber-500/5",
    "border-violet-500/30 bg-violet-500/5",
    "border-emerald-500/30 bg-emerald-500/5",
  ];

  let prevPhaseSentiment = 0;

  for (let i = 0; i < phaseCount; i++) {
    const chunk = analyzed.slice(i * chunkSize, (i + 1) * chunkSize);
    if (chunk.length === 0) continue;

    const sentiments: number[] = [];
    const topicCounts = new Map<string, number>();

    for (const c of chunk) {
      const a = c.analysis!;
      const curve = a.emotionCurve || [];
      if (curve.length > 0) {
        const avg = curve.reduce((s, p) => s + p.otherEmotion, 0) / curve.length;
        sentiments.push(avg);
      }
      for (const t of a.semanticContent?.coreTopics || []) {
        topicCounts.set(t, (topicCounts.get(t) || 0) + 1);
      }
    }

    const avgSentiment = sentiments.length > 0
      ? sentiments.reduce((a, b) => a + b, 0) / sentiments.length
      : 0;

    const sentimentTrend: "up" | "down" | "stable" =
      i === 0 ? "stable" :
      avgSentiment - prevPhaseSentiment > 0.1 ? "up" :
      avgSentiment - prevPhaseSentiment < -0.1 ? "down" : "stable";

    prevPhaseSentiment = avgSentiment;

    const sortedTopics = [...topicCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([t]) => t);

    const startDate = new Date(chunk[0].createdAt).toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
    const endDate = new Date(chunk[chunk.length - 1].createdAt).toLocaleDateString("zh-CN", { month: "short", day: "numeric" });

    // Generate insight based on data
    let insight = "";
    if (sentimentTrend === "up") {
      insight = `这个阶段关系明显升温，情绪平均值从上期有所提升。主要讨论${sortedTopics[0] || "日常话题"}等话题。`;
    } else if (sentimentTrend === "down") {
      insight = `这个阶段出现了一些摩擦，情绪有所下降。可能需要关注${sortedTopics[0] || "沟通方式"}方面。`;
    } else {
      insight = `关系保持稳定，围绕${sortedTopics.slice(0, 2).join("、") || "日常话题"}展开交流。`;
    }

    phases.push({
      id: `phase-${i}`,
      label: phaseLabels[i] || `阶段${i + 1}`,
      period: chunk.length === 1 ? startDate : `${startDate} - ${endDate}`,
      conversationCount: chunk.length,
      avgSentiment,
      sentimentTrend,
      dominantTopics: sortedTopics,
      keyInsight: insight,
      color: phaseColors[i] || phaseColors[0],
    });
  }

  // ---- Compute Health Metrics ----
  const allSentiments: number[] = [];
  const allTopics = new Map<string, number[]>();
  const conflictScores: number[] = [];
  const depthScores: number[] = [];

  for (const c of analyzed) {
    const a = c.analysis!;
    const curve = a.emotionCurve || [];
    if (curve.length > 0) {
      const avg = curve.reduce((s, p) => s + p.otherEmotion, 0) / curve.length;
      allSentiments.push(avg);
    }

    // Conflict handling quality
    const ch = a.interactionPatterns?.conflictHandling || "";
    if (ch.includes("建设") || ch.includes("理性") || ch.includes("共识")) {
      conflictScores.push(0.8);
    } else if (ch.includes("冲突") || ch.includes("争") || ch.includes("激化")) {
      conflictScores.push(0.2);
    } else {
      conflictScores.push(0.5);
    }

    // Emotional depth via topics and curve length
    const topicCount = (a.semanticContent?.coreTopics || []).length;
    depthScores.push(Math.min(1, topicCount / 5 + (curve.length > 4 ? 0.3 : 0)));

    // Topic sentiment tracking
    for (const t of a.semanticContent?.coreTopics || []) {
      const arr = allTopics.get(t) || [];
      const lastEmotion = curve.length > 0 ? curve[curve.length - 1].otherEmotion : 0;
      arr.push(lastEmotion);
      allTopics.set(t, arr);
    }
  }

  const avgOverallSentiment = allSentiments.length > 0
    ? allSentiments.reduce((a, b) => a + b, 0) / allSentiments.length
    : 0;

  // Communication score based on sentiment variance (lower = more stable = better)
  const sentimentVariance = allSentiments.length > 1
    ? allSentiments.reduce((s, v) => s + Math.pow(v - avgOverallSentiment, 2), 0) / allSentiments.length
    : 0;
  const communicationScore = Math.round(Math.max(20, Math.min(95, 75 - sentimentVariance * 100 + avgOverallSentiment * 20)));

  // Trust level based on conversation frequency and sentiment trend
  const recentSentiments = allSentiments.slice(-Math.ceil(allSentiments.length / 3));
  const recentAvg = recentSentiments.length > 0
    ? recentSentiments.reduce((a, b) => a + b, 0) / recentSentiments.length
    : 0;
  const trustLevel = Math.round(Math.max(15, Math.min(95, 50 + recentAvg * 30 + Math.min(analyzed.length, 10) * 2)));

  // Conflict resolution quality
  const conflictResolution = conflictScores.length > 0
    ? Math.round(conflictScores.reduce((a, b) => a + b, 0) / conflictScores.length * 100)
    : 50;

  // Emotional depth
  const emotionalDepth = depthScores.length > 0
    ? Math.round(depthScores.reduce((a, b) => a + b, 0) / depthScores.length * 100)
    : 30;

  // Determine trends by comparing first and second halves
  const mid = Math.floor(allSentiments.length / 2);
  const firstHalf = allSentiments.slice(0, mid);
  const secondHalf = allSentiments.slice(mid);
  const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length : 0;
  const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length : 0;
  const overallTrend: "up" | "down" | "stable" = secondAvg - firstAvg > 0.1 ? "up" : secondAvg - firstAvg < -0.1 ? "down" : "stable";

  const healthMetrics: RelationshipHealthMetric[] = [
    { label: "沟通质量", value: communicationScore, trend: overallTrend, color: "text-blue-400", icon: MessageSquare },
    { label: "信任指数", value: trustLevel, trend: trustLevel > 60 ? "up" : trustLevel < 40 ? "down" : "stable", color: "text-emerald-400", icon: Shield },
    { label: "冲突处理", value: conflictResolution, trend: conflictResolution > 60 ? "up" : "stable", color: "text-amber-400", icon: Target },
    { label: "情感深度", value: emotionalDepth, trend: emotionalDepth > 50 ? "up" : "stable", color: "text-pink-400", icon: Heart },
  ];

  // ---- Positive/Negative Topics ----
  const topPositiveTopics: string[] = [];
  const topNegativeTopics: string[] = [];
  for (const [topic, sentiments] of allTopics) {
    if (sentiments.length < 2) continue;
    const avg = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;
    if (avg > 0.15) topPositiveTopics.push(topic);
    else if (avg < -0.15) topNegativeTopics.push(topic);
  }

  // ---- Turning Points ----
  const turningPoints: { date: string; description: string; impact: "positive" | "negative" }[] = [];
  for (let i = 1; i < allSentiments.length; i++) {
    const delta = allSentiments[i] - allSentiments[i - 1];
    if (Math.abs(delta) > 0.35) {
      const c = analyzed[i];
      const topics = (c.analysis?.semanticContent?.coreTopics || []).slice(0, 2).join("、") || "未知话题";
      turningPoints.push({
        date: new Date(c.createdAt).toLocaleDateString("zh-CN"),
        description: delta > 0
          ? `关于「${topics}」的对话显著改善了关系氛围`
          : `关于「${topics}」的对话导致关系出现波动`,
        impact: delta > 0 ? "positive" : "negative",
      });
    }
  }

  // ---- Narrative ----
  const trendWord = overallTrend === "up" ? "持续升温" : overallTrend === "down" ? "有所降温" : "保持稳定";
  const narrative = `在过去${timeSpan}的${analyzed.length}次对话中，你与${profile.name}的关系总体${trendWord}。` +
    (topPositiveTopics.length > 0 ? `在${topPositiveTopics.slice(0, 2).join("、")}等话题上互动良好。` : "") +
    (topNegativeTopics.length > 0 ? `但在${topNegativeTopics.slice(0, 2).join("、")}等话题上需要更多关注。` : "") +
    (turningPoints.length > 0 ? `期间经历了${turningPoints.length}个关键转折点。` : "对话氛围整体平稳。");

  return {
    phases,
    healthMetrics,
    overallNarrative: narrative,
    communicationScore,
    trustLevel,
    conflictResolution,
    emotionalDepth,
    totalConversations: analyzed.length,
    totalMessages,
    timeSpan,
    topPositiveTopics: topPositiveTopics.slice(0, 4),
    topNegativeTopics: topNegativeTopics.slice(0, 4),
    turningPoints: turningPoints.slice(0, 5),
  };
}

// ---- Component ----

interface Props {
  profile: PersonProfile;
  conversations: ConversationSession[];
}

export default function RelationshipEvolutionSummary({ profile, conversations }: Props) {
  const summary = useMemo(
    () => analyzeEvolution(profile, conversations),
    [profile, conversations]
  );

  if (!summary) return null;

  const TrendIcon = ({ trend }: { trend: "up" | "down" | "stable" }) =>
    trend === "up" ? <TrendingUp className="h-3 w-3 text-emerald-400" /> :
    trend === "down" ? <TrendingDown className="h-3 w-3 text-red-400" /> :
    <Minus className="h-3 w-3 text-zinc-500" />;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
        <BookOpen className="h-4 w-4 text-violet-400" />
        <span className="text-xs font-medium text-zinc-200">关系演变总览</span>
        <span className="text-[9px] text-zinc-600 ml-auto">
          {summary.totalConversations}次对话 · {summary.timeSpan}
        </span>
      </div>

      <div className="p-4 space-y-5">
        {/* Narrative */}
        <p className="text-[11px] text-zinc-400 leading-relaxed">{summary.overallNarrative}</p>

        {/* Health Metrics */}
        <div className="grid grid-cols-4 gap-2">
          {summary.healthMetrics.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="rounded-lg border border-zinc-700/50 bg-zinc-800/30 p-2.5 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Icon className={cn("h-3 w-3", m.color)} />
                  <TrendIcon trend={m.trend} />
                </div>
                <p className={cn("text-lg font-semibold", m.color)}>{m.value}</p>
                <p className="text-[9px] text-zinc-500 mt-0.5">{m.label}</p>
              </div>
            );
          })}
        </div>

        {/* Evolution Phases */}
        <div className="space-y-2">
          <h4 className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">关系阶段</h4>
          <div className="space-y-2">
            {summary.phases.map((phase, idx) => (
              <div key={phase.id} className={cn("rounded-lg border p-3", phase.color)}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-zinc-200">
                      {idx + 1}. {phase.label}
                    </span>
                    <TrendIcon trend={phase.sentimentTrend} />
                  </div>
                  <span className="text-[9px] text-zinc-500">{phase.period} · {phase.conversationCount}次</span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed">{phase.keyInsight}</p>
                {phase.dominantTopics.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {phase.dominantTopics.map((t, i) => (
                      <span key={i} className="text-[8px] px-1.5 py-0.5 rounded bg-zinc-800/60 text-zinc-500 border border-zinc-700/50">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Turning Points */}
        {summary.turningPoints.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide flex items-center gap-1">
              <Zap className="h-3 w-3 text-amber-400" />
              关键转折点
            </h4>
            <div className="space-y-1.5">
              {summary.turningPoints.map((tp, i) => (
                <div key={i} className="flex items-start gap-2 text-[10px]">
                  <span className={cn(
                    "shrink-0 w-1.5 h-1.5 rounded-full mt-1",
                    tp.impact === "positive" ? "bg-emerald-400" : "bg-red-400"
                  )} />
                  <div>
                    <span className="text-zinc-500">{tp.date}</span>
                    <span className="text-zinc-400 ml-1.5">{tp.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Topic Sentiment Map */}
        {(summary.topPositiveTopics.length > 0 || summary.topNegativeTopics.length > 0) && (
          <div className="grid gap-3 grid-cols-2">
            {summary.topPositiveTopics.length > 0 && (
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Heart className="h-3 w-3 text-emerald-400" />
                  <span className="text-[10px] font-medium text-emerald-300">安全话题</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {summary.topPositiveTopics.map((t, i) => (
                    <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {summary.topNegativeTopics.length > 0 && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <AlertTriangle className="h-3 w-3 text-red-400" />
                  <span className="text-[10px] font-medium text-red-300">敏感话题</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {summary.topNegativeTopics.map((t, i) => (
                    <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-300 border border-red-500/20">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
