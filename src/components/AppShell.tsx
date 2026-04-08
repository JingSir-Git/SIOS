"use client";

import { useAppStore } from "@/lib/store";
import Sidebar from "./Sidebar";
import AnalyzeTab from "./AnalyzeTab";
import ProfilesTab from "./ProfilesTab";
import CoachTab from "./CoachTab";
import SimulateTab from "./SimulateTab";
import EQTrainingTab from "./EQTrainingTab";
import StrategyTab from "./StrategyTab";
import PsychologyTab from "./PsychologyTab";
import PlanningTab from "./PlanningTab";
import MBTITab from "./MBTITab";
import DataManager from "./DataManager";
import KeyboardShortcuts from "./KeyboardShortcuts";
import OnboardingTour from "./OnboardingTour";
import HydrationGuard from "./HydrationGuard";
import ErrorBoundary from "./ErrorBoundary";
import { cn } from "@/lib/utils";

export default function AppShell() {
  const { activeTab, sidebarOpen } = useAppStore();

  const renderTab = () => {
    switch (activeTab) {
      case "analyze":
        return <AnalyzeTab />;
      case "profiles":
        return <ProfilesTab />;
      case "coach":
        return <CoachTab />;
      case "simulate":
        return <SimulateTab />;
      case "eq-training":
        return <EQTrainingTab />;
      case "strategy":
        return <StrategyTab />;
      case "psychology":
        return <PsychologyTab />;
      case "planning":
        return <PlanningTab />;
      case "mbti":
        return <MBTITab />;
      case "settings":
        return (
          <div className="flex flex-col h-full">
            <div className="border-b border-zinc-800 px-6 py-4">
              <h1 className="text-lg font-semibold text-zinc-100">数据管理</h1>
              <p className="text-xs text-zinc-500 mt-1">导出、导入和管理你的所有数据。本地优先，安全可控。</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-2xl mx-auto px-6 py-6">
                <DataManager />
              </div>
            </div>
          </div>
        );
      default:
        return <AnalyzeTab />;
    }
  };

  return (
    <HydrationGuard>
      <div className="flex h-screen bg-zinc-950 text-zinc-100">
        <KeyboardShortcuts />
        <OnboardingTour />
        <Sidebar />
        <main
          className={cn(
            "flex-1 flex flex-col min-h-0 transition-all duration-300",
            sidebarOpen ? "ml-64" : "ml-16"
          )}
        >
          <ErrorBoundary fallbackMessage="模块加载出错，请重试">
            {renderTab()}
          </ErrorBoundary>
        </main>
      </div>
    </HydrationGuard>
  );
}
