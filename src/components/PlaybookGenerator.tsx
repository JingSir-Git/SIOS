"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import {
  BookOpen,
  Loader2,
  Copy,
  Check,
  Download,
  X,
  ChevronDown,
  ChevronRight,
  Shield,
  AlertTriangle,
  Zap,
  Target,
  Heart,
  MessageCircle,
  Users,
  Lightbulb,
  Star,
  Flame,
  TrendingUp,
  History,
  GitCompare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import StreamingIndicator from "./StreamingIndicator";
import type { PersonProfile, ConversationSession } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

// ---- Playbook types ----
interface GoldenRule {
  rule: string;
  rationale: string;
  example: string;
}
interface TriggerPositive {
  trigger: string;
  howToActivate: string;
  samplePhrase: string;
}
interface TriggerNegative {
  trigger: string;
  whyDangerous: string;
  recovery: string;
}
interface ScenarioPlaybook {
  scenario: string;
  bestApproach: string;
  openingLines: string[];
  keyPhrases: string[];
  thingsToAvoid: string[];
  successIndicators: string;
}
interface PlaybookResult {
  targetName: string;
  generatedAt: string;
  executiveSummary: string;
  personalitySnapshot: {
    coreDrivers: string[];
    decisionStyle: string;
    emotionalProfile: string;
    communicationDNA: string;
  };
  goldenRules: GoldenRule[];
  triggerMap: {
    positive: TriggerPositive[];
    negative: TriggerNegative[];
  };
  scenarioPlaybooks: ScenarioPlaybook[];
  persuasionGuide: {
    primaryLever: string;
    argumentStructure: string;
    timingAdvice: string;
    resistanceHandling: string;
  };
  conflictResolution: {
    conflictStyle: string;
    deescalationTactics: string[];
    repairSequence: string[];
    boundaryScript: string;
  };
  relationshipMaintenance: {
    optimalContactFrequency: string;
    bestTopics: string[];
    giftAndGesture: string;
    longTermStrategy: string;
  };
  confidenceNotes: {
    highConfidence: string[];
    needsMoreData: string[];
    dataGaps: string[];
  };
}

interface Props {
  profile: PersonProfile;
  linkedConversations: ConversationSession[];
  isOpen: boolean;
  onClose: () => void;
}

function playbookToMarkdown(pb: PlaybookResult): string {
  const lines: string[] = [];
  lines.push(`# 沟通手册：${pb.targetName}`);
  lines.push(`> ${pb.executiveSummary}`);
  lines.push(`\n*生成时间：${new Date(pb.generatedAt || Date.now()).toLocaleString("zh-CN")}*\n`);

  lines.push(`## 人格速写`);
  lines.push(`### 核心驱动力`);
  pb.personalitySnapshot.coreDrivers.forEach((d) => lines.push(`- ${d}`));
  lines.push(`### 决策风格\n${pb.personalitySnapshot.decisionStyle}`);
  lines.push(`### 情绪画像\n${pb.personalitySnapshot.emotionalProfile}`);
  lines.push(`### 沟通基因\n${pb.personalitySnapshot.communicationDNA}`);

  lines.push(`\n## 黄金法则`);
  pb.goldenRules.forEach((r, i) => {
    lines.push(`### ${i + 1}. ${r.rule}`);
    lines.push(`**原因：** ${r.rationale}`);
    lines.push(`**示例：** ${r.example}`);
  });

  lines.push(`\n## 触发点地图`);
  lines.push(`### ✅ 正面触发`);
  pb.triggerMap.positive.forEach((t) => {
    lines.push(`- **${t.trigger}**`);
    lines.push(`  - 激活方式：${t.howToActivate}`);
    lines.push(`  - 示例话术：「${t.samplePhrase}」`);
  });
  lines.push(`### ⛔ 负面雷区`);
  pb.triggerMap.negative.forEach((t) => {
    lines.push(`- **${t.trigger}**`);
    lines.push(`  - 危险原因：${t.whyDangerous}`);
    lines.push(`  - 补救策略：${t.recovery}`);
  });

  lines.push(`\n## 场景剧本`);
  pb.scenarioPlaybooks.forEach((s) => {
    lines.push(`### ${s.scenario}`);
    lines.push(`**最佳策略：** ${s.bestApproach}`);
    lines.push(`**开场白：**`);
    s.openingLines.forEach((l) => lines.push(`- 「${l}」`));
    lines.push(`**关键话术：**`);
    s.keyPhrases.forEach((p) => lines.push(`- 「${p}」`));
    lines.push(`**避免事项：**`);
    s.thingsToAvoid.forEach((a) => lines.push(`- ${a}`));
    lines.push(`**成功指标：** ${s.successIndicators}`);
  });

  lines.push(`\n## 说服指南`);
  lines.push(`- **主要杠杆：** ${pb.persuasionGuide.primaryLever}`);
  lines.push(`- **论证结构：** ${pb.persuasionGuide.argumentStructure}`);
  lines.push(`- **时机建议：** ${pb.persuasionGuide.timingAdvice}`);
  lines.push(`- **抵触应对：** ${pb.persuasionGuide.resistanceHandling}`);

  lines.push(`\n## 冲突解决`);
  lines.push(`**冲突风格：** ${pb.conflictResolution.conflictStyle}`);
  lines.push(`**降温策略：**`);
  pb.conflictResolution.deescalationTactics.forEach((t) => lines.push(`- ${t}`));
  lines.push(`**修复步骤：**`);
  pb.conflictResolution.repairSequence.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
  lines.push(`**边界话术：** 「${pb.conflictResolution.boundaryScript}」`);

  lines.push(`\n## 关系维护`);
  lines.push(`- **最佳联系频率：** ${pb.relationshipMaintenance.optimalContactFrequency}`);
  lines.push(`- **适合话题：** ${pb.relationshipMaintenance.bestTopics.join("、")}`);
  lines.push(`- **感动举动：** ${pb.relationshipMaintenance.giftAndGesture}`);
  lines.push(`- **长期策略：** ${pb.relationshipMaintenance.longTermStrategy}`);

  lines.push(`\n## 置信度说明`);
  lines.push(`### 高置信度结论`);
  pb.confidenceNotes.highConfidence.forEach((c) => lines.push(`- ✅ ${c}`));
  lines.push(`### 需验证推测`);
  pb.confidenceNotes.needsMoreData.forEach((c) => lines.push(`- ⚠️ ${c}`));
  lines.push(`### 数据缺口`);
  pb.confidenceNotes.dataGaps.forEach((c) => lines.push(`- ❓ ${c}`));

  return lines.join("\n");
}

// ---- Inline Diff Component ----
function PlaybookDiffView({ current, previous, previousDate, onClose }: {
  current: PlaybookResult;
  previous: PlaybookResult;
  previousDate: string;
  onClose: () => void;
}) {
  const diffItems: { label: string; currentVal: string; previousVal: string; changed: boolean }[] = [];

  const addDiff = (label: string, getCurrent: () => string, getPrevious: () => string) => {
    const c = getCurrent();
    const p = getPrevious();
    diffItems.push({ label, currentVal: c, previousVal: p, changed: c !== p });
  };

  addDiff("核心摘要", () => current.executiveSummary || "", () => previous.executiveSummary || "");
  addDiff("决策风格", () => current.personalitySnapshot?.decisionStyle || "", () => previous.personalitySnapshot?.decisionStyle || "");
  addDiff("情绪画像", () => current.personalitySnapshot?.emotionalProfile || "", () => previous.personalitySnapshot?.emotionalProfile || "");
  addDiff("沟通基因", () => current.personalitySnapshot?.communicationDNA || "", () => previous.personalitySnapshot?.communicationDNA || "");
  addDiff("黄金法则数", () => `${current.goldenRules?.length || 0}条`, () => `${previous.goldenRules?.length || 0}条`);
  addDiff("正面触发点数", () => `${current.triggerMap?.positive?.length || 0}个`, () => `${previous.triggerMap?.positive?.length || 0}个`);
  addDiff("负面雷区数", () => `${current.triggerMap?.negative?.length || 0}个`, () => `${previous.triggerMap?.negative?.length || 0}个`);
  addDiff("场景剧本数", () => `${current.scenarioPlaybooks?.length || 0}个`, () => `${previous.scenarioPlaybooks?.length || 0}个`);
  addDiff("说服主杠杆", () => current.persuasionGuide?.primaryLever || "", () => previous.persuasionGuide?.primaryLever || "");
  addDiff("冲突风格", () => current.conflictResolution?.conflictStyle || "", () => previous.conflictResolution?.conflictStyle || "");
  addDiff("最佳联系频率", () => current.relationshipMaintenance?.optimalContactFrequency || "", () => previous.relationshipMaintenance?.optimalContactFrequency || "");
  addDiff("长期策略", () => current.relationshipMaintenance?.longTermStrategy || "", () => previous.relationshipMaintenance?.longTermStrategy || "");

  // Golden rules diff
  const currentRules = (current.goldenRules || []).map((r) => r.rule);
  const previousRules = (previous.goldenRules || []).map((r) => r.rule);
  const addedRules = currentRules.filter((r) => !previousRules.includes(r));
  const removedRules = previousRules.filter((r) => !currentRules.includes(r));

  const changedCount = diffItems.filter((d) => d.changed).length;

  return (
    <div className="rounded-lg border border-violet-500/20 bg-zinc-800/60 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitCompare className="h-3.5 w-3.5 text-violet-400" />
          <span className="text-xs font-medium text-zinc-300">版本对比</span>
          <span className="text-[9px] text-zinc-500">
            vs {new Date(previousDate).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })}
          </span>
          <span className={cn(
            "text-[9px] px-1.5 py-0.5 rounded",
            changedCount > 3 ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"
          )}>
            {changedCount}项变化
          </span>
        </div>
        <button onClick={onClose} className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700 transition-colors">
          <X className="h-3 w-3" />
        </button>
      </div>

      <div className="space-y-1.5">
        {diffItems.filter((d) => d.changed).map((d, i) => (
          <div key={i} className="rounded border border-zinc-700 p-2 space-y-1">
            <span className="text-[10px] font-medium text-zinc-400">{d.label}</span>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded bg-red-500/5 border border-red-500/10 p-1.5">
                <span className="text-[8px] text-red-400 block mb-0.5">旧版</span>
                <p className="text-[10px] text-zinc-400 line-clamp-2">{d.previousVal || "（空）"}</p>
              </div>
              <div className="rounded bg-emerald-500/5 border border-emerald-500/10 p-1.5">
                <span className="text-[8px] text-emerald-400 block mb-0.5">新版</span>
                <p className="text-[10px] text-zinc-300 line-clamp-2">{d.currentVal || "（空）"}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Golden rules changes */}
      {(addedRules.length > 0 || removedRules.length > 0) && (
        <div className="rounded border border-zinc-700 p-2 space-y-1">
          <span className="text-[10px] font-medium text-zinc-400">黄金法则变化</span>
          {addedRules.map((r, i) => (
            <p key={`add-${i}`} className="text-[10px] text-emerald-400">+ {r}</p>
          ))}
          {removedRules.map((r, i) => (
            <p key={`rm-${i}`} className="text-[10px] text-red-400 line-through">- {r}</p>
          ))}
        </div>
      )}

      {changedCount === 0 && (
        <p className="text-[10px] text-zinc-600 text-center py-2">两个版本之间没有显著差异</p>
      )}
    </div>
  );
}

export default function PlaybookGenerator({ profile, linkedConversations, isOpen, onClose }: Props) {
  const { relationships, getActiveMemoriesForProfile, addToast, addPlaybookVersion, getPlaybookVersions } = useAppStore();
  const [showVersions, setShowVersions] = useState(false);
  const [compareIdx, setCompareIdx] = useState<number | null>(null);
  const versions = useMemo(() => getPlaybookVersions(profile.id), [getPlaybookVersions, profile.id]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PlaybookResult | null>(null);
  const [streamingText, setStreamingText] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["summary", "golden", "triggers", "scenarios"]));
  const abortRef = useRef<AbortController | null>(null);

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const generatePlaybook = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    setStreamingText("");

    try {
      // Gather all data
      const profileData = JSON.stringify({
        name: profile.name,
        dimensions: profile.dimensions,
        communicationStyle: profile.communicationStyle,
        patterns: profile.patterns,
        tags: profile.tags,
        notes: profile.notes,
        subjectiveImpression: profile.subjectiveImpression,
        conversationCount: profile.conversationCount,
      }, null, 2);

      const convoSummaries = linkedConversations
        .filter((c) => c.analysis)
        .map((c) => ({
          date: c.createdAt,
          title: c.title,
          summary: c.analysis?.summary,
          strategicInsights: c.analysis?.strategicInsights,
          keyMoments: c.analysis?.keyMoments?.map((km) => km.description),
          emotionTrend: c.analysis?.emotionCurve?.length
            ? `${c.analysis.emotionCurve[0]?.label} → ${c.analysis.emotionCurve[c.analysis.emotionCurve.length - 1]?.label}`
            : undefined,
        }))
        .slice(0, 20); // Limit to recent 20

      const memories = getActiveMemoriesForProfile(profile.id);
      const memoriesStr = memories.length > 0
        ? memories.map((m) => `[${m.category}] ${m.content} (重要度: ${m.importance})`).join("\n")
        : "";

      const rel = relationships.find((r) => r.profileId === profile.id);
      const relStr = rel
        ? JSON.stringify({
            status: rel.status,
            trustLevel: rel.trustLevel,
            healthScore: rel.healthScore,
            contactFrequency: rel.contactFrequency,
            unresolvedIssues: rel.unresolvedIssues,
          }, null, 2)
        : "";

      const controller = new AbortController();
      abortRef.current = controller;

      const res = await fetch("/api/playbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileData,
          conversationSummaries: JSON.stringify(convoSummaries, null, 2),
          memories: memoriesStr,
          relationshipData: relStr,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        let errMsg = `API error: ${res.status}`;
        try { const d = await res.json(); if (d.error) errMsg = d.error; } catch { /* use default */ }
        throw new Error(errMsg);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("无法读取响应流");
      const decoder = new TextDecoder();
      let buffer = "";
      let gotResult = false;
      let streamError = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6).trim());
            if (event.type === "progress" && event.text) {
              setStreamingText((prev) => prev + event.text);
            } else if (event.type === "result" && event.data) {
              gotResult = true;
              const pbResult = event.data as PlaybookResult;
              setResult(pbResult);
              setExpandedSections(new Set(["summary", "personality", "golden", "triggers", "scenarios", "persuasion", "conflict", "maintenance", "confidence"]));
              // Save to playbook version history
              addPlaybookVersion({
                id: uuidv4(),
                profileId: profile.id,
                profileName: profile.name,
                createdAt: new Date().toISOString(),
                result: pbResult as unknown as Record<string, unknown>,
                summary: pbResult.executiveSummary?.slice(0, 80) || "沟通手册",
                conversationCount: linkedConversations.filter((c) => c.analysis).length,
              });
            } else if (event.type === "error") {
              streamError = event.text || "生成失败";
            }
          } catch { /* skip malformed SSE line */ }
        }
      }

      if (!gotResult) {
        setError(streamError || "手册生成未返回结果，请重试");
      } else {
        const currentTab = useAppStore.getState().activeTab;
        if (currentTab !== "profiles") {
          addToast({
            type: "success",
            title: "沟通手册已生成",
            message: `${profile.name}的个性化沟通手册已就绪`,
            duration: 8000,
            action: { label: "查看手册", tab: "profiles" },
          });
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "未知错误");
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const abortGeneration = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setLoading(false);
  }, []);

  const copyMarkdown = () => {
    if (!result) return;
    navigator.clipboard.writeText(playbookToMarkdown(result));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadMarkdown = () => {
    if (!result) return;
    const md = playbookToMarkdown(result);
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `沟通手册_${result.targetName}_${new Date().toISOString().split("T")[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="rounded-xl border border-amber-500/20 bg-zinc-900/80 overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-medium text-zinc-200">
            AI 沟通手册
          </h3>
          <span className="text-[10px] text-zinc-600">
            基于全部历史数据为 {profile.name} 定制
          </span>
        </div>
        <div className="flex items-center gap-1">
          {result && (
            <>
              <button
                onClick={copyMarkdown}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                {copied ? "已复制" : "复制 MD"}
              </button>
              <button
                onClick={downloadMarkdown}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                <Download className="h-3 w-3" />
                下载
              </button>
            </>
          )}
          {versions.length > 0 && (
            <button
              onClick={() => setShowVersions(!showVersions)}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] transition-colors",
                showVersions ? "text-violet-300 bg-violet-500/10" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              )}
            >
              <History className="h-3 w-3" />
              {versions.length}个版本
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
        {/* Version History Panel */}
        {showVersions && versions.length > 0 && (
          <div className="rounded-lg border border-violet-500/20 bg-zinc-800/40 p-3 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <GitCompare className="h-3.5 w-3.5 text-violet-400" />
              <span className="text-xs font-medium text-zinc-300">版本历史</span>
              <span className="text-[9px] text-zinc-600">点击加载历史版本，或选择对比</span>
            </div>
            {versions.map((v, i) => (
              <div
                key={v.id}
                className={cn(
                  "flex items-center justify-between rounded-lg border p-2 transition-colors",
                  compareIdx === i
                    ? "border-violet-500/40 bg-violet-500/10"
                    : "border-zinc-700 hover:border-zinc-600 bg-zinc-900/50"
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-400">
                      {new Date(v.createdAt).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric", hour: "numeric", minute: "numeric" })}
                    </span>
                    <span className="text-[9px] text-zinc-600">{v.conversationCount}条对话</span>
                    {i === 0 && <span className="text-[8px] px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">最新</span>}
                  </div>
                  <p className="text-[10px] text-zinc-500 truncate mt-0.5">{v.summary}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button
                    onClick={() => {
                      setResult(v.result as unknown as PlaybookResult);
                      setExpandedSections(new Set(["summary", "personality", "golden", "triggers", "scenarios", "persuasion", "conflict", "maintenance", "confidence"]));
                    }}
                    className="text-[9px] px-2 py-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
                  >
                    加载
                  </button>
                  {result && i > 0 && (
                    <button
                      onClick={() => setCompareIdx(compareIdx === i ? null : i)}
                      className={cn(
                        "text-[9px] px-2 py-1 rounded transition-colors",
                        compareIdx === i ? "text-violet-300 bg-violet-500/20" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700"
                      )}
                    >
                      对比
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Diff View */}
        {compareIdx !== null && compareIdx < versions.length && result && (
          <PlaybookDiffView
            current={result}
            previous={versions[compareIdx].result as unknown as PlaybookResult}
            previousDate={versions[compareIdx].createdAt}
            onClose={() => setCompareIdx(null)}
          />
        )}

        {/* Generate Button */}
        {!result && !loading && (
          <div className="text-center py-6">
            <BookOpen className="h-10 w-10 text-amber-500/30 mx-auto mb-3" />
            <p className="text-xs text-zinc-400 mb-1">
              基于 {profile.conversationCount} 次对话、{linkedConversations.filter((c) => c.analysis).length} 条分析记录
            </p>
            <p className="text-[10px] text-zinc-600 mb-4">
              生成一份完整的个性化沟通策略手册，包含黄金法则、场景剧本、说服指南等
            </p>
            <button
              onClick={generatePlaybook}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2.5 text-xs font-medium text-white hover:bg-amber-500 transition-colors shadow-lg shadow-amber-500/20"
            >
              <Zap className="h-3.5 w-3.5" />
              生成沟通手册
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            <StreamingIndicator
              text={streamingText}
              onAbort={abortGeneration}
              label="正在生成沟通手册..."
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
            <p className="text-xs text-red-400">{error}</p>
            <button
              onClick={generatePlaybook}
              className="mt-2 text-[10px] text-red-300 underline hover:text-red-200"
            >
              重新生成
            </button>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-3">
            {/* Executive Summary */}
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-medium text-amber-300">核心策略</span>
              </div>
              <p className="text-sm text-zinc-200 font-medium">{result.executiveSummary}</p>
            </div>

            {/* Personality Snapshot */}
            <SectionAccordion
              title="人格速写"
              icon={<Users className="h-3.5 w-3.5 text-violet-400" />}
              sectionKey="personality"
              expanded={expandedSections}
              onToggle={toggleSection}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-zinc-800/50 p-3">
                  <p className="text-[10px] text-zinc-500 mb-1">核心驱动力</p>
                  <div className="space-y-1">
                    {result.personalitySnapshot.coreDrivers.map((d, i) => (
                      <p key={i} className="text-xs text-zinc-300">• {d}</p>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg bg-zinc-800/50 p-3">
                  <p className="text-[10px] text-zinc-500 mb-1">决策风格</p>
                  <p className="text-xs text-zinc-300">{result.personalitySnapshot.decisionStyle}</p>
                </div>
                <div className="rounded-lg bg-zinc-800/50 p-3">
                  <p className="text-[10px] text-zinc-500 mb-1">情绪画像</p>
                  <p className="text-xs text-zinc-300">{result.personalitySnapshot.emotionalProfile}</p>
                </div>
                <div className="rounded-lg bg-zinc-800/50 p-3">
                  <p className="text-[10px] text-zinc-500 mb-1">沟通基因</p>
                  <p className="text-xs text-zinc-300">{result.personalitySnapshot.communicationDNA}</p>
                </div>
              </div>
            </SectionAccordion>

            {/* Golden Rules */}
            <SectionAccordion
              title={`黄金法则 (${result.goldenRules.length})`}
              icon={<Shield className="h-3.5 w-3.5 text-emerald-400" />}
              sectionKey="golden"
              expanded={expandedSections}
              onToggle={toggleSection}
            >
              <div className="space-y-3">
                {result.goldenRules.map((rule, i) => (
                  <div key={i} className="rounded-lg border border-emerald-500/15 bg-emerald-500/5 p-3">
                    <p className="text-xs font-medium text-emerald-300 mb-1">
                      {i + 1}. {rule.rule}
                    </p>
                    <p className="text-[10px] text-zinc-400 mb-1">{rule.rationale}</p>
                    <p className="text-[10px] text-zinc-500 italic">💬 {rule.example}</p>
                  </div>
                ))}
              </div>
            </SectionAccordion>

            {/* Trigger Map */}
            <SectionAccordion
              title="触发点地图"
              icon={<Flame className="h-3.5 w-3.5 text-red-400" />}
              sectionKey="triggers"
              expanded={expandedSections}
              onToggle={toggleSection}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-medium text-emerald-400 mb-2">✅ 正面触发</p>
                  <div className="space-y-2">
                    {result.triggerMap.positive.map((t, i) => (
                      <div key={i} className="rounded-lg bg-emerald-500/5 border border-emerald-500/10 p-2.5">
                        <p className="text-xs font-medium text-zinc-300">{t.trigger}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">{t.howToActivate}</p>
                        <p className="text-[10px] text-emerald-400/80 mt-0.5 italic">「{t.samplePhrase}」</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-red-400 mb-2">⛔ 雷区警告</p>
                  <div className="space-y-2">
                    {result.triggerMap.negative.map((t, i) => (
                      <div key={i} className="rounded-lg bg-red-500/5 border border-red-500/10 p-2.5">
                        <p className="text-xs font-medium text-zinc-300">{t.trigger}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">{t.whyDangerous}</p>
                        <p className="text-[10px] text-amber-400/80 mt-0.5">🛟 {t.recovery}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SectionAccordion>

            {/* Scenario Playbooks */}
            <SectionAccordion
              title={`场景剧本 (${result.scenarioPlaybooks.length})`}
              icon={<MessageCircle className="h-3.5 w-3.5 text-blue-400" />}
              sectionKey="scenarios"
              expanded={expandedSections}
              onToggle={toggleSection}
            >
              <div className="space-y-3">
                {result.scenarioPlaybooks.map((s, i) => (
                  <div key={i} className="rounded-lg border border-blue-500/15 bg-zinc-800/40 p-3">
                    <p className="text-xs font-medium text-blue-300 mb-1.5">{s.scenario}</p>
                    <p className="text-[10px] text-zinc-400 mb-2">{s.bestApproach}</p>
                    <div className="grid gap-2 sm:grid-cols-2 text-[10px]">
                      <div>
                        <p className="text-zinc-500 mb-0.5">开场白：</p>
                        {s.openingLines.map((l, j) => (
                          <p key={j} className="text-zinc-300 italic">「{l}」</p>
                        ))}
                      </div>
                      <div>
                        <p className="text-zinc-500 mb-0.5">关键话术：</p>
                        {s.keyPhrases.map((p, j) => (
                          <p key={j} className="text-zinc-300 italic">「{p}」</p>
                        ))}
                      </div>
                    </div>
                    {s.thingsToAvoid.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {s.thingsToAvoid.map((a, j) => (
                          <span key={j} className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 text-[9px] border border-red-500/15">
                            ⚠ {a}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-[10px] text-zinc-600 mt-1.5">🎯 成功指标：{s.successIndicators}</p>
                  </div>
                ))}
              </div>
            </SectionAccordion>

            {/* Persuasion Guide */}
            <SectionAccordion
              title="说服指南"
              icon={<Target className="h-3.5 w-3.5 text-violet-400" />}
              sectionKey="persuasion"
              expanded={expandedSections}
              onToggle={toggleSection}
            >
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  { label: "主要杠杆", value: result.persuasionGuide.primaryLever, color: "text-violet-300" },
                  { label: "论证结构", value: result.persuasionGuide.argumentStructure, color: "text-blue-300" },
                  { label: "时机建议", value: result.persuasionGuide.timingAdvice, color: "text-emerald-300" },
                  { label: "抵触应对", value: result.persuasionGuide.resistanceHandling, color: "text-amber-300" },
                ].map((item, i) => (
                  <div key={i} className="rounded-lg bg-zinc-800/50 p-3">
                    <p className={cn("text-[10px] font-medium mb-0.5", item.color)}>{item.label}</p>
                    <p className="text-xs text-zinc-300">{item.value}</p>
                  </div>
                ))}
              </div>
            </SectionAccordion>

            {/* Conflict Resolution */}
            <SectionAccordion
              title="冲突解决"
              icon={<AlertTriangle className="h-3.5 w-3.5 text-amber-400" />}
              sectionKey="conflict"
              expanded={expandedSections}
              onToggle={toggleSection}
            >
              <div className="space-y-2">
                <div className="rounded-lg bg-zinc-800/50 p-3">
                  <p className="text-[10px] text-zinc-500 mb-0.5">冲突风格</p>
                  <p className="text-xs text-zinc-300">{result.conflictResolution.conflictStyle}</p>
                </div>
                <div className="rounded-lg bg-zinc-800/50 p-3">
                  <p className="text-[10px] text-zinc-500 mb-1">降温策略</p>
                  {result.conflictResolution.deescalationTactics.map((t, i) => (
                    <p key={i} className="text-xs text-zinc-300">• {t}</p>
                  ))}
                </div>
                <div className="rounded-lg bg-zinc-800/50 p-3">
                  <p className="text-[10px] text-zinc-500 mb-1">修复步骤</p>
                  {result.conflictResolution.repairSequence.map((s, i) => (
                    <p key={i} className="text-xs text-zinc-300">{i + 1}. {s}</p>
                  ))}
                </div>
                <div className="rounded-lg bg-amber-500/5 border border-amber-500/10 p-3">
                  <p className="text-[10px] text-amber-400 mb-0.5">边界话术模板</p>
                  <p className="text-xs text-zinc-300 italic">「{result.conflictResolution.boundaryScript}」</p>
                </div>
              </div>
            </SectionAccordion>

            {/* Relationship Maintenance */}
            <SectionAccordion
              title="关系维护"
              icon={<Heart className="h-3.5 w-3.5 text-pink-400" />}
              sectionKey="maintenance"
              expanded={expandedSections}
              onToggle={toggleSection}
            >
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg bg-zinc-800/50 p-3">
                  <p className="text-[10px] text-zinc-500 mb-0.5">最佳联系频率</p>
                  <p className="text-xs text-zinc-300">{result.relationshipMaintenance.optimalContactFrequency}</p>
                </div>
                <div className="rounded-lg bg-zinc-800/50 p-3">
                  <p className="text-[10px] text-zinc-500 mb-0.5">适合话题</p>
                  <p className="text-xs text-zinc-300">{result.relationshipMaintenance.bestTopics.join("、")}</p>
                </div>
                <div className="rounded-lg bg-zinc-800/50 p-3">
                  <p className="text-[10px] text-zinc-500 mb-0.5">感动举动</p>
                  <p className="text-xs text-zinc-300">{result.relationshipMaintenance.giftAndGesture}</p>
                </div>
                <div className="rounded-lg bg-zinc-800/50 p-3 sm:col-span-2">
                  <p className="text-[10px] text-zinc-500 mb-0.5">长期策略</p>
                  <p className="text-xs text-zinc-300">{result.relationshipMaintenance.longTermStrategy}</p>
                </div>
              </div>
            </SectionAccordion>

            {/* Confidence Notes */}
            <SectionAccordion
              title="置信度说明"
              icon={<Lightbulb className="h-3.5 w-3.5 text-zinc-400" />}
              sectionKey="confidence"
              expanded={expandedSections}
              onToggle={toggleSection}
            >
              <div className="space-y-2 text-[10px]">
                <div>
                  <p className="text-emerald-400 font-medium mb-0.5">高置信度</p>
                  {result.confidenceNotes.highConfidence.map((c, i) => (
                    <p key={i} className="text-zinc-400">✅ {c}</p>
                  ))}
                </div>
                <div>
                  <p className="text-amber-400 font-medium mb-0.5">需验证</p>
                  {result.confidenceNotes.needsMoreData.map((c, i) => (
                    <p key={i} className="text-zinc-400">⚠️ {c}</p>
                  ))}
                </div>
                <div>
                  <p className="text-zinc-500 font-medium mb-0.5">数据缺口</p>
                  {result.confidenceNotes.dataGaps.map((c, i) => (
                    <p key={i} className="text-zinc-500">❓ {c}</p>
                  ))}
                </div>
              </div>
            </SectionAccordion>

            {/* Regenerate */}
            <div className="text-center pt-2">
              <button
                onClick={generatePlaybook}
                className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                重新生成手册
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Accordion helper ----
function SectionAccordion({
  title,
  icon,
  sectionKey,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  sectionKey: string;
  expanded: Set<string>;
  onToggle: (key: string) => void;
  children: React.ReactNode;
}) {
  const isOpen = expanded.has(sectionKey);
  return (
    <div className="rounded-lg border border-zinc-800 overflow-hidden">
      <button
        onClick={() => onToggle(sectionKey)}
        className="flex items-center gap-2 w-full px-3 py-2.5 hover:bg-zinc-800/50 transition-colors"
      >
        {icon}
        <span className="text-xs font-medium text-zinc-300 flex-1 text-left">{title}</span>
        {isOpen ? (
          <ChevronDown className="h-3 w-3 text-zinc-600" />
        ) : (
          <ChevronRight className="h-3 w-3 text-zinc-600" />
        )}
      </button>
      {isOpen && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}
