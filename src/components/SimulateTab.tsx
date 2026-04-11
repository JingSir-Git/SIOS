"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Loader2,
  Swords,
  User,
  Bot,
  RotateCcw,
  Settings,
  BookOpen,
  ChevronDown,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { apiFetch } from "@/lib/api-fetch";
import { SIMULATE_EXAMPLE_CATEGORIES, type SimulateExample } from "@/lib/simulate-examples";

interface SimMessage {
  id: string;
  role: "user" | "simulated";
  content: string;
  coaching?: string;
  emotionalState?: string;
}

export default function SimulateTab() {
  const { profiles, preSelectedProfileId, scenarioContext, scenarioGoal, clearPreSelection, addToast } = useAppStore();
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [scenario, setScenario] = useState("");
  const [userGoal, setUserGoal] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [messages, setMessages] = useState<SimMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [showSetup, setShowSetup] = useState(true);
  const [showExamples, setShowExamples] = useState(false);
  const [activeExampleCategory, setActiveExampleCategory] = useState(SIMULATE_EXAMPLE_CATEGORIES[0].id);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Pick up cross-tab pre-selection + scenario prefill
  useEffect(() => {
    if (preSelectedProfileId && profiles.find((p) => p.id === preSelectedProfileId)) {
      setSelectedProfileId(preSelectedProfileId);
    }
    if (scenarioContext) {
      setScenario(scenarioContext);
    }
    if (scenarioGoal) {
      setUserGoal(scenarioGoal);
    }
    if (preSelectedProfileId || scenarioContext || scenarioGoal) {
      clearPreSelection();
    }
  }, [preSelectedProfileId, scenarioContext, scenarioGoal, profiles, clearPreSelection]);

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId);

  const loadExample = (ex: SimulateExample) => {
    setScenario(ex.scenario);
    setUserGoal(ex.goal);
    setDifficulty(ex.difficulty);
    setShowExamples(false);
    // Reset simulation if already started
    if (started) {
      setStarted(false);
      setShowSetup(true);
      setMessages([]);
      setInput("");
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startSimulation = () => {
    if (!scenario.trim()) return;
    setStarted(true);
    setShowSetup(false);
    setMessages([]);
  };

  const resetSimulation = () => {
    setStarted(false);
    setShowSetup(true);
    setMessages([]);
    setInput("");
  };

  const abortRef = useRef<AbortController | null>(null);

  const abortStreaming = useCallback(() => {
    if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; }
    setLoading(false);
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: SimMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };
    const currentInput = input.trim();
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // Add a placeholder simulated message that will be updated during streaming
    const simMsgId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, { id: simMsgId, role: "simulated", content: "" }]);

    try {
      let profileDescription = "一个典型的商务人士";
      if (selectedProfile) {
        const dims = selectedProfile.dimensions;
        profileDescription = `姓名: ${selectedProfile.name}
沟通风格: ${selectedProfile.communicationStyle?.overallType || "未知"}
强势程度: ${dims.assertiveness.value}/100
合作倾向: ${dims.cooperativeness.value}/100
决策速度: ${dims.decisionSpeed.value}/100
情绪稳定性: ${dims.emotionalStability.value}/100
开放性: ${dims.openness.value}/100
冲突处理风格: ${selectedProfile.patterns?.conflictStyle || "未知"}
决策风格: ${selectedProfile.patterns?.decisionStyle || "未知"}
优势: ${selectedProfile.communicationStyle?.strengths?.join("、") || "未知"}
弱点: ${selectedProfile.communicationStyle?.weaknesses?.join("、") || "未知"}
情绪触发点: ${selectedProfile.communicationStyle?.triggerPoints?.join("、") || "未知"}`;
      }

      const res = await apiFetch("/api/simulate?stream=true", {
        method: "POST",
        body: JSON.stringify({
          profileDescription,
          scenario: scenario.trim(),
          difficulty,
          history: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          userMessage: currentInput,
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
              // Update the placeholder message with streamed text progressively
              setMessages((prev) =>
                prev.map((m) => m.id === simMsgId ? { ...m, content: streamedText } : m)
              );
            } else if (event.type === "result" && event.data) {
              const data = event.data as { reply?: string; text?: string; coaching?: string; emotionalState?: string };
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === simMsgId
                    ? { ...m, content: data.reply || data.text || streamedText || "...", coaching: data.coaching, emotionalState: data.emotionalState }
                    : m
                )
              );
            } else if (event.type === "error") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === simMsgId
                    ? { ...m, content: streamedText || `（模拟出错：${event.text || "未知错误"}，请重试）` }
                    : m
                )
              );
            }
          } catch { /* skip malformed SSE line */ }
        }
      }
      // Notify if user switched away
      const currentTab = useAppStore.getState().activeTab;
      if (currentTab !== "simulate") {
        addToast({
          type: "info",
          title: "模拟对练已回复",
          message: "对方已回复，可以继续对话",
          duration: 6000,
          action: { label: "继续对练", tab: "simulate" },
        });
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      console.error(err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === simMsgId
            ? { ...m, content: "（系统错误，请重试）" }
            : m
        )
      );
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  return (
    <div className="flex h-full">
      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Action Bar */}
        <div className="border-b border-zinc-800 px-4 sm:px-6 py-2 flex items-center justify-between">
          <p className="text-[11px] text-zinc-500">与对方AI数字分身对话演练</p>
          {started && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSetup(!showSetup)}
                className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
              >
                <Settings className="h-4 w-4" />
              </button>
              <button
                onClick={resetSimulation}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300 transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                重新开始
              </button>
            </div>
          )}
        </div>

        {/* Setup */}
        {showSetup && (
          <div className="border-b border-zinc-800 px-6 py-4 space-y-3 bg-zinc-900/30">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-[10px] text-zinc-500 mb-1 block">
                  选择对方画像
                </label>
                <select
                  value={selectedProfileId}
                  onChange={(e) => setSelectedProfileId(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-violet-500/50"
                >
                  <option value="">使用默认角色</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - {p.communicationStyle?.overallType || "未知类型"}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 mb-1 block">
                  难度级别
                </label>
                <select
                  value={difficulty}
                  onChange={(e) =>
                    setDifficulty(e.target.value as "easy" | "medium" | "hard")
                  }
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-violet-500/50"
                >
                  <option value="easy">🟢 初级 — 对方相对配合</option>
                  <option value="medium">🟡 中级 — 需要协商</option>
                  <option value="hard">🔴 高级 — 态度强硬</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-zinc-500">
                场景设定 *
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowExamples(!showExamples)}
                  className="flex items-center gap-1.5 text-[11px] text-orange-400 hover:text-orange-300 transition-colors px-2.5 py-1 rounded-lg border border-orange-500/20 hover:border-orange-500/40"
                >
                  <BookOpen className="h-3 w-3" />
                  载入预设场景
                  <ChevronDown className={cn("h-3 w-3 transition-transform", showExamples && "rotate-180")} />
                </button>

                {showExamples && (
                  <div className="absolute top-full right-0 mt-2 z-20 w-[calc(100vw-2rem)] sm:w-[480px] max-h-[70vh] sm:max-h-[400px] rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl shadow-black/40 overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-200">
                    <div className="flex border-b border-zinc-800 overflow-x-auto">
                      {SIMULATE_EXAMPLE_CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setActiveExampleCategory(cat.id)}
                          className={cn(
                            "flex items-center gap-1 px-3 py-2 text-[11px] whitespace-nowrap transition-colors shrink-0",
                            activeExampleCategory === cat.id
                              ? "text-orange-300 border-b-2 border-orange-500 bg-orange-500/5"
                              : "text-zinc-500 hover:text-zinc-300"
                          )}
                        >
                          <span>{cat.icon}</span>
                          {cat.label}
                        </button>
                      ))}
                    </div>
                    <div className="p-2 max-h-[320px] overflow-y-auto space-y-1">
                      {SIMULATE_EXAMPLE_CATEGORIES
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
                                ex.difficulty === "easy" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                                ex.difficulty === "medium" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                                "bg-red-500/10 text-red-400 border border-red-500/20"
                              )}>
                                {ex.difficulty === "easy" ? "初级" : ex.difficulty === "medium" ? "中级" : "高级"}
                              </span>
                            </div>
                            <p className="text-[10px] text-zinc-500 group-hover:text-zinc-400">
                              {ex.description}
                            </p>
                          </button>
                        ))}
                    </div>
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
            </div>
            <div>
              <textarea
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                placeholder="描述你要模拟的场景，如：我要向老板提出加薪30%的要求，他是一个注重成本的管理者..."
                rows={3}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 resize-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 mb-1 block">
                你的目标
              </label>
              <input
                type="text"
                value={userGoal}
                onChange={(e) => setUserGoal(e.target.value)}
                placeholder="如：争取到加薪至少20%"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50"
              />
            </div>
            {!started && (
              <button
                onClick={startSimulation}
                disabled={!scenario.trim()}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium transition-all w-full",
                  !scenario.trim()
                    ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                    : "bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-500 hover:to-red-500 shadow-lg shadow-orange-500/20"
                )}
              >
                <Swords className="h-4 w-4" />
                开始模拟对练
              </button>
            )}
          </div>
        )}

        {/* Chat Area */}
        {started && (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <Swords className="h-10 w-10 text-zinc-700 mb-4" />
                  <p className="text-sm text-zinc-400 font-medium mb-2">模拟已就绪，对方正在等你开口</p>
                  <p className="text-xs text-zinc-600 mb-4 max-w-sm">
                    在下方输入你的第一句话开始对练。AI会模拟对方角色回应你，同时给出实时教练建议。
                  </p>
                  <div className="flex items-center gap-4 text-[10px] text-zinc-600">
                    <span>💡 大胆尝试不同策略</span>
                    <span>🔄 随时可以重新开始</span>
                    <span>🎯 教练会指出改进点</span>
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <div key={msg.id} className="space-y-1">
                  <div
                    className={cn(
                      "flex gap-2",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {msg.role === "simulated" && (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500/20">
                        <Bot className="h-3.5 w-3.5 text-orange-400" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[70%] rounded-lg px-3 py-2 text-sm",
                        msg.role === "user"
                          ? "bg-violet-500/20 text-violet-100 border border-violet-500/20"
                          : "bg-zinc-800 text-zinc-300 border border-zinc-700"
                      )}
                    >
                      {msg.content}
                    </div>
                    {msg.role === "user" && (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/20">
                        <User className="h-3.5 w-3.5 text-violet-400" />
                      </div>
                    )}
                  </div>

                  {/* Coaching hint for simulated messages */}
                  {msg.role === "simulated" && msg.coaching && (
                    <div className="ml-9 rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-2">
                      <span className="text-[10px] text-blue-400 font-medium">
                        🎯 教练提示
                      </span>
                      <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                        {msg.coaching}
                      </p>
                      {msg.emotionalState && (
                        <p className="text-[10px] text-zinc-600 mt-1">
                          对方情绪：{msg.emotionalState}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500/20">
                    <Bot className="h-3.5 w-3.5 text-orange-400" />
                  </div>
                  <div className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-zinc-800 px-6 py-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="输入你的话..."
                  className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50"
                  disabled={loading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  className={cn(
                    "rounded-lg px-4 py-2 text-sm font-medium transition-all",
                    !input.trim() || loading
                      ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                      : "bg-violet-600 text-white hover:bg-violet-500"
                  )}
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
