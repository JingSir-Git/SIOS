/**
 * Group Dynamics Analysis Engine
 *
 * Computes social influence scores, detects clusters/alliances,
 * and identifies group communication patterns.
 */

import type { PersonProfile, RelationshipEdge, ConversationSession } from "./types";

type Profile = PersonProfile;
type Relationship = RelationshipEdge;
type ConversationRecord = ConversationSession;

// ---- Types ----

export interface SocialInfluenceScore {
  profileId: string;
  profileName: string;
  /** Overall influence score 0-100 */
  influence: number;
  /** Sub-scores */
  centrality: number;       // How connected (degree centrality)
  bridging: number;         // Connects different groups (betweenness)
  trust: number;            // Average trust from others
  activity: number;         // Conversation frequency
  /** Role classification */
  role: "leader" | "connector" | "supporter" | "observer" | "newcomer";
  roleLabel: string;
}

export interface Alliance {
  id: string;
  members: { id: string; name: string }[];
  /** What binds them */
  sharedTopics: string[];
  sharedTags: string[];
  /** Strength of alliance 0-100 */
  strength: number;
  label: string;
}

export interface GroupDynamicsReport {
  /** Per-person influence scores, sorted by influence desc */
  influenceScores: SocialInfluenceScore[];
  /** Detected alliances / clusters */
  alliances: Alliance[];
  /** Conflict axes: pairs with low trust or cooling status */
  conflictAxes: { a: string; b: string; aName: string; bName: string; severity: number; reason: string }[];
  /** Overall group health 0-100 */
  groupHealth: number;
  /** Communication density (connections / possible connections) */
  density: number;
  /** Key insights */
  insights: string[];
}

// ---- Helper: adjacency list + weights ----

interface Edge {
  target: string;
  trust: number;
  status: string;
  convos: number;
}

function buildAdjacency(
  profiles: Profile[],
  relationships: Relationship[],
  conversations: ConversationRecord[]
) {
  const adj = new Map<string, Edge[]>();
  const ids = profiles.map((p) => p.id);

  // Initialize
  for (const id of ids) {
    adj.set(id, []);
  }

  // Self ↔ Profile links from relationships
  for (const rel of relationships) {
    const profileConvos = conversations.filter((c) => c.linkedProfileId === rel.profileId);
    adj.get(rel.profileId)?.push({
      target: "__self__",
      trust: rel.trustLevel,
      status: rel.status,
      convos: profileConvos.length,
    });
  }

  // Inter-profile links: shared tags, shared topics, co-mentions
  const profileTopics = new Map<string, Set<string>>();
  for (const profile of profiles) {
    const topics = new Set<string>();
    const convos = conversations.filter((c) => c.linkedProfileId === profile.id);
    for (const c of convos) {
      if (c.analysis?.semanticContent?.coreTopics) {
        for (const t of c.analysis.semanticContent.coreTopics) topics.add(t);
      }
    }
    profileTopics.set(profile.id, topics);
  }

  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = ids[i];
      const b = ids[j];
      const pa = profiles.find((p) => p.id === a)!;
      const pb = profiles.find((p) => p.id === b)!;

      const tagsA = new Set(pa.tags || []);
      const tagsB = new Set(pb.tags || []);
      const sharedTags = [...tagsA].filter((t) => tagsB.has(t));

      const topicsA = profileTopics.get(a) || new Set();
      const topicsB = profileTopics.get(b) || new Set();
      const sharedTopics = [...topicsA].filter((t) => topicsB.has(t));

      const coMentioned = conversations.filter(
        (c) =>
          c.participants &&
          c.participants.some((p) => p === pa.name) &&
          c.participants.some((p) => p === pb.name)
      ).length;

      const strength = sharedTags.length * 30 + sharedTopics.length * 10 + coMentioned * 25;
      if (strength > 0) {
        const edge = {
          trust: Math.min(strength, 100),
          status: "stable" as string,
          convos: coMentioned,
        };
        adj.get(a)?.push({ ...edge, target: b });
        adj.get(b)?.push({ ...edge, target: a });
      }
    }
  }

  return { adj, profileTopics };
}

// ---- Influence Scoring ----

function computeInfluenceScores(
  profiles: Profile[],
  relationships: Relationship[],
  conversations: ConversationRecord[],
  adj: Map<string, Edge[]>
): SocialInfluenceScore[] {
  const scores: SocialInfluenceScore[] = [];
  const totalProfiles = profiles.length;
  if (totalProfiles === 0) return scores;

  for (const profile of profiles) {
    const edges = adj.get(profile.id) || [];
    const rel = relationships.find((r) => r.profileId === profile.id);
    const profileConvos = conversations.filter((c) => c.linkedProfileId === profile.id);

    // Centrality: how many connections (normalized)
    const connections = edges.length;
    const maxConnections = totalProfiles; // includes self
    const centrality = Math.min((connections / maxConnections) * 100, 100);

    // Bridging: connects to profiles that don't connect to each other
    let bridging = 0;
    const neighbors = edges.map((e) => e.target).filter((t) => t !== "__self__");
    for (let i = 0; i < neighbors.length; i++) {
      for (let j = i + 1; j < neighbors.length; j++) {
        const iEdges = adj.get(neighbors[i]) || [];
        const connected = iEdges.some((e) => e.target === neighbors[j]);
        if (!connected) bridging += 15; // Bridge bonus
      }
    }
    bridging = Math.min(bridging, 100);

    // Trust: average trust level from relationships
    const trust = rel ? rel.trustLevel : 50;

    // Activity: conversation frequency (normalized to recent 30 days)
    const recentConvos = profileConvos.filter((c) => {
      const age = Date.now() - new Date(c.createdAt).getTime();
      return age < 30 * 24 * 60 * 60 * 1000;
    }).length;
    const activity = Math.min(recentConvos * 15, 100);

    // Overall influence: weighted sum
    const influence = Math.round(
      centrality * 0.25 + bridging * 0.2 + trust * 0.3 + activity * 0.25
    );

    // Role classification
    let role: SocialInfluenceScore["role"];
    let roleLabel: string;
    if (influence >= 70 && trust >= 60) {
      role = "leader";
      roleLabel = "核心人物";
    } else if (bridging >= 50) {
      role = "connector";
      roleLabel = "桥接者";
    } else if (trust >= 60 && activity >= 40) {
      role = "supporter";
      roleLabel = "支持者";
    } else if (profileConvos.length === 0) {
      role = "newcomer";
      roleLabel = "新关系";
    } else {
      role = "observer";
      roleLabel = "观察者";
    }

    scores.push({
      profileId: profile.id,
      profileName: profile.name,
      influence,
      centrality: Math.round(centrality),
      bridging: Math.round(bridging),
      trust,
      activity: Math.round(activity),
      role,
      roleLabel,
    });
  }

  return scores.sort((a, b) => b.influence - a.influence);
}

// ---- Alliance Detection ----

function detectAlliances(
  profiles: Profile[],
  conversations: ConversationRecord[],
  adj: Map<string, Edge[]>,
  profileTopics: Map<string, Set<string>>
): Alliance[] {
  const alliances: Alliance[] = [];
  const ids = profiles.map((p) => p.id);

  // Find cliques of size 2+ with mutual strong connections
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = ids[i];
      const b = ids[j];
      const aEdges = adj.get(a) || [];
      const bEdges = adj.get(b) || [];

      const abEdge = aEdges.find((e) => e.target === b);
      if (!abEdge || abEdge.trust < 25) continue;

      const pa = profiles.find((p) => p.id === a)!;
      const pb = profiles.find((p) => p.id === b)!;

      // Check for triangle (3-member alliance)
      const members = [{ id: a, name: pa.name }, { id: b, name: pb.name }];
      for (let k = j + 1; k < ids.length; k++) {
        const c = ids[k];
        const acEdge = aEdges.find((e) => e.target === c);
        const bcEdge = bEdges.find((e) => e.target === c);
        if (acEdge && bcEdge && acEdge.trust >= 20 && bcEdge.trust >= 20) {
          const pc = profiles.find((p) => p.id === c)!;
          members.push({ id: c, name: pc.name });
        }
      }

      if (members.length < 2) continue;

      // Check if this alliance is already covered
      const memberIds = new Set(members.map((m) => m.id));
      const alreadyCovered = alliances.some((a) => {
        const existingIds = new Set(a.members.map((m) => m.id));
        return [...memberIds].every((id) => existingIds.has(id));
      });
      if (alreadyCovered) continue;

      // Find shared topics
      const topicSets = members.map((m) => profileTopics.get(m.id) || new Set<string>());
      const sharedTopics: string[] = topicSets.length > 0
        ? [...topicSets[0]].filter((t) => topicSets.every((s) => s.has(t)))
        : [];

      // Find shared tags
      const tagSets = members.map((m) => {
        const profile = profiles.find((p) => p.id === m.id);
        return new Set(profile?.tags || []);
      });
      const sharedTags: string[] = tagSets.length > 0
        ? [...tagSets[0]].filter((t) => tagSets.every((s) => s.has(t)))
        : [];

      const strength = Math.min(
        abEdge.trust + sharedTopics.length * 10 + sharedTags.length * 15 + (members.length - 2) * 20,
        100
      );

      const label = sharedTags.length > 0
        ? `${sharedTags[0]}圈`
        : sharedTopics.length > 0
          ? `${sharedTopics[0]}相关`
          : `${members[0].name}-${members[1].name}联盟`;

      alliances.push({
        id: `alliance-${i}-${j}`,
        members,
        sharedTopics: sharedTopics.slice(0, 5),
        sharedTags: sharedTags.slice(0, 3),
        strength,
        label,
      });
    }
  }

  return alliances.sort((a, b) => b.strength - a.strength);
}

// ---- Conflict Detection ----

function detectConflicts(
  profiles: Profile[],
  relationships: Relationship[]
): GroupDynamicsReport["conflictAxes"] {
  const conflicts: GroupDynamicsReport["conflictAxes"] = [];

  for (const rel of relationships) {
    if (rel.status === "cooling" || rel.trustLevel < 30) {
      const profile = profiles.find((p) => p.id === rel.profileId);
      if (!profile) continue;

      const reasons: string[] = [];
      if (rel.status === "cooling") reasons.push("关系冷却中");
      if (rel.trustLevel < 30) reasons.push(`信任度仅${rel.trustLevel}%`);
      if (rel.healthScore < 40) reasons.push(`健康度低(${rel.healthScore}%)`);

      conflicts.push({
        a: "__self__",
        b: rel.profileId,
        aName: "我",
        bName: profile.name,
        severity: Math.max(0, 100 - rel.trustLevel),
        reason: reasons.join("；"),
      });
    }
  }

  return conflicts.sort((a, b) => b.severity - a.severity);
}

// ---- Main Analysis Function ----

export function analyzeGroupDynamics(
  profiles: Profile[],
  relationships: Relationship[],
  conversations: ConversationRecord[]
): GroupDynamicsReport {
  const { adj, profileTopics } = buildAdjacency(profiles, relationships, conversations);
  const influenceScores = computeInfluenceScores(profiles, relationships, conversations, adj);
  const alliances = detectAlliances(profiles, conversations, adj, profileTopics);
  const conflictAxes = detectConflicts(profiles, relationships);

  // Communication density
  const n = profiles.length;
  const possibleEdges = n > 1 ? (n * (n - 1)) / 2 : 1;
  let actualEdges = 0;
  const counted = new Set<string>();
  for (const [id, edges] of adj) {
    for (const e of edges) {
      if (e.target === "__self__") continue;
      const key = [id, e.target].sort().join("-");
      if (!counted.has(key)) {
        counted.add(key);
        actualEdges++;
      }
    }
  }
  const density = Math.round((actualEdges / possibleEdges) * 100);

  // Group health: average trust and health scores
  const avgTrust = relationships.length > 0
    ? relationships.reduce((sum, r) => sum + r.trustLevel, 0) / relationships.length
    : 50;
  const avgHealth = relationships.length > 0
    ? relationships.reduce((sum, r) => sum + r.healthScore, 0) / relationships.length
    : 50;
  const groupHealth = Math.round((avgTrust * 0.5 + avgHealth * 0.3 + density * 0.2));

  // Generate insights
  const insights: string[] = [];

  if (influenceScores.length > 0) {
    const topInfluencer = influenceScores[0];
    insights.push(`${topInfluencer.profileName}是你社交圈中影响力最高的人（${topInfluencer.influence}分）`);
  }

  const leaders = influenceScores.filter((s) => s.role === "leader");
  if (leaders.length > 1) {
    insights.push(`你有${leaders.length}位核心人物：${leaders.map((l) => l.profileName).join("、")}`);
  }

  const connectors = influenceScores.filter((s) => s.role === "connector");
  if (connectors.length > 0) {
    insights.push(`${connectors.map((c) => c.profileName).join("、")}是你的社交桥接者，连接不同圈子`);
  }

  if (alliances.length > 0) {
    insights.push(`检测到${alliances.length}个社交圈/联盟`);
  }

  if (conflictAxes.length > 0) {
    insights.push(`⚠️ ${conflictAxes.length}段关系需要关注：${conflictAxes.map((c) => c.bName).join("、")}`);
  }

  if (density < 30 && profiles.length > 3) {
    insights.push(`你的社交网络连接密度偏低（${density}%），不同圈子的人之间较少交集`);
  }

  const newcomers = influenceScores.filter((s) => s.role === "newcomer");
  if (newcomers.length > 0) {
    insights.push(`${newcomers.map((n) => n.profileName).join("、")}是新建立的关系，需要更多互动`);
  }

  return {
    influenceScores,
    alliances,
    conflictAxes,
    groupHealth,
    density,
    insights,
  };
}
