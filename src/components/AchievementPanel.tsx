"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Trophy, Lock, Star, ChevronDown, ChevronUp, Sparkles, Share2 } from "lucide-react";
import ShareCard from "./ShareCard";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import {
  ACHIEVEMENTS,
  evaluateAchievements,
  buildAchievementContext,
  type AchievementDef,
  type UnlockedAchievement,
} from "@/lib/achievements";
import { useT } from "@/lib/i18n";

// ============================================================
// Achievement Toast — shows when a new achievement is unlocked
// ============================================================

function AchievementToast({ achievement, onClose }: { achievement: AchievementDef & { level: number }; onClose: () => void }) {
  const language = useAppStore((s) => s.language);
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-top-4 fade-in duration-500">
      <div className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-zinc-900/95 backdrop-blur-xl px-5 py-3 shadow-2xl shadow-amber-500/20">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/25">
          <span className="text-xl">{achievement.icon}</span>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
              {language === "en" ? "Achievement Unlocked!" : "成就解锁！"}
            </span>
            {achievement.level > 1 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                Lv.{achievement.level}
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-zinc-100 mt-0.5">
            {achievement.icon} {language === "en" ? achievement.title.en : achievement.title.zh}
          </p>
          <p className="text-[10px] text-zinc-500">
            {language === "en" ? achievement.description.en : achievement.description.zh}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Achievement Checker Hook — runs periodically
// ============================================================

export function useAchievementChecker() {
  const store = useAppStore();
  const prevCountRef = useRef(store.achievements.length);
  const [newAchievement, setNewAchievement] = useState<(AchievementDef & { level: number }) | null>(null);

  const checkAchievements = useCallback(() => {
    const state = useAppStore.getState();
    state.updateStreak();

    const ctx = buildAchievementContext({
      profiles: state.profiles,
      conversations: state.conversations,
      eqScores: state.eqScores,
      responseFeedback: state.responseFeedback ?? [],
      divinationRecords: state.divinationRecords,
      profileMemories: state.profileMemories,
      relationships: state.relationships,
      chatSessions: state.chatSessions ?? [],
      moduleHistory: state.moduleHistory,
      achievements: state.achievements ?? [],
      activeTab: state.activeTab,
      totalCharactersTyped: state.totalCharactersTyped,
      consecutiveDays: state.consecutiveDays,
      hasUploadedImage: state.hasUploadedImage,
    });

    const updated = evaluateAchievements(ctx, state.achievements ?? []);

    if (updated.length > (state.achievements ?? []).length) {
      // Find newly unlocked
      const existingIds = new Set((state.achievements ?? []).map((a) => `${a.id}:${a.level}`));
      const newOnes = updated.filter((a) => !existingIds.has(`${a.id}:${a.level}`));

      state.setAchievements(updated);

      // Show toast for the first new achievement
      if (newOnes.length > 0) {
        const newest = newOnes[newOnes.length - 1];
        const def = ACHIEVEMENTS.find((a) => a.id === newest.id);
        if (def) {
          setNewAchievement({ ...def, level: newest.level });
        }
      }
    }
  }, []);

  // Check on mount and when key state changes
  useEffect(() => {
    checkAchievements();
    const interval = setInterval(checkAchievements, 30000); // every 30s
    return () => clearInterval(interval);
  }, [checkAchievements]);

  // Also check when achievement-relevant state changes
  useEffect(() => {
    checkAchievements();
  }, [
    store.profiles.length,
    store.conversations.length,
    store.eqScores.length,
    store.divinationRecords.length,
    store.chatSessions?.length,
    store.responseFeedback?.length,
    store.activeTab,
    checkAchievements,
  ]);

  return {
    newAchievement,
    clearToast: () => setNewAchievement(null),
  };
}

// ============================================================
// Achievement Panel Component
// ============================================================

export default function AchievementPanel() {
  const t = useT();
  const language = useAppStore((s) => s.language);
  const achievements = useAppStore((s) => s.achievements) ?? [];
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState<"all" | "exploration" | "growth" | "hidden">("all");
  const [showShareCard, setShowShareCard] = useState(false);

  const unlockedMap = new Map<string, UnlockedAchievement>();
  for (const a of achievements) {
    unlockedMap.set(a.id, a);
  }

  const filtered = filter === "all"
    ? ACHIEVEMENTS
    : ACHIEVEMENTS.filter((a) => a.category === filter);

  const totalUnlocked = achievements.length;
  const totalPossible = ACHIEVEMENTS.reduce((sum, a) => sum + (a.maxLevel ?? 1), 0);

  const categoryLabels: Record<string, { zh: string; en: string }> = {
    all: { zh: "全部", en: "All" },
    exploration: { zh: "探索", en: "Explore" },
    growth: { zh: "成长", en: "Growth" },
    hidden: { zh: "隐藏", en: "Hidden" },
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-zinc-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Trophy className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-zinc-200">
              {language === "en" ? "Achievements" : "成就系统"}
            </h3>
            <p className="text-[10px] text-zinc-500">
              {totalUnlocked} / {totalPossible} {language === "en" ? "unlocked" : "已解锁"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Progress bar */}
          <div className="w-24 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-700"
              style={{ width: `${totalPossible > 0 ? (totalUnlocked / totalPossible) * 100 : 0}%` }}
            />
          </div>
          {expanded ? <ChevronUp className="h-4 w-4 text-zinc-500" /> : <ChevronDown className="h-4 w-4 text-zinc-500" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-zinc-800/50 px-5 py-4">
          {/* Filter tabs */}
          <div className="flex gap-1.5 mb-4">
            {(["all", "exploration", "growth", "hidden"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={cn(
                  "px-3 py-1 rounded-lg text-[10px] font-medium transition-all",
                  filter === cat
                    ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                    : "bg-zinc-800/50 text-zinc-500 hover:text-zinc-300 border border-transparent"
                )}
              >
                {language === "en" ? categoryLabels[cat].en : categoryLabels[cat].zh}
              </button>
            ))}
          </div>

          {/* Share button */}
          {totalUnlocked > 0 && (
            <div className="flex justify-end mb-3">
              <button
                onClick={() => setShowShareCard(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/15 text-violet-400 border border-violet-500/25 hover:bg-violet-600/25 text-[10px] font-medium transition-colors"
              >
                <Share2 className="h-3 w-3" />
                {language === "en" ? "Share Card" : "分享卡片"}
              </button>
            </div>
          )}

          {/* Achievement grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filtered.map((ach) => {
              const unlocked = unlockedMap.get(ach.id);
              const isLocked = !unlocked;
              const isSecret = ach.secret && isLocked;
              const maxLvl = ach.maxLevel ?? 1;
              const currentLvl = unlocked?.level ?? 0;

              return (
                <div
                  key={ach.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3 transition-all",
                    isLocked
                      ? "border-zinc-800/50 bg-zinc-900/30 opacity-60"
                      : "border-amber-500/20 bg-amber-500/5"
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center w-9 h-9 rounded-lg shrink-0",
                      isLocked
                        ? "bg-zinc-800/50 text-zinc-600"
                        : "bg-amber-500/15 border border-amber-500/20"
                    )}
                  >
                    {isSecret ? (
                      <Lock className="h-4 w-4 text-zinc-600" />
                    ) : (
                      <span className="text-lg">{ach.icon}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={cn("text-xs font-medium truncate", isLocked ? "text-zinc-500" : "text-zinc-200")}>
                        {isSecret
                          ? (language === "en" ? "???" : "???")
                          : (language === "en" ? ach.title.en : ach.title.zh)}
                      </span>
                      {maxLvl > 1 && !isLocked && (
                        <div className="flex gap-0.5">
                          {Array.from({ length: maxLvl }, (_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                "h-2.5 w-2.5",
                                i < currentLvl ? "text-amber-400 fill-amber-400" : "text-zinc-700"
                              )}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <p className={cn("text-[9px] mt-0.5", isLocked ? "text-zinc-600" : "text-zinc-500")}>
                      {isSecret
                        ? (language === "en" ? "Keep exploring to discover..." : "继续探索以解锁...")
                        : (language === "en" ? ach.description.en : ach.description.zh)}
                    </p>
                    {unlocked && (
                      <p className="text-[8px] text-zinc-600 mt-0.5">
                        {new Date(unlocked.unlockedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <ShareCard
        isOpen={showShareCard}
        onClose={() => setShowShareCard(false)}
        type="achievement"
      />
    </div>
  );
}
