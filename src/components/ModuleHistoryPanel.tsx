"use client";

import { useState } from "react";
import {
  History,
  X,
  ChevronRight,
  Clock,
  Trash2,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore, type ModuleHistoryEntry } from "@/lib/store";

interface ModuleHistoryPanelProps {
  module: string;
  label: string;
  onLoadEntry: (entry: ModuleHistoryEntry) => void;
}

export default function ModuleHistoryPanel({
  module,
  label,
  onLoadEntry,
}: ModuleHistoryPanelProps) {
  const { getModuleHistory, clearModuleHistory } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const history = getModuleHistory(module);

  if (history.length === 0 && !isOpen) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-1.5 text-[11px] transition-colors px-2.5 py-1 rounded-lg border",
          isOpen
            ? "text-amber-300 border-amber-500/30 bg-amber-500/10"
            : "text-zinc-500 border-zinc-700 hover:text-zinc-300 hover:border-zinc-600"
        )}
      >
        <History className="h-3 w-3" />
        历史记录
        {history.length > 0 && (
          <span className="text-[9px] text-zinc-500">({history.length})</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 z-30 w-[calc(100vw-2rem)] sm:w-[400px] max-h-[70vh] sm:max-h-[420px] rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl shadow-black/40 overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-200">
          <div className="px-3 py-2 border-b border-zinc-800 flex items-center justify-between">
            <span className="text-[11px] text-zinc-400 font-medium">
              {label} — 历史记录（最近{history.length}次）
            </span>
            <div className="flex items-center gap-1.5">
              {history.length > 0 && (
                showClearConfirm ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { clearModuleHistory(module); setShowClearConfirm(false); }}
                      className="text-[9px] text-red-400 hover:text-red-300 px-1.5 py-0.5 rounded border border-red-500/30 bg-red-500/10"
                    >
                      确认清除
                    </button>
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="text-[9px] text-zinc-500 hover:text-zinc-400"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="text-zinc-600 hover:text-red-400 transition-colors"
                    title="清除历史"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )
              )}
              <button
                onClick={() => { setIsOpen(false); setShowClearConfirm(false); }}
                className="text-zinc-600 hover:text-zinc-400"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
          <div className="p-2 max-h-[360px] overflow-y-auto space-y-1">
            {history.length === 0 ? (
              <p className="text-[10px] text-zinc-600 text-center py-6">暂无历史记录</p>
            ) : (
              history.map((entry, idx) => (
                <button
                  key={entry.id}
                  onClick={() => { onLoadEntry(entry); setIsOpen(false); }}
                  className="w-full text-left rounded-lg px-3 py-2.5 hover:bg-zinc-800/70 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <Eye className="h-3 w-3 text-zinc-600 group-hover:text-violet-400 shrink-0" />
                    <span className="text-xs text-zinc-200 group-hover:text-white truncate flex-1">
                      {entry.title}
                    </span>
                    <span className="text-[9px] text-zinc-600 shrink-0">
                      #{idx + 1}
                    </span>
                    <ChevronRight className="h-3 w-3 text-zinc-700 group-hover:text-zinc-400 shrink-0" />
                  </div>
                  <div className="flex items-center gap-2 mt-1 ml-5">
                    <Clock className="h-2.5 w-2.5 text-zinc-700" />
                    <span className="text-[9px] text-zinc-600">
                      {new Date(entry.createdAt).toLocaleString("zh-CN", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {entry.summary && (
                      <span className="text-[9px] text-zinc-600 truncate">
                        · {entry.summary}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
