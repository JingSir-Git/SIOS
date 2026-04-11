"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Sparkles, RotateCcw } from "lucide-react";

// ============================================================
// 1. Coin Toss Ritual (六爻 / 周易)
// ============================================================
// Simulates 3 coin tosses per line × 6 lines = 18 total coins
// Each line: 3 coins → sum determines yin/yang/changing

interface CoinResult {
  coins: [number, number, number]; // 0 = tails(阴), 1 = heads(阳)
  sum: number; // 2..4
  type: "old_yin" | "young_yang" | "young_yin" | "old_yang";
  symbol: string;
  label: string;
}

const COIN_TYPE_MAP: Record<number, Pick<CoinResult, "type" | "symbol" | "label">> = {
  6: { type: "old_yin", symbol: "▅▅ ▅▅ ×", label: "老阴(动)" },
  7: { type: "young_yang", symbol: "▅▅▅▅▅", label: "少阳" },
  8: { type: "young_yin", symbol: "▅▅ ▅▅", label: "少阴" },
  9: { type: "old_yang", symbol: "▅▅▅▅▅ ○", label: "老阳(动)" },
};

function tossCoin(): number {
  return Math.random() < 0.5 ? 2 : 3; // 2=阴面(背), 3=阳面(字)
}

export function CoinTossRitual({
  onComplete,
}: {
  onComplete: (lines: CoinResult[], summary: string) => void;
}) {
  const [lines, setLines] = useState<CoinResult[]>([]);
  const [tossing, setTossing] = useState(false);
  const [currentLine, setCurrentLine] = useState(0);
  const [animCoins, setAnimCoins] = useState<[number, number, number] | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tossOneLine = useCallback(() => {
    setTossing(true);
    let flips = 0;
    const maxFlips = 16 + Math.floor(Math.random() * 7);

    intervalRef.current = setInterval(() => {
      flips++;
      setAnimCoins([
        Math.random() < 0.5 ? 2 : 3,
        Math.random() < 0.5 ? 2 : 3,
        Math.random() < 0.5 ? 2 : 3,
      ]);

      if (flips >= maxFlips) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        // Brief settling pause before showing final result
        const c1 = tossCoin(), c2 = tossCoin(), c3 = tossCoin();
        const finalCoins: [number, number, number] = [c1, c2, c3];
        setAnimCoins(finalCoins);
        setTimeout(() => {
          const sum = c1 + c2 + c3;
          const info = COIN_TYPE_MAP[sum];
          const result: CoinResult = {
            coins: finalCoins,
            sum,
            ...info,
          };
          setAnimCoins(null);
          setLines((prev) => [...prev, result]);
          setCurrentLine((prev) => prev + 1);
          setTossing(false);
        }, 800);
      }
    }, 200);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (lines.length === 6) {
      const yaoNames = ["初爻", "二爻", "三爻", "四爻", "五爻", "上爻"];
      const summary = lines
        .map((l, i) => `${yaoNames[i]}：${l.label} (${l.coins.map(c => c === 3 ? "字" : "背").join("")}，和=${l.sum})`)
        .join("\n");
      const movingYao = lines.filter(l => l.type === "old_yin" || l.type === "old_yang");
      const movingInfo = movingYao.length > 0
        ? `\n动爻${movingYao.length}个`
        : "\n无动爻（六爻皆静）";
      onComplete(lines, `摇卦结果（从初爻到上爻）：\n${summary}${movingInfo}`);
    }
  }, [lines, onComplete]);

  const handleReset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setLines([]);
    setCurrentLine(0);
    setTossing(false);
    setAnimCoins(null);
  };

  const LINE_NAMES = ["初爻", "二爻", "三爻", "四爻", "五爻", "上爻"];

  return (
    <div className="rounded-xl border border-amber-500/20 bg-gradient-to-b from-amber-500/5 to-transparent p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" /> 铜钱摇卦
        </h3>
        {lines.length > 0 && lines.length < 6 && (
          <button onClick={handleReset} className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1">
            <RotateCcw className="h-3 w-3" /> 重摇
          </button>
        )}
      </div>

      <p className="text-[10px] text-zinc-500 mb-3">
        模拟三枚铜钱摇卦，共需摇六次。每次三枚铜钱落下得一爻。
      </p>

      {/* Hexagram display (bottom to top) */}
      <div className="space-y-1 mb-3">
        {[...Array(6)].map((_, idx) => {
          const lineIdx = 5 - idx; // Display top to bottom = 上爻 to 初爻
          const line = lines[lineIdx];
          const isNext = lineIdx === currentLine && !tossing;
          return (
            <div key={lineIdx} className="flex items-center gap-3">
              <span className="text-[10px] text-zinc-600 w-8 text-right shrink-0">{LINE_NAMES[lineIdx]}</span>
              {line ? (
                <div className="flex items-center gap-2 flex-1">
                  <span className={cn(
                    "font-mono text-sm tracking-widest",
                    (line.type === "old_yin" || line.type === "old_yang") ? "text-amber-400" : "text-zinc-400"
                  )}>
                    {line.symbol}
                  </span>
                  <span className="text-[10px] text-zinc-500">{line.label}</span>
                  <span className="text-[10px] text-zinc-600">
                    ({line.coins.map(c => c === 3 ? "字" : "背").join(" ")})
                  </span>
                </div>
              ) : lineIdx === currentLine && tossing && animCoins ? (
                <div className="flex items-center gap-2 flex-1">
                  <div className="flex gap-1.5">
                    {animCoins.map((c, ci) => (
                      <div
                        key={ci}
                        className={cn(
                          "w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-all duration-75",
                          c === 3
                            ? "border-amber-500 bg-amber-500/20 text-amber-300"
                            : "border-zinc-600 bg-zinc-800 text-zinc-500"
                        )}
                      >
                        {c === 3 ? "字" : "背"}
                      </div>
                    ))}
                  </div>
                  <span className="text-[10px] text-amber-400 animate-pulse">摇卦中...</span>
                </div>
              ) : (
                <div className={cn(
                  "flex-1 h-6 rounded bg-zinc-800/30 border border-dashed",
                  isNext ? "border-amber-500/40" : "border-zinc-800"
                )} />
              )}
            </div>
          );
        })}
      </div>

      {/* Action */}
      {lines.length < 6 && (
        <button
          onClick={tossOneLine}
          disabled={tossing}
          className={cn(
            "w-full rounded-lg py-2.5 text-xs font-medium transition-all",
            tossing
              ? "bg-amber-500/10 text-amber-400 animate-pulse cursor-wait"
              : "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30"
          )}
        >
          {tossing ? "铜钱翻转中..." : lines.length === 0 ? "开始摇卦（第一爻）" : `摇第${lines.length + 1}爻（${LINE_NAMES[lines.length]}）`}
        </button>
      )}

      {lines.length === 6 && (
        <div className="text-center">
          <p className="text-[10px] text-emerald-400 font-medium">✓ 六爻已成，卦象已定</p>
          <p className="text-[10px] text-zinc-500 mt-1">摇卦结果将自动附加到您的提问中</p>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 2. Tarot Card Draw Ritual
// ============================================================

// Major Arcana with roman numerals and symbolic glyphs
const MAJOR_ARCANA: { name: string; num: string; glyph: string }[] = [
  { name: "愚者",     num: "0",    glyph: "🃏" },
  { name: "魔术师",   num: "I",    glyph: "✧" },
  { name: "女祭司",   num: "II",   glyph: "☽" },
  { name: "女皇",     num: "III",  glyph: "♀" },
  { name: "皇帝",     num: "IV",   glyph: "♔" },
  { name: "教皇",     num: "V",    glyph: "☩" },
  { name: "恋人",     num: "VI",   glyph: "♡" },
  { name: "战车",     num: "VII",  glyph: "⚔" },
  { name: "力量",     num: "VIII", glyph: "∞" },
  { name: "隐者",     num: "IX",   glyph: "☆" },
  { name: "命运之轮", num: "X",    glyph: "☸" },
  { name: "正义",     num: "XI",   glyph: "⚖" },
  { name: "倒吊人",   num: "XII",  glyph: "⚓" },
  { name: "死神",     num: "XIII", glyph: "☠" },
  { name: "节制",     num: "XIV",  glyph: "⚗" },
  { name: "恶魔",     num: "XV",   glyph: "⛧" },
  { name: "塔",       num: "XVI",  glyph: "⚡" },
  { name: "星星",     num: "XVII", glyph: "✦" },
  { name: "月亮",     num: "XVIII",glyph: "☾" },
  { name: "太阳",     num: "XIX",  glyph: "☀" },
  { name: "审判",     num: "XX",   glyph: "♆" },
  { name: "世界",     num: "XXI",  glyph: "⊕" },
];

const SUIT_GLYPHS: Record<string, string> = {
  "权杖": "♣",
  "圣杯": "♥",
  "宝剑": "♠",
  "星币": "♦",
};
const SUIT_COLORS: Record<string, string> = {
  "权杖": "text-orange-400",
  "圣杯": "text-blue-400",
  "宝剑": "text-slate-300",
  "星币": "text-yellow-400",
};

const MINOR_SUITS = ["权杖", "圣杯", "宝剑", "星币"];
const MINOR_NUMBERS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "侍从", "骑士", "王后", "国王"];

interface CardInfo {
  displayName: string;
  glyph: string;
  numLabel: string;
  colorClass: string;
  isMajor: boolean;
}

function getAllCards(): CardInfo[] {
  const cards: CardInfo[] = MAJOR_ARCANA.map(c => ({
    displayName: c.name,
    glyph: c.glyph,
    numLabel: c.num,
    colorClass: "text-purple-300",
    isMajor: true,
  }));
  for (const suit of MINOR_SUITS) {
    for (const num of MINOR_NUMBERS) {
      cards.push({
        displayName: `${suit}${num}`,
        glyph: SUIT_GLYPHS[suit],
        numLabel: num,
        colorClass: SUIT_COLORS[suit],
        isMajor: false,
      });
    }
  }
  return cards;
}

interface TarotCard {
  name: string;
  reversed: boolean;
  position: string;
  glyph: string;
  numLabel: string;
  colorClass: string;
  isMajor: boolean;
}

const SPREAD_POSITIONS: Record<string, string[]> = {
  single: ["当前状况"],
  three: ["过去", "现在", "未来"],
  celtic: [
    "当前状况", "阻碍/挑战", "意识层面", "潜意识层面",
    "近期过去", "近期未来", "自我认知", "外在环境",
    "希望与恐惧", "最终结果",
  ],
  relationship: ["自己", "对方", "关系本质", "过去影响", "现在状态", "未来走向"],
  horseshoe: ["过去影响", "现在状况", "隐藏因素", "建议行动", "周围环境", "期望", "最终结果"],
};

export function TarotDrawRitual({
  spread = "three",
  onComplete,
}: {
  spread?: string;
  onComplete: (cards: TarotCard[], summary: string) => void;
}) {
  const positions = SPREAD_POSITIONS[spread] || SPREAD_POSITIONS.three;
  const totalCards = positions.length;
  const [drawnCards, setDrawnCards] = useState<TarotCard[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [shuffling, setShuffling] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [deck] = useState(() => getAllCards());

  const handleShuffle = () => {
    setShuffling(true);
    setTimeout(() => {
      setShuffling(false);
      setShuffled(true);
    }, 3500);
  };

  const drawOneCard = useCallback(() => {
    if (drawnCards.length >= totalCards) return;
    setDrawing(true);

    setTimeout(() => {
      const usedNames = new Set(drawnCards.map(c => c.name));
      const available = deck.filter(c => !usedNames.has(c.displayName));
      const cardInfo = available[Math.floor(Math.random() * available.length)];
      const reversed = Math.random() < 0.35;
      const position = positions[drawnCards.length];
      const newCard: TarotCard = {
        name: cardInfo.displayName,
        reversed,
        position,
        glyph: cardInfo.glyph,
        numLabel: cardInfo.numLabel,
        colorClass: cardInfo.colorClass,
        isMajor: cardInfo.isMajor,
      };
      setDrawnCards((prev) => [...prev, newCard]);
      setDrawing(false);
    }, 1800);
  }, [drawnCards, totalCards, deck, positions]);

  useEffect(() => {
    if (drawnCards.length === totalCards && totalCards > 0) {
      const summary = drawnCards
        .map((c) => `${c.position}：${c.name}（${c.reversed ? "逆位" : "正位"}）`)
        .join("\n");
      onComplete(drawnCards, `塔罗抽牌结果：\n${summary}`);
    }
  }, [drawnCards, totalCards, onComplete]);

  return (
    <div className="rounded-xl border border-pink-500/20 bg-gradient-to-b from-pink-500/5 to-transparent p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-pink-300 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" /> 塔罗抽牌
        </h3>
        <span className="text-[10px] text-zinc-500">
          {SPREAD_POSITIONS[spread] ? `${positions.length}张牌阵` : "三牌阵"}
        </span>
      </div>

      {!shuffled ? (
        <div className="text-center py-4">
          <div className={cn("inline-flex gap-1.5 mb-4", shuffling && "animate-pulse")}>
            {[...Array(7)].map((_, i) => (
              <div key={i} className={cn("w-5 h-8 rounded-sm border bg-gradient-to-b transition-all", shuffling ? "border-pink-500/50 from-purple-900/60 to-pink-900/60" : "border-zinc-700 from-zinc-800 to-zinc-900")} style={shuffling ? { transform: `rotate(${(i-3)*12}deg) translateY(${Math.sin(i*1.2)*6}px)`, transition: `all ${0.4+i*0.06}s ease` } : {}}>
                {!shuffling && <div className="w-full h-full flex items-center justify-center text-[7px] text-zinc-600">✦</div>}
              </div>
            ))}
          </div>
          <p className="text-[10px] text-zinc-500 mb-3">{shuffling ? "牌正在洗牌中，请静心冥想你的问题..." : "请先洗牌，心中默念你想问的问题"}</p>
          <button onClick={handleShuffle} disabled={shuffling} className={cn("rounded-lg px-6 py-2 text-xs font-medium transition-all", shuffling ? "bg-pink-500/10 text-pink-400 animate-pulse cursor-wait" : "bg-pink-500/20 text-pink-300 hover:bg-pink-500/30 border border-pink-500/30")}>{shuffling ? "洗牌中..." : "开始洗牌"}</button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap justify-center gap-2.5 mb-3">
            {positions.map((pos, idx) => {
              const card = drawnCards[idx];
              const isNext = idx === drawnCards.length && !drawing;
              const isDrawing = drawing && idx === drawnCards.length;
              const cw = totalCards <= 3 ? 72 : totalCards <= 6 ? 58 : 50;
              return (
                <div key={idx} className="flex flex-col items-center gap-1" style={{ width: cw }}>
                  <div className={cn("w-full rounded-md border overflow-hidden transition-all duration-500 relative", card ? (card.reversed ? "border-red-500/40 bg-gradient-to-b from-red-950/80 to-purple-950/80" : "border-pink-500/40 bg-gradient-to-b from-purple-950/80 to-indigo-950/80") : isNext ? "border-pink-500/30 bg-zinc-800/60 cursor-pointer hover:border-pink-500/50" : isDrawing ? "border-pink-500/50 bg-pink-500/5 animate-pulse" : "border-zinc-800 bg-zinc-900/40")} style={{ aspectRatio: "5/8" }}>
                    {card ? (
                      <div className={cn("w-full h-full flex flex-col items-center justify-between py-1.5 px-1", card.reversed && "rotate-180")}>
                        <span className={cn("text-[7px] font-mono self-start pl-0.5 opacity-60", card.colorClass)}>{card.numLabel}</span>
                        <span className={cn("text-lg leading-none", card.colorClass)}>{card.glyph}</span>
                        <div className="text-center">
                          <p className={cn("text-[7px] font-medium leading-tight", card.isMajor ? "text-purple-200" : card.colorClass)}>{card.name}</p>
                          <p className={cn("text-[6px] mt-px font-medium", card.reversed ? "text-red-400" : "text-emerald-400/70")}>{card.reversed ? "逆位 ↓" : "正位 ↑"}</p>
                        </div>
                      </div>
                    ) : isDrawing ? (
                      <div className="w-full h-full flex items-center justify-center"><span className="text-sm text-pink-400 animate-spin">✦</span></div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-0.5"><span className="text-[9px] text-zinc-700">{idx+1}</span><div className="w-2.5 h-2.5 rounded-full border border-dashed border-zinc-700" /></div>
                    )}
                    {card && <><div className="absolute top-0.5 right-0.5 text-[5px] opacity-25 text-pink-300">✦</div><div className="absolute bottom-0.5 left-0.5 text-[5px] opacity-25 text-pink-300 rotate-180">✦</div></>}
                  </div>
                  <span className="text-[7px] text-zinc-500 text-center leading-tight">{pos}</span>
                </div>
              );
            })}
          </div>
          {drawnCards.length < totalCards && (
            <button onClick={drawOneCard} disabled={drawing} className={cn("w-full rounded-lg py-2.5 text-xs font-medium transition-all", drawing ? "bg-pink-500/10 text-pink-400 animate-pulse cursor-wait" : "bg-pink-500/20 text-pink-300 hover:bg-pink-500/30 border border-pink-500/30")}>{drawing ? "翻牌中..." : `抽第${drawnCards.length+1}张牌 — ${positions[drawnCards.length]}`}</button>
          )}
          {drawnCards.length === totalCards && (
            <div className="text-center">
              <p className="text-[10px] text-emerald-400 font-medium">✓ 牌阵已成，{totalCards}张牌全部揭示</p>
              <p className="text-[10px] text-zinc-500 mt-1">抽牌结果将自动附加到您的提问中</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ============================================================
// 3. Qimen Time-based Ritual 
// ============================================================

export function QimenRitual({
  onComplete,
}: {
  onComplete: (summary: string) => void;
}) {
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const [revealStep, setRevealStep] = useState(0);

  const calculate = () => {
    setCalculating(true);
    setTimeout(() => {
      const now = new Date();
      const tiangan = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
      const dizhi = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
      const jieqi = ["冬至", "小寒", "大寒", "立春", "雨水", "惊蛰", "春分", "清明", "谷雨", "立夏", "小满", "芒种", "夏至", "小暑", "大暑", "立秋", "处暑", "白露", "秋分", "寒露", "霜降", "立冬", "小雪", "大雪"];
      const hourIdx = Math.floor(((now.getHours() + 1) % 24) / 2);
      const dayTG = tiangan[(now.getDate() + 3) % 10];
      const dayDZ = dizhi[(now.getDate() + 1) % 12];
      const hourDZ = dizhi[hourIdx];
      const month = now.getMonth();
      const isYangDun = month >= 2 && month <= 7;
      const juNum = Math.floor(Math.random() * 9) + 1;
      const currentJQ = jieqi[month * 2] || "未知";

      const summaryLines = [
        `起局时间：${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${now.getHours()}时${now.getMinutes()}分`,
        `日干支：${dayTG}${dayDZ}日`,
        `时辰：${hourDZ}时`,
        `节气：${currentJQ}`,
        `遁法：${isYangDun ? "阳遁" : "阴遁"}${juNum}局`,
      ];
      // Staged reveal: show lines one at a time
      setCalculating(false);
      summaryLines.forEach((_, i) => {
        setTimeout(() => {
          setRevealStep(i + 1);
          setResult(summaryLines.slice(0, i + 1).join("\n"));
          if (i === summaryLines.length - 1) {
            onComplete(summaryLines.join("\n"));
          }
        }, i * 600);
      });
    }, 2500);
  };

  return (
    <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-b from-cyan-500/5 to-transparent p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" /> 奇门起局
        </h3>
      </div>

      {!result && !calculating ? (
        <>
          <p className="text-[10px] text-zinc-500 mb-3">
            基于当前时间自动排出奇门遁甲盘局
          </p>
          <button
            onClick={calculate}
            disabled={calculating}
            className="w-full rounded-lg py-2.5 text-xs font-medium transition-all bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30"
          >
            按当前时间起局
          </button>
        </>
      ) : calculating ? (
        <div className="text-center py-3">
          <div className="inline-flex gap-2 mb-2">
            {["天", "地", "人", "神"].map((c, i) => (
              <span key={i} className="w-8 h-8 rounded-lg border border-cyan-500/40 bg-cyan-500/10 flex items-center justify-center text-[11px] text-cyan-300 font-medium animate-pulse" style={{ animationDelay: `${i * 200}ms` }}>{c}</span>
            ))}
          </div>
          <p className="text-[10px] text-cyan-400 animate-pulse">天盘地盘推演中...</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {result!.split("\n").map((line, i) => (
            <p key={i} className={cn("text-[11px] text-cyan-200/80 transition-all duration-500", i < revealStep ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2")}>{line}</p>
          ))}
          {revealStep >= 5 && <p className="text-[10px] text-zinc-500 mt-2">起局信息将自动附加到您的提问中</p>}
        </div>
      )}
    </div>
  );
}
