"use client";

import { useState } from "react";
import {
  Send,
  Loader2,
  ChevronDown,
  ChevronRight,
  Zap,
  Target,
  Eye,
  Lightbulb,
  ArrowRight,
  Save,
  FileText,
  BookOpen,
  X,
  Fingerprint,
  History,
} from "lucide-react";
import { cn, getTipTypeIcon } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import EmotionChart from "./EmotionChart";
import ConversationHistory from "./ConversationHistory";
import MessageAttributionEditor from "./MessageAttributionEditor";
import { parseConversation, formatMessagesForLLM } from "@/lib/parse-conversation";
import { EXAMPLE_CATEGORIES, type ExampleConversation } from "@/lib/example-conversations";
import { ALL_MBTI_TYPES } from "@/lib/mbti-questions";
import type { EmotionPoint, ChatMessage } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

// ---- Types ----

interface AnalysisResult {
  surfaceFeatures: Record<string, string>;
  discourseStructure: Record<string, string>;
  interactionPatterns: Record<string, string>;
  semanticContent: {
    coreTopics: string[];
    hiddenAgenda: string;
    valueSignals: string[];
    attributionStyle: string;
  };
  metacognitive: Record<string, string>;
  summary: string;
  emotionCurve: EmotionPoint[];
  keyMoments: { messageIndex: number; description: string; significance: string }[];
  mbtiAnalysis?: {
    selfMBTI?: { type: string; confidence: number; reasoning: string };
    otherMBTI?: { type: string; confidence: number; reasoning: string };
    dynamicNotes?: string;
  };
  strategicInsights: string[];
  nextStepSuggestions: string[];
  profileUpdate?: {
    dimensions: Record<string, { value: number; confidence: number; evidence: string[] }>;
    communicationStyle: {
      overallType: string;
      strengths: string[];
      weaknesses: string[];
      triggerPoints: string[];
      preferredTopics: string[];
      avoidTopics: string[];
    };
    patterns: Record<string, string | string[]>;
  };
}

/** The three stages of the analysis flow. */
type AnalyzeStage = "input" | "attribution" | "results";

// ---- Constants ----

const SECTION_LABELS: Record<string, { label: string; icon: React.ElementType }> = {
  surfaceFeatures: { label: "第一层：表层语言特征", icon: Eye },
  discourseStructure: { label: "第二层：话语结构特征", icon: Target },
  interactionPatterns: { label: "第三层：互动模式特征", icon: Zap },
  semanticContent: { label: "第四层：内容语义特征", icon: Lightbulb },
  metacognitive: { label: "第五层：元认知特征", icon: Lightbulb },
};

const FIELD_LABELS: Record<string, string> = {
  formalityLevel: "正式程度",
  avgSentenceLength: "句子长度",
  punctuationStyle: "标点风格",
  emojiUsage: "表情使用",
  toneMarkers: "语气标记",
  argumentStyle: "论述风格",
  topicControl: "话题控制",
  questionFrequency: "提问频率",
  hedgingLevel: "对冲/缓和语",
  initiativeBalance: "主动性平衡",
  responseLatency: "回复时效",
  conflictHandling: "冲突处理",
  mirroring: "语言镜像",
  coreTopics: "核心话题",
  hiddenAgenda: "隐含议程",
  valueSignals: "价值信号",
  attributionStyle: "归因风格",
  selfAwareness: "自我觉察",
  uncertaintyExpression: "不确定性表达",
  flexibilityLevel: "认知灵活性",
  emotionalLabeling: "情绪标注",
};

// ---- Component ----

export default function AnalyzeTab() {
  // Stage management
  const [stage, setStage] = useState<AnalyzeStage>("input");

  // Input stage state
  const [conversation, setConversation] = useState("");
  const [targetName, setTargetName] = useState("");
  const [context, setContext] = useState("");
  const [showContext, setShowContext] = useState(false);

  // MBTI state
  const [selfMBTI, setSelfMBTI] = useState("");
  const [otherMBTI, setOtherMBTI] = useState("");
  const [showMBTI, setShowMBTI] = useState(false);

  // Attribution stage state
  const [parsedMessages, setParsedMessages] = useState<ChatMessage[]>([]);

  // Results stage state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    surfaceFeatures: true,
    discourseStructure: true,
    interactionPatterns: true,
    semanticContent: true,
    metacognitive: true,
  });
  const [saved, setSaved] = useState(false);

  // The final formatted conversation sent to the API
  const [formattedConversation, setFormattedConversation] = useState("");

  // Example selector
  const [showExamples, setShowExamples] = useState(false);
  const [activeExampleCategory, setActiveExampleCategory] = useState(EXAMPLE_CATEGORIES[0].id);

  // History panel
  const [showHistory, setShowHistory] = useState(false);

  const { addConversation, addProfile, profiles, conversations, mbtiResults } = useAppStore();

  // Auto-populate selfMBTI from stored test results
  const latestMBTI = mbtiResults[0];
  const autoSelfMBTI = latestMBTI?.type || "";
  const effectiveSelfMBTI = selfMBTI || autoSelfMBTI;

  const loadFromHistory = (convoId: string) => {
    const convo = conversations.find((c) => c.id === convoId);
    if (!convo?.analysis) return;
    const a = convo.analysis;
    setResult({
      surfaceFeatures: a.surfaceFeatures as unknown as Record<string, string>,
      discourseStructure: a.discourseStructure as unknown as Record<string, string>,
      interactionPatterns: a.interactionPatterns as unknown as Record<string, string>,
      semanticContent: a.semanticContent as unknown as AnalysisResult["semanticContent"],
      metacognitive: a.metacognitive as unknown as Record<string, string>,
      summary: (a as unknown as Record<string, string>).summary || "",
      emotionCurve: (a as unknown as Record<string, unknown>).emotionCurve as EmotionPoint[] || [],
      keyMoments: (a as unknown as Record<string, unknown>).keyMoments as AnalysisResult["keyMoments"] || [],
      strategicInsights: (a as unknown as Record<string, unknown>).strategicInsights as string[] || [],
      nextStepSuggestions: (a as unknown as Record<string, unknown>).nextStepSuggestions as string[] || [],
    });
    setTargetName(convo.participants?.find((p) => p !== "我") || "");
    if (convo.rawText) setConversation(convo.rawText);
    if (convo.context) { setContext(convo.context); setShowContext(true); }
    setStage("results");
    setSaved(true);
    setShowHistory(false);
  };

  const reAnalyzeFromHistory = (convoId: string) => {
    const convo = conversations.find((c) => c.id === convoId);
    if (!convo?.rawText) return;
    setConversation(convo.rawText);
    setTargetName(convo.targetName || convo.participants?.find((p) => p !== "我") || "");
    if (convo.context) { setContext(convo.context); setShowContext(true); }
    setResult(null);
    setError("");
    setSaved(false);
    setStage("input");
    setShowHistory(false);
  };

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const loadExample = (example: ExampleConversation) => {
    setConversation(example.conversation);
    setTargetName(example.targetName);
    setContext(example.context);
    setShowContext(!!example.context);
    setShowExamples(false);
    // Reset any previous results
    setResult(null);
    setError("");
    setSaved(false);
    if (stage === "results") setStage("input");
  };

  // ---- Step 1: Parse and decide whether to show attribution ----
  const handlePreprocess = () => {
    if (!conversation.trim()) return;
    setError("");
    setResult(null);
    setSaved(false);

    const parseResult = parseConversation(conversation.trim());

    if (parseResult.needsAttribution) {
      // Unstructured chat — show attribution editor
      setParsedMessages(parseResult.messages);
      setStage("attribution");
    } else {
      // Structured chat — go directly to analysis
      const formatted = formatMessagesForLLM(parseResult.messages);
      setFormattedConversation(formatted);

      // Auto-detect target name from participants if not set
      if (!targetName.trim() && parseResult.participants.length > 0) {
        const selfNames = ["我", "自己", "me", "Me", "ME"];
        const other = parseResult.participants.find((p) => !selfNames.includes(p));
        if (other) setTargetName(other);
      }

      runAnalysis(formatted);
    }
  };

  // ---- Step 2: Attribution confirmed — format and analyze ----
  const handleAttributionConfirm = (
    messages: ChatMessage[],
    speakers: { id: string; name: string; role: string }[]
  ) => {
    const formatted = formatMessagesForLLM(messages);
    setFormattedConversation(formatted);

    // Update the conversation textarea to show the attributed version
    setConversation(formatted);

    // Set target name from the first "other" speaker
    const otherSpeaker = speakers.find((s) => s.role === "other");
    const resolvedTargetName = (otherSpeaker && !targetName.trim())
      ? otherSpeaker.name
      : targetName.trim();
    if (otherSpeaker && !targetName.trim()) {
      setTargetName(resolvedTargetName);
    }

    // Go directly to analysis (skip "input" stage to avoid flash)
    runAnalysis(formatted, resolvedTargetName);
  };

  // ---- Core analysis call ----
  const runAnalysis = async (convoText: string, overrideTargetName?: string) => {
    setLoading(true);
    setError("");
    setResult(null);
    setStage("results");

    const finalTargetName = overrideTargetName || targetName.trim() || undefined;

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation: convoText,
          targetName: finalTargetName,
          context: context.trim() || undefined,
          mbtiInfo: (effectiveSelfMBTI || otherMBTI || showMBTI) ? {
            selfMBTI: effectiveSelfMBTI || undefined,
            otherMBTI: otherMBTI || undefined,
          } : undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "分析请求失败");
      }

      const data = await res.json();
      setResult(data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知错误");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!result) return;

    const name = targetName.trim() || "对方";
    const convoId = uuidv4();

    addConversation({
      id: convoId,
      title: `与${name}的对话分析`,
      participants: ["我", name],
      messages: [],
      createdAt: new Date().toISOString(),
      rawText: conversation,
      targetName: name,
      context: context || undefined,
      analysis: {
        id: uuidv4(),
        conversationId: convoId,
        createdAt: new Date().toISOString(),
        ...result,
      } as import("@/lib/types").ConversationAnalysis,
    });

    if (result.profileUpdate) {
      const existingProfile = profiles.find(
        (p) => p.name === name
      );

      if (!existingProfile) {
        const pu = result.profileUpdate;
        const dims = pu.dimensions || {};
        const makeDim = (key: string, labelZh: string) => ({
          label: key,
          labelZh,
          value: dims[key]?.value ?? 50,
          confidence: dims[key]?.confidence ?? 10,
          evidence: dims[key]?.evidence ?? [],
        });

        addProfile({
          id: uuidv4(),
          name,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          dimensions: {
            assertiveness: makeDim("assertiveness", "强势程度"),
            cooperativeness: makeDim("cooperativeness", "合作倾向"),
            decisionSpeed: makeDim("decisionSpeed", "决策速度"),
            emotionalStability: makeDim("emotionalStability", "情绪稳定性"),
            openness: makeDim("openness", "开放性"),
            empathy: makeDim("empathy", "共情能力"),
            riskTolerance: makeDim("riskTolerance", "风险承受"),
            formalityLevel: makeDim("formalityLevel", "正式程度"),
          },
          communicationStyle: pu.communicationStyle || {
            overallType: "未知",
            strengths: [],
            weaknesses: [],
            triggerPoints: [],
            preferredTopics: [],
            avoidTopics: [],
          },
          patterns: {
            responseSpeed: (pu.patterns?.responseSpeed as string) || "未知",
            conflictStyle: (pu.patterns?.conflictStyle as string) || "未知",
            decisionStyle: (pu.patterns?.decisionStyle as string) || "未知",
            persuasionVulnerability:
              (pu.patterns?.persuasionVulnerability as string[]) || [],
          },
          conversationCount: 1,
          totalMessages: 0,
          lastInteraction: new Date().toISOString(),
          notes: "",
        });
      }
    }

    setSaved(true);
  };

  const resetToInput = () => {
    setStage("input");
    setResult(null);
    setError("");
    setSaved(false);
    setFormattedConversation("");
  };

  const renderSection = (key: string, data: Record<string, unknown>) => {
    const config = SECTION_LABELS[key];
    if (!config) return null;
    const Icon = config.icon;
    const isExpanded = expandedSections[key];

    return (
      <div key={key} className="border border-zinc-800 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection(key)}
          className="flex w-full items-center gap-3 px-4 py-3 hover:bg-zinc-800/50 transition-colors"
        >
          <Icon className="h-4 w-4 text-violet-400 shrink-0" />
          <span className="text-sm font-medium text-zinc-200 flex-1 text-left">
            {config.label}
          </span>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-zinc-500" />
          ) : (
            <ChevronRight className="h-4 w-4 text-zinc-500" />
          )}
        </button>
        {isExpanded && (
          <div className="border-t border-zinc-800 px-4 py-3 space-y-2">
            {Object.entries(data).map(([field, value]) => (
              <div key={field} className="flex gap-2">
                <span className="text-xs text-zinc-500 w-24 shrink-0">
                  {FIELD_LABELS[field] || field}
                </span>
                <span className="text-xs text-zinc-300">
                  {Array.isArray(value) ? value.join("、") : String(value)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">对话分析</h1>
          <p className="text-xs text-zinc-500 mt-1">
            粘贴一段对话，AI将从五个层次深度解析沟通信号。支持直接粘贴微信聊天记录。
          </p>
        </div>
        {conversations.length > 0 && (
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors border",
              showHistory
                ? "bg-violet-500/15 text-violet-300 border-violet-500/30"
                : "text-zinc-500 border-zinc-700 hover:text-zinc-300 hover:border-zinc-600"
            )}
          >
            <History className="h-3.5 w-3.5" />
            分析历史
            <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded-full">{conversations.length}</span>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">

          {/* Conversation History Panel */}
          {showHistory && (
            <ConversationHistory
              onClose={() => setShowHistory(false)}
              onLoadConversation={loadFromHistory}
              onReAnalyze={reAnalyzeFromHistory}
            />
          )}

          {/* ===== STAGE: INPUT ===== */}
          {(stage === "input" || stage === "results") && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="对方称呼（如：王总、李经理，可留空）"
                  value={targetName}
                  onChange={(e) => setTargetName(e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/20"
                />
                <button
                  onClick={() => setShowContext(!showContext)}
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors whitespace-nowrap"
                >
                  {showContext ? "隐藏背景" : "+ 添加背景"}
                </button>
                <button
                  onClick={() => setShowMBTI(!showMBTI)}
                  className={cn(
                    "flex items-center gap-1 text-xs transition-colors whitespace-nowrap",
                    showMBTI ? "text-violet-400" : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  <Fingerprint className="h-3 w-3" />
                  {showMBTI ? "隐藏MBTI" : "+ MBTI"}
                </button>
              </div>

              {/* MBTI Selector */}
              {showMBTI && (
                <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3 space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Fingerprint className="h-3.5 w-3.5 text-violet-400" />
                    <span className="text-[10px] text-violet-300 font-medium">MBTI 人格参考（可选）</span>
                    <span className="text-[9px] text-zinc-600">留空则由AI根据对话推测</span>
                    {autoSelfMBTI && !selfMBTI && (
                      <span className="text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded px-1.5 py-0.5">
                        已自动填入测试结果: {autoSelfMBTI}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-zinc-500 mb-0.5 block">我的MBTI</label>
                      <select
                        value={selfMBTI}
                        onChange={(e) => setSelfMBTI(e.target.value)}
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-[11px] text-zinc-300 focus:outline-none focus:border-violet-500/50"
                      >
                        <option value="">{autoSelfMBTI ? `自动: ${autoSelfMBTI}（来自测试）` : "不确定 / 由AI推测"}</option>
                        {ALL_MBTI_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] text-zinc-500 mb-0.5 block">对方MBTI</label>
                      <select
                        value={otherMBTI}
                        onChange={(e) => setOtherMBTI(e.target.value)}
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-[11px] text-zinc-300 focus:outline-none focus:border-violet-500/50"
                      >
                        <option value="">不确定 / 由AI推测</option>
                        {ALL_MBTI_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Example selector */}
              <div className="relative">
                <button
                  onClick={() => setShowExamples(!showExamples)}
                  className="flex items-center gap-1.5 text-[11px] text-violet-400 hover:text-violet-300 transition-colors px-2.5 py-1 rounded-lg border border-violet-500/20 hover:border-violet-500/40"
                >
                  <BookOpen className="h-3 w-3" />
                  载入示例对话
                  <ChevronDown className={cn("h-3 w-3 transition-transform", showExamples && "rotate-180")} />
                </button>

                {showExamples && (
                  <div className="absolute top-full left-0 mt-2 z-20 w-[520px] max-h-[400px] rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl shadow-black/40 overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-200">
                    {/* Category tabs */}
                    <div className="flex border-b border-zinc-800 overflow-x-auto">
                      {EXAMPLE_CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setActiveExampleCategory(cat.id)}
                          className={cn(
                            "flex items-center gap-1 px-3 py-2 text-[11px] whitespace-nowrap transition-colors shrink-0",
                            activeExampleCategory === cat.id
                              ? "text-violet-300 border-b-2 border-violet-500 bg-violet-500/5"
                              : "text-zinc-500 hover:text-zinc-300"
                          )}
                        >
                          <span>{cat.icon}</span>
                          {cat.label}
                        </button>
                      ))}
                    </div>
                    {/* Example list */}
                    <div className="p-2 max-h-[320px] overflow-y-auto space-y-1">
                      {EXAMPLE_CATEGORIES
                        .find((c) => c.id === activeExampleCategory)
                        ?.examples.map((ex) => (
                          <button
                            key={ex.id}
                            onClick={() => loadExample(ex)}
                            className="w-full text-left rounded-lg px-3 py-2.5 hover:bg-zinc-800/70 transition-colors group"
                          >
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs font-medium text-zinc-200 group-hover:text-white">
                                {ex.label}
                              </span>
                              <span className={cn(
                                "text-[9px] px-1.5 py-0.5 rounded",
                                ex.format === "structured"
                                  ? "bg-violet-500/10 text-violet-400 border border-violet-500/20"
                                  : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                              )}>
                                {ex.format === "structured" ? "结构化" : "无标记"}
                              </span>
                            </div>
                            <p className="text-[10px] text-zinc-500 group-hover:text-zinc-400">
                              {ex.description}
                            </p>
                          </button>
                        ))}
                    </div>
                    {/* Close hint */}
                    <div className="border-t border-zinc-800 px-3 py-1.5 flex justify-end">
                      <button
                        onClick={() => setShowExamples(false)}
                        className="text-[10px] text-zinc-600 hover:text-zinc-400 flex items-center gap-1"
                      >
                        <X className="h-2.5 w-2.5" /> 关闭
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {showContext && (
                <input
                  type="text"
                  placeholder="对话背景（如：B2B销售场景，我方是SaaS提供商）"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/20"
                />
              )}

              <div className="relative">
                <textarea
                  value={conversation}
                  onChange={(e) => {
                    setConversation(e.target.value);
                    // Reset results when text changes
                    if (stage === "results") {
                      setStage("input");
                      setResult(null);
                      setError("");
                    }
                  }}
                  placeholder={`直接粘贴对话内容即可，支持以下格式：\n\n✅ 有标记格式：\n我：你好\n对方：你好啊\n\n✅ 无标记格式（微信直接粘贴）：\n你好\n你好啊\n最近忙吗？\n还行\n\n系统会自动识别格式，无标记时会让你手动标注每句话是谁说的。`}
                  rows={10}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/20 resize-none font-mono leading-relaxed"
                />
                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  <span className="text-[10px] text-zinc-600">
                    {conversation.length} 字 · {conversation.split("\n").filter((l) => l.trim()).length} 行
                  </span>
                </div>
              </div>

              {/* Quick Start Guide — shown when textarea is empty */}
              {!conversation.trim() && !result && (
                <div className="rounded-xl border border-zinc-800/50 bg-gradient-to-br from-violet-500/5 to-blue-500/5 p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-violet-400" />
                    <h3 className="text-xs font-medium text-zinc-300">快速入门</h3>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg bg-zinc-900/50 border border-zinc-800/50 p-3">
                      <div className="text-base mb-1.5">📋</div>
                      <p className="text-[11px] font-medium text-zinc-300 mb-1">步骤一：粘贴对话</p>
                      <p className="text-[10px] text-zinc-500 leading-relaxed">从微信、钉钉、邮件等任何地方复制对话内容，直接粘贴到上方文本框</p>
                    </div>
                    <div className="rounded-lg bg-zinc-900/50 border border-zinc-800/50 p-3">
                      <div className="text-base mb-1.5">🔍</div>
                      <p className="text-[11px] font-medium text-zinc-300 mb-1">步骤二：AI深度分析</p>
                      <p className="text-[10px] text-zinc-500 leading-relaxed">AI会从五个层次解析对话：语言特征、话语结构、互动模式、语义内容、元认知</p>
                    </div>
                    <div className="rounded-lg bg-zinc-900/50 border border-zinc-800/50 p-3">
                      <div className="text-base mb-1.5">💡</div>
                      <p className="text-[11px] font-medium text-zinc-300 mb-1">步骤三：获得洞察</p>
                      <p className="text-[10px] text-zinc-500 leading-relaxed">收到对方性格画像、情绪曲线、关键时刻分析、以及具体的下一步建议</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-600 text-center">
                    不知道从哪开始？点击上方「载入示例对话」体验完整功能 →
                  </p>
                </div>
              )}

              {!loading && !result && (
                <button
                  onClick={handlePreprocess}
                  disabled={!conversation.trim()}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium transition-all w-full",
                    !conversation.trim()
                      ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                      : "bg-violet-600 text-white hover:bg-violet-500 shadow-lg shadow-violet-500/20"
                  )}
                >
                  <FileText className="h-4 w-4" />
                  解析对话 & 开始分析
                </button>
              )}
            </div>
          )}

          {/* ===== STAGE: ATTRIBUTION ===== */}
          {stage === "attribution" && (
            <MessageAttributionEditor
              messages={parsedMessages}
              onConfirm={handleAttributionConfirm}
              onBack={() => setStage("input")}
            />
          )}

          {/* ===== Loading indicator ===== */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-violet-400 mb-4" />
              <p className="text-sm text-zinc-400">AI 正在深度分析中...</p>
              <p className="text-[10px] text-zinc-600 mt-1">
                五层信号提取 + 贝叶斯画像构建，预计需要 10-30 秒
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
              <p className="text-sm text-red-400">{error}</p>
              <button
                onClick={resetToInput}
                className="mt-2 text-xs text-red-300 underline hover:text-red-200"
              >
                返回修改
              </button>
            </div>
          )}

          {/* ===== STAGE: RESULTS ===== */}
          {result && (
            <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
              {/* Summary */}
              <div className="rounded-lg border border-violet-500/30 bg-gradient-to-br from-violet-500/5 to-blue-500/5 p-5">
                <h3 className="text-sm font-semibold text-violet-300 mb-2">
                  分析总结
                </h3>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  {result.summary}
                </p>
              </div>

              {/* Emotion Curve */}
              {result.emotionCurve && result.emotionCurve.length > 0 && (
                <div className="rounded-lg border border-zinc-800 p-5">
                  <h3 className="text-sm font-semibold text-zinc-200 mb-3">
                    情绪变化曲线
                  </h3>
                  <div className="flex gap-4 mb-2 text-[10px]">
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-4 rounded bg-violet-500" />
                      <span className="text-zinc-500">己方情绪</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-4 rounded bg-cyan-500" />
                      <span className="text-zinc-500">对方情绪</span>
                    </div>
                  </div>
                  <EmotionChart data={result.emotionCurve} />
                </div>
              )}

              {/* MBTI Analysis */}
              {result.mbtiAnalysis && (
                <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-5">
                  <h3 className="text-sm font-semibold text-violet-300 mb-3 flex items-center gap-2">
                    <Fingerprint className="h-4 w-4" />
                    MBTI 人格推测
                  </h3>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    {result.mbtiAnalysis.selfMBTI && result.mbtiAnalysis.selfMBTI.type && result.mbtiAnalysis.selfMBTI.type !== "null" && (
                      <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-zinc-400">我方</span>
                          <span className="text-sm font-bold text-violet-300">{result.mbtiAnalysis.selfMBTI.type}</span>
                          <span className="text-[9px] text-zinc-600">
                            置信度 {result.mbtiAnalysis.selfMBTI.confidence}%
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 leading-relaxed">{result.mbtiAnalysis.selfMBTI.reasoning}</p>
                      </div>
                    )}
                    {result.mbtiAnalysis.otherMBTI && result.mbtiAnalysis.otherMBTI.type && result.mbtiAnalysis.otherMBTI.type !== "null" && (
                      <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-zinc-400">对方</span>
                          <span className="text-sm font-bold text-pink-300">{result.mbtiAnalysis.otherMBTI.type}</span>
                          <span className="text-[9px] text-zinc-600">
                            置信度 {result.mbtiAnalysis.otherMBTI.confidence}%
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 leading-relaxed">{result.mbtiAnalysis.otherMBTI.reasoning}</p>
                      </div>
                    )}
                  </div>
                  {result.mbtiAnalysis.dynamicNotes && (
                    <p className="text-[10px] text-zinc-400 leading-relaxed border-t border-zinc-800 pt-2">
                      <span className="text-violet-400 font-medium">互动特征：</span>
                      {result.mbtiAnalysis.dynamicNotes}
                    </p>
                  )}
                </div>
              )}

              {/* Five Layers */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-zinc-200">
                  五层信号分析
                </h3>
                {["surfaceFeatures", "discourseStructure", "interactionPatterns", "semanticContent", "metacognitive"].map(
                  (key) => {
                    const data = result[key as keyof AnalysisResult];
                    if (data && typeof data === "object" && !Array.isArray(data)) {
                      return renderSection(key, data as Record<string, unknown>);
                    }
                    return null;
                  }
                )}
              </div>

              {/* Key Moments */}
              {result.keyMoments && result.keyMoments.length > 0 && (
                <div className="rounded-lg border border-zinc-800 p-5">
                  <h3 className="text-sm font-semibold text-zinc-200 mb-3">
                    关键转折点
                  </h3>
                  <div className="space-y-3">
                    {result.keyMoments.map((moment, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                          {moment.messageIndex + 1}
                        </div>
                        <div>
                          <p className="text-xs text-zinc-300">
                            {moment.description}
                          </p>
                          <p className="text-[10px] text-zinc-600 mt-0.5">
                            {moment.significance}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Strategic Insights */}
              {result.strategicInsights && result.strategicInsights.length > 0 && (
                <div className="rounded-lg border border-zinc-800 p-5">
                  <h3 className="text-sm font-semibold text-zinc-200 mb-3">
                    {getTipTypeIcon("insight")} 策略洞察
                  </h3>
                  <div className="space-y-2">
                    {result.strategicInsights.map((insight, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-xs text-zinc-300"
                      >
                        <Lightbulb className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
                        {insight}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Next Step Suggestions */}
              {result.nextStepSuggestions && result.nextStepSuggestions.length > 0 && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-5">
                  <h3 className="text-sm font-semibold text-emerald-300 mb-3">
                    下一步建议
                  </h3>
                  <div className="space-y-2">
                    {result.nextStepSuggestions.map((sug, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-xs text-zinc-300"
                      >
                        <ArrowRight className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        {sug}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="flex gap-3">
                <button
                  onClick={resetToInput}
                  className="rounded-lg border border-zinc-700 px-4 py-2.5 text-xs text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-colors"
                >
                  分析新对话
                </button>
                <button
                  onClick={handleSave}
                  disabled={saved}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium transition-all",
                    saved
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700"
                  )}
                >
                  <Save className="h-4 w-4" />
                  {saved ? "已保存至画像库" : "保存分析结果 & 生成画像"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
