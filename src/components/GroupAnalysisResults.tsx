"use client";

import { useState } from "react";
import {
  Users,
  Crown,
  TrendingUp,
  MessageCircle,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Zap,
  Network,
  Eye,
  UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---- Types ----

interface ParticipantRelation {
  target: string;
  type: string;
  evidence: string;
}

interface ParticipantPersonality {
  assertiveness?: { value: number; confidence: number };
  cooperativeness?: { value: number; confidence: number };
  emotionalStability?: { value: number; confidence: number };
  openness?: { value: number; confidence: number };
}

export interface ParticipantProfile {
  name: string;
  role: string;
  communicationStyle: string;
  influenceScore: number;
  messageCount: number;
  avgMessageLength: string;
  initiativeLevel: string;
  emotionalTone: string;
  keyBehaviors: string[];
  relationshipMap: ParticipantRelation[];
  personality: ParticipantPersonality;
}

interface SubGroup {
  members: string[];
  bond: string;
}

interface TopicFlowItem {
  topic: string;
  initiator: string;
  duration: string;
  outcome: string;
}

interface ConflictItem {
  parties: string[];
  topic: string;
  style: string;
  resolution: string;
}

interface GroupEmotionPoint {
  messageIndex: number;
  groupMood: number;
  label: string;
}

export interface GroupAnalysisResult {
  groupOverview: {
    groupSize: number;
    conversationTone: string;
    dominantTopics: string[];
    groupCohesion: number;
    groupCohesionDesc: string;
    decisionMakingStyle: string;
    communicationEfficiency: string;
  };
  powerStructure: {
    leader: string;
    leaderEvidence: string;
    influencers: string[];
    followers: string[];
    marginalized: string[];
    subGroups: SubGroup[];
  };
  topicFlow: TopicFlowItem[];
  conflictsAndTensions: ConflictItem[];
  emotionDynamics: {
    overallMood: string;
    emotionCurve: GroupEmotionPoint[];
    emotionInfluencer: string;
    emotionEvidence: string;
  };
  participantProfiles: ParticipantProfile[];
  groupInsights: string[];
  interactionAdvice: string[];
  summary: string;
}

// ---- Role colors ----

const ROLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  领导者: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
  协调者: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
  挑战者: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30" },
  搞笑担当: { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/30" },
  观察者: { bg: "bg-zinc-500/10", text: "text-zinc-400", border: "border-zinc-500/30" },
  记录者: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/30" },
};

function getRoleStyle(role: string) {
  for (const [key, style] of Object.entries(ROLE_COLORS)) {
    if (role.includes(key)) return style;
  }
  return { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/30" };
}

const RELATION_COLORS: Record<string, string> = {
  亲密: "text-pink-400",
  合作: "text-emerald-400",
  竞争: "text-orange-400",
  冷淡: "text-zinc-500",
  依附: "text-blue-400",
};

function getRelationColor(type: string) {
  for (const [key, color] of Object.entries(RELATION_COLORS)) {
    if (type.includes(key)) return color;
  }
  return "text-zinc-400";
}

// ---- Personality Radar Mini ----

function PersonalityBar({ label, value, confidence }: { label: string; value: number; confidence: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] text-zinc-500 w-14 shrink-0 text-right">{label}</span>
      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${value}%`,
            background: `linear-gradient(90deg, rgba(139,92,246,${0.3 + confidence / 150}) 0%, rgba(139,92,246,${0.5 + confidence / 120}) 100%)`,
          }}
        />
      </div>
      <span className="text-[8px] text-zinc-600 w-6 text-right">{value}</span>
    </div>
  );
}

// ---- Cohesion Ring ----

function CohesionRing({ value }: { value: number }) {
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (value / 100) * circumference;
  const color = value >= 70 ? "#22c55e" : value >= 40 ? "#eab308" : "#ef4444";

  return (
    <div className="relative w-20 h-20">
      <svg className="w-20 h-20 -rotate-90">
        <circle cx="40" cy="40" r="36" stroke="#27272a" strokeWidth="5" fill="none" />
        <circle
          cx="40" cy="40" r="36"
          stroke={color} strokeWidth="5" fill="none"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold" style={{ color }}>{value}</span>
        <span className="text-[8px] text-zinc-500">凝聚力</span>
      </div>
    </div>
  );
}

// ---- Group Emotion Chart (simple) ----

function GroupEmotionChart({ data }: { data: GroupEmotionPoint[] }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.groupMood), 1);
  const barWidth = Math.max(12, Math.min(40, 400 / data.length));

  return (
    <div className="flex items-end gap-1 h-24 px-2">
      {data.map((point, i) => {
        const height = Math.max(4, (point.groupMood / max) * 80);
        const hue = point.groupMood >= 0.6 ? 142 : point.groupMood >= 0.3 ? 45 : 0;
        return (
          <div key={i} className="flex flex-col items-center gap-1 group" style={{ width: barWidth }}>
            <div
              className="rounded-t transition-all group-hover:opacity-80"
              style={{
                height, width: "100%",
                background: `hsla(${hue}, 70%, 50%, 0.6)`,
              }}
              title={`${point.label} (${(point.groupMood * 100).toFixed(0)}%)`}
            />
            <span className="text-[7px] text-zinc-600 truncate max-w-full">{point.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ---- Influence Bar ----

function InfluenceBar({ name, score, isLeader }: { name: string; score: number; isLeader: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-zinc-300 w-16 shrink-0 truncate flex items-center gap-1">
        {isLeader && <Crown className="h-2.5 w-2.5 text-amber-400" />}
        {name}
      </span>
      <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${score}%`,
            background: isLeader
              ? "linear-gradient(90deg, #f59e0b, #eab308)"
              : "linear-gradient(90deg, #8b5cf6, #6366f1)",
          }}
        />
      </div>
      <span className="text-[9px] text-zinc-500 w-6 text-right">{score}</span>
    </div>
  );
}

// ---- Main Component ----

interface Props {
  result: GroupAnalysisResult;
}

export default function GroupAnalysisResults({ result }: Props) {
  const [expandedParticipant, setExpandedParticipant] = useState<string | null>(null);
  const [showAllTopics, setShowAllTopics] = useState(false);

  const { groupOverview, powerStructure, topicFlow, conflictsAndTensions, emotionDynamics, participantProfiles, groupInsights, interactionAdvice, summary } = result;

  const sortedProfiles = [...(participantProfiles || [])].sort((a, b) => (b.influenceScore || 0) - (a.influenceScore || 0));

  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">

      {/* ===== Summary ===== */}
      <div className="rounded-lg border border-violet-500/30 bg-gradient-to-br from-violet-500/5 to-blue-500/5 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-violet-400" />
          <h3 className="text-sm font-semibold text-violet-300">团体分析总结</h3>
          <span className="text-[9px] bg-violet-500/15 text-violet-300 px-2 py-0.5 rounded-full border border-violet-500/20">
            {groupOverview?.groupSize || participantProfiles?.length || "?"}人群聊
          </span>
        </div>
        <p className="text-sm text-zinc-300 leading-relaxed">{summary}</p>
      </div>

      {/* ===== Group Overview + Cohesion ===== */}
      <div className="rounded-lg border border-zinc-800 p-5">
        <h3 className="text-sm font-semibold text-zinc-200 mb-4 flex items-center gap-2">
          <Network className="h-4 w-4 text-blue-400" />
          群体概览
        </h3>
        <div className="flex gap-6 items-start">
          {/* Cohesion ring */}
          <CohesionRing value={groupOverview?.groupCohesion || 50} />

          <div className="flex-1 space-y-2">
            <div className="flex gap-2">
              <span className="text-[10px] text-zinc-500 w-20 shrink-0">对话氛围</span>
              <span className="text-xs text-zinc-300">{groupOverview?.conversationTone}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-[10px] text-zinc-500 w-20 shrink-0">决策方式</span>
              <span className="text-xs text-zinc-300">{groupOverview?.decisionMakingStyle}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-[10px] text-zinc-500 w-20 shrink-0">沟通效率</span>
              <span className="text-xs text-zinc-300">{groupOverview?.communicationEfficiency}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-[10px] text-zinc-500 w-20 shrink-0">凝聚力说明</span>
              <span className="text-xs text-zinc-300">{groupOverview?.groupCohesionDesc}</span>
            </div>
            {groupOverview?.dominantTopics?.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-1">
                <span className="text-[10px] text-zinc-500 w-20 shrink-0">核心话题</span>
                {groupOverview.dominantTopics.map((t, i) => (
                  <span key={i} className="text-[9px] bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/20">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== Power Structure ===== */}
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-5">
        <h3 className="text-sm font-semibold text-amber-300 mb-4 flex items-center gap-2">
          <Crown className="h-4 w-4" />
          权力结构
        </h3>

        {/* Influence ranking */}
        <div className="space-y-1.5 mb-4">
          {sortedProfiles.map((p) => (
            <InfluenceBar
              key={p.name}
              name={p.name}
              score={p.influenceScore || 0}
              isLeader={p.name === powerStructure?.leader}
            />
          ))}
        </div>

        {/* Power details */}
        <div className="grid grid-cols-2 gap-3 text-[10px]">
          {powerStructure?.leader && (
            <div className="rounded-lg bg-zinc-900/50 border border-zinc-800 p-2.5">
              <span className="text-amber-400 font-medium">主导者</span>
              <p className="text-zinc-300 mt-0.5">{powerStructure.leader}</p>
              <p className="text-zinc-600 mt-0.5 text-[9px]">{powerStructure.leaderEvidence}</p>
            </div>
          )}
          {powerStructure?.influencers?.length > 0 && (
            <div className="rounded-lg bg-zinc-900/50 border border-zinc-800 p-2.5">
              <span className="text-violet-400 font-medium">意见领袖</span>
              <p className="text-zinc-300 mt-0.5">{powerStructure.influencers.join("、")}</p>
            </div>
          )}
          {powerStructure?.followers?.length > 0 && (
            <div className="rounded-lg bg-zinc-900/50 border border-zinc-800 p-2.5">
              <span className="text-blue-400 font-medium">跟随者</span>
              <p className="text-zinc-300 mt-0.5">{powerStructure.followers.join("、")}</p>
            </div>
          )}
          {powerStructure?.marginalized?.length > 0 && (
            <div className="rounded-lg bg-zinc-900/50 border border-zinc-800 p-2.5">
              <span className="text-zinc-500 font-medium">边缘参与者</span>
              <p className="text-zinc-400 mt-0.5">{powerStructure.marginalized.join("、")}</p>
            </div>
          )}
        </div>

        {/* Sub-groups */}
        {powerStructure?.subGroups?.length > 0 && (
          <div className="mt-3 space-y-1.5">
            <span className="text-[10px] text-zinc-500 font-medium">亚群体/联盟</span>
            {powerStructure.subGroups.map((sg, i) => (
              <div key={i} className="flex items-center gap-2 text-[10px] bg-zinc-900/50 rounded-lg px-3 py-1.5 border border-zinc-800">
                <Users className="h-3 w-3 text-cyan-400 shrink-0" />
                <span className="text-cyan-300">{sg.members?.join(" + ")}</span>
                <span className="text-zinc-600">—</span>
                <span className="text-zinc-400">{sg.bond}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== Topic Flow ===== */}
      {topicFlow?.length > 0 && (
        <div className="rounded-lg border border-zinc-800 p-5">
          <h3 className="text-sm font-semibold text-zinc-200 mb-3 flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-green-400" />
            话题流转
          </h3>
          <div className="space-y-2">
            {(showAllTopics ? topicFlow : topicFlow.slice(0, 4)).map((tf, i) => (
              <div key={i} className="flex items-start gap-3 text-[10px]">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500/15 text-green-400 text-[9px] font-bold mt-0.5">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-200 font-medium">{tf.topic}</span>
                    <span className="text-zinc-600">by {tf.initiator}</span>
                    <span className="text-zinc-700">·</span>
                    <span className="text-zinc-600">{tf.duration}</span>
                  </div>
                  <p className="text-zinc-500 mt-0.5">{tf.outcome}</p>
                </div>
              </div>
            ))}
            {topicFlow.length > 4 && (
              <button
                onClick={() => setShowAllTopics(!showAllTopics)}
                className="text-[10px] text-violet-400 hover:text-violet-300 flex items-center gap-1"
              >
                {showAllTopics ? "收起" : `显示全部 ${topicFlow.length} 个话题`}
                {showAllTopics ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ===== Conflicts ===== */}
      {conflictsAndTensions?.length > 0 && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-5">
          <h3 className="text-sm font-semibold text-red-300 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            冲突与张力
          </h3>
          <div className="space-y-2">
            {conflictsAndTensions.map((c, i) => (
              <div key={i} className="rounded-lg bg-zinc-900/50 border border-zinc-800 p-3 text-[10px]">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="h-3 w-3 text-red-400" />
                  <span className="text-red-300 font-medium">{c.parties?.join(" ⚡ ")}</span>
                  <span className="text-zinc-600">—</span>
                  <span className="text-zinc-400">{c.topic}</span>
                </div>
                <p className="text-zinc-500 pl-5">
                  <span className="text-zinc-600">方式: </span>{c.style}
                  <span className="text-zinc-700 mx-1">|</span>
                  <span className="text-zinc-600">结果: </span>{c.resolution}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== Emotion Dynamics ===== */}
      {emotionDynamics && (
        <div className="rounded-lg border border-zinc-800 p-5">
          <h3 className="text-sm font-semibold text-zinc-200 mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-cyan-400" />
            群体情绪动态
          </h3>
          <div className="space-y-3">
            <div className="flex gap-4 text-[10px]">
              <div>
                <span className="text-zinc-500">整体基调：</span>
                <span className="text-zinc-300">{emotionDynamics.overallMood}</span>
              </div>
              <div>
                <span className="text-zinc-500">情绪核心：</span>
                <span className="text-cyan-300">{emotionDynamics.emotionInfluencer}</span>
              </div>
            </div>
            {emotionDynamics.emotionCurve?.length > 0 && (
              <GroupEmotionChart data={emotionDynamics.emotionCurve} />
            )}
            {emotionDynamics.emotionEvidence && (
              <p className="text-[10px] text-zinc-500 italic border-t border-zinc-800 pt-2">
                {emotionDynamics.emotionEvidence}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ===== Participant Profiles ===== */}
      <div className="rounded-lg border border-zinc-800 p-5">
        <h3 className="text-sm font-semibold text-zinc-200 mb-4 flex items-center gap-2">
          <UserCircle className="h-4 w-4 text-violet-400" />
          参与者画像
        </h3>
        <div className="space-y-2">
          {sortedProfiles.map((p) => {
            const roleStyle = getRoleStyle(p.role);
            const isExpanded = expandedParticipant === p.name;

            return (
              <div key={p.name} className="border border-zinc-800 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedParticipant(isExpanded ? null : p.name)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/50 transition-colors"
                >
                  <div className={cn("flex items-center justify-center w-7 h-7 rounded-lg text-[10px] font-bold", roleStyle.bg, roleStyle.text, "border", roleStyle.border)}>
                    {p.name.slice(0, 1)}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-zinc-200">{p.name}</span>
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full border", roleStyle.bg, roleStyle.text, roleStyle.border)}>
                        {p.role}
                      </span>
                      {p.name === powerStructure?.leader && (
                        <Crown className="h-3 w-3 text-amber-400" />
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{p.communicationStyle}</p>
                  </div>
                  <div className="flex items-center gap-3 text-[9px] text-zinc-600">
                    <span>影响力 {p.influenceScore}</span>
                    <span>{p.messageCount}条</span>
                    {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-zinc-800 px-4 py-3 space-y-3 bg-zinc-900/30">
                    {/* Traits */}
                    <div className="grid grid-cols-3 gap-2 text-[10px]">
                      <div>
                        <span className="text-zinc-600">消息长度</span>
                        <p className="text-zinc-300">{p.avgMessageLength}</p>
                      </div>
                      <div>
                        <span className="text-zinc-600">主动性</span>
                        <p className="text-zinc-300">{p.initiativeLevel}</p>
                      </div>
                      <div>
                        <span className="text-zinc-600">情绪基调</span>
                        <p className="text-zinc-300">{p.emotionalTone}</p>
                      </div>
                    </div>

                    {/* Key behaviors */}
                    {p.keyBehaviors?.length > 0 && (
                      <div>
                        <span className="text-[9px] text-zinc-500 font-medium">关键行为</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {p.keyBehaviors.map((b, i) => (
                            <span key={i} className="text-[9px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
                              {b}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Personality bars */}
                    {p.personality && (
                      <div className="space-y-1">
                        <span className="text-[9px] text-zinc-500 font-medium">人格特质</span>
                        {p.personality.assertiveness && (
                          <PersonalityBar label="强势度" value={p.personality.assertiveness.value} confidence={p.personality.assertiveness.confidence} />
                        )}
                        {p.personality.cooperativeness && (
                          <PersonalityBar label="合作性" value={p.personality.cooperativeness.value} confidence={p.personality.cooperativeness.confidence} />
                        )}
                        {p.personality.emotionalStability && (
                          <PersonalityBar label="情绪稳定" value={p.personality.emotionalStability.value} confidence={p.personality.emotionalStability.confidence} />
                        )}
                        {p.personality.openness && (
                          <PersonalityBar label="开放性" value={p.personality.openness.value} confidence={p.personality.openness.confidence} />
                        )}
                      </div>
                    )}

                    {/* Relationship map */}
                    {p.relationshipMap?.length > 0 && (
                      <div>
                        <span className="text-[9px] text-zinc-500 font-medium">关系图谱</span>
                        <div className="space-y-1 mt-1">
                          {p.relationshipMap.map((r, i) => (
                            <div key={i} className="flex items-center gap-2 text-[10px]">
                              <span className="text-zinc-400">{r.target}</span>
                              <span className={cn("font-medium", getRelationColor(r.type))}>{r.type}</span>
                              <span className="text-zinc-600 text-[9px]">{r.evidence}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== Group Insights ===== */}
      {groupInsights?.length > 0 && (
        <div className="rounded-lg border border-zinc-800 p-5">
          <h3 className="text-sm font-semibold text-zinc-200 mb-3 flex items-center gap-2">
            <Eye className="h-4 w-4 text-blue-400" />
            群体深层洞察
          </h3>
          <div className="space-y-2">
            {groupInsights.map((insight, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                <Lightbulb className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
                {insight}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== Interaction Advice ===== */}
      {interactionAdvice?.length > 0 && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-5">
          <h3 className="text-sm font-semibold text-emerald-300 mb-3">
            与这个群体互动的建议
          </h3>
          <div className="space-y-2">
            {interactionAdvice.map((adv, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                <ArrowRight className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                {adv}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
