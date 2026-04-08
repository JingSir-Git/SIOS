"use client";

import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
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
  const data = Object.entries(scores).map(([key, value]) => ({
    dimension: DIMENSION_LABELS[key] || key,
    score: value,
    fullMark: 100,
  }));

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke="#3f3f46" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: "#a1a1aa", fontSize: 11 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: "#71717a", fontSize: 9 }}
            tickCount={5}
          />
          <Radar
            name="EQ"
            dataKey="score"
            stroke="#a78bfa"
            fill="#a78bfa"
            fillOpacity={0.25}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
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
  const chartData = sorted.map((s, i) => ({
    index: i + 1,
    label: `#${i + 1}`,
    date: new Date(s.createdAt).toLocaleDateString("zh-CN", { month: "short", day: "numeric" }),
    overall: s.overallScore,
    empathy: s.dimensionScores.empathyAccuracy,
    expression: s.dimensionScores.expressionPrecision,
    timing: s.dimensionScores.timingControl,
    strategy: s.dimensionScores.strategyEffectiveness,
    relationship: s.dimensionScores.relationshipMaintenance,
  }));

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

      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#71717a", fontSize: 10 }}
              axisLine={{ stroke: "#3f3f46" }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "#71717a", fontSize: 10 }}
              axisLine={{ stroke: "#3f3f46" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: "8px",
                fontSize: "11px",
              }}
              labelStyle={{ color: "#a1a1aa" }}
            />
            <Area
              type="monotone"
              dataKey="overall"
              name="总分"
              stroke="#a78bfa"
              fill="#a78bfa"
              fillOpacity={0.15}
              strokeWidth={2}
              dot={{ fill: "#a78bfa", r: 3 }}
            />
            <Area
              type="monotone"
              dataKey="empathy"
              name="共情"
              stroke="#f472b6"
              fill="transparent"
              strokeWidth={1}
              strokeDasharray="4 2"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="strategy"
              name="策略"
              stroke="#60a5fa"
              fill="transparent"
              strokeWidth={1}
              strokeDasharray="4 2"
              dot={false}
            />
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
