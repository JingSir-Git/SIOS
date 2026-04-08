"use client";

import { useState, useMemo } from "react";
import {
  GitMerge,
  AlertTriangle,
  ChevronRight,
  X,
  Check,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

/**
 * Detects potential duplicate profiles using fuzzy name matching.
 * Returns pairs of profiles that might be the same person.
 */
function detectDuplicates(profiles: { id: string; name: string }[]) {
  const pairs: { a: typeof profiles[0]; b: typeof profiles[0]; reason: string }[] = [];

  for (let i = 0; i < profiles.length; i++) {
    for (let j = i + 1; j < profiles.length; j++) {
      const a = profiles[i];
      const b = profiles[j];
      const nameA = a.name.toLowerCase().trim();
      const nameB = b.name.toLowerCase().trim();

      // Exact match (shouldn't happen but safety)
      if (nameA === nameB) {
        pairs.push({ a, b, reason: "名称完全相同" });
        continue;
      }

      // One contains the other (e.g. "王总" and "王总监")
      if (nameA.includes(nameB) || nameB.includes(nameA)) {
        pairs.push({ a, b, reason: "名称相似（包含关系）" });
        continue;
      }

      // Same surname + similar length (Chinese names)
      if (nameA.length >= 2 && nameB.length >= 2 && nameA[0] === nameB[0]) {
        // Same first char and both short names — likely same person with different titles
        if (nameA.length <= 4 && nameB.length <= 4) {
          // Check if they share at least 2 characters
          const charsA = new Set(nameA.split(""));
          const common = nameB.split("").filter((c) => charsA.has(c)).length;
          if (common >= 2) {
            pairs.push({ a, b, reason: "同姓且名称相近" });
            continue;
          }
        }
      }

      // Edit distance check for short names
      if (nameA.length <= 6 && nameB.length <= 6) {
        const dist = levenshtein(nameA, nameB);
        if (dist === 1) {
          pairs.push({ a, b, reason: "名称仅一字之差" });
        }
      }
    }
  }

  return pairs;
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[m][n];
}

export default function ProfileMerge({ onClose }: { onClose: () => void }) {
  const { profiles, mergeProfiles } = useAppStore();
  const [confirmPair, setConfirmPair] = useState<{ keepId: string; mergeId: string } | null>(null);
  const [merged, setMerged] = useState<string[]>([]);

  const duplicates = useMemo(
    () => detectDuplicates(profiles).filter(
      (d) => !merged.includes(d.a.id) && !merged.includes(d.b.id)
    ),
    [profiles, merged]
  );

  const handleMerge = (keepId: string, mergeId: string) => {
    mergeProfiles(keepId, mergeId);
    setMerged((prev) => [...prev, mergeId]);
    setConfirmPair(null);
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-sm overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <GitMerge className="h-4 w-4 text-violet-400" />
          <h3 className="text-sm font-medium text-zinc-200">
            画像去重合并
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-4 max-h-[360px] overflow-y-auto">
        {duplicates.length === 0 ? (
          <div className="text-center py-6">
            <Check className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-[11px] text-zinc-400">未检测到疑似重复的画像</p>
            <p className="text-[10px] text-zinc-600 mt-1">所有联系人名称均不相似</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-[10px] text-zinc-500">
              检测到 {duplicates.length} 组可能重复的画像，请确认是否合并：
            </p>
            {duplicates.map((pair, idx) => {
              const isConfirming = confirmPair?.keepId === pair.a.id && confirmPair?.mergeId === pair.b.id;
              return (
                <div
                  key={idx}
                  className="rounded-lg border border-zinc-700/50 bg-zinc-800/30 p-3"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0" />
                    <span className="text-[10px] text-amber-300">{pair.reason}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2">
                      <span className="text-xs font-medium text-zinc-200">{pair.a.name}</span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
                    <div className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2">
                      <span className="text-xs font-medium text-zinc-200">{pair.b.name}</span>
                    </div>
                  </div>

                  {isConfirming ? (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] text-amber-300 flex-1">
                        确认合并？将保留「{pair.a.name}」，删除「{pair.b.name}」
                      </span>
                      <button
                        onClick={() => handleMerge(pair.a.id, pair.b.id)}
                        className="px-2 py-1 rounded text-[10px] bg-violet-500/20 text-violet-300 hover:bg-violet-500/30"
                      >
                        确认
                      </button>
                      <button
                        onClick={() => setConfirmPair(null)}
                        className="px-2 py-1 rounded text-[10px] bg-zinc-700 text-zinc-400 hover:bg-zinc-600"
                      >
                        取消
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => setConfirmPair({ keepId: pair.a.id, mergeId: pair.b.id })}
                        className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2 py-1.5 text-[10px] text-violet-300 hover:bg-violet-500/20 transition-colors"
                      >
                        <GitMerge className="h-3 w-3" />
                        保留「{pair.a.name}」合并
                      </button>
                      <button
                        onClick={() => setConfirmPair({ keepId: pair.b.id, mergeId: pair.a.id })}
                        className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2 py-1.5 text-[10px] text-violet-300 hover:bg-violet-500/20 transition-colors"
                      >
                        <GitMerge className="h-3 w-3" />
                        保留「{pair.b.name}」合并
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
