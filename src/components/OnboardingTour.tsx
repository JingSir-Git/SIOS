"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  ChevronRight,
  ChevronLeft,
  MessageSquareText,
  Users,
  Swords,
  Compass,
  CalendarClock,
  Fingerprint,
  Rocket,
  HeartHandshake,
  BarChart3,
  Scale,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

interface TourStep {
  tabId: string;
  icon: React.ElementType;
  title: { zh: string; en: string };
  description: { zh: string; en: string };
  iconColor: string;
  accentColor: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    tabId: "dashboard",
    icon: BarChart3,
    title: { zh: "数据大盘", en: "Analytics Dashboard" },
    description: {
      zh: "总览全局数据——对话统计、画像分布、成就进度、活跃趋势，一目了然。",
      en: "Overview of all data — conversation stats, profile distribution, achievements, and activity trends at a glance.",
    },
    iconColor: "text-sky-400",
    accentColor: "border-sky-500/40",
  },
  {
    tabId: "analyze",
    icon: MessageSquareText,
    title: { zh: "对话分析", en: "Conversation Analysis" },
    description: {
      zh: "粘贴对话文本，AI从语言特征、话语结构、互动模式、语义内容、元认知五层深度解析，自动推测MBTI并生成情绪曲线。",
      en: "Paste conversations for 5-layer deep analysis — language features, discourse structure, interaction patterns, semantic content, and metacognition.",
    },
    iconColor: "text-violet-400",
    accentColor: "border-violet-500/40",
  },
  {
    tabId: "profiles",
    icon: Users,
    title: { zh: "人物画像库", en: "Person Profiles" },
    description: {
      zh: "八维度贝叶斯动态建模，AI分析 + 你的主观印象双视角构建精细行为画像，越用越精准。",
      en: "8-dimension Bayesian profiling with dual perspectives — AI analysis + your subjective impressions, getting more precise with every use.",
    },
    iconColor: "text-blue-400",
    accentColor: "border-blue-500/40",
  },
  {
    tabId: "drill",
    icon: Swords,
    title: { zh: "模拟演练", en: "Simulation & Coaching" },
    description: {
      zh: "整合教练、模拟对练、EQ训练、策略规划四大功能——实时指导、AI对练、情商训练和策略制定。",
      en: "Integrated coaching, simulation, EQ training, and strategy planning — real-time guidance, AI sparring, emotional training, and strategy preparation.",
    },
    iconColor: "text-red-400",
    accentColor: "border-red-500/40",
  },
  {
    tabId: "psychology",
    icon: HeartHandshake,
    title: { zh: "心理顾问", en: "Psychology Counselor" },
    description: {
      zh: "基于关系网络和人物画像，提供个性化心理疏导与关系优化建议——六步分析框架。",
      en: "Personalized psychological guidance based on your relationship network and profiles — six-step analysis framework.",
    },
    iconColor: "text-rose-400",
    accentColor: "border-rose-500/40",
  },
  {
    tabId: "legal",
    icon: Scale,
    title: { zh: "法律顾问", en: "Legal Advisor" },
    description: {
      zh: "AI法律顾问——合同审查、纠纷分析、法律咨询，支持图片识别文档。",
      en: "AI legal advisor — contract review, dispute analysis, legal consultation with document image recognition.",
    },
    iconColor: "text-emerald-400",
    accentColor: "border-emerald-500/40",
  },
  {
    tabId: "planning",
    icon: CalendarClock,
    title: { zh: "规划制定", en: "Life & Work Planner" },
    description: {
      zh: "跨时间尺度行动规划——AI生成分阶段可执行方案、里程碑与关键决策点。",
      en: "Cross-scale action planning — AI generates phased execution plans, milestones, and key decision points.",
    },
    iconColor: "text-cyan-400",
    accentColor: "border-cyan-500/40",
  },
  {
    tabId: "divination",
    icon: Compass,
    title: { zh: "风水玄学", en: "Metaphysics & Divination" },
    description: {
      zh: "周易六爻、姓名学、风水分析、八字命理——传统智慧与AI结合的玄学咨询。",
      en: "I Ching divination, name analysis, Feng Shui, and BaZi — traditional wisdom meets AI-powered metaphysics consultation.",
    },
    iconColor: "text-amber-400",
    accentColor: "border-amber-500/40",
  },
  {
    tabId: "mbti",
    icon: Fingerprint,
    title: { zh: "MBTI 检测", en: "MBTI Personality Test" },
    description: {
      zh: "三种深度模式（快速/标准/完整），生成详细个性化报告并融入系统智能。",
      en: "Three depth modes (quick/standard/full) with detailed personalized reports integrated into system intelligence.",
    },
    iconColor: "text-indigo-400",
    accentColor: "border-indigo-500/40",
  },
  {
    tabId: "settings",
    icon: Settings,
    title: { zh: "数据管理", en: "Data & Settings" },
    description: {
      zh: "数据导出导入、API配置、隐私设置、成就系统、主题切换、语言选择。",
      en: "Data export/import, API configuration, privacy settings, achievements, theme switching, and language selection.",
    },
    iconColor: "text-zinc-400",
    accentColor: "border-zinc-500/40",
  },
];

const STORAGE_KEY = "social-intelligence-os-onboarding-done-v3";

export default function OnboardingTour() {
  const { setActiveTab } = useAppStore();
  const language = useAppStore((s) => s.language);
  const isEn = language === "en";
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
          {isEn ? "Guide" : "引导"} {step + 1}/{TOUR_STEPS.length}
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
              {isEn ? "Feature Tour" : "功能导览"}
            </span>
            <span className="text-[10px] text-zinc-600">
              {step + 1}/{TOUR_STEPS.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMinimized(true)}
              className="text-zinc-600 hover:text-zinc-400 transition-colors p-1 rounded"
              title={isEn ? "Minimize" : "最小化"}
            >
              <ChevronRight className="h-3.5 w-3.5 rotate-90" />
            </button>
            <button
              onClick={finish}
              className="text-zinc-600 hover:text-zinc-400 transition-colors p-1 rounded"
              title={isEn ? "Close Tour" : "关闭引导"}
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
                {isEn ? current.title.en : current.title.zh}
              </h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                {isEn ? current.description.en : current.description.zh}
              </p>
            </div>
          </div>

          {/* Step Dots */}
          <div className="flex items-center justify-center gap-1 mb-3">
            {TOUR_STEPS.map((s, i) => (
              <button
                key={i}
                onClick={() => goToStep(i)}
                title={isEn ? s.title.en : s.title.zh}
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
              {isEn ? "Back" : "上一步"}
            </button>

            <button
              onClick={finish}
              className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              {isEn ? "Skip" : "跳过"}
            </button>

            <button
              onClick={next}
              className="flex items-center gap-1 rounded-md bg-violet-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-violet-500 transition-colors shadow-md shadow-violet-500/20"
            >
              {isLast ? (
                <>
                  {isEn ? "Get Started" : "开始使用"}
                  <Rocket className="h-3 w-3" />
                </>
              ) : (
                <>
                  {isEn ? "Next" : "下一步"}
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
