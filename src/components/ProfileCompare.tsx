"use client";

import { useState, useMemo } from "react";
import {
  GitCompareArrows,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  MessageSquare,
  Shield,
  AlertTriangle,
  Heart,
  Lightbulb,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import type { PersonProfile, DimensionKey } from "@/lib/types";
import { DIMENSION_LABELS, DIMENSION_KEYS } from "@/lib/types";

// ---- Comparison Analysis ----

interface ComparisonResult {
  dimensionDiffs: {
    key: DimensionKey;
    label: string;
    valueA: number;
    valueB: number;
    diff: number;
    insight: string;
  }[];
  compatibilityScore: number;
  strengths: string[];
  risks: string[];
  communicationTips: string[];
  dynamicSummary: string;
}

function analyzeComparison(a: PersonProfile, b: PersonProfile): ComparisonResult {
  // Dimension differences
  const dimensionDiffs = DIMENSION_KEYS.map((key) => {
    const valA = a.dimensions[key]?.value ?? 50;
    const valB = b.dimensions[key]?.value ?? 50;
    const diff = valA - valB;
    const label = DIMENSION_LABELS[key].zh;

    let insight = "";
    const absDiff = Math.abs(diff);
    if (absDiff <= 10) {
      insight = `两人${label}接近，容易达成共识`;
    } else if (absDiff <= 25) {
      insight = diff > 0
        ? `${a.name}更${getHighLabel(key)}，${b.name}相对温和`
        : `${b.name}更${getHighLabel(key)}，${a.name}相对温和`;
    } else {
      insight = diff > 0
        ? `${a.name}的${label}显著高于${b.name}，互动中可能有张力`
        : `${b.name}的${label}显著高于${a.name}，互动中可能有张力`;
    }

    return { key, label, valueA: valA, valueB: valB, diff, insight };
  });

  // Compatibility score
  const avgDiff = dimensionDiffs.reduce((s, d) => s + Math.abs(d.diff), 0) / dimensionDiffs.length;
  const baseCompat = Math.max(20, Math.min(95, 85 - avgDiff * 0.8));

  // Bonus for complementary traits
  const assertDiff = Math.abs((a.dimensions.assertiveness?.value ?? 50) - (b.dimensions.assertiveness?.value ?? 50));
  const coopSum = (a.dimensions.cooperativeness?.value ?? 50) + (b.dimensions.cooperativeness?.value ?? 50);
  const empathySum = (a.dimensions.empathy?.value ?? 50) + (b.dimensions.empathy?.value ?? 50);
  const complementBonus = (assertDiff > 20 && coopSum > 100 ? 5 : 0) + (empathySum > 120 ? 5 : 0);
  const compatibilityScore = Math.round(Math.min(95, baseCompat + complementBonus));

  // Strengths
  const strengths: string[] = [];
  const closeTraits = dimensionDiffs.filter((d) => Math.abs(d.diff) <= 10);
  if (closeTraits.length >= 3) {
    strengths.push(`在${closeTraits.slice(0, 3).map((d) => d.label).join("、")}等方面高度一致，沟通基础好`);
  }
  if (coopSum > 120) strengths.push("双方合作倾向都较高，容易协同");
  if (empathySum > 110) strengths.push("双方共情能力都不错，有助于深层理解");

  const aStyle = a.communicationStyle?.overallType;
  const bStyle = b.communicationStyle?.overallType;
  if (aStyle && bStyle) {
    strengths.push(`${a.name}是「${aStyle}」，${b.name}是「${bStyle}」`);
  }

  // Risks
  const risks: string[] = [];
  const bigDiffs = dimensionDiffs.filter((d) => Math.abs(d.diff) > 25);
  for (const d of bigDiffs.slice(0, 3)) {
    risks.push(`${d.label}差异较大（${d.valueA} vs ${d.valueB}），${d.insight}`);
  }

  const aTriggers = a.communicationStyle?.triggerPoints || [];
  const bTriggers = b.communicationStyle?.triggerPoints || [];
  if (aTriggers.length > 0 || bTriggers.length > 0) {
    risks.push(`注意情绪触发点：${a.name}[${aTriggers.slice(0, 2).join("、") || "未知"}]，${b.name}[${bTriggers.slice(0, 2).join("、") || "未知"}]`);
  }

  // Communication tips
  const tips: string[] = [];
  const aAssert = a.dimensions.assertiveness?.value ?? 50;
  const bAssert = b.dimensions.assertiveness?.value ?? 50;
  if (Math.abs(aAssert - bAssert) > 20) {
    const stronger = aAssert > bAssert ? a.name : b.name;
    const softer = aAssert > bAssert ? b.name : a.name;
    tips.push(`与${stronger}沟通时直奔主题，与${softer}沟通时先建立情感连接`);
  }

  const aOpen = a.dimensions.openness?.value ?? 50;
  const bOpen = b.dimensions.openness?.value ?? 50;
  if (aOpen > 70 && bOpen > 70) {
    tips.push("双方都比较开放，可以大胆尝试新话题和创意方案");
  } else if (aOpen < 40 || bOpen < 40) {
    const conservative = aOpen < bOpen ? a.name : b.name;
    tips.push(`${conservative}偏保守，引入变化时需要循序渐进`);
  }

  const aConflict = a.patterns?.conflictStyle || "";
  const bConflict = b.patterns?.conflictStyle || "";
  if (aConflict && bConflict) {
    tips.push(`冲突处理：${a.name}[${aConflict}] vs ${b.name}[${bConflict}]`);
  }

  if (tips.length < 3) {
    tips.push("在重要话题上，建议先了解对方立场再表达自己的观点");
  }

  // Summary
  const compatWord = compatibilityScore > 70 ? "较好" : compatibilityScore > 50 ? "一般" : "有挑战";
  const dynamicSummary = `${a.name}与${b.name}的沟通兼容度${compatWord}（${compatibilityScore}分）。` +
    (strengths[0] ? strengths[0] + "。" : "") +
    (risks[0] ? `但需注意：${risks[0]}。` : "");

  return {
    dimensionDiffs,
    compatibilityScore,
    strengths,
    risks,
    communicationTips: tips,
    dynamicSummary,
  };
}

function getHighLabel(key: DimensionKey): string {
  const map: Record<DimensionKey, string> = {
    assertiveness: "强势",
    cooperativeness: "合作",
    decisionSpeed: "果断",
    emotionalStability: "稳定",
    openness: "开放",
    empathy: "共情",
    riskTolerance: "冒险",
    formalityLevel: "正式",
  };
  return map[key] || "突出";
}

// ---- Component ----

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileCompare({ isOpen, onClose }: Props) {
  const { profiles } = useAppStore();
  const [profileAId, setProfileAId] = useState("");
  const [profileBId, setProfileBId] = useState("");

  const profileA = profiles.find((p) => p.id === profileAId);
  const profileB = profiles.find((p) => p.id === profileBId);

  const comparison = useMemo(() => {
    if (!profileA || !profileB || profileA.id === profileB.id) return null;
    return analyzeComparison(profileA, profileB);
  }, [profileA, profileB]);

  if (!isOpen) return null;

  const availableForB = profiles.filter((p) => p.id !== profileAId);
  const availableForA = profiles.filter((p) => p.id !== profileBId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4">
      <div className="w-full max-w-3xl h-full md:h-auto md:max-h-[85vh] rounded-none md:rounded-2xl border-0 md:border border-zinc-700/80 bg-zinc-900 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <GitCompareArrows className="h-5 w-5 text-violet-400" />
            <h2 className="text-sm font-semibold text-zinc-200">画像对比</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Selectors */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4 px-6 py-4 border-b border-zinc-800 shrink-0">
          <div className="flex-1">
            <label className="text-[10px] text-zinc-500 mb-1 block">人物 A</label>
            <div className="relative">
              <select
                value={profileAId}
                onChange={(e) => setProfileAId(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-xs text-zinc-300 appearance-none pr-8 focus:outline-none focus:border-violet-500/50"
              >
                <option value="">选择人物...</option>
                {availableForA.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500 pointer-events-none" />
            </div>
          </div>

          <div className="hidden md:block pt-5">
            <GitCompareArrows className="h-4 w-4 text-zinc-600" />
          </div>

          <div className="flex-1">
            <label className="text-[10px] text-zinc-500 mb-1 block">人物 B</label>
            <div className="relative">
              <select
                value={profileBId}
                onChange={(e) => setProfileBId(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-xs text-zinc-300 appearance-none pr-8 focus:outline-none focus:border-violet-500/50"
              >
                <option value="">选择人物...</option>
                {availableForB.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {!profileA || !profileB ? (
            <div className="text-center py-16">
              <Users className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-xs text-zinc-500">请选择两个人物画像进行对比</p>
              <p className="text-[10px] text-zinc-600 mt-1">对比将展示维度差异、兼容度分析和沟通建议</p>
            </div>
          ) : profileA.id === profileB.id ? (
            <div className="text-center py-16">
              <AlertTriangle className="h-8 w-8 text-amber-500/50 mx-auto mb-3" />
              <p className="text-xs text-zinc-500">请选择两个不同的人物</p>
            </div>
          ) : comparison ? (
            <div className="space-y-6">
              {/* Summary */}
              <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
                <p className="text-[11px] text-zinc-300 leading-relaxed">{comparison.dynamicSummary}</p>
              </div>

              {/* Compatibility Score */}
              <div className="flex items-center justify-center gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-violet-400">{comparison.compatibilityScore}</div>
                  <p className="text-[10px] text-zinc-500 mt-1">兼容度评分</p>
                </div>
                <div className="h-12 w-px bg-zinc-800" />
                <div className="flex gap-6 text-center">
                  <div>
                    <p className="text-sm font-medium text-zinc-300">{profileA.name}</p>
                    <p className="text-[9px] text-zinc-600">{profileA.communicationStyle?.overallType || "未知风格"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-300">{profileB.name}</p>
                    <p className="text-[9px] text-zinc-600">{profileB.communicationStyle?.overallType || "未知风格"}</p>
                  </div>
                </div>
              </div>

              {/* Dimension Comparison Bars */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">八维对比</h4>
                {comparison.dimensionDiffs.map((d) => {
                  const maxVal = Math.max(d.valueA, d.valueB, 1);
                  const barWidthA = (d.valueA / 100) * 100;
                  const barWidthB = (d.valueB / 100) * 100;
                  return (
                    <div key={d.key} className="rounded-lg border border-zinc-800 bg-zinc-800/20 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-medium text-zinc-300">{d.label}</span>
                        <span className="text-[9px] text-zinc-600">
                          {d.valueA} vs {d.valueB}
                          {Math.abs(d.diff) > 0 && (
                            <span className={cn("ml-1", d.diff > 10 ? "text-violet-400" : d.diff < -10 ? "text-pink-400" : "text-zinc-600")}>
                              ({d.diff > 0 ? "+" : ""}{d.diff})
                            </span>
                          )}
                        </span>
                      </div>
                      {/* Double bar */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] text-violet-400 w-10 shrink-0 text-right">{profileA.name.slice(0, 3)}</span>
                          <div className="flex-1 h-2 rounded-full bg-zinc-800 overflow-hidden">
                            <div className="h-full rounded-full bg-violet-500/60" style={{ width: `${barWidthA}%` }} />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] text-pink-400 w-10 shrink-0 text-right">{profileB.name.slice(0, 3)}</span>
                          <div className="flex-1 h-2 rounded-full bg-zinc-800 overflow-hidden">
                            <div className="h-full rounded-full bg-pink-500/60" style={{ width: `${barWidthB}%` }} />
                          </div>
                        </div>
                      </div>
                      <p className="text-[9px] text-zinc-500 mt-1.5">{d.insight}</p>
                    </div>
                  );
                })}
              </div>

              {/* Strengths & Risks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {comparison.strengths.length > 0 && (
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Heart className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-[10px] font-medium text-emerald-300">互动优势</span>
                    </div>
                    <ul className="space-y-1.5">
                      {comparison.strengths.map((s, i) => (
                        <li key={i} className="text-[10px] text-zinc-400 leading-relaxed flex gap-1.5">
                          <span className="text-emerald-500 shrink-0 mt-0.5">·</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {comparison.risks.length > 0 && (
                  <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                      <span className="text-[10px] font-medium text-red-300">潜在风险</span>
                    </div>
                    <ul className="space-y-1.5">
                      {comparison.risks.map((r, i) => (
                        <li key={i} className="text-[10px] text-zinc-400 leading-relaxed flex gap-1.5">
                          <span className="text-red-500 shrink-0 mt-0.5">·</span>
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Communication Tips */}
              {comparison.communicationTips.length > 0 && (
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                    <span className="text-[10px] font-medium text-amber-300">沟通建议</span>
                  </div>
                  <ul className="space-y-1.5">
                    {comparison.communicationTips.map((t, i) => (
                      <li key={i} className="text-[10px] text-zinc-400 leading-relaxed flex gap-1.5">
                        <span className="text-amber-500 shrink-0 mt-0.5">{i + 1}.</span>
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
