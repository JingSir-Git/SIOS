"use client";

import { useMemo, useState } from "react";
import {
  Brain,
  X,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Star,
  Clock,
  Tag,
  Users,
  AlertCircle,
  Lightbulb,
  Heart,
  FileText,
  Zap,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import type { ProfileMemoryEntry, MemoryCategory, PersonProfile } from "@/lib/types";

// ---- Category metadata ----

const CATEGORY_META: Record<MemoryCategory, { label: string; icon: React.ElementType; color: string }> = {
  key_event: { label: "重要事件", icon: Zap, color: "text-amber-400 bg-amber-500/10" },
  pattern_change: { label: "模式变化", icon: Sparkles, color: "text-blue-400 bg-blue-500/10" },
  commitment: { label: "承诺追踪", icon: Shield, color: "text-emerald-400 bg-emerald-500/10" },
  preference: { label: "偏好记录", icon: Heart, color: "text-pink-400 bg-pink-500/10" },
  relationship_shift: { label: "关系转折", icon: AlertCircle, color: "text-violet-400 bg-violet-500/10" },
  insight: { label: "深层洞察", icon: Lightbulb, color: "text-cyan-400 bg-cyan-500/10" },
  user_note: { label: "用户备注", icon: FileText, color: "text-zinc-400 bg-zinc-500/10" },
};

const ALL_CATEGORIES = Object.keys(CATEGORY_META) as MemoryCategory[];

// ---- Summary generation (local, no LLM) ----

interface ProfileSummary {
  profile: PersonProfile;
  memories: ProfileMemoryEntry[];
  totalCount: number;
  byCategory: { category: MemoryCategory; count: number; items: ProfileMemoryEntry[] }[];
  avgImportance: number;
  topMemories: ProfileMemoryEntry[]; // highest importance
  recentMemories: ProfileMemoryEntry[]; // most recent
  coreSummary: string; // generated narrative
  themes: string[]; // extracted themes/keywords
  verifiedCount: number;
  archivedCount: number;
}

function generateProfileSummary(profile: PersonProfile, memories: ProfileMemoryEntry[]): ProfileSummary {
  const active = memories.filter((m) => !m.archived);
  const archived = memories.filter((m) => m.archived);

  // Group by category
  const byCategory = ALL_CATEGORIES
    .map((cat) => {
      const items = active.filter((m) => m.category === cat);
      return { category: cat, count: items.length, items };
    })
    .filter((g) => g.count > 0)
    .sort((a, b) => b.count - a.count);

  // Average importance
  const avgImportance = active.length > 0
    ? Math.round((active.reduce((s, m) => s + m.importance, 0) / active.length) * 10) / 10
    : 0;

  // Top by importance
  const topMemories = [...active].sort((a, b) => b.importance - a.importance).slice(0, 5);

  // Recent
  const recentMemories = [...active]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Extract themes — simple keyword extraction from memory content
  const wordFreq = new Map<string, number>();
  for (const m of active) {
    // Extract Chinese phrases (2-6 chars) and meaningful tokens
    const phrases = m.content.match(/[\u4e00-\u9fa5]{2,6}/g) || [];
    for (const phrase of phrases) {
      // Skip common stop words
      if (["的时候", "他们的", "而且还", "可以说", "一个人", "这个人", "他是一", "就是说", "因为他"].includes(phrase)) continue;
      wordFreq.set(phrase, (wordFreq.get(phrase) || 0) + 1);
    }
  }
  const themes = [...wordFreq.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word]) => word);

  // Generate narrative summary
  const parts: string[] = [];

  // Opening
  parts.push(`${profile.name}共有 ${active.length} 条AI记忆`);
  if (archived.length > 0) parts[0] += `（${archived.length} 条已归档）`;
  parts[0] += "。";

  // Category breakdown
  if (byCategory.length > 0) {
    const topCats = byCategory.slice(0, 3);
    const catDesc = topCats
      .map((c) => `${CATEGORY_META[c.category].label}（${c.count}条）`)
      .join("、");
    parts.push(`记忆主要集中在${catDesc}。`);
  }

  // Key insights from top memories
  if (topMemories.length > 0) {
    const topContent = topMemories
      .slice(0, 2)
      .map((m) => {
        const short = m.content.length > 30 ? m.content.substring(0, 30) + "…" : m.content;
        return `"${short}"`;
      })
      .join("、");
    parts.push(`最重要的记忆包括：${topContent}。`);
  }

  // Importance assessment
  if (avgImportance >= 4) {
    parts.push("整体记忆重要性很高，需要重点关注。");
  } else if (avgImportance >= 3) {
    parts.push("整体记忆重要性中等偏上。");
  } else if (active.length > 0) {
    parts.push("大部分为日常记录。");
  }

  // Theme summary
  if (themes.length >= 3) {
    parts.push(`核心主题关键词：${themes.slice(0, 5).join("、")}。`);
  }

  const verifiedCount = active.filter((m) => m.verified).length;

  return {
    profile,
    memories: active,
    totalCount: active.length,
    byCategory,
    avgImportance,
    topMemories,
    recentMemories,
    coreSummary: parts.join(""),
    themes,
    verifiedCount,
    archivedCount: archived.length,
  };
}

// ---- Main Component ----

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function MemorySummary({ isOpen, onClose }: Props) {
  const { profiles, profileMemories } = useAppStore();
  const [expandedProfileId, setExpandedProfileId] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const summaries = useMemo(() => {
    return profiles
      .map((p) => {
        const mems = profileMemories.filter((m) => m.profileId === p.id);
        if (mems.length === 0) return null;
        return generateProfileSummary(p, mems);
      })
      .filter(Boolean) as ProfileSummary[];
  }, [profiles, profileMemories]);

  // Global stats
  const globalStats = useMemo(() => {
    const total = profileMemories.filter((m) => !m.archived).length;
    const totalArchived = profileMemories.filter((m) => m.archived).length;
    const avgImp = total > 0
      ? Math.round((profileMemories.filter((m) => !m.archived).reduce((s, m) => s + m.importance, 0) / total) * 10) / 10
      : 0;
    const catDist = ALL_CATEGORIES.map((c) => ({
      cat: c,
      count: profileMemories.filter((m) => !m.archived && m.category === c).length,
    })).filter((d) => d.count > 0).sort((a, b) => b.count - a.count);

    return { total, totalArchived, avgImp, catDist };
  }, [profileMemories]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4">
      <div className="w-full max-w-3xl h-full md:h-auto md:max-h-[85vh] rounded-none md:rounded-2xl border-0 md:border border-zinc-700/80 bg-zinc-900 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-cyan-400" />
            <div>
              <h2 className="text-sm font-semibold text-zinc-200">记忆智能摘要</h2>
              <p className="text-[10px] text-zinc-500">跨画像记忆聚类分析与核心特征总结</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {summaries.length === 0 ? (
            <div className="text-center py-16">
              <Brain className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">暂无AI记忆数据</p>
              <p className="text-[10px] text-zinc-600 mt-1">通过对话分析自动积累，或手动添加记忆条目</p>
            </div>
          ) : (
            <>
              {/* Global Overview */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-4">
                <h3 className="text-xs font-medium text-zinc-300 mb-3 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                  全局概览
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div className="text-center">
                    <p className="text-lg font-bold text-zinc-200">{globalStats.total}</p>
                    <p className="text-[9px] text-zinc-600">活跃记忆</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-zinc-200">{summaries.length}</p>
                    <p className="text-[9px] text-zinc-600">涉及画像</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-zinc-200">{globalStats.avgImp}</p>
                    <p className="text-[9px] text-zinc-600">平均重要性</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-zinc-200">{globalStats.totalArchived}</p>
                    <p className="text-[9px] text-zinc-600">已归档</p>
                  </div>
                </div>

                {/* Category distribution bar */}
                {globalStats.catDist.length > 0 && (
                  <div className="space-y-1.5">
                    {globalStats.catDist.map((d) => {
                      const meta = CATEGORY_META[d.cat];
                      const Icon = meta.icon;
                      const pct = globalStats.total > 0 ? Math.round((d.count / globalStats.total) * 100) : 0;
                      return (
                        <div key={d.cat} className="flex items-center gap-2">
                          <Icon className={cn("h-3 w-3 shrink-0", meta.color.split(" ")[0])} />
                          <span className="text-[10px] text-zinc-500 w-14 shrink-0">{meta.label}</span>
                          <div className="relative flex-1 h-1.5 rounded-full bg-zinc-800">
                            <div className="absolute inset-0 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${Math.max(4, pct)}%`, background: "linear-gradient(to right, #3f3f46, #8b5cf6)", opacity: 0.3 }} />
                            </div>
                            <div className="absolute top-[-1px] w-0.5 h-2.5 rounded-sm bg-violet-400" style={{ left: `${Math.max(4, pct)}%`, transform: "translateX(-50%)" }} />
                          </div>
                          <span className="text-[9px] text-zinc-600 w-12 text-right shrink-0">{d.count}条 {pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Per-profile summaries */}
              {summaries.map((s) => {
                const isExpanded = expandedProfileId === s.profile.id;
                return (
                  <div key={s.profile.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
                    {/* Profile header */}
                    <button
                      onClick={() => setExpandedProfileId(isExpanded ? null : s.profile.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/30 transition-colors"
                    >
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500/20 to-pink-500/20 flex items-center justify-center text-xs font-bold text-violet-300 shrink-0">
                        {s.profile.name[0]}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-zinc-200 truncate">{s.profile.name}</span>
                          <span className="text-[9px] text-zinc-600">{s.totalCount}条记忆</span>
                          {s.verifiedCount > 0 && (
                            <span className="text-[9px] text-emerald-500">{s.verifiedCount}已验证</span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-500 truncate">{s.coreSummary.substring(0, 60)}…</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((v) => (
                            <Star
                              key={v}
                              className={cn(
                                "h-2.5 w-2.5",
                                v <= Math.round(s.avgImportance)
                                  ? "text-amber-400 fill-amber-400"
                                  : "text-zinc-700"
                              )}
                            />
                          ))}
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-zinc-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-zinc-500" />
                        )}
                      </div>
                    </button>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="border-t border-zinc-800 px-4 py-4 space-y-4">
                        {/* Core narrative */}
                        <div className="rounded-lg bg-zinc-800/30 border border-zinc-700/50 p-3">
                          <p className="text-xs text-zinc-300 leading-relaxed">{s.coreSummary}</p>
                        </div>

                        {/* Themes */}
                        {s.themes.length > 0 && (
                          <div>
                            <h4 className="text-[10px] font-medium text-zinc-400 mb-2 flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              核心主题
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                              {s.themes.map((t) => (
                                <span key={t} className="px-2 py-0.5 rounded-full text-[9px] bg-violet-500/10 text-violet-300 border border-violet-500/20">
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Category breakdown */}
                        <div>
                          <h4 className="text-[10px] font-medium text-zinc-400 mb-2">分类详情</h4>
                          <div className="space-y-1.5">
                            {s.byCategory.map((cat) => {
                              const meta = CATEGORY_META[cat.category];
                              const Icon = meta.icon;
                              const catKey = `${s.profile.id}-${cat.category}`;
                              const isCatExpanded = expandedCategory === catKey;
                              return (
                                <div key={cat.category}>
                                  <button
                                    onClick={() => setExpandedCategory(isCatExpanded ? null : catKey)}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-zinc-800/40 transition-colors"
                                  >
                                    <div className={cn("rounded p-1", meta.color.split(" ")[1])}>
                                      <Icon className={cn("h-3 w-3", meta.color.split(" ")[0])} />
                                    </div>
                                    <span className="text-[10px] text-zinc-300 flex-1 text-left">{meta.label}</span>
                                    <span className="text-[9px] text-zinc-600">{cat.count}条</span>
                                    {isCatExpanded ? (
                                      <ChevronDown className="h-3 w-3 text-zinc-600" />
                                    ) : (
                                      <ChevronRight className="h-3 w-3 text-zinc-600" />
                                    )}
                                  </button>
                                  {isCatExpanded && (
                                    <div className="ml-7 mt-1 space-y-1 mb-2">
                                      {cat.items.slice(0, 10).map((mem) => (
                                        <div key={mem.id} className="flex items-start gap-2 px-2 py-1.5 rounded bg-zinc-800/20">
                                          <div className="flex shrink-0 mt-0.5">
                                            {[1, 2, 3, 4, 5].map((v) => (
                                              <Star
                                                key={v}
                                                className={cn(
                                                  "h-2 w-2",
                                                  v <= mem.importance ? "text-amber-400 fill-amber-400" : "text-zinc-800"
                                                )}
                                              />
                                            ))}
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <p className="text-[10px] text-zinc-300 leading-relaxed">{mem.content}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                              <span className="text-[8px] text-zinc-600">
                                                {new Date(mem.createdAt).toLocaleDateString("zh-CN")}
                                              </span>
                                              {mem.verified && (
                                                <span className="text-[8px] text-emerald-500">✓ 已验证</span>
                                              )}
                                              <span className="text-[8px] text-zinc-700">{mem.source}</span>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                      {cat.items.length > 10 && (
                                        <p className="text-[9px] text-zinc-600 px-2">还有 {cat.items.length - 10} 条…</p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Top memories */}
                        {s.topMemories.length > 0 && (
                          <div>
                            <h4 className="text-[10px] font-medium text-zinc-400 mb-2 flex items-center gap-1">
                              <Star className="h-3 w-3 text-amber-400" />
                              最重要的记忆
                            </h4>
                            <div className="space-y-1">
                              {s.topMemories.map((m) => (
                                <div key={m.id} className="flex items-start gap-2 px-2 py-1.5 rounded-md bg-amber-500/5 border border-amber-500/10">
                                  <span className="text-[9px] text-amber-400 font-bold shrink-0 mt-0.5">★{m.importance}</span>
                                  <p className="text-[10px] text-zinc-300 leading-relaxed">{m.content}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recent activity */}
                        <div>
                          <h4 className="text-[10px] font-medium text-zinc-400 mb-2 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            最近记忆
                          </h4>
                          <div className="space-y-1">
                            {s.recentMemories.map((m) => (
                              <div key={m.id} className="flex items-center gap-2 text-[10px]">
                                <span className="text-zinc-600 shrink-0 w-16">
                                  {new Date(m.createdAt).toLocaleDateString("zh-CN", { month: "short", day: "numeric" })}
                                </span>
                                <span className="text-zinc-400 truncate">{m.content}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
