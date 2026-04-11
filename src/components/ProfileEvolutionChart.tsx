"use client";

import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, ReferenceLine,
} from "recharts";
import { DIMENSION_LABELS, type DimensionKey, type ProfileSnapshot, type PersonProfile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, History } from "lucide-react";
import { useState } from "react";

const DIMENSION_COLORS: Record<string, string> = {
  assertiveness: "#f472b6",
  cooperativeness: "#34d399",
  decisionSpeed: "#60a5fa",
  emotionalStability: "#fbbf24",
  openness: "#a78bfa",
  empathy: "#f87171",
  riskTolerance: "#fb923c",
  formalityLevel: "#22d3ee",
};

interface Props {
  profile: PersonProfile;
}

export default function ProfileEvolutionChart({ profile }: Props) {
  const snapshots = profile.versionHistory || [];
  const [selectedDims, setSelectedDims] = useState<Set<DimensionKey>>(
    new Set(["assertiveness", "cooperativeness", "emotionalStability", "empathy"] as DimensionKey[])
  );

  if (snapshots.length < 2) {
    return (
      <div className="rounded-lg border border-zinc-800 p-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <History className="h-4 w-4 text-zinc-600" />
          <span className="text-xs text-zinc-500">画像演变时间轴</span>
        </div>
        <p className="text-[10px] text-zinc-600">
          需要至少2次对话分析更新后才能显示维度演变趋势
        </p>
        <p className="text-[10px] text-zinc-700 mt-1">
          已有 {snapshots.length} 个快照（需要 ≥2）
        </p>
      </div>
    );
  }

  // Build chart data: each snapshot becomes a data point, plus current state
  const chartData = snapshots
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((snap, idx) => {
      const point: Record<string, number | string> = {
        index: idx + 1,
        date: new Date(snap.timestamp).toLocaleDateString("zh-CN", {
          month: "short", day: "numeric",
        }),
        version: `v${snap.version}`,
      };
      for (const key of Object.keys(snap.dimensions)) {
        const dim = snap.dimensions[key as DimensionKey];
        if (dim) {
          point[key] = dim.value ?? 50;
          point[`${key}_conf`] = dim.confidence ?? 0;
        }
      }
      return point;
    });

  // Append current profile state as the latest point
  const currentPoint: Record<string, number | string> = {
    index: chartData.length + 1,
    date: "当前",
    version: "当前",
  };
  for (const [key, dim] of Object.entries(profile.dimensions)) {
    currentPoint[key] = dim.value;
    currentPoint[`${key}_conf`] = dim.confidence;
  }
  chartData.push(currentPoint);

  // Calculate convergence analysis
  const convergenceAnalysis = Object.keys(profile.dimensions).map((key) => {
    const dimKey = key as DimensionKey;
    const values = chartData.map((d) => (d[key] as number) || 0).filter(Boolean);
    if (values.length < 2) return { key: dimKey, trend: "stable" as const, volatility: 0, direction: 0 };

    const recent = values.slice(-2);
    const direction = recent[recent.length - 1] - recent[0];
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const volatility = Math.sqrt(variance);

    return {
      key: dimKey,
      trend: volatility < 5 ? "converged" as const : volatility < 15 ? "converging" as const : "volatile" as const,
      volatility: Math.round(volatility),
      direction: Math.round(direction),
    };
  });

  const toggleDim = (dim: DimensionKey) => {
    setSelectedDims((prev) => {
      const next = new Set(prev);
      if (next.has(dim)) next.delete(dim);
      else next.add(dim);
      return next;
    });
  };

  return (
    <div className="rounded-lg border border-zinc-800 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-semibold text-zinc-200 flex items-center gap-2">
          <History className="h-4 w-4 text-violet-400" />
          画像演变时间轴
        </h3>
        <span className="text-[8px] text-zinc-600 font-mono">{snapshots.length} snapshots · {chartData.length} data points</span>
      </div>

      {/* Dimension Toggle Chips */}
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(DIMENSION_LABELS).map(([key, label]) => {
          const isActive = selectedDims.has(key as DimensionKey);
          const color = DIMENSION_COLORS[key] || "#a1a1aa";
          return (
            <button
              key={key}
              onClick={() => toggleDim(key as DimensionKey)}
              className={cn(
                "text-[10px] px-2 py-0.5 rounded-full border transition-all",
                isActive
                  ? "border-current opacity-100"
                  : "border-zinc-700 text-zinc-600 opacity-50 hover:opacity-75"
              )}
              style={isActive ? { color, borderColor: color } : undefined}
            >
              {label.zh}
            </button>
          );
        })}
      </div>

      {/* Evolution Line Chart */}
      <p className="text-[8px] text-zinc-600 italic ml-1 mb-1">各维度随时间变化趋势 · 点击图例筛选</p>
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#52525b", fontSize: 9 }}
              axisLine={{ stroke: "#3f3f46" }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "#52525b", fontSize: 9 }}
              axisLine={{ stroke: "#3f3f46" }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{ backgroundColor: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px", fontSize: "10px" }}
              labelStyle={{ color: "#a1a1aa" }}
            />
            <ReferenceLine y={50} stroke="#3f3f46" strokeDasharray="2 2" />
            <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 9 }} />
            {Array.from(selectedDims).map((dimKey) => (
              <Line
                key={dimKey}
                type="monotone"
                dataKey={dimKey}
                name={DIMENSION_LABELS[dimKey]?.zh || dimKey}
                stroke={DIMENSION_COLORS[dimKey] || "#a1a1aa"}
                strokeWidth={1.5}
                dot={{ r: 3, fill: DIMENSION_COLORS[dimKey] || "#a1a1aa", strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Convergence Analysis */}
      <div className="space-y-1.5">
        <h4 className="text-[10px] font-medium text-zinc-400">收敛分析</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {convergenceAnalysis.map(({ key, trend, volatility, direction }) => (
            <div
              key={key}
              className={cn(
                "rounded-lg border p-2 text-center",
                trend === "converged"
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : trend === "converging"
                  ? "border-amber-500/20 bg-amber-500/5"
                  : "border-red-500/20 bg-red-500/5"
              )}
            >
              <div className="text-[9px] text-zinc-500 mb-0.5">
                {DIMENSION_LABELS[key]?.zh}
              </div>
              <div className="flex items-center justify-center gap-1">
                {direction > 3 ? (
                  <TrendingUp className="h-3 w-3 text-emerald-400" />
                ) : direction < -3 ? (
                  <TrendingDown className="h-3 w-3 text-red-400" />
                ) : (
                  <Minus className="h-3 w-3 text-zinc-500" />
                )}
                <span className={cn(
                  "text-[10px] font-mono font-medium",
                  trend === "converged" ? "text-emerald-400"
                    : trend === "converging" ? "text-amber-400"
                    : "text-red-400"
                )}>
                  {trend === "converged" ? "已稳定" : trend === "converging" ? "趋于稳定" : "波动中"}
                </span>
              </div>
              <div className="text-[8px] text-zinc-600 mt-0.5">
                波动 ±{volatility}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
