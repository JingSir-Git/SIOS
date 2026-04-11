"use client";

import { useMemo, useState } from "react";
import {
  Users,
  Crown,
  Link2,
  Heart,
  AlertTriangle,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Network,
  Shield,
  Activity,
  Eye,
  Sparkles,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { analyzeGroupDynamics, type SocialInfluenceScore, type GroupDynamicsReport } from "@/lib/group-dynamics";

const ROLE_CONFIG: Record<SocialInfluenceScore["role"], { icon: typeof Crown; color: string; bg: string }> = {
  leader: { icon: Crown, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  connector: { icon: Link2, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  supporter: { icon: Heart, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  observer: { icon: Eye, color: "text-zinc-400", bg: "bg-zinc-500/10 border-zinc-500/20" },
  newcomer: { icon: Sparkles, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function GroupDynamicsPanel({ isOpen, onClose }: Props) {
  const { profiles, relationships, conversations } = useAppStore();
  const [expandedSection, setExpandedSection] = useState<string | null>("influence");

  const report = useMemo<GroupDynamicsReport | null>(() => {
    if (profiles.length < 2) return null;
    return analyzeGroupDynamics(profiles, relationships, conversations);
  }, [profiles, relationships, conversations]);

  if (!isOpen) return null;

  const toggleSection = (id: string) => {
    setExpandedSection((prev) => (prev === id ? null : id));
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/95 backdrop-blur-sm overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 text-violet-400" />
          <h3 className="text-sm font-medium text-zinc-200">群体动力学分析</h3>
        </div>
        <button
          onClick={onClose}
          className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          收起
        </button>
      </div>

      {!report ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Users className="h-8 w-8 text-zinc-700 mb-2" />
          <p className="text-xs text-zinc-500">需要至少2个人物画像才能分析群体动力学</p>
          <p className="text-[10px] text-zinc-600 mt-1">继续分析对话以建立更多画像</p>
        </div>
      ) : (
        <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
          {/* Overview Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-center">
              <div className="text-lg font-bold text-zinc-200">{report.groupHealth}</div>
              <div className="text-[10px] text-zinc-500">群体健康度</div>
              <div className={cn(
                "mt-1 h-1 rounded-full",
                report.groupHealth >= 70 ? "bg-emerald-500" :
                  report.groupHealth >= 40 ? "bg-amber-500" : "bg-red-500"
              )} style={{ width: `${report.groupHealth}%` }} />
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-center">
              <div className="text-lg font-bold text-zinc-200">{report.density}%</div>
              <div className="text-[10px] text-zinc-500">连接密度</div>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-center">
              <div className="text-lg font-bold text-zinc-200">{report.alliances.length}</div>
              <div className="text-[10px] text-zinc-500">社交圈</div>
            </div>
          </div>

          {/* Insights */}
          {report.insights.length > 0 && (
            <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 mb-1">
                <Zap className="h-3 w-3 text-violet-400" />
                <span className="text-[10px] font-medium text-violet-300">关键洞察</span>
              </div>
              {report.insights.map((insight, i) => (
                <p key={i} className="text-[11px] text-zinc-300 leading-relaxed">
                  {insight}
                </p>
              ))}
            </div>
          )}

          {/* Influence Ranking */}
          <div>
            <button
              onClick={() => toggleSection("influence")}
              className="flex items-center gap-2 w-full text-left py-1"
            >
              {expandedSection === "influence"
                ? <ChevronDown className="h-3 w-3 text-zinc-500" />
                : <ChevronRight className="h-3 w-3 text-zinc-500" />
              }
              <TrendingUp className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs font-medium text-zinc-300">影响力排名</span>
              <span className="text-[10px] text-zinc-600 ml-auto">{report.influenceScores.length}人</span>
            </button>

            {expandedSection === "influence" && (
              <div className="mt-2 space-y-2">
                {report.influenceScores.map((score, rank) => {
                  const config = ROLE_CONFIG[score.role];
                  const Icon = config.icon;
                  return (
                    <div key={score.profileId} className={cn("rounded-lg border p-3", config.bg)}>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-500 w-4 text-right">#{rank + 1}</span>
                        <Icon className={cn("h-3.5 w-3.5", config.color)} />
                        <span className="text-xs font-medium text-zinc-200 flex-1">{score.profileName}</span>
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded", config.bg, config.color)}>
                          {score.roleLabel}
                        </span>
                        <span className="text-sm font-bold text-zinc-200">{score.influence}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 ml-6 text-[9px] text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Network className="h-2.5 w-2.5" /> 中心性 {score.centrality}
                        </span>
                        <span className="flex items-center gap-1">
                          <Link2 className="h-2.5 w-2.5" /> 桥接 {score.bridging}
                        </span>
                        <span className="flex items-center gap-1">
                          <Shield className="h-2.5 w-2.5" /> 信任 {score.trust}
                        </span>
                        <span className="flex items-center gap-1">
                          <Activity className="h-2.5 w-2.5" /> 活跃 {score.activity}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Alliances */}
          {report.alliances.length > 0 && (
            <div>
              <button
                onClick={() => toggleSection("alliances")}
                className="flex items-center gap-2 w-full text-left py-1"
              >
                {expandedSection === "alliances"
                  ? <ChevronDown className="h-3 w-3 text-zinc-500" />
                  : <ChevronRight className="h-3 w-3 text-zinc-500" />
                }
                <Users className="h-3.5 w-3.5 text-blue-400" />
                <span className="text-xs font-medium text-zinc-300">社交圈 / 联盟</span>
                <span className="text-[10px] text-zinc-600 ml-auto">{report.alliances.length}个</span>
              </button>

              {expandedSection === "alliances" && (
                <div className="mt-2 space-y-2">
                  {report.alliances.map((alliance) => (
                    <div key={alliance.id} className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-blue-300">{alliance.label}</span>
                        <span className="text-[10px] text-zinc-500">
                          强度 {alliance.strength}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        {alliance.members.map((m) => (
                          <span key={m.id} className="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/10 text-blue-300 border border-blue-500/20">
                            {m.name}
                          </span>
                        ))}
                      </div>
                      {(alliance.sharedTopics.length > 0 || alliance.sharedTags.length > 0) && (
                        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                          {alliance.sharedTags.map((tag) => (
                            <span key={tag} className="px-1.5 py-0.5 rounded text-[9px] bg-zinc-800 text-zinc-400">
                              #{tag}
                            </span>
                          ))}
                          {alliance.sharedTopics.map((topic) => (
                            <span key={topic} className="text-[9px] text-zinc-500">
                              {topic}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Conflict Axes */}
          {report.conflictAxes.length > 0 && (
            <div>
              <button
                onClick={() => toggleSection("conflicts")}
                className="flex items-center gap-2 w-full text-left py-1"
              >
                {expandedSection === "conflicts"
                  ? <ChevronDown className="h-3 w-3 text-zinc-500" />
                  : <ChevronRight className="h-3 w-3 text-zinc-500" />
                }
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-xs font-medium text-zinc-300">需要关注的关系</span>
                <span className="text-[10px] text-zinc-600 ml-auto">{report.conflictAxes.length}段</span>
              </button>

              {expandedSection === "conflicts" && (
                <div className="mt-2 space-y-2">
                  {report.conflictAxes.map((conflict, i) => (
                    <div key={i} className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-amber-300">
                          {conflict.aName} ↔ {conflict.bName}
                        </span>
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded",
                          conflict.severity >= 70
                            ? "bg-red-500/10 text-red-400 border border-red-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        )}>
                          {conflict.severity >= 70 ? "高风险" : "需关注"}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-1">{conflict.reason}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
