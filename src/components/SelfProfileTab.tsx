"use client";

import { useState, useRef, useCallback } from "react";
import {
  UserCircle,
  Loader2,
  Brain,
  Fingerprint,
  Heart,
  Shield,
  Target,
  Ear,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import StreamingIndicator from "./StreamingIndicator";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Safely coerce an LLM-returned value to a string array (handles string, array, or undefined). */
function asArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === "string" && val.trim()) return [val];
  return [];
}

interface SelfProfileResult {
  communicatorType: {
    primary: string;
    secondary: string;
    description: string;
  };
  linguisticFingerprint: {
    formalityLevel: string;
    sentenceStyle: string;
    frequentPatterns: string[];
    toneSignature: string;
  };
  emotionalPatterns: {
    triggerPoints: string[];
    expressionStyle: string;
    regulationAbility: string;
  };
  persuasionStyle: {
    primaryStrategy: string;
    effectiveness: string;
    blindSpots: string;
  };
  conflictHandling: {
    defaultMode: string;
    adaptability: string;
    evidence: string;
  };
  listeningQuality: {
    score: number;
    strengths: string;
    missedSignals: string[];
  };
  blindSpots: string[];
  strengths: string[];
  growthAreas: {
    area: string;
    currentBehavior: string;
    suggestedChange: string;
    practiceScenario: string;
  }[];
  mbtiAlignment: string;
  overallInsight: string;
}

export default function SelfProfileTab() {
  const { conversations, mbtiResults } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SelfProfileResult | null>(null);
  const [error, setError] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const latestMBTI = mbtiResults[0];

  // Get conversations that have rawText (can be analyzed)
  const analyzableConversations = conversations.filter((c) => c.rawText);
  const hasEnoughData = analyzableConversations.length >= 2;

  const abortStreaming = useCallback(() => {
    if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; }
    setLoading(false);
  }, []);

  const handleAnalyze = async () => {
    if (!hasEnoughData) return;
    setLoading(true);
    setError("");
    setResult(null);
    setStreamingText("");

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const texts = analyzableConversations
        .slice(0, 8)
        .map((c) => c.rawText!)
        .filter(Boolean);

      const res = await fetch("/api/self-profile?stream=true", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationTexts: texts,
          mbtiType: latestMBTI?.type || undefined,
          existingSelfProfile: result
            ? JSON.stringify(result)
            : undefined,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        let errMsg = `请求失败 (${res.status})`;
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
              const data = event.data as { profile: SelfProfileResult };
              setResult(data.profile);
            } else if (event.type === "error") {
              streamError = event.text || "自我画像分析出错";
            }
          } catch { /* skip malformed SSE line */ }
        }
      }
      if (!gotResult) {
        setError(streamError || "自我画像分析未返回结果，请重试");
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "未知错误");
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-amber-400";
    return "text-red-400";
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-zinc-800 px-6 py-4">
        <h1 className="text-lg font-semibold text-zinc-100">自我画像</h1>
        <p className="text-xs text-zinc-500 mt-1">
          基于你所有对话中的表现，分析你的沟通模式、优势与盲点
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
          {/* Status Card */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-violet-500/30 flex items-center justify-center">
                <UserCircle className="h-6 w-6 text-violet-400" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-zinc-200">你的沟通数据</h2>
                <div className="flex items-center gap-3 text-[11px] text-zinc-500 mt-0.5">
                  <span>{analyzableConversations.length} 段可分析对话</span>
                  {latestMBTI && (
                    <span className="text-violet-400 bg-violet-500/10 border border-violet-500/20 rounded px-1.5 py-0.5">
                      MBTI: {latestMBTI.type}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {!hasEnoughData && (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 mb-4">
                <p className="text-[11px] text-amber-300">
                  需要至少 2 段已分析的对话记录才能生成自我画像。当前有 {analyzableConversations.length} 段。
                  请先在「对话分析」模块中分析一些对话。
                </p>
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={loading || !hasEnoughData}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium transition-all w-full",
                loading || !hasEnoughData
                  ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-violet-600 to-cyan-600 text-white hover:from-violet-500 hover:to-cyan-500 shadow-lg shadow-violet-500/20"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  AI正在分析你的沟通模式...
                </>
              ) : result ? (
                <>
                  <RefreshCw className="h-4 w-4" />
                  重新分析（含最新对话）
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4" />
                  生成自我沟通画像
                </>
              )}
            </button>
          </div>

          {/* Streaming indicator */}
          {loading && !result && (
            <StreamingIndicator
              text={streamingText}
              label="AI正在分析你的沟通模式"
              onAbort={abortStreaming}
            />
          )}

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-5 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
              {/* Overall Insight */}
              <div className="rounded-xl border border-violet-500/20 bg-gradient-to-r from-violet-500/5 to-cyan-500/5 p-5 text-center">
                <p className="text-sm text-zinc-200 font-medium leading-relaxed">
                  {result.overallInsight}
                </p>
              </div>

              {/* Communicator Type */}
              <div className="rounded-lg border border-zinc-800 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <UserCircle className="h-4 w-4 text-violet-400" />
                  <h3 className="text-sm font-semibold text-zinc-200">沟通者类型</h3>
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-medium text-violet-300 bg-violet-500/10 border border-violet-500/20 rounded-lg px-3 py-1">
                    {result.communicatorType.primary}
                  </span>
                  {result.communicatorType.secondary && (
                    <span className="text-xs text-zinc-400 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1">
                      {result.communicatorType.secondary}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {result.communicatorType.description}
                </p>
              </div>

              {/* Linguistic Fingerprint */}
              <div className="rounded-lg border border-zinc-800 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Fingerprint className="h-4 w-4 text-cyan-400" />
                  <h3 className="text-sm font-semibold text-zinc-200">语言指纹</h3>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] text-zinc-500">正式程度</span>
                    <p className="text-xs text-zinc-300">{result.linguisticFingerprint.formalityLevel}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500">句式偏好</span>
                    <p className="text-xs text-zinc-300">{result.linguisticFingerprint.sentenceStyle}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500">语气特征</span>
                    <p className="text-xs text-zinc-300">{result.linguisticFingerprint.toneSignature}</p>
                  </div>
                  {asArray(result.linguisticFingerprint.frequentPatterns).length > 0 && (
                    <div>
                      <span className="text-[10px] text-zinc-500">常见表达模式</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {asArray(result.linguisticFingerprint.frequentPatterns).map((p: string, i: number) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Two-column: Emotional + Persuasion */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Emotional Patterns */}
                <div className="rounded-lg border border-zinc-800 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Heart className="h-4 w-4 text-pink-400" />
                    <h3 className="text-xs font-semibold text-zinc-200">情绪模式</h3>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[11px] text-zinc-400">{result.emotionalPatterns.expressionStyle}</p>
                    <p className="text-[11px] text-zinc-400">{result.emotionalPatterns.regulationAbility}</p>
                    {asArray(result.emotionalPatterns.triggerPoints).length > 0 && (
                      <div>
                        <span className="text-[9px] text-zinc-600">触发点：</span>
                        {asArray(result.emotionalPatterns.triggerPoints).map((t: string, i: number) => (
                          <span key={i} className="text-[10px] text-pink-300 block">• {t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Persuasion Style */}
                <div className="rounded-lg border border-zinc-800 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="h-4 w-4 text-amber-400" />
                    <h3 className="text-xs font-semibold text-zinc-200">说服策略</h3>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-[9px] text-zinc-600">主要策略</span>
                      <p className="text-[11px] text-amber-300 font-medium">{result.persuasionStyle.primaryStrategy}</p>
                    </div>
                    <p className="text-[11px] text-zinc-400">{result.persuasionStyle.effectiveness}</p>
                    <div>
                      <span className="text-[9px] text-zinc-600">盲点</span>
                      <p className="text-[11px] text-zinc-500">{result.persuasionStyle.blindSpots}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Two-column: Conflict + Listening */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Conflict Handling */}
                <div className="rounded-lg border border-zinc-800 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="h-4 w-4 text-blue-400" />
                    <h3 className="text-xs font-semibold text-zinc-200">冲突处理</h3>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-[9px] text-zinc-600">默认模式</span>
                      <p className="text-[11px] text-blue-300 font-medium">{result.conflictHandling.defaultMode}</p>
                    </div>
                    <p className="text-[11px] text-zinc-400">{result.conflictHandling.adaptability}</p>
                    <p className="text-[10px] text-zinc-500 italic">{result.conflictHandling.evidence}</p>
                  </div>
                </div>

                {/* Listening Quality */}
                <div className="rounded-lg border border-zinc-800 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Ear className="h-4 w-4 text-emerald-400" />
                    <h3 className="text-xs font-semibold text-zinc-200">倾听质量</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-lg font-bold", getScoreColor(result.listeningQuality.score))}>
                        {result.listeningQuality.score}
                      </span>
                      <span className="text-[9px] text-zinc-600">/100</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">{result.listeningQuality.strengths}</p>
                    {asArray(result.listeningQuality.missedSignals).length > 0 && (
                      <div>
                        <span className="text-[9px] text-zinc-600">可能忽视的信号：</span>
                        {asArray(result.listeningQuality.missedSignals).map((s: string, i: number) => (
                          <span key={i} className="text-[10px] text-amber-300 block">⚠ {s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Strengths & Blind Spots */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    <h4 className="text-xs font-medium text-emerald-300">沟通优势</h4>
                  </div>
                  <div className="space-y-1">
                    {asArray(result.strengths).map((s: string, i: number) => (
                      <p key={i} className="text-[11px] text-zinc-400">✓ {s}</p>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <h4 className="text-xs font-medium text-red-300">沟通盲点</h4>
                  </div>
                  <div className="space-y-1">
                    {asArray(result.blindSpots).map((s: string, i: number) => (
                      <p key={i} className="text-[11px] text-zinc-400">⚠ {s}</p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Growth Areas */}
              {Array.isArray(result.growthAreas) && result.growthAreas.length > 0 && (
                <div className="rounded-lg border border-zinc-800 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-violet-400" />
                    <h3 className="text-sm font-semibold text-zinc-200">成长建议</h3>
                  </div>
                  <div className="space-y-4">
                    {result.growthAreas.map((g: any, i: number) => (
                      <div key={i} className="rounded-lg border border-zinc-800/50 p-3">
                        <h4 className="text-xs font-medium text-violet-300 mb-2">{g.area}</h4>
                        <div className="space-y-1.5">
                          <div>
                            <span className="text-[9px] text-zinc-600">当前行为</span>
                            <p className="text-[11px] text-zinc-400 italic">{g.currentBehavior}</p>
                          </div>
                          <div>
                            <span className="text-[9px] text-emerald-500">改进建议</span>
                            <p className="text-[11px] text-emerald-300">{g.suggestedChange}</p>
                          </div>
                          <div>
                            <span className="text-[9px] text-zinc-600">练习场景</span>
                            <p className="text-[11px] text-zinc-500">{g.practiceScenario}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MBTI Alignment */}
              {result.mbtiAlignment && latestMBTI && (
                <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="h-4 w-4 text-violet-400" />
                    <h4 className="text-xs font-medium text-violet-300">
                      MBTI ({latestMBTI.type}) 与实际行为对比
                    </h4>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    {result.mbtiAlignment}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
