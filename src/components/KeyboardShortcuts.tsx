"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { Keyboard, X } from "lucide-react";

const TAB_ORDER = [
  "analyze",     // Ctrl+1
  "profiles",    // Ctrl+2
  "coach",       // Ctrl+3
  "simulate",    // Ctrl+4
  "eq-training", // Ctrl+5
  "strategy",    // Ctrl+6
  "psychology",  // Ctrl+7
  "planning",    // Ctrl+8
  "mbti",        // Ctrl+9
  "settings",    // Ctrl+0
];

const TAB_LABELS: Record<string, string> = {
  analyze: "对话分析",
  profiles: "人物画像",
  coach: "实时教练",
  simulate: "模拟对练",
  "eq-training": "情商训练",
  strategy: "策略规划",
  psychology: "心理顾问",
  planning: "规划制定",
  mbti: "MBTI 检测",
  settings: "数据管理",
};

export default function KeyboardShortcuts() {
  const { setActiveTab, toggleSidebar } = useAppStore();
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Skip if user is typing in an input/textarea/select
      const tag = (e.target as HTMLElement)?.tagName;
      const isEditable = (e.target as HTMLElement)?.isContentEditable;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || isEditable) return;

      // Ctrl/Cmd + 1-9 → switch tabs 1-9
      if ((e.ctrlKey || e.metaKey) && e.key >= "1" && e.key <= "9") {
        const idx = parseInt(e.key) - 1;
        if (idx < TAB_ORDER.length) {
          e.preventDefault();
          setActiveTab(TAB_ORDER[idx]);
        }
      }

      // Ctrl/Cmd + 0 → switch to last tab (settings)
      if ((e.ctrlKey || e.metaKey) && e.key === "0") {
        e.preventDefault();
        setActiveTab(TAB_ORDER[TAB_ORDER.length - 1]);
      }

      // Ctrl/Cmd + B → toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        toggleSidebar();
      }

      // ? or Ctrl+/ → toggle keyboard shortcuts help
      if (e.key === "?" || ((e.ctrlKey || e.metaKey) && e.key === "/")) {
        e.preventDefault();
        setShowHelp((prev) => !prev);
      }

      // Escape → close help
      if (e.key === "Escape" && showHelp) {
        setShowHelp(false);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setActiveTab, toggleSidebar, showHelp]);

  if (!showHelp) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200"
      onClick={() => setShowHelp(false)}
    >
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Keyboard className="h-4 w-4 text-violet-400" />
            <h2 className="text-sm font-semibold text-zinc-200">快捷键</h2>
          </div>
          <button
            onClick={() => setShowHelp(false)}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Tab Navigation */}
          <div>
            <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium mb-2">模块切换</h3>
            <div className="space-y-1">
              {TAB_ORDER.map((tab, idx) => (
                <div key={tab} className="flex items-center justify-between py-1">
                  <span className="text-xs text-zinc-300">{TAB_LABELS[tab]}</span>
                  <kbd className="px-1.5 py-0.5 rounded border border-zinc-700 bg-zinc-800 text-[10px] font-mono text-zinc-400">
                    Ctrl+{idx < 9 ? idx + 1 : 0}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          {/* General Shortcuts */}
          <div>
            <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium mb-2">通用操作</h3>
            <div className="space-y-1">
              {[
                { label: "切换侧边栏", key: "Ctrl+B" },
                { label: "显示快捷键帮助", key: "?" },
                { label: "关闭弹窗/面板", key: "Esc" },
              ].map(({ label, key }) => (
                <div key={key} className="flex items-center justify-between py-1">
                  <span className="text-xs text-zinc-300">{label}</span>
                  <kbd className="px-1.5 py-0.5 rounded border border-zinc-700 bg-zinc-800 text-[10px] font-mono text-zinc-400">
                    {key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-800 px-5 py-2.5">
          <p className="text-[10px] text-zinc-600 text-center">
            按 <kbd className="px-1 py-0.5 rounded border border-zinc-700 bg-zinc-800 text-[9px] font-mono text-zinc-500">Esc</kbd> 或点击外部关闭
          </p>
        </div>
      </div>
    </div>
  );
}
