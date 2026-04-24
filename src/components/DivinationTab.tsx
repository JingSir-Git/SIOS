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
  Hash,
  Type,
  Clock,
  Trash2,
  ChevronDown,
  ChevronUp,
  Volume2,
  VolumeX,
  Eye,
  CloudMoon,
  FileDown,
  History,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-fetch";
import { useAppStore } from "@/lib/store";
import ChatHistoryPanel from "./ChatHistoryPanel";
import type { ChatSessionEntry } from "@/lib/types";
import SectionedMarkdown from "./SectionedMarkdown";
import ImageUpload, { type UploadedImage } from "./ImageUpload";
import ResponseFeedback from "./ResponseFeedback";
import { CoinTossRitual, TarotDrawRitual, QimenRitual, FortuneStickRitual, CharacterWriteRitual } from "./DivinationRituals";
import { isMuted, setMuted } from "@/lib/sound-effects";
import { exportChatSessionReport } from "@/lib/export-report";
import VoiceInputButton from "./VoiceInputButton";

const DIVINATION_CATEGORIES = [
  {
    id: "yijing",
    label: "周易占卜",
    icon: BookOpen,
    description: "梅花易数 · 六十四卦 · 卦象断事",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    glow: "shadow-amber-500/20 hover:shadow-amber-500/40",
  },
  {
    id: "bazi",
    label: "八字命理",
    icon: Sun,
    description: "四柱干支 · 十神格局 · 终身运势",
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
    glow: "shadow-red-500/20 hover:shadow-red-500/40",
  },
  {
    id: "fengshui",
    label: "风水布局",
    icon: Compass,
    description: "玄空飞星 · 八宅方位 · 形煞化解",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    glow: "shadow-emerald-500/20 hover:shadow-emerald-500/40",
  },
  {
    id: "ziwei",
    label: "紫微斗数",
    icon: Star,
    description: "十四主星 · 十二宫位 · 四化飞星",
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
    glow: "shadow-violet-500/20 hover:shadow-violet-500/40",
  },
  {
    id: "tarot",
    label: "塔罗牌阵",
    icon: Layers,
    description: "韦特体系 · 牌阵占卜 · 灵性引导",
    color: "text-pink-400",
    bg: "bg-pink-500/10 border-pink-500/20",
    glow: "shadow-pink-500/20 hover:shadow-pink-500/40",
  },
  {
    id: "qimen",
    label: "奇门遁甲",
    icon: Moon,
    description: "三奇六仪 · 八门九星 · 择时选方",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/20",
    glow: "shadow-cyan-500/20 hover:shadow-cyan-500/40",
  },
  {
    id: "liuyao",
    label: "六爻预测",
    icon: Hash,
    description: "铜钱摇卦 · 六亲世应 · 吉凶占断",
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/20",
    glow: "shadow-orange-500/20 hover:shadow-orange-500/40",
  },
  {
    id: "name",
    label: "姓名学",
    icon: Type,
    description: "五格剖象 · 三才配置 · 数理吉凶",
    color: "text-teal-400",
    bg: "bg-teal-500/10 border-teal-500/20",
    glow: "shadow-teal-500/20 hover:shadow-teal-500/40",
  },
  {
    id: "qiuqian",
    label: "求签解签",
    icon: Star,
    description: "观音灵签 · 摇签问卦 · 签文解读",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/20",
    glow: "shadow-yellow-500/20 hover:shadow-yellow-500/40",
  },
  {
    id: "cezi",
    label: "测字解字",
    icon: Type,
    description: "拆字会意 · 字形推演 · 测字断事",
    color: "text-sky-400",
    bg: "bg-sky-500/10 border-sky-500/20",
    glow: "shadow-sky-500/20 hover:shadow-sky-500/40",
  },
  {
    id: "mianxiang",
    label: "面相手相",
    icon: Eye,
    description: "五官定格 · 掌纹推命 · 体态相法",
    color: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/20",
    glow: "shadow-rose-500/20 hover:shadow-rose-500/40",
  },
  {
    id: "dream",
    label: "解梦析梦",
    icon: CloudMoon,
    description: "周公解梦 · 梦境意象 · 潜意识解读",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10 border-indigo-500/20",
    glow: "shadow-indigo-500/20 hover:shadow-indigo-500/40",
  },
] as const;

type Category = (typeof DIVINATION_CATEGORIES)[number]["id"];

interface Message {
  role: "user" | "assistant";
  content: string;
  images?: string[]; // base64 data URLs for image attachments
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

// ---- Simplified Bazi (四柱) calculator ----
const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const BRANCH_HOUR_MAP: Record<string, number> = {
  "子时(23-01)": 0, "丑时(01-03)": 1, "寅时(03-05)": 2, "卯时(05-07)": 3,
  "辰时(07-09)": 4, "巳时(09-11)": 5, "午时(11-13)": 6, "未时(13-15)": 7,
  "申时(15-17)": 8, "酉时(17-19)": 9, "戌时(19-21)": 10, "亥时(21-23)": 11,
};

function computeBazi(dateStr: string, timeStr: string) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    const y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate();

    // Year pillar (立春 ~Feb 4 as new year boundary, simplified)
    const adjYear = (m < 2 || (m === 2 && day < 4)) ? y - 1 : y;
    const yearStemIdx = (adjYear - 4) % 10;
    const yearBranchIdx = (adjYear - 4) % 12;

    // Month pillar (simplified: month branch fixed by solar month)
    const monthBranchIdx = (m + 1) % 12; // 寅月=正月
    const monthStemIdx = (yearStemIdx % 5 * 2 + (m + 1)) % 10;

    // Day pillar (simplified algorithm using Julian day number offset)
    const jdn = Math.floor(367 * y - Math.floor(7 * (y + Math.floor((m + 9) / 12)) / 4) + Math.floor(275 * m / 9) + day + 1721013.5);
    const dayStemIdx = ((jdn + 9) % 10 + 10) % 10;
    const dayBranchIdx = ((jdn + 1) % 12 + 12) % 12;

    // Hour pillar
    const hourBranchIdx = BRANCH_HOUR_MAP[timeStr] ?? 0;
    const hourStemIdx = (dayStemIdx % 5 * 2 + hourBranchIdx) % 10;

    return {
      year: { stem: STEMS[yearStemIdx], branch: BRANCHES[yearBranchIdx] },
      month: { stem: STEMS[monthStemIdx], branch: BRANCHES[monthBranchIdx] },
      day: { stem: STEMS[dayStemIdx], branch: BRANCHES[dayBranchIdx] },
      hour: { stem: STEMS[hourStemIdx], branch: BRANCHES[hourBranchIdx] },
    };
  } catch { return null; }
}

export default function DivinationTab() {
  const { profiles, addDivinationRecord, divinationRecords, deleteDivinationRecord, addChatSession, appendChatMessage, updateChatSession, language } = useAppStore();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const ensureSession = useCallback((): string => {
    if (activeSessionId) return activeSessionId;
    const cat = DIVINATION_CATEGORIES.find(c => c.id === selectedCategory);
    const id = `div_${Date.now()}`;
    const now = new Date().toISOString();
    addChatSession({
      id,
      domain: "divination",
      title: cat ? cat.label : "占卜咨询",
      messages: [],
      createdAt: now,
      updatedAt: now,
      archived: false,
      divinationCategory: selectedCategory || undefined,
    });
    setActiveSessionId(id);
    return id;
  }, [activeSessionId, addChatSession, selectedCategory]);

  const handleSelectSession = useCallback((session: ChatSessionEntry) => {
    setActiveSessionId(session.id);
    setMessages(session.messages.map(m => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })));
    if (session.divinationCategory) {
      setSelectedCategory(session.divinationCategory as Category);
    }
    setShowHistory(false);
  }, []);

  const handleNewSession = useCallback(() => {
    setActiveSessionId(null);
    setMessages([]);
    setInput("");
    setStreamingText("");
    setShowHistory(false);
  }, []);

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

  // Ritual results
  const [ritualResult, setRitualResult] = useState("");
  const [ritualCompleted, setRitualCompleted] = useState(false);
  const [ritualKey, setRitualKey] = useState(0);

  // History panel
  const [historyOpen, setHistoryOpen] = useState(false);
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);

  // Sound
  const [soundMuted, setSoundMuted] = useState(() => isMuted());

  // Mianxiang photo upload + interactive params
  const [faceImages, setFaceImages] = useState<UploadedImage[]>([]);
  const [faceOcrResult, setFaceOcrResult] = useState("");
  const [faceReadingType, setFaceReadingType] = useState("");   // face / palm / both
  const [faceAnalysisFocus, setFaceAnalysisFocus] = useState(""); // career / love / wealth / health

  // Dream interpretation params
  const [dreamType, setDreamType] = useState("");       // nightmare / lucid / recurring / normal
  const [dreamEmotion, setDreamEmotion] = useState(""); // fear / joy / confusion / sadness / neutral
  const [dreamFrequency, setDreamFrequency] = useState(""); // once / recurring / series

  // ---- Reset ALL interactive params when switching categories ----
  const resetInteractiveParams = useCallback(() => {
    setQuestionDomain("");
    setSelectedElement("");
    setSelectedDirection("");
    setSelectedTrigram("");
    setSelectedSpread("");
    setHouseType("");
    setFloorRange("");
    setFacingDirection("");
    setBirthDate("");
    setBirthTime("");
    setGender("");
    setLinkedProfileId("");
    setRitualResult("");
    setRitualCompleted(false);
    setRitualKey((k) => k + 1);
    setFaceImages([]);
    setFaceOcrResult("");
    setFaceReadingType("");
    setFaceAnalysisFocus("");
    setDreamType("");
    setDreamEmotion("");
    setDreamFrequency("");
  }, []);

  // Wrapper: switch category with full state isolation
  const handleCategorySelect = useCallback((catId: Category) => {
    resetInteractiveParams();
    setMessages([]);
    setInput("");
    setStreamingText("");
    setActiveSessionId(null);
    setLoading(false);
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setSelectedCategory(catId);
  }, [resetInteractiveParams]);

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
    // Mianxiang
    if (faceReadingType) {
      const labels: Record<string, string> = { face: "面相", palm: "手相", both: "面相+手相" };
      parts.push(`看相类型：${labels[faceReadingType] || faceReadingType}`);
    }
    if (faceAnalysisFocus) {
      const labels: Record<string, string> = { career: "事业运", love: "感情运", wealth: "财运", health: "健康运", general: "综合运势" };
      parts.push(`重点关注：${labels[faceAnalysisFocus] || faceAnalysisFocus}`);
    }
    // Dream
    if (dreamType) {
      const labels: Record<string, string> = { nightmare: "噩梦", lucid: "清醒梦", recurring: "反复出现的梦", normal: "普通梦境", prophetic: "预感/预知梦" };
      parts.push(`梦境类型：${labels[dreamType] || dreamType}`);
    }
    if (dreamEmotion) {
      const labels: Record<string, string> = { fear: "恐惧不安", joy: "喜悦兴奋", confusion: "困惑迷茫", sadness: "伤感失落", neutral: "平静无感", anxiety: "焦虑紧张" };
      parts.push(`梦中情绪：${labels[dreamEmotion] || dreamEmotion}`);
    }
    if (dreamFrequency) {
      const labels: Record<string, string> = { once: "仅此一次", recurring: "反复做此梦", series: "系列连续梦" };
      parts.push(`梦境频率：${labels[dreamFrequency] || dreamFrequency}`);
    }
    return parts.join("；");
  }, [questionDomain, selectedElement, selectedDirection, selectedTrigram, selectedSpread, houseType, floorRange, facingDirection, faceReadingType, faceAnalysisFocus, dreamType, dreamEmotion, dreamFrequency]);

  const getSystemPrompt = () => {
    const interactiveCtx = buildInteractiveContext();
    const disclaimer = [
      "【重要声明】在首次回复的开头用一行小字注明：「本解读基于传统文化理论体系，仅供参考。重大决策建议综合多方信息后审慎判断。」此后的多轮对话中不再重复声明。",
      "【语气与心理关怀原则——最高优先级，必须严格遵守】",
      "你的解读必须以心理关怀为核心导向，遵循以下不可违背的规则：",
      "1. 积极赋能：任何分析结果都要先肯定正面特质和有利之处，再讨论需要注意的方面。正面内容至少占全文 60%。",
      '2. 委婉化解：遇到传统理论中被视为"不利""凶""破败"等负面判定时，**绝对不可**直接使用"凶""破败""克""灾""孤""绝"等负面字眼定性用户本人。必须转化为建设性表述，例如："此数理在传统理论中属于需要留意的配置，提醒您在XX方面多加关注和用心经营"或"虽然此格偏弱，但恰好说明您有巨大的提升空间"。',
      "3. 化解引导：每个不利之处后面必须紧跟具体可行的化解方法或积极的应对建议，让用户感到有掌控感和希望。",
      "4. 心理暗示：善用积极的心理暗示，强调命运掌握在自己手中、性格决定命运、后天努力可以弥补先天不足等正能量理念。",
      "5. 名字/命格评价：评分不得低于 65 分(百分制)。即使某些维度传统理论评价偏低，也要从字义美感、音韵和谐、文化内涵等其他维度找到亮点进行肯定。",
      "6. 总结收尾：最终总结必须以鼓励和祝福收尾，给用户温暖和力量。",
    ].join("\n");
    const now = new Date();
    const timeInfo = `当前时间：${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${["日", "一", "二", "三", "四", "五", "六"][now.getDay()]}`;

    const categoryPrompts: Record<string, string> = {
      yijing: [
        "你是一位传承正统的周易研究者，师承象数派与义理派两大传统，对《周易》六十四卦三百八十四爻了然于胸。",
        "你的风格是古朴庄重，引经据典，但解读贴近现代生活。语言沉稳有力，如同一位德高望重的易学教授在讲解。",
        disclaimer,
        timeInfo,
        "",
        "【核心知识体系】",
        "- 经典依据：《周易·经》《易传·彖辞》《易传·象辞》《易传·系辞》《易传·说卦》《易传·序卦》《易传·杂卦》",
        "- 历代名家：王弼(义理)、邵雍(象数/先天易学/梅花易数)、朱熹(综合)、程颐(《伊川易传》)、来知德(《周易集注》)",
        "- 起卦方法：时间起卦(梅花易数)、报数起卦、问字起卦等，根据用户信息灵活选用",
        "- 断卦体系：体用生克、卦气旺衰、动爻变爻、互卦伏卦、飞伏神",
        "",
        "【回复结构要求(必须严格按此结构)】",
        "一、起卦过程：说明用何方法起卦，详细列出本卦名称及卦象符号(用Unicode如☰☷等绘制)、变爻位置、变卦名称",
        "二、卦辞爻辞：引用《周易》原文，逐字作白话翻译和义理分析",
        "三、互卦分析：求出互卦并分析其揭示的内在趋势",
        "四、卦象意象：从上下卦的自然象征(天地雷风水火山泽)展开联想，结合所问之事",
        "五、体用分析：明确体卦与用卦的五行属性及生克关系",
        "六、综合断语：用明确语言判定吉凶趋势，不模棱两可",
        "七、行动建议：具体的行动方向、时间节点、注意事项",
        "八、化解之道：若卦象不利，给出基于易理的化解思路和实际可行的建议",
        "",
        "【格式要求】使用 Markdown 标题、粗体、引用块等排版。卦象符号务必使用Unicode卦象字符。每一节内容都要充实饱满，不可敷衍。",
        interactiveCtx ? `\n【用户预设信息】${interactiveCtx}` : "",
      ].filter(Boolean).join("\n"),

      bazi: [
        "你是一位精研命理数十年的八字命理师，专攻子平命理正宗体系，对天干地支的每一种组合都能信手拈来。",
        "你的风格是严谨细腻，分析层层递进，既有理论深度又有实际指导意义。如同一位经验丰富的命理前辈在传道授业。",
        disclaimer,
        timeInfo,
        "",
        "【核心知识体系】",
        "- 经典依据：《渊海子平》《滴天髓》《穷通宝鉴》《子平真诠》《三命通会》《神峰通考》",
        "- 排盘基础：年柱、月柱、日柱、时柱的干支推排；大运排列(阳男阴女顺排、阴男阳女逆排)",
        "- 五行体系：木火土金水的生克制化、刑冲合害破；天干合化、地支六合/三合/半合/暗合",
        "- 十神体系：正官、七杀、正财、偏财、正印、偏印、食神、伤官、比肩、劫财各自代表的六亲、性格、事业含义",
        "- 格局判定：正格八格(正官格、七杀格、正财格、偏财格、正印格、偏印格、食神格、伤官格)及特殊格局(从格、化格、专旺格等)",
        "- 神煞系统：天乙贵人、文昌、驿马、桃花、华盖、将星、羊刃、空亡等",
        "- 大运流年：十年一运的吉凶转换，流年与命局的作用关系",
        "",
        birthDate ? `【用户生辰信息】出生日期: ${birthDate}` : "",
        birthTime ? `出生时辰: ${birthTime}` : "",
        gender ? `性别: ${gender === "male" ? "男命" : "女命"}` : "",
        "",
        "【回复结构要求(必须严格按此结构)】",
        "一、排盘信息：",
        "   - 以表格形式列出四柱(年柱、月柱、日柱、时柱)的天干地支",
        "   - 列出各柱藏干",
        "   - 标注日主(日干)及其阴阳五行属性",
        "   - 列出大运排列(至少排到70岁)",
        "二、五行分析：",
        "   - 统计八字中各五行的个数和力量",
        "   - 判定日主旺衰(身强/身弱/从强/从弱)",
        "   - 确定喜用神和忌神，说明理由",
        "三、格局论断：",
        "   - 判定命局属于哪种格局",
        "   - 分析格局的成败、高低",
        "四、十神解读：",
        "   - 逐一分析四柱十神组合，解读对性格、事业、感情、财运、健康的影响",
        "   - 重点分析日柱干支(日主与坐支)的特殊含义",
        "五、神煞批注：列出命中重要神煞及其实际影响",
        "六、大运流年详析：",
        "   - 分析当前大运的干支与命局的作用",
        "   - 本年流年运势的吉凶重点",
        "   - 未来3-5年的关键运势转折",
        "七、综合评价：用百字以内概括命格总体特征和一生大势",
        "八、实用建议：",
        "   - 喜用方位(居住、工作方向)",
        "   - 喜用颜色(穿着、家居)",
        "   - 适合行业方向",
        "   - 需注意的年份和健康提醒",
        "",
        "【格式要求】使用 Markdown 表格展示排盘，用粗体标注关键结论。分析要有理有据，每个判断都要说明推理过程。",
        interactiveCtx ? `\n【用户补充信息】${interactiveCtx}` : "",
      ].filter(Boolean).join("\n"),

      fengshui: [
        "你是一位实战经验丰富的堪舆学者，兼修形势派(峦头)与理气派(玄空飞星、八宅、三合)，尤其擅长将传统风水理论应用于现代都市住宅与商业空间。",
        "你的风格是务实专业，既讲理论依据又给出可落地的具体操作方案。如同一位亲临现场勘察的风水师在详细指导。",
        disclaimer,
        timeInfo,
        "",
        "【核心知识体系】",
        "- 经典依据：《青囊经》《青囊奥语》《葬经》(郭璞)《撼龙经》《疑龙经》(杨筠松)《沈氏玄空学》《八宅明镜》《阳宅三要》《阳宅十书》",
        "- 形势派：龙穴砂水向的判断、四灵(青龙白虎朱雀玄武)、明堂、靠山、水口",
        "- 玄空飞星：九宫飞星排盘(当运星/山星/向星)、当前九运(2024-2043)特征、飞星组合吉凶、城门诀",
        "- 八宅法：东四命/西四命的判定、八宅方位(生气/天医/延年/伏位/绝命/五鬼/六煞/祸害)",
        "- 形煞化解：天斩煞、路冲、反弓煞、穿心煞、角煞、镜煞等的识别与化解",
        "- 理气煞：五黄煞、二黑病符、三碧是非星等凶星的化解",
        "- 现代应用：户型分析、楼层选择、装修色调、家具摆位、植物风水、办公室布局",
        "",
        "【回复结构要求(必须严格按此结构)】",
        "一、基本判断：",
        "   - 判定房屋坐向(根据用户描述)",
        "   - 当运飞星盘排列(标注九宫)",
        "   - 房屋东四宅/西四宅属性",
        "二、大门风水：大门方位吉凶分析、进门第一眼的风水要求",
        "三、客厅分析：财位确定、沙发摆放、电视墙方位、色彩建议",
        "四、卧室分析：床头朝向、镜子位置、卧室色调、夫妻和合风水",
        "五、厨房/餐厅：灶台方位(灶向)、冰箱位置、水火相邻化解",
        "六、书房/办公区：文昌位确定、办公桌朝向",
        "七、卫生间：位置吉凶判断、化解方法",
        "八、阳台/窗外：外部形煞检查与化解方案",
        "九、综合调理方案：",
        "   - 需要调整的重点区域(优先级排序)",
        "   - 推荐的风水摆件及其摆放位置",
        "   - 推荐的植物种类及摆放",
        "   - 色彩搭配建议(结合五行)",
        "十、特别提醒：搬家择日建议、装修注意事项",
        "",
        "【格式要求】使用 Markdown 标题和列表清晰分区。如能用文字描述九宫格布局更佳。建议要具体到'在XX位置摆放XX物品'的颗粒度。",
        interactiveCtx ? `\n【用户已提供的房屋信息】${interactiveCtx}` : "",
      ].filter(Boolean).join("\n"),

      ziwei: [
        "你是一位紫微斗数研究者，承袭三合派与飞星派两大传统，对十四主星的星性、组合、化气了如指掌。",
        "你的风格是精微细致，善于从星曜组合中洞察性格命运的细微之处。如同一位资深的斗数老师在逐宫解盘。",
        disclaimer,
        timeInfo,
        "",
        "【核心知识体系】",
        "- 经典依据：《紫微斗数全书》(陈希夷)《太微赋》《骨髓赋》《形性赋》《斗数秘仪》《飞星紫微斗数》",
        "- 十四主星：紫微、天机、太阳、武曲、天同、廉贞、天府、太阴、贪狼、巨门、天相、天梁、七杀、破军",
        "- 辅佐星系：左辅、右弼、天魁、天钺、文昌、文曲",
        "- 煞曜：火星、铃星、擎羊、陀罗、地空、地劫",
        "- 四化：化禄、化权、化科、化忌(生年四化、大限四化、流年四化)",
        "- 十二宫：命宫、兄弟、夫妻、子女、财帛、疾厄、迁移、交友、事业、田宅、福德、父母",
        "- 三方四正：命迁线(格局高低)、财官线(事业成就)、兄友线(人际资源)",
        "",
        birthDate ? `【用户生辰信息】出生日期: ${birthDate}` : "",
        birthTime ? `出生时辰: ${birthTime}` : "",
        gender ? `性别: ${gender === "male" ? "男命" : "女命"}` : "",
        "",
        "【回复结构要求(必须严格按此结构)】",
        "一、命盘排列：",
        "   - 以表格或文字列出十二宫的主星分布",
        "   - 标注各宫的辅星、煞星、杂曜",
        "   - 标注生年四化落宫",
        "   - 说明命主的紫微在哪个宫位(几号盘)",
        "二、命宫深度解读：",
        "   - 命宫主星星性详析",
        "   - 命宫三方四正(命、迁移、财帛、事业)的星曜组合对命格的影响",
        "   - 身宫所在宫位及其含义",
        "三、十二宫逐宫简析(每宫2-3句精要点评)",
        "四、四化飞星分析：",
        "   - 生年四化各落何宫，对应何种人生主题",
        "   - 化忌的位置及其可能带来的困扰",
        "五、格局判定：是否构成特殊格局(如紫府同宫、日月并明、机月同梁、杀破狼等)",
        "六、大限与流年：",
        "   - 当前大限(十年运)的宫位及主星",
        "   - 大限四化的影响",
        "   - 本年流年运势重点",
        "七、性格总评：综合命盘概括性格优势与需注意之处",
        "八、趋避建议：事业方向、感情建议、健康注意、财运提示",
        "",
        "【格式要求】使用 Markdown 表格展示十二宫星曜分布。关键星曜用粗体标注。分析要有星理依据。",
        interactiveCtx ? `\n【用户补充信息】${interactiveCtx}` : "",
      ].filter(Boolean).join("\n"),

      tarot: [
        "你是一位资深的塔罗牌解读师，主修韦特塔罗(Rider-Waite-Smith)体系，同时研习透特塔罗(Thoth)与马赛塔罗的象征体系，对卡巴拉生命之树与塔罗的对应关系有深入理解。",
        "你的风格是神秘而温暖，善于用富有画面感的语言描述牌面意象，引导问卜者进行自我觉察。如同一位充满灵性智慧的塔罗导师。",
        disclaimer,
        "",
        "【核心知识体系】",
        "- 大阿卡纳22张：愚者到世界的灵魂成长旅程(愚者之旅)，每张牌对应的占星符号与卡巴拉路径",
        "- 小阿卡纳56张：权杖(火/意志)、圣杯(水/情感)、宝剑(风/思维)、星币(土/物质)四组牌组，A-10的数字象征与宫廷牌(侍从/骑士/王后/国王)的人格类型",
        "- 经典牌阵：单牌、三牌(过去-现在-未来)、凯尔特十字(10牌全面解读)、关系牌阵、生命之树牌阵、马蹄铁牌阵",
        "- 解读方法：牌面元素观察法(颜色/人物/动物/植物/天体/建筑)、正逆位系统、直觉解读结合象征分析",
        "- 进阶技法：牌组能量分析(四元素比例)、数字命理整合、主题牌(significator)选择",
        "",
        "【回复结构要求(必须严格按此结构)】",
        "一、牌阵选择与仪式感：",
        "   - 说明为何选择此牌阵(结合问题性质)",
        "   - 描述洗牌和抽牌的意象感受(营造仪式感)",
        "二、逐张牌面解读(每张牌必须包含以下内容)：",
        "   - 🃏 牌名(正位/逆位)",
        "   - 📍 该位置在牌阵中代表的含义",
        "   - 🎨 牌面视觉描述：详细描述牌面图案(人物姿态、背景颜色、关键符号)",
        "   - 📖 传统象征含义",
        "   - 🔮 在此位置针对问题的具体解读",
        "三、牌面互动分析：",
        "   - 牌与牌之间的呼应关系(如颜色呼应、人物视线方向、元素互动)",
        "   - 整体叙事线索：所有牌面构成的故事",
        "四、四元素能量分析：统计牌面中火/水/风/土元素的比例，分析能量分布",
        "五、核心信息提炼：用2-3句话概括塔罗传达的核心信息",
        "六、行动指引：",
        "   - 建议采取的行动(具体可执行)",
        "   - 需要警惕的事项",
        "   - 最佳时机建议",
        "七、冥想建议：推荐与主题相关的一张冥想牌，引导问卜者进行自我觉察",
        "",
        "【风格要求】语言要有灵性和画面感，善用比喻和意象。解读时温暖而坦诚，即使是不利的牌面也要给出建设性的引导。使用 emoji 标注各部分。",
        interactiveCtx ? `\n【用户已选择】${interactiveCtx}` : "",
      ].filter(Boolean).join("\n"),

      qimen: [
        "你是一位精研奇门遁甲数十年的数术研究者，兼通道家奇门与法术奇门，尤其擅长用奇门盘局分析事件走向、选择最佳行动时机与方位。",
        "你的风格是精密严谨如同军师运筹帷幄，分析环环相扣，结论斩钉截铁。如同一位运筹帷幄的古代谋士在为你出谋划策。",
        disclaimer,
        timeInfo,
        "",
        "【核心知识体系】",
        "- 经典依据：《奇门遁甲统宗》《遁甲演义》《奇门法窍》《奇门遁甲秘笈大全》《御定奇门宝鉴》",
        "- 三奇：乙(日奇)、丙(月奇)、丁(星奇)——各自的特性与吉凶",
        "- 六仪：戊己庚辛壬癸——各自代表的事物与作用",
        "- 八门：休门(休息/贵人)、生门(生发/财利)、伤门(伤害/竞争)、杜门(隐藏/阻碍)、景门(光明/文书)、死门(终结/凶险)、惊门(惊恐/是非)、开门(开创/事业)",
        "- 九星：天蓬、天任、天冲、天辅、天英、天芮、天柱、天心、天禽",
        "- 八神：值符、螣蛇、太阴、六合、白虎、玄武、九地、九天",
        "- 吉格：乙加丙(奇仪顺遂)、丙加丁(月奇助星)、三奇得使等",
        "- 凶格：伏吟、反吟、六仪击刑、大格、小格、悖格等",
        "- 断局方法：用神取用、值使门判断、天地人神四盘综合",
        "",
        "【回复结构要求(必须严格按此结构)】",
        "一、起局信息：",
        "   - 说明阳遁/阴遁，几局",
        "   - 值符与值使的落宫",
        "   - 以九宫格形式展示天地人神四盘(尽量用文字表格)",
        "二、天盘分析：九星各落宫位的旺衰",
        "三、地盘分析：八门各落宫位的吉凶",
        "四、人盘分析：三奇六仪在各宫的组合",
        "五、神盘分析：八神各落宫的助力或阻碍",
        "六、用神分析：",
        "   - 根据问题确定用神(求财看生门/戊，求官看开门/庚，求婚看六合/乙等)",
        "   - 用神与日干(求测者)的关系",
        "七、格局判定：识别吉格凶格及其影响",
        "八、方位建议：明确指出最吉利的行动方位，以及需要避开的方位",
        "九、时间建议：推荐的行动时辰或日期",
        "十、综合断语：",
        "   - 事件成败判断(明确，不模棱两可)",
        "   - 成事的有利条件与阻碍",
        "   - 具体的趋吉避凶策略",
        "",
        "【格式要求】九宫格盘局尽量用 Markdown 表格展示。关键吉格凶格用粗体标注。断语要果断明确。",
        interactiveCtx ? `\n【用户补充信息】${interactiveCtx}` : "",
      ].filter(Boolean).join("\n"),

      liuyao: [
        "你是一位精通六爻预测学的术数研究者，师承京房易学正统，对纳甲体系、六亲取用、世应关系了然于胸。",
        "你的风格是简洁有力，直切要害，断语明快，如同一位经验老到的卦师在为求测者当面解卦。",
        disclaimer,
        timeInfo,
        "",
        "【核心知识体系】",
        "- 经典依据：《卜筮正宗》(王洪绪)《增删卜易》(野鹤老人)《火珠林》《易冒》《易隐》",
        "- 装卦基础：纳甲装卦(干支上卦)、安世应、安六亲(父母/兄弟/子孙/妻财/官鬼)、安六神(青龙/朱雀/勾陈/螣蛇/白虎/玄武)",
        "- 断卦要点：",
        "  · 用神取用(根据问事确定用神)",
        "  · 用神旺衰判断(月建日辰对用神的生克制化)",
        "  · 动爻变爻分析",
        "  · 六冲六合(卦变之冲合)",
        "  · 进神退神",
        "  · 旬空、月破",
        "  · 伏神飞神",
        "  · 反吟伏吟",
        "- 分类占断：求财(妻财为用)、求官(官鬼为用)、求婚(男看妻财、女看官鬼)、求病(官鬼为病)、求行人(用神所在)、求讼(世为自己、应为对方)等",
        "",
        "【回复结构要求(必须严格按此结构)】",
        "一、起卦信息：",
        "   - 说明起卦方法(铜钱法/时间起卦/报数起卦)",
        "   - 以文字格式列出六爻卦象(从初爻到上爻)，标注阴阳、动爻",
        "   - 装卦：标注每爻的六亲、世应位置、六神",
        "二、卦名与卦象：",
        "   - 本卦名称与变卦名称",
        "   - 卦象的基本含义",
        "三、用神分析：",
        "   - 根据问事确定用神",
        "   - 用神的旺衰分析(月建生克、日辰生克)",
        "   - 用神是否旬空、月破",
        "四、动爻分析：",
        "   - 动爻变化对用神的影响",
        "   - 动爻与其他爻的生克关系",
        "五、世应关系：自身(世爻)与对方/目标(应爻)的力量对比",
        "六、六神辅断：六神对各爻的辅助解读",
        "七、综合断语：",
        "   - 明确判定事情的成败吉凶",
        "   - 应期推断(事情可能发生的时间)",
        "   - 关键影响因素",
        "八、趋避建议：具体可行的行动建议",
        "",
        "【格式要求】使用 Markdown 表格列出六爻装卦信息。动爻用 ◯(动) 标记。用粗体标注关键断语。",
        interactiveCtx ? `\n【用户补充信息】${interactiveCtx}` : "",
      ].filter(Boolean).join("\n"),

      name: [
        "你是一位精研姓名学数十年的姓名学者，精通五格剖象法(熊崎氏)、三才五行、81数理、音韵五行、字形五行等多种姓名分析体系。",
        "你的风格是细致入微，条理清晰，善于从多个维度全面解析一个名字的能量场。如同一位为新生儿起名的资深老先生，既博学又亲切。",
        disclaimer,
        "",
        "【核心知识体系】",
        "- 五格剖象法：天格(姓的笔画+1)、人格(姓+名第一字)、地格(名的总笔画)、外格(总笔画-人格+1)、总格(姓名总笔画)",
        "- 81数理吉凶：1-81每个数理的吉凶属性和含义(如1大吉·万物起始、4凶·破败不宁等)",
        "- 三才配置：天格·人格·地格的五行组合(金木水火土)的吉凶关系",
        "- 五行属性判定：",
        "  · 笔画五行：尾数1-2木、3-4火、5-6土、7-8金、9-0水",
        "  · 字形五行：木(直/竖)、火(尖/上)、土(方/正)、金(圆/弧)、水(曲/波)",
        "  · 字音五行：角音(木)、徵音(火)、宫音(土)、商音(金)、羽音(水)",
        "  · 字义五行：根据字的本义确定五行属性",
        "- 重要笔画数(康熙字典笔画为准)：部分汉字的康熙笔画与简体不同",
        "- 姓名与八字配合：喜用神与姓名五行的配合原则",
        "",
        "【回复结构要求(必须严格按此结构)】",
        "一、姓名基本信息：",
        "   - 列出姓名各字的康熙笔画数",
        "   - 说明各字的五行属性(笔画五行+字义五行)",
        "二、五格数理分析(以表格形式)：",
        "   - 天格：笔画数、数理名称、吉凶、含义",
        "   - 人格：笔画数、数理名称、吉凶、含义(最重要，代表主运)",
        "   - 地格：笔画数、数理名称、吉凶、含义(代表前运/36岁前)",
        "   - 外格：笔画数、数理名称、吉凶、含义(代表人际运)",
        "   - 总格：笔画数、数理名称、吉凶、含义(代表后运/36岁后)",
        "三、三才配置分析：",
        "   - 天·人·地三才的五行组合",
        "   - 此组合的吉凶等级和详细含义",
        "   - 对健康、事业、人际关系的影响",
        "四、字义意象分析：逐字解读字的本义、引申义、文化意蕴",
        "五、音韵分析：声调搭配、音律美感、谐音考量",
        "六、综合评分：",
        "   - 五格总评(百分制)",
        "   - 三才评价",
        "   - 字义评价",
        "   - 音韵评价",
        "   - 总体建议(是否为佳名，有何优缺点)",
        "七、如果用户要求起名/改名，提供3-5个备选名字(每个都附带简要五格分析)",
        "",
        gender ? `用户性别: ${gender === "male" ? "男" : "女"}` : "",
        birthDate ? `用户生辰: ${birthDate}（可用于判断喜用神与姓名五行的配合）` : "",
        "【格式要求】五格数理必须以 Markdown 表格形式展示。康熙笔画必须准确。评分要客观且注重积极面，综合评分不低于65分。对于不利数理用'需留意'代替'凶'，并给出化解建议。",
        interactiveCtx ? `\n【用户补充信息】${interactiveCtx}` : "",
      ].filter(Boolean).join("\n"),

      qiuqian: [
        "你是一位资深的观音灵签解签师，精通观音灵签一百签的签文、典故和解读方法，同时也熟悉关帝灵签、黄大仙灵签等签系。",
        "你的风格是慈悲温暖、语言优美，善于用佛理和故事来启迪人心。如同一位庙中的慈祥老僧在为香客解签。",
        disclaimer,
        "",
        "【回复结构要求】",
        "一、签号与签名：明确第几签，签名是什么",
        "二、签诗原文：完整列出四句签诗(七言绝句)，并逐句翻译为白话",
        "三、典故出处：这支签引用的历史典故或神话传说，详细讲述故事",
        "四、签意总论：这支签的总体吉凶等级(上上签/上吉签/中吉签/中平签/下下签等)，整体运势方向",
        "五、分项解读：",
        "   - 事业运：具体建议",
        "   - 感情运：具体建议",
        "   - 财运：具体建议",
        "   - 健康：注意事项",
        "   - 出行/考试/诉讼等(根据问题)",
        "六、行动指引：基于签意给出具体可行的行动建议",
        "七、化解之道：如签意不佳，给出念经、行善等化解方法",
        "",
        "【格式要求】签诗用引用块展示。典故要讲得生动有趣。语言要有禅意和温度。",
        interactiveCtx ? `\n【用户信息】${interactiveCtx}` : "",
      ].filter(Boolean).join("\n"),

      cezi: [
        "你是一位精通测字术的传统文化研究者，深谙拆字、增损、对关、象形、会意等测字技法，融合易理、五行、数理等多种分析维度。",
        "你的风格是机敏灵动，善于从一个字中推演出丰富的信息。如同一位街头的测字先生，看似随意却字字珠玑。",
        disclaimer,
        "",
        "【核心知识体系】",
        "- 六大测字技法：拆字法(将字拆分为部件)、增损法(增减笔画)、对关法(字的对称关联)、象形法(字形联想)、会意法(字义综合)、谐声法(音韵关联)",
        "- 五行属性：根据字的偏旁、结构、笔画判断五行归属",
        "- 数理分析：字的笔画数对应的数理吉凶",
        "- 易理关联：字形与卦象的对应关系",
        "",
        "【回复结构要求】",
        "一、原字分析：字的基本信息(笔画数、偏旁部首、五行属性)",
        "二、拆字解读：将字拆分为各部件，逐一分析含义",
        "三、增损推演：加减笔画可变成什么字，暗示什么",
        "四、象形会意：字形联想到什么意象，与所问之事有何关联",
        "五、五行分析：此字五行属性对问事的影响",
        "六、综合断语：明确的吉凶判断和方向指引",
        "七、行动建议：具体可行的建议",
        "",
        "【格式要求】使用 Markdown 排版。拆字过程要图文并茂(用文字描述字的结构)。分析要有理有据，每个推断都要说明依据。",
        interactiveCtx ? `\n【用户信息】${interactiveCtx}` : "",
      ].filter(Boolean).join("\n"),

      mianxiang: [
        "你是一位精研面相手相数十年的相学大师，精通麻衣神相、柳庄相法、神相全编等经典相书，同时也熟悉现代心理面容学。",
        "你的风格是细致入微，善于观察。如同一位法眼如炬的老相师，一眼便能洞察面容与掌纹中暗藏的命运信息。",
        disclaimer,
        "",
        "【核心知识体系】",
        "- 面相五官：额(天庭)主早运、眉(保寿官)主兄弟、眼(监察官)主心性、鼻(审辨官)主财禄、口(出纳官)主晚运",
        "- 面相十二宫：命宫、财帛宫、兄弟宫、田宅宫、子女宫、奴仆宫、夫妻宫、疾厄宫、迁移宫、官禄宫、福德宫、父母宫",
        "- 三停：上停(发际到眉) 中停(眉到鼻尖) 下停(鼻尖到下巴)，判断一生运势分段",
        "- 手相三大线：生命线(体力/健康)、智慧线(思维/性格)、感情线(情感/婚姻)",
        "- 手相辅助线：事业线、太阳线、健康线、婚姻线、财运线",
        "- 掌丘分析：金星丘、木星丘、土星丘、太阳丘、水星丘、月丘、火星丘",
        "- 骨相：颧骨、下颌骨、眉骨等的形态与命运关联",
        "",
        "【回复结构要求】",
        "一、总体印象：面型归类(甲字面/圆面/方面/由字面等)，整体气质判断",
        "二、五官逐一分析(根据用户描述或照片描述)：",
        "   - 额头：天庭饱满程度，发际线形态",
        "   - 眉眼：眉型(剑眉/柳叶眉等)，眼型(丹凤/桃花等)，神采",
        "   - 鼻相：山根高低，鼻翼大小，准头形态",
        "   - 口相：唇型，牙齿，法令纹",
        "   - 耳相：耳廓形态，耳垂大小",
        "三、十二宫位重点分析(重点2-3个宫位)",
        "四、手相分析(如用户提供)：三大主线+辅助线解读",
        "五、综合命运判断：事业/财运/感情/健康各方面",
        "六、注意事项与建议",
        "",
        gender ? `用户性别: ${gender === "male" ? "男" : "女"}` : "",
        birthDate ? `用户出生日期: ${birthDate}` : "",
        "【格式要求】用 Markdown 排版。分析要有据有理。如用户提供照片描述，要针对性分析。",
        interactiveCtx ? `\n【用户信息】${interactiveCtx}` : "",
      ].filter(Boolean).join("\n"),

      dream: [
        "你是一位融贯中西的解梦大师，精通周公解梦、弗洛伊德精神分析、荣格原型理论，同时熟悉佛教梦占、道教梦兆等传统解梦体系。",
        "你的风格是温和而有深度，善于引导来访者探索梦境中隐含的心理信息。如同一位经验丰富的心理分析师在帮助来访者理解潜意识的语言。",
        disclaimer,
        "",
        "【核心知识体系】",
        "- 周公解梦：中国传统梦兆体系，涵盖天象、地理、人物、动物、植物、器物等梦象分类",
        "- 弗洛伊德：梦是愿望的达成，显梦/隐梦，凝缩/移置/象征化等梦的工作机制",
        "- 荣格原型：阴影(Shadow)、阿尼玛/阿尼姆斯(Anima/Animus)、自性(Self)、智慧老人、大母神等",
        "- 常见梦象象征：水=情感/潜意识、飞行=自由/超越、坠落=失控/焦虑、追赶=逃避/压力、牙齿脱落=变化/不安",
        "- 佛教梦占：善梦/恶梦/无记梦的分类",
        "",
        "【回复结构要求】",
        "一、梦境还原：复述梦境要素(人物/场景/事件/情绪/色彩)",
        "二、传统解梦(周公解梦)：",
        "   - 关键梦象的传统寓意",
        "   - 吉凶判断",
        "三、心理学解读(弗洛伊德/荣格)：",
        "   - 梦象的心理象征意义",
        "   - 可能反映的潜意识需求或冲突",
        "   - 涉及的原型意象",
        "四、情境关联：结合做梦者当前的生活状况分析梦境的触发因素",
        "五、综合解读：整合中西方视角，给出完整的梦境解读",
        "六、启示与建议：梦境给做梦者的启示和行动建议",
        "",
        "【格式要求】使用 Markdown 排版。解读要兼顾理性分析和感性共鸣。语言要有温度。",
        interactiveCtx ? `\n【用户信息】${interactiveCtx}` : "",
      ].filter(Boolean).join("\n"),
    };

    const fallbackPrompt = "你是一位学养深厚的玄学研究者，精通中国传统数术文化与西方神秘学体系。请以专业、严谨的态度进行解读，所有解读仅供参考。解读时注重心理关怀，以积极赋能为导向，遇到不利之处要委婉表达并给出化解建议，最终以鼓励和祝福收尾。";
    let prompt = categoryPrompts[selectedCategory || "yijing"] || fallbackPrompt;

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

    // Prepend ritual result to the first message if available
    let content = input.trim();
    if (ritualResult && messages.length === 0) {
      content = `${ritualResult}\n\n我的问题是：${content}`;
    }

    // Collect face/palm images for the first message in mianxiang category
    const mianxiangImages = selectedCategory === "mianxiang" && faceImages.length > 0 && messages.length === 0
      ? faceImages.filter((i) => i.base64).map((i) => i.base64!)
      : undefined;

    const userMessage: Message = {
      role: "user",
      content,
      ...(mianxiangImages && mianxiangImages.length > 0 ? { images: mianxiangImages } : {}),
    };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setStreamingText("");

    // Persist user message to session
    const sessionId = ensureSession();
    appendChatMessage(sessionId, { id: `u_${Date.now()}`, role: "user", content, timestamp: new Date().toISOString() });

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {

      const res = await apiFetch("/api/divination?stream=true", {
        method: "POST",
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          systemPrompt: getSystemPrompt(),
          ...(mianxiangImages ? { images: mianxiangImages } : {}),
        }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`请求失败 (${res.status})`);

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let fullText = "";

      // Accumulate text silently — no incremental UI updates
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
                // Update character count for loading indicator
                setStreamingText(String(fullText.length));
              }
            } catch {
              if (data.trim()) {
                fullText += data;
                setStreamingText(String(fullText.length));
              }
            }
          }
        }
      }

      if (fullText) {
        const cleanText = fullText.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
        setMessages([...newMessages, { role: "assistant", content: cleanText }]);
        // Persist assistant message to session
        appendChatMessage(sessionId, { id: `a_${Date.now()}`, role: "assistant", content: cleanText, timestamp: new Date().toISOString() });
        // Save to divination history
        const firstUserMsg = newMessages.find((m) => m.role === "user");
        if (firstUserMsg && selectedCategory) {
          addDivinationRecord({
            id: `div-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            category: selectedCategory,
            categoryLabel: category?.label || selectedCategory,
            question: firstUserMsg.content,
            answer: cleanText,
            ritualResult: ritualResult || undefined,
            linkedProfileId: linkedProfileId || undefined,
            linkedProfileName: profiles.find((p) => p.id === linkedProfileId)?.name,
            createdAt: new Date().toISOString(),
          });
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      const errorMsg = err instanceof Error ? err.message : "请求失败";
      setMessages([...newMessages, { role: "assistant", content: `❌ ${errorMsg}` }]);
    } finally {
      setLoading(false);
      setStreamingText("");
      abortRef.current = null;
    }
  };

  const handleReset = () => {
    resetInteractiveParams();
    setActiveSessionId(null);
    setMessages([]);
    setStreamingText("");
    setInput("");
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setLoading(false);
  };

  // Face/Palm photo OCR handler
  const handleFaceOCR = useCallback(async (imageId: string) => {
    const img = faceImages.find((i) => i.id === imageId);
    if (!img || !img.base64 || img.ocrLoading) return;

    setFaceImages((prev) => prev.map((i) => i.id === imageId ? { ...i, ocrLoading: true } : i));

    try {
      const mode = faceReadingType === "palm" ? "palm" : "face";
      const res = await apiFetch("/api/ocr", {
        method: "POST",
        body: JSON.stringify({ image: img.base64, mode }),
      });

      if (!res.ok) throw new Error("图片分析失败");

      const data = await res.json();
      const ocrText = data.text || "";

      setFaceImages((prev) => prev.map((i) => i.id === imageId ? { ...i, ocrText, ocrLoading: false } : i));

      if (ocrText) {
        setFaceOcrResult((prev) => prev ? prev + "\n\n" + ocrText : ocrText);
        // Auto-fill input with face description
        setInput((prev) => {
          if (prev.trim()) return prev;
          return `【照片分析描述】\n${ocrText}\n\n请根据以上面部/手掌特征进行详细分析。`;
        });
      }
    } catch {
      setFaceImages((prev) => prev.map((i) => i.id === imageId ? { ...i, ocrLoading: false } : i));
    }
  }, [faceImages, faceReadingType]);

  // Category selection screen
  if (!selectedCategory) {
    return (
      <div className="flex flex-col h-full">
        <div className="border-b border-zinc-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 shadow-lg shadow-violet-500/10">
              <Compass className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-zinc-100">风水玄学</h1>
              <p className="text-[10px] text-zinc-500">
                传统数术 · 经典义理 · 十二大术数体系 · 仅供参考
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {DIVINATION_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  className={cn(
                    "group relative flex items-start gap-3 rounded-xl border p-4 text-left transition-all duration-300 hover:scale-[1.03] shadow-md",
                    cat.bg,
                    cat.glow
                  )}
                >
                  <div className={cn("absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none", cat.bg)} style={{ filter: "blur(8px)" }} />
                  <div className="relative flex items-start gap-3 z-10">
                    <div className={cn("flex items-center justify-center w-10 h-10 rounded-lg border border-current/10 bg-current/5 shrink-0", cat.color)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">{cat.label}</h3>
                      <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed group-hover:text-zinc-400 transition-colors">
                        {cat.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="max-w-3xl mx-auto mt-6 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <p className="text-[10px] text-zinc-500 leading-relaxed text-center">
              本模块基于中国传统数术文化体系与西方经典神秘学理论，所有解读仅供参考。重大人生决策建议综合多方信息、咨询相关专业人士后审慎判断。
            </p>
          </div>

          {/* Divination History */}
          {divinationRecords.length > 0 && (
            <div className="max-w-3xl mx-auto mt-4">
              <button
                onClick={() => setHistoryOpen(!historyOpen)}
                className="w-full flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  历史问卦记录（{divinationRecords.length}）
                </span>
                {historyOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
              {historyOpen && (
                <div className="mt-2 space-y-2 max-h-80 overflow-y-auto">
                  {divinationRecords.slice(0, 30).map((rec) => {
                    const isExpanded = expandedRecord === rec.id;
                    const catInfo = DIVINATION_CATEGORIES.find((c) => c.id === rec.category);
                    const CatIcon = catInfo?.icon || Compass;
                    return (
                      <div key={rec.id} className="rounded-lg border border-zinc-800 bg-zinc-900/50 overflow-hidden">
                        <div className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-zinc-800/30" onClick={() => setExpandedRecord(isExpanded ? null : rec.id)}>
                          <CatIcon className={cn("h-3.5 w-3.5 shrink-0", catInfo?.color || "text-zinc-400")} />
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] text-zinc-300 truncate">{rec.question}</p>
                            <p className="text-[9px] text-zinc-600">
                              {rec.categoryLabel} · {new Date(rec.createdAt).toLocaleDateString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                              {rec.linkedProfileName && <span className="ml-1 text-violet-400/60">· {rec.linkedProfileName}</span>}
                            </p>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteDivinationRecord(rec.id); }}
                            className="shrink-0 text-zinc-600 hover:text-red-400 transition-colors p-1"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                        {isExpanded && (
                          <div className="border-t border-zinc-800 px-3 py-3">
                            {rec.ritualResult && (
                              <div className="mb-2 rounded-md bg-amber-500/5 border border-amber-500/10 px-3 py-2">
                                <p className="text-[9px] text-amber-400/80 font-medium mb-1">仪式结果</p>
                                <pre className="text-[9px] text-zinc-400 whitespace-pre-wrap font-mono">{rec.ritualResult}</pre>
                              </div>
                            )}
                            <div className="max-h-60 overflow-y-auto">
                              <SectionedMarkdown content={rec.answer} />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* History sidebar */}
      {showHistory && (
        <div className="w-64 border-r border-zinc-800 bg-zinc-950 shrink-0">
          <ChatHistoryPanel
            domain="divination"
            activeSessionId={activeSessionId}
            onSelectSession={handleSelectSession}
            onNewSession={handleNewSession}
            divinationCategory={selectedCategory || undefined}
          />
        </div>
      )}
      <div className="flex flex-col flex-1 min-w-0 h-full">
      {/* Header */}
      <div className="border-b border-zinc-800 px-4 py-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={cn(
                "flex items-center justify-center w-7 h-7 rounded-lg border transition-colors",
                showHistory
                  ? "bg-violet-500/20 border-violet-500/30 text-violet-400"
                  : "bg-violet-500/10 border-violet-500/20 text-violet-400/60 hover:text-violet-400"
              )}
              title="历史会话"
            >
              <History className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => { setSelectedCategory(null); handleReset(); }}
              className="flex items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-colors text-[11px] px-2 py-1 rounded-lg hover:bg-zinc-800"
            >
              ← 返回
            </button>
            {category && (
              <div className="flex items-center gap-2">
                <div className={cn("flex items-center justify-center w-7 h-7 rounded-lg border border-current/10 bg-current/5", category.color)}>
                  <category.icon className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-zinc-200">{category.label}</h2>
                  <p className="text-[9px] text-zinc-600">{category.description}</p>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { const next = !soundMuted; setSoundMuted(next); setMuted(next); }}
              className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
              title={soundMuted ? "开启音效" : "静音"}
            >
              {soundMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </button>
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
            {messages.length > 0 && (
              <button
                onClick={() => {
                  const catLabel = DIVINATION_CATEGORIES.find(c => c.id === selectedCategory)?.label || "占卜";
                  exportChatSessionReport({
                    title: `${catLabel}记录`,
                    subtitle: `${messages.length} 条对话 · ${new Date().toLocaleDateString("zh-CN")}`,
                    messages: messages.map(m => ({ role: m.role === "user" ? "user" as const : "assistant" as const, content: m.content })),
                    disclaimer: "占卜结果仅供参考，不构成任何决策依据。",
                    metadata: { "占卜类型": catLabel },
                  });
                }}
                className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300"
              >
                <FileDown className="h-3 w-3" /> 导出
              </button>
            )}
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300"
            >
              <RotateCcw className="h-3 w-3" /> 重新开始
            </button>
          </div>
        </div>

          {/* Birth info badge (compact, shown when already set) */}
        {(selectedCategory === "bazi" || selectedCategory === "ziwei") && birthDate && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[9px] text-amber-400/70 bg-amber-500/10 border border-amber-500/20 rounded px-2 py-0.5">
              {gender === "male" ? "♂" : gender === "female" ? "♀" : ""}
              {" "}{birthDate} {birthTime || ""}
            </span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {messages.length === 0 && !loading && (
          <div className="space-y-4 max-w-xl mx-auto py-4">
            {category && (
              <div className="text-center mb-2">
                <category.icon className={cn("h-8 w-8 mx-auto mb-2", category.color)} />
                <p className="text-xs text-zinc-400">{language === "en" ? "Complete the setup below, then describe your question" : "请先完成以下设定，再描述你的问题"}</p>
              </div>
            )}

            {/* Yijing: enhanced Bagua octagonal layout with SVG */}
            {selectedCategory === "yijing" && (
              <InteractiveSection title="心选卦象（凭直觉选一个）" step={1}>
                <div className="relative w-56 h-56 sm:w-64 sm:h-64 mx-auto">
                  {/* SVG decorative ring */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r="88" fill="none" stroke="#3f3f46" strokeWidth="0.5" strokeDasharray="4 3" opacity="0.5" />
                    <circle cx="100" cy="100" r="55" fill="none" stroke="#3f3f46" strokeWidth="0.5" strokeDasharray="2 3" opacity="0.3" />
                    {/* Direction labels */}
                    <text x="100" y="10" textAnchor="middle" fill="#71717a" fontSize="7" fontFamily="serif">南</text>
                    <text x="100" y="198" textAnchor="middle" fill="#71717a" fontSize="7" fontFamily="serif">北</text>
                    <text x="194" y="103" textAnchor="end" fill="#71717a" fontSize="7" fontFamily="serif">东</text>
                    <text x="8" y="103" textAnchor="start" fill="#71717a" fontSize="7" fontFamily="serif">西</text>
                  </svg>
                  {/* Center Taiji symbol */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-14 h-14 rounded-full border border-zinc-700/30 bg-gradient-to-b from-zinc-800/60 to-zinc-900/60 flex items-center justify-center text-2xl text-zinc-500 shadow-inner select-none" style={{ textShadow: "0 0 8px rgba(245,158,11,0.15)" }}>
                      ☯
                    </div>
                  </div>
                  {/* 后天八卦 positions */}
                  {[
                    { ...TRIGRAMS[5], x: 50, y: 5,  dir: "南" },
                    { ...TRIGRAMS[3], x: 82, y: 18, dir: "东南" },
                    { ...TRIGRAMS[2], x: 95, y: 50, dir: "东" },
                    { ...TRIGRAMS[6], x: 82, y: 82, dir: "东北" },
                    { ...TRIGRAMS[4], x: 50, y: 95, dir: "北" },
                    { ...TRIGRAMS[0], x: 18, y: 82, dir: "西北" },
                    { ...TRIGRAMS[7], x: 5,  y: 50, dir: "西" },
                    { ...TRIGRAMS[1], x: 18, y: 18, dir: "西南" },
                  ].map((t) => {
                    const active = selectedTrigram === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTrigram(active ? "" : t.id)}
                        className={cn(
                          "absolute flex flex-col items-center rounded-lg border transition-all duration-300 -translate-x-1/2 -translate-y-1/2 w-11 sm:w-12 py-1",
                          active
                            ? "border-amber-500/60 bg-amber-500/15 text-amber-200 shadow-lg shadow-amber-500/20 scale-110 z-10"
                            : "border-zinc-700/40 bg-zinc-900/80 text-zinc-400 hover:border-amber-500/30 hover:bg-zinc-800/60 hover:scale-105"
                        )}
                        style={{ left: `${t.x}%`, top: `${t.y}%` }}
                      >
                        <span className="text-sm sm:text-base leading-none">{t.label.split(" ")[1]}</span>
                        <span className="text-[8px] sm:text-[9px] font-semibold leading-tight mt-0.5">{t.label.split(" ")[0]}</span>
                        <span className="text-[7px] text-zinc-600 leading-none mt-0.5">{t.nature}</span>
                      </button>
                    );
                  })}
                </div>
                {selectedTrigram && (() => {
                  const t = TRIGRAMS.find((tr) => tr.id === selectedTrigram);
                  if (!t) return null;
                  return (
                    <div className="mt-3 text-center rounded-lg bg-amber-500/5 border border-amber-500/15 py-2 px-3">
                      <span className="text-xs text-amber-300">{t.label}</span>
                      <span className="text-[10px] text-zinc-400 ml-2">象{t.nature}，性{t.attr}</span>
                    </div>
                  );
                })()}
              </InteractiveSection>
            )}

            {/* Bazi/Ziwei: birth time centered + bazi display */}
            {(selectedCategory === "bazi" || selectedCategory === "ziwei") && (
              <>
                <div className="rounded-xl border border-amber-500/20 bg-gradient-to-b from-amber-500/5 to-transparent p-5">
                  <div className="text-center mb-4">
                    <Sun className="h-7 w-7 text-amber-400 mx-auto mb-2" />
                    <h3 className="text-sm font-semibold text-amber-200">输入生辰八字</h3>
                    <p className="text-[10px] text-zinc-500 mt-1">
                      {selectedCategory === "bazi" ? "四柱干支推排需要精确的出生时间" : "紫微斗数排盘依赖准确的出生时辰"}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-500 text-center block">出生日期 *</label>
                      <input
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="w-full text-xs rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 px-2.5 py-2 text-center focus:outline-none focus:border-amber-500/50 transition-colors"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-500 text-center block">出生时辰 *</label>
                      <select
                        value={birthTime}
                        onChange={(e) => setBirthTime(e.target.value)}
                        className="w-full text-xs rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 px-2.5 py-2 text-center focus:outline-none focus:border-amber-500/50 transition-colors"
                      >
                        <option value="">请选择</option>
                        <option value="子时(23-01)">子时 23-01</option>
                        <option value="丑时(01-03)">丑时 01-03</option>
                        <option value="寅时(03-05)">寅时 03-05</option>
                        <option value="卯时(05-07)">卯时 05-07</option>
                        <option value="辰时(07-09)">辰时 07-09</option>
                        <option value="巳时(09-11)">巳时 09-11</option>
                        <option value="午时(11-13)">午时 11-13</option>
                        <option value="未时(13-15)">未时 13-15</option>
                        <option value="申时(15-17)">申时 15-17</option>
                        <option value="酉时(17-19)">酉时 17-19</option>
                        <option value="戌时(19-21)">戌时 19-21</option>
                        <option value="亥时(21-23)">亥时 21-23</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-500 text-center block">性别</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value as "male" | "female" | "")}
                        className="w-full text-xs rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 px-2.5 py-2 text-center focus:outline-none focus:border-amber-500/50 transition-colors"
                      >
                        <option value="">请选择</option>
                        <option value="male">男命 ♂</option>
                        <option value="female">女命 ♀</option>
                      </select>
                    </div>
                  </div>
                  {/* Bazi preview */}
                  {birthDate && birthTime && (() => {
                    const bazi = computeBazi(birthDate, birthTime);
                    if (!bazi) return null;
                    return (
                      <div className="mt-4 pt-4 border-t border-amber-500/10">
                        <p className="text-[9px] text-center text-zinc-500 mb-2">系统推算四柱</p>
                        <div className="grid grid-cols-4 gap-2 max-w-xs mx-auto">
                          {(["year", "month", "day", "hour"] as const).map((col) => (
                            <div key={col} className="text-center rounded-lg border border-zinc-700/50 bg-zinc-800/50 py-2 px-1">
                              <p className="text-[8px] text-zinc-600 mb-1">{col === "year" ? "年柱" : col === "month" ? "月柱" : col === "day" ? "日柱" : "时柱"}</p>
                              <p className="text-sm font-bold text-amber-300">{bazi[col].stem}</p>
                              <p className="text-sm font-bold text-amber-400/80">{bazi[col].branch}</p>
                            </div>
                          ))}
                        </div>
                        <p className="text-[8px] text-center text-zinc-600 mt-2 italic">
                          注：此为简化推算，AI将基于精确万年历重新排盘
                        </p>
                      </div>
                    );
                  })()}
                </div>
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
              </>
            )}

            {/* Fengshui: house type, floor, facing direction */}
            {selectedCategory === "fengshui" && (
              <>
                <InteractiveSection title="房屋类型" step={1}>
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
                <InteractiveSection title="楼层" step={2}>
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
                <InteractiveSection title="大门/主窗朝向" step={3}>
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
              <InteractiveSection title="选择牌阵" step={1}>
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
              <InteractiveSection title="关注方位（可选）" step={1}>
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

            {/* Liuyao: question type selection */}
            {selectedCategory === "liuyao" && (
              <InteractiveSection title="占断事项" step={1}>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: "career", label: "求财" },
                    { id: "official", label: "求官" },
                    { id: "marriage", label: "求婚姻" },
                    { id: "health", label: "问疾病" },
                    { id: "travel", label: "问出行" },
                    { id: "lawsuit", label: "问诉讼" },
                    { id: "lost", label: "寻失物" },
                    { id: "exam", label: "问考试" },
                    { id: "general", label: "综合占断" },
                  ].map((item) => (
                    <OptionChip
                      key={item.id}
                      label={item.label}
                      active={questionDomain === item.id}
                      onClick={() => setQuestionDomain(questionDomain === item.id ? "" : item.id)}
                    />
                  ))}
                </div>
              </InteractiveSection>
            )}

            {/* Name: analysis type */}
            {selectedCategory === "name" && (
              <InteractiveSection title="分析类型" step={1}>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: "analyze", label: "姓名详细分析" },
                    { id: "naming", label: "起名/改名建议" },
                    { id: "couple", label: "姓名配对分析" },
                    { id: "business", label: "企业/品牌命名" },
                  ].map((item) => (
                    <OptionChip
                      key={item.id}
                      label={item.label}
                      active={questionDomain === item.id}
                      onClick={() => setQuestionDomain(questionDomain === item.id ? "" : item.id)}
                    />
                  ))}
                </div>
              </InteractiveSection>
            )}

            {/* Qiuqian: question domain */}
            {selectedCategory === "qiuqian" && (
              <InteractiveSection title="求问领域" step={1}>
                <div className="grid grid-cols-4 gap-1.5">
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
            )}

            {/* Cezi: no special pre-interaction needed; ritual handles it */}

            {/* Mianxiang: face/palm reading type and focus */}
            {selectedCategory === "mianxiang" && (
              <>
                <InteractiveSection title="看相类型" step={1}>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: "face", label: "🧑 面相" },
                      { id: "palm", label: "🤚 手相" },
                      { id: "both", label: "🔮 面相+手相" },
                    ].map((item) => (
                      <OptionChip
                        key={item.id}
                        label={item.label}
                        active={faceReadingType === item.id}
                        onClick={() => setFaceReadingType(faceReadingType === item.id ? "" : item.id)}
                      />
                    ))}
                  </div>
                </InteractiveSection>
                <InteractiveSection title="重点关注方向（可选）" step={2}>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: "career", label: "💼 事业运" },
                      { id: "love", label: "💕 感情运" },
                      { id: "wealth", label: "💰 财运" },
                      { id: "health", label: "🏥 健康运" },
                      { id: "general", label: "🌟 综合运势" },
                    ].map((item) => (
                      <OptionChip
                        key={item.id}
                        label={item.label}
                        active={faceAnalysisFocus === item.id}
                        onClick={() => setFaceAnalysisFocus(faceAnalysisFocus === item.id ? "" : item.id)}
                      />
                    ))}
                  </div>
                </InteractiveSection>
              </>
            )}

            {/* Dream: dream type, emotion, frequency */}
            {selectedCategory === "dream" && (
              <>
                <InteractiveSection title="梦境类型" step={1}>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: "normal", label: "🌙 普通梦境" },
                      { id: "nightmare", label: "😱 噩梦" },
                      { id: "lucid", label: "✨ 清醒梦" },
                      { id: "recurring", label: "🔄 反复出现" },
                      { id: "prophetic", label: "🔮 预感/预知" },
                    ].map((item) => (
                      <OptionChip
                        key={item.id}
                        label={item.label}
                        active={dreamType === item.id}
                        onClick={() => setDreamType(dreamType === item.id ? "" : item.id)}
                      />
                    ))}
                  </div>
                </InteractiveSection>
                <InteractiveSection title="梦中主要情绪（可选）" step={2}>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: "fear", label: "😨 恐惧不安" },
                      { id: "joy", label: "😊 喜悦兴奋" },
                      { id: "confusion", label: "😶‍🌫️ 困惑迷茫" },
                      { id: "sadness", label: "😢 伤感失落" },
                      { id: "anxiety", label: "😰 焦虑紧张" },
                      { id: "neutral", label: "😐 平静无感" },
                    ].map((item) => (
                      <OptionChip
                        key={item.id}
                        label={item.label}
                        active={dreamEmotion === item.id}
                        onClick={() => setDreamEmotion(dreamEmotion === item.id ? "" : item.id)}
                      />
                    ))}
                  </div>
                </InteractiveSection>
                <InteractiveSection title="出现频率（可选）" step={3}>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: "once", label: "仅此一次" },
                      { id: "recurring", label: "反复做此梦" },
                      { id: "series", label: "系列连续梦" },
                    ].map((item) => (
                      <OptionChip
                        key={item.id}
                        label={item.label}
                        active={dreamFrequency === item.id}
                        onClick={() => setDreamFrequency(dreamFrequency === item.id ? "" : item.id)}
                      />
                    ))}
                  </div>
                </InteractiveSection>
              </>
            )}

            {/* Quick prompts */}
            <div className="pt-2 border-t border-zinc-800/50">
              <p className="text-[10px] text-zinc-600 mb-2">快捷提问：</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedCategory === "yijing" && (
                  <>
                    <QuickPrompt text="请帮我起一卦，分析当前事业发展方向" onSend={setInput} />
                    <QuickPrompt text="近期面临重大抉择，请占卜指引" onSend={setInput} />
                    <QuickPrompt text="我和Ta的感情前景如何" onSend={setInput} />
                  </>
                )}
                {selectedCategory === "fengshui" && (
                  <>
                    <QuickPrompt text="请分析我家客厅的风水格局" onSend={setInput} />
                    <QuickPrompt text="办公桌如何摆放有利于事业运" onSend={setInput} />
                    <QuickPrompt text="卧室床头朝哪个方向最好" onSend={setInput} />
                  </>
                )}
                {selectedCategory === "tarot" && (
                  <>
                    <QuickPrompt text="请为我抽牌解读当前的感情状况" onSend={setInput} />
                    <QuickPrompt text="我的事业接下来会如何发展" onSend={setInput} />
                    <QuickPrompt text="请用凯尔特十字牌阵做全面解读" onSend={setInput} />
                  </>
                )}
                {selectedCategory === "bazi" && (
                  <>
                    <QuickPrompt text="请排出我的八字并详细分析命格" onSend={setInput} />
                    <QuickPrompt text="今年的流年运势如何" onSend={setInput} />
                    <QuickPrompt text="我适合从事什么行业" onSend={setInput} />
                  </>
                )}
                {selectedCategory === "ziwei" && (
                  <>
                    <QuickPrompt text="请排出我的紫微命盘并逐宫解读" onSend={setInput} />
                    <QuickPrompt text="我的事业宫和财帛宫如何" onSend={setInput} />
                    <QuickPrompt text="当前大限运势重点是什么" onSend={setInput} />
                  </>
                )}
                {selectedCategory === "qimen" && (
                  <>
                    <QuickPrompt text="今日出行哪个方位最佳" onSend={setInput} />
                    <QuickPrompt text="近期想做一件重要的事，请择吉" onSend={setInput} />
                    <QuickPrompt text="开业选址哪个方位最好" onSend={setInput} />
                  </>
                )}
                {selectedCategory === "liuyao" && (
                  <>
                    <QuickPrompt text="请帮我摇一卦，问近期财运" onSend={setInput} />
                    <QuickPrompt text="这件事能否成功，请占一卦" onSend={setInput} />
                    <QuickPrompt text="和对方的合作前景如何" onSend={setInput} />
                  </>
                )}
                {selectedCategory === "name" && (
                  <>
                    <QuickPrompt text="请详细分析我的名字" onSend={setInput} />
                    <QuickPrompt text="请帮我的孩子起一个好名字" onSend={setInput} />
                    <QuickPrompt text="这个名字的五格数理吉凶如何" onSend={setInput} />
                  </>
                )}
                {selectedCategory === "qiuqian" && (
                  <>
                    <QuickPrompt text="请详细解读这支签的含义" onSend={setInput} />
                    <QuickPrompt text="我最近事业不顺，此签有何指引" onSend={setInput} />
                    <QuickPrompt text="感情方面有困惑，签意如何" onSend={setInput} />
                  </>
                )}
                {selectedCategory === "cezi" && (
                  <>
                    <QuickPrompt text="请详细解析这个字的吉凶含义" onSend={setInput} />
                    <QuickPrompt text="我想问近期事业，请拆字分析" onSend={setInput} />
                    <QuickPrompt text="此字对感情运势有何暗示" onSend={setInput} />
                  </>
                )}
                {selectedCategory === "mianxiang" && (
                  <>
                    <QuickPrompt text="我圆脸、额头饱满、眉毛浓密、鼻梁高挺、嘴唇偏厚，眉间有一颗小痣，请分析面相" onSend={setInput} />
                    <QuickPrompt text="右手生命线长且深、感情线延伸到食指下方、智慧线和生命线起点相连、有明显的事业线" onSend={setInput} />
                    <QuickPrompt text="我国字脸、三停均匀、耳垂较大、眼睛细长、法令纹明显，请综合分析运势" onSend={setInput} />
                  </>
                )}
                {selectedCategory === "dream" && (
                  <>
                    <QuickPrompt text="我梦到自己在飞，飞得很高很自由" onSend={setInput} />
                    <QuickPrompt text="我梦见牙齿掉了好几颗，这是什么意思" onSend={setInput} />
                    <QuickPrompt text="昨晚梦见已故的亲人和我说话" onSend={setInput} />
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Ritual simulation area - stays visible after completion */}
        {selectedCategory === "liuyao" && (
          <div className="mb-3">
            <CoinTossRitual
              key={ritualKey}
              onComplete={(_lines, summary) => {
                setRitualResult(summary);
                setRitualCompleted(true);
              }}
            />
          </div>
        )}

        {selectedCategory === "tarot" && (
          <div className="mb-3">
            <TarotDrawRitual
              key={ritualKey}
              spread={selectedSpread || "three"}
              onComplete={(_cards, summary) => {
                setRitualResult(summary);
                setRitualCompleted(true);
              }}
            />
          </div>
        )}

        {selectedCategory === "qimen" && (
          <div className="mb-3">
            <QimenRitual
              key={ritualKey}
              onComplete={(summary) => {
                setRitualResult(summary);
                setRitualCompleted(true);
              }}
            />
          </div>
        )}

        {selectedCategory === "qiuqian" && (
          <div className="mb-3">
            <FortuneStickRitual
              key={ritualKey}
              onComplete={(_num, summary) => {
                setRitualResult(summary);
                setRitualCompleted(true);
              }}
            />
          </div>
        )}

        {selectedCategory === "cezi" && (
          <div className="mb-3">
            <CharacterWriteRitual
              key={ritualKey}
              onComplete={(_char, summary) => {
                setRitualResult(summary);
                setRitualCompleted(true);
              }}
            />
          </div>
        )}

        {/* Mianxiang: Text description guide for face/palm reading */}
        {selectedCategory === "mianxiang" && messages.length === 0 && (
          <div className="mb-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-rose-400" />
              <span className="text-xs font-medium text-rose-300">面相/手相特征描述</span>
              <span className="text-[9px] text-zinc-500">请尽可能详细地描述，AI将根据文字分析</span>
            </div>
            {faceReadingType !== "palm" && (
              <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/50 p-3 space-y-1.5">
                <p className="text-[10px] text-rose-300 font-medium">面相描述参考要点：</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[9px] text-zinc-500">
                  <span>• 脸型（圆/方/长/瓜子/国字）</span>
                  <span>• 额头（宽窄/高低/饱满程度）</span>
                  <span>• 眉毛（浓淡/长短/形状/间距）</span>
                  <span>• 眼睛（大小/单双/眼距/眼尾）</span>
                  <span>• 鼻子（高低/大小/鼻翼/鼻梁）</span>
                  <span>• 嘴巴（大小/唇厚薄/唇色）</span>
                  <span>• 耳朵（大小/耳垂/耳廓形态）</span>
                  <span>• 下巴（尖圆/长短/有无双下巴）</span>
                  <span>• 法令纹（深浅/长短/是否明显）</span>
                  <span>• 痣的位置（如眉间/鼻尖/嘴角等）</span>
                  <span>• 皮肤（肤色/光泽/纹路）</span>
                  <span>• 三停比例（上中下是否均匀）</span>
                </div>
              </div>
            )}
            {faceReadingType !== "face" && (
              <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/50 p-3 space-y-1.5">
                <p className="text-[10px] text-rose-300 font-medium">手相描述参考要点：</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[9px] text-zinc-500">
                  <span>• 左手/右手（右手为主，左手为辅）</span>
                  <span>• 生命线（长短/深浅/弧度/分叉）</span>
                  <span>• 智慧线（长短/走向/是否分叉）</span>
                  <span>• 感情线（长短/弯曲/起止位置）</span>
                  <span>• 事业线（有无/深浅/起点位置）</span>
                  <span>• 婚姻线（条数/长短/深浅）</span>
                  <span>• 太阳线（有无/长短/清晰度）</span>
                  <span>• 手指（长短/粗细/指节/指甲形状）</span>
                  <span>• 手掌（厚薄/软硬/掌色/掌丘饱满度）</span>
                  <span>• 特殊纹路（岛纹/十字纹/星纹等）</span>
                </div>
              </div>
            )}
            <div className="rounded-lg bg-zinc-800/30 px-3 py-2">
              <p className="text-[9px] text-zinc-500 leading-relaxed">
                提示：不必全部描述，描述越详细分析越准确。可以在下方输入框中直接描述特征，也可以先选好看相类型和关注方向后再输入。
              </p>
            </div>
          </div>
        )}

        <div className="max-w-3xl mx-auto w-full">
        {messages.map((msg, i) => (
          <div key={i} className="mb-4">
            {msg.role === "user" ? (
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-xl bg-violet-500/10 border border-violet-500/20 px-4 py-3">
                  {msg.images && msg.images.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {msg.images.map((img, imgIdx) => (
                        <div key={imgIdx} className="relative group/img">
                          <img
                            src={img}
                            alt={`attachment ${imgIdx + 1}`}
                            className="h-16 w-16 object-cover rounded-lg border border-violet-500/30 cursor-pointer hover:border-violet-400/60 transition-all"
                            onClick={() => window.open(img, "_blank")}
                          />
                          <div className="absolute inset-0 rounded-lg bg-black/0 group-hover/img:bg-black/20 transition-all flex items-center justify-center">
                            <Eye className="h-3 w-3 text-white opacity-0 group-hover/img:opacity-80 transition-opacity" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-violet-200 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-zinc-800/40 border border-zinc-700/40 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-700/30 bg-zinc-800/60">
                  {category && <category.icon className={cn("h-3.5 w-3.5", category.color)} />}
                  <span className="text-[10px] font-medium text-zinc-400">{category?.label || "解读"} · AI 解析</span>
                </div>
                <div className="px-5 py-4">
                  <SectionedMarkdown content={msg.content} />
                </div>
                <div className="flex justify-end px-4 py-1.5 border-t border-zinc-700/30">
                  <ResponseFeedback messageId={`div_${i}`} module="divination" responseSnippet={msg.content} compact />
                </div>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="mb-4">
            <div className="rounded-xl bg-zinc-800/40 border border-zinc-700/40 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-700/30 bg-zinc-800/60">
                {category && <category.icon className={cn("h-3.5 w-3.5 animate-pulse", category.color)} />}
                <span className="text-[10px] font-medium text-zinc-400">{category?.label || "解读"} · 推演中...</span>
              </div>
              <div className="px-5 py-8">
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500/20 to-amber-500/20 flex items-center justify-center">
                      <Sparkles className="h-7 w-7 text-amber-400 animate-pulse" />
                    </div>
                    <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-violet-500/10 to-amber-500/10 animate-ping opacity-20" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-medium text-zinc-300">
                      {language === "en" ? "Interpreting the signs..." : "正在推演解读中..."}
                    </p>
                    {streamingText && Number(streamingText) > 0 && (
                      <p className="text-[10px] text-zinc-500 mt-1">
                        {language === "en" ? `Generated ${Number(streamingText).toLocaleString()} chars` : `已生成 ${Number(streamingText).toLocaleString()} 字符`}
                      </p>
                    )}
                  </div>
                  <div className="w-40 h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-violet-500 to-amber-500 rounded-full" style={{ width: "100%", animation: "divShimmer 1.5s ease-in-out infinite" }} />
                  </div>
                  <button
                    onClick={() => { abortRef.current?.abort(); setLoading(false); }}
                    className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors px-3 py-1 rounded border border-zinc-800 hover:border-zinc-600"
                  >
                    {language === "en" ? "Cancel" : "取消生成"}
                  </button>
                </div>
              </div>
              <style jsx>{`
                @keyframes divShimmer {
                  0% { opacity: 0.4; transform: translateX(-100%); }
                  50% { opacity: 1; transform: translateX(0); }
                  100% { opacity: 0.4; transform: translateX(100%); }
                }
              `}</style>
            </div>
          </div>
        )}
        </div>

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-zinc-800 p-3 shrink-0 space-y-2">
        {ritualCompleted && messages.length === 0 && (
          <div className="flex items-center gap-2 px-2">
            <Check className="h-3 w-3 text-emerald-400 shrink-0" />
            <span className="text-[10px] text-emerald-400/80">
              {selectedCategory === "tarot" ? "牌阵已就绪" : selectedCategory === "qimen" ? "盘局已起" : selectedCategory === "qiuqian" ? "签文已出" : selectedCategory === "cezi" ? "字已定" : "卦象已成"} — 请输入您的问题，结果将一并提交解读
            </span>
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={ritualCompleted && messages.length === 0 ? (language === "en" ? "Describe your specific question..." : "请描述您想问的具体问题...") : (language === "en" ? "Describe your question..." : "描述你的问题...")}
            className={cn(
              "flex-1 rounded-lg border bg-zinc-800/80 px-3 py-2 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none transition-colors",
              ritualCompleted && messages.length === 0
                ? "border-emerald-500/30 focus:border-emerald-500/50"
                : "border-zinc-700 focus:border-violet-500/50"
            )}
          />
          {/* VoiceInputButton hidden — feature pending */}
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-all",
              !input.trim() || loading
                ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                : category
                  ? `bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-500 hover:to-purple-500 shadow-lg shadow-violet-500/10`
                  : "bg-violet-600 text-white hover:bg-violet-500"
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
