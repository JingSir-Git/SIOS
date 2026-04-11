"use client";

import { useState, useRef, useCallback } from "react";
import {
  Compass,
  Sun,
  Moon,
  Star,
  Send,
  Loader2,
  BookOpen,
  Layers,
  RotateCcw,
  Check,
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

// ---- Professional interactive option configs ----

const FIVE_ELEMENTS = [
  { id: "metal", label: "金", color: "text-yellow-300 border-yellow-500/40 bg-yellow-500/10" },
  { id: "wood", label: "木", color: "text-emerald-300 border-emerald-500/40 bg-emerald-500/10" },
  { id: "water", label: "水", color: "text-blue-300 border-blue-500/40 bg-blue-500/10" },
  { id: "fire", label: "火", color: "text-red-300 border-red-500/40 bg-red-500/10" },
  { id: "earth", label: "土", color: "text-amber-300 border-amber-500/40 bg-amber-500/10" },
];

const DIRECTIONS = [
  { id: "east", label: "东", angle: 90 },
  { id: "south", label: "南", angle: 180 },
  { id: "west", label: "西", angle: 270 },
  { id: "north", label: "北", angle: 0 },
  { id: "southeast", label: "东南", angle: 135 },
  { id: "southwest", label: "西南", angle: 225 },
  { id: "northeast", label: "东北", angle: 45 },
  { id: "northwest", label: "西北", angle: 315 },
];

const QUESTION_DOMAINS = [
  { id: "career", label: "事业", emoji: "💼" },
  { id: "love", label: "感情", emoji: "❤️" },
  { id: "wealth", label: "财运", emoji: "💰" },
  { id: "health", label: "健康", emoji: "🌿" },
  { id: "study", label: "学业", emoji: "📚" },
  { id: "travel", label: "出行", emoji: "✈️" },
  { id: "decision", label: "决策", emoji: "⚖️" },
  { id: "relationship", label: "人际", emoji: "🤝" },
];

const TRIGRAMS = [
  { id: "qian", label: "乾 ☰", nature: "天", attr: "刚健" },
  { id: "kun", label: "坤 ☷", nature: "地", attr: "柔顺" },
  { id: "zhen", label: "震 ☳", nature: "雷", attr: "动" },
  { id: "xun", label: "巽 ☴", nature: "风", attr: "入" },
  { id: "kan", label: "坎 ☵", nature: "水", attr: "险" },
  { id: "li", label: "离 ☲", nature: "火", attr: "丽" },
  { id: "gen", label: "艮 ☶", nature: "山", attr: "止" },
  { id: "dui", label: "兑 ☱", nature: "泽", attr: "悦" },
];

const TAROT_SPREADS = [
  { id: "single", label: "单牌占卜", cards: 1, desc: "快速洞察，直指核心" },
  { id: "three", label: "三牌牌阵", cards: 3, desc: "过去·现在·未来" },
  { id: "celtic", label: "凯尔特十字", cards: 10, desc: "全面深度解读" },
  { id: "relationship", label: "关系牌阵", cards: 7, desc: "双方关系全景" },
];

const HOUSE_TYPES = [
  { id: "apartment", label: "公寓/套房" },
  { id: "house", label: "独栋住宅" },
  { id: "office", label: "办公室" },
  { id: "shop", label: "商铺" },
  { id: "studio", label: "工作室" },
];

const FLOOR_RANGES = [
  { id: "low", label: "低层 (1-6)" },
  { id: "mid", label: "中层 (7-15)" },
  { id: "high", label: "高层 (16+)" },
];

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

  // Professional interactive params
  const [questionDomain, setQuestionDomain] = useState("");
  const [selectedElement, setSelectedElement] = useState("");
  const [selectedDirection, setSelectedDirection] = useState("");
  const [selectedTrigram, setSelectedTrigram] = useState("");
  const [selectedSpread, setSelectedSpread] = useState("");
  const [houseType, setHouseType] = useState("");
  const [floorRange, setFloorRange] = useState("");
  const [facingDirection, setFacingDirection] = useState("");

  const category = DIVINATION_CATEGORIES.find((c) => c.id === selectedCategory);

  // Build contextual info from interactive selections
  const buildInteractiveContext = useCallback((): string => {
    const parts: string[] = [];
    if (questionDomain) {
      const d = QUESTION_DOMAINS.find((q) => q.id === questionDomain);
      if (d) parts.push(`求测领域：${d.label}`);
    }
    if (selectedElement) {
      const e = FIVE_ELEMENTS.find((f) => f.id === selectedElement);
      if (e) parts.push(`用户自选五行偏好：${e.label}`);
    }
    if (selectedDirection) {
      const d = DIRECTIONS.find((dir) => dir.id === selectedDirection);
      if (d) parts.push(`用户关注方位：${d.label}`);
    }
    if (selectedTrigram) {
      const t = TRIGRAMS.find((tr) => tr.id === selectedTrigram);
      if (t) parts.push(`用户心选卦象：${t.label}(${t.nature}，${t.attr})`);
    }
    if (selectedSpread) {
      const s = TAROT_SPREADS.find((sp) => sp.id === selectedSpread);
      if (s) parts.push(`选用牌阵：${s.label}(${s.cards}张牌)`);
    }
    if (houseType) {
      const h = HOUSE_TYPES.find((ht) => ht.id === houseType);
      if (h) parts.push(`房屋类型：${h.label}`);
    }
    if (floorRange) {
      const f = FLOOR_RANGES.find((fr) => fr.id === floorRange);
      if (f) parts.push(`楼层范围：${f.label}`);
    }
    if (facingDirection) {
      const d = DIRECTIONS.find((dir) => dir.id === facingDirection);
      if (d) parts.push(`房屋朝向：${d.label}`);
    }
    return parts.join("；");
  }, [questionDomain, selectedElement, selectedDirection, selectedTrigram, selectedSpread, houseType, floorRange, facingDirection]);

  const getSystemPrompt = () => {
    const interactiveCtx = buildInteractiveContext();
    const basePrompt = "你是一位学养深厚的玄学研究者，精通中国传统数术文化与西方神秘学体系。你的解读基于传统经典理论，结合现代生活实际，给出有理有据的分析。请以专业、严谨的态度进行解读，在首次回复开头简要注明：本解读基于传统文化理论体系，仅供参考，重大决策建议综合多方信息。回复中请适当引用经典出处(如《周易》《滴天髓》《青囊经》等)以增强解读的学术根据。";

    const categoryPrompts: Record<string, string> = {
      yijing: `${basePrompt}\n\n【周易占卜专精】你精通六十四卦及其变爻体系，熟稔《周易》经传、《易传·系辞》及历代易学大家(如邵雍、朱熹)的理论。用户描述问题后，你来根据时间或用户提供的信息起卦。请按以下结构解读：\n1. 卦象判定：明确本卦、互卦、变卦\n2. 卦辞爻辞：引用原文并作白话注解\n3. 象理分析：结合卦象意象与实际情境\n4. 综合断语：给出明确的趋势判断和行动建议\n5. 化解之道：如有不利，提供化解思路\n${interactiveCtx ? `\n用户已提供以下信息：${interactiveCtx}` : ""}`,
      bazi: `${basePrompt}\n\n【八字命理专精】你精通子平命理体系，深谙天干地支、五行生克制化、十神六亲、神煞理论。参考典籍包括《渊海子平》《滴天髓》《穷通宝鉴》《子平真诠》。${birthDate ? `用户生辰: ${birthDate}` : ""}${birthTime ? ` 时辰: ${birthTime}` : ""}${gender ? ` 性别: ${gender === "male" ? "男" : "女"}` : ""}\n请按以下结构分析：\n1. 排盘：列出四柱八字、大运排列\n2. 五行分析：旺衰、喜用神判定\n3. 格局论断：正格/特殊格局判定\n4. 十神解读：各十神组合对性格与命运的影响\n5. 大运流年：当前运势重点\n6. 实用建议：方位、颜色、行业等喜用方向\n${interactiveCtx ? `\n用户补充信息：${interactiveCtx}` : ""}`,
      fengshui: `${basePrompt}\n\n【风水布局专精】你兼通形势派(峦头)与理气派(玄空飞星、八宅)，参考典籍包括《青囊经》《葬经》《沈氏玄空学》《八宅明镜》。\n请按以下结构分析：\n1. 格局判断：根据描述判定房屋格局优劣\n2. 方位分析：结合玄空飞星或八宅理论\n3. 气场评估：通风采光、动线流通\n4. 具体建议：家具摆放、色彩搭配、植物/摆件选择\n5. 煞气化解：如有形煞或理气煞，给出化解方法\n请结合现代居住需求，给出既符合风水原理又实用美观的建议。\n${interactiveCtx ? `\n用户已提供以下房屋信息：${interactiveCtx}` : ""}`,
      ziwei: `${basePrompt}\n\n【紫微斗数专精】你精通紫微斗数全书、太微赋、骨髓赋等经典，熟悉十四主星、六吉六煞、四化飞星。${birthDate ? `用户生辰: ${birthDate}` : ""}${birthTime ? ` 时辰: ${birthTime}` : ""}${gender ? ` 性别: ${gender === "male" ? "男" : "女"}` : ""}\n请按以下结构分析：\n1. 命盘排列：列出十二宫主星分布\n2. 命宫解读：命宫主星组合的性格特征\n3. 三方四正：分析命迁线、财官线\n4. 四化分析：本命四化星的影响\n5. 流年运势：当前大限与流年重点\n6. 趋避建议：综合命盘特点给出方向\n${interactiveCtx ? `\n用户补充信息：${interactiveCtx}` : ""}`,
      tarot: `${basePrompt}\n\n【塔罗解读专精】你精通韦特塔罗(Rider-Waite)体系及其象征学，熟悉大阿卡纳22张与小阿卡纳56张的深层含义，掌握多种经典牌阵。\n请按以下结构解读：\n1. 牌阵选择：说明选用牌阵及其适用原因\n2. 逐张解读：每张牌的位置含义、牌面象征、正逆位释义\n3. 牌面联系：牌与牌之间的呼应与叙事线索\n4. 综合解读：所有牌面构成的整体信息\n5. 行动指引：基于牌面给出切实可行的建议\n请为每张抽出的牌描述其视觉意象，增强解读的画面感。\n${interactiveCtx ? `\n用户已选择：${interactiveCtx}` : ""}`,
      qimen: `${basePrompt}\n\n【奇门遁甲专精】你精通奇门遁甲排盘与断局，熟悉三奇(乙丙丁)、六仪(戊己庚辛壬癸)、八门(休生伤杜景死惊开)、九星、八神体系。参考典籍包括《奇门遁甲统宗》《遁甲演义》。\n请按以下结构分析：\n1. 起局：说明阴遁/阳遁、局数\n2. 天地人神四盘分析\n3. 用神取用：根据问题确定用神\n4. 格局判断：吉格凶格判定\n5. 方位时辰建议：最佳行动方位与时间\n6. 综合断语：事件走向与趋避策略\n${interactiveCtx ? `\n用户补充信息：${interactiveCtx}` : ""}`,
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
            传统数术 · 经典义理 · 仅供参考
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
              本模块基于中国传统数术文化体系与西方经典神秘学理论，所有解读仅供参考。重大人生决策建议综合多方信息、咨询相关专业人士后审慎判断。
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
          <div className="space-y-4 max-w-xl mx-auto py-4">
            {category && (
              <div className="text-center mb-2">
                <category.icon className={cn("h-8 w-8 mx-auto mb-2", category.color)} />
                <p className="text-xs text-zinc-400">请先完成以下设定，再描述你的问题</p>
              </div>
            )}

            {/* Step 1: Question Domain (all categories) */}
            <InteractiveSection title="求测领域" step={1}>
              <div className="flex flex-wrap gap-1.5">
                {QUESTION_DOMAINS.map((d) => (
                  <OptionChip
                    key={d.id}
                    label={`${d.emoji} ${d.label}`}
                    active={questionDomain === d.id}
                    onClick={() => setQuestionDomain(questionDomain === d.id ? "" : d.id)}
                  />
                ))}
              </div>
            </InteractiveSection>

            {/* Yijing: trigram selection */}
            {selectedCategory === "yijing" && (
              <InteractiveSection title="心选卦象（凭直觉选一个）" step={2}>
                <div className="grid grid-cols-4 gap-1.5">
                  {TRIGRAMS.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTrigram(selectedTrigram === t.id ? "" : t.id)}
                      className={cn(
                        "flex flex-col items-center rounded-lg border px-2 py-2 text-[10px] transition-all",
                        selectedTrigram === t.id
                          ? "border-amber-500/50 bg-amber-500/15 text-amber-200"
                          : "border-zinc-700/50 bg-zinc-800/30 text-zinc-400 hover:border-zinc-600"
                      )}
                    >
                      <span className="text-base leading-none">{t.label.split(" ")[1]}</span>
                      <span className="mt-0.5 font-medium">{t.label.split(" ")[0]}</span>
                      <span className="text-[9px] text-zinc-500">{t.nature}·{t.attr}</span>
                    </button>
                  ))}
                </div>
              </InteractiveSection>
            )}

            {/* Bazi/Ziwei: five elements */}
            {(selectedCategory === "bazi" || selectedCategory === "ziwei") && (
              <InteractiveSection title="你认为自己偏向哪种五行？（可选）" step={2}>
                <div className="flex flex-wrap gap-2">
                  {FIVE_ELEMENTS.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => setSelectedElement(selectedElement === e.id ? "" : e.id)}
                      className={cn(
                        "flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs transition-all",
                        selectedElement === e.id
                          ? e.color
                          : "border-zinc-700/50 bg-zinc-800/30 text-zinc-400 hover:border-zinc-600"
                      )}
                    >
                      {e.label}
                      {selectedElement === e.id && <Check className="h-3 w-3" />}
                    </button>
                  ))}
                </div>
              </InteractiveSection>
            )}

            {/* Fengshui: house type, floor, facing direction */}
            {selectedCategory === "fengshui" && (
              <>
                <InteractiveSection title="房屋类型" step={2}>
                  <div className="flex flex-wrap gap-1.5">
                    {HOUSE_TYPES.map((h) => (
                      <OptionChip
                        key={h.id}
                        label={h.label}
                        active={houseType === h.id}
                        onClick={() => setHouseType(houseType === h.id ? "" : h.id)}
                      />
                    ))}
                  </div>
                </InteractiveSection>
                <InteractiveSection title="楼层" step={3}>
                  <div className="flex flex-wrap gap-1.5">
                    {FLOOR_RANGES.map((f) => (
                      <OptionChip
                        key={f.id}
                        label={f.label}
                        active={floorRange === f.id}
                        onClick={() => setFloorRange(floorRange === f.id ? "" : f.id)}
                      />
                    ))}
                  </div>
                </InteractiveSection>
                <InteractiveSection title="大门/主窗朝向" step={4}>
                  <div className="grid grid-cols-4 gap-1.5">
                    {DIRECTIONS.map((d) => (
                      <OptionChip
                        key={d.id}
                        label={d.label}
                        active={facingDirection === d.id}
                        onClick={() => setFacingDirection(facingDirection === d.id ? "" : d.id)}
                      />
                    ))}
                  </div>
                </InteractiveSection>
              </>
            )}

            {/* Tarot: spread selection */}
            {selectedCategory === "tarot" && (
              <InteractiveSection title="选择牌阵" step={2}>
                <div className="space-y-1.5">
                  {TAROT_SPREADS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSpread(selectedSpread === s.id ? "" : s.id)}
                      className={cn(
                        "flex items-center justify-between w-full rounded-lg border px-3 py-2 text-left transition-all",
                        selectedSpread === s.id
                          ? "border-pink-500/50 bg-pink-500/10 text-pink-200"
                          : "border-zinc-700/50 bg-zinc-800/30 text-zinc-400 hover:border-zinc-600"
                      )}
                    >
                      <div>
                        <span className="text-xs font-medium">{s.label}</span>
                        <span className="text-[10px] text-zinc-500 ml-2">{s.desc}</span>
                      </div>
                      <span className="text-[10px] text-zinc-500">{s.cards}张牌</span>
                    </button>
                  ))}
                </div>
              </InteractiveSection>
            )}

            {/* Qimen: direction selection */}
            {selectedCategory === "qimen" && (
              <InteractiveSection title="关注方位" step={2}>
                <div className="grid grid-cols-4 gap-1.5">
                  {DIRECTIONS.map((d) => (
                    <OptionChip
                      key={d.id}
                      label={d.label}
                      active={selectedDirection === d.id}
                      onClick={() => setSelectedDirection(selectedDirection === d.id ? "" : d.id)}
                    />
                  ))}
                </div>
              </InteractiveSection>
            )}

            {/* Quick prompts */}
            <div className="pt-2 border-t border-zinc-800/50">
              <p className="text-[10px] text-zinc-600 mb-2">快捷提问：</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedCategory === "yijing" && (
                  <>
                    <QuickPrompt text="请帮我起一卦，分析当前事业发展方向" onSend={setInput} />
                    <QuickPrompt text="近期面临重大抉择，请占卜指引" onSend={setInput} />
                  </>
                )}
                {selectedCategory === "fengshui" && (
                  <>
                    <QuickPrompt text="请分析我家客厅的风水格局" onSend={setInput} />
                    <QuickPrompt text="办公桌如何摆放有利于事业运" onSend={setInput} />
                  </>
                )}
                {selectedCategory === "tarot" && (
                  <>
                    <QuickPrompt text="请为我抽牌解读当前的感情状况" onSend={setInput} />
                    <QuickPrompt text="我的事业接下来会如何发展" onSend={setInput} />
                  </>
                )}
                {(selectedCategory === "bazi" || selectedCategory === "ziwei") && (
                  <>
                    <QuickPrompt text="请分析我的命格特征与运势走向" onSend={setInput} />
                    <QuickPrompt text="今年的流年运势如何" onSend={setInput} />
                  </>
                )}
                {selectedCategory === "qimen" && (
                  <>
                    <QuickPrompt text="今日出行哪个方位最佳" onSend={setInput} />
                    <QuickPrompt text="近期想做一件重要的事，请择吉" onSend={setInput} />
                  </>
                )}
              </div>
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
      className="text-[10px] rounded-full border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-colors"
    >
      {text}
    </button>
  );
}

function InteractiveSection({ title, step, children }: { title: string; step: number; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="flex items-center justify-center h-4 w-4 rounded-full bg-violet-500/20 text-violet-400 text-[9px] font-bold shrink-0">
          {step}
        </span>
        <span className="text-[11px] text-zinc-300 font-medium">{title}</span>
      </div>
      {children}
    </div>
  );
}

function OptionChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg border px-3 py-1.5 text-[11px] transition-all",
        active
          ? "border-violet-500/50 bg-violet-500/15 text-violet-200"
          : "border-zinc-700/50 bg-zinc-800/30 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300"
      )}
    >
      {label}
    </button>
  );
}
