"use client";

import { useState } from "react";
import { Link2, Plus, Trash2, X, Users, Edit3, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { RELATIONSHIP_CATEGORY_LABELS, type RelationshipCategory, type PeerRelationship } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_GROUPS: { group: string; categories: RelationshipCategory[] }[] = [
  { group: "家人", categories: ["family_parent", "family_child", "family_sibling", "family_spouse", "family_relative"] },
  { group: "朋友", categories: ["friend_close", "friend_normal", "friend_childhood"] },
  { group: "工作", categories: ["work_colleague", "work_boss", "work_subordinate", "work_client", "work_partner"] },
  { group: "学校", categories: ["school_classmate", "school_teacher", "school_student"] },
  { group: "恋爱", categories: ["romantic_partner", "romantic_ex", "romantic_crush"] },
  { group: "社会", categories: ["social_neighbor", "social_acquaintance", "medical_doctor", "medical_patient"] },
  { group: "其他", categories: ["other"] },
];

export default function PeerRelationshipEditor({ isOpen, onClose }: Props) {
  const { profiles, peerRelationships, addPeerRelationship, updatePeerRelationship, deletePeerRelationship } = useAppStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [profileAId, setProfileAId] = useState("");
  const [profileBId, setProfileBId] = useState("");
  const [category, setCategory] = useState<RelationshipCategory>("friend_normal");
  const [customLabel, setCustomLabel] = useState("");
  const [note, setNote] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState<RelationshipCategory>("friend_normal");
  const [editNote, setEditNote] = useState("");

  if (!isOpen) return null;

  const handleAdd = () => {
    if (!profileAId || !profileBId || profileAId === profileBId) return;

    // Check if relationship already exists
    const exists = peerRelationships.some(
      (r) =>
        (r.profileAId === profileAId && r.profileBId === profileBId) ||
        (r.profileAId === profileBId && r.profileBId === profileAId)
    );
    if (exists) return;

    addPeerRelationship({
      id: uuidv4(),
      profileAId,
      profileBId,
      category,
      customLabel: category === "other" ? customLabel : undefined,
      note: note || undefined,
      isManual: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    setShowAddForm(false);
    setProfileAId("");
    setProfileBId("");
    setCategory("friend_normal");
    setCustomLabel("");
    setNote("");
  };

  const startEdit = (rel: PeerRelationship) => {
    setEditingId(rel.id);
    setEditCategory(rel.category);
    setEditNote(rel.note || "");
  };

  const saveEdit = (id: string) => {
    updatePeerRelationship(id, {
      category: editCategory,
      note: editNote || undefined,
    });
    setEditingId(null);
  };

  const getProfileName = (id: string) => profiles.find((p) => p.id === id)?.name || "未知";

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/95 backdrop-blur-sm overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-200">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-blue-400" />
          <h3 className="text-sm font-medium text-zinc-200">人物间关系管理</h3>
          <span className="text-[10px] text-zinc-600">{peerRelationships.length} 条关系</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300"
          >
            <Plus className="h-3 w-3" /> 添加关系
          </button>
          <button onClick={onClose} className="p-1 rounded text-zinc-500 hover:text-zinc-300">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
        {/* Add form */}
        {showAddForm && (
          <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 space-y-2">
            <div className="flex gap-2">
              <select
                value={profileAId}
                onChange={(e) => setProfileAId(e.target.value)}
                className="flex-1 text-xs rounded border border-zinc-700 bg-zinc-800 text-zinc-300 px-2 py-1.5"
              >
                <option value="">选择人物A</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <span className="text-zinc-500 self-center text-xs">↔</span>
              <select
                value={profileBId}
                onChange={(e) => setProfileBId(e.target.value)}
                className="flex-1 text-xs rounded border border-zinc-700 bg-zinc-800 text-zinc-300 px-2 py-1.5"
              >
                <option value="">选择人物B</option>
                {profiles.filter((p) => p.id !== profileAId).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as RelationshipCategory)}
              className="w-full text-xs rounded border border-zinc-700 bg-zinc-800 text-zinc-300 px-2 py-1.5"
            >
              {CATEGORY_GROUPS.map((g) => (
                <optgroup key={g.group} label={g.group}>
                  {g.categories.map((c) => (
                    <option key={c} value={c}>{RELATIONSHIP_CATEGORY_LABELS[c]}</option>
                  ))}
                </optgroup>
              ))}
            </select>

            {category === "other" && (
              <input
                type="text"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="自定义关系名称"
                className="w-full text-xs rounded border border-zinc-700 bg-zinc-800 text-zinc-300 px-2 py-1.5"
              />
            )}

            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="备注（可选）"
              className="w-full text-xs rounded border border-zinc-700 bg-zinc-800 text-zinc-300 px-2 py-1.5"
            />

            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={!profileAId || !profileBId || profileAId === profileBId}
                className={cn(
                  "flex-1 text-xs rounded px-3 py-1.5 font-medium transition-all",
                  !profileAId || !profileBId || profileAId === profileBId
                    ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-500"
                )}
              >
                确认添加
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-xs text-zinc-500 hover:text-zinc-300 px-3 py-1.5"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* Existing relationships */}
        {peerRelationships.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-6 w-6 text-zinc-700 mx-auto mb-2" />
            <p className="text-[10px] text-zinc-500">还没有人物间关系</p>
            <p className="text-[10px] text-zinc-600 mt-1">点击"添加关系"手动建立联系</p>
          </div>
        ) : (
          peerRelationships.map((rel) => {
            const isEditing = editingId === rel.id;
            return (
              <div key={rel.id} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-zinc-200">{getProfileName(rel.profileAId)}</span>
                    <span className="text-[10px] text-zinc-500">↔</span>
                    <span className="text-xs font-medium text-zinc-200">{getProfileName(rel.profileBId)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {isEditing ? (
                      <button onClick={() => saveEdit(rel.id)} className="p-1 text-emerald-400 hover:text-emerald-300">
                        <Check className="h-3 w-3" />
                      </button>
                    ) : (
                      <button onClick={() => startEdit(rel)} className="p-1 text-zinc-600 hover:text-zinc-400">
                        <Edit3 className="h-3 w-3" />
                      </button>
                    )}
                    <button onClick={() => deletePeerRelationship(rel.id)} className="p-1 text-zinc-600 hover:text-red-400">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {isEditing ? (
                  <div className="mt-2 space-y-1.5">
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value as RelationshipCategory)}
                      className="w-full text-[10px] rounded border border-zinc-700 bg-zinc-800 text-zinc-300 px-2 py-1"
                    >
                      {CATEGORY_GROUPS.map((g) => (
                        <optgroup key={g.group} label={g.group}>
                          {g.categories.map((c) => (
                            <option key={c} value={c}>{RELATIONSHIP_CATEGORY_LABELS[c]}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      placeholder="备注"
                      className="w-full text-[10px] rounded border border-zinc-700 bg-zinc-800 text-zinc-300 px-2 py-1"
                    />
                  </div>
                ) : (
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                      {rel.customLabel || RELATIONSHIP_CATEGORY_LABELS[rel.category]}
                    </span>
                    {rel.note && <span className="text-[10px] text-zinc-500">{rel.note}</span>}
                    {rel.isManual && <span className="text-[9px] text-zinc-600">手动定义</span>}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
