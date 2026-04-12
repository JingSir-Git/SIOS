"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Heart,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectProfile?: (profileId: string) => void;
}

interface ContactEmotionSummary {
  profileId: string;
  profileName: string;
  conversationCount: number;
  avgSelfEmotion: number;
  avgOtherEmotion: number;
  trend: "rising" | "falling" | "stable";
  trendMagnitude: number;
  lastConvoDate: string;
  healthScore: number; // 0-100 composite
  warningLevel: "healthy" | "attention" | "warning" | "critical";
}

function computeHealthScore(avgSelf: number, avgOther: number, trend: string, trendMag: number): number {
  // Base from average emotions (range -1..1 → 0..100)
  const selfScore = (avgSelf + 1) * 50;
  const otherScore = (avgOther + 1) * 50;
  const emotionBase = selfScore * 0.4 + otherScore * 0.4;

  // Trend bonus/penalty
  let trendFactor = 0;
  if (trend === "rising") trendFactor = trendMag * 20;
  else if (trend === "falling") trendFactor = -trendMag * 20;

  return Math.max(0, Math.min(100, emotionBase + trendFactor));
}

function getWarningLevel(score: number): "healthy" | "attention" | "warning" | "critical" {
  if (score >= 70) return "healthy";
  if (score >= 50) return "attention";
  if (score >= 30) return "warning";
  return "critical";
}

const WARNING_CONFIG = {
  healthy: { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", label: "健康" },
  attention: { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", label: "需关注" },
  warning: { color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20", label: "预警" },
  critical: { color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", label: "危险" },
};

export default function GlobalEmotionDashboard({ isOpen, onClose, onSelectProfile }: Props) {
  const { profiles, conversations, relationships } = useAppStore();
  const [sortBy, setSortBy] = useState<"health" | "recent" | "trend">("health");

  const summaries = useMemo(() => {
    const result: ContactEmotionSummary[] = [];

    for (const profile of profiles) {
      const linkedConvos = conversations.filter(
        (c) =>
          (c.linkedProfileId === profile.id ||
           c.participants?.some((p) => p === profile.name)) &&
          c.analysis?.emotionCurve &&
          c.analysis.emotionCurve.length > 0
      ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      if (linkedConvos.length === 0) continue;

      // Compute per-conversation averages
      const convoAvgs = linkedConvos.map((c) => {
        const curve = c.analysis!.emotionCurve;
        const avgSelf = curve.reduce((s, p) => s + p.selfEmotion, 0) / curve.length;
        const avgOther = curve.reduce((s, p) => s + p.otherEmotion, 0) / curve.length;
        return { avgSelf, avgOther, date: c.createdAt };
      });

      // Overall average
      const totalSelf = convoAvgs.reduce((s, c) => s + c.avgSelf, 0) / convoAvgs.length;
      const totalOther = convoAvgs.reduce((s, c) => s + c.avgOther, 0) / convoAvgs.length;

      // Trend: compare last 30% vs first 30%
      let trend: "rising" | "falling" | "stable" = "stable";
      let trendMagnitude = 0;
      if (convoAvgs.length >= 2) {
        const splitIdx = Math.max(1, Math.floor(convoAvgs.length * 0.3));
        const earlyAvg = convoAvgs.slice(0, splitIdx).reduce((s, c) => s + c.avgSelf, 0) / splitIdx;
        const lateAvg = convoAvgs.slice(-splitIdx).reduce((s, c) => s + c.avgSelf, 0) / splitIdx;
        const delta = lateAvg - earlyAvg;
        trendMagnitude = Math.abs(delta);
        if (delta > 0.1) trend = "rising";
        else if (delta < -0.1) trend = "falling";
      }

      const healthScore = computeHealthScore(totalSelf, totalOther, trend, trendMagnitude);

      result.push({
        profileId: profile.id,
        profileName: profile.name,
        conversationCount: linkedConvos.length,
        avgSelfEmotion: totalSelf,
        avgOtherEmotion: totalOther,
        trend,
        trendMagnitude,
        lastConvoDate: linkedConvos[linkedConvos.length - 1].createdAt,
        healthScore,
        warningLevel: getWarningLevel(healthScore),
      });
    }

    // Sort
    if (sortBy === "health") {
      result.sort((a, b) => a.healthScore - b.healthScore);
    } else if (sortBy === "recent") {
      result.sort((a, b) => new Date(b.lastConvoDate).getTime() - new Date(a.lastConvoDate).getTime());
    } else {
      result.sort((a, b) => b.trendMagnitude - a.trendMagnitude);
    }

    return result;
  }, [profiles, conversations, relationships, sortBy]);

  // Aggregate stats
  const stats = useMemo(() => {
    if (summaries.length === 0) return null;
    const healthy = summaries.filter((s) => s.warningLevel === "healthy").length;
    const attention = summaries.filter((s) => s.warningLevel === "attention").length;
    const warning = summaries.filter((s) => s.warningLevel === "warning").length;
    const critical = summaries.filter((s) => s.warningLevel === "critical").length;
    const avgHealth = summaries.reduce((s, c) => s + c.healthScore, 0) / summaries.length;
    const rising = summaries.filter((s) => s.trend === "rising").length;
    const falling = summaries.filter((s) => s.trend === "falling").length;
    return { healthy, attention, warning, critical, avgHealth, rising, falling, total: summaries.length };
  }, [summaries]);

  if (!isOpen) return null;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/95 overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-violet-400" />
          <h3 className="text-sm font-medium text-zinc-200">全局情绪仪表盘</h3>
          <span className="text-[10px] text-zinc-600">
            {summaries.length} 个有数据的联系人
          </span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="text-[10px] bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 text-zinc-400 focus:outline-none"
          >
            <option value="health">按健康度</option>
            <option value="recent">按最近互动</option>
            <option value="trend">按变化幅度</option>
          </select>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
        {stats ? (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-4 gap-2">
              <div className="rounded-lg bg-zinc-800/50 p-3 text-center">
                <p className="text-lg font-bold text-zinc-200">{stats.avgHealth.toFixed(0)}</p>
                <p className="text-[9px] text-zinc-500">平均健康度</p>
              </div>
              <div className="rounded-lg bg-zinc-800/50 p-3 text-center">
                <p className={cn("text-lg font-bold", stats.rising > stats.falling ? "text-emerald-400" : stats.falling > stats.rising ? "text-red-400" : "text-zinc-400")}>
                  {stats.rising > stats.falling ? `↑${stats.rising}` : stats.falling > stats.rising ? `↓${stats.falling}` : "—"}
                </p>
                <p className="text-[9px] text-zinc-500">趋势变化</p>
              </div>
              <div className="rounded-lg bg-zinc-800/50 p-3 text-center">
                <p className="text-lg font-bold text-emerald-400">{stats.healthy}</p>
                <p className="text-[9px] text-zinc-500">关系健康</p>
              </div>
              <div className="rounded-lg bg-zinc-800/50 p-3 text-center">
                <p className={cn("text-lg font-bold", (stats.warning + stats.critical) > 0 ? "text-red-400" : "text-zinc-600")}>
                  {stats.warning + stats.critical}
                </p>
                <p className="text-[9px] text-zinc-500">需要关注</p>
              </div>
            </div>

            {/* Distribution Bar */}
            <div className="rounded-lg bg-zinc-800/40 p-3">
              <p className="text-[10px] text-zinc-500 mb-1.5">关系健康度分布</p>
              <div className="flex h-3 rounded-full overflow-hidden gap-px">
                {stats.critical > 0 && (
                  <div
                    className="bg-red-500 rounded-sm transition-all"
                    style={{ width: `${(stats.critical / stats.total) * 100}%` }}
                    title={`危险: ${stats.critical}`}
                  />
                )}
                {stats.warning > 0 && (
                  <div
                    className="bg-orange-500 rounded-sm transition-all"
                    style={{ width: `${(stats.warning / stats.total) * 100}%` }}
                    title={`预警: ${stats.warning}`}
                  />
                )}
                {stats.attention > 0 && (
                  <div
                    className="bg-amber-500 rounded-sm transition-all"
                    style={{ width: `${(stats.attention / stats.total) * 100}%` }}
                    title={`需关注: ${stats.attention}`}
                  />
                )}
                {stats.healthy > 0 && (
                  <div
                    className="bg-emerald-500 rounded-sm transition-all"
                    style={{ width: `${(stats.healthy / stats.total) * 100}%` }}
                    title={`健康: ${stats.healthy}`}
                  />
                )}
              </div>
              <div className="flex justify-between mt-1 text-[8px] text-zinc-600">
                <span>危险 {stats.critical}</span>
                <span>预警 {stats.warning}</span>
                <span>关注 {stats.attention}</span>
                <span>健康 {stats.healthy}</span>
              </div>
            </div>

            {/* Contact List */}
            <div className="space-y-1.5">
              {summaries.map((s) => {
                const cfg = WARNING_CONFIG[s.warningLevel];
                return (
                  <button
                    key={s.profileId}
                    onClick={() => onSelectProfile?.(s.profileId)}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-zinc-800/70",
                      cfg.bg
                    )}
                  >
                    {/* Avatar */}
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-zinc-300 text-xs font-medium">
                      {s.profileName.charAt(0)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-zinc-200 truncate">{s.profileName}</span>
                        <span className={cn("text-[9px] px-1.5 py-0.5 rounded", cfg.bg, cfg.color)}>
                          {cfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-[9px] text-zinc-500">
                        <span>{s.conversationCount}次对话</span>
                        <span>
                          最近 {new Date(s.lastConvoDate).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })}
                        </span>
                      </div>
                    </div>

                    {/* Health Score */}
                    <div className="text-center shrink-0 w-12">
                      <p className={cn("text-sm font-bold", cfg.color)}>{s.healthScore.toFixed(0)}</p>
                      <p className="text-[8px] text-zinc-600">健康度</p>
                    </div>

                    {/* Trend */}
                    <div className="shrink-0 flex items-center gap-1">
                      {s.trend === "rising" ? (
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                      ) : s.trend === "falling" ? (
                        <TrendingDown className="h-3.5 w-3.5 text-red-400" />
                      ) : (
                        <Minus className="h-3.5 w-3.5 text-zinc-600" />
                      )}
                    </div>

                    {/* Emotion Needle Gauges */}
                    <div className="shrink-0 w-20 space-y-0.5">
                      <div className="flex items-center gap-1">
                        <span className="text-[7px] text-zinc-600 w-4">我</span>
                        <div className="relative flex-1 h-1.5 rounded-full bg-zinc-800">
                          <div className="absolute inset-0 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${((s.avgSelfEmotion + 1) / 2) * 100}%`, background: `linear-gradient(to right, #3f3f46, ${s.avgSelfEmotion >= 0 ? "#ef4444" : "#60a5fa"})`, opacity: 0.3 }} />
                          </div>
                          <div className="absolute top-[-1px] w-0.5 h-2.5 rounded-sm transition-all" style={{ left: `${((s.avgSelfEmotion + 1) / 2) * 100}%`, transform: "translateX(-50%)", backgroundColor: s.avgSelfEmotion >= 0 ? "#ef4444" : "#60a5fa" }} />
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[7px] text-zinc-600 w-4">对</span>
                        <div className="relative flex-1 h-1.5 rounded-full bg-zinc-800">
                          <div className="absolute inset-0 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${((s.avgOtherEmotion + 1) / 2) * 100}%`, background: `linear-gradient(to right, #3f3f46, ${s.avgOtherEmotion >= 0 ? "#ef4444" : "#60a5fa"})`, opacity: 0.3 }} />
                          </div>
                          <div className="absolute top-[-1px] w-0.5 h-2.5 rounded-sm transition-all" style={{ left: `${((s.avgOtherEmotion + 1) / 2) * 100}%`, transform: "translateX(-50%)", backgroundColor: s.avgOtherEmotion >= 0 ? "#ef4444" : "#60a5fa" }} />
                        </div>
                      </div>
                    </div>

                    <ChevronRight className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <BarChart3 className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
            <p className="text-xs text-zinc-500">暂无足够的情绪数据</p>
            <p className="text-[10px] text-zinc-600 mt-1">
              分析更多对话后，全局情绪趋势将在此展示
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
