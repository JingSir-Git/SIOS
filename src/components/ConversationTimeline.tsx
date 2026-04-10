"use client";

import { useMemo, useState } from "react";
import {
  Clock,
  MessageCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  AlertTriangle,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Zap,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConversationSession, KeyMoment } from "@/lib/types";
import { computeQualityScore } from "./ConversationQualityScore";

// ---- Timeline Entry ----

interface TimelineEntry {
  conversation: ConversationSession;
  date: Date;
  qualityScore: number;
  qualityGrade: string;
  qualityGradeColor: string;
  avgEmotion: number;
  emotionDelta: number;
  keyMoments: KeyMoment[];
  topics: string[];
  summary: string;
  isTurningPoint: boolean;
  turningPointReason?: string;
}

function buildTimeline(conversations: ConversationSession[]): TimelineEntry[] {
  const analyzed = conversations
    .filter((c) => c.analysis)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const entries: TimelineEntry[] = [];
  let prevAvgEmotion: number | null = null;

  for (const c of analyzed) {
    const a = c.analysis!;
    const curve = a.emotionCurve || [];
    const avgEmotion = curve.length > 0
      ? curve.reduce((s, p) => s + p.otherEmotion, 0) / curve.length
      : 0;
    const emotionDelta = curve.length >= 2
      ? curve[curve.length - 1].otherEmotion - curve[0].otherEmotion
      : 0;

    const qs = computeQualityScore(a);

    // Detect turning points
    let isTurningPoint = false;
    let turningPointReason: string | undefined;

    if (prevAvgEmotion !== null) {
      const change = avgEmotion - prevAvgEmotion;
      if (Math.abs(change) > 0.35) {
        isTurningPoint = true;
        turningPointReason = change > 0 ? "情绪大幅回升" : "情绪显著下降";
      }
    }

    // Key moments with high significance
    const keyMoments = a.keyMoments || [];
    const importantMoments = keyMoments.filter(
      (km) => km.significance === "高" || km.impact === "positive" || km.impact === "negative"
    );
    if (importantMoments.length >= 2 && !isTurningPoint) {
      isTurningPoint = true;
      turningPointReason = `包含${importantMoments.length}个关键时刻`;
    }

    entries.push({
      conversation: c,
      date: new Date(c.createdAt),
      qualityScore: qs.overallScore,
      qualityGrade: qs.grade,
      qualityGradeColor: qs.gradeColor,
      avgEmotion,
      emotionDelta,
      keyMoments,
      topics: a.semanticContent?.coreTopics || [],
      summary: a.summary || "",
      isTurningPoint,
      turningPointReason,
    });

    prevAvgEmotion = avgEmotion;
  }

  return entries;
}

// ---- Component ----

interface Props {
  conversations: ConversationSession[];
  profileName: string;
}

export default function ConversationTimeline({ conversations, profileName }: Props) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const timeline = useMemo(() => buildTimeline(conversations), [conversations]);

  if (timeline.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 text-center">
        <Clock className="h-6 w-6 text-zinc-700 mx-auto mb-1" />
        <p className="text-[10px] text-zinc-600">暂无分析过的对话数据</p>
      </div>
    );
  }

  // Summary stats
  const avgQuality = Math.round(timeline.reduce((s, e) => s + e.qualityScore, 0) / timeline.length);
  const turningPoints = timeline.filter((e) => e.isTurningPoint).length;
  const totalKeyMoments = timeline.reduce((s, e) => s + e.keyMoments.length, 0);

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-violet-400" />
          <span className="text-xs font-medium text-zinc-300">对话复盘时间线</span>
          <span className="text-[9px] text-zinc-600">
            与{profileName}的{timeline.length}次对话
          </span>
        </div>
        <div className="flex items-center gap-3 text-[9px] text-zinc-500">
          <span>均质量 <span className="text-zinc-300">{avgQuality}</span></span>
          <span>关键转折 <span className="text-amber-400">{turningPoints}</span></span>
          <span>关键时刻 <span className="text-cyan-400">{totalKeyMoments}</span></span>
        </div>
      </div>

      {/* Quality Trend Minimap */}
      {timeline.length >= 2 && (
        <div className="border-b border-zinc-800/50 px-3 py-2">
          <svg viewBox="0 0 400 40" className="w-full h-8">
            {/* Quality line */}
            {timeline.map((entry, i) => {
              if (i === 0) return null;
              const prev = timeline[i - 1];
              const x1 = (i - 1) / Math.max(timeline.length - 1, 1) * 380 + 10;
              const x2 = i / Math.max(timeline.length - 1, 1) * 380 + 10;
              const y1 = 38 - (prev.qualityScore / 100) * 34;
              const y2 = 38 - (entry.qualityScore / 100) * 34;
              return (
                <line key={`line-${i}`} x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="#8b5cf6" strokeWidth="1.5" opacity="0.6" />
              );
            })}
            {/* Points */}
            {timeline.map((entry, i) => {
              const x = i / Math.max(timeline.length - 1, 1) * 380 + 10;
              const y = 38 - (entry.qualityScore / 100) * 34;
              return (
                <g key={`pt-${i}`}>
                  <circle cx={x} cy={y} r={entry.isTurningPoint ? 3.5 : 2}
                    fill={entry.isTurningPoint ? "#f59e0b" : "#8b5cf6"} />
                  {entry.isTurningPoint && (
                    <circle cx={x} cy={y} r="6" fill="none" stroke="#f59e0b" strokeWidth="0.5" opacity="0.4" />
                  )}
                </g>
              );
            })}
            {/* Emotion baseline */}
            <line x1="10" y1={38 - 60 / 100 * 34} x2="390" y2={38 - 60 / 100 * 34}
              stroke="#3f3f46" strokeWidth="0.5" strokeDasharray="4 4" />
          </svg>
          <div className="flex items-center justify-between text-[7px] text-zinc-700">
            <span>{timeline[0].date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" })}</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-0.5 rounded bg-violet-500 inline-block" /> 质量分
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block ml-1" /> 转折点
            </span>
            <span>{timeline[timeline.length - 1].date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" })}</span>
          </div>
        </div>
      )}

      {/* Timeline entries */}
      <div className="divide-y divide-zinc-800/30 max-h-[50vh] overflow-y-auto">
        {[...timeline].reverse().map((entry, idx) => {
          const realIdx = timeline.length - 1 - idx;
          const isExpanded = expandedIdx === realIdx;
          const DeltaIcon = entry.emotionDelta > 0.1 ? TrendingUp
            : entry.emotionDelta < -0.1 ? TrendingDown : Minus;
          const deltaColor = entry.emotionDelta > 0.1 ? "text-emerald-400"
            : entry.emotionDelta < -0.1 ? "text-red-400" : "text-zinc-500";

          return (
            <div key={entry.conversation.id} className={cn(
              "transition-colors",
              entry.isTurningPoint ? "bg-amber-500/[0.02]" : ""
            )}>
              <button
                onClick={() => setExpandedIdx(isExpanded ? null : realIdx)}
                className="w-full flex items-start gap-3 p-3 text-left hover:bg-zinc-800/20 transition-colors"
              >
                {/* Timeline dot */}
                <div className="flex flex-col items-center shrink-0 pt-0.5">
                  <div className={cn(
                    "w-2.5 h-2.5 rounded-full border-2",
                    entry.isTurningPoint
                      ? "border-amber-400 bg-amber-400/30"
                      : "border-zinc-600 bg-zinc-800"
                  )} />
                  {idx < timeline.length - 1 && (
                    <div className="w-px h-full bg-zinc-800 min-h-[20px]" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-zinc-500">
                      {entry.date.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric", hour: "numeric", minute: "numeric" })}
                    </span>
                    <span className={cn("text-[10px] font-bold", entry.qualityGradeColor)}>
                      {entry.qualityGrade}
                    </span>
                    <span className="text-[9px] text-zinc-600">{entry.qualityScore}分</span>
                    <div className={cn("flex items-center gap-0.5", deltaColor)}>
                      <DeltaIcon className="h-2.5 w-2.5" />
                      <span className="text-[8px]">{entry.emotionDelta > 0 ? "+" : ""}{entry.emotionDelta.toFixed(2)}</span>
                    </div>
                    {entry.isTurningPoint && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        ★ {entry.turningPointReason}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">
                    {entry.conversation.title || entry.summary.slice(0, 60)}
                  </p>
                  {entry.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {entry.topics.slice(0, 3).map((t, ti) => (
                        <span key={ti} className="text-[8px] px-1 py-0.5 rounded bg-zinc-800 text-zinc-500 border border-zinc-700/50">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {isExpanded ? <ChevronUp className="h-3 w-3 text-zinc-600 shrink-0" /> : <ChevronDown className="h-3 w-3 text-zinc-600 shrink-0" />}
              </button>

              {/* Expanded Detail */}
              {isExpanded && (
                <div className="px-3 pb-3 pl-9 space-y-2 animate-in fade-in-0 slide-in-from-top-1 duration-150">
                  {/* Summary */}
                  <div className="rounded bg-zinc-800/30 border border-zinc-700/50 p-2">
                    <p className="text-[10px] text-zinc-400 leading-relaxed">{entry.summary}</p>
                  </div>

                  {/* Key Moments */}
                  {entry.keyMoments.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[8px] text-zinc-500 font-medium">关键时刻</span>
                      {entry.keyMoments.map((km, ki) => (
                        <div key={ki} className={cn(
                          "flex items-start gap-1.5 rounded p-1.5 text-[9px]",
                          km.impact === "positive" ? "bg-emerald-500/5 text-emerald-300"
                            : km.impact === "negative" ? "bg-red-500/5 text-red-300"
                            : "bg-zinc-800/30 text-zinc-400"
                        )}>
                          {km.impact === "positive" ? <Heart className="h-2.5 w-2.5 shrink-0 mt-0.5" />
                            : km.impact === "negative" ? <AlertTriangle className="h-2.5 w-2.5 shrink-0 mt-0.5" />
                            : <Lightbulb className="h-2.5 w-2.5 shrink-0 mt-0.5" />}
                          <div>
                            <p>{km.description}</p>
                            {km.significance && <p className="text-[8px] opacity-60 mt-0.5">意义: {km.significance}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Strategic Insights */}
                  {entry.conversation.analysis?.strategicInsights?.length ? (
                    <div className="space-y-0.5">
                      <span className="text-[8px] text-zinc-500 font-medium">策略洞察</span>
                      {entry.conversation.analysis.strategicInsights.slice(0, 3).map((ins, ii) => (
                        <p key={ii} className="text-[9px] text-zinc-500">
                          <Zap className="h-2 w-2 inline text-amber-400 mr-0.5" />{ins}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
