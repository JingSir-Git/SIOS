"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Loader2,
  HeartHandshake,
  User,
  Bot,
  Lightbulb,
  Heart,
  Brain,
  Shield,
  Eye,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Sparkles,
  RotateCcw,
  FileDown,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { apiFetch } from "@/lib/api-fetch";
import { exportChatSessionReport } from "@/lib/export-report";
import ChatHistoryPanel from "./ChatHistoryPanel";
import type { ChatSessionEntry } from "@/lib/types";
import ChatImageAttach, { type AttachedImage, formatAttachedImages } from "./ChatImageAttach";
import ResponseFeedback from "./ResponseFeedback";
import { useT, getAILanguageInstruction } from "@/lib/i18n";
import VoiceInputButton from "./VoiceInputButton";

interface PsyMessage {
  id: string;
  role: "user" | "counselor";
  content: string;
  analysis?: PsyAnalysis;
}

interface PsyAnalysis {
  empathyResponse: string;
  emotionAnalysis?: {
    primaryEmotion: string;
    underlyingNeed: string;
    intensityLevel: number;
  };
  patternInsight?: string;
  cognitiveCheck?: string;
  perspectiveShift?: string;
  actionSteps?: { step: string; rationale: string; example: string }[];
  affirmation?: string;
  followUpQuestions?: string[];
  professionalNote?: string;
}

export default function PsychologyTab() {
  const { profiles, preSelectedProfileId, clearPreSelection, addToast, addUserMemory, getActiveUserMemories, addChatSession, appendChatMessage, updateChatSession, language } = useAppStore();
  const t = useT();
  const [messages, setMessages] = useState<PsyMessage[]>([]);
  const [input, setInput] = useState("");
  const [selfDescription, setSelfDescription] = useState("");
  const [showSelfDesc, setShowSelfDesc] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [includeProfiles, setIncludeProfiles] = useState(true);
  const [selectedProfileIds, setSelectedProfileIds] = useState<Set<string>>(new Set());
  const [showProfilePicker, setShowProfilePicker] = useState(false);
  const [focusProfileId, setFocusProfileId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const ensureSession = useCallback((): string => {
    if (activeSessionId) return activeSessionId;
    const id = `psy_${Date.now()}`;
    const now = new Date().toISOString();
    addChatSession({
      id,
      domain: "psychology",
      title: "心理咨询",
      messages: [],
      createdAt: now,
      updatedAt: now,
      archived: false,
    });
    setActiveSessionId(id);
    return id;
  }, [activeSessionId, addChatSession]);

  const handleSelectSession = useCallback((session: ChatSessionEntry) => {
    setActiveSessionId(session.id);
    setMessages(session.messages.map(m => ({
      id: m.id,
      role: m.role === "user" ? "user" as const : "counselor" as const,
      content: m.content,
    })));
    setShowHistory(false);
  }, []);

  const handleNewSession = useCallback(() => {
    setActiveSessionId(null);
    setMessages([]);
    setInput("");
    setExpandedId(null);
    setShowHistory(false);
  }, []);

  // Pick up cross-tab pre-selection
  useEffect(() => {
    if (preSelectedProfileId) {
      const p = profiles.find((pr) => pr.id === preSelectedProfileId);
      if (p) {
        setFocusProfileId(preSelectedProfileId);
        setInput(`我想聊聊我和${p.name}的关系`);
      }
      clearPreSelection();
    }
  }, [preSelectedProfileId, profiles, clearPreSelection]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const focusProfile = focusProfileId ? profiles.find((p) => p.id === focusProfileId) : null;

  const buildProfilesSummary = (): string => {
    if (!includeProfiles || profiles.length === 0) return "";
    // Filter by selected profiles if any are chosen
    const filtered = selectedProfileIds.size > 0
      ? profiles.filter((p) => selectedProfileIds.has(p.id))
      : profiles;
    if (filtered.length === 0) return "";
    // Put focused profile first if available
    const sorted = focusProfileId
      ? [...filtered].sort((a, b) => (a.id === focusProfileId ? -1 : b.id === focusProfileId ? 1 : 0))
      : filtered;
    return sorted
      .map((p) => {
        const sub = p.subjectiveImpression;
        let line = `【${p.name}】`;
        if (p.tags?.length) line += ` 标签: ${p.tags.join("、")}`;
        if (p.communicationStyle?.overallType && p.communicationStyle.overallType !== "待分析") {
          line += ` | 沟通风格: ${p.communicationStyle.overallType}`;
        }
        if (sub) {
          if (sub.relationship) line += ` | 关系: ${sub.relationship}`;
          if (sub.emotionalTone) line += ` | 你的态度: ${sub.emotionalTone}`;
          line += ` | 信任度: ${sub.trustLevel}%`;
          if (sub.unresolved) line += ` | 待解决: ${sub.unresolved}`;
          if (sub.personalityKeywords.length > 0) line += ` | 印象: ${sub.personalityKeywords.join("、")}`;
        }
        return line;
      })
      .join("\n");
  };

  const buildConversationHistory = (): string => {
    if (messages.length === 0) return "";
    return messages
      .map((m) => {
        if (m.role === "user") return `用户: ${m.content}`;
        if (m.analysis?.empathyResponse) return `顾问: ${m.analysis.empathyResponse}`;
        return `顾问: ${m.content}`;
      })
      .join("\n");
  };

  const abortRef = useRef<AbortController | null>(null);

  const abortStreaming = useCallback(() => {
    if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; }
    setLoading(false);
  }, []);

  const sendMessage = async () => {
    if ((!input.trim() && attachedImages.length === 0) || loading) return;

    // Append image descriptions if any images are attached
    const imageCtx = formatAttachedImages(attachedImages);
    const rawInput = input.trim() || "请分析这张图片";
    const currentInput = imageCtx ? `${rawInput}\n\n${imageCtx}` : rawInput;
    setAttachedImages([]);

    const userMsg: PsyMessage = {
      id: Date.now().toString(),
      role: "user",
      content: rawInput,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Persist user message
    const sessionId = ensureSession();
    appendChatMessage(sessionId, { id: userMsg.id, role: "user", content: currentInput, timestamp: new Date().toISOString() });

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const counselorMsgId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, { id: counselorMsgId, role: "counselor", content: "" }]);

    try {
      // Inject user long-term memories for cross-session context
      const userMems = getActiveUserMemories().filter(m => m.category === "psychology" || m.category === "family" || m.category === "general");
      const memoryCtx = userMems.length > 0
        ? `\n【用户历史背景记忆】\n${userMems.map(m => `- ${m.content}`).join("\n")}`
        : "";
      const enrichedSelfDesc = (selfDescription.trim() || "") + memoryCtx;

      const res = await apiFetch("/api/psychology?stream=true", {
        method: "POST",
        body: JSON.stringify({
          message: currentInput,
          profilesSummary: buildProfilesSummary() || undefined,
          selfDescription: enrichedSelfDesc || undefined,
          conversationHistory: buildConversationHistory() || undefined,
          languageInstruction: getAILanguageInstruction(language),
        }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error("请求失败");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("无法读取响应流");
      const decoder = new TextDecoder();
      let buffer = "";
      let streamedText = "";

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
              streamedText += event.text;
              const display = streamedText.replace(/<think>[\s\S]*?<\/think>/g, "").replace(/<think>[\s\S]*$/g, "").trim();
              setMessages((prev) =>
                prev.map((m) => m.id === counselorMsgId ? { ...m, content: display || "正在思考..." } : m)
              );
            } else if (event.type === "result" && event.data) {
              const data = event.data as PsyAnalysis & { empathyResponse?: string };
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === counselorMsgId
                    ? { ...m, content: data.empathyResponse || streamedText || "...", analysis: data }
                    : m
                )
              );
              setExpandedId(counselorMsgId);
            } else if (event.type === "error") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === counselorMsgId
                    ? { ...m, content: streamedText || `（分析出错：${event.text || "未知错误"}，请重试）` }
                    : m
                )
              );
            }
          } catch { /* skip malformed SSE line */ }
        }
      }
      // Persist assistant message
      setMessages(prev => {
        const counselorMsg = prev.find(m => m.id === counselorMsgId);
        if (counselorMsg?.content) {
          appendChatMessage(sessionId, { id: counselorMsgId, role: "assistant", content: counselorMsg.content, timestamp: new Date().toISOString() });
        }
        return prev;
      });
      // Notify if user switched away
      const currentTab = useAppStore.getState().activeTab;
      if (currentTab !== "psychology") {
        addToast({
          type: "success",
          title: "心理顾问已回复",
          message: "心理顾问已回复您的咨询",
          duration: 8000,
          action: { label: "查看回复", tab: "psychology" },
        });
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      console.error(err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === counselorMsgId
            ? { ...m, content: "（系统暂时无法响应，请稍后再试）" }
            : m
        )
      );
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const resetSession = () => {
    // Auto-save session summary as user memory if conversation had substance
    if (messages.length >= 4) {
      const userQs = messages.filter(m => m.role === "user").map(m => m.content);
      const summary = `[心理咨询] ${userQs.slice(0, 2).join("；").slice(0, 120)}`;
      addUserMemory({
        id: `psy_${Date.now()}`,
        category: "psychology",
        content: summary,
        source: `心理顾问 ${new Date().toLocaleDateString("zh-CN")}`,
        importance: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        archived: false,
      });
      if (activeSessionId) {
        updateChatSession(activeSessionId, { summary: summary.slice(0, 100) });
      }
    }
    setActiveSessionId(null);
    setMessages([]);
    setExpandedId(null);
  };

  return (
    <div className="flex h-full">
      {/* History sidebar */}
      {showHistory && (
        <div className="w-64 border-r border-zinc-800 bg-zinc-950 shrink-0">
          <ChatHistoryPanel
            domain="psychology"
            activeSessionId={activeSessionId}
            onSelectSession={handleSelectSession}
            onNewSession={handleNewSession}
          />
        </div>
      )}
      {/* Main Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={cn(
                "flex items-center justify-center w-9 h-9 rounded-xl border transition-colors",
                showHistory
                  ? "bg-rose-500/20 border-rose-500/30 text-rose-400"
                  : "bg-rose-500/10 border-rose-500/20 text-rose-400/60 hover:text-rose-400"
              )}
              title="历史会话"
            >
              <History className="h-4 w-4" />
            </button>
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 shadow-lg shadow-rose-500/10">
              <HeartHandshake className="h-5 w-5 text-rose-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-zinc-100">{t.psychology.title}</h1>
              <p className="text-[10px] text-zinc-500">
                {t.psychology.subtitle}
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  exportChatSessionReport({
                    title: "心理顾问咨询记录",
                    subtitle: `${messages.length} 条对话 · ${new Date().toLocaleDateString("zh-CN")}`,
                    messages: messages.map(m => ({ role: m.role === "user" ? "user" as const : "counselor" as const, content: m.content })),
                    disclaimer: "AI心理顾问仅供参考，不能替代专业心理咨询。如有严重心理困扰，请寻求专业帮助。",
                  });
                }}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300 transition-colors"
              >
                <FileDown className="h-3 w-3" />
                {t.common.export}
              </button>
              <button
                onClick={resetSession}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300 transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                {t.common.newChat}
              </button>
            </div>
          )}
        </div>

        {/* Config Bar */}
        <div className="border-b border-zinc-800 px-6 py-2.5 flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-1.5 text-[10px] text-zinc-500 cursor-pointer">
            <input
              type="checkbox"
              checked={includeProfiles}
              onChange={(e) => setIncludeProfiles(e.target.checked)}
              className="rounded border-zinc-700 bg-zinc-800 accent-rose-500 h-3 w-3"
            />
            共享画像
          </label>
          {includeProfiles && profiles.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowProfilePicker(!showProfilePicker)}
                className={cn(
                  "flex items-center gap-1 text-[10px] px-2 py-1 rounded border transition-colors",
                  showProfilePicker
                    ? "text-violet-300 border-violet-500/30 bg-violet-500/10"
                    : "text-zinc-500 border-zinc-700 hover:text-zinc-300"
                )}
              >
                <Eye className="h-3 w-3" />
                {selectedProfileIds.size > 0
                  ? `已选 ${selectedProfileIds.size}/${profiles.length}`
                  : `全部 ${profiles.length} 人`
                }
                {showProfilePicker ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
              </button>
              {showProfilePicker && (
                <div className="absolute top-full left-0 mt-1 z-40 min-w-[200px] rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl p-2 space-y-1 animate-in fade-in-0 slide-in-from-top-1 duration-150">
                  <div className="flex items-center justify-between px-1 pb-1 border-b border-zinc-800 mb-1">
                    <span className="text-[9px] text-zinc-500">选择要共享的画像</span>
                    <button
                      onClick={() => {
                        if (selectedProfileIds.size === profiles.length) {
                          setSelectedProfileIds(new Set());
                        } else {
                          setSelectedProfileIds(new Set(profiles.map((p) => p.id)));
                        }
                      }}
                      className="text-[9px] text-violet-400 hover:text-violet-300"
                    >
                      {selectedProfileIds.size === profiles.length ? "取消全选" : "全选"}
                    </button>
                  </div>
                  {profiles.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 px-1 py-0.5 rounded hover:bg-zinc-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedProfileIds.size === 0 || selectedProfileIds.has(p.id)}
                        onChange={(e) => {
                          const next = new Set(selectedProfileIds.size === 0 ? profiles.map((pr) => pr.id) : selectedProfileIds);
                          if (e.target.checked) next.add(p.id); else next.delete(p.id);
                          setSelectedProfileIds(next);
                        }}
                        className="rounded border-zinc-700 bg-zinc-800 accent-violet-500 h-3 w-3"
                      />
                      <span className="text-[10px] text-zinc-300">{p.name}</span>
                      {p.tags?.length ? (
                        <span className="text-[9px] text-zinc-600 truncate max-w-[100px]">{p.tags.slice(0, 2).join("、")}</span>
                      ) : null}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
          {focusProfile && (
            <div className="flex items-center gap-1.5 text-[10px] text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded px-2 py-1">
              <User className="h-3 w-3" />
              聚焦：{focusProfile.name}
              <button
                onClick={() => setFocusProfileId(null)}
                className="text-rose-400/60 hover:text-rose-300 ml-0.5"
              >
                ×
              </button>
            </div>
          )}
          <button
            onClick={() => setShowSelfDesc(!showSelfDesc)}
            className={cn(
              "flex items-center gap-1 text-[10px] px-2 py-1 rounded border transition-colors",
              showSelfDesc
                ? "text-rose-300 border-rose-500/30 bg-rose-500/10"
                : "text-zinc-500 border-zinc-700 hover:text-zinc-300"
            )}
          >
            <User className="h-3 w-3" />
            自我描述
          </button>
        </div>

        {/* Self Description Input (collapsible) */}
        {showSelfDesc && (
          <div className="border-b border-zinc-800 px-6 py-3 bg-zinc-900/30">
            <label className="text-[10px] text-zinc-500 mb-1 block">
              描述你自己的性格、沟通风格、或当前状态（帮助AI更好地理解你）
            </label>
            <textarea
              value={selfDescription}
              onChange={(e) => setSelfDescription(e.target.value)}
              placeholder="例如：我是一个比较内向的人，不擅长表达情感，遇到冲突倾向于回避..."
              rows={2}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-rose-500/50 resize-none"
            />
          </div>
        )}

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <HeartHandshake className="h-12 w-12 text-zinc-700 mb-4" />
              <h3 className="text-sm font-medium text-zinc-400 mb-2">
                {t.psychology.greeting}
              </h3>
              <p className="text-xs text-zinc-600 max-w-md leading-relaxed mb-6">
                {t.psychology.greetingSub}
              </p>
              <div className="grid gap-2 max-w-sm w-full">
                {[
                  "最近和同事的关系有些紧张，不知道怎么处理",
                  "我发现自己总是在冲突中退缩，想改变这种模式",
                  "跟一个重要客户的信任似乎在下降，我很焦虑",
                  "我觉得自己在团队中总是不被重视",
                ].map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(q)}
                    className="text-left rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-[11px] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id}>
              {msg.role === "user" ? (
                <div className="flex justify-end">
                  <div className="max-w-[75%] rounded-2xl rounded-br-md bg-rose-600/20 border border-rose-500/20 px-4 py-3">
                    <p className="text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Empathy Response */}
                  <div className="flex gap-3 max-w-[85%]">
                    <div className="shrink-0 mt-1">
                      <div className="w-7 h-7 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                        <HeartHandshake className="h-3.5 w-3.5 text-rose-400" />
                      </div>
                    </div>
                    <div className="rounded-2xl rounded-bl-md bg-zinc-800/50 border border-zinc-700/50 px-4 py-3">
                      <p className="text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap">
                        {msg.analysis?.empathyResponse || msg.content}
                      </p>
                      {msg.content && (
                        <div className="flex justify-end mt-1.5 border-t border-zinc-700/30 pt-1">
                          <ResponseFeedback messageId={msg.id} module="psychology" responseSnippet={msg.analysis?.empathyResponse || msg.content} compact />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expanded Analysis */}
                  {msg.analysis && (
                    <div className="ml-10">
                      <button
                        onClick={() => setExpandedId(expandedId === msg.id ? null : msg.id)}
                        className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors mb-2"
                      >
                        {expandedId === msg.id ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                        {expandedId === msg.id ? "收起详细分析" : "展开详细分析"}
                      </button>

                      {expandedId === msg.id && (
                        <div className="space-y-3 animate-in fade-in-0 slide-in-from-top-1 duration-200">
                          {/* Emotion Analysis */}
                          {msg.analysis.emotionAnalysis && (
                            <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/20 p-3">
                              <div className="flex items-center gap-1.5 mb-2">
                                <Heart className="h-3 w-3 text-rose-400" />
                                <span className="text-[10px] font-medium text-rose-300">情绪解读</span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-[10px]">
                                <div>
                                  <span className="text-zinc-600 block">核心情绪</span>
                                  <span className="text-zinc-300">{msg.analysis.emotionAnalysis.primaryEmotion}</span>
                                </div>
                                <div>
                                  <span className="text-zinc-600 block">深层需求</span>
                                  <span className="text-zinc-300">{msg.analysis.emotionAnalysis.underlyingNeed}</span>
                                </div>
                                <div>
                                  <span className="text-zinc-600 block">强度</span>
                                  <div className="flex items-center gap-1">
                                    <div className="relative flex-1 h-1.5 rounded-full bg-zinc-800">
                                      <div className="absolute inset-0 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full" style={{ width: `${msg.analysis.emotionAnalysis.intensityLevel * 10}%`, background: "linear-gradient(to right, #3f3f46, #f43f5e)", opacity: 0.3 }} />
                                      </div>
                                      <div className="absolute top-[-1px] w-0.5 h-2.5 rounded-sm bg-rose-400" style={{ left: `${msg.analysis.emotionAnalysis.intensityLevel * 10}%`, transform: "translateX(-50%)" }} />
                                    </div>
                                    <span className="text-zinc-400 font-mono text-[10px]">{msg.analysis.emotionAnalysis.intensityLevel}/10</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Pattern Insight */}
                          {msg.analysis.patternInsight && (
                            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <Brain className="h-3 w-3 text-amber-400" />
                                <span className="text-[10px] font-medium text-amber-300">模式洞察</span>
                              </div>
                              <p className="text-[11px] text-zinc-400 leading-relaxed">{msg.analysis.patternInsight}</p>
                            </div>
                          )}

                          {/* Cognitive Check */}
                          {msg.analysis.cognitiveCheck && (
                            <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <Eye className="h-3 w-3 text-blue-400" />
                                <span className="text-[10px] font-medium text-blue-300">认知审视</span>
                              </div>
                              <p className="text-[11px] text-zinc-400 leading-relaxed">{msg.analysis.cognitiveCheck}</p>
                            </div>
                          )}

                          {/* Perspective Shift */}
                          {msg.analysis.perspectiveShift && (
                            <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <Sparkles className="h-3 w-3 text-violet-400" />
                                <span className="text-[10px] font-medium text-violet-300">视角转换</span>
                              </div>
                              <p className="text-[11px] text-zinc-400 leading-relaxed">{msg.analysis.perspectiveShift}</p>
                            </div>
                          )}

                          {/* Action Steps */}
                          {msg.analysis.actionSteps && msg.analysis.actionSteps.length > 0 && (
                            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                              <div className="flex items-center gap-1.5 mb-2">
                                <Lightbulb className="h-3 w-3 text-emerald-400" />
                                <span className="text-[10px] font-medium text-emerald-300">行动建议</span>
                              </div>
                              <div className="space-y-2">
                                {msg.analysis.actionSteps.map((s, i) => (
                                  <div key={i} className="space-y-0.5">
                                    <p className="text-[11px] text-zinc-200 font-medium">{i + 1}. {s.step}</p>
                                    <p className="text-[10px] text-zinc-500 pl-3">{s.rationale}</p>
                                    {s.example && (
                                      <p className="text-[10px] text-emerald-400/70 pl-3 italic">💬 "{s.example}"</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Affirmation */}
                          {msg.analysis.affirmation && (
                            <div className="rounded-lg border border-pink-500/20 bg-pink-500/5 p-3">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <Shield className="h-3 w-3 text-pink-400" />
                                <span className="text-[10px] font-medium text-pink-300">积极肯定</span>
                              </div>
                              <p className="text-[11px] text-zinc-400 leading-relaxed">{msg.analysis.affirmation}</p>
                            </div>
                          )}

                          {/* Follow Up Questions */}
                          {msg.analysis.followUpQuestions && msg.analysis.followUpQuestions.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {msg.analysis.followUpQuestions.map((q, i) => (
                                <button
                                  key={i}
                                  onClick={() => setInput(q)}
                                  className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-2.5 py-1.5 text-[10px] text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
                                >
                                  {q}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Professional Note */}
                          {msg.analysis.professionalNote && (
                            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-2.5 flex items-start gap-2">
                              <AlertTriangle className="h-3 w-3 text-red-400 shrink-0 mt-0.5" />
                              <p className="text-[10px] text-red-300/80">{msg.analysis.professionalNote}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="shrink-0 mt-1">
                <div className="w-7 h-7 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                  <Loader2 className="h-3.5 w-3.5 text-rose-400 animate-spin" />
                </div>
              </div>
              <div className="rounded-2xl rounded-bl-md bg-zinc-800/50 border border-zinc-700/50 px-4 py-3">
                <p className="text-xs text-zinc-500">正在倾听和分析...</p>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="border-t border-zinc-800 px-6 py-3">
          <div className="flex gap-2 items-end">
            <ChatImageAttach
              images={attachedImages}
              onChange={setAttachedImages}
              maxCount={3}
              disabled={loading}
              ocrMode="chat"
              compact
            />
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={attachedImages.length > 0 ? t.common.describeImage : t.psychology.inputPlaceholder}
              rows={2}
              className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-rose-500/50 resize-none"
            />
            <div className="flex flex-col gap-1.5 shrink-0">
              <VoiceInputButton
                onTranscript={(text) => setInput((prev) => prev + text)}
                compact
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={loading || (!input.trim() && attachedImages.length === 0)}
              className="shrink-0 rounded-xl bg-rose-600 p-3 text-white hover:bg-rose-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-rose-500/20"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
          <p className="text-[9px] text-zinc-700 mt-1.5 text-center">
            {t.psychology.disclaimer}
          </p>
        </div>
      </div>
    </div>
  );
}
