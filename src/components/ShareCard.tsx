"use client";

import { useCallback, useRef, useState } from "react";
import { Download, Share2, X, Trophy, Brain, Sparkles, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { ACHIEVEMENTS, type AchievementDef } from "@/lib/achievements";

// ---- Types ----

interface ShareCardProps {
  isOpen: boolean;
  onClose: () => void;
  type: "achievement" | "profile-summary" | "mbti" | "eq";
  data?: Record<string, unknown>;
}

// ---- Canvas Card Generator ----

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function generateAchievementCard(
  canvas: HTMLCanvasElement,
  achievements: { id: string; level: number; unlockedAt: string }[],
  language: "zh" | "en"
) {
  const W = 600;
  const H = 400;
  canvas.width = W * 2;
  canvas.height = H * 2;
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(2, 2); // 2x retina

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#0c0a14");
  grad.addColorStop(0.5, "#1a1025");
  grad.addColorStop(1, "#0c0a14");
  ctx.fillStyle = grad;
  drawRoundedRect(ctx, 0, 0, W, H, 16);
  ctx.fill();

  // Border
  ctx.strokeStyle = "rgba(139, 92, 246, 0.3)";
  ctx.lineWidth = 1;
  drawRoundedRect(ctx, 0, 0, W, H, 16);
  ctx.stroke();

  // Decorative dots
  ctx.fillStyle = "rgba(139, 92, 246, 0.08)";
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    ctx.beginPath();
    ctx.arc(x, y, Math.random() * 3 + 1, 0, Math.PI * 2);
    ctx.fill();
  }

  // Trophy icon area
  ctx.fillStyle = "rgba(245, 158, 11, 0.15)";
  ctx.beginPath();
  ctx.arc(W / 2, 70, 32, 0, Math.PI * 2);
  ctx.fill();

  // Trophy emoji
  ctx.font = "36px serif";
  ctx.textAlign = "center";
  ctx.fillText("🏆", W / 2, 82);

  // Title
  ctx.fillStyle = "#f5f5f5";
  ctx.font = "bold 20px -apple-system, 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(
    language === "en" ? "Achievement Showcase" : "成就展示",
    W / 2,
    130
  );

  // Subtitle
  ctx.fillStyle = "#a1a1aa";
  ctx.font = "12px -apple-system, 'Segoe UI', sans-serif";
  ctx.fillText(
    `${achievements.length} / ${ACHIEVEMENTS.reduce((s, a) => s + (a.maxLevel ?? 1), 0)} ${language === "en" ? "unlocked" : "已解锁"}`,
    W / 2,
    152
  );

  // Achievement grid
  const cols = 4;
  const cellW = 130;
  const cellH = 64;
  const startX = (W - cols * cellW) / 2;
  const startY = 175;
  const maxShow = Math.min(achievements.length, 8);

  for (let i = 0; i < maxShow; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const x = startX + col * cellW;
    const y = startY + row * (cellH + 10);

    const ach = achievements[i];
    const def = ACHIEVEMENTS.find((a) => a.id === ach.id);
    if (!def) continue;

    // Card bg
    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    drawRoundedRect(ctx, x, y, cellW - 8, cellH, 8);
    ctx.fill();

    // Border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 0.5;
    drawRoundedRect(ctx, x, y, cellW - 8, cellH, 8);
    ctx.stroke();

    // Emoji
    ctx.font = "20px serif";
    ctx.textAlign = "left";
    ctx.fillText(def.icon, x + 8, y + 30);

    // Name
    ctx.fillStyle = "#d4d4d8";
    ctx.font = "bold 10px -apple-system, 'Segoe UI', sans-serif";
    ctx.textAlign = "left";
    const name = language === "en" ? def.title.en : def.title.zh;
    ctx.fillText(name.slice(0, 10), x + 34, y + 26);

    // Level
    ctx.fillStyle = "#71717a";
    ctx.font = "9px -apple-system, 'Segoe UI', sans-serif";
    ctx.fillText(
      `Lv.${ach.level}`,
      x + 34,
      y + 42
    );
  }

  if (achievements.length > 8) {
    ctx.fillStyle = "#71717a";
    ctx.font = "11px -apple-system, 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      `+${achievements.length - 8} ${language === "en" ? "more" : "更多"}...`,
      W / 2,
      startY + 2 * (cellH + 10) + 20
    );
  }

  // Footer
  ctx.fillStyle = "#52525b";
  ctx.font = "10px -apple-system, 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Social Intelligence OS · SIOS", W / 2, H - 30);

  ctx.fillStyle = "#3f3f46";
  ctx.font = "9px -apple-system, 'Segoe UI', sans-serif";
  ctx.fillText(new Date().toLocaleDateString(), W / 2, H - 14);
}

function generateProfileSummaryCard(
  canvas: HTMLCanvasElement,
  stats: { profiles: number; conversations: number; mbti: string; avgEQ: number; daysActive: number },
  language: "zh" | "en"
) {
  const W = 600;
  const H = 340;
  canvas.width = W * 2;
  canvas.height = H * 2;
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(2, 2);

  // Background
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#0c0a14");
  grad.addColorStop(1, "#141020");
  ctx.fillStyle = grad;
  drawRoundedRect(ctx, 0, 0, W, H, 16);
  ctx.fill();

  ctx.strokeStyle = "rgba(96, 165, 250, 0.25)";
  ctx.lineWidth = 1;
  drawRoundedRect(ctx, 0, 0, W, H, 16);
  ctx.stroke();

  // Title
  ctx.fillStyle = "#f5f5f5";
  ctx.font = "bold 18px -apple-system, 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(
    language === "en" ? "My SIOS Journey" : "我的 SIOS 旅程",
    W / 2,
    50
  );

  // Stats grid
  const items = [
    { label: language === "en" ? "Profiles" : "人物画像", value: `${stats.profiles}`, emoji: "👤" },
    { label: language === "en" ? "Conversations" : "对话分析", value: `${stats.conversations}`, emoji: "💬" },
    { label: "MBTI", value: stats.mbti || "—", emoji: "🧬" },
    { label: language === "en" ? "EQ Score" : "EQ 均分", value: stats.avgEQ > 0 ? `${stats.avgEQ}` : "—", emoji: "🧠" },
    { label: language === "en" ? "Active Days" : "活跃天数", value: `${stats.daysActive}`, emoji: "📅" },
  ];

  const cardW = 100;
  const cardH = 90;
  const gap = 12;
  const totalW = items.length * cardW + (items.length - 1) * gap;
  const startX = (W - totalW) / 2;
  const startY = 85;

  for (let i = 0; i < items.length; i++) {
    const x = startX + i * (cardW + gap);
    const y = startY;

    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    drawRoundedRect(ctx, x, y, cardW, cardH, 10);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
    ctx.lineWidth = 0.5;
    drawRoundedRect(ctx, x, y, cardW, cardH, 10);
    ctx.stroke();

    // Emoji
    ctx.font = "22px serif";
    ctx.textAlign = "center";
    ctx.fillText(items[i].emoji, x + cardW / 2, y + 30);

    // Value
    ctx.fillStyle = "#e4e4e7";
    ctx.font = "bold 16px -apple-system, 'Segoe UI', sans-serif";
    ctx.fillText(items[i].value, x + cardW / 2, y + 56);

    // Label
    ctx.fillStyle = "#71717a";
    ctx.font = "9px -apple-system, 'Segoe UI', sans-serif";
    ctx.fillText(items[i].label, x + cardW / 2, y + 74);
  }

  // Motivational quote
  ctx.fillStyle = "#a78bfa";
  ctx.font = "italic 12px -apple-system, 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(
    language === "en"
      ? "\"Understanding people is the greatest intelligence.\""
      : "「理解他人，理解自己，优化人际。」",
    W / 2,
    250
  );

  // Footer
  ctx.fillStyle = "#52525b";
  ctx.font = "10px -apple-system, 'Segoe UI', sans-serif";
  ctx.fillText("Social Intelligence OS · SIOS", W / 2, H - 30);

  ctx.fillStyle = "#3f3f46";
  ctx.font = "9px -apple-system, 'Segoe UI', sans-serif";
  ctx.fillText(new Date().toLocaleDateString(), W / 2, H - 14);
}

// ---- ShareCard Component ----

export default function ShareCard({ isOpen, onClose, type, data }: ShareCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { achievements, profiles, conversations, eqScores, mbtiResults, language } = useAppStore();
  const [copied, setCopied] = useState(false);

  const generate = useCallback(() => {
    if (!canvasRef.current) return;

    if (type === "achievement") {
      generateAchievementCard(canvasRef.current, achievements ?? [], language);
    } else if (type === "profile-summary") {
      const daysActive = (() => {
        const dayMs = 86400000;
        const allTs = [
          ...conversations.map((c) => new Date(c.createdAt).getTime()),
        ].filter(Boolean);
        if (allTs.length === 0) return 0;
        return Math.max(1, Math.ceil((Date.now() - Math.min(...allTs)) / dayMs));
      })();
      generateProfileSummaryCard(canvasRef.current, {
        profiles: profiles.length,
        conversations: conversations.length,
        mbti: mbtiResults[0]?.type ?? "",
        avgEQ: eqScores.length > 0 ? Math.round(eqScores.reduce((s, e) => s + e.overallScore, 0) / eqScores.length) : 0,
        daysActive,
      }, language);
    }
  }, [type, achievements, profiles, conversations, eqScores, mbtiResults, language]);

  const handleDownload = useCallback(() => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `sios-${type}-${Date.now()}.png`;
    a.click();
  }, [type]);

  const handleCopyToClipboard = useCallback(async () => {
    if (!canvasRef.current) return;
    try {
      const blob = await new Promise<Blob>((resolve) =>
        canvasRef.current!.toBlob((b) => resolve(b!), "image/png")
      );
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: just download
      handleDownload();
    }
  }, [handleDownload]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200">
      <div className="relative rounded-2xl border border-zinc-700 bg-zinc-900 p-6 max-w-[660px] w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Share2 className="h-4 w-4 text-violet-400" />
            <h3 className="text-sm font-semibold text-zinc-200">
              {language === "en" ? "Share Card" : "分享卡片"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Canvas */}
        <div className="flex justify-center mb-4 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
          <canvas
            ref={(el) => {
              (canvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = el;
              if (el) setTimeout(generate, 50);
            }}
            className="max-w-full"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600/20 text-violet-400 border border-violet-500/30 hover:bg-violet-600/30 text-xs font-medium transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            {language === "en" ? "Save PNG" : "保存图片"}
          </button>
          <button
            onClick={handleCopyToClipboard}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 text-xs font-medium transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? (language === "en" ? "Copied!" : "已复制!") : (language === "en" ? "Copy to Clipboard" : "复制到剪贴板")}
          </button>
          <button
            onClick={generate}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700 text-xs font-medium transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {language === "en" ? "Regenerate" : "重新生成"}
          </button>
        </div>
      </div>
    </div>
  );
}
