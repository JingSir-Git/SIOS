"use client";

import { useState, useCallback } from "react";
import {
  Key,
  Globe,
  Cpu,
  Plus,
  X,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { apiFetch } from "@/lib/api-fetch";

const PRESET_MODELS = [
  { label: "MiniMax M2.7 Highspeed", value: "MiniMax-M2.7-highspeed", tags: ["fast", "vision"] },
  { label: "MiniMax M1", value: "MiniMax-M1", tags: ["balanced"] },
  { label: "Claude 3.5 Sonnet", value: "claude-3-5-sonnet-20241022", tags: ["smart", "vision"] },
  { label: "Claude 3 Haiku", value: "claude-3-haiku-20240307", tags: ["fast", "cheap"] },
  { label: "GPT-4o", value: "gpt-4o", tags: ["smart", "vision"] },
  { label: "GPT-4o-mini", value: "gpt-4o-mini", tags: ["fast", "cheap"] },
  { label: "DeepSeek V3", value: "deepseek-chat", tags: ["smart", "cheap"] },
  { label: "Qwen Max", value: "qwen-max", tags: ["smart"] },
];

const TAG_STYLES: Record<string, { label: string; color: string }> = {
  fast: { label: "⚡ 快速", color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  smart: { label: "🧠 智能", color: "bg-violet-500/15 text-violet-300 border-violet-500/30" },
  vision: { label: "👁 视觉", color: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
  cheap: { label: "💰 经济", color: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  balanced: { label: "⚖️ 均衡", color: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30" },
};

const PRESET_ENDPOINTS = [
  { label: "MiniMax (默认)", value: "https://api.minimaxi.com/anthropic" },
  { label: "Anthropic 官方", value: "https://api.anthropic.com" },
  { label: "OpenAI 兼容", value: "https://api.openai.com/v1" },
  { label: "DeepSeek", value: "https://api.deepseek.com" },
  { label: "Ollama 本地", value: "http://localhost:11434/v1" },
];

/** One-click provider presets: baseURL + model + recommended endpoint */
const PROVIDER_PRESETS = [
  { label: "MiniMax 极速", emoji: "🚀", baseURL: "https://api.minimaxi.com/anthropic", model: "MiniMax-M2.7-highspeed", desc: "默认方案，速度最快" },
  { label: "Claude Sonnet", emoji: "🎭", baseURL: "https://api.anthropic.com", model: "claude-3-5-sonnet-20241022", desc: "最聪明，适合复杂分析" },
  { label: "GPT-4o", emoji: "🤖", baseURL: "https://api.openai.com/v1", model: "gpt-4o", desc: "OpenAI旗舰，支持视觉" },
  { label: "DeepSeek", emoji: "🔍", baseURL: "https://api.deepseek.com", model: "deepseek-chat", desc: "高性价比中文模型" },
  { label: "Ollama 本地", emoji: "🏠", baseURL: "http://localhost:11434/v1", model: "qwen2.5:7b", desc: "完全离线，无需API Key" },
];

export default function ApiSettingsPanel() {
  const { apiSettings, updateApiSettings, addCustomModel, removeCustomModel, addToast } = useAppStore();
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);
  const [newModel, setNewModel] = useState("");

  const customModels = apiSettings.customModels ?? [];
  const allModels = [
    ...PRESET_MODELS,
    ...customModels.map((m) => ({ label: `自定义: ${m}`, value: m })),
  ];

  const [testDetail, setTestDetail] = useState<string>("");

  const handleTest = useCallback(async () => {
    setTesting(true);
    setTestResult(null);
    setTestDetail("");
    try {
      const res = await apiFetch("/api/test-connection", {
        method: "POST",
      });
      const data = await res.json();
      if (data.ok) {
        setTestResult("success");
        setTestDetail(`模型: ${data.model} | 延迟: ${data.latencyMs}ms | tokens: ${data.usage?.input ?? 0}+${data.usage?.output ?? 0}`);
        addToast({ type: "success", title: "API 连接成功", message: `模型 ${data.model} 响应正常 (${data.latencyMs}ms)` });
      } else {
        setTestResult("error");
        setTestDetail(data.error || "未知错误");
        addToast({ type: "error", title: "API 连接失败", message: data.error || `HTTP ${res.status}` });
      }
    } catch (err) {
      setTestResult("error");
      const msg = err instanceof Error ? err.message : "网络错误";
      setTestDetail(msg);
      addToast({ type: "error", title: "API 连接失败", message: msg });
    } finally {
      setTesting(false);
    }
  }, [addToast]);

  const handleAddModel = () => {
    const name = newModel.trim();
    if (!name) return;
    addCustomModel(name);
    updateApiSettings({ model: name });
    setNewModel("");
  };

  const maskedKey = apiSettings.apiKey
    ? `${apiSettings.apiKey.slice(0, 6)}${"•".repeat(Math.max(0, apiSettings.apiKey.length - 10))}${apiSettings.apiKey.slice(-4)}`
    : "";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Settings2 className="w-5 h-5 text-violet-400" />
        <h3 className="text-lg font-semibold">API 配置</h3>
        <span className="text-xs text-white/40 ml-2">自定义LLM服务端点、密钥和模型</span>
      </div>

      {/* One-click Provider Presets */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-white/80">
          <Cpu className="w-4 h-4 text-emerald-400" />
          快速切换方案
        </label>
        <div className="grid grid-cols-2 gap-2">
          {PROVIDER_PRESETS.map((p) => {
            const isActive = apiSettings.baseURL === p.baseURL && apiSettings.model === p.model;
            return (
              <button
                key={p.model}
                onClick={() => updateApiSettings({ baseURL: p.baseURL, model: p.model })}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all",
                  isActive
                    ? "border-violet-500/50 bg-violet-500/10 shadow-lg shadow-violet-500/10"
                    : "border-zinc-700/50 bg-zinc-800/30 hover:border-zinc-600"
                )}
              >
                <span className="text-lg">{p.emoji}</span>
                <div className="min-w-0">
                  <div className={cn("text-xs font-medium", isActive ? "text-violet-300" : "text-zinc-300")}>
                    {p.label}
                    {isActive && <span className="ml-1.5 text-[8px] text-emerald-400">✓ 当前</span>}
                  </div>
                  <div className="text-[9px] text-zinc-500 truncate">{p.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* API Base URL */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-white/80">
          <Globe className="w-4 h-4 text-blue-400" />
          API 端点 (Base URL)
        </label>
        <div className="flex gap-2 flex-wrap">
          {PRESET_ENDPOINTS.map((ep) => (
            <button
              key={ep.value}
              onClick={() => updateApiSettings({ baseURL: ep.value })}
              className={cn(
                "px-3 py-1 rounded-lg text-xs transition-all",
                apiSettings.baseURL === ep.value
                  ? "bg-violet-500/30 text-violet-300 ring-1 ring-violet-500/50"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              )}
            >
              {ep.label}
            </button>
          ))}
        </div>
        <input
          type="url"
          value={apiSettings.baseURL}
          onChange={(e) => updateApiSettings({ baseURL: e.target.value })}
          placeholder="留空则使用服务器环境变量 ANTHROPIC_BASE_URL"
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
        />
      </div>

      {/* API Key */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-white/80">
          <Key className="w-4 h-4 text-amber-400" />
          API Key
        </label>
        <div className="relative">
          <input
            type={showKey ? "text" : "password"}
            value={showKey ? apiSettings.apiKey : maskedKey}
            onChange={(e) => updateApiSettings({ apiKey: e.target.value })}
            onFocus={() => setShowKey(true)}
            placeholder="留空则使用服务器环境变量 ANTHROPIC_API_KEY"
            className="w-full px-3 py-2 pr-10 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-violet-500/50 font-mono"
          />
          <button
            onClick={() => setShowKey(!showKey)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white/70"
          >
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-white/30">
          密钥仅存储在您的浏览器本地，不会上传到任何服务器。通过请求头安全传输到后端。
        </p>
      </div>

      {/* Model Selection */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-white/80">
          <Cpu className="w-4 h-4 text-emerald-400" />
          模型选择
        </label>
        <div className="flex gap-2 flex-wrap">
          {allModels.map((m) => {
            const presetModel = PRESET_MODELS.find(p => p.value === m.value);
            const tags = presetModel?.tags || [];
            return (
            <div key={m.value} className="flex items-center gap-1">
              <button
                onClick={() => updateApiSettings({ model: m.value })}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs transition-all flex items-center gap-1.5",
                  apiSettings.model === m.value
                    ? "bg-emerald-500/30 text-emerald-300 ring-1 ring-emerald-500/50"
                    : "bg-white/5 text-white/60 hover:bg-white/10"
                )}
              >
                {m.label}
                {tags.map(t => {
                  const style = TAG_STYLES[t];
                  return style ? (
                    <span key={t} className={cn("text-[7px] px-1 py-0 rounded border", style.color)}>{style.label}</span>
                  ) : null;
                })}
              </button>
              {customModels.includes(m.value) && (
                <button
                  onClick={() => {
                    removeCustomModel(m.value);
                    if (apiSettings.model === m.value) updateApiSettings({ model: "" });
                  }}
                  className="p-0.5 text-white/30 hover:text-red-400 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            );
          })}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newModel}
            onChange={(e) => setNewModel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddModel()}
            placeholder="添加自定义模型名称..."
            className="flex-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
          />
          <button
            onClick={handleAddModel}
            disabled={!newModel.trim()}
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-lg text-xs hover:bg-emerald-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <Plus className="w-3 h-3" />
            添加
          </button>
        </div>
        <p className="text-xs text-white/30">
          留空则使用服务器环境变量 ANTHROPIC_MODEL 的默认模型。
        </p>
      </div>

      {/* Connection Test */}
      <div className="space-y-2 pt-2 border-t border-white/10">
        <div className="flex items-center gap-3">
          <button
            onClick={handleTest}
            disabled={testing}
            className="flex items-center gap-2 px-4 py-2 bg-violet-500/20 text-violet-300 rounded-lg text-sm hover:bg-violet-500/30 disabled:opacity-50 transition-all"
          >
            {testing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : testResult === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : testResult === "error" ? (
              <AlertCircle className="w-4 h-4 text-red-400" />
            ) : (
              <Globe className="w-4 h-4" />
            )}
            {testing ? "测试中..." : "测试连接"}
          </button>
          {testResult === "success" && (
            <span className="text-xs text-emerald-400">✓ 连接成功</span>
          )}
          {testResult === "error" && (
            <span className="text-xs text-red-400">✗ 连接失败</span>
          )}
          <button
            onClick={() => {
              updateApiSettings({ baseURL: "", apiKey: "", model: "" });
              setTestResult(null);
              setTestDetail("");
              addToast({ type: "info", title: "已重置", message: "API配置已重置为服务器默认值" });
            }}
            className="ml-auto px-3 py-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            重置为默认
          </button>
        </div>
        {testDetail && (
          <div className={cn(
            "px-3 py-2 rounded-lg text-xs",
            testResult === "success"
              ? "bg-emerald-500/10 text-emerald-300/80 border border-emerald-500/20"
              : "bg-red-500/10 text-red-300/80 border border-red-500/20"
          )}>
            {testDetail}
          </div>
        )}
      </div>

      {/* Current effective config summary */}
      <div className="p-3 bg-white/5 rounded-lg text-xs text-white/50 space-y-1">
        <div><strong>当前有效配置：</strong></div>
        <div>端点: {apiSettings.baseURL || "(使用服务器默认)"}</div>
        <div>密钥: {apiSettings.apiKey ? `${apiSettings.apiKey.slice(0, 6)}...已配置` : "(使用服务器默认)"}</div>
        <div>模型: {apiSettings.model || "(使用服务器默认)"}</div>
      </div>

      {/* Ollama local setup guide */}
      {apiSettings.baseURL?.includes("localhost:11434") && (
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-300/80 space-y-1.5">
          <div className="font-medium text-blue-300">🏠 Ollama 本地模型设置指南</div>
          <ol className="list-decimal ml-4 space-y-1">
            <li>安装 Ollama: 访问 <span className="text-blue-400">ollama.com</span> 下载安装</li>
            <li>拉取模型: 打开终端运行 <code className="px-1 py-0.5 bg-white/10 rounded">ollama pull qwen2.5:7b</code></li>
            <li>启动服务: <code className="px-1 py-0.5 bg-white/10 rounded">ollama serve</code></li>
            <li>API Key 填写 <code className="px-1 py-0.5 bg-white/10 rounded">ollama</code> (任意非空字符串即可)</li>
          </ol>
          <div className="text-[10px] text-blue-400/60 mt-1">推荐模型: qwen2.5:7b (中文优秀) | llama3.1:8b (英文优秀) | mistral:7b (通用)</div>
        </div>
      )}
    </div>
  );
}
