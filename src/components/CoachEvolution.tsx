"use client";

import { useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  BarChart3,
  Target,
  Heart,
  Clock,
  Zap,
  Shield,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import type { EQScoreEntry } from "@/lib/types";
import { computeQualityScore } from "./ConversationQualityScore";

// ---- Dimension config ----
const EQ_DIMS: { key: keyof EQScoreEntry["dimensionScores"]; label: string; icon: React.ElementType; color: string }[] = [
  { key: "empathyAccuracy",        label: "共情准确度", icon: Heart,  color: "text-pink-400" },
  { key: "expressionPrecision",    label: "表达精准度", icon: Zap,    color: "text-amber-400" },
  { key: "timingControl",          label: "时机把控",   icon: Clock,  color: "text-cyan-400" },
  { key: "strategyEffectiveness",  label: "策略有效性", icon: Target, color: "text-violet-400" },
  { key: "relationshipMaintenance",label: "关系维护",   icon: Shield, color: "text-emerald-400" },
];

interface EvolutionData {
  /** EQ score trend */
  eqTrend: "improving" | "stable" | "declining" | "insufficient";
  eqAvgRecent: number;
  eqAvgPrevious: number;
  /** Per-dimension trends */
  dimTrends: { key: string; label: string; icon: React.ElementType; color: string; recent: number; previous: number; trend: string }[];
  /** Conversation quality trend */
  qualityTrend: "improving" | "stable" | "declining" | "insufficient";
  qualityAvgRecent: number;
  qualityAvgPrevious: number;
  /** Total sessions */
  totalEQSessions: number;
  totalConversations: number;
  /** Milestones */
  milestones: { label: string; icon: React.ElementType; achieved: boolean }[];
  /** Best and weakest dimensions */
  bestDim: string;
  weakestDim: string;
}

function analyzeEvolution(eqScores: EQScoreEntry[]): EvolutionData {
  const sorted = [...eqScores].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const half = Math.ceil(sorted.length / 2);
  const recent = sorted.slice(0, half);
  const previous = sorted.slice(half);

  // EQ score trend
  const eqAvgRecent = recent.length > 0 ? recent.reduce((s, e) => s + e.overallScore, 0) / recent.length : 0;
  const eqAvgPrevious = previous.length > 0 ? previous.reduce((s, e) => s + e.overallScore, 0) / previous.length : 0;
  let eqTrend: EvolutionData["eqTrend"] = "insufficient";
  if (sorted.length >= 3) {
    const diff = eqAvgRecent - eqAvgPrevious;
    eqTrend = diff > 2 ? "improving" : diff < -2 ? "declining" : "stable";
  }

  // Per-dimension trends
  const dimTrends = EQ_DIMS.map((dim) => {
    const recentAvg = recent.length > 0
      ? recent.reduce((s, e) => s + (e.dimensionScores?.[dim.key] ?? 0), 0) / recent.length
      : 0;
    const prevAvg = previous.length > 0
      ? previous.reduce((s, e) => s + (e.dimensionScores?.[dim.key] ?? 0), 0) / previous.length
      : 0;
    const diff = recentAvg - prevAvg;
    return {
      key: dim.key,
      label: dim.label,
      icon: dim.icon,
      color: dim.color,
      recent: Math.round(recentAvg),
      previous: Math.round(prevAvg),
      trend: sorted.length >= 3 ? (diff > 3 ? "up" : diff < -3 ? "down" : "stable") : "unknown",
    };
  });

  // Find best and weakest
  const dimAvgs = EQ_DIMS.map((d) => ({
    label: d.label,
    avg: sorted.length > 0
      ? sorted.reduce((s, e) => s + (e.dimensionScores?.[d.key] ?? 0), 0) / sorted.length
      : 0,
  }));
  dimAvgs.sort((a, b) => b.avg - a.avg);
  const bestDim = dimAvgs[0]?.label || "—";
  const weakestDim = dimAvgs[dimAvgs.length - 1]?.label || "—";

  // Milestones
  const milestones = [
    { label: "完成首次EQ训练", icon: Sparkles, achieved: sorted.length >= 1 },
    { label: "累计5次训练",    icon: Target,   achieved: sorted.length >= 5 },
    { label: "均分突破70",     icon: Award,    achieved: eqAvgRecent >= 70 },
    { label: "均分突破80",     icon: Award,    achieved: eqAvgRecent >= 80 },
    { label: "均分突破90",     icon: Award,    achieved: eqAvgRecent >= 90 },
    { label: "全维度60+",      icon: Shield,   achieved: sorted.length >= 1 && dimAvgs.every((d) => d.avg >= 60) },
  ];

  return {
    eqTrend,
    eqAvgRecent: Math.round(eqAvgRecent),
    eqAvgPrevious: Math.round(eqAvgPrevious),
    dimTrends,
    qualityTrend: "insufficient",
    qualityAvgRecent: 0,
    qualityAvgPrevious: 0,
    totalEQSessions: sorted.length,
    totalConversations: 0,
    milestones,
    bestDim,
    weakestDim,
  };
}

export default function CoachEvolution() {
  const { eqScores, conversations } = useAppStore();

  const data = useMemo(() => {
    const evo = analyzeEvolution(eqScores);

    // Conversation quality trend
    const analyzedConvos = conversations
      .filter((c) => c.analysis)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    evo.totalConversations = analyzedConvos.length;

    if (analyzedConvos.length >= 4) {
      const half = Math.ceil(analyzedConvos.length / 2);
      const recentQ = analyzedConvos.slice(0, half).map((c) => computeQualityScore(c.analysis!).overallScore);
      const prevQ = analyzedConvos.slice(half).map((c) => computeQualityScore(c.analysis!).overallScore);
      evo.qualityAvgRecent = Math.round(recentQ.reduce((a, b) => a + b, 0) / recentQ.length);
      evo.qualityAvgPrevious = Math.round(prevQ.reduce((a, b) => a + b, 0) / prevQ.length);
      const diff = evo.qualityAvgRecent - evo.qualityAvgPrevious;
      evo.qualityTrend = diff > 2 ? "improving" : diff < -2 ? "declining" : "stable";
    }

    return evo;
  }, [eqScores, conversations]);

  const TrendIcon = (trend: string) =>
    trend === "improving" || trend === "up" ? TrendingUp
      : trend === "declining" || trend === "down" ? TrendingDown
      : Minus;
  const trendColor = (trend: string) =>
    trend === "improving" || trend === "up" ? "text-emerald-400"
      : trend === "declining" || trend === "down" ? "text-red-400"
      : "text-zinc-500";
  const trendLabel = (trend: string) =>
    trend === "improving" || trend === "up" ? "提升" : trend === "declining" || trend === "down" ? "下降" : trend === "stable" ? "稳定" : "—";

  if (data.totalEQSessions === 0 && data.totalConversations === 0) {
    return null; // Nothing to show
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      <div className="flex items-center gap-2 border-b border-zinc-800 px-3 py-2">
        <Award className="h-3.5 w-3.5 text-amber-400" />
        <span className="text-xs font-medium text-zinc-300">教练进化追踪</span>
        <span className="text-[9px] text-zinc-600">
          {data.totalEQSessions}次训练 · {data.totalConversations}次对话
        </span>
      </div>

      <div className="p-3 space-y-3">
        {/* Overall Metrics */}
        <div className="grid grid-cols-2 gap-2">
          {/* EQ Score Card */}
          <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/30 p-2.5 space-y-1">
            <div className="flex items-center gap-1.5">
              <BarChart3 className="h-3 w-3 text-violet-400" />
              <span className="text-[10px] text-zinc-400">EQ综合评分</span>
            </div>
            {data.totalEQSessions > 0 ? (
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-zinc-200">{data.eqAvgRecent}</span>
                {data.eqTrend !== "insufficient" && (
                  <div className={cn("flex items-center gap-0.5", trendColor(data.eqTrend))}>
                    {(() => { const I = TrendIcon(data.eqTrend); return <I className="h-3 w-3" />; })()}
                    <span className="text-[9px]">
                      {trendLabel(data.eqTrend)}
                      {data.eqAvgPrevious > 0 && ` (${data.eqAvgRecent > data.eqAvgPrevious ? "+" : ""}${data.eqAvgRecent - data.eqAvgPrevious})`}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <span className="text-[10px] text-zinc-600">尚无数据</span>
            )}
          </div>

          {/* Quality Score Card */}
          <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/30 p-2.5 space-y-1">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-cyan-400" />
              <span className="text-[10px] text-zinc-400">对话质量均分</span>
            </div>
            {data.qualityTrend !== "insufficient" ? (
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-zinc-200">{data.qualityAvgRecent}</span>
                <div className={cn("flex items-center gap-0.5", trendColor(data.qualityTrend))}>
                  {(() => { const I = TrendIcon(data.qualityTrend); return <I className="h-3 w-3" />; })()}
                  <span className="text-[9px]">
                    {trendLabel(data.qualityTrend)}
                    {data.qualityAvgPrevious > 0 && ` (${data.qualityAvgRecent > data.qualityAvgPrevious ? "+" : ""}${data.qualityAvgRecent - data.qualityAvgPrevious})`}
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-[10px] text-zinc-600">需≥4次对话</span>
            )}
          </div>
        </div>

        {/* EQ Dimension Sparklines */}
        {data.totalEQSessions >= 2 && (
          <div className="space-y-1.5">
            <span className="text-[9px] text-zinc-500 font-medium">维度趋势</span>
            {data.dimTrends.map((d) => {
              const Icon = d.icon;
              const TI = TrendIcon(d.trend);
              return (
                <div key={d.key} className="flex items-center gap-2">
                  <Icon className={cn("h-3 w-3 shrink-0", d.color)} />
                  <span className="text-[9px] text-zinc-400 w-16 shrink-0">{d.label}</span>
                  <div className="relative flex-1 h-1.5 rounded-full bg-zinc-800">
                    <div className="absolute inset-0 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${d.recent}%`, background: `linear-gradient(to right, #3f3f46, ${d.recent >= 80 ? "#34d399" : d.recent >= 60 ? "#22d3ee" : d.recent >= 40 ? "#f59e0b" : "#ef4444"})`, opacity: 0.35 }} />
                    </div>
                    <div className="absolute top-[-1px] w-0.5 h-2.5 rounded-sm transition-all" style={{ left: `${d.recent}%`, transform: "translateX(-50%)", backgroundColor: d.recent >= 80 ? "#34d399" : d.recent >= 60 ? "#22d3ee" : d.recent >= 40 ? "#f59e0b" : "#ef4444" }} />
                  </div>
                  <span className="text-[9px] text-zinc-500 w-6 text-right shrink-0">{d.recent}</span>
                  {d.trend !== "unknown" && (
                    <TI className={cn("h-2.5 w-2.5 shrink-0", trendColor(d.trend))} />
                  )}
                </div>
              );
            })}
            <div className="flex items-center justify-between text-[8px] text-zinc-600 pt-1">
              <span>最强: <span className="text-emerald-400">{data.bestDim}</span></span>
              <span>待提升: <span className="text-amber-400">{data.weakestDim}</span></span>
            </div>
          </div>
        )}

        {/* Milestones */}
        <div className="space-y-1">
          <span className="text-[9px] text-zinc-500 font-medium block">成就里程碑</span>
          <div className="flex flex-wrap gap-1">
            {data.milestones.map((m, i) => {
              const Icon = m.icon;
              return (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] border",
                    m.achieved
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      : "bg-zinc-800/50 text-zinc-600 border-zinc-700/50"
                  )}
                >
                  <Icon className="h-2.5 w-2.5" />
                  {m.label}
                </div>
              );
            })}
          </div>
        </div>

        {/* EQ Score History Mini Chart */}
        {eqScores.length >= 2 && (
          <div className="pt-1 border-t border-zinc-800/50">
            <span className="text-[9px] text-zinc-500 font-medium block mb-1">EQ分数变化</span>
            <svg viewBox="0 0 300 50" className="w-full h-12">
              {(() => {
                const sorted = [...eqScores]
                  .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                  .slice(-10);
                const min = Math.min(...sorted.map((s) => s.overallScore)) - 5;
                const max = Math.max(...sorted.map((s) => s.overallScore)) + 5;
                const range = max - min || 1;
                const points = sorted.map((s, i) => ({
                  x: (i / Math.max(sorted.length - 1, 1)) * 280 + 10,
                  y: 45 - ((s.overallScore - min) / range) * 40,
                  score: s.overallScore,
                }));
                const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
                return (
                  <>
                    <path d={pathD} fill="none" stroke="#8b5cf6" strokeWidth="1.5" opacity="0.8" />
                    {points.map((p, i) => (
                      <g key={i}>
                        <circle cx={p.x} cy={p.y} r="2.5" fill="#8b5cf6" />
                        {(i === 0 || i === points.length - 1) && (
                          <text x={p.x} y={p.y - 6} textAnchor="middle" fill="#a1a1aa" fontSize="7">{p.score}</text>
                        )}
                      </g>
                    ))}
                  </>
                );
              })()}
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
