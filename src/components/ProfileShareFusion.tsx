"use client";

import { useState, useRef } from "react";
import {
  Share2,
  Download,
  Upload,
  Users,
  Check,
  AlertTriangle,
  X,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import type { PersonProfile, DimensionKey } from "@/lib/types";

interface AnonymizedProfile {
  formatVersion: 1;
  exportedAt: string;
  name: string; // anonymized or real, user chooses
  dimensions: Record<string, { value: number; confidence: number }>;
  communicationStyle?: {
    overallType: string;
    strengths: string[];
    weaknesses: string[];
    triggerPoints: string[];
  };
  patterns?: {
    responseSpeed: string;
    conflictStyle: string;
    decisionStyle: string;
  };
  sourceCount: number; // how many sources contributed to this profile
  conversationCount: number;
}

interface FusionResult {
  dimensionChanges: {
    key: string;
    label: string;
    oldValue: number;
    newValue: number;
    oldConfidence: number;
    newConfidence: number;
  }[];
  sourceCountAfter: number;
}

interface Props {
  profile: PersonProfile;
  onClose: () => void;
}

export default function ProfileShareFusion({ profile, onClose }: Props) {
  const { profiles, conversations } = useAppStore();
  const [mode, setMode] = useState<"export" | "import" | null>(null);
  const [anonymize, setAnonymize] = useState(true);
  const [exported, setExported] = useState(false);
  const [importedData, setImportedData] = useState<AnonymizedProfile | null>(null);
  const [fusionResult, setFusionResult] = useState<FusionResult | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sourceCount = (profile as unknown as Record<string, unknown>).sourceCount as number || 1;

  // Export anonymized profile
  const handleExport = () => {
    const anon: AnonymizedProfile = {
      formatVersion: 1,
      exportedAt: new Date().toISOString(),
      name: anonymize ? `匿名画像_${profile.name.charAt(0)}**` : profile.name,
      dimensions: {},
      sourceCount,
      conversationCount: profile.conversationCount,
    };

    // Export dimensions without evidence text
    for (const [key, dim] of Object.entries(profile.dimensions)) {
      anon.dimensions[key] = {
        value: dim.value,
        confidence: dim.confidence,
      };
    }

    // Export communication style (stripped of sensitive details)
    if (profile.communicationStyle) {
      anon.communicationStyle = {
        overallType: profile.communicationStyle.overallType,
        strengths: profile.communicationStyle.strengths,
        weaknesses: profile.communicationStyle.weaknesses,
        triggerPoints: anonymize ? ["[已匿名]"] : profile.communicationStyle.triggerPoints,
      };
    }

    // Export patterns
    if (profile.patterns) {
      anon.patterns = {
        responseSpeed: profile.patterns.responseSpeed,
        conflictStyle: profile.patterns.conflictStyle,
        decisionStyle: profile.patterns.decisionStyle,
      };
    }

    const blob = new Blob([JSON.stringify(anon, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `profile_${anonymize ? "anon" : profile.name}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  // Import external profile
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as AnonymizedProfile;
        if (!data.formatVersion || !data.dimensions) {
          throw new Error("不是有效的画像分享文件");
        }
        setImportedData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "文件解析失败");
      }
    };
    reader.readAsText(file);
  };

  // Perform weighted fusion
  const performFusion = () => {
    if (!importedData) return;

    const changes: FusionResult["dimensionChanges"] = [];
    const existingWeight = sourceCount;
    const importWeight = importedData.sourceCount || 1;
    const totalWeight = existingWeight + importWeight;

    for (const [key, dim] of Object.entries(profile.dimensions)) {
      const importDim = importedData.dimensions[key];
      if (!importDim) continue;

      // Weighted average based on source count and confidence
      const existConfWeight = dim.confidence / 100;
      const importConfWeight = importDim.confidence / 100;
      const wExist = existingWeight * existConfWeight;
      const wImport = importWeight * importConfWeight;
      const wTotal = wExist + wImport || 1;

      const newValue = Math.round((dim.value * wExist + importDim.value * wImport) / wTotal);
      const newConfidence = Math.min(100, Math.round(
        (dim.confidence * existingWeight + importDim.confidence * importWeight) / totalWeight * 1.1
      ));

      changes.push({
        key,
        label: dim.labelZh,
        oldValue: dim.value,
        newValue,
        oldConfidence: dim.confidence,
        newConfidence,
      });
    }

    setFusionResult({
      dimensionChanges: changes,
      sourceCountAfter: totalWeight,
    });
  };

  // Apply fusion to store
  const applyFusion = () => {
    if (!fusionResult) return;

    const updatedDimensions = { ...profile.dimensions };
    for (const change of fusionResult.dimensionChanges) {
      const key = change.key as DimensionKey;
      if (updatedDimensions[key]) {
        updatedDimensions[key] = {
          ...updatedDimensions[key],
          value: change.newValue,
          confidence: change.newConfidence,
        };
      }
    }

    // Update profile in store
    const { profiles: allProfiles } = useAppStore.getState();
    const idx = allProfiles.findIndex((p) => p.id === profile.id);
    if (idx !== -1) {
      const updated = [...allProfiles];
      updated[idx] = {
        ...updated[idx],
        dimensions: updatedDimensions,
        updatedAt: new Date().toISOString(),
      };
      useAppStore.setState({ profiles: updated });
    }

    setMode(null);
    setFusionResult(null);
    setImportedData(null);
  };

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Share2 className="h-4 w-4 text-violet-400" />
          <h3 className="text-xs font-semibold text-zinc-200">画像共享与融合</h3>
          {sourceCount > 1 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300">
              {sourceCount}个信息源
            </span>
          )}
        </div>
        <button onClick={onClose} className="text-zinc-600 hover:text-zinc-400">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {!mode && !fusionResult && (
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            onClick={() => setMode("export")}
            className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-left hover:bg-emerald-500/10 transition-colors"
          >
            <Download className="h-4 w-4 text-emerald-400 shrink-0" />
            <div>
              <div className="text-xs font-medium text-emerald-300">导出画像</div>
              <div className="text-[10px] text-zinc-500">生成匿名化/完整版画像文件供他人导入</div>
            </div>
          </button>
          <button
            onClick={() => setMode("import")}
            className="flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 text-left hover:bg-blue-500/10 transition-colors"
          >
            <Upload className="h-4 w-4 text-blue-400 shrink-0" />
            <div>
              <div className="text-xs font-medium text-blue-300">导入并融合</div>
              <div className="text-[10px] text-zinc-500">导入他人的画像数据进行加权融合</div>
            </div>
          </button>
        </div>
      )}

      {/* Export Mode */}
      {mode === "export" && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={anonymize}
                onChange={(e) => setAnonymize(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-800 text-violet-500 focus:ring-violet-500"
              />
              <span className="text-xs text-zinc-300">匿名化导出</span>
            </label>
            <span className="text-[10px] text-zinc-600">
              {anonymize ? "隐藏姓名和敏感信息" : "包含完整画像信息"}
            </span>
          </div>

          {anonymize && (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5">
              <Shield className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-[10px] text-zinc-400 leading-relaxed">
                匿名模式将隐藏：真实姓名、情绪触发点细节、证据原文。
                保留：维度分值、置信度、沟通风格类型、行为模式。
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs text-white hover:bg-emerald-500 transition-colors"
            >
              {exported ? <Check className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}
              {exported ? "已导出" : "导出画像文件"}
            </button>
            <button
              onClick={() => setMode(null)}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-300"
            >
              返回
            </button>
          </div>
        </div>
      )}

      {/* Import Mode */}
      {mode === "import" && !fusionResult && (
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-700 py-4 text-xs text-zinc-500 hover:border-blue-500/50 hover:text-blue-400 transition-colors"
          >
            <Upload className="h-4 w-4" />
            选择画像文件 (.json)
          </button>

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              {error}
            </div>
          )}

          {importedData && (
            <div className="space-y-3">
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-3.5 w-3.5 text-blue-400" />
                  <span className="text-xs text-blue-300 font-medium">已加载外部画像</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <span className="text-zinc-600">名称: </span>
                    <span className="text-zinc-300">{importedData.name}</span>
                  </div>
                  <div>
                    <span className="text-zinc-600">信息源数: </span>
                    <span className="text-zinc-300">{importedData.sourceCount}</span>
                  </div>
                  <div>
                    <span className="text-zinc-600">维度数: </span>
                    <span className="text-zinc-300">{Object.keys(importedData.dimensions).length}</span>
                  </div>
                  <div>
                    <span className="text-zinc-600">对话数: </span>
                    <span className="text-zinc-300">{importedData.conversationCount}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={performFusion}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-500 transition-colors"
                >
                  <Users className="h-3.5 w-3.5" />
                  预览融合结果
                </button>
                <button
                  onClick={() => { setMode(null); setImportedData(null); }}
                  className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-300"
                >
                  取消
                </button>
              </div>
            </div>
          )}

          {!importedData && (
            <button
              onClick={() => setMode(null)}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-300"
            >
              返回
            </button>
          )}
        </div>
      )}

      {/* Fusion Preview */}
      {fusionResult && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-violet-400" />
            <span className="text-xs text-violet-300 font-medium">
              融合预览（{fusionResult.sourceCountAfter}个信息源综合）
            </span>
          </div>

          <div className="space-y-1.5 max-h-[240px] overflow-y-auto">
            {fusionResult.dimensionChanges.map((change) => {
              const delta = change.newValue - change.oldValue;
              return (
                <div key={change.key} className="flex items-center gap-3 text-[11px]">
                  <span className="text-zinc-400 w-20 shrink-0">{change.label}</span>
                  <span className="text-zinc-500 font-mono w-8 text-right">{change.oldValue}</span>
                  <span className="text-zinc-600">→</span>
                  <span className={cn(
                    "font-mono w-8 font-medium",
                    delta > 0 ? "text-emerald-400" : delta < 0 ? "text-red-400" : "text-zinc-300"
                  )}>
                    {change.newValue}
                  </span>
                  {delta !== 0 && (
                    <span className={cn(
                      "text-[9px] font-mono",
                      delta > 0 ? "text-emerald-500/60" : "text-red-500/60"
                    )}>
                      {delta > 0 ? "+" : ""}{delta}
                    </span>
                  )}
                  <div className="relative flex-1 h-1.5 rounded-full bg-zinc-800">
                    <div className="absolute inset-0 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${change.newConfidence}%`, background: "linear-gradient(to right, #3f3f46, #8b5cf6)", opacity: 0.3 }} />
                    </div>
                    <div className="absolute top-[-1px] w-0.5 h-2.5 rounded-sm bg-violet-400 transition-all" style={{ left: `${change.newConfidence}%`, transform: "translateX(-50%)" }} />
                  </div>
                  <span className="text-[9px] text-zinc-600 font-mono w-10 text-right">
                    信{change.newConfidence}%
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2">
            <button
              onClick={applyFusion}
              className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs text-white hover:bg-violet-500 transition-colors"
            >
              <Check className="h-3.5 w-3.5" />
              确认融合
            </button>
            <button
              onClick={() => { setFusionResult(null); setImportedData(null); setMode(null); }}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-300"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
