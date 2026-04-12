"use client";

import { useState } from "react";
import { Sparkles, Swords, Map } from "lucide-react";
import { cn } from "@/lib/utils";
import CoachTab from "./CoachTab";
import SimulateTab from "./SimulateTab";
import StrategyTab from "./StrategyTab";

const SUB_TABS = [
  { id: "coach", label: "沟通教练", icon: Sparkles, description: "实时沟通指导与回复建议" },
  { id: "simulate", label: "模拟对练", icon: Swords, description: "与AI模拟对话场景" },
  { id: "strategy", label: "策略规划", icon: Map, description: "提前规划沟通策略" },
] as const;

type SubTab = (typeof SUB_TABS)[number]["id"];

export default function DrillTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("coach");

  return (
    <div className="flex flex-col h-full">
      {/* Sub-tab header */}
      <div className="border-b border-zinc-800 px-4 py-3 shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 shadow-lg shadow-violet-500/10">
            <Swords className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-zinc-100">模拟演练</h1>
            <p className="text-[10px] text-zinc-500">情景模拟 · 教练指导 · 策略训练</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {SUB_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                  isActive
                    ? "bg-violet-500/15 text-violet-300 border border-violet-500/25"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 border border-transparent"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-tab content */}
      <div className="flex-1 min-h-0">
        <div className={cn("h-full", activeSubTab !== "coach" && "hidden")}>
          <CoachTab />
        </div>
        <div className={cn("h-full", activeSubTab !== "simulate" && "hidden")}>
          <SimulateTab />
        </div>
        <div className={cn("h-full", activeSubTab !== "strategy" && "hidden")}>
          <StrategyTab />
        </div>
      </div>
    </div>
  );
}
