"use client";

import { useState, useRef, useCallback } from "react";
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
  Clock,
} from "lucide-react";
import { cn, getTipTypeIcon } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import EmotionChart from "./EmotionChart";
import ConversationHistory from "./ConversationHistory";
import MessageAttributionEditor from "./MessageAttributionEditor";
import ModuleHistoryPanel from "./ModuleHistoryPanel";
import ScenarioShortcuts from "./ScenarioShortcuts";
import ConversationQualityScore from "./ConversationQualityScore";
import { parseConversation, formatMessagesForLLM } from "@/lib/parse-conversation";
import { EXAMPLE_CATEGORIES, type ExampleConversation } from "@/lib/example-conversations";
import { ALL_MBTI_TYPES } from "@/lib/mbti-questions";
import type { EmotionPoint, ChatMessage } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";
import StreamingIndicator from "./StreamingIndicator";
import { extractMemoriesFromAnalysis, formatMemoriesForPrompt } from "@/lib/memory-utils";
import { retrieveRAGContext } from "@/lib/rag-memory";
import { apiFetch } from "@/lib/api-fetch";
import VoiceInputButton from "./VoiceInputButton";
import { verifyTimeOrder, type TimeOrderIssue } from "@/lib/timestamp-parser";

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

  // Input mode: "conversation" (full dialogue), "single" (one person's message to interpret), "eq-review" (EQ review)
  const [inputMode, setInputMode] = useState<"conversation" | "single" | "eq-review">("conversation");

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
  const [detectedPlatform, setDetectedPlatform] = useState<string | null>(null);

  // Results stage state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const abortRef = useRef<AbortController | null>(null);
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
  // Original raw text before attribution (preserved for re-analysis)
  const [originalRawText, setOriginalRawText] = useState("");
  // User-specified conversation date (for timeline accuracy)
  const [conversationDate, setConversationDate] = useState("");

  // Example selector
  const [showExamples, setShowExamples] = useState(false);
  const [activeExampleCategory, setActiveExampleCategory] = useState(EXAMPLE_CATEGORIES[0].id);

  // History panel
  const [showHistory, setShowHistory] = useState(false);
  // Time order issues
  const [timeIssues, setTimeIssues] = useState<TimeOrderIssue[]>([]);

  const { addConversation, addProfile, updateProfile, snapshotProfile, profiles, conversations, mbtiResults, addModuleHistory, navigateToTab, getActiveMemoriesForProfile, addMemoriesBatch, addToast, activeTab } = useAppStore();

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
    if (!convo) return;
    setTargetName(convo.targetName || convo.participants?.find((p) => p !== "我") || "");
    if (convo.context) { setContext(convo.context); setShowContext(true); }
    setResult(null);
    setError("");
    setSaved(false);

    // If conversation has attributed messages, use them directly
    // instead of re-parsing the raw text (preserves previous attribution)
    if (convo.messages && convo.messages.length > 0) {
      const formatted = formatMessagesForLLM(convo.messages);
      setConversation(convo.rawText || formatted);
      setParsedMessages(convo.messages);
      setFormattedConversation(formatted);
      setStage("input");
    } else if (convo.rawText) {
      setConversation(convo.rawText);
      setStage("input");
    }
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
    setOriginalRawText(conversation.trim());

    // Single-paragraph mode: wrap as "对方：..." and go directly to analysis
    if (inputMode === "single") {
      const name = targetName.trim() || "对方";
      const wrapped = `${name}：${conversation.trim()}`;
      setFormattedConversation(wrapped);
      setParsedMessages([]);
      setDetectedPlatform(null);
      runAnalysis(wrapped, name);
      return;
    }

    const parseResult = parseConversation(conversation.trim());

    // Show detected platform badge
    if (parseResult.platformLabel && parseResult.timestampCount && parseResult.timestampCount > 0) {
      setDetectedPlatform(parseResult.platformLabel);
    } else {
      setDetectedPlatform(null);
    }

    // Verify time order
    const issues = verifyTimeOrder(parseResult.messages);
    setTimeIssues(issues);
    if (issues.length > 0) {
      addToast({
        type: "warning",
        title: "时间顺序异常",
        message: `检测到 ${issues.length} 处时间顺序问题，可能影响分析准确性`,
      });
    }

    if (parseResult.needsAttribution) {
      // If user already provided a targetName, use it to pre-assign:
      // the targetName matches an "other" participant, "我" is self
      if (targetName.trim() && parseResult.participants.length === 2) {
        const tn = targetName.trim();
        const matchedParticipant = parseResult.participants.find(
          (p) => p === tn || p.includes(tn) || tn.includes(p)
        );
        if (matchedParticipant) {
          for (const msg of parseResult.messages) {
            msg.role = msg.senderName === matchedParticipant ? "other" : "self";
          }
        }
      }
      // Show attribution editor for confirmation
      setParsedMessages(parseResult.messages);
      setStage("attribution");
    } else {
      // Structured chat with clear "我" speaker — go directly to analysis
      setParsedMessages(parseResult.messages);
      const formatted = formatMessagesForLLM(parseResult.messages);
      setFormattedConversation(formatted);

      // Auto-detect target name from participants if not set
      if (!targetName.trim() && parseResult.participants.length > 0) {
        const selfNames = ["我", "自己", "me", "Me", "ME", "本人"];
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
    // Store the user-confirmed messages for saving later
    setParsedMessages(messages);

    const formatted = formatMessagesForLLM(messages);
    setFormattedConversation(formatted);

    // Update the conversation textarea to show the attributed version
    setConversation(formatted);

    // Set target name from the first "other" speaker
    const otherSpeakers = speakers.filter((s) => s.role === "other");
    const otherSpeaker = otherSpeakers[0];
    const resolvedTargetName = (otherSpeaker && !targetName.trim())
      ? otherSpeaker.name
      : targetName.trim();
    if (otherSpeaker && !targetName.trim()) {
      setTargetName(resolvedTargetName);
    }

    // Multi-party context: inject group chat hint when >2 speakers
    let multiPartyContext = "";
    if (otherSpeakers.length > 1) {
      const names = otherSpeakers.map((s) => s.name).join("、");
      multiPartyContext = `【多方群聊模式】这是一个${otherSpeakers.length + 1}人群聊对话，参与者包括"我"和${names}。请分别分析每位参与者的沟通风格、立场和互动模式。在情绪曲线中，otherEmotion取所有对方参与者的平均情绪值。特别注意群体动力学：谁主导话题、谁附和、谁有独立见解。`;
      setContext((prev) => prev ? `${prev}\n\n${multiPartyContext}` : multiPartyContext);
    }

    // Go directly to analysis (skip "input" stage to avoid flash)
    runAnalysis(formatted, resolvedTargetName);
  };

  const abortStreaming = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setLoading(false);
  }, []);

  // ---- Core analysis call (SSE streaming) ----
  const runAnalysis = async (convoText: string, overrideTargetName?: string) => {
    setLoading(true);
    setError("");
    setResult(null);
    setStreamingText("");
    setStage("results");

    const finalTargetName = overrideTargetName || targetName.trim() || undefined;

    // Abort any previous stream
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // Inject AI memory context if an existing profile exists for this target
    let memoryContext: string | undefined;
    if (finalTargetName) {
      const existingProfile = profiles.find((p) => p.name === finalTargetName);
      if (existingProfile) {
        const memories = getActiveMemoriesForProfile(existingProfile.id);
        if (memories.length > 0) {
          // Use RAG scoring to inject only the most relevant memories
          memoryContext = retrieveRAGContext(memories, convoText, existingProfile) ||
            formatMemoriesForPrompt(memories, existingProfile);
        }
      }
    }

    try {
      const res = await apiFetch("/api/analyze?stream=true", {
        method: "POST",
        body: JSON.stringify({
          conversation: convoText,
          targetName: finalTargetName,
          context: [
            inputMode === "single" ? "【单向揣摩模式】这不是双向对话，只有对方单方面说的话。请重点分析：1)对方真实意图和潜台词 2)对方情绪状态变化 3)可能的回复策略建议。注意：因为没有我方发言，情绪曲线只需分析对方(otherEmotion)，selfEmotion全部设为0。分析结果中请避免使用'对话'一词，改用'表述'或'发言'。所有分析层标题和内容必须使用中文，不要出现英文标题。"
            : inputMode === "eq-review" ? "【情商复盘模式】请特别关注情商维度的分析。在五层分析之外，额外添加一个'情商复盘'板块(eqReview)，包含：1)我方每条关键发言的情商评分(1-10)和改进建议 2)错失的共情机会 3)可以更好的表达方式 4)整体情商表现评分(0-100)。所有标题和内容必须使用中文。"
            : "",
            context.trim() || "",
            memoryContext || "",
          ].filter(Boolean).join("\n\n") || undefined,
          mbtiInfo: (effectiveSelfMBTI || otherMBTI || showMBTI) ? {
            selfMBTI: effectiveSelfMBTI || undefined,
            otherMBTI: otherMBTI || undefined,
          } : undefined,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        let errMsg = `分析请求失败 (${res.status})`;
        try {
          const errData = await res.json();
          if (errData.error) errMsg = errData.error;
        } catch { /* use default */ }
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
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;
          try {
            const event = JSON.parse(jsonStr);
            if (event.type === "progress" && event.text) {
              setStreamingText((prev) => prev + event.text);
            } else if (event.type === "result" && event.data) {
              const data = event.data as { analysis: AnalysisResult; targetName: string };
              const a = data.analysis;

              // Validate critical fields — reject incomplete results
              const requiredSections = ["surfaceFeatures", "discourseStructure", "interactionPatterns", "semanticContent"];
              const missingSections = requiredSections.filter(
                (key) => !a || !a[key as keyof AnalysisResult] || typeof a[key as keyof AnalysisResult] !== "object"
              );
              if (missingSections.length > 0 || !a?.summary) {
                streamError = `解析失败：AI返回的分析结果不完整，缺少 ${missingSections.length > 0 ? missingSections.join("、") : "summary"} 等关键字段。请重试。`;
              } else {
                gotResult = true;
                setResult(a);
                // Auto-save to module history
                const name = overrideTargetName || targetName.trim() || "对方";
                addModuleHistory("analyze", {
                  id: uuidv4(),
                  title: `与${name}的对话分析`,
                  createdAt: new Date().toISOString(),
                  module: "analyze",
                  data: { result: a, conversation: convoText, targetName: name, context: context.trim() },
                  summary: a.summary?.slice(0, 60) || "对话分析完成",
                });
              }
            } else if (event.type === "error") {
              streamError = event.text || "分析过程出错";
            }
          } catch { /* skip malformed SSE line */ }
        }
      }

      if (!gotResult) {
        setError(streamError || "分析未返回结果，可能是AI输出格式异常，请重试");
      } else {
        // Notify user via toast if they're on a different tab
        const currentTab = useAppStore.getState().activeTab;
        if (currentTab !== "analyze") {
          addToast({
            type: "success",
            title: "对话分析完成",
            message: `与${overrideTargetName || targetName.trim() || "对方"}的对话已分析完毕`,
            duration: 8000,
            action: { label: "查看结果", tab: "analyze" },
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

  const handleSave = () => {
    if (!result) return;

    try {
    const name = targetName.trim() || "对方";
    const convoId = uuidv4();

    // Dynamic profile update: only update the direct conversation partner (targetName).
    // Third parties mentioned in the conversation are NEVER updated.
    const existingProfile = profiles.find((p) => p.name === name);
    const profileId = existingProfile?.id || (result.profileUpdate ? uuidv4() : undefined);

    const isSingleMode = inputMode === "single";
    addConversation({
      id: convoId,
      title: isSingleMode ? `${name}的单向揣摩` : `与${name}的对话分析`,
      participants: isSingleMode ? [name] : ["我", name],
      messages: parsedMessages.length > 0 ? parsedMessages : [],
      createdAt: conversationDate || new Date().toISOString(),
      rawText: originalRawText || conversation,
      targetName: name,
      context: (isSingleMode ? "[单向揣摩] " : "") + (context || ""),
      linkedProfileId: profileId,
      analysis: {
        id: uuidv4(),
        conversationId: convoId,
        createdAt: new Date().toISOString(),
        ...result,
      } as import("@/lib/types").ConversationAnalysis,
    });

    if (result.profileUpdate) {
      const pu = result.profileUpdate;
      const newDims = (pu.dimensions && typeof pu.dimensions === 'object') ? pu.dimensions : {};

      if (existingProfile) {
        // ---- Dynamic merge into existing profile ----
        // 1. Snapshot current state before updating
        snapshotProfile(existingProfile.id, `对话分析更新: ${name}`);

        // 2. Confidence-weighted merge for each dimension
        const mergedDimensions = { ...existingProfile.dimensions };
        const dimLabels: Record<string, string> = {
          assertiveness: "强势程度", cooperativeness: "合作倾向",
          decisionSpeed: "决策速度", emotionalStability: "情绪稳定性",
          openness: "开放性", empathy: "共情能力",
          riskTolerance: "风险承受", formalityLevel: "正式程度",
        };

        for (const key of Object.keys(dimLabels)) {
          const existing = mergedDimensions[key as keyof typeof mergedDimensions];
          const incoming = newDims[key];
          if (!incoming || typeof incoming !== 'object') continue;

          const oldConf = Math.max(1, existing?.confidence ?? 10);
          // Single-mode (单向揣摩) has lower confidence since it's one-sided observation
          const rawNewConf = Math.max(1, typeof incoming.confidence === 'number' ? incoming.confidence : 10);
          const newConf = isSingleMode ? Math.round(rawNewConf * 0.6) : rawNewConf;
          const totalConf = oldConf + newConf;

          // Weighted average: higher confidence data has more influence
          const mergedValue = Math.round(
            ((existing?.value ?? 50) * oldConf + (incoming.value ?? 50) * newConf) / totalConf
          );
          const mergedConfidence = Math.min(totalConf, 100);

          // Append new evidence, deduplicate
          const existingEvidence = existing?.evidence ?? [];
          const newEvidence = incoming.evidence ?? [];
          const allEvidence = [...existingEvidence];
          for (const e of newEvidence) {
            if (!allEvidence.includes(e)) allEvidence.push(e);
          }
          // Keep only the most recent 10 evidence items
          const trimmedEvidence = allEvidence.slice(-10);

          mergedDimensions[key as keyof typeof mergedDimensions] = {
            ...existing,
            label: key,
            labelZh: dimLabels[key],
            value: mergedValue,
            confidence: mergedConfidence,
            evidence: trimmedEvidence,
          };
        }

        // 3. Merge communication style: prefer newer non-empty values
        const mergedCommStyle = { ...existingProfile.communicationStyle };
        if (pu.communicationStyle && typeof pu.communicationStyle === 'object') {
          if (pu.communicationStyle.overallType) mergedCommStyle.overallType = pu.communicationStyle.overallType;
          if (Array.isArray(pu.communicationStyle.strengths) && pu.communicationStyle.strengths.length) {
            const set = new Set([...(mergedCommStyle.strengths || []), ...pu.communicationStyle.strengths]);
            mergedCommStyle.strengths = [...set].slice(0, 8);
          }
          if (Array.isArray(pu.communicationStyle.weaknesses) && pu.communicationStyle.weaknesses.length) {
            const set = new Set([...(mergedCommStyle.weaknesses || []), ...pu.communicationStyle.weaknesses]);
            mergedCommStyle.weaknesses = [...set].slice(0, 8);
          }
          if (Array.isArray(pu.communicationStyle.triggerPoints) && pu.communicationStyle.triggerPoints.length) {
            const set = new Set([...(mergedCommStyle.triggerPoints || []), ...pu.communicationStyle.triggerPoints]);
            mergedCommStyle.triggerPoints = [...set].slice(0, 8);
          }
          if (Array.isArray(pu.communicationStyle.preferredTopics) && pu.communicationStyle.preferredTopics.length) {
            const set = new Set([...(mergedCommStyle.preferredTopics || []), ...pu.communicationStyle.preferredTopics]);
            mergedCommStyle.preferredTopics = [...set].slice(0, 8);
          }
        }

        // 4. Update patterns: prefer newer non-empty values
        const mergedPatterns = { ...existingProfile.patterns };
        if (pu.patterns && typeof pu.patterns === 'object') {
          if (pu.patterns.responseSpeed) mergedPatterns.responseSpeed = pu.patterns.responseSpeed as string;
          if (pu.patterns.conflictStyle) mergedPatterns.conflictStyle = pu.patterns.conflictStyle as string;
          if (pu.patterns.decisionStyle) mergedPatterns.decisionStyle = pu.patterns.decisionStyle as string;
          if (Array.isArray(pu.patterns.persuasionVulnerability) && pu.patterns.persuasionVulnerability.length) {
            const set = new Set([...(mergedPatterns.persuasionVulnerability || []), ...(pu.patterns.persuasionVulnerability as string[])]);
            mergedPatterns.persuasionVulnerability = [...set].slice(0, 8);
          }
        }

        // 5. Apply merged update — only the direct conversation partner
        updateProfile(existingProfile.id, {
          dimensions: mergedDimensions,
          communicationStyle: mergedCommStyle,
          patterns: mergedPatterns,
          conversationCount: (existingProfile.conversationCount || 0) + 1,
          lastInteraction: new Date().toISOString(),
        });
      } else {
        // ---- Create new profile for this conversation partner ----
        const makeDim = (key: string, labelZh: string) => ({
          label: key,
          labelZh,
          value: newDims[key]?.value ?? 50,
          confidence: newDims[key]?.confidence ?? 10,
          evidence: newDims[key]?.evidence ?? [],
        });

        addProfile({
          id: profileId!,
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

    // ---- Extract and persist AI memories ----
    if (profileId) {
      const memories = extractMemoriesFromAnalysis(
        profileId,
        name,
        result,
        convoId,
      );
      if (memories.length > 0) {
        addMemoriesBatch(memories);
      }
    }

    setSaved(true);
    } catch (err) {
      console.error("Save error:", err);
      addToast({ type: "error", title: "保存失败", message: err instanceof Error ? err.message : "保存过程中发生错误，请重试" });
    }
  };

  const resetToInput = () => {
    setStage("input");
    setResult(null);
    setError("");
    setSaved(false);
    setFormattedConversation("");
    setConversationDate("");
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

          {/* ===== Scenario Shortcuts — show when no conversation entered ===== */}
          {stage === "input" && !conversation.trim() && (
            <ScenarioShortcuts
              onNavigate={(tab, context, goal) => {
                navigateToTab(tab);
              }}
            />
          )}

          {/* ===== STAGE: INPUT ===== */}
          {(stage === "input" || stage === "results") && (
            <div className="space-y-4">
              {/* Mode toggle: conversation vs single-paragraph */}
              <div className="flex items-center gap-1 p-1 bg-zinc-900 rounded-lg border border-zinc-800 w-fit">
                <button
                  onClick={() => setInputMode("conversation")}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    inputMode === "conversation"
                      ? "bg-violet-500/20 text-violet-300 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  💬 对话分析
                </button>
                <button
                  onClick={() => setInputMode("single")}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    inputMode === "single"
                      ? "bg-amber-500/20 text-amber-300 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  🔍 单向揣摩
                </button>
                <button
                  onClick={() => setInputMode("eq-review")}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    inputMode === "eq-review"
                      ? "bg-emerald-500/20 text-emerald-300 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  🎯 情商复盘
                </button>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <input
                  type="text"
                  placeholder={inputMode === "single" ? "说话人称呼（如：王总，可留空）" : inputMode === "eq-review" ? "对方称呼（情商复盘对象）" : "对方称呼（如：王总、李经理，可留空）"}
                  value={targetName}
                  onChange={(e) => setTargetName(e.target.value)}
                  className="flex-1 min-w-[180px] rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/20"
                />
                <button
                  onClick={() => setShowContext(!showContext)}
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors whitespace-nowrap"
                >
                  {showContext ? "隐藏背景" : "+ 添加背景"}
                </button>
                {inputMode === "conversation" && (
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
                )}
              </div>

              {/* Conversation date picker */}
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-zinc-600" />
                <span className="text-[10px] text-zinc-500">对话发生时间</span>
                <input
                  type="datetime-local"
                  value={conversationDate ? new Date(conversationDate).toLocaleString("sv-SE", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).replace(" ", "T") : ""}
                  onChange={(e) => {
                    if (!e.target.value) { setConversationDate(""); return; }
                    // datetime-local returns "YYYY-MM-DDTHH:mm" in local time — preserve it correctly
                    const [datePart, timePart] = e.target.value.split("T");
                    const [y, m, d] = datePart.split("-").map(Number);
                    const [hr, min] = timePart.split(":").map(Number);
                    const local = new Date(y, m - 1, d, hr, min);
                    setConversationDate(local.toISOString());
                  }}
                  className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-400 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/20"
                />
                {!conversationDate && (
                  <span className="text-[9px] text-zinc-600">留空则默认当前时间</span>
                )}
                {conversationDate && (
                  <button onClick={() => setConversationDate("")} className="text-[9px] text-zinc-600 hover:text-zinc-400">清除</button>
                )}
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
                  <div className="absolute top-full left-0 mt-2 z-20 w-[calc(100vw-2rem)] sm:w-[520px] max-h-[70vh] sm:max-h-[400px] rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl shadow-black/40 overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-200">
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
                  placeholder={inputMode === "single"
                    ? `粘贴对方说的话（一段或多段均可）\n\n适合场景：\n• 收到一长段语音转文字，想知道对方什么意思\n• 收到一条消息，不确定该怎么理解和回复\n• 想揣摩对方的真实意图和情绪状态`
                    : inputMode === "eq-review"
                    ? `粘贴完整对话内容，系统将重点复盘你的情商表现\n\n分析内容包括：\n• 每条关键发言的情商评分和改进建议\n• 错失的共情机会\n• 更好的表达方式建议\n• 整体情商表现评分`
                    : `直接粘贴对话内容即可，支持以下格式：\n\n✅ 有标记格式：\n我：你好\n对方：你好啊\n\n✅ 无标记格式（微信直接粘贴）：\n你好\n你好啊\n最近忙吗？\n还行\n\n系统会自动识别格式，无标记时会让你手动标注每句话是谁说的。`}
                  rows={inputMode === "single" ? 6 : 10}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/20 resize-none font-mono leading-relaxed"
                />
                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  <VoiceInputButton
                    compact
                    onTranscript={(text) => setConversation((prev) => prev ? prev + "\n" + text : text)}
                    onComplete={(_text, metrics) => {
                      if (metrics.duration > 5 && inputMode === "single") {
                        const hint = `\n[语音特征：${Math.floor(metrics.duration)}秒, ${metrics.pauseCount}次停顿, ${metrics.wordsPerMinute}字/分${metrics.confidence < 0.7 ? ", 识别不确定" : ""}]`;
                        setContext((prev) => prev + hint);
                      }
                    }}
                  />
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
                <div className="space-y-2">
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
                    {inputMode === "single" ? "开始揣摩分析" : inputMode === "eq-review" ? "开始情商复盘" : "解析对话 & 开始分析"}
                  </button>
                  {detectedPlatform && (
                    <p className="text-[10px] text-center text-cyan-400">
                      ✓ 检测到{detectedPlatform}格式的时间戳，已自动解析
                    </p>
                  )}
                </div>
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

          {/* ===== Loading indicator (streaming) ===== */}
          {loading && (
            <StreamingIndicator
              text={streamingText}
              label="AI 正在深度分析中"
              onAbort={abortStreaming}
            />
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

              {/* Quality Score */}
              <ConversationQualityScore
                analysis={result as unknown as import("@/lib/types").ConversationAnalysis}
                previousAnalyses={(() => {
                  const matchedProfile = profiles.find((p) => p.name === targetName);
                  if (!matchedProfile) return [];
                  return conversations
                    .filter((c) => c.analysis && c.linkedProfileId === matchedProfile.id)
                    .slice(1, 6)
                    .map((c) => c.analysis!);
                })()}
              />

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
