"use client";

import { useState } from "react";
import {
  Brain,
  Plus,
  X,
  Trash2,
  Archive,
  Clock,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import type { UserMemoryCategory } from "@/lib/types";

const CATEGORY_CONFIG: { id: UserMemoryCategory; label: string; color: string; emoji: string }[] = [
  { id: "preference", label: "偏好", color: "text-violet-400", emoji: "⚙️" },
  { id: "family", label: "家庭", color: "text-rose-400", emoji: "👨‍👩‍👧‍👦" },
  { id: "work", label: "工作", color: "text-blue-400", emoji: "💼" },
  { id: "health", label: "健康", color: "text-emerald-400", emoji: "🏥" },
  { id: "legal", label: "法律", color: "text-amber-400", emoji: "⚖️" },
  { id: "psychology", label: "心理", color: "text-pink-400", emoji: "🧠" },
  { id: "divination", label: "玄学", color: "text-indigo-400", emoji: "🔮" },
  { id: "general", label: "通用", color: "text-zinc-400", emoji: "📝" },
];

export default function UserMemoryPanel() {
  const { userMemories, addUserMemory, updateUserMemory, deleteUserMemory } = useAppStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<UserMemoryCategory>("general");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const activeMemories = userMemories.filter((m) => !m.archived);
  const archivedCount = userMemories.filter((m) => m.archived).length;
  const filtered = filterCategory === "all"
    ? activeMemories
    : activeMemories.filter((m) => m.category === filterCategory);

  const handleAdd = () => {
    if (!newContent.trim()) return;
    addUserMemory({
      id: `user_${Date.now()}`,
      category: newCategory,
      content: newContent.trim(),
      source: "用户手动添加",
      importance: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archived: false,
    });
    setNewContent("");
    setShowAdd(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <Brain className="h-4 w-4 text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-200">AI 长期记忆</h3>
            <p className="text-[9px] text-zinc-500">
              跨对话的持久上下文 · {activeMemories.length} 条活跃记忆
              {archivedCount > 0 && ` · ${archivedCount} 条已归档`}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className={cn(
            "flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all border",
            showAdd
              ? "bg-violet-500/10 text-violet-300 border-violet-500/30"
              : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-300"
          )}
        >
          {showAdd ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
          {showAdd ? "取消" : "添加记忆"}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3 space-y-2">
          <div className="flex gap-2">
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as UserMemoryCategory)}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-[10px] text-zinc-300 focus:outline-none"
            >
              {CATEGORY_CONFIG.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="输入需要AI记住的信息..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-[10px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50"
            />
            <button
              onClick={handleAdd}
              disabled={!newContent.trim()}
              className="px-3 py-1 rounded-lg bg-violet-500/20 text-violet-300 text-[10px] font-medium hover:bg-violet-500/30 disabled:opacity-30 transition-all"
            >
              保存
            </button>
          </div>
          <p className="text-[9px] text-zinc-600">
            例如：我是一名程序员、家里有两个孩子、我对合同纠纷比较关注
          </p>
        </div>
      )}

      {/* Category filter */}
      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => setFilterCategory("all")}
          className={cn(
            "px-2 py-0.5 rounded-md text-[9px] transition-all",
            filterCategory === "all"
              ? "bg-violet-500/15 text-violet-300 border border-violet-500/30"
              : "text-zinc-500 hover:text-zinc-400"
          )}
        >
          全部 ({activeMemories.length})
        </button>
        {CATEGORY_CONFIG.map((c) => {
          const count = activeMemories.filter((m) => m.category === c.id).length;
          if (count === 0) return null;
          return (
            <button
              key={c.id}
              onClick={() => setFilterCategory(c.id)}
              className={cn(
                "px-2 py-0.5 rounded-md text-[9px] transition-all",
                filterCategory === c.id
                  ? "bg-violet-500/15 text-violet-300 border border-violet-500/30"
                  : "text-zinc-500 hover:text-zinc-400"
              )}
            >
              {c.emoji} {c.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Memory list */}
      {filtered.length === 0 ? (
        <div className="text-center py-6">
          <Brain className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
          <p className="text-[10px] text-zinc-600">
            AI还没有记住关于你的任何信息。
          </p>
          <p className="text-[9px] text-zinc-700 mt-1">
            使用心理顾问或法律顾问对话后，系统会自动提取关键信息存入记忆。
          </p>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {filtered.map((m) => {
            const catConfig = CATEGORY_CONFIG.find((c) => c.id === m.category);
            return (
              <div
                key={m.id}
                className="group flex items-start gap-2 rounded-lg border border-zinc-800/50 bg-zinc-900/30 p-2 hover:border-zinc-700/50 transition-all"
              >
                <span className="text-[10px] shrink-0 mt-0.5">{catConfig?.emoji || "📝"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-zinc-300 leading-relaxed break-words">{m.content}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[8px] text-zinc-600 flex items-center gap-0.5">
                      <Clock className="h-2 w-2" />
                      {m.source}
                    </span>
                    <span className="text-[8px] text-zinc-700">
                      {new Date(m.createdAt).toLocaleDateString("zh-CN")}
                    </span>
                  </div>
                </div>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => updateUserMemory(m.id, { archived: true })}
                    className="p-1 rounded text-zinc-600 hover:text-amber-400 transition-colors"
                    title="归档"
                  >
                    <Archive className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => deleteUserMemory(m.id)}
                    className="p-1 rounded text-zinc-600 hover:text-red-400 transition-colors"
                    title="删除"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
