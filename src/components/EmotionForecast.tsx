"use client";

import { useMemo } from "react";
import {
  CloudSun,
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConversationSession, PersonProfile, EmotionPoint } from "@/lib/types";

// ---- Forecast Types ----

interface ForecastResult {
  /** Predicted starting emotion of next conversation */
  predictedStart: number;
  /** Predicted ending emotion (based on recent trends) */
  predictedEnd: number;
  /** Overall forecast level */
  weatherLevel: "sunny" | "partly_cloudy" | "cloudy" | "rainy" | "stormy";
  /** Confidence in the forecast */
  confidence: "high" | "medium" | "low";
  /** Risk factors for the upcoming conversation */
  riskFactors: string[];
  /** Positive factors */
  positiveFactors: string[];
  /** Preparation tips */
  tips: string[];
  /** Trend direction based on multi-conversation analysis */
  overallTrend: "improving" | "stable" | "declining";
  /** Time-of-day recommendation */
  bestTimeSlot?: string;
  /** Data basis */
  basedOn: number;
}

const WEATHER_CONFIG: Record<ForecastResult["weatherLevel"], {
  icon: React.ElementType;
  label: string;
  color: string;
  bgColor: string;
  description: string;
}> = {
  sunny:         { icon: Sun,            label: "晴朗",   color: "text-amber-400",   bgColor: "bg-amber-500/5 border-amber-500/20",   description: "对话氛围预计积极正面" },
  partly_cloudy: { icon: CloudSun,       label: "多云",   color: "text-cyan-400",    bgColor: "bg-cyan-500/5 border-cyan-500/20",     description: "整体良好，但需关注某些话题" },
  cloudy:        { icon: Cloud,          label: "阴天",   color: "text-zinc-400",    bgColor: "bg-zinc-500/5 border-zinc-500/20",     description: "氛围一般，建议做好情绪管理" },
  rainy:         { icon: CloudRain,      label: "有雨",   color: "text-blue-400",    bgColor: "bg-blue-500/5 border-blue-500/20",     description: "可能遇到情绪波动，建议多共情" },
  stormy:        { icon: CloudLightning, label: "风暴",   color: "text-red-400",     bgColor: "bg-red-500/5 border-red-500/20",       description: "高风险对话，建议充分准备再进行" },
};

// ---- Prediction Engine ----

function predictEmotion(
  profile: PersonProfile,
  conversations: ConversationSession[],
): ForecastResult | null {
  const analyzed = conversations
    .filter((c) => c.analysis?.emotionCurve && c.analysis.emotionCurve.length >= 2)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (analyzed.length < 2) return null;

  const recent = analyzed.slice(0, Math.min(6, analyzed.length));
  const riskFactors: string[] = [];
  const positiveFactors: string[] = [];
  const tips: string[] = [];

  // ---- 1. Compute trajectory statistics ----
  const startEmotions: number[] = [];
  const endEmotions: number[] = [];
  const avgEmotions: number[] = [];
  const emotionDeltas: number[] = [];

  for (const c of recent) {
    const curve = c.analysis!.emotionCurve;
    const start = curve[0].otherEmotion;
    const end = curve[curve.length - 1].otherEmotion;
    const avg = curve.reduce((s, p) => s + p.otherEmotion, 0) / curve.length;
    startEmotions.push(start);
    endEmotions.push(end);
    avgEmotions.push(avg);
    emotionDeltas.push(end - start);
  }

  // ---- 2. Weighted moving average (recent data weighs more) ----
  const weights = recent.map((_, i) => Math.pow(0.7, i));
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const weightedStart = startEmotions.reduce((s, v, i) => s + v * weights[i], 0) / totalWeight;
  const weightedEnd = endEmotions.reduce((s, v, i) => s + v * weights[i], 0) / totalWeight;
  const weightedAvg = avgEmotions.reduce((s, v, i) => s + v * weights[i], 0) / totalWeight;
  const weightedDelta = emotionDeltas.reduce((s, v, i) => s + v * weights[i], 0) / totalWeight;

  // ---- 3. Predict next start & end ----
  // Start prediction: trend-adjusted last end emotion
  const predictedStart = weightedEnd + (weightedEnd - weightedStart) * 0.1;
  // End prediction: start + average delta trend
  const predictedEnd = predictedStart + weightedDelta * 0.8;

  // ---- 4. Risk analysis ----
  // Declining trend
  if (recent.length >= 3) {
    const earlyAvg = avgEmotions.slice(-2).reduce((a, b) => a + b, 0) / 2;
    const recentAvg = avgEmotions.slice(0, 2).reduce((a, b) => a + b, 0) / 2;
    if (recentAvg < earlyAvg - 0.15) {
      riskFactors.push("情绪呈下降趋势");
      tips.push("开场时多用积极肯定的语言，先稳定情绪再进入正题");
    }
  }

  // Volatility check
  const emotionVariance = avgEmotions.reduce((s, v) => s + Math.pow(v - weightedAvg, 2), 0) / avgEmotions.length;
  if (emotionVariance > 0.15) {
    riskFactors.push("情绪波动性较大");
    tips.push("对方情绪不稳定，避免敏感话题，保持对话节奏平缓");
  }

  // Negative ending pattern
  const negativeEndings = endEmotions.filter((e) => e < -0.1).length;
  if (negativeEndings >= recent.length * 0.5) {
    riskFactors.push("多次对话以消极情绪收尾");
    tips.push("注意在对话结束前引入积极话题，留下好印象");
  }

  // Positive factors
  if (weightedAvg > 0.2) {
    positiveFactors.push("整体情绪基调积极");
  }
  if (weightedDelta > 0.1) {
    positiveFactors.push("对话过程中情绪通常有所改善");
  }
  if (emotionVariance < 0.05) {
    positiveFactors.push("情绪稳定一致");
  }

  // Profile-specific tips
  const triggers = profile.communicationStyle?.triggerPoints;
  if (triggers?.length) {
    tips.push(`避开敏感点：${triggers.slice(0, 2).join("、")}`);
  }
  const strengths = profile.communicationStyle?.strengths;
  if (strengths?.length) {
    positiveFactors.push(`对方优势：${strengths.slice(0, 2).join("、")}`);
  }

  // Default tips if none generated
  if (tips.length === 0) {
    tips.push("保持积极开放的态度，关注对方的情绪变化");
  }

  // ---- 5. Weather level ----
  const forecastScore = (predictedStart + predictedEnd) / 2;
  let weatherLevel: ForecastResult["weatherLevel"];
  if (forecastScore > 0.3 && riskFactors.length === 0) weatherLevel = "sunny";
  else if (forecastScore > 0.1) weatherLevel = "partly_cloudy";
  else if (forecastScore > -0.1) weatherLevel = "cloudy";
  else if (forecastScore > -0.3) weatherLevel = "rainy";
  else weatherLevel = "stormy";

  // Adjust for risk factors
  if (riskFactors.length >= 2 && weatherLevel === "partly_cloudy") weatherLevel = "cloudy";
  if (riskFactors.length >= 2 && weatherLevel === "cloudy") weatherLevel = "rainy";

  // ---- 6. Overall trend ----
  let overallTrend: ForecastResult["overallTrend"] = "stable";
  if (recent.length >= 3) {
    const diff = avgEmotions[0] - avgEmotions[avgEmotions.length - 1];
    if (diff > 0.15) overallTrend = "improving";
    else if (diff < -0.15) overallTrend = "declining";
  }

  // ---- 7. Time-of-day recommendation ----
  let bestTimeSlot: string | undefined;
  const hourScores = new Map<number, number[]>();
  for (const c of analyzed) {
    const hour = new Date(c.createdAt).getHours();
    const bucket = Math.floor(hour / 4) * 4;
    const avg = c.analysis!.emotionCurve.reduce((s, p) => s + p.otherEmotion, 0) / c.analysis!.emotionCurve.length;
    const arr = hourScores.get(bucket) || [];
    arr.push(avg);
    hourScores.set(bucket, arr);
  }
  if (hourScores.size >= 2) {
    let bestBucket = -1;
    let bestAvg = -Infinity;
    for (const [bucket, scores] of hourScores) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avg > bestAvg) { bestAvg = avg; bestBucket = bucket; }
    }
    if (bestBucket >= 0) {
      bestTimeSlot = `${bestBucket}:00-${bestBucket + 4}:00`;
    }
  }

  return {
    predictedStart,
    predictedEnd,
    weatherLevel,
    confidence: recent.length >= 5 ? "high" : recent.length >= 3 ? "medium" : "low",
    riskFactors,
    positiveFactors,
    tips,
    overallTrend,
    bestTimeSlot,
    basedOn: recent.length,
  };
}

// ---- Component ----

interface Props {
  profile: PersonProfile;
  conversations: ConversationSession[];
}

export default function EmotionForecast({ profile, conversations }: Props) {
  const forecast = useMemo(
    () => predictEmotion(profile, conversations),
    [profile, conversations]
  );

  if (!forecast) return null;

  const weather = WEATHER_CONFIG[forecast.weatherLevel];
  const WeatherIcon = weather.icon;

  const TrendIcon = forecast.overallTrend === "improving" ? TrendingUp
    : forecast.overallTrend === "declining" ? TrendingDown
    : Minus;
  const trendColor = forecast.overallTrend === "improving" ? "text-emerald-400"
    : forecast.overallTrend === "declining" ? "text-red-400"
    : "text-zinc-500";

  return (
    <div className={cn("rounded-lg border p-3 space-y-3", weather.bgColor)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <WeatherIcon className={cn("h-5 w-5", weather.color)} />
          <div>
            <div className="flex items-center gap-1.5">
              <span className={cn("text-xs font-medium", weather.color)}>情绪预报: {weather.label}</span>
              <span className={cn("text-[8px] px-1.5 py-0.5 rounded",
                forecast.confidence === "high" ? "bg-emerald-500/10 text-emerald-400"
                  : forecast.confidence === "medium" ? "bg-amber-500/10 text-amber-400"
                  : "bg-zinc-500/10 text-zinc-400"
              )}>
                {forecast.confidence === "high" ? "高置信" : forecast.confidence === "medium" ? "中置信" : "低置信"}
              </span>
            </div>
            <p className="text-[9px] text-zinc-500 mt-0.5">{weather.description}</p>
          </div>
        </div>
        <div className={cn("flex items-center gap-1", trendColor)}>
          <TrendIcon className="h-3.5 w-3.5" />
          <span className="text-[9px]">{forecast.overallTrend === "improving" ? "好转中" : forecast.overallTrend === "declining" ? "下降中" : "平稳"}</span>
        </div>
      </div>

      {/* Prediction Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[9px] text-zinc-500">
          <span>预测情绪轨迹</span>
          <span>基于{forecast.basedOn}次对话</span>
        </div>
        <div className="relative h-6 rounded-full bg-zinc-800/50 overflow-hidden">
          {/* Gradient bar showing predicted trajectory */}
          <div className="absolute inset-0 flex items-center px-2">
            {/* Start marker */}
            <div
              className="absolute h-4 w-1 rounded-full bg-cyan-400"
              style={{ left: `${Math.max(5, Math.min(95, (forecast.predictedStart + 1) / 2 * 100))}%` }}
              title={`预测起始: ${forecast.predictedStart.toFixed(2)}`}
            />
            {/* End marker */}
            <div
              className="absolute h-4 w-1 rounded-full bg-violet-400"
              style={{ left: `${Math.max(5, Math.min(95, (forecast.predictedEnd + 1) / 2 * 100))}%` }}
              title={`预测结束: ${forecast.predictedEnd.toFixed(2)}`}
            />
            {/* Arrow showing direction */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 24" preserveAspectRatio="none">
              <line
                x1={Math.max(15, Math.min(285, (forecast.predictedStart + 1) / 2 * 300))}
                y1="12"
                x2={Math.max(15, Math.min(285, (forecast.predictedEnd + 1) / 2 * 300))}
                y2="12"
                stroke={forecast.predictedEnd >= forecast.predictedStart ? "#34d399" : "#f87171"}
                strokeWidth="1.5"
                strokeDasharray="4 3"
                opacity="0.6"
              />
            </svg>
          </div>
          {/* Scale labels */}
          <div className="absolute inset-x-0 bottom-0 flex justify-between px-2 text-[7px] text-zinc-700">
            <span>消极</span>
            <span>中性</span>
            <span>积极</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-[8px] text-zinc-600">
          <span className="flex items-center gap-1">
            <span className="w-2 h-0.5 rounded bg-cyan-400 inline-block" /> 预测起始
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-0.5 rounded bg-violet-400 inline-block" /> 预测结束
          </span>
        </div>
      </div>

      {/* Risk & Positive Factors */}
      <div className="grid grid-cols-2 gap-2">
        {forecast.riskFactors.length > 0 && (
          <div className="rounded bg-red-500/5 border border-red-500/10 p-2">
            <div className="flex items-center gap-1 mb-1">
              <AlertTriangle className="h-2.5 w-2.5 text-red-400" />
              <span className="text-[8px] font-medium text-red-400">风险因素</span>
            </div>
            {forecast.riskFactors.map((r, i) => (
              <p key={i} className="text-[9px] text-zinc-500">· {r}</p>
            ))}
          </div>
        )}
        {forecast.positiveFactors.length > 0 && (
          <div className="rounded bg-emerald-500/5 border border-emerald-500/10 p-2">
            <div className="flex items-center gap-1 mb-1">
              <Sun className="h-2.5 w-2.5 text-emerald-400" />
              <span className="text-[8px] font-medium text-emerald-400">积极因素</span>
            </div>
            {forecast.positiveFactors.map((r, i) => (
              <p key={i} className="text-[9px] text-zinc-500">· {r}</p>
            ))}
          </div>
        )}
      </div>

      {/* Preparation Tips */}
      {forecast.tips.length > 0 && (
        <div className="rounded bg-zinc-800/30 border border-zinc-700/50 p-2">
          <div className="flex items-center gap-1 mb-1">
            <Lightbulb className="h-2.5 w-2.5 text-amber-400" />
            <span className="text-[8px] font-medium text-amber-400">准备建议</span>
            {forecast.bestTimeSlot && (
              <span className="text-[8px] text-zinc-600 ml-auto">建议时段: {forecast.bestTimeSlot}</span>
            )}
          </div>
          {forecast.tips.map((t, i) => (
            <p key={i} className="text-[9px] text-zinc-400 leading-relaxed">• {t}</p>
          ))}
        </div>
      )}
    </div>
  );
}
