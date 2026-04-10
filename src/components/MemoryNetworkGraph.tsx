"use client";

import { useMemo, useState, useRef, useCallback, useEffect } from "react";
import {
  Brain,
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import type { ProfileMemoryEntry, MemoryCategory } from "@/lib/types";

// ---- Layout Constants ----
const NODE_BASE_RADIUS = 6;
const CLUSTER_RADIUS = 100;
const CENTER_X = 350;
const CENTER_Y = 280;

const CATEGORY_CONFIG: Record<MemoryCategory, { label: string; color: string; fill: string; stroke: string }> = {
  key_event:          { label: "重要事件", color: "text-amber-400",  fill: "#f59e0b", stroke: "#d97706" },
  pattern_change:     { label: "模式变化", color: "text-blue-400",   fill: "#3b82f6", stroke: "#2563eb" },
  commitment:         { label: "承诺追踪", color: "text-emerald-400",fill: "#10b981", stroke: "#059669" },
  preference:         { label: "偏好记录", color: "text-pink-400",   fill: "#ec4899", stroke: "#db2777" },
  relationship_shift: { label: "关系转折", color: "text-violet-400", fill: "#8b5cf6", stroke: "#7c3aed" },
  insight:            { label: "深层洞察", color: "text-cyan-400",   fill: "#06b6d4", stroke: "#0891b2" },
  user_note:          { label: "用户备注", color: "text-zinc-400",   fill: "#71717a", stroke: "#52525b" },
};

const CATEGORIES = Object.keys(CATEGORY_CONFIG) as MemoryCategory[];

interface MemoryNode {
  id: string;
  memory: ProfileMemoryEntry;
  x: number;
  y: number;
  radius: number;
  profileName: string;
}

interface MemoryEdge {
  source: string;
  target: string;
  reason: "same_conversation" | "same_profile" | "same_category_cross_profile";
}

/** Deterministic hash for stable jitter (avoids SSR/hydration mismatch from Math.random) */
function stableJitter(id: string, seed: number): number {
  let h = seed;
  for (let i = 0; i < id.length; i++) {
    h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  }
  return ((h & 0xffff) / 0xffff - 0.5) * 8;
}

/** Simple force-free clustered layout */
function layoutMemories(
  memories: ProfileMemoryEntry[],
  profiles: { id: string; name: string }[],
  activeCategories: Set<MemoryCategory>,
): { nodes: MemoryNode[]; edges: MemoryEdge[] } {
  const filtered = memories.filter((m) => !m.archived && activeCategories.has(m.category));
  const profileMap = new Map(profiles.map((p) => [p.id, p.name]));

  // Group by profile
  const byProfile = new Map<string, ProfileMemoryEntry[]>();
  for (const m of filtered) {
    const list = byProfile.get(m.profileId) || [];
    list.push(m);
    byProfile.set(m.profileId, list);
  }

  const profileIds = [...byProfile.keys()];
  const nodes: MemoryNode[] = [];

  // Arrange profiles in a ring
  profileIds.forEach((pid, pi) => {
    const angle = (2 * Math.PI * pi) / Math.max(profileIds.length, 1) - Math.PI / 2;
    const profileCX = CENTER_X + CLUSTER_RADIUS * Math.cos(angle) * (profileIds.length > 1 ? 1.3 : 0);
    const profileCY = CENTER_Y + CLUSTER_RADIUS * Math.sin(angle) * (profileIds.length > 1 ? 1.3 : 0);

    const mems = byProfile.get(pid) || [];
    // Arrange memories within the cluster by category
    const catGroups = new Map<MemoryCategory, ProfileMemoryEntry[]>();
    for (const m of mems) {
      const list = catGroups.get(m.category) || [];
      list.push(m);
      catGroups.set(m.category, list);
    }

    let memIdx = 0;
    const totalMems = mems.length;
    for (const [, catMems] of catGroups) {
      for (const m of catMems) {
        const subAngle = (2 * Math.PI * memIdx) / Math.max(totalMems, 1);
        const spread = Math.min(40 + totalMems * 3, 80);
        const radius = NODE_BASE_RADIUS + (m.importance - 1) * 1.5;
        nodes.push({
          id: m.id,
          memory: m,
          x: profileCX + spread * Math.cos(subAngle) + stableJitter(m.id, 1),
          y: profileCY + spread * Math.sin(subAngle) + stableJitter(m.id, 2),
          radius,
          profileName: profileMap.get(pid) || "未知",
        });
        memIdx++;
      }
    }
  });

  // Build edges: same conversation links
  const edges: MemoryEdge[] = [];
  const convMap = new Map<string, string[]>();
  for (const n of nodes) {
    if (n.memory.conversationId) {
      const list = convMap.get(n.memory.conversationId) || [];
      list.push(n.id);
      convMap.set(n.memory.conversationId, list);
    }
  }
  for (const [, ids] of convMap) {
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        edges.push({ source: ids[i], target: ids[j], reason: "same_conversation" });
      }
    }
  }

  // Cross-profile same-category links (weak links for visual connection)
  const catProfileMap = new Map<MemoryCategory, Map<string, string[]>>();
  for (const n of nodes) {
    if (!catProfileMap.has(n.memory.category)) catProfileMap.set(n.memory.category, new Map());
    const pMap = catProfileMap.get(n.memory.category)!;
    const list = pMap.get(n.memory.profileId) || [];
    list.push(n.id);
    pMap.set(n.memory.profileId, list);
  }
  for (const [, pMap] of catProfileMap) {
    const pids = [...pMap.keys()];
    if (pids.length >= 2) {
      // Connect first node of each profile pair
      for (let i = 0; i < pids.length; i++) {
        for (let j = i + 1; j < pids.length; j++) {
          const a = pMap.get(pids[i])![0];
          const b = pMap.get(pids[j])![0];
          if (a && b) {
            edges.push({ source: a, target: b, reason: "same_category_cross_profile" });
          }
        }
      }
    }
  }

  return { nodes, edges };
}

// ---- Stats Summary ----
interface MemoryStats {
  totalMemories: number;
  totalProfiles: number;
  categoryBreakdown: { category: MemoryCategory; count: number }[];
  highImportance: number;
  recentCount: number;
}

function computeStats(memories: ProfileMemoryEntry[]): MemoryStats {
  const active = memories.filter((m) => !m.archived);
  const profiles = new Set(active.map((m) => m.profileId));
  const catCount = new Map<MemoryCategory, number>();
  for (const m of active) {
    catCount.set(m.category, (catCount.get(m.category) || 0) + 1);
  }
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return {
    totalMemories: active.length,
    totalProfiles: profiles.size,
    categoryBreakdown: CATEGORIES.map((c) => ({ category: c, count: catCount.get(c) || 0 })).filter((c) => c.count > 0),
    highImportance: active.filter((m) => m.importance >= 4).length,
    recentCount: active.filter((m) => new Date(m.createdAt).getTime() > sevenDaysAgo).length,
  };
}

// ---- Main Component ----

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function MemoryNetworkGraph({ isOpen, onClose }: Props) {
  const { profileMemories, profiles } = useAppStore();
  const [zoom, setZoom] = useState(1);
  const [activeCategories, setActiveCategories] = useState<Set<MemoryCategory>>(new Set(CATEGORIES));
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const { nodes, edges } = useMemo(
    () => layoutMemories(profileMemories, profiles, activeCategories),
    [profileMemories, profiles, activeCategories]
  );

  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const stats = useMemo(() => computeStats(profileMemories), [profileMemories]);
  const selectedMemory = selectedNode ? nodeMap.get(selectedNode) : null;

  const toggleCategory = useCallback((cat: MemoryCategory) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  const resetView = useCallback(() => {
    setZoom(1);
    setSelectedNode(null);
    setHoveredNode(null);
  }, []);

  // Highlight edges connected to hovered node
  const highlightedEdges = useMemo(() => {
    const target = hoveredNode || selectedNode;
    if (!target) return new Set<number>();
    const set = new Set<number>();
    edges.forEach((e, i) => {
      if (e.source === target || e.target === target) set.add(i);
    });
    return set;
  }, [hoveredNode, selectedNode, edges]);

  if (!isOpen) return null;

  return (
    <div className="rounded-xl border border-violet-500/20 bg-zinc-900/80 overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-violet-400" />
          <h3 className="text-sm font-medium text-zinc-200">记忆网络图</h3>
          <span className="text-[10px] text-zinc-600">
            {stats.totalMemories}条记忆 · {stats.totalProfiles}个联系人
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setZoom((z) => Math.min(z + 0.2, 2.5))} className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setZoom((z) => Math.max(z - 0.2, 0.4))} className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button onClick={resetView} className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
          <button onClick={onClose} className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-48 border-r border-zinc-800 p-3 space-y-3 shrink-0">
          {/* Category Filters */}
          <div>
            <div className="flex items-center gap-1 mb-2">
              <Filter className="h-3 w-3 text-zinc-500" />
              <span className="text-[10px] text-zinc-500 font-medium">记忆类别</span>
            </div>
            <div className="space-y-1">
              {CATEGORIES.map((cat) => {
                const cfg = CATEGORY_CONFIG[cat];
                const count = stats.categoryBreakdown.find((c) => c.category === cat)?.count || 0;
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={cn(
                      "w-full flex items-center justify-between px-2 py-1 rounded text-[10px] transition-colors",
                      activeCategories.has(cat) ? "bg-zinc-800 text-zinc-300" : "text-zinc-600 hover:text-zinc-400"
                    )}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeCategories.has(cat) ? cfg.fill : "#3f3f46" }} />
                      {cfg.label}
                    </span>
                    <span className="text-zinc-600">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stats */}
          <div className="border-t border-zinc-800 pt-3 space-y-1.5">
            <span className="text-[10px] text-zinc-500 font-medium block">统计概览</span>
            <div className="grid grid-cols-2 gap-1">
              <div className="rounded bg-zinc-800/50 p-1.5 text-center">
                <span className="text-sm font-bold text-violet-400 block">{stats.totalMemories}</span>
                <span className="text-[8px] text-zinc-600">总记忆</span>
              </div>
              <div className="rounded bg-zinc-800/50 p-1.5 text-center">
                <span className="text-sm font-bold text-amber-400 block">{stats.highImportance}</span>
                <span className="text-[8px] text-zinc-600">高重要</span>
              </div>
              <div className="rounded bg-zinc-800/50 p-1.5 text-center">
                <span className="text-sm font-bold text-cyan-400 block">{stats.totalProfiles}</span>
                <span className="text-[8px] text-zinc-600">联系人</span>
              </div>
              <div className="rounded bg-zinc-800/50 p-1.5 text-center">
                <span className="text-sm font-bold text-emerald-400 block">{stats.recentCount}</span>
                <span className="text-[8px] text-zinc-600">近7天</span>
              </div>
            </div>
          </div>

          {/* Selected Memory Detail */}
          {selectedMemory && (
            <div className="border-t border-zinc-800 pt-3 space-y-1.5">
              <span className="text-[10px] text-zinc-500 font-medium block">记忆详情</span>
              <div className="rounded border border-zinc-700 bg-zinc-800/50 p-2 space-y-1">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_CONFIG[selectedMemory.memory.category].fill }} />
                  <span className={cn("text-[9px] font-medium", CATEGORY_CONFIG[selectedMemory.memory.category].color)}>
                    {CATEGORY_CONFIG[selectedMemory.memory.category].label}
                  </span>
                  <span className="text-[8px] text-zinc-600 ml-auto">
                    {selectedMemory.profileName}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-300 leading-relaxed">{selectedMemory.memory.content}</p>
                <div className="flex items-center justify-between text-[8px] text-zinc-600">
                  <span>重要度: {"★".repeat(selectedMemory.memory.importance)}{"☆".repeat(5 - selectedMemory.memory.importance)}</span>
                  <span>{new Date(selectedMemory.memory.createdAt).toLocaleDateString("zh-CN")}</span>
                </div>
                {selectedMemory.memory.source && (
                  <p className="text-[8px] text-zinc-600">来源: {selectedMemory.memory.source}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* SVG Canvas */}
        <div className="flex-1 overflow-hidden bg-zinc-950/50" style={{ minHeight: 400 }}>
          {nodes.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Brain className="h-10 w-10 text-zinc-800 mx-auto mb-2" />
                <p className="text-xs text-zinc-600">暂无记忆数据</p>
                <p className="text-[10px] text-zinc-700 mt-1">分析对话后将自动生成记忆网络</p>
              </div>
            </div>
          ) : (
            <svg
              ref={svgRef}
              viewBox={`0 0 700 560`}
              className="w-full h-full"
              style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
            >
              <defs>
                <radialGradient id="bg-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.03" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                </radialGradient>
                {CATEGORIES.map((cat) => (
                  <radialGradient key={cat} id={`glow-${cat}`} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={CATEGORY_CONFIG[cat].fill} stopOpacity="0.6" />
                    <stop offset="100%" stopColor={CATEGORY_CONFIG[cat].fill} stopOpacity="0" />
                  </radialGradient>
                ))}
              </defs>

              {/* Background */}
              <circle cx={CENTER_X} cy={CENTER_Y} r="250" fill="url(#bg-glow)" />

              {/* Profile cluster labels */}
              {(() => {
                const byProfile = new Map<string, MemoryNode[]>();
                for (const n of nodes) {
                  const list = byProfile.get(n.memory.profileId) || [];
                  list.push(n);
                  byProfile.set(n.memory.profileId, list);
                }
                return [...byProfile.entries()].map(([pid, pNodes]) => {
                  const cx = pNodes.reduce((s, n) => s + n.x, 0) / pNodes.length;
                  const cy = pNodes.reduce((s, n) => s + n.y, 0) / pNodes.length;
                  return (
                    <g key={`label-${pid}`}>
                      <circle cx={cx} cy={cy} r={Math.min(50 + pNodes.length * 4, 90)} fill="none" stroke="#27272a" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.5" />
                      <text x={cx} y={cy - Math.min(50 + pNodes.length * 4, 90) - 4} textAnchor="middle" className="text-[9px]" fill="#52525b">{pNodes[0].profileName}</text>
                    </g>
                  );
                });
              })()}

              {/* Edges */}
              {edges.map((edge, i) => {
                const s = nodeMap.get(edge.source);
                const t = nodeMap.get(edge.target);
                if (!s || !t) return null;
                const isHighlighted = highlightedEdges.has(i);
                return (
                  <line
                    key={`edge-${i}`}
                    x1={s.x}
                    y1={s.y}
                    x2={t.x}
                    y2={t.y}
                    stroke={isHighlighted ? "#8b5cf6" : edge.reason === "same_conversation" ? "#3f3f46" : "#27272a"}
                    strokeWidth={isHighlighted ? 1.5 : edge.reason === "same_conversation" ? 0.8 : 0.4}
                    strokeDasharray={edge.reason === "same_category_cross_profile" ? "2 3" : "none"}
                    opacity={isHighlighted ? 0.8 : 0.3}
                    className="transition-all duration-200"
                  />
                );
              })}

              {/* Nodes */}
              {nodes.map((node) => {
                const cfg = CATEGORY_CONFIG[node.memory.category];
                const isHovered = hoveredNode === node.id;
                const isSelected = selectedNode === node.id;
                const isActive = isHovered || isSelected;
                return (
                  <g
                    key={node.id}
                    className="cursor-pointer transition-transform duration-150"
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                    onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
                  >
                    {/* Glow */}
                    {isActive && (
                      <circle cx={node.x} cy={node.y} r={node.radius * 3} fill={`url(#glow-${node.memory.category})`} />
                    )}
                    {/* Node circle */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={isActive ? node.radius * 1.4 : node.radius}
                      fill={cfg.fill}
                      stroke={isSelected ? "#fff" : cfg.stroke}
                      strokeWidth={isSelected ? 1.5 : 0.5}
                      opacity={isActive ? 1 : 0.7 + node.memory.importance * 0.06}
                      className="transition-all duration-200"
                    />
                    {/* Importance indicator for high importance */}
                    {node.memory.importance >= 4 && !isActive && (
                      <circle cx={node.x} cy={node.y} r={node.radius + 3} fill="none" stroke={cfg.fill} strokeWidth="0.5" opacity="0.3" />
                    )}
                    {/* Tooltip on hover */}
                    {isHovered && (
                      <g>
                        <rect
                          x={node.x + node.radius + 4}
                          y={node.y - 14}
                          width={Math.min(node.memory.content.length * 6 + 16, 200)}
                          height={22}
                          rx={4}
                          fill="#18181b"
                          stroke="#3f3f46"
                          strokeWidth="0.5"
                        />
                        <text
                          x={node.x + node.radius + 12}
                          y={node.y}
                          className="text-[8px]"
                          fill="#d4d4d8"
                        >
                          {node.memory.content.length > 30 ? node.memory.content.slice(0, 30) + "…" : node.memory.content}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
