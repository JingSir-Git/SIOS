"use client";

import { useMemo, useEffect, useRef, useState, useCallback } from "react";
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
  Fingerprint,
  Activity,
  AlertTriangle,
  AlertCircle,
  Info,
  ArrowRight,
  FileDown,
  Compass,
  Layers,
  Sparkles,
  Loader2,
  CalendarDays,
} from "lucide-react";
import {
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
import DimensionCorrelation from "./DimensionCorrelation";
import { useAppStore } from "@/lib/store";
import type { DimensionKey } from "@/lib/types";
import { DIMENSION_LABELS, DIMENSION_KEYS } from "@/lib/types";
import { detectTrendAlerts, alertToToast, type TrendAlert } from "@/lib/trend-alerts";
import { exportDashboardReport } from "@/lib/export-report";
import { apiFetch } from "@/lib/api-fetch";
import { useT, getAILanguageInstruction } from "@/lib/i18n";
import ShareCard from "./ShareCard";
import { Share2 } from "lucide-react";

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
  const storeState = useAppStore();
  const { profiles = [], conversations = [], mbtiResults = [], eqScores = [], relationships = [], profileMemories = [], divinationRecords = [], moduleHistory = {}, chatSessions = [], responseFeedback = [], addToast, setActiveTab, language } = storeState;
  const t = useT();
  const toastPushedRef = useRef(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);

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
        const dayLabel = d === 0 ? (language === "en" ? "Today" : "今天") : d === 1 ? (language === "en" ? "Yesterday" : "昨天") : (language === "en" ? `${d}d ago` : `${d}天前`);
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
        const weekLabel = w === 0 ? (language === "en" ? "This wk" : "本周") : w === 1 ? (language === "en" ? "Last wk" : "上周") : (language === "en" ? `${w + 1}wk ago` : `${w + 1}周前`);
        weeklyData.push({ week: weekLabel, count: weekConvos.length, analyzed: weekConvos.filter((c) => c.analysis).length });
      }
    }

    // EQ trend from conversation analysis (eqScores entries, or derive from analysis)
    const eqTrend = eqScores.slice(-8).map((e, i) => ({
      index: i + 1,
      score: e.overallScore,
      label: new Date(e.createdAt).toLocaleDateString(language === "en" ? "en-US" : "zh-CN", { month: "short", day: "numeric" }),
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

    // Chat session stats
    const chatSessionCount = chatSessions.length;
    const chatMessageTotal = chatSessions.reduce((s, cs) => s + cs.messages.length, 0);
    const feedbackTotal = responseFeedback.length;
    const feedbackUpCount = responseFeedback.filter((f) => f.rating === "up").length;
    const feedbackDownCount = responseFeedback.filter((f) => f.rating === "down").length;
    const feedbackPositiveRate = feedbackTotal > 0 ? Math.round(feedbackUpCount / feedbackTotal * 100) : 0;

    // Module usage breakdown
    const moduleNames = language === "en"
      ? ["Analysis", "Profiles", "Divination", "AI Memory", "EQ", "Chat"]
      : ["对话分析", "人物画像", "风水玄学", "AI记忆", "EQ训练", "咨询会话"];
    const moduleUsage: { name: string; count: number; color: string }[] = [
      { name: moduleNames[0], count: conversations.length, color: "#60a5fa" },
      { name: moduleNames[1], count: profiles.length, color: "#a78bfa" },
      { name: moduleNames[2], count: divinationCount, color: "#34d399" },
      { name: moduleNames[3], count: profileMemories.length, color: "#f472b6" },
      { name: moduleNames[4], count: eqScores.length, color: "#facc15" },
      { name: moduleNames[5], count: chatSessionCount, color: "#38bdf8" },
    ];

    // Profile dimension averages (across all profiles)
    const dimAverages: { key: DimensionKey; label: string; avg: number }[] = DIMENSION_KEYS.map((key) => {
      const values = profiles.map((p) => p.dimensions[key]?.value ?? 50);
      const avg = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 50;
      return { key, label: language === "en" ? (DIMENSION_LABELS[key].en ?? DIMENSION_LABELS[key].zh) : DIMENSION_LABELS[key].zh, avg };
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
        label: c.title || `${language === "en" ? "Convo" : "对话"}${idx + 1}`,
        sentiment: avg > 0.15 ? "positive" : avg < -0.15 ? "negative" : "neutral",
      });
    });

    // Sentiment distribution with box-plot quartiles
    const sorted = [...emotionValues].sort((a, b) => a - b);
    const q = (arr: number[], p: number) => {
      if (arr.length === 0) return 0;
      const i = (arr.length - 1) * p;
      const lo = Math.floor(i), hi = Math.ceil(i);
      return lo === hi ? arr[lo] : arr[lo] * (hi - i) + arr[hi] * (i - lo);
    };
    const sentimentDist = {
      positive: emotionValues.filter(v => v > 0.15).length,
      neutral: emotionValues.filter(v => v >= -0.15 && v <= 0.15).length,
      negative: emotionValues.filter(v => v < -0.15).length,
      mean: emotionValues.length > 0 ? emotionValues.reduce((a, b) => a + b, 0) / emotionValues.length : 0,
      std: 0,
      ci95: [0, 0] as [number, number],
      n: emotionValues.length,
      min: sorted[0] ?? -1,
      max: sorted[sorted.length - 1] ?? 1,
      q1: q(sorted, 0.25),
      median: q(sorted, 0.5),
      q3: q(sorted, 0.75),
      rawValues: emotionValues,
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
        label: new Date(e.createdAt).toLocaleDateString(language === "en" ? "en-US" : "zh-CN", { month: "short", day: "numeric" }),
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
      const date = new Date(baseDay + day * dayMs).toLocaleDateString(language === "en" ? "en-US" : "zh-CN", { month: "short", day: "numeric" });
      if (counts.convo > 0) activityScatter.push({ day, count: counts.convo, date, type: language === "en" ? "Convo" : "对话" });
      if (counts.div > 0) activityScatter.push({ day, count: counts.div, date, type: language === "en" ? "Mystic" : "玄学" });
    });

    // Module usage proportional (for radar-like display instead of bars)
    const totalUsage = [conversations.length, profiles.length, divinationCount, profileMemories.length, eqScores.length, chatSessionCount].reduce((a, b) => a + b, 0) || 1;
    const moduleRadar = [
      { module: moduleNames[0], value: Math.round(conversations.length / totalUsage * 100), raw: conversations.length },
      { module: moduleNames[1], value: Math.round(profiles.length / totalUsage * 100), raw: profiles.length },
      { module: moduleNames[2], value: Math.round(divinationCount / totalUsage * 100), raw: divinationCount },
      { module: moduleNames[3], value: Math.round(profileMemories.length / totalUsage * 100), raw: profileMemories.length },
      { module: moduleNames[4], value: Math.round(eqScores.length / totalUsage * 100), raw: eqScores.length },
      { module: moduleNames[5], value: Math.round(chatSessionCount / totalUsage * 100), raw: chatSessionCount },
    ];

    // Statistical summary
    const engagementRate = conversations.length > 0
      ? Math.round(analyzedConvos.length / conversations.length * 100)
      : 0;
    const avgMsgsPerConvo = conversations.length > 0
      ? Math.round(totalMessages / conversations.length * 10) / 10
      : 0;

    // GitHub-style heatmap: last 16 weeks (112 days)
    const heatmapDays = 112;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const heatmapStart = new Date(today.getTime() - (heatmapDays - 1) * dayMs);
    // Align to Sunday
    heatmapStart.setDate(heatmapStart.getDate() - heatmapStart.getDay());
    const heatmap: { date: string; count: number; iso: string }[] = [];
    const heatmapBuckets = new Map<string, number>();
    for (const c of conversations) {
      const d = new Date(c.createdAt);
      d.setHours(0, 0, 0, 0);
      const key = d.toISOString().slice(0, 10);
      heatmapBuckets.set(key, (heatmapBuckets.get(key) || 0) + 1);
    }
    for (const r of divinationRecords) {
      const d = new Date(r.createdAt);
      d.setHours(0, 0, 0, 0);
      const key = d.toISOString().slice(0, 10);
      heatmapBuckets.set(key, (heatmapBuckets.get(key) || 0) + 1);
    }
    for (const s of chatSessions) {
      const d = new Date(s.createdAt);
      d.setHours(0, 0, 0, 0);
      const key = d.toISOString().slice(0, 10);
      heatmapBuckets.set(key, (heatmapBuckets.get(key) || 0) + 1);
    }
    const totalHeatmapDays = Math.ceil((today.getTime() - heatmapStart.getTime()) / dayMs) + 1;
    for (let i = 0; i < totalHeatmapDays; i++) {
      const d = new Date(heatmapStart.getTime() + i * dayMs);
      const iso = d.toISOString().slice(0, 10);
      heatmap.push({ date: d.toLocaleDateString(language === "en" ? "en-US" : "zh-CN", { month: "short", day: "numeric" }), count: heatmapBuckets.get(iso) || 0, iso });
    }
    const heatmapMax = Math.max(1, ...heatmap.map(h => h.count));

    // Conversation length distribution (buckets: 1-5, 6-10, 11-20, 21-50, 50+)
    const lengthBuckets = [
      { label: "1-5", min: 1, max: 5, count: 0, color: "#60a5fa" },
      { label: "6-10", min: 6, max: 10, count: 0, color: "#8b5cf6" },
      { label: "11-20", min: 11, max: 20, count: 0, color: "#f59e0b" },
      { label: "21-50", min: 21, max: 50, count: 0, color: "#34d399" },
      { label: "50+", min: 51, max: Infinity, count: 0, color: "#f472b6" },
    ];
    for (const c of conversations) {
      const len = c.messages.length;
      const bucket = lengthBuckets.find(b => len >= b.min && len <= b.max);
      if (bucket) bucket.count++;
    }

    // Module usage donut data
    const moduleDonut = moduleUsage.filter(m => m.count > 0);
    const moduleTotal = moduleDonut.reduce((s, m) => s + m.count, 0) || 1;

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
      heatmap,
      heatmapMax,
      chatSessionCount,
      chatMessageTotal,
      feedbackTotal,
      feedbackUpCount,
      feedbackDownCount,
      feedbackPositiveRate,
      lengthBuckets,
      moduleDonut,
      moduleTotal,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profiles, conversations, mbtiResults, eqScores, relationships, profileMemories, divinationRecords, moduleHistory, chatSessions, responseFeedback, language]);

  // AI Insight generator — SSE streaming with typewriter effect
  const generateInsight = useCallback(async () => {
    if (insightLoading) return;
    setInsightLoading(true);
    setAiInsight("");
    try {
      const snapshot = [
        `总对话: ${stats.totalConversations}, 已分析: ${stats.analyzedCount}, 覆盖率: ${stats.engagementRate}%`,
        `人物画像: ${stats.totalProfiles}, 总消息: ${stats.totalMessages}`,
        `EQ均分: ${stats.avgEQ || "无"}, EQ次数: ${eqScores.length}`,
        `MBTI: ${stats.latestMBTI?.type || "无"}`,
        stats.sentimentDist.n > 0 ? `情绪分布: μ=${stats.sentimentDist.mean.toFixed(2)}, σ=${stats.sentimentDist.std.toFixed(2)}, 95%CI=[${stats.sentimentDist.ci95.map((v: number) => v.toFixed(2)).join(",")}], n=${stats.sentimentDist.n}` : "",
        `占卜: ${stats.divinationCount}次`,
        `咨询会话: ${stats.chatSessionCount}次, 会话消息: ${stats.chatMessageTotal}条`,
        stats.feedbackTotal > 0 ? `反馈: ${stats.feedbackTotal}条, 好评率: ${stats.feedbackPositiveRate}%` : "",
        `活跃天数: ${stats.daysSpan}, 日均对话: ${stats.avgMsgsPerConvo}条/对话`,
        `画像维度均值: ${stats.dimAverages.map((d: any) => `${d.label}=${d.avg}`).join(", ")}`,
        stats.profileActivity.length > 0 ? `最活跃: ${stats.profileActivity.slice(0, 3).map((p: any) => `${p.name}(${p.count}次)`).join(", ")}` : "",
      ].filter(Boolean).join("\n");

      const languageInstruction = getAILanguageInstruction(language);
      const res = await apiFetch("/api/dashboard-insight?stream=true", {
        method: "POST",
        body: JSON.stringify({ statsSnapshot: snapshot, languageInstruction }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "请求失败" }));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream reader");
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        const lines = text.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === "chunk" && event.text) {
              accumulated += event.text;
              setAiInsight(accumulated);
            } else if (event.type === "error") {
              throw new Error(event.text || "流式错误");
            }
          } catch (parseErr) {
            if (parseErr instanceof Error && parseErr.message !== "流式错误") continue;
            throw parseErr;
          }
        }
      }
      if (!accumulated) setAiInsight(t.dashboard.noContent);
    } catch (e: any) {
      setAiInsight((prev) => prev ? prev + `\n\n⚠ ${e.message}` : `${t.dashboard.insightFailed}: ${e.message || "Unknown"}`);
    } finally {
      setInsightLoading(false);
    }
  }, [stats, eqScores.length, insightLoading]);

  const isEmpty = stats.totalConversations === 0 && stats.totalProfiles === 0 && stats.divinationCount === 0 && stats.chatSessionCount === 0;

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-zinc-800 px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 shadow-lg shadow-violet-500/10">
              <BarChart3 className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-zinc-100">{t.dashboard.title}</h1>
              <p className="text-[10px] text-zinc-500">{t.dashboard.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEmpty && (<>
              <button
                onClick={() => {
                  const alertsHtml = alerts.map((a) => {
                    const cls = a.severity === "critical" ? "alert-warning" : "alert-info";
                    return `<div class="alert-box ${cls}"><strong>${a.title}</strong> ${a.message}</div>`;
                  }).join("");
                  exportDashboardReport(profiles, conversations, eqScores, profileMemories, alertsHtml);
                }}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-200 hover:border-zinc-500 transition-colors"
                title={t.dashboard.exportPDF}
              >
                <FileDown className="h-3.5 w-3.5" />
                PDF
              </button>
              <button
                onClick={() => {
                  const exportData = {
                    exportedAt: new Date().toISOString(),
                    version: "SIOS-v1",
                    stats: {
                      totalConversations: stats.totalConversations,
                      analyzedCount: stats.analyzedCount,
                      totalProfiles: stats.totalProfiles,
                      totalMessages: stats.totalMessages,
                      avgEQ: stats.avgEQ,
                      engagementRate: stats.engagementRate,
                      avgMsgsPerConvo: stats.avgMsgsPerConvo,
                      daysSpan: stats.daysSpan,
                      memoriesCount: stats.memoriesCount,
                      relationshipsCount: stats.relationshipsCount,
                      divinationCount: stats.divinationCount,
                      chatSessionCount: stats.chatSessionCount,
                      chatMessageTotal: stats.chatMessageTotal,
                      feedbackTotal: stats.feedbackTotal,
                      feedbackPositiveRate: stats.feedbackPositiveRate,
                      sentimentDist: {
                        mean: stats.sentimentDist.mean,
                        std: stats.sentimentDist.std,
                        ci95: stats.sentimentDist.ci95,
                        n: stats.sentimentDist.n,
                        min: stats.sentimentDist.min,
                        max: stats.sentimentDist.max,
                        q1: stats.sentimentDist.q1,
                        median: stats.sentimentDist.median,
                        q3: stats.sentimentDist.q3,
                      },
                      dimAverages: stats.dimAverages,
                      profileActivity: stats.profileActivity,
                      eqTrend: stats.eqTrend,
                      weeklyData: stats.weeklyData,
                      moduleRadar: stats.moduleRadar,
                    },
                    aiInsight: aiInsight || null,
                  };
                  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `sios-dashboard-${new Date().toISOString().slice(0, 10)}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-200 hover:border-zinc-500 transition-colors"
                title={t.dashboard.exportJSON}
              >
                <FileDown className="h-3.5 w-3.5" />
                JSON
              </button>
              <button
                onClick={() => setShowShareCard(true)}
                className="flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-600/10 px-3 py-1.5 text-xs text-violet-400 hover:bg-violet-600/20 hover:border-violet-500/50 transition-colors"
                title={language === "en" ? "Share Journey" : "分享旅程"}
              >
                <Share2 className="h-3.5 w-3.5" />
                {language === "en" ? "Share" : "分享"}
              </button>
            </>)}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
          {isEmpty && (
            <div className="rounded-xl border border-dashed border-violet-500/30 bg-gradient-to-br from-violet-500/5 via-transparent to-blue-500/5 p-6">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 shrink-0">
                  <Compass className="h-6 w-6 text-violet-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-zinc-200 mb-1">{language === "en" ? "Welcome to Your Data Dashboard" : "欢迎来到你的数据大盘"}</h3>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    {language === "en"
                      ? "Start by analyzing conversations, creating profiles, or exploring other modules. Your data will populate these charts in real time."
                      : "开始分析对话、创建人物画像或探索其他功能模块后，下方图表将实时展示你的数据洞察。当前所有图表已就绪，等待数据注入。"}
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    <button onClick={() => setActiveTab("analyze")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/20 text-violet-400 border border-violet-500/30 text-[10px] font-medium hover:bg-violet-600/30 transition-colors">
                      <MessageSquare className="h-3 w-3" /> {language === "en" ? "Analyze Chat" : "分析对话"}
                    </button>
                    <button onClick={() => setActiveTab("profiles")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 border border-zinc-700 text-[10px] font-medium hover:text-zinc-200 hover:border-zinc-600 transition-colors">
                      <Users className="h-3 w-3" /> {language === "en" ? "Create Profile" : "创建画像"}
                    </button>
                    <button onClick={() => setActiveTab("divination")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 border border-zinc-700 text-[10px] font-medium hover:text-zinc-200 hover:border-zinc-600 transition-colors">
                      <Sparkles className="h-3 w-3" /> {language === "en" ? "Divination" : "风水玄学"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

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
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                {[
                  { label: t.dashboard.profiles, val: stats.totalProfiles, unit: t.dashboard.personUnit, c: "text-violet-400" },
                  { label: t.dashboard.conversations, val: stats.totalConversations, unit: t.dashboard.convUnit, c: "text-blue-400" },
                  { label: t.dashboard.messages, val: stats.totalMessages, unit: t.dashboard.msgUnit, c: "text-cyan-400" },
                  { label: t.dashboard.analysisCoverage, val: `${stats.engagementRate}%`, unit: "", c: "text-emerald-400" },
                  { label: t.dashboard.avgMsgPerConvo, val: stats.avgMsgsPerConvo, unit: "", c: "text-amber-400" },
                  { label: t.dashboard.divination, val: stats.divinationCount, unit: t.dashboard.timesUnit, c: "text-pink-400" },
                  { label: t.dashboard.chatSessions, val: stats.chatSessionCount, unit: t.dashboard.timesUnit, c: "text-sky-400" },
                  { label: t.dashboard.feedbackRate, val: stats.feedbackTotal > 0 ? `${stats.feedbackPositiveRate}%` : "-", unit: "", c: "text-emerald-400" },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg border border-zinc-800/60 bg-zinc-900/40 px-2 sm:px-3 py-2 sm:py-2.5 text-center">
                    <p className={cn("text-lg sm:text-xl font-bold tracking-tight", s.c)}>{s.val}<span className="text-[8px] sm:text-[9px] text-zinc-600 ml-0.5">{s.unit}</span></p>
                    <p className="text-[8px] sm:text-[9px] text-zinc-600 mt-0.5 truncate">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* ─── Row 1: Activity Scatter + Social Intelligence Score ─── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                {/* Activity Timeline Scatter */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 sm:p-5">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-blue-400" />
                      <h3 className="text-[11px] font-semibold text-zinc-300 tracking-wide">{t.dashboard.activityTimeline}</h3>
                    </div>
                    <span className="text-[8px] text-zinc-600 font-mono">n={stats.totalConversations + stats.divinationCount}</span>
                  </div>
                  <p className="text-[8px] text-zinc-600 mb-3 italic">{t.dashboard.scatterHint}</p>
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
                        <Scatter name={t.dashboard.convoLabel} data={stats.activityScatter.filter(d => d.type === "对话")} fill="#60a5fa" opacity={0.7} />
                        <Scatter name={t.dashboard.mysticLabel} data={stats.activityScatter.filter(d => d.type === "玄学")} fill="#a78bfa" opacity={0.7} />
                        <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 9, color: "#71717a" }} />
                      </ScatterChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[170px] text-[10px] text-zinc-600">{t.dashboard.noEQData}</div>
                  )}
                </div>

                {/* Social Intelligence Power Score — animated ring gauge */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 sm:p-5 relative overflow-hidden">
                  {/* Background glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-cyan-500/5 pointer-events-none" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-amber-400" />
                        <h3 className="text-[11px] font-semibold text-zinc-300 tracking-wide">{language === "en" ? "Social Intelligence Score" : "社交智能指数"}</h3>
                      </div>
                      <span className="text-[8px] text-zinc-600 font-mono">composite</span>
                    </div>
                    {(() => {
                      // Compute composite score from available data
                      const dataRichness = Math.min(100, (stats.totalConversations * 5 + stats.totalProfiles * 15 + stats.divinationCount * 3 + stats.chatSessionCount * 4));
                      const analysisCoverage = stats.engagementRate;
                      const profileDepth = Math.min(100, stats.totalProfiles > 0 ? stats.dimAverages.reduce((s, d) => s + (d.avg !== 50 ? 1 : 0), 0) / stats.dimAverages.length * 100 : 0);
                      const engagementConsistency = Math.min(100, stats.daysSpan > 1 ? (stats.heatmap.filter(h => h.count > 0).length / Math.min(stats.daysSpan, 112)) * 100 : stats.totalConversations > 0 ? 30 : 0);
                      const networkSize = Math.min(100, stats.relationshipsCount * 20 + stats.totalProfiles * 12);

                      const metrics = [
                        { label: language === "en" ? "Data" : "数据量", value: dataRichness, color: "#60a5fa" },
                        { label: language === "en" ? "Coverage" : "分析率", value: analysisCoverage, color: "#8b5cf6" },
                        { label: language === "en" ? "Depth" : "深度", value: profileDepth, color: "#f59e0b" },
                        { label: language === "en" ? "Active" : "活跃度", value: engagementConsistency, color: "#34d399" },
                        { label: language === "en" ? "Network" : "社交网", value: networkSize, color: "#f472b6" },
                      ];
                      const compositeScore = Math.round(metrics.reduce((s, m) => s + m.value, 0) / metrics.length);
                      const circumference = 2 * Math.PI * 58;

                      return (
                        <div className="flex items-center gap-5">
                          {/* Ring gauge */}
                          <div className="relative shrink-0">
                            <svg width="140" height="140" viewBox="0 0 140 140">
                              <defs>
                                <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#8b5cf6" />
                                  <stop offset="50%" stopColor="#06b6d4" />
                                  <stop offset="100%" stopColor="#34d399" />
                                </linearGradient>
                                <filter id="glow">
                                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                                  <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                                </filter>
                              </defs>
                              {/* Background track */}
                              <circle cx="70" cy="70" r="58" fill="none" stroke="#27272a" strokeWidth="8" />
                              {/* Score arc */}
                              <circle
                                cx="70" cy="70" r="58" fill="none"
                                stroke="url(#scoreGrad)" strokeWidth="8" strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={circumference * (1 - compositeScore / 100)}
                                transform="rotate(-90 70 70)"
                                filter="url(#glow)"
                                style={{ transition: "stroke-dashoffset 1.5s ease-out" }}
                              />
                              {/* Center text */}
                              <text x="70" y="62" textAnchor="middle" fill="#e4e4e7" fontSize="28" fontWeight="bold" fontFamily="monospace">{compositeScore}</text>
                              <text x="70" y="80" textAnchor="middle" fill="#71717a" fontSize="9">{language === "en" ? "/ 100" : "/ 100 分"}</text>
                            </svg>
                          </div>
                          {/* Metric breakdown bars */}
                          <div className="flex-1 space-y-2.5">
                            {metrics.map((m) => (
                              <div key={m.label}>
                                <div className="flex items-center justify-between mb-0.5">
                                  <span className="text-[9px] text-zinc-500">{m.label}</span>
                                  <span className="text-[9px] font-mono" style={{ color: m.color }}>{Math.round(m.value)}</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${m.value}%`,
                                      backgroundColor: m.color,
                                      opacity: 0.7,
                                      transition: "width 1.2s ease-out",
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* ─── Row 2: Dimension Radar + Module Usage Radar ─── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                {/* Dimension Radar */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 sm:p-5">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Fingerprint className="h-4 w-4 text-amber-400" />
                      <h3 className="text-[11px] font-semibold text-zinc-300 tracking-wide">{language === "en" ? "Dimension Radar" : "人物维度雷达"}</h3>
                    </div>
                    <span className="text-[8px] text-zinc-600 font-mono">n={stats.totalProfiles} profiles</span>
                  </div>
                  <p className="text-[8px] text-zinc-600 mb-2 italic">{language === "en" ? "Average dimension distribution across all profiles (0-100)" : "所有画像维度均值分布 (0-100)"}</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={stats.dimAverages} cx="50%" cy="50%" outerRadius="75%">
                      <PolarGrid stroke="#3f3f46" strokeDasharray="3 3" />
                      <PolarAngleAxis dataKey="label" tick={{ fontSize: 8, fill: "#71717a" }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 7, fill: "#52525b" }} axisLine={false} />
                      <Radar name={language === "en" ? "Average" : "均值"} dataKey="avg" stroke="#f59e0b" fill="#f59e0b" fillOpacity={stats.totalProfiles > 0 ? 0.15 : 0.03} strokeWidth={1.5} dot={{ r: 2.5, fill: "#f59e0b" }} />
                      <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px", fontSize: "10px" }} />
                    </RadarChart>
                  </ResponsiveContainer>
                  {stats.totalProfiles === 0 && <p className="text-[9px] text-zinc-700 text-center -mt-2 italic">{language === "en" ? "Create profiles to populate this chart" : "创建人物画像后数据将自动填充"}</p>}
                </div>

                {/* Module Usage Radar */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 sm:p-5">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-cyan-400" />
                      <h3 className="text-[11px] font-semibold text-zinc-300 tracking-wide">{t.dashboard.moduleRadar}</h3>
                    </div>
                    <span className="text-[8px] text-zinc-600 font-mono">{t.dashboard.percentLabel}</span>
                  </div>
                  <p className="text-[8px] text-zinc-600 mb-2 italic">{t.dashboard.moduleUsageHint}</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={stats.moduleRadar} cx="50%" cy="50%" outerRadius="75%">
                      <PolarGrid stroke="#3f3f46" strokeDasharray="3 3" />
                      <PolarAngleAxis dataKey="module" tick={{ fontSize: 8, fill: "#71717a" }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar name={t.dashboard.usagePercent} dataKey="value" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.12} strokeWidth={1.5} dot={{ r: 2.5, fill: "#22d3ee" }} />
                      <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px", fontSize: "10px" }} formatter={(val: any, _: any, entry: any) => [`${val}% (${entry?.payload?.raw ?? 0})`, t.dashboard.usagePercent]} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ─── Row 3: Sentiment Scatter + Statistical Panel ─── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                {/* Sentiment Emotion Scatter */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 sm:p-5">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-pink-400" />
                      <h3 className="text-[11px] font-semibold text-zinc-300 tracking-wide">{t.dashboard.sentimentDist}</h3>
                    </div>
                    <span className="text-[8px] text-zinc-600 font-mono">n={stats.sentimentDist.n}</span>
                  </div>
                  <p className="text-[8px] text-zinc-600 mb-3 italic">{t.dashboard.sentimentHint}</p>
                  {stats.sentimentScatter.length > 0 ? (
                    <ResponsiveContainer width="100%" height={180}>
                      <ScatterChart margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="x" type="number" tick={{ fontSize: 9, fill: "#52525b" }} axisLine={{ stroke: "#3f3f46" }} tickLine={false} name="对话序号" />
                        <YAxis dataKey="y" type="number" domain={[-1, 1]} tick={{ fontSize: 9, fill: "#52525b" }} axisLine={{ stroke: "#3f3f46" }} tickLine={false} />
                        <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px", fontSize: "10px" }} formatter={(val: any) => [`${val}`, t.dashboard.sentimentValue]} labelFormatter={(v) => `${t.dashboard.convoN} #${v}`} />
                        <ReferenceLine y={0} stroke="#52525b" strokeDasharray="2 2" />
                        {stats.sentimentDist.n > 1 && (
                          <ReferenceLine y={stats.sentimentDist.mean} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: `μ=${stats.sentimentDist.mean.toFixed(2)}`, position: "right", style: { fontSize: 8, fill: "#f59e0b" } }} />
                        )}
                        <Scatter data={stats.sentimentScatter.filter(s => s.sentiment === "positive")} fill="#34d399" opacity={0.8} name={t.dashboard.positive} />
                        <Scatter data={stats.sentimentScatter.filter(s => s.sentiment === "neutral")} fill="#a1a1aa" opacity={0.6} name={t.dashboard.neutral} />
                        <Scatter data={stats.sentimentScatter.filter(s => s.sentiment === "negative")} fill="#f87171" opacity={0.8} name={t.dashboard.negative} />
                        <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 9 }} />
                      </ScatterChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[180px] text-[10px] text-zinc-600">{t.dashboard.noEQData}</div>
                  )}
                  {/* Box Plot + Strip */}
                  {stats.sentimentDist.n >= 3 && (
                    <div className="mt-3 pt-3 border-t border-zinc-800/50">
                      <p className="text-[8px] text-zinc-600 mb-2 italic">{t.dashboard.boxPlotTitle} (whisker = min/max)</p>
                      <svg viewBox="0 0 320 56" className="w-full h-14">
                        {(() => {
                          const d = stats.sentimentDist;
                          const mapX = (v: number) => 20 + ((v + 1) / 2) * 280;
                          const cy = 22;
                          return (
                            <>
                              {/* Axis */}
                              <line x1={20} y1={44} x2={300} y2={44} stroke="#3f3f46" strokeWidth={0.5} />
                              {[-1, -0.5, 0, 0.5, 1].map(v => (
                                <g key={v}>
                                  <line x1={mapX(v)} y1={42} x2={mapX(v)} y2={46} stroke="#52525b" strokeWidth={0.5} />
                                  <text x={mapX(v)} y={53} textAnchor="middle" fill="#52525b" fontSize={7}>{v}</text>
                                </g>
                              ))}
                              {/* Whisker line (min to max) */}
                              <line x1={mapX(d.min)} y1={cy} x2={mapX(d.max)} y2={cy} stroke="#52525b" strokeWidth={1} />
                              {/* Whisker caps */}
                              <line x1={mapX(d.min)} y1={cy - 5} x2={mapX(d.min)} y2={cy + 5} stroke="#52525b" strokeWidth={1} />
                              <line x1={mapX(d.max)} y1={cy - 5} x2={mapX(d.max)} y2={cy + 5} stroke="#52525b" strokeWidth={1} />
                              {/* IQR box */}
                              <rect x={mapX(d.q1)} y={cy - 8} width={mapX(d.q3) - mapX(d.q1)} height={16} rx={2} fill="#8b5cf6" fillOpacity={0.15} stroke="#8b5cf6" strokeWidth={1} />
                              {/* Median line */}
                              <line x1={mapX(d.median)} y1={cy - 8} x2={mapX(d.median)} y2={cy + 8} stroke="#f59e0b" strokeWidth={1.5} />
                              {/* Mean diamond */}
                              <polygon points={`${mapX(d.mean)},${cy - 5} ${mapX(d.mean) + 4},${cy} ${mapX(d.mean)},${cy + 5} ${mapX(d.mean) - 4},${cy}`} fill="#f59e0b" fillOpacity={0.8} />
                              {/* 95% CI bracket */}
                              {d.n > 1 && (
                                <rect x={mapX(d.ci95[0])} y={cy + 10} width={Math.max(1, mapX(d.ci95[1]) - mapX(d.ci95[0]))} height={3} rx={1} fill="#34d399" fillOpacity={0.4} />
                              )}
                              {/* Jitter strip */}
                              {d.rawValues.map((v: number, i: number) => (
                                <circle key={i} cx={mapX(v)} cy={cy + (((i * 7 + 3) % 11) - 5) * 0.6} r={1.5} fill={v > 0.15 ? "#34d399" : v < -0.15 ? "#f87171" : "#a1a1aa"} fillOpacity={0.5} />
                              ))}
                            </>
                          );
                        })()}
                      </svg>
                      <div className="flex items-center justify-center gap-4 mt-1 text-[7px] text-zinc-600">
                        <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-violet-500/40 border border-violet-500" />IQR</span>
                        <span className="flex items-center gap-1"><span className="inline-block w-2 h-0.5 bg-amber-400" />Median</span>
                        <span className="flex items-center gap-1"><span className="inline-block w-0 h-0 border-l-[3px] border-r-[3px] border-b-[5px] border-transparent border-b-amber-400" />Mean</span>
                        <span className="flex items-center gap-1"><span className="inline-block w-3 h-1 rounded-sm bg-emerald-400/40" />95% CI</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Statistical Insights Panel */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 sm:p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="h-4 w-4 text-violet-400" />
                    <h3 className="text-[11px] font-semibold text-zinc-300 tracking-wide">{t.dashboard.statisticalInsight}</h3>
                    <span className="text-[7px] text-zinc-600 border border-zinc-700 rounded px-1">Statistical Summary</span>
                  </div>
                  <div className="space-y-3 text-[10px]">
                    {/* Engagement */}
                    <div className="rounded-lg border border-zinc-800/60 bg-zinc-800/20 p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-zinc-400 font-medium">{t.dashboard.coverageRate}</span>
                        <span className="font-mono text-emerald-400">{stats.engagementRate}%</span>
                      </div>
                      <div className="relative h-1.5 rounded-full bg-zinc-800">
                        <div className="absolute inset-0 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${stats.engagementRate}%`, background: "linear-gradient(to right, #3f3f46, #34d399)", opacity: 0.3 }} />
                        </div>
                        <div className="absolute top-[-1px] w-0.5 h-2.5 rounded-sm bg-emerald-400 transition-all" style={{ left: `${stats.engagementRate}%`, transform: "translateX(-50%)" }} />
                      </div>
                      <p className="text-[8px] text-zinc-600 mt-1">{stats.analyzedCount}/{stats.totalConversations} {t.dashboard.convosAnalyzed}</p>
                    </div>

                    {/* Sentiment CI */}
                    {stats.sentimentDist.n > 1 && (
                      <div className="rounded-lg border border-zinc-800/60 bg-zinc-800/20 p-3">
                        <p className="text-zinc-400 font-medium mb-1">{t.dashboard.sentimentCI}</p>
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
                          {stats.sentimentDist.ci95[0] > 0 ? t.dashboard.sigPositive : stats.sentimentDist.ci95[1] < 0 ? t.dashboard.sigNegative : t.dashboard.sigNeutral}
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
                        <p className="text-[8px] text-zinc-600 mb-1">{t.dashboard.eqAvg}</p>
                        <p className="text-lg font-bold text-emerald-400">{stats.avgEQ || "—"}</p>
                        <p className="text-[7px] text-zinc-600">n={eqScores.length} {t.dashboard.assessments}</p>
                      </div>
                    </div>

                    {/* Key metrics table */}
                    <div className="rounded-lg border border-zinc-800/60 bg-zinc-800/20 p-3">
                      <p className="text-zinc-400 font-medium mb-2">{t.dashboard.dataSummary}</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[9px]">
                        <div className="flex justify-between"><span className="text-zinc-600">{t.dashboard.relNetwork}</span><span className="text-zinc-400 font-mono">{stats.relationshipsCount}</span></div>
                        <div className="flex justify-between"><span className="text-zinc-600">{t.dashboard.aiMemory}</span><span className="text-zinc-400 font-mono">{stats.memoriesCount}</span></div>
                        <div className="flex justify-between"><span className="text-zinc-600">{t.dashboard.dataSpan}</span><span className="text-zinc-400 font-mono">{stats.daysSpan}{t.dashboard.dayUnit}</span></div>
                        <div className="flex justify-between"><span className="text-zinc-600">{t.dashboard.dailyActivity}</span><span className="text-zinc-400 font-mono">{((stats.totalConversations + stats.divinationCount) / Math.max(1, stats.daysSpan)).toFixed(1)}</span></div>
                        {stats.divinationByCategory.length > 0 && (
                          <div className="flex justify-between col-span-2"><span className="text-zinc-600">{t.dashboard.topDivination}</span><span className="text-zinc-400 font-mono">{stats.divinationByCategory[0].name} ({stats.divinationByCategory[0].count})</span></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── Row 4: Profile Activity + Weekly Trend ─── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                {/* Profile Activity Ranked (dot plot) */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 sm:p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="h-4 w-4 text-violet-400" />
                    <h3 className="text-[11px] font-semibold text-zinc-300 tracking-wide">{t.dashboard.topProfiles}</h3>
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
                            <span className="text-[9px] text-zinc-500 w-8 shrink-0 text-right font-mono">{p.count}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[100px] text-[10px] text-zinc-600">{t.dashboard.noProfiles}</div>
                  )}
                </div>

                {/* Adaptive Weekly/Daily Trend Line */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 sm:p-5">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-400" />
                      <h3 className="text-[11px] font-semibold text-zinc-300 tracking-wide">{stats.daysSpan <= 7 ? t.dashboard.recentTrend : t.dashboard.convoTrend}</h3>
                    </div>
                    <span className="text-[8px] text-zinc-600 font-mono">{stats.daysSpan <= 7 ? t.dashboard.dayGranularity : t.dashboard.weekGranularity}</span>
                  </div>
                  <p className="text-[8px] text-zinc-600 mb-3 italic">{t.dashboard.totalVsAnalyzed}</p>
                  {stats.weeklyData.some((d) => d.count > 0) ? (
                    <ResponsiveContainer width="100%" height={150}>
                      <LineChart data={stats.weeklyData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="week" tick={{ fontSize: 9, fill: "#52525b" }} axisLine={{ stroke: "#3f3f46" }} tickLine={false} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 9, fill: "#52525b" }} axisLine={{ stroke: "#3f3f46" }} tickLine={false} />
                        <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px", fontSize: "10px" }} />
                        <Line type="monotone" dataKey="count" name={t.dashboard.totalConvos} stroke="#60a5fa" strokeWidth={2} dot={{ r: 3, fill: "#60a5fa" }} />
                        <Line type="monotone" dataKey="analyzed" name={t.dashboard.analyzed} stroke="#8b5cf6" strokeWidth={1.5} strokeDasharray="4 4" dot={{ r: 2.5, fill: "#8b5cf6" }} />
                        <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 9 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[150px] text-[10px] text-zinc-600">{t.dashboard.noTrend}</div>
                  )}
                </div>
              </div>

              {/* ─── Row 4.5: Module Usage Donut + Conversation Length Distribution ─── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                {/* Module Usage Donut Chart */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 sm:p-5 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/3 via-transparent to-violet-500/3 pointer-events-none" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-cyan-400" />
                        <h3 className="text-[11px] font-semibold text-zinc-300 tracking-wide">{language === "en" ? "Module Usage" : "功能使用分布"}</h3>
                      </div>
                      <span className="text-[8px] text-zinc-600 font-mono">n={stats.moduleTotal}</span>
                    </div>
                    {stats.moduleDonut.length > 0 ? (
                      <div className="flex items-center gap-4">
                        <div className="relative shrink-0">
                          <svg width="130" height="130" viewBox="0 0 130 130">
                            {(() => {
                              const cx = 65, cy = 65, r = 50, r2 = 32;
                              let cumulativeAngle = -Math.PI / 2;
                              return stats.moduleDonut.map((m, i) => {
                                const angle = (m.count / stats.moduleTotal) * 2 * Math.PI;
                                const startAngle = cumulativeAngle;
                                cumulativeAngle += angle;
                                const endAngle = cumulativeAngle;
                                const largeArc = angle > Math.PI ? 1 : 0;
                                const x1 = cx + r * Math.cos(startAngle);
                                const y1 = cy + r * Math.sin(startAngle);
                                const x2 = cx + r * Math.cos(endAngle);
                                const y2 = cy + r * Math.sin(endAngle);
                                const x3 = cx + r2 * Math.cos(endAngle);
                                const y3 = cy + r2 * Math.sin(endAngle);
                                const x4 = cx + r2 * Math.cos(startAngle);
                                const y4 = cy + r2 * Math.sin(startAngle);
                                return (
                                  <path
                                    key={i}
                                    d={`M${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} L${x3},${y3} A${r2},${r2} 0 ${largeArc},0 ${x4},${y4} Z`}
                                    fill={m.color}
                                    fillOpacity={0.7}
                                    stroke="#18181b"
                                    strokeWidth={1.5}
                                    className="hover:fill-opacity-100 transition-all cursor-pointer"
                                  >
                                    <title>{m.name}: {m.count} ({Math.round(m.count / stats.moduleTotal * 100)}%)</title>
                                  </path>
                                );
                              });
                            })()}
                            <text x="65" y="62" textAnchor="middle" fill="#e4e4e7" fontSize="18" fontWeight="bold" fontFamily="monospace">{stats.moduleTotal}</text>
                            <text x="65" y="76" textAnchor="middle" fill="#71717a" fontSize="8">{language === "en" ? "total" : "总计"}</text>
                          </svg>
                        </div>
                        <div className="flex-1 space-y-1.5">
                          {stats.moduleDonut.map((m) => (
                            <div key={m.name} className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
                              <span className="text-[9px] text-zinc-400 flex-1 truncate">{m.name}</span>
                              <span className="text-[9px] font-mono text-zinc-500">{m.count}</span>
                              <span className="text-[8px] font-mono" style={{ color: m.color }}>{Math.round(m.count / stats.moduleTotal * 100)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-[130px] text-[10px] text-zinc-600">{language === "en" ? "No usage data yet" : "暂无使用数据"}</div>
                    )}
                  </div>
                </div>

                {/* Conversation Length Distribution */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 sm:p-5 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-bl from-amber-500/3 via-transparent to-pink-500/3 pointer-events-none" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-amber-400" />
                        <h3 className="text-[11px] font-semibold text-zinc-300 tracking-wide">{language === "en" ? "Conversation Depth" : "对话深度分布"}</h3>
                      </div>
                      <span className="text-[8px] text-zinc-600 font-mono">{language === "en" ? "msgs/convo" : "消息数/对话"}</span>
                    </div>
                    {stats.totalConversations > 0 ? (
                      <div className="space-y-2.5">
                        {stats.lengthBuckets.map((b) => {
                          const maxCount = Math.max(1, ...stats.lengthBuckets.map(x => x.count));
                          const pct = stats.totalConversations > 0 ? Math.round(b.count / stats.totalConversations * 100) : 0;
                          return (
                            <div key={b.label} className="group">
                              <div className="flex items-center gap-3">
                                <span className="text-[9px] text-zinc-500 w-8 text-right font-mono shrink-0">{b.label}</span>
                                <div className="flex-1 h-5 rounded-md bg-zinc-800/60 overflow-hidden relative">
                                  <div
                                    className="h-full rounded-md relative overflow-hidden"
                                    style={{
                                      width: `${Math.max(b.count > 0 ? 4 : 0, (b.count / maxCount) * 100)}%`,
                                      transition: "width 1s ease-out",
                                    }}
                                  >
                                    <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, ${b.color}88, ${b.color})` }} />
                                    <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10" />
                                  </div>
                                  {b.count > 0 && (
                                    <span className="absolute inset-y-0 flex items-center text-[8px] font-mono text-zinc-300 pl-2" style={{ left: `${Math.max(4, (b.count / maxCount) * 100)}%` }}>
                                      {b.count}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[8px] font-mono w-8 text-right shrink-0" style={{ color: b.color }}>{pct}%</span>
                              </div>
                            </div>
                          );
                        })}
                        <p className="text-[8px] text-zinc-600 italic mt-1 text-center">{language === "en" ? `avg ${stats.avgMsgsPerConvo} msgs · ${stats.totalConversations} conversations` : `平均 ${stats.avgMsgsPerConvo} 条/对话 · 共 ${stats.totalConversations} 场对话`}</p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-[130px] text-[10px] text-zinc-600">{language === "en" ? "No conversations yet" : "暂无对话数据"}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* ─── Row 5: Dimension Detail + Activity Heatmap ─── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Dimension Detail Grid (sparkline-style) */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Fingerprint className="h-4 w-4 text-amber-400" />
                      <h3 className="text-[11px] font-semibold text-zinc-300 tracking-wide">{t.dashboard.dimDetail}</h3>
                    </div>
                    <span className="text-[8px] text-zinc-600 font-mono">{stats.dimAverages.length} dimensions</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {stats.dimAverages.map((d) => {
                      const hasData = stats.totalProfiles > 0;
                      const color = !hasData ? "#3f3f46" : d.avg > 65 ? "#34d399" : d.avg < 35 ? "#f87171" : "#a1a1aa";
                      return (
                        <div key={d.key} className="rounded-lg border border-zinc-800/60 bg-zinc-800/20 p-2 sm:p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[8px] sm:text-[9px] text-zinc-500 truncate mr-1">{d.label}</span>
                            <span className="text-xs sm:text-sm font-bold font-mono shrink-0" style={{ color }}>{hasData ? d.avg : "—"}</span>
                          </div>
                          {/* Mini distribution bar with needle */}
                          <div className="relative h-2 rounded-full bg-zinc-800 mt-1">
                            <div className="absolute inset-0 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${hasData ? d.avg : 50}%`, background: `linear-gradient(to right, ${!hasData ? "#27272a" : d.avg < 35 ? "#f87171" : "#3f3f46"}, ${color})`, opacity: hasData ? 0.4 : 0.15 }} />
                            </div>
                            {hasData && <div className="absolute top-[-1px] w-1 h-3 rounded-sm" style={{ left: `${d.avg}%`, transform: "translateX(-50%)", backgroundColor: color }} />}
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

                {/* Activity Heatmap */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-emerald-400" />
                      <h3 className="text-[11px] font-semibold text-zinc-300 tracking-wide">{t.dashboard.heatmap}</h3>
                    </div>
                    <div className="flex items-center gap-2 text-[8px] text-zinc-600">
                      <span className="font-mono">{stats.heatmap.filter(h => h.count > 0).length} active days</span>
                      <span>·</span>
                      <span className="font-mono">max {stats.heatmapMax}/day</span>
                    </div>
                  </div>
                  <p className="text-[8px] text-zinc-600 italic mb-2">{t.dashboard.heatmapHint}</p>
                  <div className="overflow-x-auto">
                    <div className="flex gap-[2px]" style={{ minWidth: "fit-content" }}>
                      {(() => {
                        const weeks: { date: string; count: number; iso: string }[][] = [];
                        for (let i = 0; i < stats.heatmap.length; i += 7) {
                          weeks.push(stats.heatmap.slice(i, i + 7));
                        }
                        const DAY_LABELS = t.dashboard.heatmapDayLabels;
                        return (
                          <>
                            <div className="flex flex-col gap-[2px] mr-1">
                              {DAY_LABELS.map((label, i) => (
                                <div key={i} className="w-3 h-[11px] flex items-center justify-end">
                                  <span className="text-[6px] text-zinc-700">{label}</span>
                                </div>
                              ))}
                            </div>
                            {weeks.map((week, wi) => (
                              <div key={wi} className="flex flex-col gap-[2px]">
                                {week.map((day, di) => {
                                  const intensity = day.count / stats.heatmapMax;
                                  const bg = day.count === 0
                                    ? "#1c1c1e"
                                    : intensity <= 0.25 ? "#064e3b" : intensity <= 0.5 ? "#047857" : intensity <= 0.75 ? "#059669" : "#34d399";
                                  return (
                                    <div
                                      key={di}
                                      className="w-[11px] h-[11px] rounded-[2px] transition-colors"
                                      style={{ backgroundColor: bg }}
                                      title={`${day.iso}: ${day.count} ${t.dashboard.activityCount}`}
                                    />
                                  );
                                })}
                              </div>
                            ))}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-1 mt-2 text-[7px] text-zinc-600">
                    <span>{t.dashboard.less}</span>
                    {[0, 0.25, 0.5, 0.75, 1].map((v, i) => (
                      <div key={i} className="w-[9px] h-[9px] rounded-[2px]" style={{ backgroundColor: v === 0 ? "#1c1c1e" : v <= 0.25 ? "#064e3b" : v <= 0.5 ? "#047857" : v <= 0.75 ? "#059669" : "#34d399" }} />
                    ))}
                    <span>{t.dashboard.more}</span>
                  </div>
              </div>
              </div>

              {/* ─── Row 6: Correlation + AI Insight ─── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Dimension Correlation Matrix */}
                <DimensionCorrelation />

                {/* AI Data Insight */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-400" />
                    <h3 className="text-[11px] font-semibold text-zinc-300 tracking-wide">{t.dashboard.aiInsightTitle}</h3>
                  </div>
                  <button
                    onClick={generateInsight}
                    disabled={insightLoading}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all",
                      insightLoading
                        ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                        : "bg-violet-600/20 text-violet-400 border border-violet-500/30 hover:bg-violet-600/30"
                    )}
                  >
                    {insightLoading ? (
                      <><Loader2 className="h-3 w-3 animate-spin" /> {t.dashboard.analyzing}</>
                    ) : (
                      <><Sparkles className="h-3 w-3" /> {t.dashboard.generateReport}</>
                    )}
                  </button>
                </div>
                <p className="text-[8px] text-zinc-600 italic mb-3">{t.dashboard.aiInsightDesc}</p>
                {aiInsight ? (
                  <div className="rounded-lg border border-zinc-800/60 bg-zinc-800/20 p-4">
                    <p className="text-[11px] text-zinc-300 leading-relaxed whitespace-pre-wrap">
                      {aiInsight}
                      {insightLoading && <span className="inline-block w-1.5 h-3.5 bg-violet-400 ml-0.5 animate-pulse rounded-sm" />}
                    </p>
                  </div>
                ) : !insightLoading ? (
                  <div className="flex items-center justify-center h-[60px] text-[10px] text-zinc-600">
                    {t.dashboard.clickGenerate}
                  </div>
                ) : null}
              </div>
              </div>
          </>
        </div>
      </div>

      <ShareCard
        isOpen={showShareCard}
        onClose={() => setShowShareCard(false)}
        type="profile-summary"
      />
    </div>
  );
}
