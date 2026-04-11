// ============================================================
// Zustand Store — Global State Management  (v2 deep overhaul)
// ============================================================
// Enhanced with: relationship graph, profile versioning,
// conversation history indexing, and richer state management.
// ============================================================

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  PersonProfile,
  ConversationSession,
  CoachingTip,
  ChatMessage,
  RelationshipEdge,
  PeerRelationship,
  DimensionKey,
  ProfileSnapshot,
  MBTITestResult,
  EQScoreEntry,
  ProfileMemoryEntry,
  PlaybookVersion,
} from "./types";
import type { LearningProfile, FeedbackEntry } from "./adaptive-learning";
import { getDefaultLearningProfile, processFeedback } from "./adaptive-learning";

// ---- Theme & Preferences Types ----
export type ThemeKey = "dark" | "violet-dark" | "green-eye" | "sepia" | "blue-night";

export interface ToastItem {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message?: string;
  createdAt: number;
  duration?: number; // ms, default 5000
  action?: { label: string; tab?: string };
}

export interface ModuleHistoryEntry {
  id: string;
  title: string;
  createdAt: string;
  module: string;
  data: unknown; // the full result object
  summary?: string; // short summary for list display
}

export interface DivinationRecord {
  id: string;
  category: string;      // yijing, bazi, tarot, etc.
  categoryLabel: string;
  question: string;
  answer: string;
  ritualResult?: string;  // coin toss / tarot draw summary
  linkedProfileId?: string;
  linkedProfileName?: string;
  createdAt: string;
}

// ============================================================
// State Interface
// ============================================================

/** Shape of a full data export for backup / migration. */
export interface DataExport {
  version: number;
  exportedAt: string;
  profiles: PersonProfile[];
  conversations: ConversationSession[];
  relationships: RelationshipEdge[];
  mbtiResults?: MBTITestResult[];
  eqScores?: EQScoreEntry[];
  moduleHistory?: Record<string, ModuleHistoryEntry[]>;
  coachingTips?: CoachingTip[];
  playbookVersions?: PlaybookVersion[];
  profileMemories?: ProfileMemoryEntry[];
  divinationRecords?: DivinationRecord[];
}

interface AppState {
  // ---- Profiles ----
  profiles: PersonProfile[];
  addProfile: (profile: PersonProfile) => void;
  updateProfile: (id: string, updates: Partial<PersonProfile>) => void;
  deleteProfile: (id: string) => void;
  getProfile: (id: string) => PersonProfile | undefined;
  snapshotProfile: (id: string, trigger: string) => void;

  // ---- Conversations ----
  conversations: ConversationSession[];
  addConversation: (session: ConversationSession) => void;
  updateConversation: (id: string, updates: Partial<ConversationSession>) => void;
  deleteConversation: (id: string) => void;
  getConversationsForProfile: (profileId: string) => ConversationSession[];

  // ---- Relationship Graph ----
  relationships: RelationshipEdge[];
  upsertRelationship: (edge: RelationshipEdge) => void;
  getRelationship: (profileId: string) => RelationshipEdge | undefined;
  deleteRelationship: (profileId: string) => void;

  // ---- Peer Relationships (between profiles, not self) ----
  peerRelationships: PeerRelationship[];
  addPeerRelationship: (rel: PeerRelationship) => void;
  updatePeerRelationship: (id: string, updates: Partial<PeerRelationship>) => void;
  deletePeerRelationship: (id: string) => void;
  getPeerRelationshipsForProfile: (profileId: string) => PeerRelationship[];

  // ---- Coaching ----
  coachingTips: CoachingTip[];
  setCoachingTips: (tips: CoachingTip[]) => void;
  addCoachingTip: (tip: CoachingTip) => void;
  clearCoachingTips: () => void;

  // ---- Live Chat ----
  liveChatMessages: ChatMessage[];
  addLiveChatMessage: (msg: ChatMessage) => void;
  clearLiveChat: () => void;

  // ---- MBTI Results ----
  mbtiResults: MBTITestResult[];
  addMBTIResult: (result: MBTITestResult) => void;
  getLatestMBTI: () => MBTITestResult | undefined;

  // ---- EQ Score Tracking ----
  eqScores: EQScoreEntry[];
  addEQScore: (entry: EQScoreEntry) => void;

  // ---- Profile Merge ----
  mergeProfiles: (keepId: string, mergeId: string) => void;

  // ---- Data Management ----
  exportAllData: () => DataExport;
  importData: (data: DataExport, mode: "merge" | "replace") => { profilesAdded: number; conversationsAdded: number; relationshipsAdded: number };
  clearAllData: () => void;

  // ---- UI ----
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  mobileDrawerOpen: boolean;
  setMobileDrawerOpen: (open: boolean) => void;

  // ---- User Preferences ----
  fontSize: number; // 12-20, default 14
  setFontSize: (size: number) => void;
  theme: ThemeKey;
  setTheme: (theme: ThemeKey) => void;

  // ---- Module History ----
  moduleHistory: Record<string, ModuleHistoryEntry[]>;
  addModuleHistory: (module: string, entry: ModuleHistoryEntry) => void;
  getModuleHistory: (module: string) => ModuleHistoryEntry[];
  clearModuleHistory: (module: string) => void;

  // ---- Cross-Tab Navigation ----
  preSelectedProfileId: string | null;
  scenarioContext: string | null;
  scenarioGoal: string | null;
  navigateToTab: (tab: string, profileId?: string, scenario?: { context: string; goal: string }) => void;
  clearPreSelection: () => void;

  // ---- Playbook History ----
  playbookVersions: PlaybookVersion[];
  addPlaybookVersion: (version: PlaybookVersion) => void;
  getPlaybookVersions: (profileId: string) => PlaybookVersion[];
  deletePlaybookVersion: (id: string) => void;

  // ---- AI Memory System ----
  profileMemories: ProfileMemoryEntry[];
  addMemory: (entry: ProfileMemoryEntry) => void;
  updateMemory: (id: string, updates: Partial<ProfileMemoryEntry>) => void;
  deleteMemory: (id: string) => void;
  getMemoriesForProfile: (profileId: string) => ProfileMemoryEntry[];
  getActiveMemoriesForProfile: (profileId: string) => ProfileMemoryEntry[];
  addMemoriesBatch: (entries: ProfileMemoryEntry[]) => void;

  // ---- Toast Notifications ----
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, "id" | "createdAt">) => void;
  removeToast: (id: string) => void;

  // ---- API Settings ----
  apiSettings: {
    baseURL: string;
    apiKey: string;
    model: string;
    customModels: string[]; // user-defined model names
  };
  updateApiSettings: (updates: Partial<AppState["apiSettings"]>) => void;
  addCustomModel: (model: string) => void;
  removeCustomModel: (model: string) => void;

  // ---- Divination History ----
  divinationRecords: DivinationRecord[];
  addDivinationRecord: (record: DivinationRecord) => void;
  getDivinationRecords: (category?: string) => DivinationRecord[];
  deleteDivinationRecord: (id: string) => void;
  clearDivinationRecords: () => void;

  // ---- Adaptive Learning ----
  learningProfile: LearningProfile;
  feedbackHistory: FeedbackEntry[];
  addFeedback: (entry: FeedbackEntry) => void;
  resetLearningProfile: () => void;

  // ---- Data Privacy (GDPR) ----
  privacySettings: {
    dataEncryptionEnabled: boolean;
    autoDeleteAfterDays: number; // 0 = never
    anonymizeExports: boolean;
  };
  updatePrivacySettings: (updates: Partial<AppState["privacySettings"]>) => void;
  purgeAllPersonalData: () => void;
  exportAnonymizedData: () => DataExport;
}

// ============================================================
// Store Implementation
// ============================================================

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ---- Profiles ----
      profiles: [],

      addProfile: (profile) =>
        set((state) => ({ profiles: [...state.profiles, profile] })),

      updateProfile: (id, updates) =>
        set((state) => ({
          profiles: state.profiles.map((p) =>
            p.id === id
              ? { ...p, ...updates, updatedAt: new Date().toISOString() }
              : p
          ),
        })),

      deleteProfile: (id) =>
        set((state) => ({
          profiles: state.profiles.filter((p) => p.id !== id),
          relationships: state.relationships.filter((r) => r.profileId !== id),
        })),

      getProfile: (id) => get().profiles.find((p) => p.id === id),

      snapshotProfile: (id, trigger) =>
        set((state) => ({
          profiles: state.profiles.map((p) => {
            if (p.id !== id) return p;
            const currentVersion = p.versionHistory?.length ?? 0;
            const snapshot: ProfileSnapshot = {
              version: currentVersion + 1,
              timestamp: new Date().toISOString(),
              dimensions: Object.fromEntries(
                Object.entries(p.dimensions).map(([key, dim]) => [
                  key as DimensionKey,
                  {
                    value: dim.value,
                    confidence: dim.confidence,
                    priorValue: 50,
                    sampleSize: p.conversationCount,
                    lastUpdated: new Date().toISOString(),
                    evidenceIds: [],
                  },
                ])
              ) as unknown as Record<DimensionKey, import("./types").ConfidenceEnvelope>,
              trigger,
            };
            return {
              ...p,
              versionHistory: [...(p.versionHistory ?? []), snapshot],
            };
          }),
        })),

      // ---- Conversations ----
      conversations: [],

      addConversation: (session) =>
        set((state) => ({
          conversations: [session, ...state.conversations],
        })),

      updateConversation: (id, updates) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),

      deleteConversation: (id) =>
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
        })),

      getConversationsForProfile: (profileId) =>
        get().conversations.filter((c) => c.linkedProfileId === profileId),

      // ---- Relationship Graph ----
      relationships: [],

      upsertRelationship: (edge) =>
        set((state) => {
          const existing = state.relationships.findIndex(
            (r) => r.profileId === edge.profileId
          );
          if (existing >= 0) {
            const updated = [...state.relationships];
            updated[existing] = { ...updated[existing], ...edge };
            return { relationships: updated };
          }
          return { relationships: [...state.relationships, edge] };
        }),

      getRelationship: (profileId) =>
        get().relationships.find((r) => r.profileId === profileId),

      deleteRelationship: (profileId) =>
        set((state) => ({
          relationships: state.relationships.filter(
            (r) => r.profileId !== profileId
          ),
        })),

      // ---- Peer Relationships ----
      peerRelationships: [],

      addPeerRelationship: (rel) =>
        set((state) => ({
          peerRelationships: [...state.peerRelationships, rel],
        })),

      updatePeerRelationship: (id, updates) =>
        set((state) => ({
          peerRelationships: state.peerRelationships.map((r) =>
            r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
          ),
        })),

      deletePeerRelationship: (id) =>
        set((state) => ({
          peerRelationships: state.peerRelationships.filter((r) => r.id !== id),
        })),

      getPeerRelationshipsForProfile: (profileId) =>
        get().peerRelationships.filter(
          (r) => r.profileAId === profileId || r.profileBId === profileId
        ),

      // ---- Coaching ----
      coachingTips: [],
      setCoachingTips: (tips) => set({ coachingTips: tips }),
      addCoachingTip: (tip) =>
        set((state) => ({
          coachingTips: [...state.coachingTips, tip],
        })),
      clearCoachingTips: () => set({ coachingTips: [] }),

      // ---- Live Chat ----
      liveChatMessages: [],
      addLiveChatMessage: (msg) =>
        set((state) => ({
          liveChatMessages: [...state.liveChatMessages, msg],
        })),
      clearLiveChat: () => set({ liveChatMessages: [] }),

      // ---- MBTI Results ----
      mbtiResults: [],

      addMBTIResult: (result) =>
        set((state) => ({
          mbtiResults: [result, ...state.mbtiResults],
        })),

      getLatestMBTI: () => get().mbtiResults[0],

      // ---- EQ Score Tracking ----
      eqScores: [],

      addEQScore: (entry) =>
        set((state) => ({
          eqScores: [entry, ...state.eqScores],
        })),

      // ---- Profile Merge ----
      mergeProfiles: (keepId, mergeId) =>
        set((state) => {
          const keep = state.profiles.find((p) => p.id === keepId);
          const merge = state.profiles.find((p) => p.id === mergeId);
          if (!keep || !merge) return state;

          // Merge dimensions: pick higher-confidence values
          const mergedDimensions = { ...keep.dimensions };
          for (const [key, dim] of Object.entries(merge.dimensions)) {
            const existing = mergedDimensions[key as keyof typeof mergedDimensions];
            if (!existing || dim.confidence > existing.confidence) {
              mergedDimensions[key as keyof typeof mergedDimensions] = dim;
            } else if (existing) {
              // Combine evidence
              existing.evidence = [...new Set([...existing.evidence, ...dim.evidence])];
            }
          }

          // Merge communication style
          const mergedStyle = keep.communicationStyle?.overallType !== "未知"
            ? keep.communicationStyle
            : merge.communicationStyle;

          // Merge patterns
          const mergedPatterns = keep.patterns?.responseSpeed !== "未知"
            ? keep.patterns
            : merge.patterns;

          const mergedProfile: PersonProfile = {
            ...keep,
            dimensions: mergedDimensions,
            communicationStyle: mergedStyle,
            patterns: mergedPatterns,
            conversationCount: keep.conversationCount + merge.conversationCount,
            totalMessages: keep.totalMessages + merge.totalMessages,
            notes: [keep.notes, merge.notes].filter(Boolean).join("\n"),
            tags: [...new Set([...(keep.tags || []), ...(merge.tags || [])])],
            updatedAt: new Date().toISOString(),
          };

          // Re-link conversations from merged profile
          const updatedConversations = state.conversations.map((c) => {
            if (c.linkedProfileId === mergeId) {
              return { ...c, linkedProfileId: keepId };
            }
            // Also update participant names
            if (c.participants?.includes(merge.name) && !c.participants?.includes(keep.name)) {
              return {
                ...c,
                participants: c.participants.map((p) => p === merge.name ? keep.name : p),
              };
            }
            return c;
          });

          return {
            profiles: state.profiles
              .map((p) => (p.id === keepId ? mergedProfile : p))
              .filter((p) => p.id !== mergeId),
            conversations: updatedConversations,
            relationships: state.relationships.filter((r) => r.profileId !== mergeId),
          };
        }),

      // ---- Data Management ----
      exportAllData: () => {
        const state = get();
        return {
          version: 5,
          exportedAt: new Date().toISOString(),
          profiles: state.profiles,
          conversations: state.conversations,
          relationships: state.relationships,
          mbtiResults: state.mbtiResults,
          eqScores: state.eqScores,
          moduleHistory: state.moduleHistory,
          coachingTips: state.coachingTips,
          playbookVersions: state.playbookVersions,
          profileMemories: state.profileMemories,
          divinationRecords: state.divinationRecords,
        };
      },

      importData: (data, mode) => {
        const state = get();
        let profilesAdded = 0;
        let conversationsAdded = 0;
        let relationshipsAdded = 0;

        if (mode === "replace") {
          profilesAdded = data.profiles.length;
          conversationsAdded = data.conversations.length;
          relationshipsAdded = data.relationships.length;
          set({
            profiles: data.profiles,
            conversations: data.conversations,
            relationships: data.relationships,
            mbtiResults: data.mbtiResults || [],
            eqScores: data.eqScores || [],
            moduleHistory: data.moduleHistory || {},
            coachingTips: data.coachingTips || [],
            playbookVersions: data.playbookVersions || [],
            profileMemories: data.profileMemories || [],
            divinationRecords: data.divinationRecords || [],
          });
        } else {
          // Merge mode: add items that don't already exist (by id)
          const existingProfileIds = new Set(state.profiles.map((p) => p.id));
          const existingConvoIds = new Set(state.conversations.map((c) => c.id));
          const existingRelIds = new Set(state.relationships.map((r) => r.profileId));

          const newProfiles = data.profiles.filter((p) => !existingProfileIds.has(p.id));
          const newConvos = data.conversations.filter((c) => !existingConvoIds.has(c.id));
          const newRels = data.relationships.filter((r) => !existingRelIds.has(r.profileId));

          profilesAdded = newProfiles.length;
          conversationsAdded = newConvos.length;
          relationshipsAdded = newRels.length;

          // Merge MBTI results
          const existingMbtiIds = new Set(state.mbtiResults.map((r) => r.id));
          const newMbti = (data.mbtiResults || []).filter((r) => !existingMbtiIds.has(r.id));

          // Merge EQ scores
          const existingEqIds = new Set(state.eqScores.map((e) => e.id));
          const newEq = (data.eqScores || []).filter((e) => !existingEqIds.has(e.id));

          // Merge playbook versions
          const existingPbIds = new Set(state.playbookVersions.map((p) => p.id));
          const newPb = (data.playbookVersions || []).filter((p) => !existingPbIds.has(p.id));

          // Merge profile memories
          const existingMemIds = new Set(state.profileMemories.map((m) => m.id));
          const newMem = (data.profileMemories || []).filter((m) => !existingMemIds.has(m.id));

          // Merge divination records
          const existingDivIds = new Set(state.divinationRecords.map((r) => r.id));
          const newDiv = (data.divinationRecords || []).filter((r) => !existingDivIds.has(r.id));

          // Merge module history (combine per-module arrays)
          const mergedModuleHistory = { ...state.moduleHistory };
          for (const [mod, entries] of Object.entries(data.moduleHistory || {})) {
            const existing = mergedModuleHistory[mod] || [];
            const existIds = new Set(existing.map((e) => e.id));
            const newEntries = entries.filter((e) => !existIds.has(e.id));
            mergedModuleHistory[mod] = [...existing, ...newEntries].slice(0, 50);
          }

          set({
            profiles: [...state.profiles, ...newProfiles],
            conversations: [...state.conversations, ...newConvos],
            relationships: [...state.relationships, ...newRels],
            mbtiResults: [...state.mbtiResults, ...newMbti],
            eqScores: [...state.eqScores, ...newEq],
            playbookVersions: [...state.playbookVersions, ...newPb],
            profileMemories: [...state.profileMemories, ...newMem],
            moduleHistory: mergedModuleHistory,
            divinationRecords: [...state.divinationRecords, ...newDiv],
          });
        }

        return { profilesAdded, conversationsAdded, relationshipsAdded };
      },

      clearAllData: () =>
        set({
          profiles: [],
          conversations: [],
          relationships: [],
          coachingTips: [],
          liveChatMessages: [],
          mbtiResults: [],
          eqScores: [],
          profileMemories: [],
          playbookVersions: [],
          moduleHistory: {},
          divinationRecords: [],
          toasts: [],
          preSelectedProfileId: null,
          scenarioContext: null,
          scenarioGoal: null,
        }),

      // ---- UI ----
      sidebarOpen: true,
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      activeTab: "analyze",
      setActiveTab: (tab) => set({ activeTab: tab }),
      mobileDrawerOpen: false,
      setMobileDrawerOpen: (open) => set({ mobileDrawerOpen: open }),

      // ---- User Preferences ----
      fontSize: 14,
      setFontSize: (size) => {
        const validSizes = [12, 13, 14, 16, 18];
        const closest = validSizes.reduce((prev, curr) =>
          Math.abs(curr - size) < Math.abs(prev - size) ? curr : prev
        );
        set({ fontSize: closest });
      },
      theme: "dark" as ThemeKey,
      setTheme: (theme) => set({ theme }),

      // ---- Module History ----
      moduleHistory: {},
      addModuleHistory: (module, entry) =>
        set((state) => {
          const existing = state.moduleHistory[module] || [];
          const updated = [entry, ...existing].slice(0, 10); // keep last 10
          return { moduleHistory: { ...state.moduleHistory, [module]: updated } };
        }),
      getModuleHistory: (module) => get().moduleHistory[module] || [],
      clearModuleHistory: (module) =>
        set((state) => {
          const updated = { ...state.moduleHistory };
          delete updated[module];
          return { moduleHistory: updated };
        }),

      // ---- Cross-Tab Navigation ----
      preSelectedProfileId: null,
      scenarioContext: null,
      scenarioGoal: null,
      navigateToTab: (tab, profileId, scenario) =>
        set({
          activeTab: tab,
          preSelectedProfileId: profileId || null,
          scenarioContext: scenario?.context || null,
          scenarioGoal: scenario?.goal || null,
        }),
      clearPreSelection: () => set({ preSelectedProfileId: null, scenarioContext: null, scenarioGoal: null }),

      // ---- Playbook History ----
      playbookVersions: [],

      addPlaybookVersion: (version) =>
        set((state) => ({
          playbookVersions: [version, ...state.playbookVersions].slice(0, 50),
        })),

      getPlaybookVersions: (profileId) =>
        get().playbookVersions
          .filter((v) => v.profileId === profileId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),

      deletePlaybookVersion: (id) =>
        set((state) => ({
          playbookVersions: state.playbookVersions.filter((v) => v.id !== id),
        })),

      // ---- AI Memory System ----
      profileMemories: [],

      addMemory: (entry) =>
        set((state) => ({ profileMemories: [...state.profileMemories, entry] })),

      updateMemory: (id, updates) =>
        set((state) => ({
          profileMemories: state.profileMemories.map((m) =>
            m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m
          ),
        })),

      deleteMemory: (id) =>
        set((state) => ({
          profileMemories: state.profileMemories.filter((m) => m.id !== id),
        })),

      getMemoriesForProfile: (profileId) =>
        get().profileMemories.filter((m) => m.profileId === profileId),

      getActiveMemoriesForProfile: (profileId) =>
        get().profileMemories
          .filter((m) => m.profileId === profileId && !m.archived)
          .sort((a, b) => b.importance - a.importance || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),

      addMemoriesBatch: (entries) =>
        set((state) => {
          // Deduplicate by content+profileId to avoid duplicate memories
          const existing = new Set(
            state.profileMemories.map((m) => `${m.profileId}::${m.content}`)
          );
          const newEntries = entries.filter(
            (e) => !existing.has(`${e.profileId}::${e.content}`)
          );
          return { profileMemories: [...state.profileMemories, ...newEntries] };
        }),

      // ---- Toast Notifications ----
      toasts: [],
      addToast: (toast) =>
        set((state) => ({
          toasts: [
            ...state.toasts,
            { ...toast, id: crypto.randomUUID(), createdAt: Date.now() },
          ],
        })),
      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        })),

      // ---- API Settings ----
      apiSettings: {
        baseURL: "",
        apiKey: "",
        model: "",
        customModels: [],
      },
      updateApiSettings: (updates) =>
        set((state) => ({
          apiSettings: { ...state.apiSettings, ...updates },
        })),
      addCustomModel: (model) =>
        set((state) => ({
          apiSettings: {
            ...state.apiSettings,
            customModels: state.apiSettings.customModels.includes(model)
              ? state.apiSettings.customModels
              : [...state.apiSettings.customModels, model],
          },
        })),
      removeCustomModel: (model) =>
        set((state) => ({
          apiSettings: {
            ...state.apiSettings,
            customModels: state.apiSettings.customModels.filter((m) => m !== model),
          },
        })),

      // ---- Divination History ----
      divinationRecords: [],
      addDivinationRecord: (record) =>
        set((state) => ({
          divinationRecords: [record, ...state.divinationRecords].slice(0, 200),
        })),
      getDivinationRecords: (category) => {
        const records = get().divinationRecords;
        return category ? records.filter((r) => r.category === category) : records;
      },
      deleteDivinationRecord: (id) =>
        set((state) => ({
          divinationRecords: state.divinationRecords.filter((r) => r.id !== id),
        })),
      clearDivinationRecords: () => set({ divinationRecords: [] }),

      // ---- Adaptive Learning ----
      learningProfile: getDefaultLearningProfile(),
      feedbackHistory: [],

      addFeedback: (entry) =>
        set((state) => {
          const updated = processFeedback(state.learningProfile, entry);
          return {
            learningProfile: updated,
            feedbackHistory: [...state.feedbackHistory.slice(-200), entry], // keep last 200
          };
        }),

      resetLearningProfile: () =>
        set(() => ({
          learningProfile: getDefaultLearningProfile(),
          feedbackHistory: [],
        })),

      // ---- Data Privacy (GDPR) ----
      privacySettings: {
        dataEncryptionEnabled: false,
        autoDeleteAfterDays: 0,
        anonymizeExports: false,
      },
      updatePrivacySettings: (updates) =>
        set((state) => ({
          privacySettings: { ...state.privacySettings, ...updates },
        })),
      purgeAllPersonalData: () =>
        set(() => ({
          profiles: [],
          conversations: [],
          relationships: [],
          coachingTips: [],
          liveChatMessages: [],
          mbtiResults: [],
          eqScores: [],
          moduleHistory: {},
          profileMemories: [],
          playbookVersions: [],
          divinationRecords: [],
        })),
      exportAnonymizedData: () => {
        const state = get();
        const anonymize = (name: string) => `用户${name.length}${name.charCodeAt(0) % 100}`;
        return {
          version: 1,
          exportedAt: new Date().toISOString(),
          profiles: state.profiles.map((p) => ({
            ...p,
            name: anonymize(p.name),
            notes: "",
          })),
          conversations: state.conversations.map((c) => ({
            ...c,
            rawText: "[已脱敏]",
            messages: c.messages.map((m) => ({ ...m, content: "[已脱敏]", senderName: anonymize(m.senderName) })),
            participants: c.participants.map(anonymize),
            targetName: anonymize(c.targetName || ""),
          })),
          relationships: state.relationships.map((r) => ({
            ...r,
            notes: "",
          })),
          mbtiResults: state.mbtiResults,
          eqScores: state.eqScores,
          moduleHistory: {},
          coachingTips: [],
          playbookVersions: [],
          profileMemories: state.profileMemories.map((m) => ({
            ...m,
            content: "[已脱敏]",
            sourceQuote: undefined,
          })),
          divinationRecords: state.divinationRecords.map((r) => ({
            ...r,
            question: "[已脱敏]",
            answer: "[已脱敏]",
            linkedProfileName: r.linkedProfileName ? anonymize(r.linkedProfileName) : undefined,
          })),
        };
      },
    }),
    {
      name: "social-intelligence-os",
      storage: createJSONStorage(() => {
        if (typeof window !== "undefined") {
          return localStorage;
        }
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      partialize: (state) => ({
        profiles: state.profiles,
        conversations: state.conversations,
        relationships: state.relationships,
        peerRelationships: state.peerRelationships,
        mbtiResults: state.mbtiResults,
        eqScores: state.eqScores,
        fontSize: state.fontSize,
        theme: state.theme,
        moduleHistory: state.moduleHistory,
        profileMemories: state.profileMemories,
        playbookVersions: state.playbookVersions,
        apiSettings: state.apiSettings,
        learningProfile: state.learningProfile,
        feedbackHistory: state.feedbackHistory,
        privacySettings: state.privacySettings,
        divinationRecords: state.divinationRecords,
      }),
    }
  )
);
