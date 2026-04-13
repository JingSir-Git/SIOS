"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { DIMENSION_KEYS, DIMENSION_LABELS, type DimensionKey } from "@/lib/types";
import { Grid3X3, ChevronDown, ChevronUp, Info } from "lucide-react";

function pearson(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 3) return 0;
  const mx = x.reduce((a, b) => a + b, 0) / n;
  const my = y.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    const xi = x[i] - mx, yi = y[i] - my;
    num += xi * yi; dx += xi * xi; dy += yi * yi;
  }
  const denom = Math.sqrt(dx * dy);
  return denom === 0 ? 0 : num / denom;
}

function corrColor(r: number): string {
  const a = Math.abs(r);
  if (r > 0) return a > 0.7 ? "bg-emerald-500/60" : a > 0.4 ? "bg-emerald-500/35" : a > 0.2 ? "bg-emerald-500/15" : "bg-zinc-800/50";
  return a > 0.7 ? "bg-red-500/60" : a > 0.4 ? "bg-red-500/35" : a > 0.2 ? "bg-red-500/15" : "bg-zinc-800/50";
}

export default function DimensionCorrelation() {
  const { profiles } = useAppStore();
  const [expanded, setExpanded] = useState(false);

  const { correlations, dimLabels, profileCount } = useMemo(() => {
    const valid = profiles.filter((p) => p.dimensions && Object.keys(p.dimensions).length > 0);
    const keys = DIMENSION_KEYS;
    const data: Record<string, number[]> = {};
    for (const k of keys) data[k] = [];
    for (const p of valid) {
      for (const k of keys) {
        const d = (p.dimensions as Record<string, { value: number }>)?.[k];
        data[k].push(d?.value ?? 50);
      }
    }
    const n = keys.length;
    const corr: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      for (let j = i; j < n; j++) {
        const r = i === j ? 1 : pearson(data[keys[i]], data[keys[j]]);
        corr[i][j] = r; corr[j][i] = r;
      }
    }
    return { correlations: corr, dimLabels: keys.map((k) => DIMENSION_LABELS[k].zh), profileCount: valid.length };
  }, [profiles]);

  if (profileCount < 3) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Grid3X3 className="h-4 w-4 text-violet-400" />
          <span className="text-xs font-semibold text-zinc-300">维度相关性矩阵</span>
        </div>
        <p className="text-[10px] text-zinc-600">至少需要 3 个画像 (当前: {profileCount})</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800/30 transition-colors">
        <div className="flex items-center gap-2">
          <Grid3X3 className="h-4 w-4 text-violet-400" />
          <span className="text-xs font-semibold text-zinc-300">维度相关性矩阵</span>
          <span className="text-[9px] text-zinc-600 ml-1">({profileCount} 个画像)</span>
        </div>
        {expanded ? <ChevronUp className="h-3.5 w-3.5 text-zinc-500" /> : <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />}
      </button>
      {expanded && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-3 mb-3 text-[9px] text-zinc-500">
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-emerald-500/60" /><span>正相关</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-500/60" /><span>负相关</span></div>
            <div className="flex items-center gap-1"><Info className="h-3 w-3" /><span>Pearson r</span></div>
          </div>
          <div className="overflow-x-auto">
            <table className="border-collapse">
              <thead>
                <tr>
                  <th className="w-16" />
                  {dimLabels.map((l, i) => (
                    <th key={i} className="text-[8px] text-zinc-500 font-normal px-1 py-1 text-center min-w-[38px]">{l.slice(0, 3)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DIMENSION_KEYS.map((_, row) => (
                  <tr key={row}>
                    <td className="text-[9px] text-zinc-400 text-right pr-2 whitespace-nowrap">{dimLabels[row]}</td>
                    {DIMENSION_KEYS.map((_, col) => {
                      const r = correlations[row][col];
                      const diag = row === col;
                      return (
                        <td key={col} className={cn("text-center text-[9px] px-1 py-1.5 rounded-sm transition-colors", diag ? "bg-zinc-700/30" : corrColor(r))}>
                          <span className={cn(diag ? "text-zinc-600" : Math.abs(r) > 0.5 ? "text-zinc-100 font-bold" : Math.abs(r) > 0.3 ? "text-zinc-300" : "text-zinc-500")}>
                            {diag ? "—" : r.toFixed(2)}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[8px] text-zinc-600 mt-2 italic">基于 {profileCount} 个画像的 {DIMENSION_KEYS.length} 维度交叉相关分析</p>
        </div>
      )}
    </div>
  );
}
