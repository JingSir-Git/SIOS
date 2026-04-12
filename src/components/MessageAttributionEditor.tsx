"use client";

import { useState, useCallback } from "react";
import {
  User,
  Users,
  ArrowLeftRight,
  Check,
  Plus,
  UserPlus,
  MousePointerClick,
  Trash2,
  Undo2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/types";
import { useAppStore } from "@/lib/store";

interface Speaker {
  id: string;
  name: string;
  role: "self" | "other";
  color: string;
}

const SPEAKER_COLORS = [
  "bg-violet-500/15 border-violet-500/30 text-violet-200",
  "bg-cyan-500/15 border-cyan-500/30 text-cyan-200",
  "bg-amber-500/15 border-amber-500/30 text-amber-200",
  "bg-emerald-500/15 border-emerald-500/30 text-emerald-200",
  "bg-pink-500/15 border-pink-500/30 text-pink-200",
  "bg-blue-500/15 border-blue-500/30 text-blue-200",
];

const SPEAKER_DOT_COLORS = [
  "bg-violet-400",
  "bg-cyan-400",
  "bg-amber-400",
  "bg-emerald-400",
  "bg-pink-400",
  "bg-blue-400",
];

const SPEAKER_BORDER_COLORS = [
  "#8b5cf6",
  "#22d3ee",
  "#f59e0b",
  "#34d399",
  "#ec4899",
  "#3b82f6",
];

interface MessageAttributionEditorProps {
  messages: ChatMessage[];
  onConfirm: (messages: ChatMessage[], speakers: Speaker[]) => void;
  onBack: () => void;
}

export default function MessageAttributionEditor({
  messages: initialMessages,
  onConfirm,
  onBack,
}: MessageAttributionEditorProps) {
  const { profiles } = useAppStore();

  // Detect unique sender names from messages for multi-party
  const uniqueSenders = Array.from(new Set(initialMessages.map((m) => m.senderName).filter(Boolean)));
  const selfNames = ["我", "自己", "me", "Me", "ME", "本人"];
  const isMultiParty = uniqueSenders.filter((n) => !selfNames.includes(n) && n !== "未归属").length > 1;

  // Initialize speakers based on detected participants
  const [speakers, setSpeakers] = useState<Speaker[]>(() => {
    if (isMultiParty && uniqueSenders.length > 2) {
      // Multi-party: create a speaker for each detected sender
      const result: Speaker[] = [
        { id: "self", name: "我", role: "self", color: SPEAKER_COLORS[0] },
      ];
      let colorIdx = 1;
      for (const name of uniqueSenders) {
        if (selfNames.includes(name)) continue;
        if (name === "未归属" || name === "未知") continue;
        result.push({
          id: `other-${colorIdx}`,
          name,
          role: "other",
          color: SPEAKER_COLORS[colorIdx % SPEAKER_COLORS.length],
        });
        colorIdx++;
      }
      if (result.length === 1) {
        result.push({ id: "other-1", name: "对方", role: "other", color: SPEAKER_COLORS[1] });
      }
      return result;
    }
    return [
      { id: "self", name: "我", role: "self", color: SPEAKER_COLORS[0] },
      { id: "other-1", name: "对方", role: "other", color: SPEAKER_COLORS[1] },
    ];
  });

  // Check if smart attribution was applied (messages already have role assignments)
  const hasSmartAttribution = initialMessages.some(
    (m) => m.senderName === "我" || m.senderName === "对方"
  );

  // Track which speaker each message belongs to — pre-fill from smart attribution
  const [assignments, setAssignments] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const msg of initialMessages) {
      if (msg.role === "self" || selfNames.includes(msg.senderName)) {
        init[msg.id] = "self";
      } else if (isMultiParty && msg.senderName) {
        // Try to match sender name to a speaker
        const matchedSpeaker = speakers.find(
          (s) => s.role === "other" && s.name === msg.senderName
        );
        init[msg.id] = matchedSpeaker?.id || "other-1";
      } else {
        init[msg.id] = "other-1";
      }
    }
    return init;
  });

  // Track deleted message IDs
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  // Current "paint" speaker for click-to-assign mode
  const [activeSpeakerId, setActiveSpeakerId] = useState<string>("self");

  // Editing speaker name
  const [editingSpeakerId, setEditingSpeakerId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  // Link to existing profile
  const [linkingProfileFor, setLinkingProfileFor] = useState<string | null>(null);

  const assignMessage = useCallback(
    (messageId: string) => {
      setAssignments((prev) => ({ ...prev, [messageId]: activeSpeakerId }));
    },
    [activeSpeakerId]
  );

  // Toggle a single message through speakers (cycle mode for multi-party)
  const toggleMessage = useCallback(
    (messageId: string) => {
      setAssignments((prev) => {
        const current = prev[messageId];
        const currentIdx = speakers.findIndex((s) => s.id === current);
        const nextIdx = (currentIdx + 1) % speakers.length;
        return { ...prev, [messageId]: speakers[nextIdx].id };
      });
    },
    [speakers]
  );

  // Batch assign: select a range
  const [rangeStart, setRangeStart] = useState<number | null>(null);

  const handleMessageClick = useCallback(
    (messageId: string, index: number, shiftKey: boolean) => {
      if (shiftKey && rangeStart !== null) {
        // Shift+click: assign range
        const start = Math.min(rangeStart, index);
        const end = Math.max(rangeStart, index);
        setAssignments((prev) => {
          const updated = { ...prev };
          for (let i = start; i <= end; i++) {
            updated[initialMessages[i].id] = activeSpeakerId;
          }
          return updated;
        });
        setRangeStart(null);
      } else {
        // Click to cycle through all speakers (works for 2-party and multi-party)
        toggleMessage(messageId);
      }
      setRangeStart(index);
    },
    [activeSpeakerId, rangeStart, initialMessages, speakers.length, toggleMessage, assignMessage]
  );

  const addSpeaker = () => {
    const idx = speakers.length;
    const colorIdx = idx % SPEAKER_COLORS.length;
    const newSpeaker: Speaker = {
      id: `other-${idx}`,
      name: `参与者${idx + 1}`,
      role: "other",
      color: SPEAKER_COLORS[colorIdx],
    };
    setSpeakers((prev) => [...prev, newSpeaker]);
  };

  const startEditName = (speaker: Speaker) => {
    setEditingSpeakerId(speaker.id);
    setEditingName(speaker.name);
  };

  const confirmEditName = () => {
    if (editingSpeakerId && editingName.trim()) {
      setSpeakers((prev) =>
        prev.map((s) =>
          s.id === editingSpeakerId ? { ...s, name: editingName.trim() } : s
        )
      );
    }
    setEditingSpeakerId(null);
    setEditingName("");
  };

  const linkProfile = (speakerId: string, profileId: string) => {
    const profile = profiles.find((p) => p.id === profileId);
    if (profile) {
      setSpeakers((prev) =>
        prev.map((s) =>
          s.id === speakerId ? { ...s, name: profile.name } : s
        )
      );
    }
    setLinkingProfileFor(null);
  };

  const deleteMessage = useCallback((messageId: string) => {
    setDeletedIds((prev) => new Set(prev).add(messageId));
  }, []);

  const undeleteMessage = useCallback((messageId: string) => {
    setDeletedIds((prev) => {
      const next = new Set(prev);
      next.delete(messageId);
      return next;
    });
  }, []);

  // Visible messages (excluding deleted)
  const visibleMessages = initialMessages.filter((m) => !deletedIds.has(m.id));

  const handleConfirm = () => {
    const updatedMessages: ChatMessage[] = visibleMessages.map((msg) => {
      const speakerId = assignments[msg.id] || "other-1";
      const speaker = speakers.find((s) => s.id === speakerId);
      return {
        ...msg,
        role: speaker?.role || "other",
        senderName: speaker?.name || "未知",
      };
    });
    onConfirm(updatedMessages, speakers);
  };

  const getSpeakerForMessage = (messageId: string) => {
    const speakerId = assignments[messageId] || "other-1";
    return speakers.find((s) => s.id === speakerId) || speakers[1];
  };

  const getSpeakerDotColor = (speakerId: string) => {
    const idx = speakers.findIndex((s) => s.id === speakerId);
    return SPEAKER_DOT_COLORS[idx % SPEAKER_DOT_COLORS.length];
  };

  // Stats (excluding deleted messages)
  const visibleAssignments = Object.entries(assignments).filter(([id]) => !deletedIds.has(id));
  const speakerStats = speakers.map((s) => ({
    ...s,
    count: visibleAssignments.filter(([, sid]) => sid === s.id).length,
  }));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className={cn(
        "rounded-lg border p-4",
        hasSmartAttribution
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-amber-500/30 bg-amber-500/5"
      )}>
        <div className="flex items-center gap-2 mb-2">
          <MousePointerClick className={cn("h-4 w-4", hasSmartAttribution ? "text-emerald-400" : "text-amber-400")} />
          <h3 className={cn("text-sm font-semibold", hasSmartAttribution ? "text-emerald-200" : "text-amber-200")}>
            {hasSmartAttribution ? "智能归属识别完成" : "消息归属标注"}
          </h3>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          {hasSmartAttribution ? (
            <>
              系统已根据对话节奏、语言特征自动识别发言者。请检查标注是否正确，如有错误点击消息即可修正。
              <br />
              <span className="text-zinc-500">
                点击消息在{speakers.length > 2 ? `${speakers.length}位参与者` : "「我」和「对方」"}之间循环切换 · Shift+点击批量选择 · 大部分情况只需微调几条
              </span>
            </>
          ) : (
            <>
              系统检测到这段对话没有明确的发言者标记。请点击每条消息来标注是谁说的。
              <br />
              <span className="text-zinc-500">
                点击消息在{speakers.length > 2 ? `${speakers.length}位参与者` : "「我」和「对方」"}之间循环切换 · Shift+点击可批量选择
                {speakers.length <= 2 && " · 群聊请点击「添加」增加参与者"}
              </span>
            </>
          )}
        </p>
      </div>

      {/* Speaker Palette */}
      <div className="rounded-lg border border-zinc-800 p-3">
        <div className="flex items-center gap-2 mb-2">
          <Users className="h-3.5 w-3.5 text-zinc-400" />
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">
            参与者
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {speakers.map((speaker) => {
            const stats = speakerStats.find((s) => s.id === speaker.id);
            const isActive = activeSpeakerId === speaker.id;
            return (
              <div key={speaker.id} className="flex items-center gap-1">
                <button
                  onClick={() => setActiveSpeakerId(speaker.id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-all",
                    isActive
                      ? speaker.color + " ring-1 ring-white/20"
                      : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600"
                  )}
                >
                  <div className={cn("h-2 w-2 rounded-full", getSpeakerDotColor(speaker.id))} />
                  {editingSpeakerId === speaker.id ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") confirmEditName();
                        if (e.key === "Escape") setEditingSpeakerId(null);
                      }}
                      onBlur={confirmEditName}
                      autoFocus
                      className="bg-transparent border-none outline-none w-16 text-xs"
                    />
                  ) : (
                    <span
                      onDoubleClick={() => startEditName(speaker)}
                      className="cursor-text"
                    >
                      {speaker.name}
                    </span>
                  )}
                  <span className="text-[10px] opacity-50">({stats?.count || 0})</span>
                </button>

                {/* Link to existing profile */}
                {speaker.role === "other" && profiles.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={() =>
                        setLinkingProfileFor(
                          linkingProfileFor === speaker.id ? null : speaker.id
                        )
                      }
                      className="p-1 rounded text-zinc-600 hover:text-zinc-400 transition-colors"
                      title="关联已有画像"
                    >
                      <UserPlus className="h-3 w-3" />
                    </button>
                    {linkingProfileFor === speaker.id && (
                      <div className="absolute top-full left-0 mt-1 z-10 rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl p-1 min-w-[140px]">
                        {profiles.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => linkProfile(speaker.id, p.id)}
                            className="w-full text-left px-2 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 rounded transition-colors"
                          >
                            {p.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <button
            onClick={addSpeaker}
            className="flex items-center gap-1 rounded-lg border border-dashed border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-600 hover:text-zinc-400 hover:border-zinc-500 transition-colors"
            title="添加更多参与者（群聊场景）"
          >
            <Plus className="h-3 w-3" />
            添加
          </button>
        </div>
        <p className="text-[10px] text-zinc-600 mt-2">
          双击名字可重命名 · 点击{" "}
          <UserPlus className="h-2.5 w-2.5 inline" /> 可关联已有画像
          {speakers.length > 2 && " · 点击消息循环切换参与者 · Shift+点击使用选中参与者批量标注"}
        </p>
        {speakers.length > 2 && (
          <div className="mt-2 pt-2 border-t border-zinc-800/50">
            <div className="flex items-center gap-3 text-[9px]">
              <span className="text-zinc-600">消息布局:</span>
              <span className="text-violet-400">我 → 右侧</span>
              <span className="text-zinc-500">|</span>
              {speakers.filter(s => s.role === "other").map((s, i) => (
                <span key={s.id} className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: SPEAKER_BORDER_COLORS[(i + 1) % SPEAKER_BORDER_COLORS.length] }} />
                  <span className="text-zinc-400">{s.name} → 左侧</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Message Bubbles — WeChat-style: self right, all others left */}
      <div className="rounded-lg border border-zinc-800 p-4 max-h-[50vh] overflow-y-auto space-y-1.5">
        {visibleMessages.map((msg, idx) => {
          const speaker = getSpeakerForMessage(msg.id);
          const isSelf = speaker.role === "self";
          const dotColor = getSpeakerDotColor(assignments[msg.id] || "other-1");
          const speakerIdx = speakers.findIndex((s) => s.id === (assignments[msg.id] || "other-1"));
          const borderAccent = SPEAKER_DOT_COLORS[speakerIdx % SPEAKER_DOT_COLORS.length];

          return (
            <div
              key={msg.id}
              onClick={(e) => handleMessageClick(msg.id, idx, e.shiftKey)}
              className={cn(
                "flex items-start gap-2 rounded-lg border px-3 py-2 cursor-pointer transition-all select-none",
                "hover:ring-1 hover:ring-white/10",
                isSelf
                  ? "bg-violet-500/10 border-violet-500/20 ml-12 flex-row-reverse text-right"
                  : "bg-zinc-800/50 border-zinc-700/50 mr-12",
                speakers.length > 2 && speaker.color
              )}
              style={!isSelf && speakers.length > 2 ? { borderLeftWidth: 3, borderLeftColor: SPEAKER_BORDER_COLORS[speakerIdx % SPEAKER_BORDER_COLORS.length] } : undefined}
            >
              <div className={cn("h-2 w-2 rounded-full mt-1.5 shrink-0", dotColor)} />
              <div className="flex-1 min-w-0">
                <div className={cn("flex items-center gap-2 mb-0.5", isSelf && "justify-end")}>
                  <span className="text-[10px] font-medium opacity-60">
                    {speaker.name}
                  </span>
                  <span className="text-[10px] opacity-30">#{idx + 1}</span>
                </div>
                <p className={cn("text-xs text-zinc-200 leading-relaxed break-all", isSelf && "text-right")}>
                  {msg.content}
                </p>
              </div>
              <div className="flex flex-col gap-0.5 shrink-0 mt-0.5">
                <ArrowLeftRight className="h-3 w-3 text-zinc-600" />
                <button
                  onClick={(e) => { e.stopPropagation(); deleteMessage(msg.id); }}
                  className="p-0.5 rounded text-zinc-600 hover:text-red-400 transition-colors"
                  title="删除这条消息"
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </button>
              </div>
            </div>
          );
        })}
        {deletedIds.size > 0 && (
          <div className="flex items-center justify-between rounded-lg bg-red-500/5 border border-red-500/20 px-3 py-1.5 mt-2">
            <span className="text-[10px] text-red-300">已删除 {deletedIds.size} 条消息</span>
            <button
              onClick={() => setDeletedIds(new Set())}
              className="flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300"
            >
              <Undo2 className="h-2.5 w-2.5" /> 全部恢复
            </button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="rounded-lg border border-zinc-700 px-4 py-2 text-xs text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-colors"
        >
          返回修改
        </button>
        <button
          onClick={handleConfirm}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-violet-600 text-white px-6 py-2.5 text-sm font-medium hover:bg-violet-500 transition-all shadow-lg shadow-violet-500/20"
        >
          <Check className="h-4 w-4" />
          确认归属，开始分析
        </button>
      </div>
    </div>
  );
}
