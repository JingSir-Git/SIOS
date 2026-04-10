"use client";

import { useAppStore, type ThemeKey } from "@/lib/store";
import { THEME_LABELS } from "./ThemeProvider";
import {
  Type,
  Palette,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ApiSettingsPanel from "./ApiSettingsPanel";
import PrivacySettingsPanel from "./PrivacySettingsPanel";

const THEME_KEYS: ThemeKey[] = ["dark", "violet-dark", "green-eye", "sepia", "blue-night"];

const FONT_SIZE_LEVELS = [
  { value: 12, label: "紧凑", scale: 0.85 },
  { value: 13, label: "较小", scale: 0.92 },
  { value: 14, label: "标准", scale: 1.0 },
  { value: 16, label: "较大", scale: 1.1 },
  { value: 18, label: "超大", scale: 1.2 },
];

export default function UserPreferences() {
  const { fontSize, setFontSize, theme, setTheme } = useAppStore();
  const currentLevel = FONT_SIZE_LEVELS.find((l) => l.value === fontSize) || FONT_SIZE_LEVELS[2];

  return (
    <div className="space-y-6">
      {/* Font Size */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Type className="h-4 w-4 text-violet-400" />
            <h3 className="text-sm font-medium text-zinc-200">界面缩放</h3>
          </div>
          {fontSize !== 14 && (
            <button
              onClick={() => setFontSize(14)}
              className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-violet-400 transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              重置
            </button>
          )}
        </div>
        <div className="grid grid-cols-5 gap-2">
          {FONT_SIZE_LEVELS.map((level) => {
            const isActive = fontSize === level.value;
            return (
              <button
                key={level.value}
                onClick={() => setFontSize(level.value)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl p-3 border-2 transition-all",
                  isActive
                    ? "border-violet-500 bg-violet-500/10 shadow-lg shadow-violet-500/10"
                    : "border-zinc-700 hover:border-zinc-500 bg-zinc-800/30"
                )}
              >
                <span className={cn(
                  "font-medium",
                  isActive ? "text-violet-300" : "text-zinc-400"
                )} style={{ fontSize: `${Math.round(14 * level.scale)}px` }}>
                  Aa
                </span>
                <span className={cn(
                  "text-[10px] font-medium",
                  isActive ? "text-violet-300" : "text-zinc-500"
                )}>
                  {level.label}
                </span>
                <span className="text-[8px] text-zinc-600">
                  {Math.round(level.scale * 100)}%
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-zinc-600 mt-3">
          调整全局界面缩放等级，所有文字和元素会等比缩放。当前：{currentLevel.label}（{Math.round(currentLevel.scale * 100)}%）
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

      {/* API Settings */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <ApiSettingsPanel />
      </div>

      {/* Privacy & GDPR */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <PrivacySettingsPanel />
      </div>
    </div>
  );
}
