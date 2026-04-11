"use client";

import { useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  ThermometerSun,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

interface TrendPoint {
  date: string;
  label: string;
  interactionCount: number;
  avgSentiment: number; // -1 to 1 mapped to 0-100
  cumulativeMessages: number;
}

interface ProfileTrend {
  profileId: string;
  profileName: string;
  trend: "warming" | "stable" | "cooling";
  trendScore: number; // -100 to 100
  dataPoints: TrendPoint[];
  totalConversations: number;
  avgInterval: number; // days between conversations
  recentSentiment: number;
}

function computeTrend(dataPoints: TrendPoint[]): { trend: "warming" | "stable" | "cooling"; score: number } {
  if (dataPoints.length < 2) return { trend: "stable", score: 0 };

  // Compare recent half vs older half
  const mid = Math.floor(dataPoints.length / 2);
  const olderHalf = dataPoints.slice(0, mid);
  const recentHalf = dataPoints.slice(mid);

  const olderAvgSentiment = olderHalf.reduce((s, p) => s + p.avgSentiment, 0) / olderHalf.length;
  const recentAvgSentiment = recentHalf.reduce((s, p) => s + p.avgSentiment, 0) / recentHalf.length;

  // Also factor in interaction frequency change
  const olderAvgCount = olderHalf.reduce((s, p) => s + p.interactionCount, 0) / olderHalf.length;
  const recentAvgCount = recentHalf.reduce((s, p) => s + p.interactionCount, 0) / recentHalf.length;

  const sentimentDelta = recentAvgSentiment - olderAvgSentiment;
  const frequencyDelta = olderAvgCount > 0 ? (recentAvgCount - olderAvgCount) / olderAvgCount : 0;

  // Combined score: 70% sentiment, 30% frequency
  const score = Math.round(sentimentDelta * 0.7 + frequencyDelta * 30);
  const clamped = Math.max(-100, Math.min(100, score));

  if (clamped > 10) return { trend: "warming", score: clamped };
  if (clamped < -10) return { trend: "cooling", score: clamped };
  return { trend: "stable", score: clamped };
}

const TREND_CONFIG = {
  warming: { icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", label: "升温中" },
  stable: { icon: Minus, color: "text-zinc-400", bg: "bg-zinc-500/10 border-zinc-500/20", label: "稳定" },
  cooling: { icon: TrendingDown, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", label: "降温中" },
};

export default function RelationshipTrends() {
  const { profiles, conversations } = useAppStore();

  const profileTrends = useMemo(() => {
    const trends: ProfileTrend[] = [];

    for (const profile of profiles) {
      const profileConvos = conversations
        .filter((c) => c.linkedProfileId === profile.id && c.analysis)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      if (profileConvos.length < 1) continue;

      // Group conversations by week for trend analysis
      const weekBuckets = new Map<string, { count: number; sentiments: number[]; messages: number }>();

      for (const convo of profileConvos) {
        const date = new Date(convo.createdAt);
        // Group by ISO week
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = weekStart.toISOString().slice(0, 10);

        const bucket = weekBuckets.get(weekKey) || { count: 0, sentiments: [], messages: 0 };
        bucket.count += 1;
        bucket.messages += convo.messages?.length || 0;

        // Extract sentiment from emotion curve if available
        const emotionCurve = convo.analysis?.emotionCurve;
        if (emotionCurve && emotionCurve.length > 0) {
          const avgEmotion = emotionCurve.reduce((s, e) => s + (e.selfEmotion + e.otherEmotion) / 2, 0) / emotionCurve.length;
          bucket.sentiments.push(avgEmotion);
        } else {
          bucket.sentiments.push(0);
        }

        weekBuckets.set(weekKey, bucket);
      }

      // Convert to data points
      let cumMessages = 0;
      const dataPoints: TrendPoint[] = [];

      for (const [weekKey, bucket] of Array.from(weekBuckets.entries()).sort()) {
        cumMessages += bucket.messages;
        const avgSentiment = bucket.sentiments.length > 0
          ? bucket.sentiments.reduce((a, b) => a + b, 0) / bucket.sentiments.length
          : 0;

        dataPoints.push({
          date: weekKey,
          label: new Date(weekKey).toLocaleDateString("zh-CN", { month: "short", day: "numeric" }),
          interactionCount: bucket.count,
          avgSentiment: Math.round((avgSentiment + 1) * 50), // map -1..1 to 0..100
          cumulativeMessages: cumMessages,
        });
      }

      // Compute trend
      const { trend, score } = computeTrend(dataPoints);

      // Compute average interval between conversations
      let avgInterval = 0;
      if (profileConvos.length >= 2) {
        const firstDate = new Date(profileConvos[0].createdAt).getTime();
        const lastDate = new Date(profileConvos[profileConvos.length - 1].createdAt).getTime();
        avgInterval = Math.round((lastDate - firstDate) / (profileConvos.length - 1) / (1000 * 60 * 60 * 24));
      }

      const lastSentiment = dataPoints.length > 0 ? dataPoints[dataPoints.length - 1].avgSentiment : 50;

      trends.push({
        profileId: profile.id,
        profileName: profile.name,
        trend,
        trendScore: score,
        dataPoints,
        totalConversations: profileConvos.length,
        avgInterval,
        recentSentiment: lastSentiment,
      });
    }

    // Sort: cooling first (needs attention), then warming, then stable
    const trendOrder = { cooling: 0, warming: 1, stable: 2 };
    trends.sort((a, b) => trendOrder[a.trend] - trendOrder[b.trend]);

    return trends;
  }, [profiles, conversations]);

  if (profileTrends.length === 0) return null;

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <ThermometerSun className="h-4 w-4 text-violet-400" />
        <h3 className="text-xs font-semibold text-zinc-200">
          关系温度趋势
        </h3>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300">
          {profileTrends.length}
        </span>
      </div>

      <div className="space-y-3">
        {profileTrends.slice(0, 6).map((pt) => {
          const config = TREND_CONFIG[pt.trend];
          const Icon = config.icon;

          return (
            <div
              key={pt.profileId}
              className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-3"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-zinc-200">
                    {pt.profileName}
                  </span>
                  <span
                    className={cn(
                      "flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded border",
                      config.bg,
                      config.color
                    )}
                  >
                    <Icon className="h-2.5 w-2.5" />
                    {config.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[9px] text-zinc-600">
                  <span>{pt.totalConversations} 次对话</span>
                  {pt.avgInterval > 0 && <span>平均 {pt.avgInterval} 天/次</span>}
                </div>
              </div>

              {/* Mini chart */}
              {pt.dataPoints.length >= 2 && (
                <div className="h-16 -mx-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={pt.dataPoints} margin={{ top: 2, right: 4, bottom: 0, left: 4 }}>
                      <defs>
                        <linearGradient id={`grad-${pt.profileId}`} x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="0%"
                            stopColor={pt.trend === "warming" ? "#10b981" : pt.trend === "cooling" ? "#3b82f6" : "#71717a"}
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="100%"
                            stopColor={pt.trend === "warming" ? "#10b981" : pt.trend === "cooling" ? "#3b82f6" : "#71717a"}
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="label" hide />
                      <YAxis domain={[0, 100]} hide />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#18181b",
                          border: "1px solid #3f3f46",
                          borderRadius: "8px",
                          fontSize: "10px",
                          padding: "6px 10px",
                        }}
                        labelStyle={{ color: "#a1a1aa", fontSize: "9px" }}
                        formatter={(value: unknown, name: unknown) => {
                          if (name === "avgSentiment") return [`${value}`, "情感温度"];
                          if (name === "interactionCount") return [`${value}`, "互动次数"];
                          return [`${value}`, `${name}`];
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="avgSentiment"
                        stroke={pt.trend === "warming" ? "#10b981" : pt.trend === "cooling" ? "#3b82f6" : "#71717a"}
                        strokeWidth={1.5}
                        fill={`url(#grad-${pt.profileId})`}
                        dot={false}
                        activeDot={{ r: 3, strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Single data point info */}
              {pt.dataPoints.length === 1 && (
                <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                  <Activity className="h-3 w-3" />
                  <span>仅1次记录（{pt.dataPoints[0].label}），情感温度 {pt.dataPoints[0].avgSentiment}/100</span>
                </div>
              )}

              {/* Sentiment needle gauge */}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[9px] text-zinc-600 shrink-0">情感温度</span>
                <div className="relative flex-1 h-1.5 rounded-full bg-zinc-800">
                  <div className="absolute inset-0 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pt.recentSentiment}%`,
                        background: `linear-gradient(to right, #3f3f46, ${pt.recentSentiment >= 65 ? "#34d399" : pt.recentSentiment >= 40 ? "#fbbf24" : "#60a5fa"})`,
                        opacity: 0.35,
                      }}
                    />
                  </div>
                  <div
                    className="absolute top-[-1px] w-0.5 h-2.5 rounded-sm transition-all duration-700"
                    style={{
                      left: `${pt.recentSentiment}%`,
                      transform: "translateX(-50%)",
                      backgroundColor: pt.recentSentiment >= 65 ? "#34d399" : pt.recentSentiment >= 40 ? "#fbbf24" : "#60a5fa",
                    }}
                  />
                </div>
                <span className={cn(
                  "text-[9px] font-mono font-medium",
                  pt.recentSentiment >= 65 ? "text-emerald-400" :
                  pt.recentSentiment >= 40 ? "text-amber-400" :
                  "text-blue-400"
                )}>
                  {pt.recentSentiment}
                </span>
              </div>
            </div>
          );
        })}

        {profileTrends.length > 6 && (
          <p className="text-[10px] text-zinc-600 text-center">
            还有 {profileTrends.length - 6} 个关系的趋势数据
          </p>
        )}
      </div>
    </div>
  );
}
