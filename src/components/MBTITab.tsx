"use client";

import { useState } from "react";
import {
  Brain,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Sparkles,
  Zap,
  Clock,
  Target,
  Shield,
  AlertTriangle,
  MessageSquare,
  Swords,
  Heart,
  Lightbulb,
  Users,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { v4 as uuidv4 } from "uuid";
import {
  MBTI_QUESTIONS,
  MBTI_TYPE_DESCRIPTIONS,
  MBTI_TEST_MODES,
  MBTI_DETAILED_REPORTS,
  getQuestionsForMode,
  calculateMBTI,
  type MBTIResult,
  type MBTITestMode,
  type MBTIQuestion,
} from "@/lib/mbti-questions";

// ---- Dimension colors ----
const DIM_COLORS: Record<string, { left: string; right: string; bar: string }> = {
  EI: { left: "text-amber-400", right: "text-blue-400", bar: "bg-amber-500" },
  SN: { left: "text-emerald-400", right: "text-violet-400", bar: "bg-emerald-500" },
  TF: { left: "text-cyan-400", right: "text-pink-400", bar: "bg-cyan-500" },
  JP: { left: "text-orange-400", right: "text-teal-400", bar: "bg-orange-500" },
};

const DIM_LABELS: Record<string, [string, string]> = {
  EI: ["外向 Extraversion", "内向 Introversion"],
  SN: ["实感 Sensing", "直觉 iNtuition"],
  TF: ["思考 Thinking", "情感 Feeling"],
  JP: ["判断 Judging", "知觉 Perceiving"],
};

export default function MBTITab() {
  const { mbtiResults, addMBTIResult } = useAppStore();
  const [mode, setMode] = useState<MBTITestMode | null>(null);
  const [answers, setAnswers] = useState<Record<number, "A" | "B">>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [result, setResult] = useState<MBTIResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  const questions: MBTIQuestion[] = mode ? getQuestionsForMode(mode) : [];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).filter((k) =>
    questions.some((q) => q.id === Number(k))
  ).length;
  const progress = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  const question = questions[currentQ];

  const handleAnswer = (choice: "A" | "B") => {
    if (!question) return;
    setAnswers((prev) => ({ ...prev, [question.id]: choice }));
    if (currentQ < totalQuestions - 1) {
      setTimeout(() => setCurrentQ((prev) => prev + 1), 200);
    }
  };

  const handleFinish = () => {
    const mbtiResult = calculateMBTI(answers, questions);
    setResult(mbtiResult);
    setShowResult(true);

    // Persist to store
    addMBTIResult({
      id: uuidv4(),
      mode: mode!,
      type: mbtiResult.type,
      scores: mbtiResult.scores,
      completedAt: new Date().toISOString(),
      questionCount: totalQuestions,
    });
  };

  const handleReset = () => {
    setAnswers({});
    setCurrentQ(0);
    setResult(null);
    setShowResult(false);
    setMode(null);
  };

  const canFinish = answeredCount >= totalQuestions;

  // ---- Mode Selection View ----
  if (!mode) {
    return (
      <div className="flex flex-col h-full">
        <div className="border-b border-zinc-800 px-6 py-4">
          <h1 className="text-lg font-semibold text-zinc-100">MBTI 人格检测</h1>
          <p className="text-xs text-zinc-500 mt-1">选择测试模式，了解你的认知功能偏好</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-xl mx-auto px-6 py-10 space-y-6">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 border border-violet-500/30 mb-3">
                <Brain className="h-8 w-8 text-violet-400" />
              </div>
              <h2 className="text-sm font-medium text-zinc-300">选择测试深度</h2>
              <p className="text-[11px] text-zinc-500 mt-1">题目越多，结果越精准</p>
            </div>

            <div className="space-y-3">
              {MBTI_TEST_MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900/50 p-5 text-left hover:border-violet-500/40 hover:bg-zinc-800/50 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center",
                        m.id === "quick" ? "bg-emerald-500/10 border border-emerald-500/20" :
                        m.id === "standard" ? "bg-violet-500/10 border border-violet-500/20" :
                        "bg-pink-500/10 border border-pink-500/20"
                      )}>
                        {m.id === "quick" ? <Zap className="h-5 w-5 text-emerald-400" /> :
                         m.id === "standard" ? <Target className="h-5 w-5 text-violet-400" /> :
                         <Star className="h-5 w-5 text-pink-400" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-zinc-200 group-hover:text-zinc-100">{m.label}</span>
                          {m.id === "standard" && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/20">推荐</span>
                          )}
                        </div>
                        <span className="text-[11px] text-zinc-500">{m.questionCount} 题 · 约 {m.timeEstimate}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                  </div>
                </button>
              ))}
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
              <p className="text-[10px] text-zinc-500 leading-relaxed">
                <span className="text-zinc-400 font-medium">提示：</span>
                快速模式保留原有24道经典题目；标准模式增加24道深层认知题；完整模式进一步加入45道极深层题目，涵盖工作、社交、压力反应等场景。
                测试结果会融入系统智能，帮助AI更精准地理解你的沟通风格。
              </p>
            </div>

            {/* Test History */}
            {mbtiResults.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-medium text-zinc-400">历史测试记录</h3>
                <div className="space-y-2">
                  {mbtiResults.slice(0, 5).map((r) => {
                    const modeInfo = MBTI_TEST_MODES.find((m) => m.id === r.mode);
                    const typeDesc = MBTI_TYPE_DESCRIPTIONS[r.type];
                    return (
                      <div
                        key={r.id}
                        className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
                            {r.type}
                          </span>
                          <div>
                            <span className="text-xs text-zinc-300">
                              {typeDesc?.nickname || r.type}
                            </span>
                            <div className="text-[10px] text-zinc-600">
                              {modeInfo?.label || r.mode} · {r.questionCount}题 · {new Date(r.completedAt).toLocaleDateString("zh-CN")}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {r.type.split("").map((letter, i) => (
                            <span
                              key={i}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono"
                            >
                              {letter}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {mbtiResults.length > 5 && (
                  <p className="text-[10px] text-zinc-600 text-center">
                    还有 {mbtiResults.length - 5} 条更早的记录
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---- Result View ----
  if (showResult && result) {
    const typeInfo = MBTI_TYPE_DESCRIPTIONS[result.type];
    const report = MBTI_DETAILED_REPORTS[result.type];
    const modeLabel = MBTI_TEST_MODES.find((m) => m.id === mode)?.label || "";
    return (
      <div className="flex flex-col h-full">
        <div className="border-b border-zinc-800 px-6 py-4">
          <h1 className="text-lg font-semibold text-zinc-100">MBTI 人格检测 · 结果报告</h1>
          <p className="text-xs text-zinc-500 mt-1">
            基于{modeLabel}（{totalQuestions}题）的个性化人格分析
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
            {/* Type Badge */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center h-24 w-24 rounded-2xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 border border-violet-500/30 shadow-lg shadow-violet-500/10">
                <span className="text-4xl font-bold bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
                  {result.type}
                </span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-100">
                  {report?.nickname || typeInfo?.nickname}
                </h2>
                <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto leading-relaxed">
                  {report?.description || typeInfo?.description}
                </p>
              </div>
            </div>

            {/* Dimension Bars */}
            <div className="space-y-4">
              {(["EI", "SN", "TF", "JP"] as const).map((dim) => {
                const pct = result.percentages[dim];
                const colors = DIM_COLORS[dim];
                const labels = DIM_LABELS[dim];
                const leftPct = dim === "EI" ? result.scores.E : dim === "SN" ? result.scores.S : dim === "TF" ? result.scores.T : result.scores.J;
                const rightPct = dim === "EI" ? result.scores.I : dim === "SN" ? result.scores.N : dim === "TF" ? result.scores.F : result.scores.P;
                const total = leftPct + rightPct || 1;
                const leftWidth = Math.round((leftPct / total) * 100);

                return (
                  <div key={dim} className="space-y-1.5">
                    <div className="flex justify-between text-[10px]">
                      <span className={cn("font-medium", colors.left)}>{labels[0]}</span>
                      <span className={cn("font-medium", colors.right)}>{labels[1]}</span>
                    </div>
                    <div className="h-3 rounded-full bg-zinc-800 overflow-hidden flex">
                      <div
                        className={cn("h-full rounded-l-full transition-all duration-700", colors.bar)}
                        style={{ width: `${leftWidth}%` }}
                      />
                      <div className="h-full rounded-r-full bg-zinc-600 flex-1" />
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-500">
                      <span>{leftPct}</span>
                      <span className="font-medium text-zinc-300">{pct.label} ({pct.value}%)</span>
                      <span>{rightPct}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Detailed Report */}
            {report && (
              <>
                {/* Cognitive Stack */}
                <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="h-4 w-4 text-violet-400" />
                    <h3 className="text-sm font-semibold text-violet-300">认知功能栈</h3>
                  </div>
                  <div className="space-y-2">
                    {report.cognitiveStack.map((fn, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className={cn(
                          "text-[10px] font-mono px-1.5 py-0.5 rounded",
                          i === 0 ? "bg-violet-500/20 text-violet-300" :
                          i === 1 ? "bg-blue-500/20 text-blue-300" :
                          i === 2 ? "bg-emerald-500/20 text-emerald-300" :
                          "bg-zinc-700 text-zinc-400"
                        )}>
                          {i === 0 ? "主导" : i === 1 ? "辅助" : i === 2 ? "第三" : "劣势"}
                        </span>
                        <span className="text-[11px] text-zinc-300">{fn.split("— ")[0]}</span>
                        {fn.includes("— ") && (
                          <span className="text-[10px] text-zinc-500">{fn.split("— ")[1]}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strengths & Weaknesses */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-emerald-400" />
                      <h4 className="text-xs font-medium text-emerald-300">核心优势</h4>
                    </div>
                    <div className="space-y-1.5">
                      {report.strengths.map((s, i) => (
                        <p key={i} className="text-[11px] text-zinc-400 flex items-start gap-1.5">
                          <span className="text-emerald-500 mt-0.5">•</span> {s}
                        </p>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-amber-400" />
                      <h4 className="text-xs font-medium text-amber-300">潜在盲点</h4>
                    </div>
                    <div className="space-y-1.5">
                      {report.weaknesses.map((w, i) => (
                        <p key={i} className="text-[11px] text-zinc-400 flex items-start gap-1.5">
                          <span className="text-amber-500 mt-0.5">•</span> {w}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Communication & Conflict */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4 text-blue-400" />
                      <h4 className="text-xs font-medium text-blue-300">沟通风格</h4>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">{report.communicationStyle}</p>
                  </div>
                  <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Swords className="h-4 w-4 text-red-400" />
                      <h4 className="text-xs font-medium text-red-300">冲突处理</h4>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">{report.conflictStyle}</p>
                  </div>
                </div>

                {/* Environment & Stress */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="h-4 w-4 text-cyan-400" />
                      <h4 className="text-xs font-medium text-cyan-300">理想环境</h4>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">{report.idealEnvironment}</p>
                  </div>
                  <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-orange-400" />
                      <h4 className="text-xs font-medium text-orange-300">压力反应</h4>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">{report.stressResponse}</p>
                  </div>
                </div>

                {/* Growth Advice */}
                <div className="rounded-lg border border-pink-500/20 bg-pink-500/5 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="h-4 w-4 text-pink-400" />
                    <h3 className="text-sm font-semibold text-pink-300">成长建议</h3>
                  </div>
                  <div className="space-y-2">
                    {report.growthAdvice.map((a, i) => (
                      <p key={i} className="text-[11px] text-zinc-400 flex items-start gap-2">
                        <span className="text-pink-400 font-medium shrink-0">{i + 1}.</span> {a}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Famous Examples */}
                {report.famousExamples.length > 0 && (
                  <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/20 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-zinc-400" />
                      <h4 className="text-xs font-medium text-zinc-300">同类型名人</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {report.famousExamples.map((name, i) => (
                        <span key={i} className="text-[10px] px-2 py-1 rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700">{name}</span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Disclaimer */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
              <p className="text-[10px] text-zinc-500 leading-relaxed">
                <span className="text-zinc-400 font-medium">注意：</span>
                MBTI是认知偏好的参考框架，不是固定标签。人格类型可能随时间和情境变化。
                在Social Intelligence OS中，我们更推荐通过对话分析来动态推断沟通风格——那才是基于真实行为的精准画像。
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 rounded-lg border border-zinc-700 px-5 py-2.5 text-xs text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                重新测试
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---- Test View ----
  const modeInfo = MBTI_TEST_MODES.find((m) => m.id === mode);
  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">MBTI 人格检测</h1>
          <p className="text-xs text-zinc-500 mt-1">
            {modeInfo?.label} · {totalQuestions}道题 · 约{modeInfo?.timeEstimate}
          </p>
        </div>
        <button
          onClick={handleReset}
          className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors flex items-center gap-1"
        >
          <ChevronLeft className="h-3 w-3" />
          换模式
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] text-zinc-500">
              <span>已完成 {answeredCount} / {totalQuestions}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-pink-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Question Navigation Dots */}
          <div className="flex flex-wrap gap-1.5 justify-center">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentQ(idx)}
                className={cn(
                  "h-6 w-6 rounded-full text-[9px] font-medium transition-all",
                  idx === currentQ
                    ? "bg-violet-500 text-white ring-2 ring-violet-500/30 scale-110"
                    : answers[q.id]
                      ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                      : "bg-zinc-800 text-zinc-500 border border-zinc-700 hover:border-zinc-600"
                )}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          {/* Current Question */}
          {question && (
            <div className="rounded-xl border border-zinc-700 bg-zinc-900/50 p-6 space-y-5">
              <div className="flex items-start gap-3">
                <div className="shrink-0 h-8 w-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-violet-400">{currentQ + 1}</span>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 mb-1">
                    {question.dimension === "EI" ? "能量来源" : question.dimension === "SN" ? "信息处理" : question.dimension === "TF" ? "决策方式" : "生活方式"}
                  </p>
                  <p className="text-sm text-zinc-100 leading-relaxed">{question.text}</p>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => handleAnswer("A")}
                  className={cn(
                    "w-full text-left rounded-lg border px-4 py-3 transition-all group",
                    answers[question.id] === "A"
                      ? "border-violet-500/50 bg-violet-500/10 ring-1 ring-violet-500/20"
                      : "border-zinc-700 bg-zinc-800/30 hover:border-zinc-600 hover:bg-zinc-800/60"
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <span className={cn(
                      "shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center mt-0.5 text-[10px] font-bold",
                      answers[question.id] === "A"
                        ? "border-violet-400 bg-violet-500 text-white"
                        : "border-zinc-600 text-zinc-600 group-hover:border-zinc-500"
                    )}>
                      A
                    </span>
                    <span className={cn(
                      "text-xs leading-relaxed",
                      answers[question.id] === "A" ? "text-violet-200" : "text-zinc-300"
                    )}>
                      {question.optionA.label}
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => handleAnswer("B")}
                  className={cn(
                    "w-full text-left rounded-lg border px-4 py-3 transition-all group",
                    answers[question.id] === "B"
                      ? "border-pink-500/50 bg-pink-500/10 ring-1 ring-pink-500/20"
                      : "border-zinc-700 bg-zinc-800/30 hover:border-zinc-600 hover:bg-zinc-800/60"
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <span className={cn(
                      "shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center mt-0.5 text-[10px] font-bold",
                      answers[question.id] === "B"
                        ? "border-pink-400 bg-pink-500 text-white"
                        : "border-zinc-600 text-zinc-600 group-hover:border-zinc-500"
                    )}>
                      B
                    </span>
                    <span className={cn(
                      "text-xs leading-relaxed",
                      answers[question.id] === "B" ? "text-pink-200" : "text-zinc-300"
                    )}>
                      {question.optionB.label}
                    </span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentQ((prev) => Math.max(0, prev - 1))}
              disabled={currentQ === 0}
              className={cn(
                "flex items-center gap-1 text-xs transition-colors",
                currentQ === 0
                  ? "text-zinc-700 cursor-not-allowed"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              上一题
            </button>

            {canFinish ? (
              <button
                onClick={handleFinish}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-pink-600 px-6 py-2.5 text-sm font-medium text-white hover:from-violet-500 hover:to-pink-500 shadow-lg shadow-violet-500/20 transition-all"
              >
                <Sparkles className="h-4 w-4" />
                查看结果
              </button>
            ) : (
              <button
                onClick={() => setCurrentQ((prev) => Math.min(totalQuestions - 1, prev + 1))}
                disabled={currentQ === totalQuestions - 1}
                className={cn(
                  "flex items-center gap-1 text-xs transition-colors",
                  currentQ === totalQuestions - 1
                    ? "text-zinc-700 cursor-not-allowed"
                    : "text-zinc-400 hover:text-zinc-200"
                )}
              >
                下一题
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
