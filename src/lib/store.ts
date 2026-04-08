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
  DimensionKey,
  ProfileSnapshot,
  MBTITestResult,
  EQScoreEntry,
} from "./types";

// ---- Theme & Preferences Types ----
export type ThemeKey = "dark" | "violet-dark" | "green-eye" | "sepia" | "blue-night";

export interface ModuleHistoryEntry {
  id: string;
  title: string;
  createdAt: string;
  module: string;
  data: unknown; // the full result object
  summary?: string; // short summary for list display
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
  navigateToTab: (tab: string, profileId?: string) => void;
  clearPreSelection: () => void;
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
          version: 4,
          exportedAt: new Date().toISOString(),
          profiles: state.profiles,
          conversations: state.conversations,
          relationships: state.relationships,
          mbtiResults: state.mbtiResults,
          eqScores: state.eqScores,
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
            eqScores: (data as unknown as Record<string, unknown>).eqScores as EQScoreEntry[] || [],
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
          const importedEq = ((data as unknown as Record<string, unknown>).eqScores as EQScoreEntry[] || []);
          const newEq = importedEq.filter((e) => !existingEqIds.has(e.id));

          set({
            profiles: [...state.profiles, ...newProfiles],
            conversations: [...state.conversations, ...newConvos],
            relationships: [...state.relationships, ...newRels],
            mbtiResults: [...state.mbtiResults, ...newMbti],
            eqScores: [...state.eqScores, ...newEq],
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
        }),

      // ---- UI ----
      sidebarOpen: true,
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      activeTab: "analyze",
      setActiveTab: (tab) => set({ activeTab: tab }),

      // ---- User Preferences ----
      fontSize: 14,
      setFontSize: (size) => set({ fontSize: Math.min(20, Math.max(12, size)) }),
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
      navigateToTab: (tab, profileId) =>
        set({ activeTab: tab, preSelectedProfileId: profileId || null }),
      clearPreSelection: () => set({ preSelectedProfileId: null }),
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
        mbtiResults: state.mbtiResults,
        eqScores: state.eqScores,
        fontSize: state.fontSize,
        theme: state.theme,
        moduleHistory: state.moduleHistory,
      }),
    }
  )
);
