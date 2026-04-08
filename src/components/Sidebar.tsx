"use client";

import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import {
  Brain,
  MessageSquareText,
  Users,
  Swords,
  GraduationCap,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Map,
  Fingerprint,
  CalendarClock,
  Settings,
  HeartHandshake,
} from "lucide-react";

const NAV_ITEMS = [
  {
    id: "analyze",
    label: "对话分析",
    sublabel: "Conversation Analysis",
    icon: MessageSquareText,
  },
  {
    id: "profiles",
    label: "人物画像",
    sublabel: "Person Profiles",
    icon: Users,
  },
  {
    id: "coach",
    label: "实时教练",
    sublabel: "Real-time Coach",
    icon: Sparkles,
  },
  {
    id: "simulate",
    label: "模拟对练",
    sublabel: "Simulation Arena",
    icon: Swords,
  },
  {
    id: "eq-training",
    label: "情商训练",
    sublabel: "EQ Training",
    icon: GraduationCap,
  },
  {
    id: "strategy",
    label: "策略规划",
    sublabel: "Strategy Planner",
    icon: Map,
  },
  {
    id: "psychology",
    label: "心理顾问",
    sublabel: "Psychology Counselor",
    icon: HeartHandshake,
  },
  {
    id: "planning",
    label: "规划制定",
    sublabel: "Life & Work Planner",
    icon: CalendarClock,
  },
  {
    id: "mbti",
    label: "MBTI 检测",
    sublabel: "Personality Quick Test",
    icon: Fingerprint,
  },
  {
    id: "settings",
    label: "数据管理",
    sublabel: "Data & Settings",
    icon: Settings,
  },
];

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar, activeTab, setActiveTab } = useAppStore();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-full flex-col border-r border-zinc-800 bg-zinc-950 transition-all duration-300",
        sidebarOpen ? "w-64" : "w-16"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-zinc-800 px-4">
        {sidebarOpen && (
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-violet-400" />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-zinc-100 tracking-wide">
                SIOS
              </span>
              <span className="text-[10px] text-zinc-500 leading-none">
                Social Intelligence OS
              </span>
            </div>
          </div>
        )}
        {!sidebarOpen && (
          <Brain className="mx-auto h-6 w-6 text-violet-400" />
        )}
        <button
          onClick={toggleSidebar}
          className="rounded-md p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
        >
          {sidebarOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2 pt-4">
        {NAV_ITEMS.map((item, idx) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const shortcutKey = idx < 9 ? idx + 1 : 0; // Ctrl+1-9, then Ctrl+0
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-200 group",
                isActive
                  ? "bg-violet-500/15 text-violet-300 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.2)]"
                  : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
              )}
              title={`${item.label} (Ctrl+${shortcutKey})`} // Ctrl+0 for 10th tab
            >
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0",
                  isActive ? "text-violet-400" : ""
                )}
              />
              {sidebarOpen && (
                <>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-medium truncate">
                      {item.label}
                    </span>
                    <span className="text-[10px] text-zinc-600 truncate">
                      {item.sublabel}
                    </span>
                  </div>
                  <kbd className="hidden group-hover:inline-flex items-center rounded border border-zinc-700 bg-zinc-800 px-1 py-0.5 text-[9px] font-mono text-zinc-500 shrink-0">
                    Ctrl+{shortcutKey}
                  </kbd>
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      {sidebarOpen && (
        <div className="border-t border-zinc-800 p-4">
          <div className="rounded-lg bg-gradient-to-br from-violet-500/10 to-blue-500/10 border border-violet-500/20 p-3">
            <p className="text-xs text-zinc-400 leading-relaxed">
              <span className="text-violet-300 font-medium">Social Intelligence OS</span>
              <br />
              理解他人，理解自己，优化一切人际交互。
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
