"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import {
  Brain,
  MessageSquareText,
  Users,
  Swords,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Fingerprint,
  CalendarClock,
  Settings,
  HeartHandshake,
  BarChart3,
  Menu,
  X,
  Zap,
  Compass,
  Scale,
  Trophy,
} from "lucide-react";
import { ACHIEVEMENTS } from "@/lib/achievements";

/** Nav key mapping to i18n translation keys */
type NavKey = "dashboard" | "analyze" | "profiles" | "drill" | "psychology" | "legal" | "planning" | "divination" | "mbti" | "settings";

const NAV_ITEMS_DEF: { id: NavKey; icon: typeof BarChart3 }[] = [
  { id: "dashboard", icon: BarChart3 },
  { id: "analyze", icon: MessageSquareText },
  { id: "profiles", icon: Users },
  { id: "drill", icon: Swords },
  { id: "psychology", icon: HeartHandshake },
  { id: "legal", icon: Scale },
  { id: "planning", icon: CalendarClock },
  { id: "divination", icon: Compass },
  { id: "mbti", icon: Fingerprint },
  { id: "settings", icon: Settings },
];

/** Build NAV_ITEMS with i18n labels. Use the hook version in components. */
function buildNavItems(t: ReturnType<typeof useT>) {
  const labelMap: Record<NavKey, { label: string; sublabel: string }> = {
    dashboard:  { label: t.nav.dashboard,  sublabel: t.nav.dashboardSub },
    analyze:    { label: t.nav.analyze,    sublabel: t.nav.analyzeSub },
    profiles:   { label: t.nav.profiles,   sublabel: t.nav.profilesSub },
    drill:      { label: t.nav.drill,      sublabel: t.nav.drillSub },
    psychology: { label: t.nav.psychology,  sublabel: t.nav.psychologySub },
    legal:      { label: t.nav.legal,      sublabel: t.nav.legalSub },
    planning:   { label: t.nav.planning,   sublabel: t.nav.planningSub },
    divination: { label: t.nav.divination,  sublabel: t.nav.divinationSub },
    mbti:       { label: t.nav.mbti,       sublabel: t.nav.mbtiSub },
    settings:   { label: t.nav.settings,   sublabel: t.nav.settingsSub },
  };
  return NAV_ITEMS_DEF.map((item) => ({
    ...item,
    ...labelMap[item.id],
  }));
}

/** Static fallback for non-hook contexts (e.g. KeyboardShortcuts) */
export const NAV_ITEMS = NAV_ITEMS_DEF.map((item) => {
  const zhLabels: Record<NavKey, { label: string; sublabel: string }> = {
    dashboard: { label: "数据大盘", sublabel: "Analytics Dashboard" },
    analyze: { label: "对话分析", sublabel: "Conversation Analysis" },
    profiles: { label: "人物画像", sublabel: "Person Profiles" },
    drill: { label: "模拟演练", sublabel: "Simulation & Coaching" },
    psychology: { label: "心理顾问", sublabel: "Psychology Counselor" },
    legal: { label: "法律顾问", sublabel: "Legal Advisor" },
    planning: { label: "规划制定", sublabel: "Life & Work Planner" },
    divination: { label: "风水玄学", sublabel: "Metaphysics & Divination" },
    mbti: { label: "MBTI 检测", sublabel: "Personality Quick Test" },
    settings: { label: "数据管理", sublabel: "Data & Settings" },
  };
  return { ...item, ...zhLabels[item.id] };
});

// ---- Achievement Mini Widget ----

function AchievementMini() {
  const achievements = useAppStore((s) => s.achievements) ?? [];
  const language = useAppStore((s) => s.language);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const totalPossible = ACHIEVEMENTS.reduce((sum, a) => sum + (a.maxLevel ?? 1), 0);
  const unlocked = achievements.length;
  const pct = totalPossible > 0 ? Math.round((unlocked / totalPossible) * 100) : 0;
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - pct / 100);

  return (
    <button
      onClick={() => setActiveTab("settings")}
      className="flex items-center gap-2.5 w-full rounded-lg bg-amber-500/5 border border-amber-500/15 px-3 py-2 hover:bg-amber-500/10 transition-colors group"
    >
      <svg width="36" height="36" viewBox="0 0 36 36" className="shrink-0">
        <circle cx="18" cy="18" r={radius} fill="none" stroke="#3f3f46" strokeWidth="2.5" />
        <circle
          cx="18" cy="18" r={radius}
          fill="none" stroke="#f59e0b" strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 18 18)"
          className="transition-all duration-700"
        />
        <Trophy className="text-amber-400" x="11" y="11" width="14" height="14" />
      </svg>
      <div className="flex flex-col min-w-0 text-left">
        <span className="text-[10px] font-medium text-amber-300/80">
          {language === "en" ? "Achievements" : "成就"}
        </span>
        <span className="text-[9px] text-zinc-500">
          {unlocked}/{totalPossible} · {pct}%
        </span>
      </div>
    </button>
  );
}

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
  { id: "dashboard", icon: BarChart3, label: "大盘" },
  { id: "analyze", icon: MessageSquareText, label: "分析" },
  { id: "profiles", icon: Users, label: "画像" },
  { id: "drill", icon: Swords, label: "演练" },
  { id: "settings", icon: Settings, label: "更多" },
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
  const t = useT();
  const navItems = buildNavItems(t);

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
          {navItems.map((item, idx) => {
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
          <div className="border-t border-zinc-800 p-4 shrink-0 space-y-3">
            <AchievementMini />
            <div className="rounded-lg bg-gradient-to-br from-violet-500/10 to-blue-500/10 border border-violet-500/20 p-3">
              <p className="text-xs text-zinc-400 leading-relaxed">
                <span className="text-violet-300 font-medium">Social Intelligence OS</span>
                <br />
                {t.nav.dashboard === "Dashboard" ? "Understand others, understand yourself." : "理解他人，理解自己，优化人际。"}
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
              {navItems.map((item) => {
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
