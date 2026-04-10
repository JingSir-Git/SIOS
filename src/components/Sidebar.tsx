"use client";

import { useEffect } from "react";
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
  BarChart3,
  Menu,
  X,
} from "lucide-react";

export const NAV_ITEMS = [
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
    id: "dashboard",
    label: "数据大盘",
    sublabel: "Analytics Dashboard",
    icon: BarChart3,
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

// ---- Mobile top header bar ----

export function MobileHeader() {
  const { activeTab, mobileDrawerOpen, setMobileDrawerOpen } = useAppStore();
  const current = NAV_ITEMS.find((i) => i.id === activeTab);
  const Icon = current?.icon ?? Brain;

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-12 px-3 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-lg">
      <button
        onClick={() => setMobileDrawerOpen(true)}
        className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="flex items-center gap-1.5">
        <Icon className="h-4 w-4 text-violet-400" />
        <span className="text-xs font-medium text-zinc-200">{current?.label ?? "SIOS"}</span>
      </div>
      <div className="w-8" /> {/* spacer for symmetry */}
    </header>
  );
}

// ---- Mobile bottom tab bar (quick access to most-used tabs) ----

const BOTTOM_TABS = [
  { id: "analyze", icon: MessageSquareText, label: "分析" },
  { id: "profiles", icon: Users, label: "画像" },
  { id: "coach", icon: Sparkles, label: "教练" },
  { id: "dashboard", icon: BarChart3, label: "大盘" },
  { id: "settings", icon: Settings, label: "设置" },
];

export function MobileBottomBar() {
  const { activeTab, setActiveTab } = useAppStore();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around h-14 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-lg safe-area-pb">
      {BOTTOM_TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors min-w-0",
              isActive ? "text-violet-400" : "text-zinc-500"
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[9px] leading-none">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ---- Desktop sidebar (unchanged logic, hidden on mobile) ----

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar, activeTab, setActiveTab, mobileDrawerOpen, setMobileDrawerOpen } = useAppStore();

  // Close drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [activeTab, setMobileDrawerOpen]);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex fixed left-0 top-0 z-40 h-full flex-col border-r border-zinc-800 bg-zinc-950 transition-all duration-300",
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
        <nav className="flex-1 overflow-y-auto space-y-1 p-2 pt-4">
          {NAV_ITEMS.map((item, idx) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const shortcutKey = idx < 9 ? idx + 1 : 0;
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
                title={`${item.label} (Ctrl+${shortcutKey})`}
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
          <div className="border-t border-zinc-800 p-4 shrink-0">
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

      {/* Mobile drawer overlay */}
      {mobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileDrawerOpen(false)}
          />
          {/* Drawer */}
          <aside className="absolute left-0 top-0 h-full w-72 bg-zinc-950 border-r border-zinc-800 flex flex-col animate-in slide-in-from-left duration-200">
            <div className="flex h-14 items-center justify-between px-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-violet-400" />
                <span className="text-sm font-bold text-zinc-100">SIOS</span>
              </div>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto space-y-1 p-2 pt-3">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileDrawerOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-200",
                      isActive
                        ? "bg-violet-500/15 text-violet-300"
                        : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
                    )}
                  >
                    <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-violet-400" : "")} />
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-sm font-medium truncate">{item.label}</span>
                      <span className="text-[10px] text-zinc-600 truncate">{item.sublabel}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
