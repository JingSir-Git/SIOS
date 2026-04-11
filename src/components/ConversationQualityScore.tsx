"use client";

import { useMemo } from "react";
import {
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  MessageCircle,
  Heart,
  Target,
  Shield,
  Zap,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConversationAnalysis } from "@/lib/types";

// ---- Quality dimension scoring ----
interface QualityDimension {
  key: string;
  label: string;
  score: number; // 0-100
  icon: React.ElementType;
  color: string;
  detail: string;
}

export interface QualityResult {
  overallScore: number;
  grade: string;
  gradeColor: string;
  dimensions: QualityDimension[];
  strengths: string[];
  improvements: string[];
  trend: "improving" | "stable" | "declining" | "unknown";
}

function getGrade(score: number): { grade: string; color: string } {
  if (score >= 90) return { grade: "S", color: "text-amber-400" };
  if (score >= 80) return { grade: "A", color: "text-emerald-400" };
  if (score >= 70) return { grade: "B", color: "text-cyan-400" };
  if (score >= 60) return { grade: "C", color: "text-violet-400" };
  if (score >= 50) return { grade: "D", color: "text-amber-500" };
  return { grade: "F", color: "text-red-400" };
}

/** Analyze discourse engagement quality based on topic control and question frequency */
function scoreEngagement(analysis: ConversationAnalysis): { score: number; detail: string } {
  let score = 60;
  const parts: string[] = [];

  const tc = analysis.discourseStructure?.topicControl?.toLowerCase() || "";
  if (tc.includes("均衡") || tc.includes("平衡") || tc.includes("共同")) {
    score += 15;
    parts.push("话题控制均衡");
  } else if (tc.includes("主导") || tc.includes("单方")) {
    score -= 5;
    parts.push("话题由一方主导");
  }

  const qf = analysis.discourseStructure?.questionFrequency?.toLowerCase() || "";
  if (qf.includes("高") || qf.includes("频繁") || qf.includes("多")) {
    score += 10;
    parts.push("互动积极");
  } else if (qf.includes("低") || qf.includes("少")) {
    score -= 5;
    parts.push("提问较少");
  }

  const ib = analysis.interactionPatterns?.initiativeBalance?.toLowerCase() || "";
  if (ib.includes("均衡") || ib.includes("平衡") || ib.includes("双向")) {
    score += 10;
    parts.push("主动性平衡");
  }

  return { score: Math.max(0, Math.min(100, score)), detail: parts.join("；") || "基础对话参与" };
}

/** Analyze emotional quality from emotion curve data */
function scoreEmotionQuality(analysis: ConversationAnalysis): { score: number; detail: string } {
  let score = 60;
  const parts: string[] = [];

  const curve = analysis.emotionCurve || [];
  if (curve.length >= 2) {
    const selfStart = curve[0]?.selfEmotion ?? 0;
    const selfEnd = curve[curve.length - 1]?.selfEmotion ?? 0;
    const otherStart = curve[0]?.otherEmotion ?? 0;
    const otherEnd = curve[curve.length - 1]?.otherEmotion ?? 0;

    // Positive emotion trajectory
    if (selfEnd > selfStart) { score += 10; parts.push("自身情绪上升"); }
    if (otherEnd > otherStart) { score += 15; parts.push("对方情绪改善"); }
    if (selfEnd < selfStart - 0.3) { score -= 10; parts.push("自身情绪下降"); }
    if (otherEnd < otherStart - 0.3) { score -= 15; parts.push("对方情绪恶化"); }

    // Average positive sentiment
    const avgOther = curve.reduce((s, p) => s + p.otherEmotion, 0) / curve.length;
    if (avgOther > 0.3) { score += 10; parts.push("整体氛围积极"); }
    else if (avgOther < -0.3) { score -= 10; parts.push("整体氛围消极"); }
  }

  const el = analysis.metacognitive?.emotionalLabeling?.toLowerCase() || "";
  if (el.includes("准确") || el.includes("敏锐") || el.includes("善于")) {
    score += 5;
    parts.push("情绪感知能力强");
  }

  return { score: Math.max(0, Math.min(100, score)), detail: parts.join("；") || "情绪基本平稳" };
}

/** Analyze strategic effectiveness from insights and next steps */
function scoreStrategy(analysis: ConversationAnalysis): { score: number; detail: string } {
  let score = 55;
  const parts: string[] = [];

  const insights = analysis.strategicInsights || [];
  if (insights.length >= 3) { score += 15; parts.push(`${insights.length}条策略洞察`); }
  else if (insights.length >= 1) { score += 8; parts.push("有基本策略洞察"); }

  const nextSteps = analysis.nextStepSuggestions || [];
  if (nextSteps.length >= 3) { score += 10; parts.push("后续行动清晰"); }
  else if (nextSteps.length >= 1) { score += 5; }

  const ch = analysis.interactionPatterns?.conflictHandling?.toLowerCase() || "";
  if (ch.includes("有效") || ch.includes("化解") || ch.includes("妥善")) {
    score += 10;
    parts.push("冲突处理得当");
  } else if (ch.includes("回避") || ch.includes("激化") || ch.includes("恶化")) {
    score -= 10;
    parts.push("冲突处理欠佳");
  }

  return { score: Math.max(0, Math.min(100, score)), detail: parts.join("；") || "策略待提升" };
}

/** Analyze depth of understanding from semantic and metacognitive layers */
function scoreDepth(analysis: ConversationAnalysis): { score: number; detail: string } {
  let score = 55;
  const parts: string[] = [];

  const topics = analysis.semanticContent?.coreTopics || [];
  if (topics.length >= 3) { score += 10; parts.push("话题丰富"); }

  const hidden = analysis.semanticContent?.hiddenAgenda || "";
  if (hidden && hidden !== "无" && hidden.length > 5) {
    score += 10;
    parts.push("识别到深层议题");
  }

  const sa = analysis.metacognitive?.selfAwareness?.toLowerCase() || "";
  if (sa.includes("高") || sa.includes("强") || sa.includes("清晰")) {
    score += 10;
    parts.push("自我觉察良好");
  }

  const fl = analysis.metacognitive?.flexibilityLevel?.toLowerCase() || "";
  if (fl.includes("高") || fl.includes("灵活")) {
    score += 10;
    parts.push("思维灵活");
  } else if (fl.includes("低") || fl.includes("僵化")) {
    score -= 5;
    parts.push("思维较固化");
  }

  return { score: Math.max(0, Math.min(100, score)), detail: parts.join("；") || "理解深度一般" };
}

/** Analyze expression quality from surface features */
function scoreExpression(analysis: ConversationAnalysis): { score: number; detail: string } {
  let score = 65;
  const parts: string[] = [];

  const tone = analysis.surfaceFeatures?.toneMarkers?.toLowerCase() || "";
  if (tone.includes("温和") || tone.includes("友好") || tone.includes("热情")) {
    score += 10;
    parts.push("语气友好");
  } else if (tone.includes("冷淡") || tone.includes("攻击") || tone.includes("讽刺")) {
    score -= 15;
    parts.push("语气有待改善");
  }

  const hedge = analysis.discourseStructure?.hedgingLevel?.toLowerCase() || "";
  if (hedge.includes("适度") || hedge.includes("恰当")) {
    score += 5;
    parts.push("表达分寸得当");
  } else if (hedge.includes("过度") || hedge.includes("过多")) {
    score -= 5;
    parts.push("表达过于保守");
  }

  const mirror = analysis.interactionPatterns?.mirroring?.toLowerCase() || "";
  if (mirror.includes("高") || mirror.includes("强") || mirror.includes("明显")) {
    score += 10;
    parts.push("语言镜像良好");
  }

  return { score: Math.max(0, Math.min(100, score)), detail: parts.join("；") || "表达质量正常" };
}

/** Main scoring function: compute all dimensions and overall quality */
export function computeQualityScore(analysis: ConversationAnalysis): QualityResult {
  const engagement = scoreEngagement(analysis);
  const emotion = scoreEmotionQuality(analysis);
  const strategy = scoreStrategy(analysis);
  const depth = scoreDepth(analysis);
  const expression = scoreExpression(analysis);

  const dimensions: QualityDimension[] = [
    { key: "engagement", label: "互动参与", score: engagement.score, icon: MessageCircle, color: "text-cyan-400", detail: engagement.detail },
    { key: "emotion", label: "情绪管理", score: emotion.score, icon: Heart, color: "text-pink-400", detail: emotion.detail },
    { key: "strategy", label: "策略效果", score: strategy.score, icon: Target, color: "text-amber-400", detail: strategy.detail },
    { key: "depth", label: "理解深度", score: depth.score, icon: Shield, color: "text-violet-400", detail: depth.detail },
    { key: "expression", label: "表达质量", score: expression.score, icon: Zap, color: "text-emerald-400", detail: expression.detail },
  ];

  // Weighted average
  const weights = [0.2, 0.25, 0.2, 0.2, 0.15];
  const overallScore = Math.round(
    dimensions.reduce((sum, d, i) => sum + d.score * weights[i], 0)
  );

  const { grade, color } = getGrade(overallScore);

  // Identify strengths and improvements
  const sorted = [...dimensions].sort((a, b) => b.score - a.score);
  const strengths = sorted.filter((d) => d.score >= 70).slice(0, 2).map((d) => `${d.label}: ${d.detail}`);
  const improvements = sorted.filter((d) => d.score < 65).slice(-2).map((d) => `${d.label}: ${d.detail}`);

  return {
    overallScore,
    grade,
    gradeColor: color,
    dimensions,
    strengths,
    improvements,
    trend: "unknown",
  };
}

/** Compute trend from multiple analyses */
export function computeTrend(analyses: ConversationAnalysis[]): "improving" | "stable" | "declining" | "unknown" {
  if (analyses.length < 2) return "unknown";
  const scores = analyses.slice(0, 5).map((a) => computeQualityScore(a).overallScore);
  if (scores.length < 2) return "unknown";
  const recent = scores.slice(0, Math.ceil(scores.length / 2));
  const earlier = scores.slice(Math.ceil(scores.length / 2));
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;
  const diff = recentAvg - earlierAvg;
  if (diff > 3) return "improving";
  if (diff < -3) return "declining";
  return "stable";
}

// ---- Display Component ----

interface Props {
  analysis: ConversationAnalysis;
  /** Previous analyses for trend calculation */
  previousAnalyses?: ConversationAnalysis[];
  compact?: boolean;
}

export default function ConversationQualityScore({ analysis, previousAnalyses, compact }: Props) {
  const result = useMemo(() => {
    const r = computeQualityScore(analysis);
    if (previousAnalyses && previousAnalyses.length > 0) {
      r.trend = computeTrend([analysis, ...previousAnalyses]);
    }
    return r;
  }, [analysis, previousAnalyses]);

  const TrendIcon = result.trend === "improving" ? TrendingUp
    : result.trend === "declining" ? TrendingDown
    : Minus;
  const trendColor = result.trend === "improving" ? "text-emerald-400"
    : result.trend === "declining" ? "text-red-400"
    : "text-zinc-500";
  const trendLabel = result.trend === "improving" ? "提升中"
    : result.trend === "declining" ? "下降中"
    : result.trend === "stable" ? "稳定"
    : "";

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Star className="h-3 w-3 text-amber-400" />
          <span className={cn("text-sm font-bold", result.gradeColor)}>{result.grade}</span>
          <span className="text-[10px] text-zinc-500">{result.overallScore}分</span>
        </div>
        {result.trend !== "unknown" && (
          <div className={cn("flex items-center gap-0.5", trendColor)}>
            <TrendIcon className="h-2.5 w-2.5" />
            <span className="text-[9px]">{trendLabel}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-3.5 w-3.5 text-violet-400" />
          <span className="text-xs font-medium text-zinc-300">对话质量评分</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className={cn("text-xl font-bold", result.gradeColor)}>{result.grade}</span>
            <span className="text-xs text-zinc-500">{result.overallScore}/100</span>
          </div>
          {result.trend !== "unknown" && (
            <div className={cn("flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-zinc-800/50", trendColor)}>
              <TrendIcon className="h-3 w-3" />
              <span className="text-[9px]">{trendLabel}</span>
            </div>
          )}
        </div>
      </div>

      {/* Dimension Gauges */}
      <div className="space-y-2.5">
        {result.dimensions.map((dim) => {
          const Icon = dim.icon;
          const needleColor = dim.score >= 80 ? "#34d399" : dim.score >= 65 ? "#22d3ee" : dim.score >= 50 ? "#fbbf24" : "#f87171";
          return (
            <div key={dim.key}>
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-1.5">
                  <Icon className={cn("h-3 w-3", dim.color)} />
                  <span className="text-[10px] text-zinc-400">{dim.label}</span>
                </div>
                <span className="text-[10px] font-mono font-medium" style={{ color: needleColor }}>{dim.score}</span>
              </div>
              <div className="relative h-1.5 rounded-full bg-zinc-800">
                <div className="absolute inset-0 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${dim.score}%`, background: `linear-gradient(to right, #3f3f46, ${needleColor})`, opacity: 0.3 }}
                  />
                </div>
                <div className="absolute top-[-1px] w-0.5 h-2.5 rounded-sm transition-all duration-500" style={{ left: `${dim.score}%`, transform: "translateX(-50%)", backgroundColor: needleColor }} />
              </div>
              <p className="text-[9px] text-zinc-600 leading-tight mt-0.5">{dim.detail}</p>
            </div>
          );
        })}
      </div>

      {/* Strengths & Improvements */}
      {(result.strengths.length > 0 || result.improvements.length > 0) && (
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-800/50">
          {result.strengths.length > 0 && (
            <div>
              <span className="text-[9px] font-medium text-emerald-400 block mb-1">优势</span>
              {result.strengths.map((s, i) => (
                <p key={i} className="text-[9px] text-zinc-500 leading-relaxed">✓ {s}</p>
              ))}
            </div>
          )}
          {result.improvements.length > 0 && (
            <div>
              <span className="text-[9px] font-medium text-amber-400 block mb-1">可提升</span>
              {result.improvements.map((s, i) => (
                <p key={i} className="text-[9px] text-zinc-500 leading-relaxed">△ {s}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
