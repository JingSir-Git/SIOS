"use client";

import { useState } from "react";
import {
  Eye,
  Heart,
  Shield,
  Save,
  X,
  Plus,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import type { SubjectiveImpression } from "@/lib/types";

const EMOTIONAL_TONES = [
  "亲近", "信任", "尊敬", "欣赏", "感激",
  "中立", "客气", "警惕", "疏远", "不满", "畏惧",
];

const KEYWORD_SUGGESTIONS = [
  "靠谱", "热心", "有城府", "直率", "圆滑", "有能力",
  "强势", "温和", "理性", "感性", "拖延", "高效",
  "善解人意", "自私", "大方", "计较", "有趣", "无聊",
];

interface Props {
  profileId: string;
  profileName: string;
  existing?: SubjectiveImpression;
}

export default function SubjectiveImpressionEditor({ profileId, profileName, existing }: Props) {
  const { updateProfile } = useAppStore();
  const [editing, setEditing] = useState(false);

  const [relationship, setRelationship] = useState(existing?.relationship || "");
  const [firstImpression, setFirstImpression] = useState(existing?.firstImpression || "");
  const [keywords, setKeywords] = useState<string[]>(existing?.personalityKeywords || []);
  const [trustLevel, setTrustLevel] = useState(existing?.trustLevel ?? 50);
  const [comfortLevel, setComfortLevel] = useState(existing?.comfortLevel ?? 50);
  const [emotionalTone, setEmotionalTone] = useState(existing?.emotionalTone || "中立");
  const [knownBackground, setKnownBackground] = useState(existing?.knownBackground || "");
  const [unresolved, setUnresolved] = useState(existing?.unresolved || "");
  const [personalNotes, setPersonalNotes] = useState(existing?.personalNotes || "");
  const [keywordInput, setKeywordInput] = useState("");

  const addKeyword = (kw: string) => {
    const trimmed = kw.trim();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords((prev) => [...prev, trimmed]);
    }
    setKeywordInput("");
  };

  const removeKeyword = (kw: string) => {
    setKeywords((prev) => prev.filter((k) => k !== kw));
  };

  const handleSave = () => {
    const impression: SubjectiveImpression = {
      relationship,
      firstImpression,
      personalityKeywords: keywords,
      trustLevel,
      comfortLevel,
      emotionalTone,
      knownBackground,
      unresolved,
      personalNotes,
      updatedAt: new Date().toISOString(),
    };
    updateProfile(profileId, { subjectiveImpression: impression });
    setEditing(false);
  };

  // Read-only display
  if (!editing && existing) {
    return (
      <div className="rounded-lg border border-zinc-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-rose-400" />
            <h3 className="text-sm font-semibold text-zinc-200">我的主观印象</h3>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <Pencil className="h-3 w-3" />
            编辑
          </button>
        </div>

        <div className="space-y-3">
          {/* Emotional Tone + Relationship */}
          <div className="flex items-center gap-3 flex-wrap">
            {existing.relationship && (
              <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-[10px] text-blue-300">
                {existing.relationship}
              </span>
            )}
            <span className="rounded-full bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 text-[10px] text-rose-300">
              {existing.emotionalTone}
            </span>
          </div>

          {/* Trust & Comfort bars */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-zinc-500">信任度</span>
                <span className="text-[10px] text-zinc-400">{existing.trustLevel}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${existing.trustLevel}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-zinc-500">舒适度</span>
                <span className="text-[10px] text-zinc-400">{existing.comfortLevel}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-violet-500 transition-all"
                  style={{ width: `${existing.comfortLevel}%` }}
                />
              </div>
            </div>
          </div>

          {/* Keywords */}
          {existing.personalityKeywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {existing.personalityKeywords.map((kw) => (
                <span
                  key={kw}
                  className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-300 border border-zinc-700"
                >
                  {kw}
                </span>
              ))}
            </div>
          )}

          {/* First impression */}
          {existing.firstImpression && (
            <div>
              <span className="text-[10px] text-zinc-500 block mb-0.5">第一印象</span>
              <p className="text-[11px] text-zinc-400">{existing.firstImpression}</p>
            </div>
          )}

          {/* Background */}
          {existing.knownBackground && (
            <div>
              <span className="text-[10px] text-zinc-500 block mb-0.5">已知背景</span>
              <p className="text-[11px] text-zinc-400">{existing.knownBackground}</p>
            </div>
          )}

          {/* Unresolved */}
          {existing.unresolved && (
            <div>
              <span className="text-[10px] text-zinc-500 block mb-0.5">待解决问题</span>
              <p className="text-[11px] text-amber-400/80">{existing.unresolved}</p>
            </div>
          )}

          {/* Notes */}
          {existing.personalNotes && (
            <div>
              <span className="text-[10px] text-zinc-500 block mb-0.5">备注</span>
              <p className="text-[11px] text-zinc-400">{existing.personalNotes}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Edit / Create mode
  return (
    <div className="rounded-lg border border-rose-500/20 bg-zinc-900/50 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-rose-400" />
          <h3 className="text-sm font-semibold text-zinc-200">
            {existing ? "编辑" : "添加"}我对「{profileName}」的主观印象
          </h3>
        </div>
        {existing && (
          <button
            onClick={() => setEditing(false)}
            className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Relationship + Emotional Tone */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-zinc-500 mb-1 block">关系类型</label>
            <input
              type="text"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              placeholder="如：同事、客户、朋友..."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-rose-500/50"
            />
          </div>
          <div>
            <label className="text-[10px] text-zinc-500 mb-1 block">情感态度</label>
            <div className="flex flex-wrap gap-1">
              {EMOTIONAL_TONES.map((tone) => (
                <button
                  key={tone}
                  onClick={() => setEmotionalTone(tone)}
                  className={cn(
                    "rounded-md px-2 py-1 text-[10px] border transition-colors",
                    emotionalTone === tone
                      ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                      : "text-zinc-500 border-zinc-700 hover:text-zinc-300 hover:border-zinc-600"
                  )}
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Trust & Comfort sliders */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] text-zinc-500 flex items-center gap-1">
                <Shield className="h-3 w-3" /> 信任度
              </label>
              <span className="text-[10px] text-zinc-400">{trustLevel}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={trustLevel}
              onChange={(e) => setTrustLevel(Number(e.target.value))}
              className="w-full accent-emerald-500 h-1.5"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] text-zinc-500 flex items-center gap-1">
                <Heart className="h-3 w-3" /> 舒适度
              </label>
              <span className="text-[10px] text-zinc-400">{comfortLevel}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={comfortLevel}
              onChange={(e) => setComfortLevel(Number(e.target.value))}
              className="w-full accent-violet-500 h-1.5"
            />
          </div>
        </div>

        {/* Personality Keywords */}
        <div>
          <label className="text-[10px] text-zinc-500 mb-1 block">性格关键词</label>
          <div className="flex flex-wrap gap-1 mb-2">
            {keywords.map((kw) => (
              <button
                key={kw}
                onClick={() => removeKeyword(kw)}
                className="rounded-md bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[10px] text-rose-300 hover:bg-rose-500/20 transition-colors"
              >
                {kw} ×
              </button>
            ))}
          </div>
          <div className="flex gap-2 mb-1.5">
            <input
              type="text"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addKeyword(keywordInput); }}
              placeholder="输入关键词..."
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-rose-500/50"
            />
            <button
              onClick={() => addKeyword(keywordInput)}
              disabled={!keywordInput.trim()}
              className="rounded-lg bg-zinc-800 px-2 py-1.5 text-zinc-400 hover:text-zinc-200 disabled:opacity-30"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {KEYWORD_SUGGESTIONS.filter((s) => !keywords.includes(s)).slice(0, 12).map((s) => (
              <button
                key={s}
                onClick={() => addKeyword(s)}
                className="rounded-md px-1.5 py-0.5 text-[9px] text-zinc-600 border border-zinc-800 hover:text-zinc-400 hover:border-zinc-700 transition-colors"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>

        {/* First Impression */}
        <div>
          <label className="text-[10px] text-zinc-500 mb-1 block">第一印象</label>
          <input
            type="text"
            value={firstImpression}
            onChange={(e) => setFirstImpression(e.target.value)}
            placeholder="初次接触时的感觉..."
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-rose-500/50"
          />
        </div>

        {/* Known Background */}
        <div>
          <label className="text-[10px] text-zinc-500 mb-1 block">已知背景信息</label>
          <textarea
            value={knownBackground}
            onChange={(e) => setKnownBackground(e.target.value)}
            placeholder="你了解的关于此人的背景（行业、职位、家庭等）..."
            rows={2}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-rose-500/50 resize-none"
          />
        </div>

        {/* Unresolved Issues */}
        <div>
          <label className="text-[10px] text-zinc-500 mb-1 block">待解决的问题/矛盾</label>
          <textarea
            value={unresolved}
            onChange={(e) => setUnresolved(e.target.value)}
            placeholder="和此人之间尚未解决的事项或分歧..."
            rows={2}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-rose-500/50 resize-none"
          />
        </div>

        {/* Personal Notes */}
        <div>
          <label className="text-[10px] text-zinc-500 mb-1 block">个人备注</label>
          <textarea
            value={personalNotes}
            onChange={(e) => setPersonalNotes(e.target.value)}
            placeholder="任何你想记住的关于此人的信息..."
            rows={2}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-rose-500/50 resize-none"
          />
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-medium text-white hover:bg-rose-500 transition-colors shadow-lg shadow-rose-500/20"
        >
          <Save className="h-3.5 w-3.5" />
          保存主观印象
        </button>
      </div>
    </div>
  );
}
