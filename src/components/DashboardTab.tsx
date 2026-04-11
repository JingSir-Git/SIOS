"use client";

import { useMemo, useEffect, useRef } from "react";
import {
  BarChart3,
  Users,
  MessageSquare,
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  Heart,
  Zap,
  Clock,
  Target,
  Fingerprint,
  Activity,
  AlertTriangle,
  AlertCircle,
  Info,
  ArrowRight,
  FileDown,
  Compass,
  Layers,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  CartesianGrid,
  ReferenceLine,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import type { DimensionKey } from "@/lib/types";
import { DIMENSION_LABELS, DIMENSION_KEYS } from "@/lib/types";
import { detectTrendAlerts, alertToToast, type TrendAlert } from "@/lib/trend-alerts";
import { exportDashboardReport } from "@/lib/export-report";

// ---- Stat Card ----

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  subtext,
  gradient,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  subtext?: string;
  gradient?: string;
}) {
  return (
    <div className={cn(
      "rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 flex items-start gap-3 relative overflow-hidden group hover:border-zinc-700 transition-all",
    )}>
      {gradient && (
        <div className={cn("absolute inset-0 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity", gradient)} />
      )}
      <div className={cn("rounded-lg p-2.5 relative", color)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="relative">
        <p className="text-2xl font-bold text-zinc-100 tracking-tight">{value}</p>
        <p className="text-[10px] text-zinc-500 mt-0.5 font-medium">{label}</p>
        {subtext && <p className="text-[9px] text-zinc-600 mt-0.5">{subtext}</p>}
      </div>
    </div>
  );
}

// ---- Main Component ----

export default function DashboardTab() {
  const { profiles, conversations, mbtiResults, eqScores, relationships, profileMemories, divinationRecords, moduleHistory, addToast, setActiveTab } = useAppStore();
  const toastPushedRef = useRef(false);

  // Trend alerts
  const alerts = useMemo(() => {
    return detectTrendAlerts(profiles, conversations, eqScores, profileMemories);
  }, [profiles, conversations, eqScores, profileMemories]);

  // Push critical/warning alerts as toasts (once per session)
  useEffect(() => {
    if (toastPushedRef.current || alerts.length === 0) return;
    toastPushedRef.current = true;
    const important = alerts.filter((a) => a.severity === "critical" || a.severity === "warning");
    // Push max 2 toasts to avoid flooding
    for (const alert of important.slice(0, 2)) {
      addToast(alertToToast(alert));
    }
  }, [alerts, addToast]);

  // Compute statistics
  const stats = useMemo(() => {
    const totalMessages = conversations.reduce((s, c) => s + c.messages.length, 0);
    const analyzedConvos = conversations.filter((c) => c.analysis);
    const totalProfiles = profiles.length;

    // Average EQ score
    const avgEQ = eqScores.length > 0
      ? Math.round(eqScores.reduce((s, e) => s + e.overallScore, 0) / eqScores.length)
      : 0;

    // Latest MBTI
    const latestMBTI = mbtiResults.length > 0 ? mbtiResults[0] : null;

    // Adaptive activity trend — use actual data range instead of fixed 4 weeks
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const allTimestamps = [
      ...conversations.map((c) => new Date(c.createdAt).getTime()),
      ...divinationRecords.map((r) => new Date(r.createdAt).getTime()),
    ].filter(Boolean);
    const earliest = allTimestamps.length > 0 ? Math.min(...allTimestamps) : now;
    const daysSpan = Math.max(1, Math.ceil((now - earliest) / dayMs));

    let weeklyData: { week: string; count: number; analyzed: number }[] = [];
    if (daysSpan <= 7) {
      // Show daily for first week
      for (let d = Math.min(daysSpan, 7) - 1; d >= 0; d--) {
        const start = now - (d + 1) * dayMs;
        const end = now - d * dayMs;
        const dayConvos = conversations.filter((c) => { const t = new Date(c.createdAt).getTime(); return t >= start && t < end; });
        const dayLabel = d === 0 ? "今天" : d === 1 ? "昨天" : `${d}天前`;
        weeklyData.push({ week: dayLabel, count: dayConvos.length, analyzed: dayConvos.filter((c) => c.analysis).length });
      }
    } else {
      // Show weekly
      const weeks = Math.min(Math.ceil(daysSpan / 7), 8);
      const weekMs = 7 * dayMs;
      for (let w = weeks - 1; w >= 0; w--) {
        const start = now - (w + 1) * weekMs;
        const end = now - w * weekMs;
        const weekConvos = conversations.filter((c) => { const t = new Date(c.createdAt).getTime(); return t >= start && t < end; });
        const weekLabel = w === 0 ? "本周" : w === 1 ? "上周" : `${w + 1}周前`;
        weeklyData.push({ week: weekLabel, count: weekConvos.length, analyzed: weekConvos.filter((c) => c.analysis).length });
      }
    }

    // EQ trend from conversation analysis (eqScores entries, or derive from analysis)
    const eqTrend = eqScores.slice(-8).map((e, i) => ({
      index: i + 1,
      score: e.overallScore,
      label: new Date(e.createdAt).toLocaleDateString("zh-CN", { month: "short", day: "numeric" }),
    }));

    // Divination stats
    const divinationCount = divinationRecords.length;
    const divinationByCategory: { name: string; count: number }[] = [];
    const catMap = new Map<string, number>();
    for (const r of divinationRecords) {
      catMap.set(r.categoryLabel, (catMap.get(r.categoryLabel) || 0) + 1);
    }
    catMap.forEach((count, name) => divinationByCategory.push({ name, count }));
    divinationByCategory.sort((a, b) => b.count - a.count);

    // Module usage breakdown
    const moduleUsage: { name: string; count: number; color: string }[] = [
      { name: "对话分析", count: conversations.length, color: "#60a5fa" },
      { name: "人物画像", count: profiles.length, color: "#a78bfa" },
      { name: "风水玄学", count: divinationCount, color: "#34d399" },
      { name: "AI记忆", count: profileMemories.length, color: "#f472b6" },
      { name: "EQ训练", count: eqScores.length, color: "#facc15" },
    ].filter((m) => m.count > 0);

    // Profile dimension averages (across all profiles)
    const dimAverages: { key: DimensionKey; label: string; avg: number }[] = DIMENSION_KEYS.map((key) => {
      const values = profiles.map((p) => p.dimensions[key]?.value ?? 50);
      const avg = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 50;
      return { key, label: DIMENSION_LABELS[key].zh, avg };
    });

    // Top active profiles (by conversation count)
    const profileActivity = profiles.map((p) => {
      const convCount = conversations.filter(
        (c) => c.linkedProfileId === p.id ||
          c.participants?.some((pp) => pp === p.name) ||
          c.title?.includes(p.name)
      ).length;
      return { name: p.name, count: convCount, id: p.id };
    }).sort((a, b) => b.count - a.count).slice(0, 5);

    // Sentiment scatter — each analyzed convo is a point (x = message index, y = avg emotion)
    const sentimentScatter: { x: number; y: number; label: string; sentiment: string }[] = [];
    const emotionValues: number[] = [];
    analyzedConvos.forEach((c, idx) => {
      const curve = c.analysis?.emotionCurve || [];
      if (curve.length === 0) return;
      const avg = curve.reduce((s, p) => s + p.otherEmotion, 0) / curve.length;
      emotionValues.push(avg);
      sentimentScatter.push({
        x: idx + 1,
        y: Math.round(avg * 100) / 100,
        label: c.title || `对话${idx + 1}`,
        sentiment: avg > 0.15 ? "positive" : avg < -0.15 ? "negative" : "neutral",
      });
    });

    // Sentiment distribution for violin-style
    const sentimentDist = {
      positive: emotionValues.filter(v => v > 0.15).length,
      neutral: emotionValues.filter(v => v >= -0.15 && v <= 0.15).length,
      negative: emotionValues.filter(v => v < -0.15).length,
      mean: emotionValues.length > 0 ? emotionValues.reduce((a, b) => a + b, 0) / emotionValues.length : 0,
      std: 0,
      ci95: [0, 0] as [number, number],
      n: emotionValues.length,
    };
    if (emotionValues.length > 1) {
      const mean = sentimentDist.mean;
      sentimentDist.std = Math.sqrt(emotionValues.reduce((s, v) => s + (v - mean) ** 2, 0) / (emotionValues.length - 1));
      const se = sentimentDist.std / Math.sqrt(emotionValues.length);
      sentimentDist.ci95 = [mean - 1.96 * se, mean + 1.96 * se];
    }

    // EQ trend with confidence band (rolling mean ± std)
    const eqTrendFull = eqScores.slice(-12).map((e, i) => {
      const window = eqScores.slice(Math.max(0, i - 2), i + 1);
      const scores = window.map(w => w.overallScore);
      const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
      const std = scores.length > 1 ? Math.sqrt(scores.reduce((s, v) => s + (v - mean) ** 2, 0) / (scores.length - 1)) : 5;
      return {
        index: i + 1,
        score: e.overallScore,
        mean: Math.round(mean * 10) / 10,
        upper: Math.min(100, Math.round((mean + std) * 10) / 10),
        lower: Math.max(0, Math.round((mean - std) * 10) / 10),
        label: new Date(e.createdAt).toLocaleDateString("zh-CN", { month: "short", day: "numeric" }),
      };
    });

    // Activity timeline scatter (days since first activity → message count that day)
    const activityScatter: { day: number; count: number; date: string; type: string }[] = [];
    const dayBuckets = new Map<number, { convo: number; div: number }>();
    const baseDay = earliest;
    for (const c of conversations) {
      const d = Math.floor((new Date(c.createdAt).getTime() - baseDay) / dayMs);
      const entry = dayBuckets.get(d) || { convo: 0, div: 0 };
      entry.convo++;
      dayBuckets.set(d, entry);
    }
    for (const r of divinationRecords) {
      const d = Math.floor((new Date(r.createdAt).getTime() - baseDay) / dayMs);
      const entry = dayBuckets.get(d) || { convo: 0, div: 0 };
      entry.div++;
      dayBuckets.set(d, entry);
    }
    dayBuckets.forEach((counts, day) => {
      const date = new Date(baseDay + day * dayMs).toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
      if (counts.convo > 0) activityScatter.push({ day, count: counts.convo, date, type: "对话" });
      if (counts.div > 0) activityScatter.push({ day, count: counts.div, date, type: "玄学" });
    });

    // Module usage proportional (for radar-like display instead of bars)
    const totalUsage = [conversations.length, profiles.length, divinationCount, profileMemories.length, eqScores.length].reduce((a, b) => a + b, 0) || 1;
    const moduleRadar = [
      { module: "对话分析", value: Math.round(conversations.length / totalUsage * 100), raw: conversations.length },
      { module: "人物画像", value: Math.round(profiles.length / totalUsage * 100), raw: profiles.length },
      { module: "风水玄学", value: Math.round(divinationCount / totalUsage * 100), raw: divinationCount },
      { module: "AI记忆", value: Math.round(profileMemories.length / totalUsage * 100), raw: profileMemories.length },
      { module: "EQ训练", value: Math.round(eqScores.length / totalUsage * 100), raw: eqScores.length },
    ];

    // Statistical summary
    const engagementRate = conversations.length > 0
      ? Math.round(analyzedConvos.length / conversations.length * 100)
      : 0;
    const avgMsgsPerConvo = conversations.length > 0
      ? Math.round(totalMessages / conversations.length * 10) / 10
      : 0;

    return {
      totalMessages,
      totalProfiles,
      analyzedCount: analyzedConvos.length,
      totalConversations: conversations.length,
      avgEQ,
      latestMBTI,
      weeklyData,
      eqTrend: eqTrendFull,
      dimAverages,
      profileActivity,
      sentimentScatter,
      sentimentDist,
      memoriesCount: profileMemories.length,
      relationshipsCount: relationships.length,
      divinationCount,
      divinationByCategory,
      moduleRadar,
      activityScatter,
      daysSpan,
      engagementRate,
      avgMsgsPerConvo,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profiles, conversations, mbtiResults, eqScores, relationships, profileMemories, divinationRecords, moduleHistory]);

  const isEmpty = stats.totalConversations === 0 && stats.totalProfiles === 0 && stats.divinationCount === 0;

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-zinc-800 px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-violet-400" />
            <div>
              <h1 className="text-lg font-semibold text-zinc-100">数据大盘</h1>
              <p className="text-xs text-zinc-500">全局数据概览与趋势分析</p>
            </div>
          </div>
          {!isEmpty && (
            <button
              onClick={() => {
                const alertsHtml = alerts.map((a) => {
                  const cls = a.severity === "critical" ? "alert-warning" : "alert-info";
                  return `<div class="alert-box ${cls}"><strong>${a.title}</strong> ${a.message}</div>`;
                }).join("");
                exportDashboardReport(profiles, conversations, eqScores, profileMemories, alertsHtml);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-200 hover:border-zinc-500 transition-colors"
            >
              <FileDown className="h-3.5 w-3.5" />
              导出报告
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
          {isEmpty ? (
            <div className="text-center py-20">
              <BarChart3 className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-sm text-zinc-500">暂无数据</p>
              <p className="text-xs text-zinc-600 mt-1">开始对话分析和创建人物画像后，数据将在此展示</p>
            </div>
          ) : (
            <>
              {/* Trend Alerts */}
              {alerts.length > 0 && (
                <div className="space-y-2">
                  {alerts.map((alert) => {
                    const iconMap: Record<TrendAlert["severity"], React.ElementType> = {
                      critical: AlertCircle,
                      warning: AlertTriangle,
                      info: Info,
                    };
                    const colorMap: Record<TrendAlert["severity"], string> = {
                      critical: "border-red-500/30 bg-red-500/5 text-red-400",
                      warning: "border-amber-500/30 bg-amber-500/5 text-amber-400",
                      info: "border-blue-500/30 bg-blue-500/5 text-blue-400",
                    };
                    const Icon = iconMap[alert.severity];
                    return (
                      <div
                        key={alert.id}
                        className={cn(
                          "flex items-start gap-3 rounded-xl border p-3",
                          colorMap[alert.severity]
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium">{alert.title}</p>
                          <p className="text-[10px] text-zinc-400 mt-0.5 leading-relaxed">{alert.message}</p>
                        </div>
                        {alert.actionTab && (
                          <button
                            onClick={() => setActiveTab(alert.actionTab!)}
                            className="shrink-0 flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors"
                          >
                            {alert.actionLabel} <ArrowRight className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ─── Statistical Summary Ribbon ─── */}
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {[
                  { label: "画像", val: stats.totalProfiles, unit: "人", c: "text-violet-400" },
                  { label: "对话", val: stats.totalConversations, unit: "段", c: "text-blue-400" },
                  { label: "消息", val: stats.totalMessages, unit: "条", c: "text-cyan-400" },
                  { label: "分析覆盖", val: `${stats.engagementRate}%`, unit: "", c: "text-emerald-400" },
                  { label: "均消息/对话", val: stats.avgMsgsPerConvo, unit: "", c: "text-amber-400" },
                  { label: "玄学", val: stats.divinationCount, unit: "次", c: "text-pink-400" },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg border border-zinc-800/60 bg-zinc-900/40 px-3 py-2.5 text-center">
                    <p className={cn("text-xl font-bold tracking-tight", s.c)}>{s.val}<span className="text-[9px] text-zinc-600 ml-0.5">{s.unit}</span></p>
                    <p className="text-[9px] text-zinc-600 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* ─── Row 1: Activity Scatter + EQ with Confidence Band ─── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Activity Timeline Scatter */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-blue-400" />
                      <h3 className="text-[11px] font-semibold text-zinc-300 tracking-wide">活动时间线</h3>
                    </div>
                    <span className="text-[8px] text-zinc-600 font-mono">n={stats.totalConversations + stats.divinationCount}</span>
                  </div>
                  <p className="text-[8px] text-zinc-600 mb-3 italic">散点大小 ∝ 当日活动频次</p>
                  {stats.activityScatter.length > 0 ? (
                    <ResponsiveContainer width="100%" height={170}>
                      <ScatterChart margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="day" type="number" tick={{ fontSize: 9, fill: "#52525b" }} axisLine={{ stroke: "#3f3f46" }} tickLine={false} name="天" label={{ value: "Day", position: "insideBottom", offset: -2, style: { fontSize: 8, fill: "#52525b" } }} />
                        <YAxis dataKey="count" type="number" tick={{ fontSize: 9, fill: "#52525b" }} axisLine={{ stroke: "#3f3f46" }} tickLine={false} allowDecimals={false} label={{ value: "Count", angle: -90, position: "insideLeft", style: { fontSize: 8, fill: "#52525b" } }} />
                        <Tooltip
                          contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px", fontSize: "10px" }}
                          formatter={(val: any, name: any) => [val, name]}
                          labelFormatter={(v) => `第${v}天`}
                        />
                        <Scatter name="对话" data={stats.activityScatter.filter(d => d.type === "对话")} fill="#60a5fa" opacity={0.7} />
                        <Scatter name="玄学" data={stats.activityScatter.filter(d => d.type === "玄学")} fill="#a78bfa" opacity={0.7} />
                        <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 9, color: "#71717a" }} />
                      </ScatterChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[170px] text-[10px] text-zinc-600">使用后生成活动时间线</div>
                  )}
                </div>

                {/* EQ Growth Curve with Confidence Band */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-emerald-400" />
                      <h3 className="text-[11px] font-semibold text-zinc-300 tracking-wide">EQ成长曲线</h3>
                      <span className="text-[7px] text-zinc-600 border border-zinc-700 rounded px-1">来自对话分析</span>
                    </div>
                    {stats.avgEQ > 0 && <span className="text-[9px] text-zinc-500 font-mono">μ={stats.avgEQ}</span>}
                  </div>
                  <p className="text-[8px] text-zinc-600 mb-3 italic">阴影区域 = 滚动±1σ置信带</p>
                  {stats.eqTrend.length >= 2 ? (
                    <ResponsiveContainer width="100%" height={170}>
                      <AreaChart data={stats.eqTrend} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                        <defs>
                          <linearGradient id="eqBand" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#34d399" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#34d399" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#52525b" }} axisLine={{ stroke: "#3f3f46" }} tickLine={false} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "#52525b" }} axisLine={{ stroke: "#3f3f46" }} tickLine={false} />
                        <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px", fontSize: "10px" }} formatter={(val: any, name: any) => [`${val}`, name === "score" ? "实际得分" : name === "upper" ? "上界(+1σ)" : "下界(-1σ)"]} />
                        <Area type="monotone" dataKey="upper" stroke="none" fill="url(#eqBand)" />
                        <Area type="monotone" dataKey="lower" stroke="none" fill="#18181b" />
                        <Line type="monotone" dataKey="score" stroke="#34d399" strokeWidth={2} dot={{ fill: "#34d399", r: 3 }} activeDot={{ r: 5 }} />
                        <Line type="monotone" dataKey="mean" stroke="#34d399" strokeWidth={1} strokeDasharray="4 4" dot={false} opacity={0.5} />
                        {stats.avgEQ > 0 && <ReferenceLine y={stats.avgEQ} stroke="#52525b" strokeDasharray="2 2" label={{ value: `μ=${stats.avgEQ}`, position: "right", style: { fontSize: 8, fill: "#52525b" } }} />}
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[170px] text-[10px] text-zinc-600">完成2次以上EQ训练后显示</div>
                  )}
                </div>
              </div>

              {/* ─── Row 2: Dimension Radar + Module Usage Radar ─── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Dimension Radar */}
                {stats.totalProfiles > 0 && (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Fingerprint className="h-4 w-4 text-amber-400" />
                        <h3 className="text-[11px] font-semibold text-zinc-300 tracking-wide">人物维度雷达</h3>
                      </div>
                      <span className="text-[8px] text-zinc-600 font-mono">n={stats.totalProfiles} profiles</span>
                    </div>
                    <p className="text-[8px] text-zinc-600 mb-2 italic">所有画像维度均值分布 (0-100)</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <RadarChart data={stats.dimAverages} cx="50%" cy="50%" outerRadius="75%">
                        <PolarGrid stroke="#3f3f46" />
                        <PolarAngleAxis dataKey="label" tick={{ fontSize: 8, fill: "#71717a" }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 7, fill: "#52525b" }} axisLine={false} />
                        <Radar name="均值" dataKey="avg" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} strokeWidth={1.5} dot={{ r: 2.5, fill: "#f59e0b" }} />
                        <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px", fontSize: "10px" }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Module Usage Radar */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-cyan-400" />
                      <h3 className="text-[11px] font-semibold text-zinc-300 tracking-wide">功能使用分布</h3>
                    </div>
                    <span className="text-[8px] text-zinc-600 font-mono">占比 %</span>
                  </div>
                  <p className="text-[8px] text-zinc-600 mb-2 italic">各模块使用占比雷达图</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={stats.moduleRadar} cx="50%" cy="50%" outerRadius="75%">
                      <PolarGrid stroke="#3f3f46" />
                      <PolarAngleAxis dataKey="module" tick={{ fontSize: 8, fill: "#71717a" }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar name="使用占比" dataKey="value" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.12} strokeWidth={1.5} dot={{ r: 2.5, fill: "#22d3ee" }} />
                      <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px", fontSize: "10px" }} formatter={(val: any, _: any, entry: any) => [`${val}% (${entry?.payload?.raw ?? 0}次)`, "使用占比"]} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ─── Row 3: Sentiment Scatter + Statistical Panel ─── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sentiment Emotion Scatter */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-pink-400" />
                      <h3 className="text-[11px] font-semibold text-zinc-300 tracking-wide">情绪散点图</h3>
                    </div>
                    <span className="text-[8px] text-zinc-600 font-mono">n={stats.sentimentDist.n}</span>
                  </div>
                  <p className="text-[8px] text-zinc-600 mb-3 italic">每段对话平均对方情绪值 (−1=消极, +1=积极)</p>
                  {stats.sentimentScatter.length > 0 ? (
                    <ResponsiveContainer width="100%" height={180}>
                      <ScatterChart margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="x" type="number" tick={{ fontSize: 9, fill: "#52525b" }} axisLine={{ stroke: "#3f3f46" }} tickLine={false} name="对话序号" />
                        <YAxis dataKey="y" type="number" domain={[-1, 1]} tick={{ fontSize: 9, fill: "#52525b" }} axisLine={{ stroke: "#3f3f46" }} tickLine={false} />
                        <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px", fontSize: "10px" }} formatter={(val: any) => [`${val}`, "情绪值"]} labelFormatter={(v) => `对话 #${v}`} />
                        <ReferenceLine y={0} stroke="#52525b" strokeDasharray="2 2" />
                        {stats.sentimentDist.n > 1 && (
                          <ReferenceLine y={stats.sentimentDist.mean} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: `μ=${stats.sentimentDist.mean.toFixed(2)}`, position: "right", style: { fontSize: 8, fill: "#f59e0b" } }} />
                        )}
                        <Scatter data={stats.sentimentScatter.filter(s => s.sentiment === "positive")} fill="#34d399" opacity={0.8} name="积极" />
                        <Scatter data={stats.sentimentScatter.filter(s => s.sentiment === "neutral")} fill="#a1a1aa" opacity={0.6} name="中性" />
                        <Scatter data={stats.sentimentScatter.filter(s => s.sentiment === "negative")} fill="#f87171" opacity={0.8} name="消极" />
                        <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 9 }} />
                      </ScatterChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[180px] text-[10px] text-zinc-600">完成对话分析后显示</div>
                  )}
                </div>

                {/* Statistical Insights Panel */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="h-4 w-4 text-violet-400" />
                    <h3 className="text-[11px] font-semibold text-zinc-300 tracking-wide">统计洞察</h3>
                    <span className="text-[7px] text-zinc-600 border border-zinc-700 rounded px-1">Statistical Summary</span>
                  </div>
                  <div className="space-y-3 text-[10px]">
                    {/* Engagement */}
                    <div className="rounded-lg border border-zinc-800/60 bg-zinc-800/20 p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-zinc-400 font-medium">分析覆盖率</span>
                        <span className="font-mono text-emerald-400">{stats.engagementRate}%</span>
                      </div>
                      <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
                        <div className="h-full rounded-full bg-emerald-500/60 transition-all" style={{ width: `${stats.engagementRate}%` }} />
                      </div>
                      <p className="text-[8px] text-zinc-600 mt-1">{stats.analyzedCount}/{stats.totalConversations} 段对话已分析</p>
                    </div>

                    {/* Sentiment CI */}
                    {stats.sentimentDist.n > 1 && (
                      <div className="rounded-lg border border-zinc-800/60 bg-zinc-800/20 p-3">
                        <p className="text-zinc-400 font-medium mb-1">情绪均值 95% CI</p>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-amber-400">{stats.sentimentDist.mean.toFixed(3)}</span>
                          <span className="text-zinc-600">±</span>
                          <span className="font-mono text-zinc-400">{stats.sentimentDist.std.toFixed(3)}</span>
                        </div>
                        <p className="text-[8px] text-zinc-600 mt-1">
                          CI: [{stats.sentimentDist.ci95[0].toFixed(3)}, {stats.sentimentDist.ci95[1].toFixed(3)}]
                          <span className="ml-1">| n={stats.sentimentDist.n}</span>
                        </p>
                        <p className="text-[8px] mt-1 italic" style={{ color: stats.sentimentDist.ci95[0] > 0 ? "#34d399" : stats.sentimentDist.ci95[1] < 0 ? "#f87171" : "#a1a1aa" }}>
                          {stats.sentimentDist.ci95[0] > 0 ? "✓ 显著积极倾向 (CI > 0)" : stats.sentimentDist.ci95[1] < 0 ? "⚠ 显著消极倾向 (CI < 0)" : "○ 无显著倾向 (CI 跨越0)"}
                        </p>
                      </div>
                    )}

                    {/* MBTI + EQ */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg border border-zinc-800/60 bg-zinc-800/20 p-3 text-center">
                        <p className="text-[8px] text-zinc-600 mb-1">MBTI</p>
                        <p className="text-lg font-bold text-violet-400">{stats.latestMBTI?.type || "—"}</p>
                        {stats.latestMBTI && <p className="text-[7px] text-zinc-600">{stats.latestMBTI.mode} · {stats.latestMBTI.questionCount}题</p>}
                      </div>
                      <div className="rounded-lg border border-zinc-800/60 bg-zinc-800/20 p-3 text-center">
                        <p className="text-[8px] text-zinc-600 mb-1">EQ均分</p>
                        <p className="text-lg font-bold text-emerald-400">{stats.avgEQ || "—"}</p>
                        <p className="text-[7px] text-zinc-600">n={eqScores.length} 次评估</p>
                      </div>
                    </div>

                    {/* Key metrics table */}
                    <div className="rounded-lg border border-zinc-800/60 bg-zinc-800/20 p-3">
                      <p className="text-zinc-400 font-medium mb-2">数据摘要</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[9px]">
                        <div className="flex justify-between"><span className="text-zinc-600">关系网络</span><span className="text-zinc-400 font-mono">{stats.relationshipsCount}</span></div>
                        <div className="flex justify-between"><span className="text-zinc-600">AI记忆</span><span className="text-zinc-400 font-mono">{stats.memoriesCount}</span></div>
                        <div className="flex justify-between"><span className="text-zinc-600">数据跨度</span><span className="text-zinc-400 font-mono">{stats.daysSpan}天</span></div>
                        <div className="flex justify-between"><span className="text-zinc-600">日均活动</span><span className="text-zinc-400 font-mono">{((stats.totalConversations + stats.divinationCount) / Math.max(1, stats.daysSpan)).toFixed(1)}</span></div>
                        {stats.divinationByCategory.length > 0 && (
                          <div className="flex justify-between col-span-2"><span className="text-zinc-600">最常用玄学</span><span className="text-zinc-400 font-mono">{stats.divinationByCategory[0].name} ({stats.divinationByCategory[0].count})</span></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── Row 4: Profile Activity Line + Weekly Trend Line ─── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Profile Activity Ranked (dot plot) */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="h-4 w-4 text-violet-400" />
                    <h3 className="text-[11px] font-semibold text-zinc-300 tracking-wide">最活跃人物</h3>
                    <span className="text-[8px] text-zinc-600 font-mono">Top {Math.min(5, stats.profileActivity.length)}</span>
                  </div>
                  {stats.profileActivity.length > 0 ? (
                    <div className="space-y-2">
                      {stats.profileActivity.map((p, i) => {
                        const maxC = stats.profileActivity[0]?.count || 1;
                        return (
                          <div key={p.id} className="flex items-center gap-2">
                            <span className="text-[9px] text-zinc-600 w-3 text-right font-mono">{i + 1}</span>
                            <span className="text-[10px] text-zinc-300 w-14 shrink-0 truncate">{p.name}</span>
                            <div className="flex-1 relative h-4">
                              <div className="absolute inset-y-0 left-0 right-0 flex items-center">
                                <div className="h-px w-full bg-zinc-800" />
                              </div>
                              <div className="absolute inset-y-0 flex items-center" style={{ left: `${(p.count / maxC) * 100}%` }}>
                                <div className="w-2.5 h-2.5 rounded-full bg-violet-500 shadow-sm shadow-violet-500/30" />
                              </div>
                            </div>
                            <span className="text-[9px] text-zinc-500 w-8 shrink-0 text-right font-mono">{p.count}次</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[100px] text-[10px] text-zinc-600">暂无画像</div>
                  )}
                </div>

                {/* Adaptive Weekly/Daily Trend Line */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-400" />
                      <h3 className="text-[11px] font-semibold text-zinc-300 tracking-wide">{stats.daysSpan <= 7 ? "近期活动折线" : "对话趋势折线"}</h3>
                    </div>
                    <span className="text-[8px] text-zinc-600 font-mono">{stats.daysSpan <= 7 ? "日" : "周"}粒度</span>
                  </div>
                  <p className="text-[8px] text-zinc-600 mb-3 italic">总对话 vs 已分析</p>
                  {stats.weeklyData.some((d) => d.count > 0) ? (
                    <ResponsiveContainer width="100%" height={150}>
                      <LineChart data={stats.weeklyData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="week" tick={{ fontSize: 9, fill: "#52525b" }} axisLine={{ stroke: "#3f3f46" }} tickLine={false} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 9, fill: "#52525b" }} axisLine={{ stroke: "#3f3f46" }} tickLine={false} />
                        <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px", fontSize: "10px" }} />
                        <Line type="monotone" dataKey="count" name="总对话" stroke="#60a5fa" strokeWidth={2} dot={{ r: 3, fill: "#60a5fa" }} />
                        <Line type="monotone" dataKey="analyzed" name="已分析" stroke="#8b5cf6" strokeWidth={1.5} strokeDasharray="4 4" dot={{ r: 2.5, fill: "#8b5cf6" }} />
                        <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 9 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[150px] text-[10px] text-zinc-600">暂无趋势数据</div>
                  )}
                </div>
              </div>

              {/* ─── Row 5: Dimension Detail Grid (sparkline-style) ─── */}
              {stats.totalProfiles > 0 && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Fingerprint className="h-4 w-4 text-amber-400" />
                      <h3 className="text-[11px] font-semibold text-zinc-300 tracking-wide">维度分布详情</h3>
                    </div>
                    <span className="text-[8px] text-zinc-600 font-mono">{stats.dimAverages.length} dimensions</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {stats.dimAverages.map((d) => {
                      const color = d.avg > 65 ? "#34d399" : d.avg < 35 ? "#f87171" : "#a1a1aa";
                      return (
                        <div key={d.key} className="rounded-lg border border-zinc-800/60 bg-zinc-800/20 p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] text-zinc-500">{d.label}</span>
                            <span className="text-sm font-bold font-mono" style={{ color }}>{d.avg}</span>
                          </div>
                          {/* Mini distribution bar with needle */}
                          <div className="relative h-2 rounded-full bg-zinc-800 mt-1">
                            <div className="absolute inset-0 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${d.avg}%`, background: `linear-gradient(to right, ${d.avg < 35 ? "#f87171" : "#3f3f46"}, ${color})`, opacity: 0.4 }} />
                            </div>
                            <div className="absolute top-[-1px] w-1 h-3 rounded-sm" style={{ left: `${d.avg}%`, transform: "translateX(-50%)", backgroundColor: color }} />
                          </div>
                          <div className="flex justify-between mt-1 text-[7px] text-zinc-700">
                            <span>0</span>
                            <span>50</span>
                            <span>100</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
