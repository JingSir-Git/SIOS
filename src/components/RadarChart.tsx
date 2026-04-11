"use client";

import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { ProfileDimension } from "@/lib/types";
import { getConfidenceColor, getConfidenceLabel } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface RadarChartProps {
  dimensions: Record<string, ProfileDimension>;
}

export default function RadarChart({ dimensions }: RadarChartProps) {
  const entries = Object.entries(dimensions);
  const data = entries.map(([key, dim]) => ({
    dimension: dim.labelZh || key,
    value: dim.value,
    confidence: dim.confidence,
    fullMark: 100,
  }));

  // Statistics
  const values = entries.map(([, d]) => d.value);
  const mean = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 50;
  const std = values.length > 1 ? Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1)) : 0;
  const avgConf = entries.length > 0 ? Math.round(entries.reduce((s, [, d]) => s + d.confidence, 0) / entries.length) : 0;

  return (
    <div className="relative">
      {/* Header stats */}
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-[8px] text-zinc-600 font-mono italic">n={entries.length} dimensions</span>
        <div className="flex items-center gap-3 text-[8px] font-mono">
          <span className="text-zinc-500">μ=<span className="text-violet-400">{mean.toFixed(1)}</span></span>
          <span className="text-zinc-500">σ=<span className="text-zinc-400">{std.toFixed(1)}</span></span>
          <span className="text-zinc-500">avg conf=<span className={avgConf >= 70 ? "text-emerald-400" : avgConf >= 40 ? "text-amber-400" : "text-zinc-500"}>{avgConf}%</span></span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <RechartsRadarChart cx="50%" cy="50%" outerRadius="72%" data={data}>
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
            name="画像值"
            dataKey="value"
            stroke="#8b5cf6"
            fill="#8b5cf6"
            fillOpacity={0.12}
            strokeWidth={1.5}
            dot={{ r: 3, fill: "#8b5cf6", strokeWidth: 0 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: "8px",
              fontSize: "11px",
            }}
            formatter={(value: any, _name: any, props: any) => {
              const v = Number(value) || 0;
              const conf = props?.payload?.confidence ?? 0;
              return [
                `${v} (conf: ${conf}% · ${getConfidenceLabel(conf)})`,
                "维度值",
              ];
            }}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>

      {/* Dimension detail grid with needle indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
        {entries.map(([key, dim]) => {
          const color = dim.value > 65 ? "#34d399" : dim.value < 35 ? "#f87171" : "#a1a1aa";
          const confColor = dim.confidence >= 70 ? "text-emerald-400" : dim.confidence >= 40 ? "text-amber-400" : "text-zinc-600";
          return (
            <div key={key} className="rounded-lg border border-zinc-800/60 bg-zinc-800/20 p-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] text-zinc-500 truncate">{dim.labelZh}</span>
                <span className="text-xs font-bold font-mono" style={{ color }}>{dim.value}</span>
              </div>
              {/* Needle gauge */}
              <div className="relative h-1.5 rounded-full bg-zinc-800 mt-1">
                <div className="absolute inset-0 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${dim.value}%`, background: `linear-gradient(to right, #3f3f46, ${color})`, opacity: 0.35 }} />
                </div>
                <div className="absolute top-[-1px] w-0.5 h-2.5 rounded-sm" style={{ left: `${dim.value}%`, transform: "translateX(-50%)", backgroundColor: color }} />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className={cn("text-[7px] font-mono", confColor)}>{dim.confidence}%</span>
                <span className="text-[7px] text-zinc-700">{getConfidenceLabel(dim.confidence)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
