"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import * as d3 from "d3";
import {
  Network,
  X,
  Maximize2,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { useT } from "@/lib/i18n";

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  conversationCount: number;
  healthScore: number;
  status: string;
  isSelf: boolean;
  tags: string[];
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  id: string;
  trustLevel: number;
  healthScore: number;
  status: string;
  conversationCount: number;
  /** "self" = link to self node, "peer" = inter-profile link */
  linkType: "self" | "peer";
  sharedTopics?: string[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectProfile: (profileId: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  warming: "#34d399",
  stable: "#60a5fa",
  cooling: "#f97316",
  unknown: "#71717a",
};

const STATUS_LABELS_EN: Record<string, string> = {
  warming: "Warming",
  stable: "Stable",
  cooling: "Cooling",
  unknown: "Unknown",
};

const STATUS_LABELS: Record<string, string> = {
  warming: "升温中",
  stable: "稳定",
  cooling: "冷却中",
  unknown: "未知",
};

export default function RelationshipGraph({ isOpen, onClose, onSelectProfile }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  const { profiles, relationships, conversations, language } = useAppStore();
  const t = useT();
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  // Build graph data — includes inter-profile peer links
  const buildGraphData = useCallback(() => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    // Add "self" center node
    const selfNode: GraphNode = {
      id: "__self__",
      name: language === "en" ? "Me" : "我",
      conversationCount: conversations.length,
      healthScore: 100,
      status: "stable",
      isSelf: true,
      tags: [],
    };
    nodes.push(selfNode);

    // Track topics per profile for inter-profile link detection
    const profileTopics = new Map<string, Set<string>>();

    // Add profile nodes
    for (const profile of profiles) {
      const rel = relationships.find((r) => r.profileId === profile.id);
      const profileConvos = conversations.filter((c) => c.linkedProfileId === profile.id);
      const convoCount = profileConvos.length;

      nodes.push({
        id: profile.id,
        name: profile.name,
        conversationCount: convoCount,
        healthScore: rel?.healthScore ?? 50,
        status: rel?.status ?? "unknown",
        isSelf: false,
        tags: profile.tags || [],
      });

      // Link to self
      links.push({
        id: `link-${profile.id}`,
        source: "__self__",
        target: profile.id,
        trustLevel: rel?.trustLevel ?? 50,
        healthScore: rel?.healthScore ?? 50,
        status: rel?.status ?? "unknown",
        conversationCount: convoCount,
        linkType: "self",
      });

      // Collect topics
      const topics = new Set<string>();
      for (const c of profileConvos) {
        if (c.analysis?.semanticContent?.coreTopics) {
          for (const t of c.analysis.semanticContent.coreTopics) topics.add(t);
        }
      }
      profileTopics.set(profile.id, topics);
    }

    // Build inter-profile peer links
    const profileIds = profiles.map((p) => p.id);
    for (let i = 0; i < profileIds.length; i++) {
      for (let j = i + 1; j < profileIds.length; j++) {
        const a = profileIds[i];
        const b = profileIds[j];
        const pa = profiles.find((p) => p.id === a)!;
        const pb = profiles.find((p) => p.id === b)!;

        // 1. Shared tags → strong connection
        const tagsA = new Set(pa.tags || []);
        const tagsB = new Set(pb.tags || []);
        const sharedTags = [...tagsA].filter((t) => tagsB.has(t));

        // 2. Shared topics → topical connection
        const topicsA = profileTopics.get(a) || new Set();
        const topicsB = profileTopics.get(b) || new Set();
        const sharedTopics = [...topicsA].filter((t) => topicsB.has(t));

        // 3. Co-mentioned in conversations
        const coMentioned = conversations.filter((c) =>
          c.participants &&
          c.participants.some((p) => p === pa.name) &&
          c.participants.some((p) => p === pb.name)
        ).length;

        const connectionStrength = sharedTags.length * 30 + sharedTopics.length * 10 + coMentioned * 25;
        if (connectionStrength > 15) {
          links.push({
            id: `peer-${a}-${b}`,
            source: a,
            target: b,
            trustLevel: Math.min(connectionStrength, 100),
            healthScore: 50,
            status: sharedTags.length > 0 ? "stable" : "unknown",
            conversationCount: coMentioned,
            linkType: "peer",
            sharedTopics: sharedTopics.slice(0, 3),
          });
        }
      }
    }

    return { nodes, links };
  }, [profiles, relationships, conversations]);

  // Resize observer
  useEffect(() => {
    if (!containerRef.current || !isOpen) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isOpen]);

  // D3 force simulation
  useEffect(() => {
    if (!isOpen || !svgRef.current) return;

    const { nodes, links } = buildGraphData();
    if (nodes.length <= 1) return; // Only self, nothing to show

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const { width, height } = dimensions;

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    const g = svg.append("g");

    // Force simulation
    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force("link", d3.forceLink<GraphNode, GraphLink>(links)
        .id((d) => d.id)
        .distance((d) => {
          // Closer for stronger relationships
          const trust = (d as GraphLink).trustLevel;
          return 120 + (100 - trust) * 1.5;
        })
        .strength(0.6)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(40));

    simulationRef.current = simulation;

    // Defs for gradients
    const defs = svg.append("defs");

    // Glow filter
    const filter = defs.append("filter").attr("id", "glow");
    filter.append("feGaussianBlur").attr("stdDeviation", "3").attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Links
    const link = g.append("g")
      .selectAll<SVGLineElement, GraphLink>("line")
      .data(links)
      .join("line")
      .attr("stroke", (d) => d.linkType === "peer" ? "#6366f1" : (STATUS_COLORS[d.status] || "#444"))
      .attr("stroke-opacity", (d) => d.linkType === "peer" ? 0.25 + (d.trustLevel / 200) : 0.3 + (d.trustLevel / 100) * 0.5)
      .attr("stroke-width", (d) => d.linkType === "peer" ? 0.8 + (d.trustLevel / 80) : 1 + (d.conversationCount * 0.5))
      .attr("stroke-dasharray", (d) => d.linkType === "peer" ? "3,5" : d.status === "cooling" ? "4,4" : "none");

    // Node groups
    const node = g.append("g")
      .selectAll<SVGGElement, GraphNode>("g")
      .data(nodes)
      .join("g")
      .attr("cursor", "pointer")
      .call(
        d3.drag<SVGGElement, GraphNode>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // Node circles
    node.append("circle")
      .attr("r", (d) => d.isSelf ? 28 : 16 + Math.min(d.conversationCount * 2, 12))
      .attr("fill", (d) => {
        if (d.isSelf) return "#7c3aed";
        return STATUS_COLORS[d.status] || "#555";
      })
      .attr("fill-opacity", 0.15)
      .attr("stroke", (d) => {
        if (d.isSelf) return "#a78bfa";
        return STATUS_COLORS[d.status] || "#666";
      })
      .attr("stroke-width", (d) => d.isSelf ? 2.5 : 1.5)
      .attr("filter", (d) => d.isSelf ? "url(#glow)" : "none");

    // Health ring (background arc)
    node.filter((d) => !d.isSelf).each(function (d) {
      const radius = 16 + Math.min(d.conversationCount * 2, 12) + 4;
      const arc = d3.arc<unknown>()
        .innerRadius(radius)
        .outerRadius(radius + 2)
        .startAngle(0)
        .endAngle((d.healthScore / 100) * 2 * Math.PI);
      d3.select(this)
        .append("path")
        .attr("d", arc({}) as string)
        .attr("fill", STATUS_COLORS[d.status] || "#666")
        .attr("opacity", 0.6);
    });

    // Labels
    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", (d) => d.isSelf ? 44 : 32 + Math.min(d.conversationCount * 2, 12))
      .attr("fill", "#d4d4d8")
      .attr("font-size", (d) => d.isSelf ? "12px" : "10px")
      .attr("font-weight", (d) => d.isSelf ? "600" : "400")
      .text((d) => d.name);

    // Self label inside circle
    node.filter((d) => d.isSelf)
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "5px")
      .attr("fill", "#a78bfa")
      .attr("font-size", "14px")
      .attr("font-weight", "700")
      .text(language === "en" ? "Me" : "我");

    // Interaction count badge
    node.filter((d) => !d.isSelf && d.conversationCount > 0)
      .append("g")
      .attr("transform", (d) => {
        const r = 16 + Math.min(d.conversationCount * 2, 12);
        return `translate(${r * 0.7}, ${-r * 0.7})`;
      })
      .each(function (d) {
        d3.select(this).append("circle")
          .attr("r", 7)
          .attr("fill", "#18181b")
          .attr("stroke", "#3f3f46")
          .attr("stroke-width", 1);
        d3.select(this).append("text")
          .attr("text-anchor", "middle")
          .attr("dy", "3.5px")
          .attr("fill", "#a1a1aa")
          .attr("font-size", "8px")
          .text(d.conversationCount.toString());
      });

    // Click handler
    node.on("click", (_event, d) => {
      if (!d.isSelf) {
        onSelectProfile(d.id);
      }
    });

    // Hover
    node.on("mouseenter", (_event, d) => {
      setHoveredNode(d);
    }).on("mouseleave", () => {
      setHoveredNode(null);
    });

    // Tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => ((d.source as GraphNode).x ?? 0))
        .attr("y1", (d) => ((d.source as GraphNode).y ?? 0))
        .attr("x2", (d) => ((d.target as GraphNode).x ?? 0))
        .attr("y2", (d) => ((d.target as GraphNode).y ?? 0));

      node.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    // Center the view
    svg.call(zoom.transform, d3.zoomIdentity.translate(0, 0).scale(1));

    return () => {
      simulation.stop();
    };
  }, [isOpen, buildGraphData, dimensions, onSelectProfile]);

  const handleZoomIn = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(300).call(
      d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.3, 3]).on("zoom", () => {}).scaleBy,
      1.3
    );
  };

  const handleZoomOut = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(300).call(
      d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.3, 3]).on("zoom", () => {}).scaleBy,
      0.7
    );
  };

  const handleFitAll = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.3, 3]).on("zoom", (event) => {
      svg.select("g").attr("transform", event.transform);
    });
    svg.call(zoom);
    svg.transition().duration(500).call(
      zoom.transform,
      d3.zoomIdentity.translate(dimensions.width / 2, dimensions.height / 2).scale(0.8).translate(-dimensions.width / 2, -dimensions.height / 2)
    );
  };

  if (!isOpen) return null;

  const hasData = profiles.length > 0;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/95 backdrop-blur-sm overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 text-violet-400" />
          <h3 className="text-sm font-medium text-zinc-200">{language === "en" ? "Relationship Graph" : "关系图谱"}</h3>
          <span className="text-[10px] text-zinc-600">
            {profiles.length} {language === "en" ? "profiles" : "人"} · {relationships.length} {language === "en" ? "links" : "条关系"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleFitAll}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            title={language === "en" ? "Fit to view" : "适应画面"}
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Graph */}
      {hasData ? (
        <div ref={containerRef} className="relative" style={{ height: "450px" }}>
          <svg
            ref={svgRef}
            width={dimensions.width}
            height={dimensions.height}
            className="w-full h-full bg-zinc-950/50"
          />

          {/* Hovered node tooltip */}
          {hoveredNode && !hoveredNode.isSelf && (
            <div className="absolute top-3 left-3 rounded-lg bg-zinc-900/95 border border-zinc-700 px-3 py-2 pointer-events-none animate-in fade-in-0 duration-150">
              <p className="text-xs font-medium text-zinc-200">{hoveredNode.name}</p>
              <div className="flex items-center gap-3 mt-1 text-[10px] text-zinc-500">
                <span>
                  {language === "en" ? "Status" : "状态"}: <span style={{ color: STATUS_COLORS[hoveredNode.status] }}>
                    {language === "en" ? STATUS_LABELS_EN[hoveredNode.status] : STATUS_LABELS[hoveredNode.status]}
                  </span>
                </span>
                <span>{language === "en" ? "Health" : "健康度"}: {hoveredNode.healthScore}%</span>
                <span>{language === "en" ? "Convos" : "对话"}: {hoveredNode.conversationCount}</span>
              </div>
              {hoveredNode.tags.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {hoveredNode.tags.map((tag) => (
                    <span key={tag} className="px-1.5 py-0.5 rounded text-[9px] bg-zinc-800 text-zinc-400 border border-zinc-700">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Legend */}
          <div className="absolute bottom-3 right-3 rounded-lg bg-zinc-900/90 border border-zinc-800 px-3 py-2">
            <div className="flex items-center gap-3 text-[9px] flex-wrap">
              {Object.entries(language === "en" ? STATUS_LABELS_EN : STATUS_LABELS).map(([key, label]) => (
                <div key={key} className="flex items-center gap-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: STATUS_COLORS[key] }}
                  />
                  <span className="text-zinc-500">{label}</span>
                </div>
              ))}
              <div className="flex items-center gap-1">
                <div className="w-4 border-t border-dashed border-indigo-400" />
                <span className="text-zinc-500">{language === "en" ? "Peer" : "互联"}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16">
          <Users className="h-8 w-8 text-zinc-700 mb-2" />
          <p className="text-xs text-zinc-500">{language === "en" ? "No profile data yet" : "暂无人物画像数据"}</p>
          <p className="text-[10px] text-zinc-600 mt-1">{language === "en" ? "Create profiles after analyzing conversations to generate the graph" : "分析对话后创建画像，即可生成关系图谱"}</p>
        </div>
      )}
    </div>
  );
}
