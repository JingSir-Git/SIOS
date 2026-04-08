"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  ChevronRight,
  ChevronLeft,
  MessageSquare,
  User,
  Sparkles,
  Swords,
  Brain,
  Compass,
  CalendarClock,
  Fingerprint,
  Rocket,
  HeartHandshake,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

interface TourStep {
  tabId: string;
  icon: React.ElementType;
  title: string;
  description: string;
  iconColor: string;
  accentColor: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    tabId: "analyze",
    icon: MessageSquare,
    title: "对话分析",
    description:
      "粘贴对话文本，AI从语言特征、话语结构、互动模式、语义内容、元认知五层深度解析，自动推测MBTI并生成情绪曲线。",
    iconColor: "text-violet-400",
    accentColor: "border-violet-500/40",
  },
  {
    tabId: "profiles",
    icon: User,
    title: "人物画像库",
    description:
      "八维度贝叶斯动态建模，AI分析 + 你的主观印象双视角构建精细行为画像，越用越精准。",
    iconColor: "text-blue-400",
    accentColor: "border-blue-500/40",
  },
  {
    tabId: "coach",
    icon: Sparkles,
    title: "实时沟通教练",
    description:
      "AI教练实时分析对话走势，给出策略建议和推荐回复——像谈判顾问在你耳边低语。",
    iconColor: "text-emerald-400",
    accentColor: "border-emerald-500/40",
  },
  {
    tabId: "simulate",
    icon: Swords,
    title: "模拟对练",
    description:
      "与对方的AI数字分身对话演练，提前发现哪些说法引发兴趣、哪些踩雷。",
    iconColor: "text-red-400",
    accentColor: "border-red-500/40",
  },
  {
    tabId: "eq-training",
    icon: Brain,
    title: "EQ训练场",
    description:
      "基于你的真实对话训练共情能力和表达精度，即时、具体、个性化反馈。",
    iconColor: "text-amber-400",
    accentColor: "border-amber-500/40",
  },
  {
    tabId: "strategy",
    icon: Compass,
    title: "对话策略规划",
    description:
      "结合对方画像，制定开场策略、议题处理、风险控制、BATNA、红线预设。",
    iconColor: "text-pink-400",
    accentColor: "border-pink-500/40",
  },
  {
    tabId: "psychology",
    icon: HeartHandshake,
    title: "心理顾问",
    description:
      "基于关系网络和人物画像，提供个性化心理疏导与关系优化建议。",
    iconColor: "text-rose-400",
    accentColor: "border-rose-500/40",
  },
  {
    tabId: "planning",
    icon: CalendarClock,
    title: "规划制定",
    description:
      "跨时间尺度行动规划——AI生成分阶段可执行方案、里程碑与关键决策点。",
    iconColor: "text-cyan-400",
    accentColor: "border-cyan-500/40",
  },
  {
    tabId: "mbti",
    icon: Fingerprint,
    title: "MBTI测试",
    description:
      "三种深度模式（快速/标准/完整），生成详细个性化报告并融入系统智能。",
    iconColor: "text-indigo-400",
    accentColor: "border-indigo-500/40",
  },
];

const STORAGE_KEY = "social-intelligence-os-onboarding-done-v2";

export default function OnboardingTour() {
  const { setActiveTab } = useAppStore();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      const timer = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const finish = useCallback(() => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, "true");
  }, []);

  const goToStep = (idx: number) => {
    setStep(idx);
    setActiveTab(TOUR_STEPS[idx].tabId);
    setMinimized(false);
  };

  const next = () => {
    if (step < TOUR_STEPS.length - 1) {
      goToStep(step + 1);
    } else {
      finish();
    }
  };

  const prev = () => {
    if (step > 0) goToStep(step - 1);
  };

  if (!visible) return null;

  const current = TOUR_STEPS[step];
  const Icon = current.icon;
  const isLast = step === TOUR_STEPS.length - 1;

  // Minimized: small floating pill
  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-zinc-900/95 border border-violet-500/30 px-4 py-2.5 shadow-xl shadow-black/30 hover:border-violet-500/50 transition-all animate-in fade-in-0 slide-in-from-bottom-2 duration-200"
      >
        <Rocket className="h-4 w-4 text-violet-400 animate-pulse" />
        <span className="text-xs text-zinc-300">
          引导 {step + 1}/{TOUR_STEPS.length}
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 w-[380px] animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
      <div
        className={cn(
          "rounded-xl border bg-zinc-900/95 backdrop-blur-md shadow-2xl shadow-black/40 overflow-hidden",
          current.accentColor
        )}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <Rocket className="h-3.5 w-3.5 text-violet-400" />
            <span className="text-[11px] text-zinc-400 font-medium">
              功能导览
            </span>
            <span className="text-[10px] text-zinc-600">
              {step + 1}/{TOUR_STEPS.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMinimized(true)}
              className="text-zinc-600 hover:text-zinc-400 transition-colors p-1 rounded"
              title="最小化"
            >
              <ChevronRight className="h-3.5 w-3.5 rotate-90" />
            </button>
            <button
              onClick={finish}
              className="text-zinc-600 hover:text-zinc-400 transition-colors p-1 rounded"
              title="关闭引导"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 py-3.5">
          <div className="flex items-start gap-3 mb-3">
            <div className="rounded-lg bg-zinc-800/70 p-2 shrink-0">
              <Icon className={cn("h-5 w-5", current.iconColor)} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-zinc-100 mb-1">
                {current.title}
              </h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                {current.description}
              </p>
            </div>
          </div>

          {/* Step Dots */}
          <div className="flex items-center justify-center gap-1 mb-3">
            {TOUR_STEPS.map((s, i) => (
              <button
                key={i}
                onClick={() => goToStep(i)}
                title={s.title}
                className={cn(
                  "rounded-full transition-all duration-200",
                  i === step
                    ? "w-5 h-1.5 bg-violet-500"
                    : i < step
                    ? "w-1.5 h-1.5 bg-violet-500/40"
                    : "w-1.5 h-1.5 bg-zinc-700 hover:bg-zinc-600"
                )}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={prev}
              disabled={step === 0}
              className={cn(
                "flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] transition-colors",
                step === 0
                  ? "text-zinc-700 cursor-not-allowed"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              )}
            >
              <ChevronLeft className="h-3 w-3" />
              上一步
            </button>

            <button
              onClick={finish}
              className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              跳过
            </button>

            <button
              onClick={next}
              className="flex items-center gap-1 rounded-md bg-violet-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-violet-500 transition-colors shadow-md shadow-violet-500/20"
            >
              {isLast ? (
                <>
                  开始使用
                  <Rocket className="h-3 w-3" />
                </>
              ) : (
                <>
                  下一步
                  <ChevronRight className="h-3 w-3" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
