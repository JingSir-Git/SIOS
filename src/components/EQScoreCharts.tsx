"use client";

import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  ReferenceLine, Legend,
} from "recharts";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface EQDimensionScores {
  empathyAccuracy: number;
  expressionPrecision: number;
  timingControl: number;
  strategyEffectiveness: number;
  relationshipMaintenance: number;
}

const DIMENSION_LABELS: Record<string, string> = {
  empathyAccuracy: "共情准确度",
  expressionPrecision: "表达精度",
  timingControl: "时机把握",
  strategyEffectiveness: "策略有效性",
  relationshipMaintenance: "关系维护",
};

// ---- Radar Chart for Current Scores ----
export function EQRadarChart({ scores }: { scores: EQDimensionScores }) {
  const entries = Object.entries(scores);
  const data = entries.map(([key, value]) => ({
    dimension: DIMENSION_LABELS[key] || key,
    score: value,
    fullMark: 100,
  }));

  const vals = entries.map(([, v]) => v);
  const mean = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  const std = vals.length > 1 ? Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / (vals.length - 1)) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-1 px-1">
        <span className="text-[8px] text-zinc-600 font-mono italic">5 EQ dimensions</span>
        <div className="flex items-center gap-3 text-[8px] font-mono">
          <span className="text-zinc-500">μ=<span className="text-violet-400">{mean.toFixed(1)}</span></span>
          <span className="text-zinc-500">σ=<span className="text-zinc-400">{std.toFixed(1)}</span></span>
        </div>
      </div>
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="72%" data={data}>
            <PolarGrid stroke="#3f3f46" strokeDasharray="3 3" />
            <PolarAngleAxis
              dataKey="dimension"
              tick={{ fill: "#a1a1aa", fontSize: 10 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: "#52525b", fontSize: 8 }}
              tickCount={5}
              axisLine={false}
            />
            <Radar
              name="EQ"
              dataKey="score"
              stroke="#a78bfa"
              fill="#a78bfa"
              fillOpacity={0.12}
              strokeWidth={1.5}
              dot={{ r: 3, fill: "#a78bfa", strokeWidth: 0 }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px", fontSize: "10px" }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      {/* Dimension mini-cards */}
      <div className="grid grid-cols-5 gap-1.5 mt-2">
        {entries.map(([key, value]) => {
          const color = value >= 70 ? "#34d399" : value >= 50 ? "#fbbf24" : "#f87171";
          return (
            <div key={key} className="rounded-lg border border-zinc-800/60 bg-zinc-800/20 p-2 text-center">
              <p className="text-[8px] text-zinc-600 truncate">{DIMENSION_LABELS[key]}</p>
              <p className="text-sm font-bold font-mono" style={{ color }}>{value}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- Growth Curve Chart ----
export function EQGrowthCurve() {
  const { eqScores } = useAppStore();

  if (eqScores.length < 2) {
    return (
      <div className="rounded-lg border border-zinc-800 p-4 text-center">
        <p className="text-xs text-zinc-500">完成至少2次复盘后显示成长曲线</p>
        <p className="text-[10px] text-zinc-600 mt-1">
          已完成 {eqScores.length}/2 次
        </p>
      </div>
    );
  }

  // Sort oldest to newest for chart
  const sorted = [...eqScores].reverse();
  const chartData = sorted.map((s, i) => {
    const window = sorted.slice(Math.max(0, i - 2), i + 1);
    const scores = window.map(w => w.overallScore);
    const rollingMean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const rollingStd = scores.length > 1 ? Math.sqrt(scores.reduce((sv, v) => sv + (v - rollingMean) ** 2, 0) / (scores.length - 1)) : 5;
    return {
      index: i + 1,
      label: `#${i + 1}`,
      date: new Date(s.createdAt).toLocaleDateString("zh-CN", { month: "short", day: "numeric" }),
      overall: s.overallScore,
      upper: Math.min(100, Math.round((rollingMean + rollingStd) * 10) / 10),
      lower: Math.max(0, Math.round((rollingMean - rollingStd) * 10) / 10),
      empathy: s.dimensionScores.empathyAccuracy,
      expression: s.dimensionScores.expressionPrecision,
      timing: s.dimensionScores.timingControl,
      strategy: s.dimensionScores.strategyEffectiveness,
      relationship: s.dimensionScores.relationshipMaintenance,
    };
  });

  // Global mean
  const globalMean = Math.round(eqScores.reduce((a, b) => a + b.overallScore, 0) / eqScores.length);

  // Trend calculation
  const recent = sorted.slice(-3);
  const earlier = sorted.slice(0, Math.max(1, sorted.length - 3));
  const recentAvg = recent.reduce((a, b) => a + b.overallScore, 0) / recent.length;
  const earlierAvg = earlier.reduce((a, b) => a + b.overallScore, 0) / earlier.length;
  const diff = recentAvg - earlierAvg;
  const trend = diff > 3 ? "up" : diff < -3 ? "down" : "stable";

  return (
    <div className="rounded-lg border border-zinc-800 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-medium text-zinc-300">EQ成长曲线</h4>
        <div className="flex items-center gap-1.5">
          {trend === "up" && (
            <>
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[10px] text-emerald-400">进步中 +{diff.toFixed(1)}</span>
            </>
          )}
          {trend === "down" && (
            <>
              <TrendingDown className="h-3.5 w-3.5 text-red-400" />
              <span className="text-[10px] text-red-400">需注意 {diff.toFixed(1)}</span>
            </>
          )}
          {trend === "stable" && (
            <>
              <Minus className="h-3.5 w-3.5 text-zinc-400" />
              <span className="text-[10px] text-zinc-400">稳定</span>
            </>
          )}
          <span className="text-[9px] text-zinc-600 ml-2">{eqScores.length}次复盘</span>
        </div>
      </div>

      <p className="text-[8px] text-zinc-600 italic mb-1 ml-1">阴影区域 = 滚动±1σ | 虚线 = 子维度</p>
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -15 }}>
            <defs>
              <linearGradient id="eqBandGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.02} />
              </linearGradient>
            </defs>
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
            <Area type="monotone" dataKey="upper" stroke="none" fill="url(#eqBandGrad)" />
            <Area type="monotone" dataKey="lower" stroke="none" fill="#18181b" />
            <Line type="monotone" dataKey="overall" name="总分" stroke="#a78bfa" strokeWidth={2} dot={{ fill: "#a78bfa", r: 3 }} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="empathy" name="共情" stroke="#f472b6" strokeWidth={1} strokeDasharray="4 2" dot={false} />
            <Line type="monotone" dataKey="strategy" name="策略" stroke="#60a5fa" strokeWidth={1} strokeDasharray="4 2" dot={false} />
            <ReferenceLine y={globalMean} stroke="#52525b" strokeDasharray="2 2" label={{ value: `μ=${globalMean}`, position: "right", style: { fontSize: 8, fill: "#52525b" } }} />
            <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 9 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Best & latest scores */}
      <div className="flex items-center gap-4 text-[10px]">
        <span className="text-zinc-500">
          最新: <span className={cn("font-mono font-medium", recentAvg >= 70 ? "text-emerald-400" : recentAvg >= 50 ? "text-amber-400" : "text-red-400")}>
            {sorted[sorted.length - 1].overallScore}
          </span>
        </span>
        <span className="text-zinc-500">
          最高: <span className="text-emerald-400 font-mono font-medium">
            {Math.max(...eqScores.map(s => s.overallScore))}
          </span>
        </span>
        <span className="text-zinc-500">
          平均: <span className="text-zinc-300 font-mono font-medium">
            {(eqScores.reduce((a, b) => a + b.overallScore, 0) / eqScores.length).toFixed(0)}
          </span>
        </span>
      </div>
    </div>
  );
}
