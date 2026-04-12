"use client";

import { useAppStore } from "@/lib/store";
import Sidebar, { MobileHeader, MobileBottomBar } from "./Sidebar";
import AnalyzeTab from "./AnalyzeTab";
import ProfilesTab from "./ProfilesTab";
import DrillTab from "./DrillTab";
import DivinationTab from "./DivinationTab";
import PsychologyTab from "./PsychologyTab";
import PlanningTab from "./PlanningTab";
import DashboardTab from "./DashboardTab";
import MBTITab from "./MBTITab";
import DataManager from "./DataManager";
import KeyboardShortcuts from "./KeyboardShortcuts";
import OnboardingTour from "./OnboardingTour";
import HydrationGuard from "./HydrationGuard";
import ErrorBoundary from "./ErrorBoundary";
import ThemeProvider from "./ThemeProvider";
import UserPreferences from "./UserPreferences";
import ToastContainer from "./ToastContainer";
import QuickAssistPanel from "./QuickAssistPanel";
import LegalAdvisor from "./LegalAdvisor";
import PWAInstallPrompt from "./PWAInstallPrompt";
import UserMemoryPanel from "./UserMemoryPanel";
import AchievementPanel, { useAchievementChecker } from "./AchievementPanel";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

/**
 * All tabs are kept mounted simultaneously. Inactive tabs are hidden via
 * CSS (`display:none`) so that in-progress work (streaming, form state,
 * analysis results) is never lost when the user switches tabs.
 */

interface TabPaneProps {
  id: string;
  active: boolean;
  children: React.ReactNode;
}

function TabPane({ id, active, children }: TabPaneProps) {
  const lang = useAppStore((s) => s.language);
  return (
    <div
      id={`tab-pane-${id}`}
      className={cn("flex flex-col h-full min-h-0", !active && "hidden")}
      role="tabpanel"
      aria-hidden={!active}
    >
      <ErrorBoundary fallbackMessage={lang === "en" ? "Module failed to load. Please retry." : "\u6a21\u5757\u52a0\u8f7d\u51fa\u9519\uff0c\u8bf7\u91cd\u8bd5"}>
        {children}
      </ErrorBoundary>
    </div>
  );
}

function AchievementToastWrapper() {
  const { newAchievement, clearToast } = useAchievementChecker();
  if (!newAchievement) return null;
  // Re-use the toast from AchievementPanel (inline import-safe)
  const language = useAppStore((s) => s.language);
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-top-4 fade-in duration-500">
      <button onClick={clearToast} className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-zinc-900/95 backdrop-blur-xl px-5 py-3 shadow-2xl shadow-amber-500/20 cursor-pointer hover:border-amber-500/50 transition-colors">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/25">
          <span className="text-xl">{newAchievement.icon}</span>
        </div>
        <div className="text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
              {language === "en" ? "Achievement Unlocked!" : "\u6210\u5c31\u89e3\u9501\uff01"}
            </span>
            {newAchievement.level > 1 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">Lv.{newAchievement.level}</span>
            )}
          </div>
          <p className="text-sm font-semibold text-zinc-100 mt-0.5">
            {newAchievement.icon} {language === "en" ? newAchievement.title.en : newAchievement.title.zh}
          </p>
          <p className="text-[10px] text-zinc-500">
            {language === "en" ? newAchievement.description.en : newAchievement.description.zh}
          </p>
        </div>
      </button>
    </div>
  );
}

export default function AppShell() {
  const { activeTab, sidebarOpen, language } = useAppStore();
  const t = useT();

  return (
    <HydrationGuard>
      <ThemeProvider>
      <div id="app-main" className="flex h-screen bg-zinc-950 text-zinc-100">
        <KeyboardShortcuts />
        <OnboardingTour />
        <MobileHeader />
        <Sidebar />
        <main
          className={cn(
            "flex-1 flex flex-col min-h-0 transition-all duration-300",
            // Desktop: offset by sidebar width
            sidebarOpen ? "md:ml-64" : "md:ml-16",
            // Mobile: no sidebar margin, but offset for header + bottom bar
            "ml-0 pt-12 pb-14 md:pt-0 md:pb-0"
          )}
        >
          <TabPane id="analyze" active={activeTab === "analyze"}>
            <AnalyzeTab />
          </TabPane>
          <TabPane id="profiles" active={activeTab === "profiles"}>
            <ProfilesTab />
          </TabPane>
          <TabPane id="drill" active={activeTab === "drill" || activeTab === "coach" || activeTab === "simulate" || activeTab === "strategy"}>
            <DrillTab />
          </TabPane>
          <TabPane id="divination" active={activeTab === "divination"}>
            <DivinationTab />
          </TabPane>
          <TabPane id="psychology" active={activeTab === "psychology"}>
            <PsychologyTab />
          </TabPane>
          <TabPane id="legal" active={activeTab === "legal"}>
            <LegalAdvisor />
          </TabPane>
          <TabPane id="planning" active={activeTab === "planning"}>
            <PlanningTab />
          </TabPane>
          <TabPane id="dashboard" active={activeTab === "dashboard"}>
            <DashboardTab />
          </TabPane>
          <TabPane id="mbti" active={activeTab === "mbti"}>
            <MBTITab />
          </TabPane>
          <TabPane id="settings" active={activeTab === "settings"}>
            <div className="flex flex-col h-full">
              <div className="border-b border-zinc-800 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-zinc-500/10 border border-zinc-500/20 shadow-lg shadow-zinc-500/5">
                    <svg className="h-5 w-5 text-zinc-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-zinc-100">{language === "en" ? "Settings" : "数据管理"}</h1>
                    <p className="text-[10px] text-zinc-500">{language === "en" ? "Preferences · Data Management · Local-first" : "个性化偏好 · 数据管理 · 本地优先"}</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-2xl mx-auto px-6 py-6 space-y-8">
                  <UserPreferences />
                  <AchievementPanel />
                  <UserMemoryPanel />
                  <DataManager />
                </div>
              </div>
            </div>
          </TabPane>
        </main>
        <MobileBottomBar />
        <ToastContainer />
        <QuickAssistPanel />
        <PWAInstallPrompt />
        <AchievementToastWrapper />
      </div>
      </ThemeProvider>
    </HydrationGuard>
  );
}
