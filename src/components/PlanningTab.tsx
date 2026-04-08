"use client";

import { useState } from "react";
import {
  CalendarClock,
  Loader2,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  BookOpen,
  X,
  Target,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flag,
  Repeat,
  Lightbulb,
  ArrowRight,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { PLANNING_EXAMPLE_CATEGORIES, type PlanningExample } from "@/lib/planning-examples";
import ModuleHistoryPanel from "./ModuleHistoryPanel";
import { v4 as uuidv4 } from "uuid";

interface PlanMilestone {
  id: string;
  title: string;
  description: string;
  deadline: string;
  dependencies: string[];
  priority: "critical" | "high" | "medium" | "low";
  status: "pending" | "in_progress" | "completed" | "blocked";
}

interface PlanPhase {
  name: string;
  timeRange: string;
  objective: string;
  milestones: PlanMilestone[];
  risks: string[];
  keyMetrics: string[];
}

interface PlanResult {
  title: string;
  domain: string;
  timeScale: string;
  totalDuration: string;
  overallObjective: string;
  currentSituation: string;
  phases: PlanPhase[];
  resourceRequirements: string[];
  riskMitigation: string[];
  successCriteria: string[];
  contingencyPlan: string;
  dailyHabits?: string[];
  reviewSchedule: string;
}

const DOMAIN_OPTIONS = [
  { value: "daily", label: "日常事务", icon: "📋" },
  { value: "study", label: "学习计划", icon: "📚" },
  { value: "career", label: "职业发展", icon: "🚀" },
  { value: "business", label: "商业创业", icon: "💰" },
  { value: "project", label: "项目管理", icon: "⚙️" },
  { value: "government", label: "政务决策", icon: "🏛️" },
  { value: "life", label: "人生规划", icon: "🌟" },
];

const TIME_SCALE_OPTIONS = [
  { value: "hours", label: "几小时", description: "精确到分钟" },
  { value: "days", label: "几天", description: "按天拆分" },
  { value: "weeks", label: "几周", description: "按周规划" },
  { value: "months", label: "几个月", description: "按月/阶段" },
  { value: "years", label: "几年", description: "长期愿景" },
];

const PRIORITY_COLORS: Record<string, string> = {
  critical: "text-red-400 bg-red-500/10 border-red-500/30",
  high: "text-orange-400 bg-orange-500/10 border-orange-500/30",
  medium: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  low: "text-zinc-400 bg-zinc-500/10 border-zinc-500/30",
};

const PRIORITY_LABELS: Record<string, string> = {
  critical: "关键",
  high: "高",
  medium: "中",
  low: "低",
};

export default function PlanningTab() {
  const { addModuleHistory } = useAppStore();
  const [objective, setObjective] = useState("");
  const [context, setContext] = useState("");
  const [constraints, setConstraints] = useState("");
  const [preferences, setPreferences] = useState("");
  const [domain, setDomain] = useState("daily");
  const [timeScale, setTimeScale] = useState("weeks");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PlanResult | null>(null);
  const [error, setError] = useState("");
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [activeExampleCategory, setActiveExampleCategory] = useState(PLANNING_EXAMPLE_CATEGORIES[0].id);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const loadExample = (ex: PlanningExample) => {
    setObjective(ex.objective);
    setContext(ex.context);
    setDomain(ex.domain);
    setTimeScale(ex.timeScale);
    setConstraints(ex.constraints || "");
    setPreferences(ex.preferences || "");
    setShowExamples(false);
    setShowAdvanced(!!(ex.constraints || ex.preferences));
    setResult(null);
    setError("");
  };

  const generatePlan = async () => {
    if (!objective.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/planning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objective: objective.trim(),
          context: context.trim() || undefined,
          domain,
          timeScale,
          constraints: constraints.trim() || undefined,
          preferences: preferences.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "规划生成失败");
      }

      const data = await res.json();
      setResult(data);
      setExpandedPhase(0);

      // Auto-save to module history
      if (data) {
        addModuleHistory("planning", {
          id: uuidv4(),
          title: data.title || `规划: ${objective.trim().slice(0, 30)}`,
          createdAt: new Date().toISOString(),
          module: "planning",
          data: { result: data, objective: objective.trim(), context: context.trim(), domain, timeScale },
          summary: `${data.phases?.length || 0}个阶段·${data.milestones?.length || 0}个里程碑`,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知错误");
    } finally {
      setLoading(false);
    }
  };

  const copyPlan = () => {
    if (!result) return;
    const text = `# ${result.title}

## 总体目标
${result.overallObjective}

## 时间跨度
${result.totalDuration}

## 当前情况分析
${result.currentSituation}

${result.phases.map((phase, i) => `## 阶段${i + 1}：${phase.name}（${phase.timeRange}）
目标：${phase.objective}

### 里程碑
${phase.milestones.map((m, j) => `${j + 1}. 【${PRIORITY_LABELS[m.priority] || m.priority}】${m.title}\n   ${m.description}\n   截止：${m.deadline}`).join("\n")}

### 风险提示
${phase.risks.map((r) => `- ${r}`).join("\n")}

### 衡量指标
${phase.keyMetrics.map((m) => `- ${m}`).join("\n")}`).join("\n\n")}

## 所需资源
${result.resourceRequirements.map((r) => `- ${r}`).join("\n")}

## 风险控制
${result.riskMitigation.map((r) => `- ${r}`).join("\n")}

## 成功标准
${result.successCriteria.map((s) => `- ${s}`).join("\n")}

## 应急预案
${result.contingencyPlan}

${result.dailyHabits ? `## 每日习惯\n${result.dailyHabits.map((h) => `- ${h}`).join("\n")}` : ""}

## 复盘安排
${result.reviewSchedule}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-emerald-400" />
            规划制定
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            从日常任务到人生战略——AI帮你制定可执行的行动方案，小到几小时的行程，大到几年的长期规划
          </p>
        </div>
        <ModuleHistoryPanel
          module="planning"
          label="规划制定"
          onLoadEntry={(entry) => {
            const d = entry.data as { result: PlanResult; objective: string; context: string; domain: string; timeScale: string };
            if (d.result) { setResult(d.result); setExpandedPhase(0); }
            if (d.objective) setObjective(d.objective);
            if (d.context) setContext(d.context);
            if (d.domain) setDomain(d.domain);
            if (d.timeScale) setTimeScale(d.timeScale);
            setError("");
          }}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
          {/* Domain & Time Scale Selection */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-[10px] text-zinc-500 mb-1.5 block">规划领域</label>
              <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-4">
                {DOMAIN_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDomain(opt.value)}
                    className={cn(
                      "flex flex-col items-center gap-0.5 rounded-lg px-2 py-2 text-center transition-all border",
                      domain === opt.value
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                        : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                    )}
                  >
                    <span className="text-base">{opt.icon}</span>
                    <span className="text-[10px] leading-tight">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 mb-1.5 block">时间尺度</label>
              <div className="grid grid-cols-5 gap-1.5">
                {TIME_SCALE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setTimeScale(opt.value)}
                    className={cn(
                      "flex flex-col items-center gap-0.5 rounded-lg px-2 py-2 text-center transition-all border",
                      timeScale === opt.value
                        ? "bg-blue-500/10 border-blue-500/30 text-blue-300"
                        : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                    )}
                  >
                    <span className="text-[11px] font-medium">{opt.label}</span>
                    <span className="text-[9px] opacity-60">{opt.description}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Objective Input */}
          <div>
            <label className="text-[10px] text-zinc-500 mb-1.5 block">核心目标 *</label>
            <input
              type="text"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="你想要达成什么？如：三个月内完成硕士论文、半年内转行成功、规划一次家庭旅行..."
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* Context */}
          <div>
            <label className="text-[10px] text-zinc-500 mb-1.5 block">当前情况与背景（越详细越好）</label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="描述你的当前状态、可用资源、面临的挑战、已有的基础..."
              rows={3}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 resize-none"
            />
          </div>

          {/* Advanced Options */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <ChevronDown className={cn("h-3 w-3 transition-transform", showAdvanced && "rotate-180")} />
              高级选项（约束条件与个人偏好）
            </button>
            {showAdvanced && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                <div>
                  <label className="text-[10px] text-zinc-500 mb-1.5 block">约束条件</label>
                  <textarea
                    value={constraints}
                    onChange={(e) => setConstraints(e.target.value)}
                    placeholder="时间限制、预算上限、人力资源、技术限制..."
                    rows={2}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 resize-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 mb-1.5 block">个人偏好与倾向</label>
                  <textarea
                    value={preferences}
                    onChange={(e) => setPreferences(e.target.value)}
                    placeholder="你的风格偏好、学习方式偏好、风险承受能力、优先级倾向..."
                    rows={2}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Examples & Generate Button */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowExamples(!showExamples)}
                className="flex items-center gap-1.5 text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors px-2.5 py-1.5 rounded-lg border border-emerald-500/20 hover:border-emerald-500/40"
              >
                <BookOpen className="h-3 w-3" />
                载入预设场景
                <ChevronDown className={cn("h-3 w-3 transition-transform", showExamples && "rotate-180")} />
              </button>

              {showExamples && (
                <div className="absolute top-full left-0 mt-2 z-20 w-[520px] max-h-[420px] rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl shadow-black/40 overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-200">
                  <div className="flex border-b border-zinc-800 overflow-x-auto">
                    {PLANNING_EXAMPLE_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setActiveExampleCategory(cat.id)}
                        className={cn(
                          "flex items-center gap-1 px-3 py-2 text-[11px] whitespace-nowrap transition-colors shrink-0",
                          activeExampleCategory === cat.id
                            ? "text-emerald-300 border-b-2 border-emerald-500 bg-emerald-500/5"
                            : "text-zinc-500 hover:text-zinc-300"
                        )}
                      >
                        <span>{cat.icon}</span>
                        {cat.label}
                      </button>
                    ))}
                  </div>
                  <div className="p-2 max-h-[340px] overflow-y-auto space-y-1">
                    {PLANNING_EXAMPLE_CATEGORIES
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
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500">
                              {TIME_SCALE_OPTIONS.find((t) => t.value === ex.timeScale)?.label}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-500 group-hover:text-zinc-400">
                            {ex.description}
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
              onClick={generatePlan}
              disabled={loading || !objective.trim()}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium transition-all",
                loading || !objective.trim()
                  ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-500/20"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  AI规划师正在制定方案...
                </>
              ) : (
                <>
                  <CalendarClock className="h-4 w-4" />
                  生成行动规划
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

          {/* Plan Result */}
          {result && (
            <div className="space-y-5 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-emerald-500/30 shrink-0">
                    <CalendarClock className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-200">{result.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {DOMAIN_OPTIONS.find((d) => d.value === result.domain)?.icon}{" "}
                        {DOMAIN_OPTIONS.find((d) => d.value === result.domain)?.label || result.domain}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <Clock className="h-2.5 w-2.5 inline mr-0.5" />
                        {result.totalDuration}
                      </span>
                      <span className="text-[10px] text-zinc-600">
                        {result.phases?.length || 0} 个阶段
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={copyPlan}
                  className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors shrink-0"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "已复制" : "复制方案"}
                </button>
              </div>

              {/* Overall Objective & Situation */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-emerald-400" />
                    <h4 className="text-xs font-medium text-emerald-300">核心目标</h4>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">{result.overallObjective}</p>
                </div>
                <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/30 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="h-4 w-4 text-zinc-400" />
                    <h4 className="text-xs font-medium text-zinc-300">现状分析</h4>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">{result.currentSituation}</p>
                </div>
              </div>

              {/* Phases Timeline */}
              {result.phases && result.phases.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-medium text-zinc-300 flex items-center gap-2">
                    <Flag className="h-3.5 w-3.5 text-blue-400" />
                    分阶段行动方案
                  </h4>
                  {result.phases.map((phase, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-zinc-800 overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedPhase(expandedPhase === i ? null : i)}
                        className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-zinc-900/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center h-6 w-6 rounded-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 text-[10px] font-bold text-emerald-400">
                            {i + 1}
                          </div>
                          <div>
                            <span className="text-xs font-medium text-zinc-200">{phase.name}</span>
                            <span className="text-[10px] text-zinc-600 ml-2">{phase.timeRange}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-zinc-600">
                            {phase.milestones?.length || 0} 个里程碑
                          </span>
                          {expandedPhase === i ? (
                            <ChevronUp className="h-3.5 w-3.5 text-zinc-500" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
                          )}
                        </div>
                      </button>
                      {expandedPhase === i && (
                        <div className="px-4 pb-4 space-y-4 border-t border-zinc-800/50 animate-in fade-in-0 duration-200">
                          {/* Phase objective */}
                          <div className="pt-3">
                            <p className="text-[10px] text-emerald-400 font-medium mb-1">阶段目标</p>
                            <p className="text-xs text-zinc-300 leading-relaxed">{phase.objective}</p>
                          </div>

                          {/* Milestones */}
                          {phase.milestones && phase.milestones.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-[10px] text-zinc-500 font-medium">里程碑</p>
                              {phase.milestones.map((m, j) => (
                                <div
                                  key={j}
                                  className="flex gap-3 rounded-lg bg-zinc-900/50 p-3 border border-zinc-800/50"
                                >
                                  <div className="shrink-0 mt-0.5">
                                    <CheckCircle2 className="h-4 w-4 text-zinc-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                      <span className="text-xs font-medium text-zinc-200">{m.title}</span>
                                      <span className={cn(
                                        "text-[9px] px-1.5 py-0.5 rounded border",
                                        PRIORITY_COLORS[m.priority] || PRIORITY_COLORS.medium
                                      )}>
                                        {PRIORITY_LABELS[m.priority] || m.priority}
                                      </span>
                                      {m.deadline && (
                                        <span className="text-[9px] text-zinc-600 flex items-center gap-0.5">
                                          <Clock className="h-2.5 w-2.5" />
                                          {m.deadline}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-zinc-400 leading-relaxed">{m.description}</p>
                                    {m.dependencies && m.dependencies.length > 0 && (
                                      <div className="flex items-center gap-1 mt-1">
                                        <ArrowRight className="h-2.5 w-2.5 text-zinc-600" />
                                        <span className="text-[9px] text-zinc-600">
                                          依赖: {m.dependencies.join(", ")}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Phase risks & metrics */}
                          <div className="grid gap-3 sm:grid-cols-2">
                            {phase.risks && phase.risks.length > 0 && (
                              <div>
                                <p className="text-[10px] text-amber-400 font-medium mb-1">风险提示</p>
                                {phase.risks.map((r, j) => (
                                  <p key={j} className="text-[11px] text-zinc-500 leading-relaxed">⚠️ {r}</p>
                                ))}
                              </div>
                            )}
                            {phase.keyMetrics && phase.keyMetrics.length > 0 && (
                              <div>
                                <p className="text-[10px] text-blue-400 font-medium mb-1">衡量指标</p>
                                {phase.keyMetrics.map((m, j) => (
                                  <p key={j} className="text-[11px] text-zinc-500 leading-relaxed">📊 {m}</p>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Resources & Risk */}
              <div className="grid gap-3 sm:grid-cols-2">
                {result.resourceRequirements && result.resourceRequirements.length > 0 && (
                  <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Layers className="h-4 w-4 text-violet-400" />
                      <h4 className="text-xs font-medium text-violet-300">所需资源</h4>
                    </div>
                    <div className="space-y-1">
                      {result.resourceRequirements.map((r, i) => (
                        <p key={i} className="text-xs text-zinc-400 leading-relaxed">• {r}</p>
                      ))}
                    </div>
                  </div>
                )}
                {result.riskMitigation && result.riskMitigation.length > 0 && (
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-amber-400" />
                      <h4 className="text-xs font-medium text-amber-300">风险控制</h4>
                    </div>
                    <div className="space-y-1">
                      {result.riskMitigation.map((r, i) => (
                        <p key={i} className="text-xs text-zinc-400 leading-relaxed">• {r}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Success Criteria */}
              {result.successCriteria && result.successCriteria.length > 0 && (
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <h4 className="text-xs font-medium text-emerald-300">成功标准</h4>
                  </div>
                  <div className="space-y-1">
                    {result.successCriteria.map((s, i) => (
                      <p key={i} className="text-xs text-zinc-300 leading-relaxed">✅ {s}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Contingency Plan */}
              {result.contingencyPlan && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <h4 className="text-xs font-medium text-red-300">应急预案</h4>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">{result.contingencyPlan}</p>
                </div>
              )}

              {/* Daily Habits & Review */}
              <div className="grid gap-3 sm:grid-cols-2">
                {result.dailyHabits && result.dailyHabits.length > 0 && (
                  <div className="rounded-lg border border-teal-500/20 bg-teal-500/5 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="h-4 w-4 text-teal-400" />
                      <h4 className="text-xs font-medium text-teal-300">每日习惯</h4>
                    </div>
                    <div className="space-y-1">
                      {result.dailyHabits.map((h, i) => (
                        <p key={i} className="text-xs text-zinc-400 leading-relaxed">🔄 {h}</p>
                      ))}
                    </div>
                  </div>
                )}
                {result.reviewSchedule && (
                  <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Repeat className="h-4 w-4 text-blue-400" />
                      <h4 className="text-xs font-medium text-blue-300">复盘安排</h4>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">{result.reviewSchedule}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
