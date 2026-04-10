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
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
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
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  subtext?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 flex items-start gap-3">
      <div className={cn("rounded-lg p-2", color)}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-2xl font-bold text-zinc-100">{value}</p>
        <p className="text-[10px] text-zinc-500 mt-0.5">{label}</p>
        {subtext && <p className="text-[9px] text-zinc-600 mt-0.5">{subtext}</p>}
      </div>
    </div>
  );
}

// ---- Main Component ----

export default function DashboardTab() {
  const { profiles, conversations, mbtiResults, eqScores, relationships, profileMemories, addToast, setActiveTab } = useAppStore();
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

    // Conversation trend (last 4 weeks)
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const weeklyData: { week: string; count: number; analyzed: number }[] = [];
    for (let w = 3; w >= 0; w--) {
      const start = now - (w + 1) * weekMs;
      const end = now - w * weekMs;
      const weekConvos = conversations.filter((c) => {
        const t = new Date(c.createdAt).getTime();
        return t >= start && t < end;
      });
      const weekLabel = w === 0 ? "本周" : w === 1 ? "上周" : `${w + 1}周前`;
      weeklyData.push({
        week: weekLabel,
        count: weekConvos.length,
        analyzed: weekConvos.filter((c) => c.analysis).length,
      });
    }

    // EQ trend
    const eqTrend = eqScores.slice(-8).map((e, i) => ({
      index: i + 1,
      score: e.overallScore,
      label: new Date(e.createdAt).toLocaleDateString("zh-CN", { month: "short", day: "numeric" }),
    }));

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

    // Sentiment distribution
    const sentimentBuckets = { positive: 0, neutral: 0, negative: 0 };
    for (const c of analyzedConvos) {
      const curve = c.analysis?.emotionCurve || [];
      if (curve.length === 0) { sentimentBuckets.neutral++; continue; }
      const avg = curve.reduce((s, p) => s + p.otherEmotion, 0) / curve.length;
      if (avg > 0.15) sentimentBuckets.positive++;
      else if (avg < -0.15) sentimentBuckets.negative++;
      else sentimentBuckets.neutral++;
    }
    const sentimentData = [
      { name: "积极", value: sentimentBuckets.positive, color: "#34d399" },
      { name: "中性", value: sentimentBuckets.neutral, color: "#a1a1aa" },
      { name: "消极", value: sentimentBuckets.negative, color: "#f87171" },
    ].filter((d) => d.value > 0);

    return {
      totalMessages,
      totalProfiles,
      analyzedCount: analyzedConvos.length,
      totalConversations: conversations.length,
      avgEQ,
      latestMBTI,
      weeklyData,
      eqTrend,
      dimAverages,
      profileActivity,
      sentimentData,
      memoriesCount: profileMemories.length,
      relationshipsCount: relationships.length,
    };
  }, [profiles, conversations, mbtiResults, eqScores, relationships, profileMemories]);

  const isEmpty = stats.totalConversations === 0 && stats.totalProfiles === 0;

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

              {/* Stat Cards Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                  label="人物画像"
                  value={stats.totalProfiles}
                  icon={Users}
                  color="bg-violet-500/10 text-violet-400"
                  subtext={`${stats.relationshipsCount} 个关系`}
                />
                <StatCard
                  label="对话总数"
                  value={stats.totalConversations}
                  icon={MessageSquare}
                  color="bg-blue-500/10 text-blue-400"
                  subtext={`${stats.totalMessages} 条消息`}
                />
                <StatCard
                  label="已分析"
                  value={stats.analyzedCount}
                  icon={Brain}
                  color="bg-emerald-500/10 text-emerald-400"
                  subtext={stats.totalConversations > 0 ? `${Math.round(stats.analyzedCount / stats.totalConversations * 100)}% 覆盖率` : undefined}
                />
                <StatCard
                  label="AI记忆"
                  value={stats.memoriesCount}
                  icon={Zap}
                  color="bg-pink-500/10 text-pink-400"
                  subtext={stats.latestMBTI ? `MBTI: ${stats.latestMBTI.type}` : undefined}
                />
              </div>

              {/* Row 2: EQ + Weekly Activity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Weekly Conversation Trend */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity className="h-4 w-4 text-blue-400" />
                    <h3 className="text-xs font-medium text-zinc-300">近4周对话趋势</h3>
                  </div>
                  {stats.weeklyData.some((d) => d.count > 0) ? (
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={stats.weeklyData}>
                        <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#71717a" }} axisLine={false} tickLine={false} />
                        <YAxis hide allowDecimals={false} />
                        <Tooltip
                          contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px", fontSize: "11px" }}
                          labelStyle={{ color: "#a1a1aa" }}
                        />
                        <Bar dataKey="count" name="总对话" radius={[4, 4, 0, 0]} fill="#60a5fa" opacity={0.7} />
                        <Bar dataKey="analyzed" name="已分析" radius={[4, 4, 0, 0]} fill="#8b5cf6" opacity={0.8} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[160px] text-[10px] text-zinc-600">
                      暂无近期对话数据
                    </div>
                  )}
                </div>

                {/* EQ Score Trend */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="h-4 w-4 text-emerald-400" />
                    <h3 className="text-xs font-medium text-zinc-300">EQ成长曲线</h3>
                    {stats.avgEQ > 0 && (
                      <span className="text-[9px] text-zinc-600 ml-auto">平均 {stats.avgEQ} 分</span>
                    )}
                  </div>
                  {stats.eqTrend.length >= 2 ? (
                    <ResponsiveContainer width="100%" height={160}>
                      <AreaChart data={stats.eqTrend}>
                        <defs>
                          <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#71717a" }} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 100]} hide />
                        <Tooltip
                          contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px", fontSize: "11px" }}
                          formatter={(val) => [`${val}分`, "EQ得分"]}
                        />
                        <Area type="monotone" dataKey="score" stroke="#34d399" fill="url(#eqGrad)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[160px] text-[10px] text-zinc-600">
                      完成2次以上EQ训练后显示成长趋势
                    </div>
                  )}
                </div>
              </div>

              {/* Row 3: Profile Activity + Sentiment Distribution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Top Active Profiles */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="h-4 w-4 text-violet-400" />
                    <h3 className="text-xs font-medium text-zinc-300">最活跃人物 Top 5</h3>
                  </div>
                  {stats.profileActivity.length > 0 ? (
                    <div className="space-y-2.5">
                      {stats.profileActivity.map((p, i) => {
                        const maxCount = stats.profileActivity[0]?.count || 1;
                        const barWidth = Math.max(8, (p.count / maxCount) * 100);
                        return (
                          <div key={p.id} className="flex items-center gap-3">
                            <span className="text-[10px] text-zinc-600 w-4 text-right shrink-0">{i + 1}</span>
                            <span className="text-[11px] text-zinc-300 w-16 shrink-0 truncate">{p.name}</span>
                            <div className="flex-1 h-3 rounded-full bg-zinc-800 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-violet-500/60 to-pink-500/60"
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-zinc-500 w-8 shrink-0 text-right">{p.count}次</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[120px] text-[10px] text-zinc-600">
                      暂无画像数据
                    </div>
                  )}
                </div>

                {/* Sentiment Distribution */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Heart className="h-4 w-4 text-pink-400" />
                    <h3 className="text-xs font-medium text-zinc-300">对话情绪分布</h3>
                  </div>
                  {stats.sentimentData.length > 0 ? (
                    <div className="flex items-center gap-6">
                      <ResponsiveContainer width={120} height={120}>
                        <PieChart>
                          <Pie
                            data={stats.sentimentData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={30}
                            outerRadius={50}
                            strokeWidth={0}
                          >
                            {stats.sentimentData.map((d, i) => (
                              <Cell key={i} fill={d.color} opacity={0.7} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-2">
                        {stats.sentimentData.map((d) => (
                          <div key={d.name} className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                            <span className="text-[10px] text-zinc-400">{d.name}</span>
                            <span className="text-[10px] text-zinc-300 font-medium">{d.value}次</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[120px] text-[10px] text-zinc-600">
                      完成对话分析后显示情绪分布
                    </div>
                  )}
                </div>
              </div>

              {/* Row 4: Dimension Heatmap */}
              {stats.totalProfiles > 0 && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Fingerprint className="h-4 w-4 text-amber-400" />
                    <h3 className="text-xs font-medium text-zinc-300">人物维度均值概览</h3>
                    <span className="text-[9px] text-zinc-600 ml-auto">基于 {stats.totalProfiles} 个画像</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {stats.dimAverages.map((d) => {
                      const barColor = d.avg > 65 ? "bg-emerald-500/60" : d.avg < 35 ? "bg-red-500/60" : "bg-zinc-500/60";
                      return (
                        <div key={d.key} className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-3 text-center">
                          <p className="text-lg font-bold text-zinc-200">{d.avg}</p>
                          <div className="h-1.5 rounded-full bg-zinc-800 mt-1.5 overflow-hidden">
                            <div className={cn("h-full rounded-full", barColor)} style={{ width: `${d.avg}%` }} />
                          </div>
                          <p className="text-[9px] text-zinc-500 mt-1.5">{d.label}</p>
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
