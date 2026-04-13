// ============================================================
// English Translation
// ============================================================

import type { TranslationKeys } from "./zh";

const en: TranslationKeys = {
  // ---- Navigation / Sidebar ----
  nav: {
    dashboard: "Dashboard",
    dashboardSub: "Analytics Dashboard",
    analyze: "Analyze",
    analyzeSub: "Conversation Analysis",
    profiles: "Profiles",
    profilesSub: "Person Profiles",
    drill: "Drill",
    drillSub: "Simulation & Coaching",
    psychology: "Psychology",
    psychologySub: "Psychology Counselor",
    legal: "Legal",
    legalSub: "Legal Advisor",
    planning: "Planning",
    planningSub: "Life & Work Planner",
    divination: "Divination",
    divinationSub: "Metaphysics & Divination",
    mbti: "MBTI",
    mbtiSub: "Personality Quick Test",
    settings: "Settings",
    settingsSub: "Data & Settings",
  },

  // ---- Common ----
  common: {
    send: "Send",
    cancel: "Cancel",
    confirm: "Confirm",
    delete: "Delete",
    save: "Save",
    reset: "Reset",
    export: "Export",
    import: "Import",
    loading: "Loading...",
    newChat: "New Chat",
    search: "Search",
    noData: "No data",
    back: "Back",
    close: "Close",
    copy: "Copy",
    copied: "Copied",
    retry: "Retry",
    archive: "Archive",
    all: "All",
    disclaimer: "Disclaimer",
    describeImage: "Describe the issue in the image...",
    history: "History",
  },

  // ---- Settings ----
  settings: {
    title: "Settings",
    subtitle: "Preferences · Data Management · Local-first",
    apiConfig: "API Configuration",
    apiConfigSub: "Customize LLM endpoint, key, and model",
    quickSwitch: "Quick Switch",
    apiEndpoint: "API Endpoint (Base URL)",
    apiKey: "API Key",
    apiKeyPlaceholder: "Enter API Key...",
    modelSelect: "Model",
    addCustomModel: "Add custom model name...",
    testConnection: "Test Connection",
    testing: "Testing...",
    language: "Language",
    theme: "Theme",
  },

  // ---- AI Memory ----
  memory: {
    title: "AI Long-term Memory",
    subtitle: "Persistent context across conversations",
    activeCount: "active memories",
    archivedCount: "archived",
    addMemory: "Add Memory",
    inputPlaceholder: "Enter information for AI to remember...",
    exampleHint: "e.g., I'm a developer, I have two kids, I'm interested in contract disputes",
    emptyTitle: "AI hasn't remembered anything about you yet.",
    emptyHint: "After using Psychology or Legal counselor, the system will auto-extract key info.",
    categories: {
      preference: "Preference",
      family: "Family",
      work: "Work",
      health: "Health",
      legal: "Legal",
      psychology: "Psychology",
      divination: "Divination",
      general: "General",
    },
  },

  // ---- Legal Advisor ----
  legal: {
    title: "Legal Advisor",
    subtitle: "Chinese Law · Judicial Interpretation · Daily Rights Protection",
    disclaimer: "This legal advisor is AI-powered. Interpretations are for reference only and do not constitute formal legal advice. For significant rights or complex cases, please consult a licensed attorney.",
    domains: {
      contract: "Contract Disputes",
      labor: "Labor Disputes",
      marriage: "Marriage & Family",
      property: "Property Rights",
      consumer: "Consumer Protection",
      traffic: "Traffic Accidents",
      ip: "Intellectual Property",
      criminal: "Criminal Defense",
    },
    chooseArea: "Choose consultation area (optional)",
    inputPlaceholder: "Describe your legal question...",
    greeting: "Hello, what legal question can I help with?",
    greetingSub: "Select a legal domain or describe your issue directly",
    quickPrompts: "Quick Prompts",
  },

  // ---- Psychology ----
  psychology: {
    title: "Psychology Counselor",
    subtitle: "Relationship Network · Personalized Guidance · Optimization Advice",
    disclaimer: "AI counselor is for reference only and cannot replace professional counseling. For serious concerns, seek professional help.",
    greeting: "Hello, I'm your psychology counselor",
    greetingSub: "You can talk to me about any relationship struggles, emotional stress, or communication challenges. I'll provide personalized analysis based on your relationship network profile data.",
    inputPlaceholder: "Share your concerns, emotions, or relationship issues...",
  },

  // ---- Analyze ----
  analyze: {
    title: "Conversation Analysis",
    subtitle: "Deep Pattern Analysis · Psychological Insight · Relationship Diagnosis",
    screenshotUpload: "Upload Chat Screenshots",
    batchOcr: "Batch OCR",
    ocrProcessing: "Recognizing...",
  },

  // ---- Divination ----
  divination: {
    title: "Divination",
    subtitle: "Traditional Wisdom · AI-Powered · Destiny Reference",
    uploadFacePhoto: "Upload Face/Palm Photo (Optional)",
    uploadFaceHint: "AI will auto-analyze facial/palm features",
    faceDescription: "AI Face/Palm Description:",
  },

  // ---- Dashboard ----
  dashboard: {
    title: "Dashboard",
    subtitle: "Global Insight · Trend Tracking · Comprehensive Analysis",
    profiles: "Profiles",
    conversations: "Conversations",
    messages: "Messages",
    analysisCoverage: "Coverage",
    avgMsgPerConvo: "Avg Msgs/Convo",
    divination: "Divination",
    chatSessions: "Sessions",
    feedbackRate: "Feedback Score",
    activityTimeline: "Activity Timeline",
    eqGrowth: "EQ Growth Curve",
    moduleRadar: "Module Radar",
    sentimentDist: "Sentiment Distribution",
    heatmap: "Activity Heatmap",
    noDataHint: "Data will appear here after analyzing conversations and creating profiles",
    generateInsight: "Generate AI Insight",
    generating: "Generating...",
    personUnit: "",
    convUnit: "",
    msgUnit: "",
    timesUnit: "",
    fromAnalysis: "from conversation analysis",
    shadowBand: "Shaded area = rolling ±1σ confidence band",
    scatterHint: "Dot size ∝ daily activity frequency",
    convoLabel: "Convo",
    mysticLabel: "Mystic",
    statisticalInsight: "Statistical Insight",
    coverageRate: "Analysis Coverage",
    convosAnalyzed: "conversations analyzed",
    sentimentCI: "Sentiment Mean 95% CI",
    sigPositive: "✓ Significant positive tendency (CI > 0)",
    sigNegative: "⚠ Significant negative tendency (CI < 0)",
    sigNeutral: "○ No significant tendency (CI crosses 0)",
    eqAvg: "EQ Average",
    assessments: "assessments",
    dataSummary: "Data Summary",
    relNetwork: "Relationships",
    aiMemory: "AI Memory",
    dataSpan: "Data Span",
    dayUnit: "d",
    dailyActivity: "Daily Activity",
    topDivination: "Top Divination",
    topProfiles: "Most Active Profiles",
    noProfiles: "No profiles yet",
    recentTrend: "Recent Activity Line",
    convoTrend: "Conversation Trend Line",
    dayGranularity: "Day",
    weekGranularity: "Week",
    totalVsAnalyzed: "Total vs Analyzed",
    totalConvos: "Total",
    analyzed: "Analyzed",
    noTrend: "No trend data yet",
    dimDetail: "Dimension Detail",
    boxPlotTitle: "Box Plot · Quartile Distribution",
    sentimentHint: "Average sentiment per conversation (−1=negative, +1=positive)",
    heatmapHint: "Daily activity frequency, last 16 weeks",
    heatmapDayLabels: ["Su", "", "Tu", "", "Th", "", "Sa"],
    less: "Less",
    more: "More",
    aiInsightTitle: "AI Data Insight",
    generateReport: "Generate Insight Report",
    analyzing: "Analyzing…",
    aiInsightDesc: "Professional data analysis generated by LLM based on current dashboard snapshot",
    clickGenerate: "Click \"Generate Insight Report\" for AI data analysis",
    noContent: "No content generated. Please retry.",
    insightFailed: "Insight generation failed",
    moduleUsageHint: "Module usage proportion radar chart",
    usagePercent: "Usage %",
    percentLabel: "Share %",
    positive: "Positive",
    neutral: "Neutral",
    negative: "Negative",
    sentimentValue: "Sentiment",
    convoIndex: "Conversation Index",
    convoN: "Convo",
    avgLabel: "Average",
    activityCount: "activities",
    exportPDF: "Export PDF Report",
    exportJSON: "Export Raw JSON Data",
    noEQData: "Available after conversation analysis",
  },

  // ---- MBTI ----
  mbti: {
    title: "MBTI Test",
    subtitle: "Quick Personality Type Test",
  },

  // ---- Planning ----
  planning: {
    title: "Life Planner",
    subtitle: "AI-Assisted Life & Work Planning",
  },

  // ---- Drill ----
  drill: {
    title: "Simulation Drill",
    subtitle: "Scenario Simulation · Strategy Practice · Instant Feedback",
  },

  // ---- Profiles ----
  profiles: {
    title: "Person Profiles",
    subtitle: "Relationship Network · Behavior Patterns · Deep Profiling",
  },

  // ---- Toast Messages ----
  toast: {
    apiSuccess: "API Connected",
    apiSuccessMsg: "Successfully connected to LLM service",
    apiFail: "API Connection Failed",
    networkError: "Network Error",
    exportSuccess: "Export Successful",
    copySuccess: "Copied to clipboard",
  },

  // ---- Data Privacy ----
  privacy: {
    title: "Privacy & Data Security",
    encryption: "Data Encryption",
    autoDelete: "Auto Delete",
    anonymize: "Anonymized Export",
    purgeAll: "Purge All Personal Data",
  },
} as const;

export default en;
