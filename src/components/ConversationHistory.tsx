"use client";

import { useState } from "react";
import {
  History,
  Search,
  Clock,
  Trash2,
  ChevronRight,
  MessageSquare,
  X,
  AlertTriangle,
  RotateCcw,
  Eye,
  Play,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import ConversationReplay from "./ConversationReplay";
import { autoTagConversation, getTagColor } from "@/lib/auto-tag";

interface ConversationHistoryProps {
  onClose: () => void;
  onLoadConversation: (convoId: string) => void;
  onReAnalyze?: (convoId: string) => void;
}

export default function ConversationHistory({
  onClose,
  onLoadConversation,
  onReAnalyze,
}: ConversationHistoryProps) {
  const { conversations, deleteConversation } = useAppStore();
  const [search, setSearch] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [replayConvoId, setReplayConvoId] = useState<string | null>(null);

  const replayConvo = replayConvoId ? conversations.find((c) => c.id === replayConvoId) : null;

  const filtered = search.trim()
    ? conversations.filter(
        (c) =>
          c.title.includes(search) ||
          c.participants?.some((p) => p.includes(search))
      )
    : conversations;

  // Sort by date descending
  const sorted = [...filtered].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-sm overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-violet-400" />
          <h3 className="text-sm font-medium text-zinc-200">
            分析历史
            {conversations.length > 0 && (
              <span className="ml-1.5 text-[10px] text-zinc-500 font-normal">
                ({conversations.length})
              </span>
            )}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Search */}
      {conversations.length > 3 && (
        <div className="px-4 py-2 border-b border-zinc-800/50">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-600" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索对话..."
              className="w-full rounded-lg border border-zinc-700/50 bg-zinc-800/50 pl-8 pr-3 py-1.5 text-[11px] text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50"
            />
          </div>
        </div>
      )}

      {/* Conversation List */}
      <div className="max-h-[360px] overflow-y-auto">
        {sorted.length === 0 ? (
          <div className="text-center py-8 px-4">
            <MessageSquare className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
            <p className="text-[11px] text-zinc-500">
              {search ? "未找到匹配的分析记录" : "暂无分析记录"}
            </p>
            <p className="text-[10px] text-zinc-600 mt-1">
              完成对话分析并保存后，记录会出现在这里
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {sorted.map((convo) => (
              <div
                key={convo.id}
                className="group rounded-lg hover:bg-zinc-800/50 transition-colors"
              >
                {deleteConfirmId === convo.id ? (
                  <div className="flex items-center gap-2 px-3 py-2.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                    <span className="text-[11px] text-red-300 flex-1">确认删除？</span>
                    <button
                      onClick={() => {
                        deleteConversation(convo.id);
                        setDeleteConfirmId(null);
                      }}
                      className="px-2 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    >
                      删除
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="px-2 py-0.5 rounded text-[10px] bg-zinc-700 text-zinc-400 hover:bg-zinc-600"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => onLoadConversation(convo.id)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onLoadConversation(convo.id); }}
                    className="flex items-center gap-3 w-full text-left px-3 py-2.5 cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-zinc-300 truncate">
                          {convo.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1 text-[10px] text-zinc-600">
                          <Clock className="h-2.5 w-2.5" />
                          {formatDate(convo.createdAt)}
                        </span>
                        {convo.analysis?.summary && (
                          <span className="text-[10px] text-zinc-600 truncate max-w-[200px]">
                            {convo.analysis.summary.slice(0, 40)}...
                          </span>
                        )}
                      </div>
                      {(() => {
                        const tags = convo.tags || autoTagConversation(convo);
                        return tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {tags.slice(0, 5).map((tag) => (
                              <span key={tag} className={cn("text-[8px] px-1.5 py-0 rounded-full border", getTagColor(tag))}>{tag}</span>
                            ))}
                          </div>
                        ) : null;
                      })()}
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      {convo.rawText && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setReplayConvoId(convo.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded text-zinc-600 hover:text-emerald-400 transition-all"
                          title="回放对话"
                        >
                          <Play className="h-3 w-3" />
                        </button>
                      )}
                      {convo.rawText && onReAnalyze && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onReAnalyze(convo.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded text-zinc-600 hover:text-violet-400 transition-all"
                          title="重新分析"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(convo.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-zinc-600 hover:text-red-400 transition-all"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Conversation Replay Overlay */}
      {replayConvo && (
        <div className="mt-3">
          <ConversationReplay
            conversation={replayConvo}
            onClose={() => setReplayConvoId(null)}
          />
        </div>
      )}
    </div>
  );
}
