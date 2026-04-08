"use client";

import { useState } from "react";
import {
  User,
  Trash2,
  ChevronRight,
  ArrowLeft,
  MessageSquare,
  Shield,
  Zap,
  Heart,
  AlertTriangle,
  UserPlus,
  Tag,
  X,
  Search,
  History,
  FileText,
  Clock,
  GitMerge,
  Swords,
  Compass,
  MessageCircle,
  HeartHandshake,
  GraduationCap,
  UserCircle,
  Share2,
} from "lucide-react";
import { cn, getConfidenceLabel, getConfidenceColor, formatDate } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import RadarChart from "./RadarChart";
import RelationshipAlerts from "./RelationshipAlerts";
import RelationshipTrends from "./RelationshipTrends";
import ProfileMerge from "./ProfileMerge";
import SubjectiveImpressionEditor from "./SubjectiveImpressionEditor";
import SelfProfileTab from "./SelfProfileTab";
import ProfileEvolutionChart from "./ProfileEvolutionChart";
import ProfileShareFusion from "./ProfileShareFusion";
import { TEMPLATE_CATEGORIES, type ProfileTemplate } from "@/lib/profile-templates";
import type { PersonProfile, ConversationSession } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

// ---- Relationship tag options ----
const RELATIONSHIP_TAGS = [
  { label: "同事", color: "bg-blue-500/10 text-blue-300 border-blue-500/20" },
  { label: "客户", color: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" },
  { label: "朋友", color: "bg-violet-500/10 text-violet-300 border-violet-500/20" },
  { label: "上级", color: "bg-amber-500/10 text-amber-300 border-amber-500/20" },
  { label: "下属", color: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20" },
  { label: "合作伙伴", color: "bg-pink-500/10 text-pink-300 border-pink-500/20" },
  { label: "家人", color: "bg-red-500/10 text-red-300 border-red-500/20" },
  { label: "其他", color: "bg-zinc-500/10 text-zinc-300 border-zinc-500/20" },
];

export default function ProfilesTab() {
  const { profiles, conversations, deleteProfile, addProfile } = useAppStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMerge, setShowMerge] = useState(false);
  const [showSelfProfile, setShowSelfProfile] = useState(false);

  const selectedProfile = profiles.find((p) => p.id === selectedId);

  // Find conversations that mention this profile's name in title or participants
  const getLinkedConversations = (profile: PersonProfile) => {
    return conversations.filter(
      (c) =>
        c.linkedProfileId === profile.id ||
        c.participants?.some((p) => p === profile.name) ||
        c.title?.includes(profile.name)
    );
  };

  if (selectedProfile) {
    return (
      <ProfileDetail
        profile={selectedProfile}
        linkedConversations={getLinkedConversations(selectedProfile)}
        onBack={() => setSelectedId(null)}
        onDelete={() => {
          deleteProfile(selectedProfile.id);
          setSelectedId(null);
        }}
      />
    );
  }

  // Filter profiles by search
  const filteredProfiles = searchQuery.trim()
    ? profiles.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.tags || []).some((t) => t.includes(searchQuery)) ||
          (p.communicationStyle?.overallType || "").includes(searchQuery)
      )
    : profiles;

  const handleCreateContact = (data: {
    name: string;
    tags: string[];
    notes: string;
    template?: ProfileTemplate;
  }) => {
    const t = data.template;

    const makeDim = (key: string, labelZh: string, templateValue?: number) => ({
      label: key,
      labelZh,
      value: templateValue ?? 50,
      confidence: templateValue != null ? 15 : 0, // templates give a small initial confidence
      evidence: templateValue != null ? [`基于「${t?.label}」角色模板初始化`] : [],
    });

    const dims = t?.dimensions;

    addProfile({
      id: uuidv4(),
      name: data.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dimensions: {
        assertiveness: makeDim("assertiveness", "强势程度", dims?.assertiveness),
        cooperativeness: makeDim("cooperativeness", "合作倾向", dims?.cooperativeness),
        decisionSpeed: makeDim("decisionSpeed", "决策速度", dims?.decisionSpeed),
        emotionalStability: makeDim("emotionalStability", "情绪稳定性", dims?.emotionalStability),
        openness: makeDim("openness", "开放性", dims?.openness),
        empathy: makeDim("empathy", "共情能力", dims?.empathy),
        riskTolerance: makeDim("riskTolerance", "风险承受", dims?.riskTolerance),
        formalityLevel: makeDim("formalityLevel", "正式程度", dims?.formalityLevel),
      },
      communicationStyle: t?.communicationStyle
        ? { ...t.communicationStyle, avoidTopics: [] }
        : {
            overallType: "待分析",
            strengths: [],
            weaknesses: [],
            triggerPoints: [],
            preferredTopics: [],
            avoidTopics: [],
          },
      patterns: t?.patterns
        ? { ...t.patterns, persuasionVulnerability: [] }
        : {
            responseSpeed: "未知",
            conflictStyle: "未知",
            decisionStyle: "未知",
            persuasionVulnerability: [],
          },
      conversationCount: 0,
      totalMessages: 0,
      lastInteraction: new Date().toISOString(),
      notes: data.notes,
      tags: data.tags,
    });
    setShowCreateForm(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-zinc-100">人物画像库</h1>
            <p className="text-xs text-zinc-500 mt-1">
              基于真实对话数据构建的动态心理画像，越用越精准
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSelfProfile(!showSelfProfile)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors border",
                showSelfProfile
                  ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
                  : "text-zinc-500 border-zinc-700 hover:text-zinc-300 hover:border-zinc-600"
              )}
            >
              <UserCircle className="h-3.5 w-3.5" />
              自我画像
            </button>
            {profiles.length >= 2 && (
              <button
                onClick={() => setShowMerge(!showMerge)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors border",
                  showMerge
                    ? "bg-violet-500/15 text-violet-300 border-violet-500/30"
                    : "text-zinc-500 border-zinc-700 hover:text-zinc-300 hover:border-zinc-600"
                )}
              >
                <GitMerge className="h-3.5 w-3.5" />
                去重合并
              </button>
            )}
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500 transition-colors shadow-lg shadow-violet-500/20"
            >
              <UserPlus className="h-3.5 w-3.5" />
              新建联系人
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Self Profile Panel */}
        {showSelfProfile && (
          <div className="rounded-xl border border-cyan-500/20 bg-zinc-900/50 overflow-hidden">
            <SelfProfileTab />
          </div>
        )}

        {/* Profile Merge Panel */}
        {showMerge && (
          <ProfileMerge onClose={() => setShowMerge(false)} />
        )}

        {/* Relationship Temperature Trends */}
        <RelationshipTrends />

        {/* Relationship Maintenance Alerts */}
        <RelationshipAlerts />

        {/* Create Contact Form */}
        {showCreateForm && (
          <CreateContactForm
            onSubmit={handleCreateContact}
            onCancel={() => setShowCreateForm(false)}
            existingNames={profiles.map((p) => p.name)}
          />
        )}

        {/* Search bar */}
        {profiles.length > 0 && (
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-600" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索联系人..."
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 pl-9 pr-3 py-2 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50"
            />
          </div>
        )}

        {filteredProfiles.length === 0 && !showCreateForm ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <User className="h-12 w-12 text-zinc-700 mb-4" />
            <h3 className="text-sm font-medium text-zinc-400 mb-1">
              {searchQuery ? "未找到匹配的联系人" : "暂无画像"}
            </h3>
            <p className="text-xs text-zinc-600 max-w-xs">
              {searchQuery
                ? "尝试其他关键词，或新建一个联系人"
                : "点击「新建联系人」添加，或在「对话分析」中分析对话后自动生成"}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 max-w-2xl mx-auto">
            {filteredProfiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => setSelectedId(profile.id)}
                className="flex items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 hover:border-zinc-700 hover:bg-zinc-800/50 transition-all text-left group"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-violet-300 font-medium">
                  {profile.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-200 truncate">
                      {profile.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500">
                      {profile.communicationStyle?.overallType || "待分析"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-zinc-600">
                    <span>{profile.conversationCount} 次对话</span>
                    <span>更新于 {formatDate(profile.updatedAt)}</span>
                    {profile.tags && profile.tags.length > 0 && (
                      <div className="flex gap-1">
                        {profile.tags.map((tag) => {
                          const tagConfig = RELATIONSHIP_TAGS.find((t) => t.label === tag);
                          return (
                            <span
                              key={tag}
                              className={cn(
                                "px-1 py-0.5 rounded border text-[9px]",
                                tagConfig?.color || "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                              )}
                            >
                              {tag}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Create Contact Form with Template Selection ----
function CreateContactForm({
  onSubmit,
  onCancel,
  existingNames,
}: {
  onSubmit: (data: { name: string; tags: string[]; notes: string; template?: ProfileTemplate }) => void;
  onCancel: () => void;
  existingNames: string[];
}) {
  const [name, setName] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<ProfileTemplate | null>(null);
  const [showTemplates, setShowTemplates] = useState(true); // show templates first
  const [templateCategory, setTemplateCategory] = useState(TEMPLATE_CATEGORIES[0].id);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const selectTemplate = (template: ProfileTemplate) => {
    setSelectedTemplate(template);
    // Auto-select matching relationship tags
    if (template.tags.length > 0) {
      setSelectedTags(template.tags);
    }
    setShowTemplates(false);
  };

  const handleSubmit = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("请输入联系人名称");
      return;
    }
    if (existingNames.includes(trimmedName)) {
      setError(`"${trimmedName}" 已存在，请使用其他名称`);
      return;
    }
    onSubmit({
      name: trimmedName,
      tags: selectedTags,
      notes: notes.trim(),
      template: selectedTemplate || undefined,
    });
  };

  return (
    <div className="max-w-2xl mx-auto rounded-lg border border-violet-500/30 bg-violet-500/5 p-5 space-y-4 animate-in fade-in-0 slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-violet-300 flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          新建联系人
        </h3>
        <button
          onClick={onCancel}
          className="text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Template Selector */}
      {showTemplates ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-400">选择角色模板作为起点，或从头开始：</p>
            <button
              onClick={() => {
                setSelectedTemplate(null);
                setShowTemplates(false);
              }}
              className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors underline"
            >
              跳过，从零开始
            </button>
          </div>
          {/* Category tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            {TEMPLATE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setTemplateCategory(cat.id)}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap transition-colors shrink-0",
                  templateCategory === cat.id
                    ? "bg-violet-500/15 text-violet-300 border border-violet-500/30"
                    : "text-zinc-500 hover:text-zinc-300 border border-transparent"
                )}
              >
                <span>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
          {/* Template grid */}
          <div className="grid grid-cols-2 gap-2 max-h-[280px] overflow-y-auto">
            {TEMPLATE_CATEGORIES
              .find((c) => c.id === templateCategory)
              ?.templates.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => selectTemplate(tmpl)}
                  className="text-left rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5 hover:border-violet-500/40 hover:bg-violet-500/5 transition-all group"
                >
                  <div className="text-xs font-medium text-zinc-200 group-hover:text-violet-300 mb-0.5">
                    {tmpl.label}
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-relaxed line-clamp-2">
                    {tmpl.description}
                  </p>
                  <div className="mt-1.5 flex gap-1">
                    <span className="text-[9px] px-1 py-0.5 rounded bg-zinc-700/50 text-zinc-400">
                      {tmpl.communicationStyle.overallType}
                    </span>
                  </div>
                </button>
              ))}
          </div>
        </div>
      ) : (
        <>
          {/* Selected template badge */}
          {selectedTemplate && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
              <span className="text-[10px] text-emerald-400">
                模板：{selectedTemplate.label}
              </span>
              <span className="text-[10px] text-zinc-500">
                {selectedTemplate.communicationStyle.overallType}
              </span>
              <button
                onClick={() => {
                  setSelectedTemplate(null);
                  setShowTemplates(true);
                }}
                className="ml-auto text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                更换
              </button>
            </div>
          )}

          <div>
            <label className="text-[10px] text-zinc-500 mb-1 block">名称 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              placeholder="如：王总、小李、张经理"
              autoFocus
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
            />
            {error && <p className="text-[10px] text-red-400 mt-1">{error}</p>}
          </div>

          <div>
            <label className="text-[10px] text-zinc-500 mb-1.5 block flex items-center gap-1">
              <Tag className="h-2.5 w-2.5" /> 关系标签
            </label>
            <div className="flex flex-wrap gap-1.5">
              {RELATIONSHIP_TAGS.map((tag) => (
                <button
                  key={tag.label}
                  onClick={() => toggleTag(tag.label)}
                  className={cn(
                    "px-2 py-1 rounded-lg border text-xs transition-all",
                    selectedTags.includes(tag.label)
                      ? tag.color + " ring-1 ring-white/10"
                      : "border-zinc-700 bg-zinc-800/50 text-zinc-500 hover:border-zinc-600"
                  )}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] text-zinc-500 mb-1 block">备注</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="关于这个人的其他信息：职业、公司、背景等..."
              rows={2}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 resize-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-xs text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 rounded-lg bg-violet-600 px-4 py-2 text-xs font-medium text-white hover:bg-violet-500 transition-colors"
            >
              {selectedTemplate ? `创建联系人（${selectedTemplate.label}模板）` : "创建联系人"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function ProfileDetail({
  profile,
  linkedConversations,
  onBack,
  onDelete,
}: {
  profile: PersonProfile;
  linkedConversations: ConversationSession[];
  onBack: () => void;
  onDelete: () => void;
}) {
  const { navigateToTab } = useAppStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showConversations, setShowConversations] = useState(false);
  const [showShareFusion, setShowShareFusion] = useState(false);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-zinc-800 px-6 py-4 flex items-center gap-3">
        <button
          onClick={onBack}
          className="rounded-md p-1 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-zinc-100">
            {profile.name}
          </h1>
          <p className="text-xs text-zinc-500">
            {profile.communicationStyle?.overallType || "画像分析中"}
          </p>
        </div>
        {showDeleteConfirm ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-red-400">确认删除？</span>
            <button
              onClick={onDelete}
              className="rounded px-2 py-1 text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30"
            >
              删除
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="rounded px-2 py-1 text-xs bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            >
              取消
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="rounded-md p-1 text-zinc-600 hover:text-red-400 hover:bg-zinc-800 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
          {/* Quick Actions — Cross-Tab Navigation */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigateToTab("coach", profile.id)}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-300 hover:bg-emerald-500/10 transition-colors"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              指导与此人的对话
            </button>
            <button
              onClick={() => navigateToTab("simulate", profile.id)}
              className="flex items-center gap-1.5 rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-2 text-xs text-blue-300 hover:bg-blue-500/10 transition-colors"
            >
              <Swords className="h-3.5 w-3.5" />
              模拟与此人对练
            </button>
            <button
              onClick={() => navigateToTab("strategy", profile.id)}
              className="flex items-center gap-1.5 rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-2 text-xs text-violet-300 hover:bg-violet-500/10 transition-colors"
            >
              <Compass className="h-3.5 w-3.5" />
              制定对话策略
            </button>
            <button
              onClick={() => navigateToTab("psychology", profile.id)}
              className="flex items-center gap-1.5 rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2 text-xs text-rose-300 hover:bg-rose-500/10 transition-colors"
            >
              <HeartHandshake className="h-3.5 w-3.5" />
              心理分析此人关系
            </button>
            <button
              onClick={() => navigateToTab("eq-training", profile.id)}
              className="flex items-center gap-1.5 rounded-lg border border-pink-500/20 bg-pink-500/5 px-3 py-2 text-xs text-pink-300 hover:bg-pink-500/10 transition-colors"
            >
              <GraduationCap className="h-3.5 w-3.5" />
              复盘与此人的对话
            </button>
            <button
              onClick={() => setShowShareFusion(!showShareFusion)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs transition-colors",
                showShareFusion
                  ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                  : "border-cyan-500/20 bg-cyan-500/5 text-cyan-300 hover:bg-cyan-500/10"
              )}
            >
              <Share2 className="h-3.5 w-3.5" />
              画像共享与融合
            </button>
          </div>

          {/* Share & Fusion Panel */}
          {showShareFusion && (
            <ProfileShareFusion
              profile={profile}
              onClose={() => setShowShareFusion(false)}
            />
          )}

          {/* Radar Chart */}
          <div className="rounded-lg border border-zinc-800 p-5">
            <h3 className="text-sm font-semibold text-zinc-200 mb-4">
              人格维度雷达图
            </h3>
            <RadarChart dimensions={profile.dimensions} />
          </div>

          {/* Profile Evolution Timeline */}
          <ProfileEvolutionChart profile={profile} />

          {/* Dimension Details */}
          <div className="rounded-lg border border-zinc-800 p-5">
            <h3 className="text-sm font-semibold text-zinc-200 mb-3">
              维度详情
            </h3>
            <div className="space-y-3">
              {Object.entries(profile.dimensions).map(([key, dim]) => (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400">{dim.labelZh}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-zinc-300">
                        {dim.value}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] font-mono",
                          getConfidenceColor(dim.confidence)
                        )}
                      >
                        {getConfidenceLabel(dim.confidence)}
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-400 transition-all duration-500"
                      style={{ width: `${dim.value}%`, opacity: 0.3 + (dim.confidence / 100) * 0.7 }}
                    />
                  </div>
                  {dim.evidence.length > 0 && (
                    <div className="pl-2 border-l border-zinc-800">
                      {dim.evidence.map((ev, i) => (
                        <p key={i} className="text-[10px] text-zinc-600 leading-relaxed">
                          {ev}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Communication Style */}
          {profile.communicationStyle && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-emerald-400" />
                  <h4 className="text-xs font-medium text-emerald-300">优势</h4>
                </div>
                <div className="space-y-1">
                  {profile.communicationStyle.strengths.map((s, i) => (
                    <p key={i} className="text-xs text-zinc-400">{s}</p>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <h4 className="text-xs font-medium text-amber-300">弱点</h4>
                </div>
                <div className="space-y-1">
                  {profile.communicationStyle.weaknesses.map((w, i) => (
                    <p key={i} className="text-xs text-zinc-400">{w}</p>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-red-400" />
                  <h4 className="text-xs font-medium text-red-300">情绪触发点</h4>
                </div>
                <div className="space-y-1">
                  {profile.communicationStyle.triggerPoints.map((t, i) => (
                    <p key={i} className="text-xs text-zinc-400">{t}</p>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="h-4 w-4 text-blue-400" />
                  <h4 className="text-xs font-medium text-blue-300">偏好话题</h4>
                </div>
                <div className="space-y-1">
                  {profile.communicationStyle.preferredTopics.map((t, i) => (
                    <p key={i} className="text-xs text-zinc-400">{t}</p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Behavioral Patterns */}
          {profile.patterns && (
            <div className="rounded-lg border border-zinc-800 p-5">
              <h3 className="text-sm font-semibold text-zinc-200 mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-violet-400" />
                行为模式
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <span className="text-[10px] text-zinc-600">回复速度</span>
                  <p className="text-xs text-zinc-300">{profile.patterns.responseSpeed}</p>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-600">冲突风格</span>
                  <p className="text-xs text-zinc-300">{profile.patterns.conflictStyle}</p>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-600">决策风格</span>
                  <p className="text-xs text-zinc-300">{profile.patterns.decisionStyle}</p>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-600">有效说服策略</span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {profile.patterns.persuasionVulnerability.map((p, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Subjective Impression — User's personal view */}
          <SubjectiveImpressionEditor
            profileId={profile.id}
            profileName={profile.name}
            existing={profile.subjectiveImpression}
          />

          {/* Linked Conversations — Evidence Chain */}
          <div className="rounded-lg border border-zinc-800 p-5">
            <button
              onClick={() => setShowConversations(!showConversations)}
              className="flex items-center justify-between w-full"
            >
              <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                <History className="h-4 w-4 text-violet-400" />
                证据链 · 关联对话
                {linkedConversations.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-normal">
                    {linkedConversations.length}
                  </span>
                )}
              </h3>
              <ChevronRight className={cn("h-4 w-4 text-zinc-500 transition-transform", showConversations && "rotate-90")} />
            </button>

            {showConversations && (
              <div className="mt-3 space-y-2">
                {linkedConversations.length === 0 ? (
                  <div className="text-center py-4">
                    <FileText className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
                    <p className="text-[11px] text-zinc-500">还没有关联的对话记录</p>
                    <p className="text-[10px] text-zinc-600 mt-1">在「对话分析」中分析包含此人的对话，画像会自动关联</p>
                  </div>
                ) : (
                  linkedConversations.map((convo) => (
                    <div
                      key={convo.id}
                      className="rounded-lg border border-zinc-700/50 bg-zinc-800/30 p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-zinc-300">{convo.title}</span>
                        <span className="flex items-center gap-1 text-[10px] text-zinc-600">
                          <Clock className="h-2.5 w-2.5" />
                          {formatDate(convo.createdAt)}
                        </span>
                      </div>
                      {convo.analysis && (
                        <div className="space-y-1.5">
                          {convo.analysis.summary && (
                            <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2">
                              {convo.analysis.summary}
                            </p>
                          )}
                          {convo.analysis.strategicInsights && convo.analysis.strategicInsights.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {convo.analysis.strategicInsights.slice(0, 3).map((insight, i) => (
                                <span
                                  key={i}
                                  className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20 line-clamp-1"
                                >
                                  {insight}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-4 text-[10px] text-zinc-600">
            <span>创建于 {formatDate(profile.createdAt)}</span>
            <span>更新于 {formatDate(profile.updatedAt)}</span>
            <span>{profile.conversationCount} 次对话</span>
          </div>
        </div>
      </div>
    </div>
  );
}
