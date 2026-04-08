"use client";

import { useAppStore } from "@/lib/store";
import {
  TrendingUp, Heart, Users, Shield, Rocket,
  GraduationCap, Stethoscope, Home, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ScenarioShortcut {
  id: string;
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  title: string;
  subtitle: string;
  targetTab: string;
  prefillContext: string;
  prefillGoal: string;
}

const SCENARIOS: ScenarioShortcut[] = [
  {
    id: "salary", icon: TrendingUp,
    iconColor: "text-emerald-400", bgColor: "bg-emerald-500/5",
    borderColor: "border-emerald-500/20 hover:border-emerald-500/40",
    title: "跟领导谈加薪",
    subtitle: "策略 → 模拟 → 教练",
    targetTab: "strategy",
    prefillContext: "在公司工作两年多，业绩不错但薪资未涨，想找领导谈加薪又怕谈崩影响关系",
    prefillGoal: "争取合理涨幅（20-30%），不损害与领导的关系",
  },
  {
    id: "parents", icon: Heart,
    iconColor: "text-rose-400", bgColor: "bg-rose-500/5",
    borderColor: "border-rose-500/20 hover:border-rose-500/40",
    title: "第一次见家长",
    subtitle: "策略 → 模拟 → EQ复盘",
    targetTab: "simulate",
    prefillContext: "第一次去女友/男友家见父母，对方家庭条件和我差距较大，很紧张",
    prefillGoal: "给对方父母留下靠谱、有诚意的好印象",
  },
  {
    id: "debt", icon: Users,
    iconColor: "text-amber-400", bgColor: "bg-amber-500/5",
    borderColor: "border-amber-500/20 hover:border-amber-500/40",
    title: "催朋友还钱",
    subtitle: "教练 → 策略 → 模拟",
    targetTab: "coach",
    prefillContext: "好朋友借了钱说下月还，已经拖了三个月，想催又怕伤感情",
    prefillGoal: "要回欠款，同时保住多年友谊",
  },
  {
    id: "landlord", icon: Home,
    iconColor: "text-cyan-400", bgColor: "bg-cyan-500/5",
    borderColor: "border-cyan-500/20 hover:border-cyan-500/40",
    title: "跟房东争押金",
    subtitle: "策略 → 教练 → 模拟",
    targetTab: "strategy",
    prefillContext: "租房到期要搬走，房东以各种理由扣押金，合同上明确写了正常损耗不扣",
    prefillGoal: "拿回全部或大部分押金，有理有据不吵架",
  },
  {
    id: "interview", icon: GraduationCap,
    iconColor: "text-violet-400", bgColor: "bg-violet-500/5",
    borderColor: "border-violet-500/20 hover:border-violet-500/40",
    title: "面试准备",
    subtitle: "模拟 → 教练 → EQ复盘",
    targetTab: "simulate",
    prefillContext: "拿到心仪公司的面试机会，但有一年空窗期不知道怎么解释，技术面也没太大把握",
    prefillGoal: "顺利通过面试拿到offer，薪资谈到满意水平",
  },
  {
    id: "startup", icon: Rocket,
    iconColor: "text-orange-400", bgColor: "bg-orange-500/5",
    borderColor: "border-orange-500/20 hover:border-orange-500/40",
    title: "融资路演",
    subtitle: "策略 → 模拟 → 教练",
    targetTab: "strategy",
    prefillContext: "产品已上线三个月有初步数据，准备天使轮融资，需要面对投资人的刁钻提问",
    prefillGoal: "获得投资人认可，推进到尽调阶段",
  },
  {
    id: "medical", icon: Stethoscope,
    iconColor: "text-blue-400", bgColor: "bg-blue-500/5",
    borderColor: "border-blue-500/20 hover:border-blue-500/40",
    title: "跟医生讨论方案",
    subtitle: "分析 → 教练 → 策略",
    targetTab: "coach",
    prefillContext: "体检查出问题，医生建议手术但网上说可以保守治疗，想追问又怕显得不信任医生",
    prefillGoal: "充分了解各方案利弊，做出最优医疗决策",
  },
  {
    id: "crisis", icon: Shield,
    iconColor: "text-red-400", bgColor: "bg-red-500/5",
    borderColor: "border-red-500/20 hover:border-red-500/40",
    title: "职场危机处理",
    subtitle: "分析 → 策略 → 教练",
    targetTab: "strategy",
    prefillContext: "在公司被当众批评/被冤枉/项目出了重大事故，需要紧急善后和自我保护",
    prefillGoal: "控制损失，修复关系，保住职业声誉",
  },
];

interface Props {
  onNavigate?: (tab: string, context: string, goal: string) => void;
}

export default function ScenarioShortcuts({ onNavigate }: Props) {
  const { navigateToTab } = useAppStore();

  const handleClick = (s: ScenarioShortcut) => {
    if (onNavigate) {
      onNavigate(s.targetTab, s.prefillContext, s.prefillGoal);
    } else {
      navigateToTab(s.targetTab);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-zinc-400">快捷场景</span>
        <span className="text-[9px] text-zinc-600">选择一个场景，直接进入对应模块</span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {SCENARIOS.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => handleClick(s)}
              className={cn(
                "group flex flex-col items-start gap-1.5 rounded-xl border p-3 transition-all duration-200 text-left",
                s.borderColor, s.bgColor,
                "hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5"
              )}
            >
              <div className="flex items-center gap-2 w-full">
                <Icon className={cn("h-4 w-4 shrink-0", s.iconColor)} />
                <span className="text-xs font-medium text-zinc-200 group-hover:text-white truncate">
                  {s.title}
                </span>
                <ChevronRight className="h-3 w-3 text-zinc-600 group-hover:text-zinc-400 ml-auto shrink-0 transition-transform group-hover:translate-x-0.5" />
              </div>
              <span className="text-[9px] text-zinc-500 group-hover:text-zinc-400 leading-tight">
                {s.subtitle}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
