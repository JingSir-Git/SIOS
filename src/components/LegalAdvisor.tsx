"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Loader2,
  Scale,
  User,
  AlertTriangle,
  RotateCcw,
  Gavel,
  FileDown,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { apiFetch } from "@/lib/api-fetch";
import SectionedMarkdown from "./SectionedMarkdown";
import { exportChatSessionReport } from "@/lib/export-report";
import ChatHistoryPanel from "./ChatHistoryPanel";
import type { ChatSessionEntry } from "@/lib/types";
import ChatImageAttach, { type AttachedImage, formatAttachedImages, getAttachedImageBase64 } from "./ChatImageAttach";
import ResponseFeedback from "./ResponseFeedback";
import { useT, getAILanguageInstruction } from "@/lib/i18n";
import VoiceInputButton from "./VoiceInputButton";

interface LegalMessage {
  id: string;
  role: "user" | "advisor";
  content: string;
  imageContext?: string;
}

const LEGAL_DOMAINS = [
  { id: "contract", label: "合同纠纷", icon: "📝", color: "border-blue-500/30 bg-blue-500/10 text-blue-300" },
  { id: "labor", label: "劳动争议", icon: "👷", color: "border-amber-500/30 bg-amber-500/10 text-amber-300" },
  { id: "marriage", label: "婚姻家庭", icon: "💍", color: "border-pink-500/30 bg-pink-500/10 text-pink-300" },
  { id: "property", label: "房产物业", icon: "🏠", color: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" },
  { id: "tort", label: "侵权责任", icon: "⚖️", color: "border-orange-500/30 bg-orange-500/10 text-orange-300" },
  { id: "consumer", label: "消费维权", icon: "🛒", color: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300" },
  { id: "traffic", label: "交通事故", icon: "🚗", color: "border-red-500/30 bg-red-500/10 text-red-300" },
  { id: "inheritance", label: "继承遗产", icon: "📜", color: "border-violet-500/30 bg-violet-500/10 text-violet-300" },
  { id: "loan", label: "借贷债务", icon: "💰", color: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300" },
  { id: "criminal", label: "刑事咨询", icon: "🔒", color: "border-rose-500/30 bg-rose-500/10 text-rose-300" },
  { id: "ip", label: "知识产权", icon: "💡", color: "border-indigo-500/30 bg-indigo-500/10 text-indigo-300" },
  { id: "other", label: "其他法律", icon: "📋", color: "border-zinc-500/30 bg-zinc-500/10 text-zinc-300" },
];

const QUICK_PROMPTS = [
  "公司拖欠工资两个月了，我应该怎么维权？",
  "租房合同到期房东不退押金怎么办？",
  "交通事故对方全责但不赔偿，我该怎么处理？",
  "离婚时财产如何分割？孩子抚养权归谁？",
  "网购商品有质量问题，商家拒绝退换货",
  "朋友借钱不还只有微信聊天记录能起诉吗？",
];

const SYSTEM_PROMPT = `你是一位精通中国现行法律的资深法律顾问，拥有丰富的法律实务经验。你的角色是为普通百姓提供日常生活中的法律咨询和调解建议。

【核心能力】
1. 精通中华人民共和国各部门法律法规，包括但不限于：
   - 《民法典》（合同编、物权编、婚姻家庭编、继承编、侵权责任编）
   - 《劳动法》《劳动合同法》《劳动争议调解仲裁法》
   - 《消费者权益保护法》《产品质量法》
   - 《道路交通安全法》及相关司法解释
   - 《刑法》《刑事诉讼法》基本知识
   - 《个人信息保护法》《数据安全法》
   - 《公司法》《合伙企业法》
   - 最高人民法院相关司法解释和指导案例

2. 熟悉中国司法实务，包括：
   - 诉讼程序（民事、刑事、行政）
   - 仲裁程序（劳动仲裁、商事仲裁）
   - 调解机制（人民调解、司法调解）
   - 法律援助申请
   - 证据收集和保全
   - 诉讼时效计算

【回复规范】
1. 法律依据：引用具体的法律条文（法律名称+条款号），让用户知道自己的权益有法可依
2. 实操指南：提供具体可行的维权步骤，包括：
   - 应该准备哪些证据材料
   - 先协商还是直接起诉
   - 去哪里投诉/起诉
   - 时间节点和时效提醒
3. 风险提示：告知可能的风险和注意事项
4. 费用预估：涉及诉讼的大致费用范围
5. 替代方案：提供多种解决路径供选择

【重要声明】
- 在每次回复末尾必须附上免责声明
- 涉及刑事案件时建议当面咨询律师
- 金额较大或情况复杂时建议寻求专业律师代理
- 法律解读以中国大陆现行有效法律为准

【语言风格】
- 用通俗易懂的语言解释法律条文
- 避免过多法律术语，必要时加以解释
- 态度亲切但专业，像一位值得信赖的法律朋友
- 条理清晰，用 Markdown 格式排版`;

export default function LegalAdvisor() {
  const { addToast, addUserMemory, getActiveUserMemories, addChatSession, appendChatMessage, updateChatSession, language } = useAppStore();
  const t = useT();
  const [messages, setMessages] = useState<LegalMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [showDomains, setShowDomains] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([]);

  const ensureSession = useCallback((): string => {
    if (activeSessionId) return activeSessionId;
    const id = `legal_${Date.now()}`;
    const now = new Date().toISOString();
    addChatSession({
      id,
      domain: "legal",
      title: selectedDomain ? `${LEGAL_DOMAINS.find(d => d.id === selectedDomain)?.label || "法律"}咨询` : "法律咨询",
      messages: [],
      createdAt: now,
      updatedAt: now,
      archived: false,
    });
    setActiveSessionId(id);
    return id;
  }, [activeSessionId, addChatSession, selectedDomain]);

  const handleSelectSession = useCallback((session: ChatSessionEntry) => {
    setActiveSessionId(session.id);
    setMessages(session.messages.map(m => ({
      id: m.id,
      role: m.role === "user" ? "user" as const : "advisor" as const,
      content: m.content,
    })));
    setShowDomains(false);
    setShowHistory(false);
  }, []);

  const handleNewSession = useCallback(() => {
    setActiveSessionId(null);
    setMessages([]);
    setInput("");
    setShowDomains(true);
    setSelectedDomain(null);
    setShowHistory(false);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const abortStreaming = useCallback(() => {
    if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; }
    setLoading(false);
  }, []);

  const sendMessage = async (overrideText?: string) => {
    const rawText = (overrideText || input).trim();
    if (!rawText || loading) return;

    // Collect image base64 for direct vision API + text descriptions as fallback
    const imageBase64List = getAttachedImageBase64(attachedImages);
    const imageCtx = formatAttachedImages(attachedImages);
    const text = imageCtx ? `${rawText}\n\n${imageCtx}` : rawText;
    const displayText = rawText; // Show only what user typed
    setAttachedImages([]);

    const userMsg: LegalMessage = { id: Date.now().toString(), role: "user", content: displayText, imageContext: imageCtx || undefined };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setShowDomains(false);

    // Persist to chat session
    const sessionId = ensureSession();
    appendChatMessage(sessionId, { id: userMsg.id, role: "user", content: text, timestamp: new Date().toISOString() });

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const advisorMsgId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, { id: advisorMsgId, role: "advisor", content: "" }]);

    try {
      const history = messages.map((m) => `${m.role === "user" ? "用户" : "顾问"}: ${m.content}`).join("\n");
      const domainCtx = selectedDomain ? `\n咨询领域: ${LEGAL_DOMAINS.find(d => d.id === selectedDomain)?.label || ""}` : "";

      // Inject user long-term memories for context continuity
      const userMems = getActiveUserMemories().filter(m => m.category === "legal" || m.category === "family" || m.category === "work" || m.category === "general");
      const memoryCtx = userMems.length > 0
        ? `\n\n【用户背景记忆（来自往期咨询）】\n${userMems.map(m => `- ${m.content}`).join("\n")}`
        : "";

      const res = await apiFetch("/api/legal?stream=true", {
        method: "POST",
        body: JSON.stringify({
          message: text,
          conversationHistory: history || undefined,
          systemPrompt: SYSTEM_PROMPT + domainCtx + memoryCtx + getAILanguageInstruction(language),
          ...(imageBase64List.length > 0 ? { images: imageBase64List } : {}),
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
              // Strip <think>...</think> reasoning blocks for display
              const display = streamedText.replace(/<think>[\s\S]*?<\/think>/g, "").replace(/<think>[\s\S]*$/g, "").trim();
              setMessages((prev) =>
                prev.map((m) => m.id === advisorMsgId ? { ...m, content: display } : m)
              );
            } else if (event.type === "result" && event.data) {
              const d = event.data as Record<string, unknown>;
              const raw = (d.text as string) || streamedText;
              const finalText = raw.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
              setMessages((prev) =>
                prev.map((m) => m.id === advisorMsgId ? { ...m, content: finalText } : m)
              );
            }
          } catch { /* ignore parse errors */ }
        }
      }

      const cleanedText = streamedText ? streamedText.replace(/<think>[\s\S]*?<\/think>/g, "").trim() : "";
      const finalContent = cleanedText || "抱歉，暂时无法获取回复。请重试。";
      if (!streamedText) {
        setMessages((prev) =>
          prev.map((m) => m.id === advisorMsgId ? { ...m, content: finalContent } : m)
        );
      }
      // Persist assistant message
      appendChatMessage(sessionId, { id: advisorMsgId, role: "assistant", content: finalContent, timestamp: new Date().toISOString() });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      const errContent = "⚠️ 网络请求失败，请检查网络后重试。";
      setMessages((prev) =>
        prev.map((m) => m.id === advisorMsgId ? { ...m, content: errContent } : m)
      );
      appendChatMessage(sessionId, { id: advisorMsgId, role: "assistant", content: errContent, timestamp: new Date().toISOString() });
      addToast?.({ type: "error", title: "请求失败", message: "法律顾问网络请求失败" });
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const handleReset = () => {
    // Auto-save session summary as user memory if conversation had substance
    if (messages.length >= 4) {
      const userQs = messages.filter(m => m.role === "user").map(m => m.content);
      const domainLabel = selectedDomain ? LEGAL_DOMAINS.find(d => d.id === selectedDomain)?.label || "" : "综合";
      const summary = `[${domainLabel}] ${userQs.slice(0, 2).join("；").slice(0, 120)}`;
      addUserMemory({
        id: `legal_${Date.now()}`,
        category: "legal",
        content: summary,
        source: `法律顾问 ${new Date().toLocaleDateString("zh-CN")}`,
        importance: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        archived: false,
      });
      // Update session title with summary
      if (activeSessionId) {
        updateChatSession(activeSessionId, { summary: summary.slice(0, 100) });
      }
    }
    abortStreaming();
    setActiveSessionId(null);
    setMessages([]);
    setInput("");
    setShowDomains(true);
    setSelectedDomain(null);
  };

  return (
    <div className="flex h-full">
      {/* History sidebar */}
      {showHistory && (
        <div className="w-64 border-r border-zinc-800 bg-zinc-950 shrink-0">
          <ChatHistoryPanel
            domain="legal"
            activeSessionId={activeSessionId}
            onSelectSession={handleSelectSession}
            onNewSession={handleNewSession}
          />
        </div>
      )}
      <div className="flex flex-col flex-1 min-w-0 h-full">
      {/* Header */}
      <div className="border-b border-zinc-800 px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-lg border transition-colors",
                showHistory
                  ? "bg-blue-500/20 border-blue-500/30 text-blue-400"
                  : "bg-blue-500/10 border-blue-500/20 text-blue-400/60 hover:text-blue-400"
              )}
              title="历史会话"
            >
              <History className="h-4 w-4" />
            </button>
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Scale className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-zinc-100">{t.legal.title}</h1>
              <p className="text-[10px] text-zinc-500">{t.legal.subtitle}</p>
            </div>
          </div>
          {messages.length > 0 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  const domainLabel = selectedDomain ? LEGAL_DOMAINS.find(d => d.id === selectedDomain)?.label || "" : "综合";
                  exportChatSessionReport({
                    title: `法律顾问咨询记录 · ${domainLabel}`,
                    subtitle: `${messages.length} 条对话 · ${new Date().toLocaleDateString("zh-CN")}`,
                    messages: messages.map(m => ({ role: m.role === "user" ? "user" as const : "advisor" as const, content: m.content })),
                    disclaimer: "本法律顾问由AI提供，解读仅供参考，不构成正式法律意见。涉及重大权益或复杂案件，请务必咨询持证执业律师。",
                    metadata: selectedDomain ? { "咨询领域": domainLabel } : undefined,
                  });
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800 transition-colors"
              >
                <FileDown className="h-3 w-3" /> {t.common.export}
              </button>
              <button onClick={handleReset} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800 transition-colors">
                <RotateCcw className="h-3 w-3" /> {t.common.newChat}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Disclaimer banner */}
      <div className="px-6 py-2 bg-amber-500/5 border-b border-amber-500/10">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[9px] text-amber-400/80 leading-relaxed">
            <strong>{t.common.disclaimer}：</strong>{t.legal.disclaimer}
          </p>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {/* Domain selector (shown when no messages) */}
        {showDomains && messages.length === 0 && (
          <div className="space-y-4">
            <div className="text-center">
              <Gavel className="h-10 w-10 text-blue-400/60 mx-auto mb-3" />
              <h2 className="text-sm font-semibold text-zinc-200 mb-1">{t.legal.greeting}</h2>
              <p className="text-[10px] text-zinc-500">{t.legal.greetingSub}</p>
            </div>

            {/* Domain grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-w-lg mx-auto">
              {LEGAL_DOMAINS.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDomain(selectedDomain === d.id ? null : d.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2.5 rounded-xl border text-[10px] transition-all hover:scale-[1.03]",
                    selectedDomain === d.id
                      ? d.color + " shadow-md"
                      : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700"
                  )}
                >
                  <span className="text-base">{d.icon}</span>
                  <span className="font-medium">{d.label}</span>
                </button>
              ))}
            </div>

            {/* Quick prompts */}
            <div className="space-y-1.5 max-w-lg mx-auto">
              <p className="text-[9px] text-zinc-600 font-medium px-1">{t.legal.quickPrompts}</p>
              {QUICK_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setInput(p)}
                  className="w-full text-left px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900/50 text-[11px] text-zinc-400 hover:text-zinc-200 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message list */}
        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.role === "user" ? (
              <div className="flex gap-3 justify-end">
                <div className="rounded-2xl rounded-br-md bg-violet-500/10 border border-violet-500/20 px-4 py-3 max-w-[75%]">
                  <p className="text-xs text-violet-100 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 shrink-0 mt-1">
                  <User className="h-3.5 w-3.5 text-violet-400" />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-3 max-w-[92%]">
                  <div className="shrink-0 mt-1">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                      <Scale className="h-3.5 w-3.5 text-blue-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    {msg.content ? (
                      <div>
                        <SectionedMarkdown content={msg.content} />
                        <div className="flex justify-end mt-2 pt-1.5">
                          <ResponseFeedback messageId={msg.id} module="legal" responseSnippet={msg.content} compact />
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl rounded-bl-md bg-zinc-800/50 border border-zinc-700/50 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />
                          <span className="text-[10px] text-zinc-500">正在查阅法律条文...</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-zinc-800 px-6 py-3 shrink-0">
        {selectedDomain && messages.length === 0 && (
          <div className="flex items-center gap-1.5 mb-2 px-1">
            <span className="text-[9px] text-zinc-500">领域:</span>
            <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full border", LEGAL_DOMAINS.find(d => d.id === selectedDomain)?.color)}>
              {LEGAL_DOMAINS.find(d => d.id === selectedDomain)?.icon} {LEGAL_DOMAINS.find(d => d.id === selectedDomain)?.label}
            </span>
          </div>
        )}
        <div className="flex gap-2 items-end">
          {/* ChatImageAttach hidden — feature pending */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder={t.legal.inputPlaceholder}
            className="flex-1 rounded-xl border border-zinc-700/50 bg-zinc-800/50 px-4 py-2.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 transition-colors"
            disabled={loading}
          />
          {/* VoiceInputButton hidden — feature pending */}
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-xl transition-all shrink-0",
              (input.trim() || attachedImages.length > 0) && !loading
                ? "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20"
                : "bg-zinc-800 text-zinc-600"
            )}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
      </div>{/* end flex-col wrapper */}
    </div>
  );
}
