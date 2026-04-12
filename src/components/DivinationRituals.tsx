"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Sparkles, RotateCcw } from "lucide-react";
import { playCoinSound, playCardFlipSound, playRevealSound } from "@/lib/sound-effects";

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
      if (flips % 3 === 0) playCoinSound();
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
      playRevealSound();
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

  // Render a single 大五帝钱 coin: round with square center hole
  const renderCoin = (value: number, size: "sm" | "md" | "lg" = "md", animating = false) => {
    const isYang = value === 3;
    const dims = size === "sm" ? "w-7 h-7" : size === "lg" ? "w-11 h-11" : "w-9 h-9";
    const holeDims = size === "sm" ? "w-2 h-2" : size === "lg" ? "w-3 h-3" : "w-2.5 h-2.5";
    const fontSize = size === "sm" ? "text-[7px]" : size === "lg" ? "text-[10px]" : "text-[8px]";
    const rimText = size === "sm" ? "text-[5px]" : size === "lg" ? "text-[7px]" : "text-[6px]";

    return (
      <div className={cn(
        dims, "rounded-full relative flex items-center justify-center transition-all",
        animating && "animate-spin",
        isYang
          ? "bg-gradient-to-br from-amber-600 via-yellow-500 to-amber-700 shadow-md shadow-amber-500/30"
          : "bg-gradient-to-br from-zinc-500 via-zinc-400 to-zinc-600 shadow-md shadow-zinc-500/20"
      )}>
        {/* Rim ring */}
        <div className={cn(
          "absolute inset-[2px] rounded-full border",
          isYang ? "border-amber-800/40" : "border-zinc-600/40"
        )} />
        {/* Square center hole */}
        <div className={cn(
          holeDims, "rounded-[1px] border",
          isYang
            ? "bg-amber-900/80 border-amber-800/60"
            : "bg-zinc-700/80 border-zinc-600/60"
        )} />
        {/* Top inscription */}
        {size !== "sm" && (
          <span className={cn("absolute font-serif", fontSize,
            isYang ? "text-amber-900/70" : "text-zinc-700/70",
            "top-[2px]"
          )}>
            {isYang ? "通" : "　"}
          </span>
        )}
        {/* Bottom inscription */}
        {size !== "sm" && (
          <span className={cn("absolute font-serif", fontSize,
            isYang ? "text-amber-900/70" : "text-zinc-700/70",
            "bottom-[2px]"
          )}>
            {isYang ? "宝" : "　"}
          </span>
        )}
        {/* Left/Right inscriptions for large */}
        {size === "lg" && (
          <>
            <span className={cn("absolute font-serif left-[3px]", rimText,
              isYang ? "text-amber-900/60" : "text-zinc-700/60"
            )}>
              {isYang ? "开" : ""}
            </span>
            <span className={cn("absolute font-serif right-[3px]", rimText,
              isYang ? "text-amber-900/60" : "text-zinc-700/60"
            )}>
              {isYang ? "元" : ""}
            </span>
          </>
        )}
      </div>
    );
  };

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
        模拟三枚大五帝钱摇卦，共需摇六次。字面(阳)为三，背面(阴)为二。
      </p>

      {/* Hexagram display (bottom to top) */}
      <div className="space-y-1.5 mb-3">
        {[...Array(6)].map((_, idx) => {
          const lineIdx = 5 - idx;
          const line = lines[lineIdx];
          const isNext = lineIdx === currentLine && !tossing;
          return (
            <div key={lineIdx} className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-600 w-8 text-right shrink-0">{LINE_NAMES[lineIdx]}</span>
              {line ? (
                <div className="flex items-center gap-2 flex-1">
                  {/* Show actual coins for completed lines */}
                  <div className="flex gap-1">
                    {line.coins.map((c, ci) => (
                      <div key={ci}>{renderCoin(c, "sm")}</div>
                    ))}
                  </div>
                  <span className={cn(
                    "font-mono text-xs tracking-widest",
                    (line.type === "old_yin" || line.type === "old_yang") ? "text-amber-400" : "text-zinc-400"
                  )}>
                    {line.symbol}
                  </span>
                  <span className="text-[9px] text-zinc-500">{line.label}</span>
                </div>
              ) : lineIdx === currentLine && tossing && animCoins ? (
                <div className="flex items-center gap-2 flex-1">
                  <div className="flex gap-1.5">
                    {animCoins.map((c, ci) => (
                      <div key={ci}>{renderCoin(c, "md", true)}</div>
                    ))}
                  </div>
                  <span className="text-[10px] text-amber-400 animate-pulse">摇卦中...</span>
                </div>
              ) : (
                <div className={cn(
                  "flex-1 h-7 rounded bg-zinc-800/30 border border-dashed",
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

      {lines.length === 6 && (() => {
        const hasMoving = lines.some(l => l.type === "old_yin" || l.type === "old_yang");
        // 本卦 lines
        const benLines = lines.map(l => (l.type === "young_yang" || l.type === "old_yang") ? "yang" : "yin");
        // 变卦 lines (moving lines flip)
        const bianLines = lines.map(l => {
          if (l.type === "old_yang") return "yin";
          if (l.type === "old_yin") return "yang";
          return (l.type === "young_yang") ? "yang" : "yin";
        });
        const renderYao = (type: string, isMoving: boolean) => (
          <div className="flex items-center gap-0.5 justify-center h-3">
            {type === "yang" ? (
              <div className={cn("h-[3px] rounded-full w-full", isMoving ? "bg-amber-400" : "bg-zinc-400")} />
            ) : (
              <>
                <div className={cn("h-[3px] rounded-full flex-1", isMoving ? "bg-amber-400" : "bg-zinc-400")} />
                <div className="w-2" />
                <div className={cn("h-[3px] rounded-full flex-1", isMoving ? "bg-amber-400" : "bg-zinc-400")} />
              </>
            )}
          </div>
        );
        return (
          <div className="space-y-3">
            {/* Visual hexagram */}
            <div className={cn("flex justify-center gap-6", !hasMoving && "gap-0")}>
              <div className="text-center">
                <p className="text-[9px] text-zinc-500 mb-1.5">本卦</p>
                <div className="w-14 space-y-1">
                  {[...benLines].reverse().map((y, i) => {
                    const origIdx = 5 - i;
                    const isM = lines[origIdx].type === "old_yin" || lines[origIdx].type === "old_yang";
                    return <div key={i}>{renderYao(y, isM)}</div>;
                  })}
                </div>
              </div>
              {hasMoving && (
                <>
                  <div className="flex items-center text-zinc-600 text-xs pt-4">→</div>
                  <div className="text-center">
                    <p className="text-[9px] text-zinc-500 mb-1.5">变卦</p>
                    <div className="w-14 space-y-1">
                      {[...bianLines].reverse().map((y, i) => {
                        const origIdx = 5 - i;
                        const isM = lines[origIdx].type === "old_yin" || lines[origIdx].type === "old_yang";
                        return <div key={i}>{renderYao(y, isM)}</div>;
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="text-center">
              <p className="text-[10px] text-emerald-400 font-medium">✓ 六爻已成，卦象已定</p>
              <p className="text-[10px] text-zinc-500 mt-1">摇卦结果将自动附加到您的提问中</p>
            </div>
            <button onClick={handleReset} className="w-full rounded-lg py-1.5 text-[10px] text-zinc-500 hover:text-zinc-300 border border-zinc-700/50 hover:border-zinc-600 transition-colors">
              <RotateCcw className="h-3 w-3 inline mr-1" />重新摇卦
            </button>
          </div>
        );
      })()}
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
    playCardFlipSound();
    setTimeout(() => {
      setShuffling(false);
      setShuffled(true);
      playRevealSound();
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
      playCardFlipSound();
      setDrawnCards((prev) => [...prev, newCard]);
      setDrawing(false);
    }, 1800);
  }, [drawnCards, totalCards, deck, positions]);

  useEffect(() => {
    if (drawnCards.length === totalCards && totalCards > 0) {
      const summary = drawnCards
        .map((c) => `${c.position}：${c.name}（${c.reversed ? "逆位" : "正位"}）`)
        .join("\n");
      playRevealSound();
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
            playRevealSound();
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

// ============================================================
// 4. Fortune Stick Ritual (求签)
// ============================================================
// Simulates shaking a bamboo tube of numbered sticks until one falls out

// Sample signs database (观音灵签 excerpts)
const FORTUNE_SIGNS: { num: number; grade: string; gradeColor: string; title: string; poem: string[]; allusion: string }[] = [
  { num: 1, grade: "上上签", gradeColor: "text-emerald-300", title: "开天辟地", poem: ["天开地辟结良缘", "日吉时良万事全", "若得此签非小可", "人行忠正帝王宣"], allusion: "盘古初开天地" },
  { num: 3, grade: "上吉签", gradeColor: "text-emerald-300", title: "董永遇仙", poem: ["衣冠重整旧家风", "道是无穷却有功", "明月清风人意好", "高堂桂子早攀丛"], allusion: "董永卖身葬父遇七仙女" },
  { num: 7, grade: "中吉签", gradeColor: "text-amber-300", title: "苏武牧羊", poem: ["奔波阵阵任浮沉", "心事频频独自吟", "既遇高人开口笑", "功名富贵逼人来"], allusion: "苏武北海牧羊十九年" },
  { num: 11, grade: "中平签", gradeColor: "text-zinc-300", title: "书生遇难", poem: ["谁知苍翠性情乖", "恰似黄金不满怀", "也可安身过日子", "莫将心事绊风雷"], allusion: "古人赶考途中逢雨" },
  { num: 14, grade: "中签", gradeColor: "text-zinc-400", title: "子牙收妖", poem: ["前途功事未为真", "且把心机仔细陈", "若遇鼠牛交接处", "一番声气动乾坤"], allusion: "姜子牙渭水钓鱼" },
  { num: 21, grade: "上吉签", gradeColor: "text-emerald-300", title: "李旦复国", poem: ["阴阳道合总由天", "仕女求之喜自然", "但看春园花与月", "一番雨过一番鲜"], allusion: "唐睿宗李旦复位" },
  { num: 25, grade: "中吉签", gradeColor: "text-amber-300", title: "张骞博望", poem: ["过了忧危事几重", "从今再立旧家风", "田园事业重重好", "生计应须用力工"], allusion: "张骞出使西域归来" },
  { num: 32, grade: "中平签", gradeColor: "text-zinc-300", title: "刘备求贤", poem: ["前程杳杳定无疑", "石中耀火淬金时", "春到凤凰翻羽翼", "临旦黄鸡报晓期"], allusion: "刘备三顾茅庐" },
  { num: 42, grade: "上上签", gradeColor: "text-emerald-300", title: "目莲救母", poem: ["一年作事急如飞", "君尔宽心莫迟疑", "贵人还在千里外", "音信月中渐渐知"], allusion: "目犍连尊者入地狱救母" },
  { num: 51, grade: "中签", gradeColor: "text-zinc-400", title: "孔明借箭", poem: ["夏日初临日正长", "翩翩彩蝶过东墙", "风来梦里精神爽", "一举便登龙虎榜"], allusion: "孔明草船借箭" },
  { num: 58, grade: "下签", gradeColor: "text-red-300", title: "文王遇凶", poem: ["事与心违不自由", "暗中牵绊几时休", "心头会合难成事", "且向江边弄钓舟"], allusion: "周文王困于羑里" },
  { num: 66, grade: "中吉签", gradeColor: "text-amber-300", title: "王昭君", poem: ["一轮明月照天下", "何处知音到九霄", "诸般事务皆成就", "悲欢离合任逍遥"], allusion: "王昭君出塞和亲" },
  { num: 73, grade: "中平签", gradeColor: "text-zinc-300", title: "陶渊明归隐", poem: ["春来雷震百虫鸣", "番身一转离泥中", "始知出入还来往", "一笑时通万事通"], allusion: "陶渊明辞官归田" },
  { num: 81, grade: "上吉签", gradeColor: "text-emerald-300", title: "风送滕王阁", poem: ["梧桐叶落秋将暮", "行客归程去似云", "谢得天公高着力", "一声雷送到龙门"], allusion: "王勃乘风赴滕王阁作序" },
  { num: 88, grade: "下签", gradeColor: "text-red-300", title: "庞涓恃才", poem: ["似鹤飞来自入笼", "心中急切意无穷", "仔细看来须仔细", "门前许多是非生"], allusion: "庞涓恃才害孙膑反遭杀" },
  { num: 93, grade: "中签", gradeColor: "text-zinc-400", title: "高文举中状", poem: ["鸡鸣歌唱晓天开", "忽见明云拨雾来", "且向前途行正道", "一番利益自然财"], allusion: "寒窗苦读金榜题名" },
  { num: 100, grade: "上上签", gradeColor: "text-emerald-300", title: "三教谈经", poem: ["佛神灵通天地间", "愿求签者尽开颜", "若问诸般皆遂意", "花开富贵在眼前"], allusion: "儒释道三教归一" },
];

function pickRandomSign(): typeof FORTUNE_SIGNS[0] {
  const pick = FORTUNE_SIGNS[Math.floor(Math.random() * FORTUNE_SIGNS.length)];
  return { ...pick, num: Math.floor(Math.random() * 100) + 1, title: pick.title, poem: pick.poem, grade: pick.grade, gradeColor: pick.gradeColor, allusion: pick.allusion };
}

export function FortuneStickRitual({
  onComplete,
}: {
  onComplete: (signNumber: number, summary: string) => void;
}) {
  const [phase, setPhase] = useState<"idle" | "shaking" | "falling" | "done">("idle");
  const [shakeCount, setShakeCount] = useState(0);
  const [stickOffset, setStickOffset] = useState(0);
  const [sign, setSign] = useState<typeof FORTUNE_SIGNS[0] | null>(null);
  const [stickAngles, setStickAngles] = useState<number[]>([]);
  const [poemReveal, setPoemReveal] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setStickAngles(Array.from({ length: 12 }, () => -3 + Math.random() * 6));
  }, []);

  const startShaking = useCallback(() => {
    if (phase !== "idle") return;
    setPhase("shaking");
    setShakeCount(0);
    setStickOffset(0);
    setPoemReveal(0);

    let count = 0;
    const maxShakes = 20 + Math.floor(Math.random() * 15);

    intervalRef.current = setInterval(() => {
      count++;
      setShakeCount(count);
      setStickOffset(Math.sin(count * 0.8) * (3 + count * 0.3));
      if (count % 4 === 0) playCoinSound();

      if (count >= maxShakes) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        const picked = pickRandomSign();
        setSign(picked);
        setPhase("falling");
        playRevealSound();

        setTimeout(() => {
          setPhase("done");
          // Reveal poem lines one by one
          let line = 0;
          const revealInterval = setInterval(() => {
            line++;
            setPoemReveal(line);
            if (line >= 4) {
              clearInterval(revealInterval);
              onComplete(picked.num, `【求签结果】观音灵签 第${picked.num}签 · ${picked.grade} ·「${picked.title}」\n签诗：${picked.poem.join("，")}\n典故：${picked.allusion}\n请AI大师为我详细解读此签。`);
            }
          }, 600);
        }, 1500);
      }
    }, 100);
  }, [phase, onComplete]);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  return (
    <div className="rounded-xl border border-yellow-500/20 bg-gradient-to-b from-yellow-500/5 to-transparent p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-yellow-300 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" /> 摇签问卦
        </h3>
      </div>

      {phase === "idle" && (
        <>
          <p className="text-[10px] text-zinc-500 mb-3 text-center">
            心中默念所求之事，然后点击摇签
          </p>
          <div className="flex justify-center mb-3">
            <div className="relative w-16 h-28">
              <div className="absolute bottom-0 w-full h-24 rounded-b-2xl border border-yellow-600/40 bg-gradient-to-b from-yellow-900/30 to-yellow-950/50 overflow-hidden">
                {stickAngles.map((angle, i) => (
                  <div key={i} className="absolute bottom-2 w-0.5 bg-gradient-to-t from-yellow-700/80 to-yellow-500/60 rounded-full" style={{ height: `${60 + i * 3}%`, left: `${20 + (i % 5) * 12}%`, transform: `rotate(${angle}deg)` }} />
                ))}
              </div>
              <div className="absolute bottom-[92px] w-full h-2 rounded-t-lg bg-yellow-800/40 border-x border-t border-yellow-600/40" />
            </div>
          </div>
          <button onClick={startShaking} className="w-full rounded-lg py-2.5 text-xs font-medium transition-all bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 border border-yellow-500/30 active:scale-95">
            🙏 虔心摇签
          </button>
        </>
      )}

      {phase === "shaking" && (
        <div className="text-center py-2">
          <div className="flex justify-center mb-2">
            <div className="relative w-16 h-28 transition-transform" style={{ transform: `translateX(${stickOffset}px) rotate(${Math.sin(shakeCount * 0.6) * 3}deg)` }}>
              <div className="absolute bottom-0 w-full h-24 rounded-b-2xl border border-yellow-600/50 bg-gradient-to-b from-yellow-900/40 to-yellow-950/60 overflow-hidden">
                {stickAngles.map((angle, i) => (
                  <div key={i} className="absolute bottom-2 w-0.5 bg-gradient-to-t from-yellow-700/80 to-yellow-500/60 rounded-full transition-transform" style={{ height: `${60 + i * 3}%`, left: `${20 + (i % 5) * 12}%`, transform: `rotate(${angle + Math.sin(shakeCount * 0.5 + i) * 4}deg)` }} />
                ))}
              </div>
              <div className="absolute bottom-[92px] w-full h-2 rounded-t-lg bg-yellow-800/50 border-x border-t border-yellow-600/50" />
            </div>
          </div>
          <p className="text-[10px] text-yellow-400 animate-pulse">正在摇签... ({shakeCount})</p>
        </div>
      )}

      {phase === "falling" && (
        <div className="text-center py-4">
          <div className="relative h-24 flex justify-center items-end mb-2">
            <div className="w-1.5 h-20 bg-gradient-to-t from-yellow-600 to-yellow-400 rounded-full shadow-lg shadow-yellow-500/30" style={{ animation: "fall-stick 1.2s ease-in forwards" }} />
          </div>
          <style>{`@keyframes fall-stick { 0% { transform: translateY(-60px) rotate(-15deg); opacity: 0; } 40% { transform: translateY(0) rotate(5deg); opacity: 1; } 60% { transform: translateY(-8px) rotate(-2deg); } 80% { transform: translateY(0) rotate(1deg); } 100% { transform: translateY(0) rotate(0deg); } }`}</style>
          <p className="text-xs text-yellow-300 font-bold animate-pulse">一签落出...</p>
        </div>
      )}

      {phase === "done" && sign && (
        <div className="space-y-3">
          {/* Sign card — resembles a real fortune paper */}
          <div className="relative rounded-xl border-2 border-yellow-500/30 bg-gradient-to-b from-yellow-950/60 via-yellow-950/40 to-zinc-900/80 p-5 overflow-hidden">
            {/* Decorative corner marks */}
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-yellow-600/30 rounded-tl" />
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-yellow-600/30 rounded-tr" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-yellow-600/30 rounded-bl" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-yellow-600/30 rounded-br" />

            {/* Header */}
            <div className="text-center mb-3">
              <p className="text-[9px] text-yellow-600 tracking-widest mb-1">观 音 灵 签</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg font-bold text-yellow-300">第 {sign.num} 签</span>
                <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border border-current/20", sign.gradeColor)}>{sign.grade}</span>
              </div>
              <p className="text-[10px] text-yellow-400/80 mt-1">「{sign.title}」</p>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-yellow-600/30 to-transparent" />
              <span className="text-[8px] text-yellow-700">签 诗</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-yellow-600/30 to-transparent" />
            </div>

            {/* Poem — revealed line by line */}
            <div className="space-y-1.5 text-center font-serif">
              {sign.poem.map((line, i) => (
                <p key={i} className={cn(
                  "text-xs tracking-widest transition-all duration-700",
                  i < poemReveal ? "opacity-100 text-yellow-200 translate-y-0" : "opacity-0 text-yellow-200/0 translate-y-2"
                )}>
                  {line}
                </p>
              ))}
            </div>

            {/* Allusion */}
            {poemReveal >= 4 && (
              <div className="mt-3 pt-2 border-t border-yellow-600/20 text-center animate-in fade-in-0 duration-500">
                <p className="text-[9px] text-yellow-600/70">典故：{sign.allusion}</p>
              </div>
            )}
          </div>

          {poemReveal >= 4 && (
            <p className="text-[10px] text-zinc-500 text-center">签文已出，请输入您的问题以获取详细解读</p>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 5. Character Writing Ritual (测字)
// ============================================================

export function CharacterWriteRitual({
  onComplete,
}: {
  onComplete: (char: string, summary: string) => void;
}) {
  const [inputChar, setInputChar] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [animating, setAnimating] = useState(false);

  const handleConfirm = () => {
    if (!inputChar.trim()) return;
    setAnimating(true);
    playRevealSound();
    setTimeout(() => {
      setAnimating(false);
      setConfirmed(true);
      const c = inputChar.trim().charAt(0);
      onComplete(c, `【测字】用户所书之字：「${c}」\n请基于此字进行全面的拆字、象形、会意分析。`);
    }, 1500);
  };

  return (
    <div className="rounded-xl border border-sky-500/20 bg-gradient-to-b from-sky-500/5 to-transparent p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-sky-300 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" /> 测字
        </h3>
      </div>

      {!confirmed ? (
        <>
          <p className="text-[10px] text-zinc-500 mb-3 text-center">
            心中想着所求之事，随意写下一个字
          </p>
          <div className="flex justify-center mb-3">
            <div className={cn(
              "relative w-24 h-24 rounded-xl border-2 border-dashed flex items-center justify-center transition-all duration-500",
              inputChar
                ? "border-sky-500/40 bg-sky-500/5"
                : "border-zinc-700/50 bg-zinc-800/30",
              animating && "scale-110 border-sky-400/60 shadow-lg shadow-sky-500/20"
            )}>
              {animating ? (
                <span className="text-4xl font-bold text-sky-300 animate-pulse">{inputChar.charAt(0)}</span>
              ) : (
                <input
                  type="text"
                  value={inputChar}
                  onChange={(e) => setInputChar(e.target.value.slice(0, 1))}
                  placeholder="字"
                  maxLength={1}
                  className="w-full h-full bg-transparent text-center text-4xl font-bold text-sky-200 placeholder:text-zinc-700 focus:outline-none"
                />
              )}
            </div>
          </div>
          <button
            onClick={handleConfirm}
            disabled={!inputChar.trim() || animating}
            className={cn(
              "w-full rounded-lg py-2.5 text-xs font-medium transition-all border",
              !inputChar.trim()
                ? "bg-zinc-800 text-zinc-600 border-zinc-700 cursor-not-allowed"
                : "bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border-sky-500/30"
            )}
          >
            确认此字
          </button>
        </>
      ) : (
        <div className="text-center py-3 space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl border-2 border-sky-500/40 bg-sky-500/10">
            <span className="text-3xl font-bold text-sky-200">{inputChar.charAt(0)}</span>
          </div>
          <p className="text-xs text-sky-200 font-semibold">「{inputChar.charAt(0)}」字已定</p>
          <p className="text-[10px] text-zinc-500">请输入您想测的具体问题</p>
        </div>
      )}
    </div>
  );
}
