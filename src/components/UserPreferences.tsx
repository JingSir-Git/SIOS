"use client";

import { useAppStore, type ThemeKey } from "@/lib/store";
import { THEME_LABELS } from "./ThemeProvider";
import {
  Type,
  Palette,
  Minus,
  Plus,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

const THEME_KEYS: ThemeKey[] = ["dark", "violet-dark", "green-eye", "sepia", "blue-night"];

export default function UserPreferences() {
  const { fontSize, setFontSize, theme, setTheme } = useAppStore();

  return (
    <div className="space-y-6">
      {/* Font Size */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Type className="h-4 w-4 text-violet-400" />
          <h3 className="text-sm font-medium text-zinc-200">字体大小</h3>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setFontSize(fontSize - 1)}
            disabled={fontSize <= 12}
            className={cn(
              "rounded-lg p-2 border transition-colors",
              fontSize <= 12
                ? "border-zinc-800 text-zinc-600 cursor-not-allowed"
                : "border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            )}
          >
            <Minus className="h-4 w-4" />
          </button>
          <div className="flex-1">
            <input
              type="range"
              min={12}
              max={20}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full accent-violet-500 h-1.5 rounded-full bg-zinc-700 appearance-none cursor-pointer"
            />
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-zinc-600">12px</span>
              <span className="text-xs font-mono text-violet-400 font-medium">{fontSize}px</span>
              <span className="text-[10px] text-zinc-600">20px</span>
            </div>
          </div>
          <button
            onClick={() => setFontSize(fontSize + 1)}
            disabled={fontSize >= 20}
            className={cn(
              "rounded-lg p-2 border transition-colors",
              fontSize >= 20
                ? "border-zinc-800 text-zinc-600 cursor-not-allowed"
                : "border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            )}
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            onClick={() => setFontSize(14)}
            className="rounded-lg p-2 border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            title="重置为默认"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="text-[10px] text-zinc-600 mt-3">
          调整全局字体大小。预览效果实时生效，默认为 14px。
        </p>
      </div>

      {/* Theme */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="h-4 w-4 text-violet-400" />
          <h3 className="text-sm font-medium text-zinc-200">主题配色</h3>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {THEME_KEYS.map((key) => {
            const info = THEME_LABELS[key];
            const isActive = theme === key;
            return (
              <button
                key={key}
                onClick={() => setTheme(key)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl p-3 border-2 transition-all",
                  isActive
                    ? "border-violet-500 bg-violet-500/10 shadow-lg shadow-violet-500/10"
                    : "border-zinc-700 hover:border-zinc-500 bg-zinc-800/30"
                )}
              >
                <div
                  className="h-8 w-8 rounded-full border-2 border-zinc-600 shadow-inner"
                  style={{ backgroundColor: info.preview }}
                />
                <span className={cn(
                  "text-[10px] font-medium",
                  isActive ? "text-violet-300" : "text-zinc-400"
                )}>
                  {info.label}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-zinc-600 mt-3">
          选择你偏好的界面配色方案。护眼模式可降低长时间使用的视觉疲劳。
        </p>
      </div>
    </div>
  );
}
