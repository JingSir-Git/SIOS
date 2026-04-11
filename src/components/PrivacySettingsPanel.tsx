"use client";

import {
  Shield,
  Lock,
  Download,
  Clock,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

export default function PrivacySettingsPanel() {
  const {
    privacySettings,
    updatePrivacySettings,
    exportAnonymizedData,
    addToast,
    profiles,
    conversations,
    profileMemories,
  } = useAppStore();

  const handleAnonymizedExport = () => {
    const data = exportAnonymizedData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sios-anonymized-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast({ type: "success", title: "导出成功", message: "已导出脱敏数据" });
  };

  const autoDeleteOptions = [
    { label: "永不", value: 0 },
    { label: "7天", value: 7 },
    { label: "30天", value: 30 },
    { label: "90天", value: 90 },
    { label: "180天", value: 180 },
    { label: "365天", value: 365 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-emerald-400" />
        <h3 className="text-lg font-semibold">隐私与数据安全</h3>
        <span className="text-xs text-white/40 ml-2">GDPR合规数据管理</span>
      </div>

      {/* Data Overview */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-white/5 rounded-lg text-center">
          <div className="text-2xl font-bold text-violet-400">{profiles.length}</div>
          <div className="text-xs text-white/50">人物画像</div>
        </div>
        <div className="p-3 bg-white/5 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-400">{conversations.length}</div>
          <div className="text-xs text-white/50">对话记录</div>
        </div>
        <div className="p-3 bg-white/5 rounded-lg text-center">
          <div className="text-2xl font-bold text-amber-400">{profileMemories.length}</div>
          <div className="text-xs text-white/50">AI记忆</div>
        </div>
      </div>

      {/* Data Encryption */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-white/80">
          <Lock className="w-4 h-4 text-amber-400" />
          本地数据加密
        </label>
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
          <div>
            <p className="text-sm text-white/70">加密本地存储的敏感数据</p>
            <p className="text-xs text-white/40 mt-1">启用后，对话原文和画像数据将使用AES-256加密存储</p>
          </div>
          <button
            onClick={() => updatePrivacySettings({ dataEncryptionEnabled: !privacySettings.dataEncryptionEnabled })}
            className={cn(
              "relative w-12 h-6 rounded-full transition-colors",
              privacySettings.dataEncryptionEnabled ? "bg-emerald-500" : "bg-white/20"
            )}
          >
            <div
              className={cn(
                "absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform",
                privacySettings.dataEncryptionEnabled ? "translate-x-6" : "translate-x-0.5"
              )}
            />
          </button>
        </div>
      </div>

      {/* Auto Delete */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-white/80">
          <Clock className="w-4 h-4 text-blue-400" />
          数据自动过期
        </label>
        <div className="flex gap-2 flex-wrap">
          {autoDeleteOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updatePrivacySettings({ autoDeleteAfterDays: opt.value })}
              className={cn(
                "px-3 py-1 rounded-lg text-xs transition-all",
                privacySettings.autoDeleteAfterDays === opt.value
                  ? "bg-blue-500/30 text-blue-300 ring-1 ring-blue-500/50"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-white/30">
          设置后，超过指定天数的对话和分析数据将自动删除。画像数据保留。
        </p>
      </div>

      {/* Anonymized Export */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-white/80">
          <Eye className="w-4 h-4 text-violet-400" />
          数据脱敏导出
        </label>
        <div className="flex items-center gap-3">
          <button
            onClick={handleAnonymizedExport}
            className="flex items-center gap-2 px-4 py-2 bg-violet-500/20 text-violet-300 rounded-lg text-sm hover:bg-violet-500/30 transition-all"
          >
            <Download className="w-4 h-4" />
            导出脱敏数据
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => updatePrivacySettings({ anonymizeExports: !privacySettings.anonymizeExports })}
              className={cn(
                "relative w-10 h-5 rounded-full transition-colors",
                privacySettings.anonymizeExports ? "bg-violet-500" : "bg-white/20"
              )}
            >
              <div
                className={cn(
                  "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                  privacySettings.anonymizeExports ? "translate-x-5" : "translate-x-0.5"
                )}
              />
            </button>
            <span className="text-xs text-white/50">默认导出脱敏</span>
          </div>
        </div>
        <p className="text-xs text-white/30">
          脱敏导出会替换所有真实姓名和对话内容为匿名标识符，仅保留分析结构数据。
        </p>
      </div>

      {/* Data Deletion Note */}
      <div className="space-y-2 pt-4 border-t border-white/10">
        <div className="p-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg">
          <p className="text-xs text-zinc-400">
            💡 完整数据导出、导入和删除功能请使用上方「数据管理」模块。此处仅提供脱敏导出等隐私相关功能。
          </p>
        </div>
      </div>
    </div>
  );
}
