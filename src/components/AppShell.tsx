"use client";

import { useAppStore } from "@/lib/store";
import Sidebar, { MobileHeader, MobileBottomBar } from "./Sidebar";
import AnalyzeTab from "./AnalyzeTab";
import ProfilesTab from "./ProfilesTab";
import CoachTab from "./CoachTab";
import SimulateTab from "./SimulateTab";
import EQTrainingTab from "./EQTrainingTab";
import StrategyTab from "./StrategyTab";
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
import RealtimeAssistant from "./RealtimeAssistant";
import PWAInstallPrompt from "./PWAInstallPrompt";
import { cn } from "@/lib/utils";

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
  return (
    <div
      id={`tab-pane-${id}`}
      className={cn("flex flex-col h-full min-h-0", !active && "hidden")}
      role="tabpanel"
      aria-hidden={!active}
    >
      <ErrorBoundary fallbackMessage="模块加载出错，请重试">
        {children}
      </ErrorBoundary>
    </div>
  );
}

export default function AppShell() {
  const { activeTab, sidebarOpen } = useAppStore();

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
          <TabPane id="coach" active={activeTab === "coach"}>
            <CoachTab />
          </TabPane>
          <TabPane id="simulate" active={activeTab === "simulate"}>
            <SimulateTab />
          </TabPane>
          <TabPane id="eq-training" active={activeTab === "eq-training"}>
            <EQTrainingTab />
          </TabPane>
          <TabPane id="strategy" active={activeTab === "strategy"}>
            <StrategyTab />
          </TabPane>
          <TabPane id="psychology" active={activeTab === "psychology"}>
            <PsychologyTab />
          </TabPane>
          <TabPane id="planning" active={activeTab === "planning"}>
            <PlanningTab />
          </TabPane>
          <TabPane id="realtime" active={activeTab === "realtime"}>
            <div className="flex flex-col h-full">
              <div className="border-b border-zinc-800 px-6 py-4">
                <h1 className="text-lg font-semibold text-zinc-100">实时助手</h1>
                <p className="text-xs text-zinc-500 mt-1">RAG记忆增强 · 情绪预测 · 实时回复建议</p>
              </div>
              <div className="flex-1 overflow-hidden px-6 py-4">
                <RealtimeAssistant />
              </div>
            </div>
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
                <h1 className="text-lg font-semibold text-zinc-100">设置</h1>
                <p className="text-xs text-zinc-500 mt-1">个性化偏好、数据管理。本地优先，安全可控。</p>
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-2xl mx-auto px-6 py-6 space-y-8">
                  <UserPreferences />
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
      </div>
      </ThemeProvider>
    </HydrationGuard>
  );
}
