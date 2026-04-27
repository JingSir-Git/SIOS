"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { EmotionPoint } from "@/lib/types";

interface EmotionChartProps {
  data: EmotionPoint[];
}

export default function EmotionChart({ data }: EmotionChartProps) {
  if (!data || data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis
          dataKey="label"
          tick={{ fill: "#71717a", fontSize: 10 }}
          interval={0}
          angle={-35}
          textAnchor="end"
          height={70}
          dy={5}
          tickFormatter={(v: string) => v && v.length > 8 ? v.slice(0, 8) + "…" : v}
        />
        <YAxis
          domain={[-1, 1]}
          tick={{ fill: "#71717a", fontSize: 10 }}
          tickFormatter={(v: number) =>
            v > 0 ? `+${v}` : v === 0 ? "0" : String(v)
          }
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#18181b",
            border: "1px solid #3f3f46",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          formatter={(value: unknown, name: unknown) => [
            (Number(value) || 0).toFixed(2),
            String(name) === "selfEmotion" ? "己方情绪" : "对方情绪",
          ]}
        />
        <ReferenceLine y={0} stroke="#3f3f46" strokeDasharray="5 5" />
        <Line
          type="monotone"
          dataKey="selfEmotion"
          stroke="#8b5cf6"
          strokeWidth={2}
          dot={{ r: 3, fill: "#8b5cf6" }}
          name="selfEmotion"
        />
        <Line
          type="monotone"
          dataKey="otherEmotion"
          stroke="#06b6d4"
          strokeWidth={2}
          dot={{ r: 3, fill: "#06b6d4" }}
          name="otherEmotion"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
