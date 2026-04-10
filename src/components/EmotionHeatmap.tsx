"use client";

import { useMemo, useState } from "react";
import {
  Flame,
  X,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

interface Props {
  /** If provided, only show conversations linked to this profile */
  profileId?: string;
  profileName?: string;
  isOpen: boolean;
  onClose: () => void;
}

type ViewMode = "self" | "other" | "delta";

const VIEW_LABELS: Record<ViewMode, string> = {
  self: "我方情绪",
  other: "对方情绪",
  delta: "情绪差值",
};

// Color scale: -1 (cold/blue) to +1 (warm/red)
function emotionToColor(value: number, opacity = 1): string {
  // Clamp to -1..1
  const v = Math.max(-1, Math.min(1, value));
  if (v >= 0) {
    // Positive: neutral → warm red
    const r = 239;
    const g = Math.round(68 + (1 - v) * 100);
    const b = Math.round(68 + (1 - v) * 100);
    return `rgba(${r},${g},${b},${opacity})`;
  } else {
    // Negative: neutral → cool blue
    const av = Math.abs(v);
    const r = Math.round(96 + (1 - av) * 80);
    const g = Math.round(165 + (1 - av) * 60);
    const b = 250;
    return `rgba(${r},${g},${b},${opacity})`;
  }
}

function emotionLabel(value: number): string {
  if (value >= 0.6) return "非常积极";
  if (value >= 0.3) return "积极";
  if (value >= 0.1) return "略积极";
  if (value >= -0.1) return "中性";
  if (value >= -0.3) return "略消极";
  if (value >= -0.6) return "消极";
  return "非常消极";
}

interface HeatmapCell {
  conversationId: string;
  conversationTitle: string;
  date: string;
  messageIndex: number;
  selfEmotion: number;
  otherEmotion: number;
  label: string;
}

interface TrendPoint {
  date: string;
  title: string;
  avgSelf: number;
  avgOther: number;
  messageCount: number;
}

export default function EmotionHeatmap({ profileId, profileName, isOpen, onClose }: Props) {
  const { conversations } = useAppStore();
  const [viewMode, setViewMode] = useState<ViewMode>("self");
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);

  // Filter conversations with emotion curve data
  const relevantConversations = useMemo(() => {
    let convos = conversations.filter(
      (c) => c.analysis?.emotionCurve && c.analysis.emotionCurve.length > 0
    );
    if (profileId) {
      convos = convos.filter(
        (c) =>
          c.linkedProfileId === profileId ||
          c.participants?.some((p) => p === profileName)
      );
    }
    // Sort by date
    return convos.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [conversations, profileId, profileName]);

  // Build heatmap data
  const { cells, maxMessages, trendPoints } = useMemo(() => {
    const allCells: HeatmapCell[] = [];
    const trends: TrendPoint[] = [];
    let maxMsg = 0;

    for (const convo of relevantConversations) {
      const curve = convo.analysis!.emotionCurve;
      maxMsg = Math.max(maxMsg, curve.length);

      let sumSelf = 0;
      let sumOther = 0;

      for (const pt of curve) {
        allCells.push({
          conversationId: convo.id,
          conversationTitle: convo.title || "未命名对话",
          date: convo.createdAt,
          messageIndex: pt.messageIndex,
          selfEmotion: pt.selfEmotion,
          otherEmotion: pt.otherEmotion,
          label: pt.label,
        });
        sumSelf += pt.selfEmotion;
        sumOther += pt.otherEmotion;
      }

      trends.push({
        date: convo.createdAt,
        title: convo.title || "未命名对话",
        avgSelf: curve.length > 0 ? sumSelf / curve.length : 0,
        avgOther: curve.length > 0 ? sumOther / curve.length : 0,
        messageCount: curve.length,
      });
    }

    return { cells: allCells, maxMessages: maxMsg, trendPoints: trends };
  }, [relevantConversations]);

  // Detect trend inflection points
  const inflectionPoints = useMemo(() => {
    if (trendPoints.length < 3) return [];
    const points: { index: number; type: "rise" | "fall"; magnitude: number }[] = [];

    for (let i = 1; i < trendPoints.length - 1; i++) {
      const prev = trendPoints[i - 1].avgSelf;
      const curr = trendPoints[i].avgSelf;
      const next = trendPoints[i + 1].avgSelf;
      const delta1 = curr - prev;
      const delta2 = next - curr;

      // Sign change = inflection
      if (delta1 > 0.1 && delta2 < -0.1) {
        points.push({ index: i, type: "fall", magnitude: Math.abs(delta2) });
      } else if (delta1 < -0.1 && delta2 > 0.1) {
        points.push({ index: i, type: "rise", magnitude: Math.abs(delta2) });
      }
    }
    return points;
  }, [trendPoints]);

  if (!isOpen) return null;

  const hasData = relevantConversations.length > 0;
  const CELL_W = Math.max(24, Math.min(48, 600 / Math.max(relevantConversations.length, 1)));
  const CELL_H = 12;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/95 overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-400" />
          <h3 className="text-sm font-medium text-zinc-200">情绪热力图</h3>
          <span className="text-[10px] text-zinc-600">
            {relevantConversations.length} 次对话 · {cells.length} 个数据点
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* View Mode Selector */}
          <div className="flex rounded-lg border border-zinc-700 overflow-hidden">
            {(["self", "other", "delta"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "px-2 py-1 text-[10px] transition-colors",
                  viewMode === mode
                    ? "bg-zinc-700 text-zinc-200"
                    : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                {VIEW_LABELS[mode]}
              </button>
            ))}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {hasData ? (
        <div className="p-4 space-y-4">
          {/* Trend Line */}
          <div className="rounded-lg border border-zinc-800 p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-medium text-zinc-400">情绪趋势线</p>
              {inflectionPoints.length > 0 && (
                <span className="text-[9px] text-amber-400">
                  发现 {inflectionPoints.length} 个趋势拐点
                </span>
              )}
            </div>
            <div className="relative h-24">
              <svg viewBox={`0 0 ${trendPoints.length * 60} 100`} className="w-full h-full" preserveAspectRatio="none">
                {/* Grid lines */}
                <line x1="0" y1="50" x2={trendPoints.length * 60} y2="50" stroke="#27272a" strokeWidth="1" strokeDasharray="4,4" />

                {/* Self line */}
                {trendPoints.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={trendPoints.map((p, i) => `${i * 60 + 30},${50 - p.avgSelf * 45}`).join(" ")}
                  />
                )}

                {/* Other line */}
                {trendPoints.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="4,2"
                    points={trendPoints.map((p, i) => `${i * 60 + 30},${50 - p.avgOther * 45}`).join(" ")}
                  />
                )}

                {/* Data points */}
                {trendPoints.map((p, i) => (
                  <g key={i}>
                    <circle cx={i * 60 + 30} cy={50 - p.avgSelf * 45} r="3" fill="#ef4444" />
                    <circle cx={i * 60 + 30} cy={50 - p.avgOther * 45} r="3" fill="#3b82f6" />
                  </g>
                ))}

                {/* Inflection markers */}
                {inflectionPoints.map((ip, i) => (
                  <g key={`inf-${i}`}>
                    <circle
                      cx={ip.index * 60 + 30}
                      cy={50 - trendPoints[ip.index].avgSelf * 45}
                      r="6"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2"
                    />
                  </g>
                ))}
              </svg>

              {/* Date labels */}
              <div className="flex justify-between mt-1">
                {trendPoints.length <= 10 ? (
                  trendPoints.map((p, i) => (
                    <span key={i} className="text-[8px] text-zinc-600 text-center flex-1 truncate">
                      {new Date(p.date).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })}
                    </span>
                  ))
                ) : (
                  <>
                    <span className="text-[8px] text-zinc-600">
                      {new Date(trendPoints[0].date).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })}
                    </span>
                    <span className="text-[8px] text-zinc-600">
                      {new Date(trendPoints[trendPoints.length - 1].date).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-2 text-[9px]">
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-red-500 rounded" />
                <span className="text-zinc-500">我方情绪</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-blue-500 rounded" style={{ borderBottom: "1px dashed" }} />
                <span className="text-zinc-500">对方情绪</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full border border-amber-500" />
                <span className="text-zinc-500">趋势拐点</span>
              </div>
            </div>
          </div>

          {/* Heatmap Grid */}
          <div className="rounded-lg border border-zinc-800 p-3">
            <p className="text-[10px] font-medium text-zinc-400 mb-2">
              对话 × 消息序列热力图（{VIEW_LABELS[viewMode]}）
            </p>
            <div className="overflow-x-auto">
              <div className="inline-flex gap-px" style={{ minHeight: `${Math.min(maxMessages, 20) * CELL_H + 20}px` }}>
                {relevantConversations.map((convo, ci) => {
                  const curve = convo.analysis!.emotionCurve;
                  return (
                    <div key={convo.id} className="flex flex-col gap-px items-center">
                      {/* Column cells */}
                      {curve.slice(0, 20).map((pt, mi) => {
                        const value =
                          viewMode === "self" ? pt.selfEmotion
                          : viewMode === "other" ? pt.otherEmotion
                          : pt.selfEmotion - pt.otherEmotion;

                        return (
                          <div
                            key={mi}
                            className="rounded-sm cursor-pointer transition-transform hover:scale-125 hover:z-10"
                            style={{
                              width: `${CELL_W}px`,
                              height: `${CELL_H}px`,
                              backgroundColor: emotionToColor(value, 0.8),
                            }}
                            title={`${convo.title || "对话"} #${pt.messageIndex}: ${emotionLabel(value)} (${value.toFixed(2)})\n${pt.label}`}
                            onMouseEnter={() =>
                              setHoveredCell({
                                conversationId: convo.id,
                                conversationTitle: convo.title || "未命名",
                                date: convo.createdAt,
                                messageIndex: pt.messageIndex,
                                selfEmotion: pt.selfEmotion,
                                otherEmotion: pt.otherEmotion,
                                label: pt.label,
                              })
                            }
                            onMouseLeave={() => setHoveredCell(null)}
                          />
                        );
                      })}
                      {/* Date label */}
                      <span className="text-[7px] text-zinc-600 mt-0.5 whitespace-nowrap" style={{ width: `${CELL_W}px`, textAlign: "center", overflow: "hidden" }}>
                        {new Date(convo.createdAt).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hovered cell detail */}
            {hoveredCell && (
              <div className="mt-2 rounded-lg bg-zinc-800/80 border border-zinc-700 px-3 py-2 text-[10px] animate-in fade-in-0 duration-100">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-300 font-medium">{hoveredCell.conversationTitle}</span>
                  <span className="text-zinc-600">消息 #{hoveredCell.messageIndex}</span>
                </div>
                <div className="flex gap-4 mt-1">
                  <span className="text-zinc-400">
                    我方: <span style={{ color: emotionToColor(hoveredCell.selfEmotion) }}>{emotionLabel(hoveredCell.selfEmotion)} ({hoveredCell.selfEmotion.toFixed(2)})</span>
                  </span>
                  <span className="text-zinc-400">
                    对方: <span style={{ color: emotionToColor(hoveredCell.otherEmotion) }}>{emotionLabel(hoveredCell.otherEmotion)} ({hoveredCell.otherEmotion.toFixed(2)})</span>
                  </span>
                </div>
                {hoveredCell.label && (
                  <p className="text-zinc-500 mt-0.5 italic">{hoveredCell.label}</p>
                )}
              </div>
            )}

            {/* Color scale */}
            <div className="flex items-center justify-between mt-3">
              <span className="text-[8px] text-blue-400">消极 -1.0</span>
              <div className="flex-1 mx-2 h-2 rounded-full" style={{
                background: "linear-gradient(to right, rgba(96,165,250,0.8), rgba(161,161,170,0.4), rgba(239,68,68,0.8))"
              }} />
              <span className="text-[8px] text-red-400">积极 +1.0</span>
            </div>
          </div>

          {/* Inflection Point Analysis */}
          {inflectionPoints.length > 0 && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-3.5 w-3.5 text-amber-400" />
                <p className="text-[10px] font-medium text-amber-300">趋势拐点分析</p>
              </div>
              <div className="space-y-1.5">
                {inflectionPoints.map((ip, i) => {
                  const tp = trendPoints[ip.index];
                  const isRise = ip.type === "rise";
                  return (
                    <div key={i} className="flex items-start gap-2 text-[10px]">
                      {isRise ? (
                        <TrendingUp className="h-3 w-3 text-emerald-400 mt-0.5 shrink-0" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-400 mt-0.5 shrink-0" />
                      )}
                      <div>
                        <span className="text-zinc-300">
                          {new Date(tp.date).toLocaleDateString("zh-CN", { month: "long", day: "numeric" })}
                        </span>
                        <span className="text-zinc-500 ml-1">
                          「{tp.title}」
                        </span>
                        <span className={cn("ml-1", isRise ? "text-emerald-400" : "text-red-400")}>
                          {isRise ? "情绪转升" : "情绪转降"}
                          （幅度 {(ip.magnitude * 100).toFixed(0)}%）
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <Flame className="h-8 w-8 text-zinc-700 mb-2" />
          <p className="text-xs text-zinc-500">暂无情绪数据</p>
          <p className="text-[10px] text-zinc-600 mt-1">
            {profileId
              ? "分析与此人的对话后，情绪数据将自动显示"
              : "分析对话后，情绪曲线数据将自动汇总到此处"}
          </p>
        </div>
      )}
    </div>
  );
}
