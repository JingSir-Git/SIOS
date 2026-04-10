"use client";

import { useMemo, useState } from "react";
import {
  Swords,
  Target,
  AlertTriangle,
  Heart,
  MessageCircle,
  Zap,
  ChevronRight,
  Sparkles,
  Shield,
  TrendingUp,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

interface TrainingScenario {
  id: string;
  profileId: string;
  profileName: string;
  category: "conflict" | "emotion" | "persuasion" | "boundary" | "repair" | "deepening";
  title: string;
  description: string;
  scenario: string;
  goal: string;
  difficulty: "easy" | "medium" | "hard";
  /** Why this scenario was generated */
  reason: string;
  /** Priority score for sorting */
  priority: number;
}

const CATEGORY_CONFIG: Record<
  TrainingScenario["category"],
  { icon: React.ElementType; color: string; label: string }
> = {
  conflict: { icon: AlertTriangle, color: "border-red-500/30 bg-red-500/5 text-red-300", label: "冲突化解" },
  emotion: { icon: Heart, color: "border-pink-500/30 bg-pink-500/5 text-pink-300", label: "情绪管理" },
  persuasion: { icon: Target, color: "border-amber-500/30 bg-amber-500/5 text-amber-300", label: "说服沟通" },
  boundary: { icon: Shield, color: "border-blue-500/30 bg-blue-500/5 text-blue-300", label: "边界设定" },
  repair: { icon: Sparkles, color: "border-violet-500/30 bg-violet-500/5 text-violet-300", label: "关系修复" },
  deepening: { icon: TrendingUp, color: "border-emerald-500/30 bg-emerald-500/5 text-emerald-300", label: "关系深化" },
};

const DIFFICULTY_LABELS: Record<TrainingScenario["difficulty"], { label: string; color: string }> = {
  easy: { label: "初级", color: "text-emerald-400 bg-emerald-500/10" },
  medium: { label: "中级", color: "text-amber-400 bg-amber-500/10" },
  hard: { label: "高级", color: "text-red-400 bg-red-500/10" },
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function ScenarioTrainer({ isOpen, onClose }: Props) {
  const { profiles, relationships, conversations, navigateToTab } = useAppStore();
  const [selectedCategory, setSelectedCategory] = useState<TrainingScenario["category"] | "all">("all");

  const scenarios = useMemo(() => {
    const result: TrainingScenario[] = [];
    const now = Date.now();

    for (const profile of profiles) {
      const rel = relationships.find((r) => r.profileId === profile.id);
      const profileConvos = conversations.filter((c) => c.linkedProfileId === profile.id);
      const analyzedConvos = profileConvos.filter((c) => c.analysis);

      // ---- Scenario: Unresolved conflict ----
      if (rel?.unresolvedIssues?.length) {
        for (const issue of rel.unresolvedIssues.slice(0, 2)) {
          const triggers = profile.communicationStyle?.triggerPoints || [];
          const triggerWarning = triggers.length > 0
            ? `注意：对方的敏感点包括「${triggers.slice(0, 2).join("、")}」，需要巧妙避开。`
            : "";
          result.push({
            id: `conflict-${profile.id}-${issue.substring(0, 8)}`,
            profileId: profile.id,
            profileName: profile.name,
            category: "conflict",
            title: `化解与${profile.name}的矛盾`,
            description: issue,
            scenario: `我需要和${profile.name}沟通一个悬而未决的问题：${issue}。对方是${profile.communicationStyle?.overallType || "未知"}风格。${triggerWarning}`,
            goal: `以双方都能接受的方式解决「${issue.slice(0, 30)}」的问题，同时保持关系稳定`,
            difficulty: "hard",
            reason: "检测到未解决的矛盾",
            priority: 90,
          });
        }
      }

      // ---- Scenario: Emotion decline ----
      if (analyzedConvos.length >= 3) {
        const recentWithEmotions = analyzedConvos
          .filter((c) => c.analysis?.emotionCurve && c.analysis.emotionCurve.length > 0)
          .slice(0, 6);
        if (recentWithEmotions.length >= 3) {
          const avgEmotions = recentWithEmotions.map((c) => {
            const curve = c.analysis!.emotionCurve;
            return curve.reduce((s: number, p: { selfEmotion: number; otherEmotion: number }) => s + p.otherEmotion, 0) / curve.length;
          });
          const earlyAvg = avgEmotions.slice(-2).reduce((a, b) => a + b, 0) / 2;
          const recentAvg = avgEmotions.slice(0, 2).reduce((a, b) => a + b, 0) / 2;
          if (recentAvg - earlyAvg < -0.2) {
            const bestTopics = profile.communicationStyle?.preferredTopics?.slice(0, 2).join("、") || "轻松的话题";
            result.push({
              id: `emotion-${profile.id}`,
              profileId: profile.id,
              profileName: profile.name,
              category: "emotion",
              title: `改善与${profile.name}的情绪氛围`,
              description: `对方在最近对话中情绪呈下降趋势`,
              scenario: `${profile.name}最近和我说话时情绪明显比以前低落。对方偏好「${bestTopics}」的话题。我需要在下次对话中改善互动氛围，让对方感觉被理解和支持。`,
              goal: `提升对话的情感温度，让对方感受到真诚的关心和支持`,
              difficulty: "medium",
              reason: "情绪趋势下降",
              priority: 80,
            });
          }
        }
      }

      // ---- Scenario: Relationship cooling ----
      if (rel?.status === "cooling") {
        const style = profile.communicationStyle?.overallType || "待了解";
        result.push({
          id: `repair-${profile.id}`,
          profileId: profile.id,
          profileName: profile.name,
          category: "repair",
          title: `修复与${profile.name}的关系`,
          description: `关系状态为"降温中"，信任度 ${rel.trustLevel}/100`,
          scenario: `我和${profile.name}的关系最近变得冷淡。对方是${style}风格，信任度只有${rel.trustLevel}/100。我需要找到合适的方式重新拉近关系，但不能显得太刻意。`,
          goal: `自然地重新建立联系，让关系回到正常轨道`,
          difficulty: "hard",
          reason: "关系正在降温",
          priority: 85,
        });
      }

      // ---- Scenario: Overdue contact ----
      const lastConvoTime = profileConvos[0]
        ? new Date(profileConvos[0].createdAt).getTime()
        : profile.lastInteraction
          ? new Date(profile.lastInteraction).getTime()
          : 0;
      if (lastConvoTime > 0) {
        const daysSince = Math.floor((now - lastConvoTime) / (1000 * 60 * 60 * 24));
        if (daysSince > 30) {
          const topics = profile.communicationStyle?.preferredTopics;
          const topicHint = topics?.length ? `对方对「${topics.slice(0, 2).join("、")}」感兴趣。` : "";
          result.push({
            id: `reconnect-${profile.id}`,
            profileId: profile.id,
            profileName: profile.name,
            category: "deepening",
            title: `重新联系${profile.name}`,
            description: `已${daysSince}天未联系`,
            scenario: `我已经有${daysSince}天没有和${profile.name}联系了。${topicHint}我需要找到一个自然、不尴尬的方式重新开始对话。`,
            goal: `自然地重新建立联系，恢复日常互动`,
            difficulty: daysSince > 60 ? "hard" : "medium",
            reason: `${daysSince}天未联系`,
            priority: Math.min(70 + daysSince / 5, 85),
          });
        }
      }

      // ---- Scenario: Persuasion practice ----
      if (rel && rel.trustLevel < 50 && profileConvos.length >= 2) {
        const argStyle = profile.patterns?.conflictStyle || "未知";
        result.push({
          id: `persuade-${profile.id}`,
          profileId: profile.id,
          profileName: profile.name,
          category: "persuasion",
          title: `说服${profile.name}接受新观点`,
          description: `信任度偏低(${rel.trustLevel}/100)，需要更有效的沟通策略`,
          scenario: `我需要说服${profile.name}接受一个重要的决定。对方的论辩风格是「${argStyle}」，目前对我的信任度只有${rel.trustLevel}/100。我需要在对方不太信任我的情况下进行有效说服。`,
          goal: `在不损害关系的前提下，让对方认真考虑并接受我的观点`,
          difficulty: "hard",
          reason: "信任度偏低，需要提升沟通效果",
          priority: 65,
        });
      }

      // ---- Scenario: Boundary setting ----
      if (profile.subjectiveImpression?.unresolved && profile.subjectiveImpression.unresolved.length > 5) {
        result.push({
          id: `boundary-${profile.id}`,
          profileId: profile.id,
          profileName: profile.name,
          category: "boundary",
          title: `与${profile.name}设定边界`,
          description: `有未解决的个人议题需要划清界限`,
          scenario: `我和${profile.name}之间有些事情需要明确边界：${profile.subjectiveImpression.unresolved.slice(0, 60)}。对方是${profile.communicationStyle?.overallType || "未知"}风格。我需要坚定但有礼貌地表达自己的立场。`,
          goal: `清晰表达边界，让对方理解和尊重，同时不伤害关系`,
          difficulty: "medium",
          reason: "存在未解决的个人议题",
          priority: 60,
        });
      }
    }

    // Sort by priority
    result.sort((a, b) => b.priority - a.priority);
    return result;
  }, [profiles, relationships, conversations]);

  const filteredScenarios = selectedCategory === "all"
    ? scenarios
    : scenarios.filter((s) => s.category === selectedCategory);

  const categoryBuckets = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of scenarios) {
      counts[s.category] = (counts[s.category] || 0) + 1;
    }
    return counts;
  }, [scenarios]);

  const startTraining = (s: TrainingScenario) => {
    navigateToTab("simulate", s.profileId, {
      context: s.scenario,
      goal: s.goal,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="rounded-xl border border-violet-500/20 bg-zinc-900/80 overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <Swords className="h-4 w-4 text-violet-400" />
          <h3 className="text-sm font-medium text-zinc-200">场景化训练</h3>
          <span className="text-[10px] text-zinc-600">
            基于你的关系数据智能推荐训练场景
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedCategory("all")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-[10px] transition-colors border",
              selectedCategory === "all"
                ? "bg-violet-500/15 text-violet-300 border-violet-500/30"
                : "text-zinc-500 border-zinc-700 hover:text-zinc-300 hover:border-zinc-600"
            )}
          >
            全部 ({scenarios.length})
          </button>
          {(Object.entries(CATEGORY_CONFIG) as [TrainingScenario["category"], typeof CATEGORY_CONFIG[TrainingScenario["category"]]][]).map(([key, cfg]) => {
            const count = categoryBuckets[key] || 0;
            if (count === 0) return null;
            const Icon = cfg.icon;
            return (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] transition-colors border",
                  selectedCategory === key
                    ? "bg-violet-500/15 text-violet-300 border-violet-500/30"
                    : "text-zinc-500 border-zinc-700 hover:text-zinc-300 hover:border-zinc-600"
                )}
              >
                <Icon className="h-3 w-3" />
                {cfg.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Scenario List */}
        {filteredScenarios.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
            <p className="text-xs text-zinc-600">
              {scenarios.length === 0
                ? "添加更多对话和联系人后，系统将自动生成训练场景"
                : "当前分类下暂无推荐场景"
              }
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredScenarios.map((s) => {
              const cfg = CATEGORY_CONFIG[s.category];
              const Icon = cfg.icon;
              const diff = DIFFICULTY_LABELS[s.difficulty];
              return (
                <div
                  key={s.id}
                  className={cn(
                    "rounded-lg border p-3 transition-colors hover:bg-zinc-800/30",
                    cfg.color
                  )}
                >
                  <div className="flex items-start gap-2">
                    <div className="shrink-0 mt-0.5">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium">{s.title}</span>
                        <span className={cn("text-[8px] px-1.5 py-0.5 rounded", diff.color)}>
                          {diff.label}
                        </span>
                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500">
                          {s.reason}
                        </span>
                      </div>
                      <p className="text-[10px] opacity-70 mt-0.5 leading-relaxed line-clamp-2">
                        {s.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => startTraining(s)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium bg-violet-600/80 text-white hover:bg-violet-500 transition-colors"
                        >
                          <Zap className="h-3 w-3" />
                          开始训练
                        </button>
                        <span className="text-[9px] text-zinc-600 flex items-center gap-1">
                          <ChevronRight className="h-2.5 w-2.5" />
                          跳转到模拟对话
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
