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
  { label: "MiniMax M2.7 Highspeed", value: "MiniMax-M2.7-highspeed" },
  { label: "MiniMax M1", value: "MiniMax-M1" },
  { label: "Claude 3.5 Sonnet", value: "claude-3-5-sonnet-20241022" },
  { label: "Claude 3 Haiku", value: "claude-3-haiku-20240307" },
  { label: "GPT-4o", value: "gpt-4o" },
  { label: "GPT-4o-mini", value: "gpt-4o-mini" },
  { label: "DeepSeek V3", value: "deepseek-chat" },
  { label: "Qwen Max", value: "qwen-max" },
];

const PRESET_ENDPOINTS = [
  { label: "MiniMax (默认)", value: "https://api.minimaxi.com/anthropic" },
  { label: "Anthropic 官方", value: "https://api.anthropic.com" },
  { label: "OpenAI 兼容", value: "https://api.openai.com/v1" },
  { label: "DeepSeek", value: "https://api.deepseek.com" },
];

export default function ApiSettingsPanel() {
  const { apiSettings, updateApiSettings, addCustomModel, removeCustomModel, addToast } = useAppStore();
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);
  const [newModel, setNewModel] = useState("");

  const allModels = [
    ...PRESET_MODELS,
    ...apiSettings.customModels.map((m) => ({ label: `自定义: ${m}`, value: m })),
  ];

  const handleTest = useCallback(async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await apiFetch("/api/coach?stream=true", {
        method: "POST",
        body: JSON.stringify({
          messages: "测试: 你好",
          userGoal: "API连接测试",
        }),
      });
      if (res.ok) {
        setTestResult("success");
        addToast({ type: "success", title: "API连接成功", message: "已成功连接到LLM服务" });
      } else {
        const errData = await res.json().catch(() => ({}));
        setTestResult("error");
        addToast({ type: "error", title: "API连接失败", message: (errData as { error?: string }).error || `HTTP ${res.status}` });
      }
    } catch (err) {
      setTestResult("error");
      addToast({ type: "error", title: "API连接失败", message: err instanceof Error ? err.message : "网络错误" });
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
          {allModels.map((m) => (
            <div key={m.value} className="flex items-center gap-1">
              <button
                onClick={() => updateApiSettings({ model: m.value })}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs transition-all",
                  apiSettings.model === m.value
                    ? "bg-emerald-500/30 text-emerald-300 ring-1 ring-emerald-500/50"
                    : "bg-white/5 text-white/60 hover:bg-white/10"
                )}
              >
                {m.label}
              </button>
              {apiSettings.customModels.includes(m.value) && (
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
          ))}
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
      <div className="flex items-center gap-3 pt-2 border-t border-white/10">
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
          <span className="text-xs text-red-400">✗ 连接失败，请检查配置</span>
        )}
        <button
          onClick={() => {
            updateApiSettings({ baseURL: "", apiKey: "", model: "" });
            setTestResult(null);
            addToast({ type: "info", title: "已重置", message: "API配置已重置为服务器默认值" });
          }}
          className="ml-auto px-3 py-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
        >
          重置为默认
        </button>
      </div>

      {/* Current effective config summary */}
      <div className="p-3 bg-white/5 rounded-lg text-xs text-white/50 space-y-1">
        <div><strong>当前有效配置：</strong></div>
        <div>端点: {apiSettings.baseURL || "(使用服务器默认)"}</div>
        <div>密钥: {apiSettings.apiKey ? `${apiSettings.apiKey.slice(0, 6)}...已配置` : "(使用服务器默认)"}</div>
        <div>模型: {apiSettings.model || "(使用服务器默认)"}</div>
      </div>
    </div>
  );
}
