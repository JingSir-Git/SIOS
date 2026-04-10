"use client";

import { useState } from "react";
import {
  Brain,
  Plus,
  Trash2,
  CheckCircle2,
  Archive,
  Edit3,
  Star,
  Calendar,
  Tag,
  ChevronDown,
  ChevronUp,
  X,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { createUserMemory } from "@/lib/memory-utils";
import type { MemoryCategory, ProfileMemoryEntry } from "@/lib/types";

const CATEGORY_CONFIG: Record<MemoryCategory, { label: string; color: string; icon: string }> = {
  key_event: { label: "重要事件", color: "text-amber-400 bg-amber-500/10 border-amber-500/30", icon: "⚡" },
  pattern_change: { label: "模式变化", color: "text-blue-400 bg-blue-500/10 border-blue-500/30", icon: "🔄" },
  commitment: { label: "承诺追踪", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30", icon: "🤝" },
  preference: { label: "偏好记录", color: "text-pink-400 bg-pink-500/10 border-pink-500/30", icon: "💡" },
  relationship_shift: { label: "关系转折", color: "text-violet-400 bg-violet-500/10 border-violet-500/30", icon: "💫" },
  insight: { label: "深层洞察", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30", icon: "🔍" },
  user_note: { label: "用户备注", color: "text-zinc-400 bg-zinc-500/10 border-zinc-500/30", icon: "📝" },
};

interface Props {
  profileId: string;
  profileName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileMemoryPanel({ profileId, profileName, isOpen, onClose }: Props) {
  const { getMemoriesForProfile, addMemory, updateMemory, deleteMemory } = useAppStore();
  const [filterCategory, setFilterCategory] = useState<MemoryCategory | "all">("all");
  const [showArchived, setShowArchived] = useState(false);
  const [addingNew, setAddingNew] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<MemoryCategory>("user_note");
  const [newImportance, setNewImportance] = useState(3);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [expanded, setExpanded] = useState(true);

  if (!isOpen) return null;

  const allMemories = getMemoriesForProfile(profileId);
  const filteredMemories = allMemories
    .filter((m) => {
      if (!showArchived && m.archived) return false;
      if (filterCategory !== "all" && m.category !== filterCategory) return false;
      return true;
    })
    .sort((a, b) => b.importance - a.importance || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleAdd = () => {
    if (!newContent.trim()) return;
    const entry = createUserMemory(profileId, newContent.trim(), newCategory, newImportance);
    addMemory(entry);
    setNewContent("");
    setAddingNew(false);
    setNewCategory("user_note");
    setNewImportance(3);
  };

  const handleEdit = (id: string) => {
    updateMemory(id, { content: editContent.trim() });
    setEditingId(null);
    setEditContent("");
  };

  const handleVerify = (mem: ProfileMemoryEntry) => {
    updateMemory(mem.id, { verified: !mem.verified });
  };

  const handleArchive = (mem: ProfileMemoryEntry) => {
    updateMemory(mem.id, { archived: !mem.archived });
  };

  const activeCount = allMemories.filter((m) => !m.archived).length;
  const archivedCount = allMemories.filter((m) => m.archived).length;

  return (
    <div className="border border-zinc-800 rounded-xl bg-zinc-900/80 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-zinc-800/50 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-violet-400" />
          <span className="text-sm font-medium text-zinc-200">
            AI记忆 — {profileName}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300">
            {activeCount}条
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="p-1 rounded hover:bg-zinc-700 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          {expanded ? <ChevronUp className="h-3.5 w-3.5 text-zinc-500" /> : <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />}
        </div>
      </div>

      {expanded && (
        <div className="p-4 space-y-3">
          {/* Filters */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setFilterCategory("all")}
              className={cn(
                "text-[10px] px-2 py-1 rounded-full border transition-colors",
                filterCategory === "all"
                  ? "bg-zinc-700 border-zinc-600 text-zinc-200"
                  : "border-zinc-800 text-zinc-500 hover:text-zinc-300"
              )}
            >
              全部
            </button>
            {(Object.entries(CATEGORY_CONFIG) as [MemoryCategory, typeof CATEGORY_CONFIG[MemoryCategory]][]).map(([cat, cfg]) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={cn(
                  "text-[10px] px-2 py-1 rounded-full border transition-colors",
                  filterCategory === cat
                    ? cfg.color
                    : "border-zinc-800 text-zinc-500 hover:text-zinc-300"
                )}
              >
                {cfg.icon} {cfg.label}
              </button>
            ))}
          </div>

          {/* Archive toggle */}
          {archivedCount > 0 && (
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {showArchived ? "隐藏" : "显示"} {archivedCount} 条已归档记忆
            </button>
          )}

          {/* Memory list */}
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {filteredMemories.length === 0 ? (
              <p className="text-xs text-zinc-600 text-center py-4">
                暂无记忆记录。分析对话后会自动生成，或手动添加。
              </p>
            ) : (
              filteredMemories.map((mem) => {
                const cfg = CATEGORY_CONFIG[mem.category];
                const isEditing = editingId === mem.id;

                return (
                  <div
                    key={mem.id}
                    className={cn(
                      "rounded-lg border p-3 transition-colors",
                      mem.archived
                        ? "border-zinc-800/50 bg-zinc-900/50 opacity-60"
                        : "border-zinc-800 bg-zinc-900/80"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {/* Category badge + importance */}
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn("text-[10px] px-1.5 py-0.5 rounded border", cfg.color)}>
                            {cfg.icon} {cfg.label}
                          </span>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  "h-2.5 w-2.5",
                                  i < mem.importance ? "text-amber-400 fill-amber-400" : "text-zinc-700"
                                )}
                              />
                            ))}
                          </div>
                          {mem.verified && (
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          )}
                        </div>

                        {/* Content */}
                        {isEditing ? (
                          <div className="flex gap-2 mt-1">
                            <input
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="flex-1 text-xs bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-zinc-200 focus:outline-none focus:border-violet-500"
                              onKeyDown={(e) => { if (e.key === "Enter") handleEdit(mem.id); if (e.key === "Escape") setEditingId(null); }}
                              autoFocus
                            />
                            <button onClick={() => handleEdit(mem.id)} className="text-emerald-400 hover:text-emerald-300">
                              <Save className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <p className="text-xs text-zinc-300 leading-relaxed">{mem.content}</p>
                        )}

                        {/* Meta */}
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="flex items-center gap-1 text-[10px] text-zinc-600">
                            <Calendar className="h-2.5 w-2.5" />
                            {new Date(mem.createdAt).toLocaleDateString("zh-CN")}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-zinc-600">
                            <Tag className="h-2.5 w-2.5" />
                            {mem.source}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1 shrink-0">
                        <button
                          onClick={() => handleVerify(mem)}
                          title={mem.verified ? "取消确认" : "确认准确"}
                          className={cn(
                            "p-1 rounded transition-colors",
                            mem.verified
                              ? "text-emerald-400 hover:text-emerald-300 bg-emerald-500/10"
                              : "text-zinc-600 hover:text-zinc-300"
                          )}
                        >
                          <CheckCircle2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => { setEditingId(mem.id); setEditContent(mem.content); }}
                          title="编辑"
                          className="p-1 rounded text-zinc-600 hover:text-zinc-300 transition-colors"
                        >
                          <Edit3 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleArchive(mem)}
                          title={mem.archived ? "取消归档" : "归档"}
                          className="p-1 rounded text-zinc-600 hover:text-zinc-300 transition-colors"
                        >
                          <Archive className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => deleteMemory(mem.id)}
                          title="删除"
                          className="p-1 rounded text-zinc-600 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Add new memory */}
          {addingNew ? (
            <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-3 space-y-2">
              <div className="flex gap-2">
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as MemoryCategory)}
                  className="text-[10px] bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-zinc-300"
                >
                  {(Object.entries(CATEGORY_CONFIG) as [MemoryCategory, typeof CATEGORY_CONFIG[MemoryCategory]][]).map(([cat, cfg]) => (
                    <option key={cat} value={cat}>{cfg.icon} {cfg.label}</option>
                  ))}
                </select>
                <select
                  value={newImportance}
                  onChange={(e) => setNewImportance(Number(e.target.value))}
                  className="text-[10px] bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-zinc-300"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{"★".repeat(n)}{"☆".repeat(5 - n)}</option>
                  ))}
                </select>
              </div>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="输入记忆内容，例如：对方承诺下周五前给报价单..."
                className="w-full text-xs bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-zinc-200 resize-none focus:outline-none focus:border-violet-500"
                rows={2}
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setAddingNew(false)}
                  className="text-[10px] px-3 py-1 rounded bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!newContent.trim()}
                  className="text-[10px] px-3 py-1 rounded bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50 transition-colors"
                >
                  添加
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingNew(true)}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-zinc-700 py-2 text-xs text-zinc-500 hover:text-violet-400 hover:border-violet-500/50 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              手动添加记忆
            </button>
          )}
        </div>
      )}
    </div>
  );
}
