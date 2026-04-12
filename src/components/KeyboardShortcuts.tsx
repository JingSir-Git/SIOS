"use client";

import { useEffect, useState, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import { Keyboard, X, Command } from "lucide-react";

// ---- Tab navigation matching Sidebar NAV_ITEMS order ----
const TAB_SHORTCUTS = [
  { id: "dashboard",   label: "数据大盘",   key: "1" },
  { id: "analyze",     label: "对话分析",   key: "2" },
  { id: "profiles",    label: "人物画像",   key: "3" },
  { id: "drill",       label: "模拟演练",   key: "4" },
  { id: "psychology",  label: "心理顾问",   key: "5" },
  { id: "legal",       label: "法律顾问",   key: "6" },
  { id: "planning",    label: "规划制定",   key: "7" },
  { id: "divination",  label: "风水玄学",   key: "8" },
  { id: "mbti",        label: "MBTI 检测",  key: "9" },
  { id: "settings",    label: "数据管理",   key: "0" },
];

const GENERAL_SHORTCUTS = [
  { label: "切换侧边栏",       key: "Ctrl+B",   display: ["Ctrl", "B"] },
  { label: "快捷键帮助",       key: "?",         display: ["?"] },
  { label: "关闭弹窗 / 面板",  key: "Esc",       display: ["Esc"] },
  { label: "新建对话 / 重置",  key: "Ctrl+N",    display: ["Ctrl", "N"] },
  { label: "搜索 / 跳转",      key: "Ctrl+K",    display: ["Ctrl", "K"] },
];

// Detect macOS for display
const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
const modLabel = isMac ? "⌘" : "Ctrl";

function Kbd({ children }: { children: string }) {
  const display = children === "Ctrl" ? modLabel : children;
  return (
    <kbd className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-md border border-zinc-700 bg-zinc-800/80 text-[10px] font-mono text-zinc-400 shadow-sm">
      {display}
    </kbd>
  );
}

export default function KeyboardShortcuts() {
  const { setActiveTab, toggleSidebar } = useAppStore();
  const [showHelp, setShowHelp] = useState(false);

  const handleAction = useCallback((action: string) => {
    switch (action) {
      case "toggle-help":
        setShowHelp((prev) => !prev);
        break;
      case "close-help":
        setShowHelp(false);
        break;
      case "toggle-sidebar":
        toggleSidebar();
        break;
      default:
        if (action.startsWith("tab:")) {
          setActiveTab(action.slice(4));
        }
    }
  }, [setActiveTab, toggleSidebar]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const isEditable = (e.target as HTMLElement)?.isContentEditable;
      const mod = e.ctrlKey || e.metaKey;

      // Always process Escape
      if (e.key === "Escape") {
        if (showHelp) {
          e.preventDefault();
          handleAction("close-help");
        }
        return;
      }

      // Skip shortcuts when typing in form fields (except mod combos)
      if (!mod && (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || isEditable)) return;

      // Mod + digit → tab navigation
      if (mod && e.key >= "0" && e.key <= "9") {
        const shortcut = TAB_SHORTCUTS.find((s) => s.key === e.key);
        if (shortcut) {
          e.preventDefault();
          handleAction(`tab:${shortcut.id}`);
        }
        return;
      }

      // Mod + B → toggle sidebar
      if (mod && e.key.toLowerCase() === "b") {
        e.preventDefault();
        handleAction("toggle-sidebar");
        return;
      }

      // Mod + N → new/reset (dispatch custom event for active tab to handle)
      if (mod && e.key.toLowerCase() === "n") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("sios:reset"));
        return;
      }

      // Mod + K → search/jump (dispatch custom event)
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("sios:search"));
        return;
      }

      // ? or Mod+/ → help (only outside form fields)
      if (tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT" && !isEditable) {
        if (e.key === "?" || (mod && e.key === "/")) {
          e.preventDefault();
          handleAction("toggle-help");
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleAction, showHelp]);

  if (!showHelp) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200"
      onClick={() => setShowHelp(false)}
    >
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Keyboard className="h-4 w-4 text-violet-400" />
            <h2 className="text-sm font-semibold text-zinc-200">键盘快捷键</h2>
            <span className="text-[10px] text-zinc-600 ml-1">Keyboard Shortcuts</span>
          </div>
          <button
            onClick={() => setShowHelp(false)}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[65vh] overflow-y-auto">
          {/* Module Navigation */}
          <div>
            <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium mb-2.5 flex items-center gap-1.5">
              <Command className="h-3 w-3" /> 模块导航
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
              {TAB_SHORTCUTS.map((shortcut) => (
                <button
                  key={shortcut.id}
                  onClick={() => { handleAction(`tab:${shortcut.id}`); setShowHelp(false); }}
                  className="flex items-center justify-between py-1.5 px-2 -mx-2 rounded-lg hover:bg-zinc-800/50 transition-colors group"
                >
                  <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors">{shortcut.label}</span>
                  <span className="flex items-center gap-0.5">
                    <Kbd>Ctrl</Kbd>
                    <span className="text-zinc-600 text-[9px] mx-0.5">+</span>
                    <Kbd>{shortcut.key}</Kbd>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* General Actions */}
          <div>
            <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium mb-2.5 flex items-center gap-1.5">
              <Keyboard className="h-3 w-3" /> 通用操作
            </h3>
            <div className="space-y-1">
              {GENERAL_SHORTCUTS.map(({ label, display }) => (
                <div key={label} className="flex items-center justify-between py-1.5 px-2 -mx-2 rounded-lg">
                  <span className="text-xs text-zinc-400">{label}</span>
                  <span className="flex items-center gap-0.5">
                    {display.map((k, i) => (
                      <span key={i} className="flex items-center gap-0.5">
                        {i > 0 && <span className="text-zinc-600 text-[9px] mx-0.5">+</span>}
                        <Kbd>{k}</Kbd>
                      </span>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Context Tips */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-3">
            <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium mb-2">使用提示</h3>
            <ul className="space-y-1 text-[10px] text-zinc-500 leading-relaxed">
              <li>• 在输入框中，{modLabel}+组合键仍然可用</li>
              <li>• {modLabel}+N 可以在当前模块中重置/新建对话</li>
              <li>• 模块导航中的条目可以直接点击跳转</li>
              {isMac && <li>• Mac 用户可使用 ⌘ 替代 Ctrl</li>}
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-800 px-5 py-2.5 flex items-center justify-between">
          <p className="text-[10px] text-zinc-600">
            按 <Kbd>Esc</Kbd> 或点击外部关闭
          </p>
          <p className="text-[10px] text-zinc-600">
            按 <Kbd>?</Kbd> 切换显示
          </p>
        </div>
      </div>
    </div>
  );
}
