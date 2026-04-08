// ============================================================
// Social Intelligence OS — Core Type Definitions
// ============================================================
// This type system models the full Bayesian progressive profiling
// architecture: evidence chains, confidence decay, profile versioning,
// relationship graphs, and multi-layer signal extraction.
// ============================================================

// ============================================================
// §1  Foundation: Evidence & Confidence
// ============================================================

/** A single piece of evidence supporting a profile judgment. */
export interface Evidence {
  id: string;
  conversationId: string;
  messageIndex: number;
  quote: string;                     // the exact text that produced this signal
  signal: string;                    // what was inferred
  strength: number;                  // 0-1 how strong this evidence is
  layer: SignalLayer;                // which analysis layer produced it
  createdAt: string;
}

/** The five analysis layers (shallow → deep). */
export type SignalLayer =
  | "surface"          // Layer 1: surface linguistic features
  | "discourse"        // Layer 2: discourse structure
  | "interaction"      // Layer 3: interaction patterns
  | "semantic"         // Layer 4: content semantics
  | "metacognitive";   // Layer 5: metacognitive signals

/** Bayesian confidence envelope for a single dimension. */
export interface ConfidenceEnvelope {
  value: number;           // 0-100 current best estimate
  confidence: number;      // 0-100 how certain we are
  priorValue: number;      // the population prior before any evidence
  sampleSize: number;      // effective number of independent signals seen
  lastUpdated: string;
  evidenceIds: string[];   // pointers into the evidence store
}

// ============================================================
// §2  Person Profile (Bayesian Progressive Model)
// ============================================================

/** The eight core personality/communication dimensions. */
export const DIMENSION_KEYS = [
  "assertiveness",
  "cooperativeness",
  "decisionSpeed",
  "emotionalStability",
  "openness",
  "empathy",
  "riskTolerance",
  "formalityLevel",
] as const;

export type DimensionKey = (typeof DIMENSION_KEYS)[number];

/** Human-readable labels for each dimension. */
export const DIMENSION_LABELS: Record<DimensionKey, { en: string; zh: string }> = {
  assertiveness:      { en: "Assertiveness",       zh: "强势程度" },
  cooperativeness:    { en: "Cooperativeness",     zh: "合作倾向" },
  decisionSpeed:      { en: "Decision Speed",      zh: "决策速度" },
  emotionalStability: { en: "Emotional Stability", zh: "情绪稳定性" },
  openness:           { en: "Openness",            zh: "开放性" },
  empathy:            { en: "Empathy",             zh: "共情能力" },
  riskTolerance:      { en: "Risk Tolerance",      zh: "风险承受" },
  formalityLevel:     { en: "Formality",           zh: "正式程度" },
};

/** Backward-compatible shape expected by UI components. */
export interface ProfileDimension {
  label: string;
  labelZh: string;
  value: number;       // 0-100 normalized score
  confidence: number;  // 0-100 how sure the system is
  evidence: string[];  // quotes / reasoning that support this score
}

/** Communication style summary for a person. */
export interface CommunicationStyle {
  overallType: string;       // e.g. "合作型谈判者", "目标导向型决策者"
  strengths: string[];
  weaknesses: string[];
  triggerPoints: string[];   // emotional triggers
  preferredTopics: string[];
  avoidTopics: string[];
}

/** Behavioral patterns inferred from interactions. */
export interface BehavioralPatterns {
  responseSpeed: string;
  conflictStyle: string;           // 直接反驳 / 委婉异议 / 转移话题
  decisionStyle: string;           // 独立拍板 / 需要商量
  persuasionVulnerability: string[]; // what persuasion tactics work
}

/** A snapshot of a profile at a point in time (for versioning). */
export interface ProfileSnapshot {
  version: number;
  timestamp: string;
  dimensions: Record<DimensionKey, ConfidenceEnvelope>;
  trigger: string;  // what conversation caused this snapshot
}

/** User's subjective impression of a person — the "human side" of the profile. */
export interface SubjectiveImpression {
  relationship: string;           // e.g. "同事", "客户", "朋友"
  firstImpression: string;        // 第一印象
  personalityKeywords: string[];  // user's own words: "靠谱", "有城府", "热心"
  trustLevel: number;             // 0-100 how much user trusts this person
  comfortLevel: number;           // 0-100 how comfortable user feels
  emotionalTone: string;          // user's emotional stance: "亲近", "警惕", "尊敬"
  knownBackground: string;        // what user knows about this person's background
  unresolved: string;             // unresolved issues / tensions
  personalNotes: string;          // free-form notes from the user
  updatedAt: string;
}

/** The full person profile — the core data structure of the system. */
export interface PersonProfile {
  id: string;
  name: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;

  // Core personality dimensions (radar chart) — backward compatible
  dimensions: Record<DimensionKey, ProfileDimension>;

  // Bayesian confidence envelopes (the "real" model under the hood)
  bayesianDimensions?: Record<DimensionKey, ConfidenceEnvelope>;

  // Communication style summary
  communicationStyle: CommunicationStyle;

  // Behavioral patterns
  patterns: BehavioralPatterns;

  // Evidence store — all signals that contribute to this profile
  evidenceLog?: Evidence[];

  // Version history — track how the profile evolves over time
  versionHistory?: ProfileSnapshot[];

  // ---- Dual Perspective ----
  // Side A: AI-analyzed from chat data (dimensions, communicationStyle, patterns above)
  // Side B: User's subjective impression (below)
  subjectiveImpression?: SubjectiveImpression;

  // Metadata
  conversationCount: number;
  totalMessages: number;
  lastInteraction: string;
  notes: string;

  // Tags for quick filtering
  tags?: string[];
}

// ============================================================
// §3  Conversation & Messages
// ============================================================

export interface ChatMessage {
  id: string;
  role: "self" | "other";
  senderName: string;
  content: string;
  timestamp?: string;
}

export interface ConversationSession {
  id: string;
  title: string;
  participants: string[];
  messages: ChatMessage[];
  createdAt: string;
  linkedProfileId?: string;
  analysis?: ConversationAnalysis;
  context?: string;  // background info provided by user
  rawText?: string;  // original conversation text for re-analysis
  targetName?: string;  // the other party's name/label
}

// ============================================================
// §4  Five-Layer Analysis Results
// ============================================================

export interface EmotionPoint {
  messageIndex: number;
  selfEmotion: number;    // -1 to 1
  otherEmotion: number;   // -1 to 1
  label: string;
}

export interface KeyMoment {
  messageIndex: number;
  description: string;
  significance: string;
  impact: "positive" | "negative" | "neutral";
}

export interface ConversationAnalysis {
  id: string;
  conversationId: string;
  createdAt: string;

  // Layer 1: Surface linguistic features
  surfaceFeatures: {
    formalityLevel: string;
    avgSentenceLength: string;
    punctuationStyle: string;
    emojiUsage: string;
    toneMarkers: string;
  };

  // Layer 2: Discourse structure
  discourseStructure: {
    argumentStyle: string;
    topicControl: string;
    questionFrequency: string;
    hedgingLevel: string;
  };

  // Layer 3: Interaction patterns
  interactionPatterns: {
    initiativeBalance: string;
    responseLatency: string;
    conflictHandling: string;
    mirroring: string;
  };

  // Layer 4: Semantic content
  semanticContent: {
    coreTopics: string[];
    hiddenAgenda: string;
    valueSignals: string[];
    attributionStyle: string;
  };

  // Layer 5: Metacognitive signals
  metacognitive: {
    selfAwareness: string;
    uncertaintyExpression: string;
    flexibilityLevel: string;
    emotionalLabeling: string;
  };

  // Synthesis
  summary: string;
  emotionCurve: EmotionPoint[];
  keyMoments: KeyMoment[];
  strategicInsights: string[];
  nextStepSuggestions: string[];

  // Profile update payload from the LLM
  profileUpdate?: {
    dimensions: Record<string, { value: number; confidence: number; evidence: string[] }>;
    communicationStyle: CommunicationStyle;
    patterns: {
      responseSpeed: string;
      conflictStyle: string;
      decisionStyle: string;
      persuasionVulnerability: string[];
    };
  };
}

// ============================================================
// §5  Coaching
// ============================================================

export type CoachingTipType = "opportunity" | "warning" | "insight" | "suggestion";

export interface CoachingTip {
  id: string;
  type: CoachingTipType;
  title: string;
  content: string;
  confidence: number;
  timestamp: string;
}

export interface CoachingSession {
  tips: CoachingTip[];
  suggestedReply: string;
  currentDynamic: string;
}

// ============================================================
// §6  Simulation
// ============================================================

export interface SimulationConfig {
  targetProfileId: string;
  scenario: string;
  userGoal: string;
  difficultyLevel: "easy" | "medium" | "hard";
}

export interface SimulationMessage {
  id: string;
  role: "user" | "simulated";
  content: string;
  coachingTip?: string;
  emotionalState?: string;
  timestamp: string;
}

// ============================================================
// §7  Relationship Graph
// ============================================================

export type RelationshipStatus = "warming" | "stable" | "cooling" | "unknown";

export interface RelationshipEdge {
  id: string;
  profileId: string;
  status: RelationshipStatus;
  trustLevel: number;           // 0-100
  unresolvedIssues: string[];
  lastContact: string;
  contactFrequency: string;     // e.g. "每周2-3次"
  nextFollowUp?: string;        // suggested follow-up date
  followUpReason?: string;      // why we suggest following up
  healthScore: number;          // 0-100 composite relationship health
  history: RelationshipEvent[];
}

export interface RelationshipEvent {
  date: string;
  type: "contact" | "milestone" | "conflict" | "resolution";
  summary: string;
  sentimentDelta: number;  // how much trust changed (-1 to 1)
}

// ============================================================
// §8  EQ Training
// ============================================================

export type EQCategory = "empathy" | "timing" | "tone" | "content" | "strategy";

export interface EQReviewItem {
  messageIndex: number;
  originalMessage: string;
  issue: string;
  suggestedAlternative: string;
  explanation: string;
  category: EQCategory;
  severityLevel: number;  // 1-5 how impactful this issue was
}

export interface EQReport {
  conversationId: string;
  overallScore: number;  // 0-100
  items: EQReviewItem[];
  strengthAreas: string[];
  improvementAreas: string[];
  dimensionScores: {
    empathyAccuracy: number;
    expressionPrecision: number;
    timingControl: number;
    strategyEffectiveness: number;
    relationshipMaintenance: number;
  };
  progressTrend?: string;
}

// ============================================================
// §9  Strategy Planning (Pre-conversation Prep)
// ============================================================

export interface ConversationStrategy {
  id: string;
  targetProfileId: string;
  objective: string;
  context: string;
  openingMoves: string[];
  keyPoints: StrategyPoint[];
  riskMitigation: string[];
  batna: string;  // Best Alternative To Negotiated Agreement
  redLines: string[];
  createdAt: string;
}

export interface StrategyPoint {
  topic: string;
  approach: string;
  fallback: string;
  expectedResistance: string;
}

// ============================================================
// §10  Planning (Multi-scale Life & Work Planner)
// ============================================================

export type PlanTimeScale = "hours" | "days" | "weeks" | "months" | "years";
export type PlanDomain =
  | "daily"       // 日常事务
  | "study"       // 学习计划
  | "career"      // 职业发展
  | "business"    // 商业创业
  | "project"     // 项目管理
  | "government"  // 政务决策
  | "life";       // 人生规划

export interface PlanMilestone {
  id: string;
  title: string;
  description: string;
  deadline: string;
  dependencies: string[];    // ids of prerequisite milestones
  priority: "critical" | "high" | "medium" | "low";
  status: "pending" | "in_progress" | "completed" | "blocked";
}

export interface PlanPhase {
  name: string;
  timeRange: string;          // e.g. "第1-2周", "Q1 2025"
  objective: string;
  milestones: PlanMilestone[];
  risks: string[];
  keyMetrics: string[];       // how to measure success in this phase
}

export interface PlanResult {
  title: string;
  domain: PlanDomain;
  timeScale: PlanTimeScale;
  totalDuration: string;
  overallObjective: string;
  currentSituation: string;
  phases: PlanPhase[];
  resourceRequirements: string[];
  riskMitigation: string[];
  successCriteria: string[];
  contingencyPlan: string;
  dailyHabits?: string[];     // small daily actions to maintain momentum
  reviewSchedule: string;     // when to review and adjust the plan
}

// ============================================================
// §11  MBTI Test Results (Persistent)
// ============================================================

export interface MBTITestResult {
  id: string;
  mode: "quick" | "standard" | "full";
  type: string;                     // e.g. "INTJ"
  scores: {
    E: number; I: number;
    S: number; N: number;
    T: number; F: number;
    J: number; P: number;
  };
  completedAt: string;
  questionCount: number;
}

// ============================================================
// §12  API Request/Response Contracts
// ============================================================

export interface AnalyzeRequest {
  conversation: string;
  targetName?: string;
  context?: string;
  existingProfile?: PersonProfile;
}

export interface AnalyzeResponse {
  analysis: ConversationAnalysis;
  targetName: string;
}

export interface CoachRequest {
  messages: string;             // formatted conversation text
  targetProfile?: PersonProfile;
  userGoal?: string;
}

export interface CoachResponse {
  tips: CoachingTip[];
  suggestedReply?: string;
  currentDynamic: string;
}

export interface SimulateRequest {
  profileDescription: string;
  scenario: string;
  difficulty: string;
  history: SimulationMessage[];
  userMessage: string;
}

export interface SimulateResponse {
  reply: string;
  coaching: string;
  emotionalState: string;
}

export interface EQReviewRequest {
  messages: string;
  targetProfile?: PersonProfile;
}

export interface EQReviewResponse {
  report: EQReport;
}
