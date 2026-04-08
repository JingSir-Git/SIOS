"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Loader2,
  User,
  Bot,
  Sparkles,
  Target,
  Copy,
  Check,
  BookOpen,
  ChevronDown,
  X,
} from "lucide-react";
import { cn, getTipTypeColor, getTipTypeIcon } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import type { CoachingTip } from "@/lib/types";
import { COACH_EXAMPLE_CATEGORIES, type CoachExample } from "@/lib/coach-examples";

interface Message {
  id: string;
  role: "self" | "other";
  content: string;
}

export default function CoachTab() {
  const { profiles, preSelectedProfileId, clearPreSelection } = useAppStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [selfInput, setSelfInput] = useState("");
  const [otherInput, setOtherInput] = useState("");
  const [userGoal, setUserGoal] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState("");

  // Pick up cross-tab pre-selection
  useEffect(() => {
    if (preSelectedProfileId && profiles.find((p) => p.id === preSelectedProfileId)) {
      setSelectedProfileId(preSelectedProfileId);
      clearPreSelection();
    }
  }, [preSelectedProfileId, profiles, clearPreSelection]);
  const [tips, setTips] = useState<CoachingTip[]>([]);
  const [suggestedReply, setSuggestedReply] = useState("");
  const [currentDynamic, setCurrentDynamic] = useState("");
  const [scriptTemplates, setScriptTemplates] = useState<{scenario: string; script: string; rationale: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedScript, setCopiedScript] = useState<number | null>(null);
  const [showExamples, setShowExamples] = useState(false);
  const [activeExampleCategory, setActiveExampleCategory] = useState(COACH_EXAMPLE_CATEGORIES[0].id);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, tips]);

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId);

  const loadExample = (ex: CoachExample) => {
    const msgs: Message[] = ex.messages.map((m, i) => ({
      id: `example-${i}`,
      role: m.role,
      content: m.content,
    }));
    setMessages(msgs);
    setUserGoal(ex.goal);
    setTips([]);
    setSuggestedReply("");
    setCurrentDynamic("");
    setScriptTemplates([]);
    setShowExamples(false);
  };

  const addMessage = (role: "self" | "other", content: string) => {
    if (!content.trim()) return;
    const newMsg: Message = {
      id: Date.now().toString(),
      role,
      content: content.trim(),
    };
    setMessages((prev) => [...prev, newMsg]);
    if (role === "self") setSelfInput("");
    else setOtherInput("");
  };

  const requestCoaching = async () => {
    if (messages.length === 0) return;
    setLoading(true);

    try {
      const formatted = messages
        .map((m) => `${m.role === "self" ? "我" : "对方"}：${m.content}`)
        .join("\n");

      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: formatted,
          targetProfile: selectedProfile || undefined,
          userGoal: userGoal.trim() || undefined,
        }),
      });

      if (!res.ok) throw new Error("请求失败");

      const data = await res.json();
      if (data.tips) setTips(data.tips);
      if (data.suggestedReply) setSuggestedReply(data.suggestedReply);
      if (data.currentDynamic) setCurrentDynamic(data.currentDynamic);
      if (data.scriptTemplates) setScriptTemplates(data.scriptTemplates);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyReply = () => {
    navigator.clipboard.writeText(suggestedReply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyScript = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedScript(idx);
    setTimeout(() => setCopiedScript(null), 2000);
  };

  return (
    <div className="flex h-full">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="border-b border-zinc-800 px-6 py-4">
          <h1 className="text-lg font-semibold text-zinc-100">实时沟通教练</h1>
          <p className="text-xs text-zinc-500 mt-1">
            输入双方对话，AI教练实时分析并给出策略建议
          </p>
        </div>

        {/* Config Bar */}
        <div className="border-b border-zinc-800 px-6 py-3 flex items-center gap-3 flex-wrap">
          <select
            value={selectedProfileId}
            onChange={(e) => setSelectedProfileId(e.target.value)}
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-violet-500/50"
          >
            <option value="">选择对方画像（可选）</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="你的沟通目标（如：争取到更好的价格）"
            value={userGoal}
            onChange={(e) => setUserGoal(e.target.value)}
            className="flex-1 min-w-[200px] rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50"
          />
          <div className="relative">
            <button
              onClick={() => setShowExamples(!showExamples)}
              className="flex items-center gap-1.5 text-[11px] text-violet-400 hover:text-violet-300 transition-colors px-2.5 py-1.5 rounded-lg border border-violet-500/20 hover:border-violet-500/40 whitespace-nowrap"
            >
              <BookOpen className="h-3 w-3" />
              载入示例
              <ChevronDown className={cn("h-3 w-3 transition-transform", showExamples && "rotate-180")} />
            </button>

            {showExamples && (
              <div className="absolute top-full right-0 mt-2 z-20 w-[460px] max-h-[400px] rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl shadow-black/40 overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-200">
                <div className="flex border-b border-zinc-800 overflow-x-auto">
                  {COACH_EXAMPLE_CATEGORIES.map((cat) => (
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
                <div className="p-2 max-h-[320px] overflow-y-auto space-y-1">
                  {COACH_EXAMPLE_CATEGORIES
                    .find((c) => c.id === activeExampleCategory)
                    ?.examples.map((ex) => (
                      <button
                        key={ex.id}
                        onClick={() => loadExample(ex)}
                        className="w-full text-left rounded-lg px-3 py-2.5 hover:bg-zinc-800/70 transition-colors group"
                      >
                        <span className="text-xs font-medium text-zinc-200 group-hover:text-white">
                          {ex.label}
                        </span>
                        <p className="text-[10px] text-zinc-500 group-hover:text-zinc-400 mt-0.5">
                          {ex.description}
                        </p>
                        <p className="text-[10px] text-violet-400/60 mt-0.5 line-clamp-1">
                          目标：{ex.goal}
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

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <Sparkles className="h-10 w-10 text-zinc-700 mb-4" />
              <p className="text-sm text-zinc-400 font-medium mb-4">AI沟通教练，陪你练好每一次对话</p>
              <div className="grid gap-3 sm:grid-cols-3 max-w-lg w-full mb-4">
                <div className="rounded-lg bg-zinc-900/50 border border-zinc-800/50 p-3 text-left">
                  <p className="text-[11px] font-medium text-zinc-300 mb-1">1️⃣ 输入对话</p>
                  <p className="text-[10px] text-zinc-500 leading-relaxed">在下方分别输入你和对方说的话</p>
                </div>
                <div className="rounded-lg bg-zinc-900/50 border border-zinc-800/50 p-3 text-left">
                  <p className="text-[11px] font-medium text-zinc-300 mb-1">2️⃣ 获取指导</p>
                  <p className="text-[10px] text-zinc-500 leading-relaxed">点击「请求AI教练指导」获得实时建议</p>
                </div>
                <div className="rounded-lg bg-zinc-900/50 border border-zinc-800/50 p-3 text-left">
                  <p className="text-[11px] font-medium text-zinc-300 mb-1">3️⃣ 持续对话</p>
                  <p className="text-[10px] text-zinc-500 leading-relaxed">继续输入新消息，教练会持续跟进指导</p>
                </div>
              </div>
              <p className="text-[10px] text-zinc-600">
                不知道练什么？点击右上角「载入示例」快速开始 →
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-2",
                msg.role === "self" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "other" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-500/20">
                  <User className="h-3.5 w-3.5 text-cyan-400" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[70%] rounded-lg px-3 py-2 text-sm",
                  msg.role === "self"
                    ? "bg-violet-500/20 text-violet-100 border border-violet-500/20"
                    : "bg-zinc-800 text-zinc-300 border border-zinc-700"
                )}
              >
                {msg.content}
              </div>
              {msg.role === "self" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/20">
                  <User className="h-3.5 w-3.5 text-violet-400" />
                </div>
              )}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-zinc-800 px-6 py-3 space-y-2">
          {/* Other's message input */}
          <div className="flex gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-500/10">
              <User className="h-3.5 w-3.5 text-cyan-500" />
            </div>
            <input
              type="text"
              value={otherInput}
              onChange={(e) => setOtherInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  addMessage("other", otherInput);
                }
              }}
              placeholder="输入对方说的话..."
              className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/50"
            />
            <button
              onClick={() => addMessage("other", otherInput)}
              disabled={!otherInput.trim()}
              className="rounded-lg px-3 py-1.5 text-xs bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 disabled:opacity-40 transition-colors"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Self message input */}
          <div className="flex gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/10">
              <User className="h-3.5 w-3.5 text-violet-500" />
            </div>
            <input
              type="text"
              value={selfInput}
              onChange={(e) => setSelfInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  addMessage("self", selfInput);
                }
              }}
              placeholder="输入你说的话..."
              className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50"
            />
            <button
              onClick={() => addMessage("self", selfInput)}
              disabled={!selfInput.trim()}
              className="rounded-lg px-3 py-1.5 text-xs bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 disabled:opacity-40 transition-colors"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Analyze button */}
          <button
            onClick={requestCoaching}
            disabled={loading || messages.length === 0}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-all w-full",
              loading || messages.length === 0
                ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                : "bg-gradient-to-r from-violet-600 to-blue-600 text-white hover:from-violet-500 hover:to-blue-500 shadow-lg shadow-violet-500/10"
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
                获取AI教练建议
              </>
            )}
          </button>
        </div>
      </div>

      {/* Coaching Sidebar */}
      <div className="w-80 border-l border-zinc-800 flex flex-col shrink-0 hidden lg:flex">
        <div className="border-b border-zinc-800 px-4 py-3 flex items-center gap-2">
          <Bot className="h-4 w-4 text-violet-400" />
          <span className="text-xs font-medium text-zinc-300">AI教练面板</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Current Dynamic */}
          {currentDynamic && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Target className="h-3 w-3 text-violet-400" />
                <span className="text-[10px] font-medium text-zinc-400">
                  当前局势
                </span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {currentDynamic}
              </p>
            </div>
          )}

          {/* Tips */}
          {tips.length > 0 ? (
            <div className="space-y-2">
              {tips.map((tip, i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded-lg border p-3",
                    getTipTypeColor(tip.type)
                  )}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span>{getTipTypeIcon(tip.type)}</span>
                    <span className="text-xs font-medium">{tip.title}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-80">
                    {tip.content}
                  </p>
                  {tip.confidence > 0 && (
                    <div className="mt-1.5 text-[10px] opacity-50">
                      置信度 {tip.confidence}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-xs text-zinc-600">
                输入对话后点击分析，教练建议将在这里显示
              </p>
            </div>
          )}

          {/* Suggested Reply */}
          {suggestedReply && (
            <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-medium text-violet-300">
                  推荐回复
                </span>
                <button
                  onClick={copyReply}
                  className="flex items-center gap-1 text-[10px] text-violet-400 hover:text-violet-300"
                >
                  {copied ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  {copied ? "已复制" : "复制"}
                </button>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed italic">
                &ldquo;{suggestedReply}&rdquo;
              </p>
            </div>
          )}

          {/* Script Templates */}
          {scriptTemplates.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <BookOpen className="h-3 w-3 text-cyan-400" />
                <span className="text-[10px] font-medium text-cyan-300">参考话术</span>
              </div>
              {scriptTemplates.map((st, i) => (
                <div key={i} className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-cyan-400 font-medium">{st.scenario}</span>
                    <button
                      onClick={() => copyScript(st.script, i)}
                      className="flex items-center gap-1 text-[9px] text-cyan-400 hover:text-cyan-300"
                    >
                      {copiedScript === i ? <Check className="h-2.5 w-2.5" /> : <Copy className="h-2.5 w-2.5" />}
                      {copiedScript === i ? "已复制" : "复制"}
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-200 leading-relaxed font-medium">
                    &ldquo;{st.script}&rdquo;
                  </p>
                  <p className="text-[10px] text-zinc-500 leading-relaxed">
                    {st.rationale}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
