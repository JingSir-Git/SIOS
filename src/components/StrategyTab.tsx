"use client";

import { useState, useEffect } from "react";
import {
  Map,
  Loader2,
  Target,
  Shield,
  AlertTriangle,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  BookOpen,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { STRATEGY_EXAMPLE_CATEGORIES, type StrategyExample } from "@/lib/strategy-examples";
import ModuleHistoryPanel from "./ModuleHistoryPanel";
import { v4 as uuidv4 } from "uuid";

interface StrategyPoint {
  topic: string;
  approach: string;
  fallback: string;
  expectedResistance: string;
}

interface ScriptTemplate {
  scenario: string;
  script: string;
  rationale: string;
}

interface StrategyResult {
  objective: string;
  openingMoves: string[];
  keyPoints: StrategyPoint[];
  riskMitigation: string[];
  batna: string;
  redLines: string[];
  psychologicalTactics: string[];
  scriptTemplates?: ScriptTemplate[];
  estimatedDifficulty: string;
  successProbability: number;
}

export default function StrategyTab() {
  const { profiles, preSelectedProfileId, clearPreSelection, addModuleHistory } = useAppStore();
  const [selectedProfileId, setSelectedProfileId] = useState("");

  // Pick up cross-tab pre-selection
  useEffect(() => {
    if (preSelectedProfileId && profiles.find((p) => p.id === preSelectedProfileId)) {
      setSelectedProfileId(preSelectedProfileId);
      clearPreSelection();
    }
  }, [preSelectedProfileId, profiles, clearPreSelection]);
  const [objective, setObjective] = useState("");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StrategyResult | null>(null);
  const [error, setError] = useState("");
  const [expandedPoint, setExpandedPoint] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedScript, setCopiedScript] = useState<number | null>(null);
  const [showExamples, setShowExamples] = useState(false);
  const [activeExampleCategory, setActiveExampleCategory] = useState(STRATEGY_EXAMPLE_CATEGORIES[0].id);

  const loadExample = (ex: StrategyExample) => {
    setObjective(ex.objective);
    setContext(ex.context);
    setShowExamples(false);
    setResult(null);
    setError("");
  };

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId);

  const generateStrategy = async () => {
    if (!objective.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const profileInfo = selectedProfile
        ? `对方: ${selectedProfile.name}
沟通风格: ${selectedProfile.communicationStyle?.overallType || "未知"}
强势程度: ${selectedProfile.dimensions.assertiveness?.value ?? "未知"}/100
合作倾向: ${selectedProfile.dimensions.cooperativeness?.value ?? "未知"}/100
冲突风格: ${selectedProfile.patterns?.conflictStyle || "未知"}
决策风格: ${selectedProfile.patterns?.decisionStyle || "未知"}
情绪触发点: ${selectedProfile.communicationStyle?.triggerPoints?.join("、") || "未知"}
有效说服策略: ${selectedProfile.patterns?.persuasionVulnerability?.join("、") || "未知"}`
        : "";

      const res = await fetch("/api/strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objective: objective.trim(),
          context: context.trim() || undefined,
          profileInfo: profileInfo || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "策略生成失败");
      }

      const data = await res.json();
      setResult(data);

      // Auto-save to module history
      if (data) {
        addModuleHistory("strategy", {
          id: uuidv4(),
          title: `策略: ${objective.trim().slice(0, 30)}`,
          createdAt: new Date().toISOString(),
          module: "strategy",
          data: { result: data, objective: objective.trim(), context: context.trim() },
          summary: data.objective?.slice(0, 50) || "策略方案",
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知错误");
    } finally {
      setLoading(false);
    }
  };

  const copyStrategy = () => {
    if (!result) return;
    const text = `# 对话策略方案

## 目标
${result.objective}

## 开场策略
${result.openingMoves.map((m, i) => `${i + 1}. ${m}`).join("\n")}

## 关键议题
${result.keyPoints.map((p) => `### ${p.topic}\n- 策略: ${p.approach}\n- 备选: ${p.fallback}\n- 预期阻力: ${p.expectedResistance}`).join("\n\n")}

## 风险控制
${result.riskMitigation.map((r) => `- ${r}`).join("\n")}

## BATNA (最佳替代方案)
${result.batna}

## 红线
${result.redLines.map((r) => `- ${r}`).join("\n")}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">对话策略规划</h1>
          <p className="text-xs text-zinc-500 mt-1">
            基于对方画像，为即将到来的重要对话制定完整策略方案
          </p>
        </div>
        <ModuleHistoryPanel
          module="strategy"
          label="策略规划"
          onLoadEntry={(entry) => {
            const d = entry.data as { result: StrategyResult; objective: string; context: string };
            if (d.result) setResult(d.result);
            if (d.objective) setObjective(d.objective);
            if (d.context) setContext(d.context);
            setError("");
          }}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
          {/* Input Form */}
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-[10px] text-zinc-500 mb-1.5 block">选择对方画像</label>
                <select
                  value={selectedProfileId}
                  onChange={(e) => setSelectedProfileId(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-violet-500/50"
                >
                  <option value="">不使用画像</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - {p.communicationStyle?.overallType || "未知类型"}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 mb-1.5 block">你的核心目标 *</label>
                <input
                  type="text"
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  placeholder="如：争取加薪30%、谈下独家代理权、化解团队冲突..."
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 mb-1.5 block">背景情况（越详细越好）</label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="描述对话背景：你们的关系、之前的沟通历史、对方可能的顾虑、时间压力等..."
                rows={4}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 resize-none"
              />
            </div>
            {/* Scenario presets */}
            <div className="relative">
              <button
                onClick={() => setShowExamples(!showExamples)}
                className="flex items-center gap-1.5 text-[11px] text-blue-400 hover:text-blue-300 transition-colors px-2.5 py-1 rounded-lg border border-blue-500/20 hover:border-blue-500/40"
              >
                <BookOpen className="h-3 w-3" />
                载入预设场景
                <ChevronDown className={cn("h-3 w-3 transition-transform", showExamples && "rotate-180")} />
              </button>

              {showExamples && (
                <div className="absolute top-full left-0 mt-2 z-20 w-[500px] max-h-[400px] rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl shadow-black/40 overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-200">
                  <div className="flex border-b border-zinc-800 overflow-x-auto">
                    {STRATEGY_EXAMPLE_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setActiveExampleCategory(cat.id)}
                        className={cn(
                          "flex items-center gap-1 px-3 py-2 text-[11px] whitespace-nowrap transition-colors shrink-0",
                          activeExampleCategory === cat.id
                            ? "text-blue-300 border-b-2 border-blue-500 bg-blue-500/5"
                            : "text-zinc-500 hover:text-zinc-300"
                        )}
                      >
                        <span>{cat.icon}</span>
                        {cat.label}
                      </button>
                    ))}
                  </div>
                  <div className="p-2 max-h-[320px] overflow-y-auto space-y-1">
                    {STRATEGY_EXAMPLE_CATEGORIES
                      .find((c) => c.id === activeExampleCategory)
                      ?.examples.map((ex) => (
                        <button
                          key={ex.id}
                          onClick={() => loadExample(ex)}
                          className="w-full text-left rounded-lg px-3 py-2.5 hover:bg-zinc-800/70 transition-colors group"
                        >
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-medium text-zinc-200 group-hover:text-white">
                              {ex.label}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-500 group-hover:text-zinc-400">
                            {ex.description}
                          </p>
                          <p className="text-[10px] text-blue-400/60 mt-1 line-clamp-1">
                            目标：{ex.objective}
                          </p>
                        </button>
                      ))}
                  </div>
                  <div className="border-t border-zinc-800 px-3 py-1.5 flex justify-end">
                    <button
                      onClick={() => setShowExamples(false)}
                      className="text-[10px] text-zinc-600 hover:text-zinc-400 flex items-center gap-1"
                    >
                      <X className="h-2.5 w-2.5" /> 关闭
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={generateStrategy}
              disabled={loading || !objective.trim()}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium transition-all w-full",
                loading || !objective.trim()
                  ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:from-blue-500 hover:to-violet-500 shadow-lg shadow-blue-500/20"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  AI策略师正在制定方案...
                </>
              ) : (
                <>
                  <Map className="h-4 w-4" />
                  生成对话策略
                </>
              )}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Strategy Result */}
          {result && (
            <div className="space-y-5 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
              {/* Header with copy */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-violet-500/20 flex items-center justify-center border border-blue-500/30">
                    <Map className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-200">策略方案</h3>
                    <p className="text-[10px] text-zinc-500">
                      难度评估: {result.estimatedDifficulty} · 预估成功率: {result.successProbability}%
                    </p>
                  </div>
                </div>
                <button
                  onClick={copyStrategy}
                  className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "已复制" : "复制方案"}
                </button>
              </div>

              {/* Opening Moves */}
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="h-4 w-4 text-emerald-400" />
                  <h4 className="text-xs font-medium text-emerald-300">开场策略</h4>
                </div>
                <div className="space-y-2">
                  {result.openingMoves.map((move, i) => (
                    <div key={i} className="flex gap-2 text-xs text-zinc-300">
                      <span className="shrink-0 text-emerald-500 font-mono">{i + 1}.</span>
                      <span className="leading-relaxed">{move}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Points */}
              {result.keyPoints && result.keyPoints.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-zinc-300 flex items-center gap-2">
                    <Target className="h-3.5 w-3.5 text-violet-400" />
                    关键议题攻略
                  </h4>
                  {result.keyPoints.map((point, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-zinc-800 overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedPoint(expandedPoint === i ? null : i)}
                        className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-zinc-900/50 transition-colors"
                      >
                        <span className="text-xs font-medium text-zinc-200">{point.topic}</span>
                        {expandedPoint === i ? (
                          <ChevronUp className="h-3.5 w-3.5 text-zinc-500" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
                        )}
                      </button>
                      {expandedPoint === i && (
                        <div className="px-4 pb-3 space-y-2 border-t border-zinc-800/50">
                          <div className="pt-2">
                            <span className="text-[10px] text-violet-400 font-medium">主攻策略</span>
                            <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed">{point.approach}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-amber-400 font-medium">备选方案</span>
                            <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{point.fallback}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-red-400 font-medium">预期阻力</span>
                            <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{point.expectedResistance}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Risk & Red Lines */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-amber-400" />
                    <h4 className="text-xs font-medium text-amber-300">风险控制</h4>
                  </div>
                  <div className="space-y-1.5">
                    {result.riskMitigation.map((r, i) => (
                      <p key={i} className="text-xs text-zinc-400 leading-relaxed">• {r}</p>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <h4 className="text-xs font-medium text-red-300">红线 · 绝不让步</h4>
                  </div>
                  <div className="space-y-1.5">
                    {result.redLines.map((r, i) => (
                      <p key={i} className="text-xs text-zinc-400 leading-relaxed">🚫 {r}</p>
                    ))}
                  </div>
                </div>
              </div>

              {/* BATNA */}
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-blue-400" />
                  <h4 className="text-xs font-medium text-blue-300">BATNA（最佳替代方案）</h4>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">{result.batna}</p>
              </div>

              {/* Psychological Tactics */}
              {result.psychologicalTactics && result.psychologicalTactics.length > 0 && (
                <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="h-4 w-4 text-violet-400" />
                    <h4 className="text-xs font-medium text-violet-300">心理策略提示</h4>
                  </div>
                  <div className="space-y-1.5">
                    {result.psychologicalTactics.map((t, i) => (
                      <p key={i} className="text-xs text-zinc-400 leading-relaxed">💡 {t}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Script Templates 参考话术 */}
              {result.scriptTemplates && result.scriptTemplates.length > 0 && (
                <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="h-4 w-4 text-cyan-400" />
                    <h4 className="text-xs font-medium text-cyan-300">参考话术 · 可直接使用</h4>
                  </div>
                  <div className="space-y-3">
                    {result.scriptTemplates.map((st, i) => (
                      <div key={i} className="rounded-lg border border-cyan-500/10 bg-zinc-900/50 p-3 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-cyan-400 font-medium">{st.scenario}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(st.script);
                              setCopiedScript(i);
                              setTimeout(() => setCopiedScript(null), 2000);
                            }}
                            className="flex items-center gap-1 text-[9px] text-cyan-400 hover:text-cyan-300 transition-colors"
                          >
                            {copiedScript === i ? <Check className="h-2.5 w-2.5" /> : <Copy className="h-2.5 w-2.5" />}
                            {copiedScript === i ? "已复制" : "复制"}
                          </button>
                        </div>
                        <p className="text-xs text-zinc-200 leading-relaxed font-medium">
                          &ldquo;{st.script}&rdquo;
                        </p>
                        <p className="text-[10px] text-zinc-500 leading-relaxed">
                          {st.rationale}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
