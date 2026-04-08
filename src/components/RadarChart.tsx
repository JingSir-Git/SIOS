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

interface RadarChartProps {
  dimensions: Record<string, ProfileDimension>;
}

export default function RadarChart({ dimensions }: RadarChartProps) {
  const data = Object.entries(dimensions).map(([key, dim]) => ({
    dimension: dim.labelZh || key,
    value: dim.value,
    confidence: dim.confidence,
    fullMark: 100,
  }));

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={320}>
        <RechartsRadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke="#27272a" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: "#a1a1aa", fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: "#52525b", fontSize: 10 }}
            axisLine={false}
          />
          <Radar
            name="画像值"
            dataKey="value"
            stroke="#8b5cf6"
            fill="#8b5cf6"
            fillOpacity={0.2}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value: unknown, _name: unknown, props: unknown) => {
              const v = Number(value) || 0;
              const p = props as { payload?: { confidence?: number } } | undefined;
              const conf = p?.payload?.confidence ?? 0;
              return [
                `${v}分 (置信度: ${conf}% - ${getConfidenceLabel(conf)})`,
                "画像值",
              ];
            }}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>

      {/* Confidence legend */}
      <div className="mt-2 flex flex-wrap gap-3 justify-center">
        {Object.entries(dimensions).map(([key, dim]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div
              className={`h-2 w-2 rounded-full ${
                dim.confidence >= 70
                  ? "bg-emerald-400"
                  : dim.confidence >= 40
                  ? "bg-amber-400"
                  : "bg-zinc-600"
              }`}
            />
            <span className="text-[10px] text-zinc-500">{dim.labelZh}</span>
            <span
              className={`text-[10px] font-mono ${getConfidenceColor(
                dim.confidence
              )}`}
            >
              {dim.confidence}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
