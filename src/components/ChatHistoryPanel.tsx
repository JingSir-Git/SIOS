"use client";

import { useState, useMemo, useCallback } from "react";
import {
  History,
  Search,
  Plus,
  Trash2,
  MessageSquare,
  ChevronRight,
  Archive,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import type { ChatSessionDomain, ChatSessionEntry } from "@/lib/types";

interface ChatHistoryPanelProps {
  domain: ChatSessionDomain;
  activeSessionId: string | null;
  onSelectSession: (session: ChatSessionEntry) => void;
  onNewSession: () => void;
  /** Optional: divination sub-category for filtering */
  divinationCategory?: string;
}

const DOMAIN_LABELS: Record<ChatSessionDomain, string> = {
  legal: "法律顾问",
  psychology: "心理顾问",
  divination: "占卜",
};

const DOMAIN_COLORS: Record<ChatSessionDomain, { accent: string; bg: string; border: string }> = {
  legal: { accent: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  psychology: { accent: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/20" },
  divination: { accent: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
};

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const d = new Date(dateStr).getTime();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "刚刚";
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}天前`;
  return new Date(dateStr).toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}

function getSessionPreview(session: ChatSessionEntry): string {
  if (session.summary) return session.summary;
  const lastUserMsg = [...session.messages].reverse().find((m) => m.role === "user");
  if (lastUserMsg) return lastUserMsg.content.slice(0, 60) + (lastUserMsg.content.length > 60 ? "..." : "");
  return "空对话";
}

export default function ChatHistoryPanel({
  domain,
  activeSessionId,
  onSelectSession,
  onNewSession,
  divinationCategory,
}: ChatHistoryPanelProps) {
  const { chatSessions, deleteChatSession, updateChatSession } = useAppStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const colors = DOMAIN_COLORS[domain];

  const sessions = useMemo(() => {
    let filtered = (chatSessions ?? []).filter((s) => s.domain === domain && !s.archived);
    if (divinationCategory) {
      filtered = filtered.filter((s) => s.divinationCategory === divinationCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.messages.some((m) => m.content.toLowerCase().includes(q))
      );
    }
    return filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [chatSessions, domain, divinationCategory, searchQuery]);

  const handleDelete = useCallback(
    (id: string) => {
      deleteChatSession(id);
      setConfirmDeleteId(null);
    },
    [deleteChatSession]
  );

  const handleArchive = useCallback(
    (id: string) => {
      updateChatSession(id, { archived: true });
    },
    [updateChatSession]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800/60">
        <div className="flex items-center gap-1.5">
          <History className={cn("h-3.5 w-3.5", colors.accent)} />
          <span className="text-xs font-medium text-zinc-300">历史会话</span>
          <span className="text-[9px] text-zinc-600">({sessions.length})</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-1 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
            title="搜索"
          >
            <Search className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onNewSession}
            className={cn("p-1 rounded-md hover:bg-zinc-800 transition-colors", colors.accent)}
            title="新建会话"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="px-3 py-1.5 border-b border-zinc-800/40">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-600" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索会话内容..."
              autoFocus
              className="w-full pl-7 pr-7 py-1 bg-zinc-900 border border-zinc-800 rounded-md text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Session list */}
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center px-4">
            <MessageSquare className="h-6 w-6 text-zinc-700 mb-2" />
            <p className="text-xs text-zinc-600">
              {searchQuery ? "没有匹配的会话" : `暂无${DOMAIN_LABELS[domain]}历史会话`}
            </p>
            {!searchQuery && (
              <button
                onClick={onNewSession}
                className={cn("mt-2 text-[10px] px-3 py-1 rounded-md border transition-colors", colors.bg, colors.border, colors.accent)}
              >
                开始新对话
              </button>
            )}
          </div>
        ) : (
          <div className="py-1">
            {sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const msgCount = session.messages.length;
              return (
                <div
                  key={session.id}
                  className={cn(
                    "group relative mx-1.5 my-0.5 rounded-lg px-3 py-2 cursor-pointer transition-all",
                    isActive
                      ? `${colors.bg} ${colors.border} border`
                      : "hover:bg-zinc-800/50 border border-transparent"
                  )}
                  onClick={() => onSelectSession(session)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={cn("text-xs font-medium truncate", isActive ? colors.accent : "text-zinc-300")}>
                          {session.title}
                        </span>
                        {isActive && <ChevronRight className={cn("h-3 w-3 flex-shrink-0", colors.accent)} />}
                      </div>
                      <p className="text-[10px] text-zinc-600 truncate mt-0.5">
                        {getSessionPreview(session)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                      <span className="text-[9px] text-zinc-700">{formatRelativeTime(session.updatedAt)}</span>
                      <span className="text-[8px] text-zinc-700">{msgCount}条</span>
                    </div>
                  </div>

                  {/* Actions on hover */}
                  <div className="absolute right-1 top-1 hidden group-hover:flex items-center gap-0.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleArchive(session.id); }}
                      className="p-0.5 rounded text-zinc-600 hover:text-amber-400 transition-colors"
                      title="归档"
                    >
                      <Archive className="h-3 w-3" />
                    </button>
                    {confirmDeleteId === session.id ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(session.id); }}
                        className="px-1.5 py-0.5 rounded text-[9px] bg-red-500/20 text-red-400 hover:bg-red-500/30"
                      >
                        确认
                      </button>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(session.id); }}
                        className="p-0.5 rounded text-zinc-600 hover:text-red-400 transition-colors"
                        title="删除"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
