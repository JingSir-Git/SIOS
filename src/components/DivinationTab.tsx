"use client";

import { useState, useRef } from "react";
import {
  Compass,
  Sun,
  Moon,
  Star,
  Sparkles,
  Send,
  Loader2,
  BookOpen,
  Layers,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-fetch";
import { useAppStore } from "@/lib/store";
import StreamingIndicator from "./StreamingIndicator";

const DIVINATION_CATEGORIES = [
  {
    id: "yijing",
    label: "周易占卜",
    icon: BookOpen,
    description: "六十四卦 · 阴阳变化 · 吉凶预测",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  {
    id: "bazi",
    label: "八字命理",
    icon: Sun,
    description: "生辰八字 · 五行分析 · 运势推算",
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
  },
  {
    id: "fengshui",
    label: "风水布局",
    icon: Compass,
    description: "空间方位 · 气场流通 · 家居摆设",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    id: "ziwei",
    label: "紫微斗数",
    icon: Star,
    description: "命盘排布 · 宫位分析 · 流年运势",
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
  },
  {
    id: "tarot",
    label: "塔罗牌阵",
    icon: Layers,
    description: "牌阵解读 · 直觉引导 · 心灵探索",
    color: "text-pink-400",
    bg: "bg-pink-500/10 border-pink-500/20",
  },
  {
    id: "qimen",
    label: "奇门遁甲",
    icon: Moon,
    description: "时空选择 · 趋吉避凶 · 决策参考",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/20",
  },
] as const;

type Category = (typeof DIVINATION_CATEGORIES)[number]["id"];

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function DivinationTab() {
  const { profiles } = useAppStore();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Birth info for bazi/ziwei
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");

  // Linked profile
  const [linkedProfileId, setLinkedProfileId] = useState("");

  const category = DIVINATION_CATEGORIES.find((c) => c.id === selectedCategory);

  const getSystemPrompt = () => {
    const basePrompt = "你是一位博学的玄学大师，精通中国传统文化和西方神秘学。请用专业但通俗易懂的方式进行解读。注意：你的解读仅供参考和娱乐，请在开头提醒用户理性看待。";

    const categoryPrompts: Record<string, string> = {
      yijing: `${basePrompt}\n\n你现在扮演周易大师，精通六十四卦及其变爻。用户可以描述问题，你来起卦并解读。请详细解释本卦、变卦的含义，以及对用户问题的具体指导。使用传统卦辞但附现代解读。`,
      bazi: `${basePrompt}\n\n你现在扮演八字命理大师，精通天干地支、五行生克。${birthDate ? `用户生日: ${birthDate}` : ""}${birthTime ? ` 出生时辰: ${birthTime}` : ""}${gender ? ` 性别: ${gender === "male" ? "男" : "女"}` : ""}。请根据八字进行全面分析，包括五行旺衰、十神格局、大运流年。`,
      fengshui: `${basePrompt}\n\n你现在扮演风水大师，精通形势派和理气派。帮助用户分析空间布局，提供方位建议、家具摆放指导、化煞方法等。请结合现代居住需求给出实用建议。`,
      ziwei: `${basePrompt}\n\n你现在扮演紫微斗数大师。${birthDate ? `用户生日: ${birthDate}` : ""}${birthTime ? ` 出生时辰: ${birthTime}` : ""}${gender ? ` 性别: ${gender === "male" ? "男" : "女"}` : ""}。请排列命盘，分析各宫位星曜组合，解读命格特征和运势走向。`,
      tarot: `${basePrompt}\n\n你现在扮演塔罗牌解读师，精通韦特塔罗和各种牌阵。请根据用户的问题选择合适的牌阵，随机抽取塔罗牌，并进行详细解读。每张牌请描述牌面含义、正位/逆位释义，以及对问题的启示。`,
      qimen: `${basePrompt}\n\n你现在扮演奇门遁甲大师，精通三奇六仪、八门九星。帮助用户选择吉时吉方，分析事件走向，提供趋吉避凶的具体建议。`,
    };

    let prompt = categoryPrompts[selectedCategory || "yijing"] || basePrompt;

    // Link profile context if selected
    if (linkedProfileId) {
      const profile = profiles.find((p) => p.id === linkedProfileId);
      if (profile) {
        const dims = Object.entries(profile.dimensions || {})
          .map(([k, d]) => `${k}: ${(d as { value: number }).value}`)
          .join(", ");
        prompt += `\n\n关联人物画像 - ${profile.name}: ${dims}`;
      }
    }

    return prompt;
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setStreamingText("");

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await apiFetch("/api/psychology?stream=true", {
        method: "POST",
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          systemPrompt: getSystemPrompt(),
        }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`请求失败 (${res.status})`);

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                fullText += parsed.text;
                setStreamingText(fullText);
              }
            } catch {
              // Might be plain text streaming
              if (data.trim()) {
                fullText += data;
                setStreamingText(fullText);
              }
            }
          }
        }
      }

      if (fullText) {
        setMessages([...newMessages, { role: "assistant", content: fullText }]);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      const errorMsg = err instanceof Error ? err.message : "请求失败";
      setMessages([...newMessages, { role: "assistant", content: `❌ ${errorMsg}` }]);
    } finally {
      setLoading(false);
      setStreamingText("");
      abortRef.current = null;
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  const handleReset = () => {
    setMessages([]);
    setStreamingText("");
    setInput("");
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setLoading(false);
  };

  // Category selection screen
  if (!selectedCategory) {
    return (
      <div className="flex flex-col h-full">
        <div className="border-b border-zinc-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-violet-400" />
            <h1 className="text-lg font-semibold text-zinc-100">风水玄学</h1>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            传统智慧 · 玄学预测 · 仅供参考娱乐
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
            {DIVINATION_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-4 text-left transition-all hover:scale-[1.02]",
                    cat.bg
                  )}
                >
                  <Icon className={cn("h-6 w-6 mt-0.5 shrink-0", cat.color)} />
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-200">{cat.label}</h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                      {cat.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="max-w-2xl mx-auto mt-6 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <p className="text-[10px] text-zinc-500 leading-relaxed text-center">
              ⚠️ 玄学内容仅供参考与娱乐，不构成任何专业建议。重大决策请咨询相关专业人士。
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-zinc-800 px-4 py-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setSelectedCategory(null); handleReset(); }}
              className="text-zinc-500 hover:text-zinc-300 transition-colors text-xs"
            >
              ← 返回
            </button>
            {category && (
              <>
                <category.icon className={cn("h-4 w-4", category.color)} />
                <h2 className="text-sm font-semibold text-zinc-200">{category.label}</h2>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {profiles.length > 0 && (
              <select
                value={linkedProfileId}
                onChange={(e) => setLinkedProfileId(e.target.value)}
                className="text-[10px] rounded border border-zinc-700 bg-zinc-800 text-zinc-400 px-2 py-1"
              >
                <option value="">不关联画像</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300"
            >
              <RotateCcw className="h-3 w-3" /> 重新开始
            </button>
          </div>
        </div>

        {/* Birth info for bazi/ziwei */}
        {(selectedCategory === "bazi" || selectedCategory === "ziwei") && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="text-[10px] rounded border border-zinc-700 bg-zinc-800 text-zinc-300 px-2 py-1"
              placeholder="出生日期"
            />
            <select
              value={birthTime}
              onChange={(e) => setBirthTime(e.target.value)}
              className="text-[10px] rounded border border-zinc-700 bg-zinc-800 text-zinc-300 px-2 py-1"
            >
              <option value="">选择时辰</option>
              <option value="子时(23-01)">子时 (23:00-01:00)</option>
              <option value="丑时(01-03)">丑时 (01:00-03:00)</option>
              <option value="寅时(03-05)">寅时 (03:00-05:00)</option>
              <option value="卯时(05-07)">卯时 (05:00-07:00)</option>
              <option value="辰时(07-09)">辰时 (07:00-09:00)</option>
              <option value="巳时(09-11)">巳时 (09:00-11:00)</option>
              <option value="午时(11-13)">午时 (11:00-13:00)</option>
              <option value="未时(13-15)">未时 (13:00-15:00)</option>
              <option value="申时(15-17)">申时 (15:00-17:00)</option>
              <option value="酉时(17-19)">酉时 (17:00-19:00)</option>
              <option value="戌时(19-21)">戌时 (19:00-21:00)</option>
              <option value="亥时(21-23)">亥时 (21:00-23:00)</option>
            </select>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as "male" | "female" | "")}
              className="text-[10px] rounded border border-zinc-700 bg-zinc-800 text-zinc-300 px-2 py-1"
            >
              <option value="">性别</option>
              <option value="male">男</option>
              <option value="female">女</option>
            </select>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && !loading && (
          <div className="text-center py-12">
            {category && <category.icon className={cn("h-10 w-10 mx-auto mb-3", category.color)} />}
            <p className="text-xs text-zinc-400">描述你的问题或情况，开始{category?.label}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {selectedCategory === "yijing" && (
                <>
                  <QuickPrompt text="我今天想出门办事，请帮我起一卦看看吉凶" onSend={setInput} />
                  <QuickPrompt text="最近工作上遇到选择，该不该跳槽？" onSend={setInput} />
                </>
              )}
              {selectedCategory === "fengshui" && (
                <>
                  <QuickPrompt text="我的书桌应该怎么摆放比较好？" onSend={setInput} />
                  <QuickPrompt text="客厅沙发靠墙好还是靠窗好？" onSend={setInput} />
                </>
              )}
              {selectedCategory === "tarot" && (
                <>
                  <QuickPrompt text="我和TA的感情未来会怎样？" onSend={setInput} />
                  <QuickPrompt text="最近的事业运势如何？" onSend={setInput} />
                </>
              )}
              {(selectedCategory === "bazi" || selectedCategory === "ziwei") && (
                <QuickPrompt text="请根据我的生辰分析一下我的命格特征" onSend={setInput} />
              )}
              {selectedCategory === "qimen" && (
                <QuickPrompt text="今天出行往哪个方向比较好？" onSend={setInput} />
              )}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "rounded-lg p-3 text-xs leading-relaxed",
              msg.role === "user"
                ? "bg-violet-500/10 border border-violet-500/20 text-violet-200 ml-12"
                : "bg-zinc-800/50 border border-zinc-700/50 text-zinc-300 mr-4"
            )}
          >
            <div className="whitespace-pre-wrap">{msg.content}</div>
          </div>
        ))}

        {loading && streamingText && (
          <div className="rounded-lg bg-zinc-800/50 border border-zinc-700/50 p-3 mr-4">
            <div className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {streamingText}
            </div>
          </div>
        )}

        {loading && !streamingText && (
          <StreamingIndicator text="" label="正在推算中" onAbort={() => { abortRef.current?.abort(); setLoading(false); }} />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-zinc-800 p-3 shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="描述你的问题..."
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-all",
              !input.trim() || loading
                ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                : "bg-violet-600 text-white hover:bg-violet-500"
            )}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function QuickPrompt({ text, onSend }: { text: string; onSend: (t: string) => void }) {
  return (
    <button
      onClick={() => onSend(text)}
      className="text-[10px] rounded-full border border-zinc-700 bg-zinc-800/50 px-3 py-1 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-colors"
    >
      {text}
    </button>
  );
}
