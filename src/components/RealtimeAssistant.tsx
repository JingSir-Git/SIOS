"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  Zap,
  Send,
  Loader2,
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Shield,
  Heart,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Copy,
  Check,
  User,
  Bot,
  Sparkles,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { apiFetch } from "@/lib/api-fetch";
import {
  detectEmotion,
  predictEmotionTrajectory,
  retrieveRAGContext,
  type EmotionPrediction,
} from "@/lib/rag-memory";

interface AssistMessage {
  id: string;
  role: "incoming" | "suggestion" | "system";
  content: string;
  emotion?: { primary: string; valence: number; intensity: number };
  timestamp: string;
}

const RISK_COLORS: Record<string, string> = {
  low: "text-emerald-400",
  medium: "text-amber-400",
  high: "text-orange-400",
  critical: "text-red-400",
};

const RISK_BG: Record<string, string> = {
  low: "bg-emerald-500/10",
  medium: "bg-amber-500/10",
  high: "bg-orange-500/10",
  critical: "bg-red-500/10",
};

const TREND_ICONS: Record<string, typeof TrendingUp> = {
  escalating: TrendingUp,
  stable: Minus,
  "de-escalating": TrendingDown,
};

export default function RealtimeAssistant() {
  const { profiles, conversations, profileMemories, getActiveMemoriesForProfile, addToast } = useAppStore();

  const [messages, setMessages] = useState<AssistMessage[]>([]);
  const [incomingText, setIncomingText] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [loading, setLoading] = useState(false);
  const [showEmotionPanel, setShowEmotionPanel] = useState(true);
  const [prediction, setPrediction] = useState<EmotionPrediction | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedProfile = useMemo(
    () => profiles.find((p) => p.id === selectedProfileId),
    [profiles, selectedProfileId]
  );

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Re-compute emotion prediction when messages change
  useEffect(() => {
    if (messages.length > 0) {
      const allMsgs = messages.map((m) => ({
        content: m.content,
        role: m.role === "incoming" ? "other" : "self",
      }));
      const pred = predictEmotionTrajectory(allMsgs);
      setPrediction(pred);
    }
  }, [messages]);

  const handleAddIncoming = useCallback(() => {
    const text = incomingText.trim();
    if (!text) return;

    const emotion = detectEmotion(text);
    const msg: AssistMessage = {
      id: Date.now().toString(),
      role: "incoming",
      content: text,
      emotion: {
        primary: emotion.primaryEmotion,
        valence: emotion.valence,
        intensity: emotion.intensity,
      },
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, msg]);
    setIncomingText("");

    // Auto-generate suggestion
    generateSuggestion([...messages, msg]);
  }, [incomingText, messages]);

  const generateSuggestion = useCallback(
    async (currentMessages: AssistMessage[]) => {
      if (loading) return;
      setLoading(true);

      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      // Build RAG context from relevant memories
      let ragContext = "";
      if (selectedProfile) {
        const memories = getActiveMemoriesForProfile(selectedProfile.id);
        const lastIncoming = currentMessages.filter((m) => m.role === "incoming").slice(-3);
        const queryText = lastIncoming.map((m) => m.content).join(" ");
        ragContext = retrieveRAGContext(memories, queryText, selectedProfile);
      }

      // Build emotion context
      const emotionCtx = currentMessages
        .filter((m) => m.emotion)
        .slice(-5)
        .map((m) => `[${m.emotion!.primary} 强度${m.emotion!.intensity}%] ${m.content}`)
        .join("\n");

      const profileCtx = selectedProfile
        ? `对方画像: ${selectedProfile.name}
沟通类型: ${selectedProfile.communicationStyle?.overallType || "未知"}
强势程度: ${selectedProfile.dimensions?.assertiveness?.value || 50}/100
合作倾向: ${selectedProfile.dimensions?.cooperativeness?.value || 50}/100
情绪稳定性: ${selectedProfile.dimensions?.emotionalStability?.value || 50}/100
触发点: ${selectedProfile.communicationStyle?.triggerPoints?.join("、") || "未知"}`
        : "";

      const conversationHistory = currentMessages
        .map((m) => (m.role === "incoming" ? `对方: ${m.content}` : m.role === "suggestion" ? `[AI建议] ${m.content}` : ""))
        .filter(Boolean)
        .join("\n");

      try {
        const sugId = (Date.now() + 1).toString();
        setMessages((prev) => [
          ...prev,
          { id: sugId, role: "suggestion", content: "", timestamp: new Date().toISOString() },
        ]);

        const res = await apiFetch("/api/coach?stream=true", {
          method: "POST",
          body: JSON.stringify({
            messages: conversationHistory,
            targetProfile: selectedProfile
              ? {
                  name: selectedProfile.name,
                  dimensions: Object.fromEntries(
                    Object.entries(selectedProfile.dimensions || {}).map(([k, d]) => [
                      k,
                      { value: d.value, confidence: d.confidence },
                    ])
                  ),
                  communicationStyle: selectedProfile.communicationStyle,
                  patterns: selectedProfile.patterns,
                }
              : undefined,
            userGoal: `实时对话辅助模式。${ragContext ? `\n\n${ragContext}` : ""}${emotionCtx ? `\n\n情绪轨迹:\n${emotionCtx}` : ""}${profileCtx ? `\n\n${profileCtx}` : ""}\n\n请基于以上信息，给出一条最佳回复建议（直接给出回复内容，不需要额外解释，简洁有力）。`,
          }),
          signal: controller.signal,
        });

        if (!res.ok) throw new Error("请求失败");

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No reader");
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const evt = JSON.parse(line.slice(6));
              if (evt.type === "progress" && evt.text) {
                accumulated += evt.text;
                setMessages((prev) =>
                  prev.map((m) => (m.id === sugId ? { ...m, content: accumulated } : m))
                );
              } else if (evt.type === "result" && evt.data) {
                const data = evt.data as Record<string, unknown>;
                const suggestion =
                  (data.suggestedReply as string) ||
                  (data.immediateAction as string) ||
                  accumulated;
                setMessages((prev) =>
                  prev.map((m) => (m.id === sugId ? { ...m, content: suggestion } : m))
                );
              }
            } catch {
              // skip invalid JSON
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          addToast({
            type: "error",
            title: "建议生成失败",
            message: err instanceof Error ? err.message : "未知错误",
          });
        }
      } finally {
        setLoading(false);
      }
    },
    [loading, selectedProfile, getActiveMemoriesForProfile, addToast]
  );

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReset = () => {
    setMessages([]);
    setPrediction(null);
    if (abortRef.current) abortRef.current.abort();
    setLoading(false);
  };

  const TrendIcon = prediction ? TREND_ICONS[prediction.trend] || Minus : Minus;

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-12rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-semibold">实时对话助手</h3>
          <span className="text-xs text-white/40">RAG记忆增强 · 情绪预测</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedProfileId}
            onChange={(e) => setSelectedProfileId(e.target.value)}
            className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-white/70 focus:outline-none"
          >
            <option value="">选择对话对象...</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleReset}
            className="p-1.5 text-white/40 hover:text-white/70 transition-colors"
            title="重置对话"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Emotion Prediction Panel */}
      {prediction && (
        <div
          className={cn(
            "flex-shrink-0 rounded-lg border transition-all mb-3",
            RISK_BG[prediction.riskLevel],
            prediction.riskLevel === "critical"
              ? "border-red-500/30"
              : prediction.riskLevel === "high"
              ? "border-orange-500/30"
              : "border-white/10"
          )}
        >
          <button
            onClick={() => setShowEmotionPanel(!showEmotionPanel)}
            className="w-full flex items-center justify-between p-2.5"
          >
            <div className="flex items-center gap-3">
              <Activity className={cn("w-4 h-4", RISK_COLORS[prediction.riskLevel])} />
              <span className="text-xs font-medium">
                情绪: {prediction.currentEmotion} · 强度{prediction.intensity}%
              </span>
              <div className="flex items-center gap-1 text-xs text-white/50">
                <TrendIcon className="w-3 h-3" />
                {prediction.trend === "escalating"
                  ? "升级中"
                  : prediction.trend === "de-escalating"
                  ? "缓和中"
                  : "稳定"}
              </div>
              {prediction.riskLevel !== "low" && (
                <span className={cn("text-xs font-medium", RISK_COLORS[prediction.riskLevel])}>
                  {prediction.riskLevel === "critical"
                    ? "⚠️ 高危"
                    : prediction.riskLevel === "high"
                    ? "⚠ 注意"
                    : "● 关注"}
                </span>
              )}
            </div>
            {showEmotionPanel ? (
              <ChevronUp className="w-3 h-3 text-white/40" />
            ) : (
              <ChevronDown className="w-3 h-3 text-white/40" />
            )}
          </button>
          {showEmotionPanel && prediction.suggestions.length > 0 && (
            <div className="px-3 pb-2.5 space-y-1">
              {prediction.suggestions.map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-white/60">
                  <Sparkles className="w-3 h-3 mt-0.5 text-violet-400 flex-shrink-0" />
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 min-h-0 pr-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-white/30 gap-3">
            <Brain className="w-12 h-12" />
            <p className="text-sm">粘贴对方发来的消息，AI会实时给出回复建议</p>
            <p className="text-xs">基于RAG记忆检索 + 情绪预测，提供个性化策略</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "rounded-lg p-3",
              msg.role === "incoming"
                ? "bg-white/5 border border-white/10"
                : msg.role === "suggestion"
                ? "bg-violet-500/10 border border-violet-500/20"
                : "bg-blue-500/10 border border-blue-500/20"
            )}
          >
            <div className="flex items-center gap-2 mb-1.5">
              {msg.role === "incoming" ? (
                <>
                  <User className="w-3.5 h-3.5 text-white/50" />
                  <span className="text-xs font-medium text-white/60">
                    {selectedProfile?.name || "对方"}
                  </span>
                  {msg.emotion && (
                    <span
                      className={cn(
                        "text-xs px-1.5 py-0.5 rounded",
                        msg.emotion.valence < -0.3
                          ? "bg-red-500/20 text-red-300"
                          : msg.emotion.valence > 0.3
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-white/10 text-white/50"
                      )}
                    >
                      {msg.emotion.primary} {msg.emotion.intensity}%
                    </span>
                  )}
                </>
              ) : (
                <>
                  <Bot className="w-3.5 h-3.5 text-violet-400" />
                  <span className="text-xs font-medium text-violet-300">AI建议</span>
                  {msg.content && (
                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="ml-auto p-0.5 text-white/30 hover:text-white/60 transition-colors"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </>
              )}
            </div>
            <div className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
              {msg.content || (
                <span className="text-white/30 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> 思考中...
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 mt-3 flex gap-2">
        <textarea
          value={incomingText}
          onChange={(e) => setIncomingText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleAddIncoming();
            }
          }}
          placeholder="粘贴对方发来的消息..."
          rows={2}
          className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-violet-500/50 resize-none"
        />
        <button
          onClick={handleAddIncoming}
          disabled={!incomingText.trim() || loading}
          className="self-end px-4 py-2 bg-violet-500/20 text-violet-300 rounded-lg text-sm hover:bg-violet-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          发送
        </button>
      </div>
    </div>
  );
}
