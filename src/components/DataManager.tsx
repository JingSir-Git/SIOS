"use client";

import { useState, useRef } from "react";
import {
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  Check,
  HardDrive,
  FileJson,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore, type DataExport } from "@/lib/store";

export default function DataManager() {
  const {
    profiles,
    conversations,
    relationships,
    exportAllData,
    importData,
    clearAllData,
  } = useAppStore();

  const [importResult, setImportResult] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      const data = exportAllData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sios-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError("导出失败，请重试");
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setImportResult(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text) as DataExport;

      // Basic validation
      if (!data.version || !Array.isArray(data.profiles) || !Array.isArray(data.conversations)) {
        throw new Error("文件格式不正确，请选择有效的 SIOS 备份文件");
      }

      if (!data.relationships) {
        data.relationships = [];
      }

      const result = importData(data, importMode);
      setImportResult(
        importMode === "replace"
          ? `已替换：${result.profilesAdded} 个画像、${result.conversationsAdded} 条对话、${result.relationshipsAdded} 条关系`
          : `已合并：新增 ${result.profilesAdded} 个画像、${result.conversationsAdded} 条对话、${result.relationshipsAdded} 条关系`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "导入失败，文件可能已损坏");
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClearAll = () => {
    clearAllData();
    setShowClearConfirm(false);
    setImportResult("所有数据已清除");
    setTimeout(() => setImportResult(null), 3000);
  };

  const totalItems = profiles.length + conversations.length + relationships.length;

  return (
    <div className="space-y-6">
      {/* Data Stats */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <div className="flex items-center gap-2 mb-4">
          <HardDrive className="h-4 w-4 text-violet-400" />
          <h3 className="text-sm font-medium text-zinc-200">数据概览</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-zinc-800/50 border border-zinc-700/50 p-3 text-center">
            <p className="text-2xl font-semibold text-violet-400">{profiles.length}</p>
            <p className="text-[10px] text-zinc-500 mt-1">人物画像</p>
          </div>
          <div className="rounded-lg bg-zinc-800/50 border border-zinc-700/50 p-3 text-center">
            <p className="text-2xl font-semibold text-blue-400">{conversations.length}</p>
            <p className="text-[10px] text-zinc-500 mt-1">对话记录</p>
          </div>
          <div className="rounded-lg bg-zinc-800/50 border border-zinc-700/50 p-3 text-center">
            <p className="text-2xl font-semibold text-cyan-400">{relationships.length}</p>
            <p className="text-[10px] text-zinc-500 mt-1">关系图谱</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          <Shield className="h-3 w-3 text-emerald-500" />
          <p className="text-[10px] text-zinc-600">
            所有数据仅存储在你的本地浏览器中，不会上传到任何服务器
          </p>
        </div>
      </div>

      {/* Export */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <div className="flex items-center gap-2 mb-2">
          <Download className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-medium text-zinc-200">导出数据</h3>
        </div>
        <p className="text-[11px] text-zinc-500 mb-4">
          将所有画像、对话记录和关系图谱导出为 JSON 文件。可用于备份或迁移到其他设备。
        </p>
        <button
          onClick={handleExport}
          disabled={totalItems === 0}
          className={cn(
            "flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all w-full",
            totalItems === 0
              ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
              : "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 hover:border-emerald-500/50"
          )}
        >
          <FileJson className="h-4 w-4" />
          导出全部数据（{totalItems} 条记录）
        </button>
      </div>

      {/* Import */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <div className="flex items-center gap-2 mb-2">
          <Upload className="h-4 w-4 text-blue-400" />
          <h3 className="text-sm font-medium text-zinc-200">导入数据</h3>
        </div>
        <p className="text-[11px] text-zinc-500 mb-3">
          从之前导出的 JSON 备份文件中恢复数据。
        </p>

        <div className="flex items-center gap-3 mb-4">
          <span className="text-[10px] text-zinc-500">导入模式：</span>
          <button
            onClick={() => setImportMode("merge")}
            className={cn(
              "px-3 py-1 rounded-lg text-[11px] transition-colors border",
              importMode === "merge"
                ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                : "bg-zinc-800 text-zinc-500 border-zinc-700 hover:text-zinc-300"
            )}
          >
            合并（保留现有数据，仅添加新数据）
          </button>
          <button
            onClick={() => setImportMode("replace")}
            className={cn(
              "px-3 py-1 rounded-lg text-[11px] transition-colors border",
              importMode === "replace"
                ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                : "bg-zinc-800 text-zinc-500 border-zinc-700 hover:text-zinc-300"
            )}
          >
            替换（清除现有数据，完全覆盖）
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all w-full bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 hover:border-blue-500/50"
        >
          <Upload className="h-4 w-4" />
          选择 JSON 文件导入
        </button>
      </div>

      {/* Clear Data */}
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
        <div className="flex items-center gap-2 mb-2">
          <Trash2 className="h-4 w-4 text-red-400" />
          <h3 className="text-sm font-medium text-red-300">清除所有数据</h3>
        </div>
        <p className="text-[11px] text-zinc-500 mb-4">
          永久删除所有画像、对话记录和关系图谱。此操作不可恢复，建议先导出备份。
        </p>

        {!showClearConfirm ? (
          <button
            onClick={() => setShowClearConfirm(true)}
            disabled={totalItems === 0}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all w-full",
              totalItems === 0
                ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                : "bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 hover:border-red-500/50"
            )}
          >
            <Trash2 className="h-4 w-4" />
            清除全部数据
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
              <p className="text-[11px] text-red-300">
                确定要删除所有 {totalItems} 条记录吗？此操作无法撤销！
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 rounded-lg px-4 py-2 text-sm bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleClearAll}
                className="flex-1 rounded-lg px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-500 transition-colors font-medium"
              >
                确认清除
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Status Messages */}
      {importResult && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-3">
          <Check className="h-4 w-4 text-emerald-400 shrink-0" />
          <p className="text-xs text-emerald-300">{importResult}</p>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
          <p className="text-xs text-red-300">{error}</p>
        </div>
      )}
    </div>
  );
}
