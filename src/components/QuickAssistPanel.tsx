"use client";

import { useState, useRef, useCallback } from "react";
import { useDraggable } from "@/hooks/useDraggable";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Copy,
  Check,
  ChevronDown,
  Sparkles,
  Zap,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { apiFetch } from "@/lib/api-fetch";
import { formatMemoriesForPrompt } from "@/lib/memory-utils";
import VoiceInputButton from "./VoiceInputButton";

interface QuickCoachResult {
  suggestedReply: string;
  toneAdvice: string;
  riskWarning: string;
  alternativeApproach: string;
}

export default function QuickAssistPanel() {
  const { profiles, mbtiResults, getActiveMemoriesForProfile } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const wasDragRef = useRef(false);
  const { positionStyle, isDragging, handlePointerDown, handlePointerMove, handlePointerUp } = useDraggable({
    initialOffset: { bottom: 80, right: 16 },
    storageKey: "sios-fab-position",
  });
  const [incomingMessage, setIncomingMessage] = useState("");
  const [context, setContext] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QuickCoachResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId);
  const latestMBTI = mbtiResults.length > 0 ? mbtiResults[0] : null;

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const handleSubmit = async () => {
    if (!incomingMessage.trim() || loading) return;

    setLoading(true);
    setResult(null);
    setStreamingText("");

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      let profileContext = "";
      if (selectedProfile) {
        const dims = selectedProfile.dimensions;
        const memories = getActiveMemoriesForProfile(selectedProfile.id);
        const memoryText = memories.length > 0 ? formatMemoriesForPrompt(memories, selectedProfile) : "";
        profileContext = `对方信息:
姓名: ${selectedProfile.name}
沟通风格: ${selectedProfile.communicationStyle?.overallType || "未知"}
强势程度: ${dims.assertiveness.value}/100
合作倾向: ${dims.cooperativeness.value}/100
情绪稳定性: ${dims.emotionalStability.value}/100
冲突处理: ${selectedProfile.patterns?.conflictStyle || "未知"}
触发点: ${selectedProfile.communicationStyle?.triggerPoints?.join("、") || "未知"}
${memoryText ? `\nAI记忆:\n${memoryText}` : ""}`;
      }

      const mbtiContext = latestMBTI ? `\n我的MBTI类型: ${latestMBTI.type}` : "";

      const res = await apiFetch("/api/coach?stream=true", {
        method: "POST",
        body: JSON.stringify({
          messages: `对方：${incomingMessage.trim()}`,
          targetProfile: selectedProfile ? {
            name: selectedProfile.name,
            dimensions: Object.fromEntries(
              Object.entries(selectedProfile.dimensions).map(([k, d]) => [k, { value: d.value, confidence: d.confidence }])
            ),
            communicationStyle: selectedProfile.communicationStyle,
            patterns: selectedProfile.patterns,
          } : undefined,
          userGoal: [
            context.trim() || "有效回应对方的消息，保持良好的沟通氛围",
            mbtiContext,
            profileContext ? `\n\n${profileContext}` : "",
          ].filter(Boolean).join("\n"),
        }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error("请求失败");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("无法读取响应流");
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

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
              fullText += event.text;
              setStreamingText(fullText);
            } else if (event.type === "result" && event.data) {
              const data = event.data;
              setResult({
                suggestedReply: data.suggestedReply || data.suggestedResponse || "",
                toneAdvice: data.currentDynamic || data.tips?.[0]?.content || "",
                riskWarning: data.tips?.find((t: { type: string }) => t.type === "warning")?.content || "",
                alternativeApproach: data.scriptTemplates?.[0]?.script || data.tips?.[1]?.content || "",
              });
              setStreamingText("");
            } else if (event.type === "error") {
              throw new Error(event.data || "分析失败");
            }
          } catch {
            // skip malformed SSE lines
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setStreamingText("");
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const handleReset = () => {
    setResult(null);
    setStreamingText("");
    setIncomingMessage("");
    setContext("");
  };

  if (!isOpen) {
    return (
      <div
        style={positionStyle}
        className="z-40 touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={(e) => {
          const wasDrag = handlePointerUp(e);
          wasDragRef.current = !!wasDrag;
        }}
      >
        <button
          onClick={() => { if (!wasDragRef.current) setIsOpen(true); wasDragRef.current = false; }}
          className={cn(
            "h-12 w-12 rounded-full bg-gradient-to-br from-violet-600 to-pink-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all flex items-center justify-center group",
            isDragging ? "scale-110 cursor-grabbing" : "hover:scale-105 cursor-grab"
          )}
          title="快速对话辅助（可拖动）"
        >
          <MessageCircle className="h-5 w-5 group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 border-2 border-zinc-900 animate-pulse" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 md:bottom-6 md:right-6 z-50 w-full md:w-[380px] max-h-[85vh] md:max-h-[560px] rounded-t-2xl md:rounded-2xl border border-zinc-700/80 bg-zinc-900/95 backdrop-blur-xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500/20 to-pink-500/20 border border-violet-500/30 flex items-center justify-center">
            <Zap className="h-3.5 w-3.5 text-violet-400" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-zinc-200">实时对话辅助</h3>
            <p className="text-[9px] text-zinc-600">粘贴对方的消息，获取即时回复建议</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="h-6 w-6 rounded-md flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Profile Selector */}
        <div className="relative">
          <label className="text-[10px] text-zinc-500 mb-1 block">对方是谁？（可选）</label>
          <div className="relative">
            <select
              value={selectedProfileId}
              onChange={(e) => setSelectedProfileId(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-1.5 text-[11px] text-zinc-300 appearance-none pr-7 focus:outline-none focus:border-violet-500/50"
            >
              <option value="">不选择（通用建议）</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500 pointer-events-none" />
          </div>
        </div>

        {/* Incoming Message */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] text-zinc-500">对方说了什么？</label>
            <VoiceInputButton
              compact
              onTranscript={(text) => setIncomingMessage((prev) => prev ? prev + " " + text : text)}
              className="scale-90 origin-right"
            />
          </div>
          <textarea
            value={incomingMessage}
            onChange={(e) => setIncomingMessage(e.target.value)}
            placeholder="粘贴或语音输入对方发给你的消息..."
            rows={3}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-[11px] text-zinc-300 placeholder-zinc-600 resize-none focus:outline-none focus:border-violet-500/50"
          />
        </div>

        {/* Context */}
        <div>
          <label className="text-[10px] text-zinc-500 mb-1 block">你想达到什么效果？（可选）</label>
          <input
            type="text"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="例如：拒绝但不伤感情、安慰对方..."
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-1.5 text-[11px] text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-violet-500/50"
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!incomingMessage.trim() || loading}
          className={cn(
            "w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-all",
            !incomingMessage.trim() || loading
              ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
              : "bg-gradient-to-r from-violet-600 to-pink-600 text-white hover:from-violet-500 hover:to-pink-500 shadow-md shadow-violet-500/20"
          )}
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              分析中...
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              获取回复建议
            </>
          )}
        </button>

        {/* Streaming Preview */}
        {streamingText && !result && (
          <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Loader2 className="h-3 w-3 text-violet-400 animate-spin" />
              <span className="text-[9px] text-violet-300 font-medium">AI分析中...</span>
            </div>
            <p className="text-[10px] text-zinc-400 leading-relaxed whitespace-pre-wrap">{streamingText}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-2.5">
            {/* Suggested Reply */}
            {result.suggestedReply && (
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Send className="h-3 w-3 text-emerald-400" />
                    <span className="text-[10px] font-medium text-emerald-300">建议回复</span>
                  </div>
                  <button
                    onClick={() => handleCopy(result.suggestedReply)}
                    className="flex items-center gap-1 text-[9px] text-zinc-500 hover:text-emerald-300 transition-colors"
                  >
                    {copied ? <Check className="h-2.5 w-2.5" /> : <Copy className="h-2.5 w-2.5" />}
                    {copied ? "已复制" : "复制"}
                  </button>
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed whitespace-pre-wrap">{result.suggestedReply}</p>
              </div>
            )}

            {/* Tone Advice */}
            {result.toneAdvice && (
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <User className="h-3 w-3 text-blue-400" />
                  <span className="text-[10px] font-medium text-blue-300">沟通动态</span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed">{result.toneAdvice}</p>
              </div>
            )}

            {/* Risk Warning */}
            {result.riskWarning && (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Zap className="h-3 w-3 text-amber-400" />
                  <span className="text-[10px] font-medium text-amber-300">注意</span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed">{result.riskWarning}</p>
              </div>
            )}

            {/* Alternative */}
            {result.alternativeApproach && (
              <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/30 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles className="h-3 w-3 text-zinc-400" />
                  <span className="text-[10px] font-medium text-zinc-300">替代方案</span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed">{result.alternativeApproach}</p>
              </div>
            )}

            {/* Reset */}
            <button
              onClick={handleReset}
              className="w-full text-center text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors py-1"
            >
              清除 · 分析新消息
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
