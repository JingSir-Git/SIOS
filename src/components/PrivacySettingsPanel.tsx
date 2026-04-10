"use client";

import { useState } from "react";
import {
  Shield,
  Lock,
  Trash2,
  Download,
  AlertTriangle,
  Clock,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

export default function PrivacySettingsPanel() {
  const {
    privacySettings,
    updatePrivacySettings,
    purgeAllPersonalData,
    exportAnonymizedData,
    addToast,
    profiles,
    conversations,
    profileMemories,
  } = useAppStore();
  const [confirmPurge, setConfirmPurge] = useState(false);

  const handlePurge = () => {
    if (!confirmPurge) {
      setConfirmPurge(true);
      return;
    }
    purgeAllPersonalData();
    addToast({ type: "success", title: "数据已清除", message: "所有个人数据已永久删除" });
    setConfirmPurge(false);
  };

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

      {/* Data Deletion */}
      <div className="space-y-2 pt-4 border-t border-white/10">
        <label className="flex items-center gap-2 text-sm font-medium text-red-400">
          <Trash2 className="w-4 h-4" />
          数据删除 (GDPR Right to Erasure)
        </label>
        <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg space-y-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-300/70">
              此操作将永久删除所有个人数据，包括人物画像、对话记录、AI记忆、分析历史等。此操作不可撤销。
            </p>
          </div>
          <button
            onClick={handlePurge}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all",
              confirmPurge
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-red-500/20 text-red-300 hover:bg-red-500/30"
            )}
          >
            <Trash2 className="w-4 h-4" />
            {confirmPurge ? "确认永久删除所有数据" : "清除所有个人数据"}
          </button>
          {confirmPurge && (
            <button
              onClick={() => setConfirmPurge(false)}
              className="text-xs text-white/40 hover:text-white/60 ml-3"
            >
              取消
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
