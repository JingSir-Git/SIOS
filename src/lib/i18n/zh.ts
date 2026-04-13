// ============================================================
// Chinese (Simplified) — Default Language
// ============================================================

const zh = {
  // ---- Navigation / Sidebar ----
  nav: {
    dashboard: "数据大盘",
    dashboardSub: "Analytics Dashboard",
    analyze: "对话分析",
    analyzeSub: "Conversation Analysis",
    profiles: "人物画像",
    profilesSub: "Person Profiles",
    drill: "模拟演练",
    drillSub: "Simulation & Coaching",
    psychology: "心理顾问",
    psychologySub: "Psychology Counselor",
    legal: "法律顾问",
    legalSub: "Legal Advisor",
    planning: "规划制定",
    planningSub: "Life & Work Planner",
    divination: "风水玄学",
    divinationSub: "Metaphysics & Divination",
    mbti: "MBTI 检测",
    mbtiSub: "Personality Quick Test",
    settings: "数据管理",
    settingsSub: "Data & Settings",
  },

  // ---- Common ----
  common: {
    send: "发送",
    cancel: "取消",
    confirm: "确认",
    delete: "删除",
    save: "保存",
    reset: "重置",
    export: "导出",
    import: "导入",
    loading: "加载中...",
    newChat: "新对话",
    search: "搜索",
    noData: "暂无数据",
    back: "返回",
    close: "关闭",
    copy: "复制",
    copied: "已复制",
    retry: "重试",
    archive: "归档",
    all: "全部",
    disclaimer: "免责声明",
    describeImage: "描述图片中的问题...",
    history: "历史记录",
  },

  // ---- Settings ----
  settings: {
    title: "数据管理",
    subtitle: "个性化偏好 · 数据管理 · 本地优先",
    apiConfig: "API 配置",
    apiConfigSub: "自定义LLM服务端点、密钥和模型",
    quickSwitch: "快速切换方案",
    apiEndpoint: "API 端点 (Base URL)",
    apiKey: "API 密钥",
    apiKeyPlaceholder: "输入API Key...",
    modelSelect: "模型选择",
    addCustomModel: "添加自定义模型名称...",
    testConnection: "测试连接",
    testing: "测试中...",
    language: "语言",
    theme: "主题",
  },

  // ---- AI Memory ----
  memory: {
    title: "AI 长期记忆",
    subtitle: "跨对话的持久上下文",
    activeCount: "条活跃记忆",
    archivedCount: "条已归档",
    addMemory: "添加记忆",
    inputPlaceholder: "输入需要AI记住的信息...",
    exampleHint: "例如：我是一名程序员、家里有两个孩子、我对合同纠纷比较关注",
    emptyTitle: "AI还没有记住关于你的任何信息。",
    emptyHint: "使用心理顾问或法律顾问对话后，系统会自动提取关键信息存入记忆。",
    categories: {
      preference: "偏好",
      family: "家庭",
      work: "工作",
      health: "健康",
      legal: "法律",
      psychology: "心理",
      divination: "玄学",
      general: "通用",
    },
  },

  // ---- Legal Advisor ----
  legal: {
    title: "法律顾问",
    subtitle: "中国现行法律 · 司法解释 · 日常维权调解",
    disclaimer: "本法律顾问由AI提供，解读仅供参考，不构成正式法律意见。涉及重大权益或复杂案件，请务必咨询持证执业律师。",
    domains: {
      contract: "合同纠纷",
      labor: "劳动争议",
      marriage: "婚姻家庭",
      property: "房产物权",
      consumer: "消费维权",
      traffic: "交通事故",
      ip: "知识产权",
      criminal: "刑事辩护",
    },
    chooseArea: "选择咨询领域（可选）",
    inputPlaceholder: "描述您的法律问题...",
    greeting: "您好，有什么法律问题需要咨询？",
    greetingSub: "选择咨询领域或直接描述您的问题",
    quickPrompts: "快捷提问",
  },

  // ---- Psychology ----
  psychology: {
    title: "心理顾问",
    subtitle: "关系网络画像 · 个性化心理疏导 · 关系优化建议",
    disclaimer: "AI心理顾问仅供参考，不能替代专业心理咨询。如有严重心理困扰，请寻求专业帮助。",
    greeting: "你好，我是你的心理顾问",
    greetingSub: "你可以跟我聊任何人际关系的困扰、情绪压力、沟通难题。我会基于你的关系网络画像数据，给你个性化的分析和建议。",
    inputPlaceholder: "说说你的困扰、情绪、或者想聊的关系问题...",
  },

  // ---- Analyze ----
  analyze: {
    title: "对话分析",
    subtitle: "深度解析对话模式 · 心理洞察 · 关系诊断",
    screenshotUpload: "上传聊天截图",
    batchOcr: "批量识别",
    ocrProcessing: "识别中...",
  },

  // ---- Divination ----
  divination: {
    title: "风水玄学",
    subtitle: "传统智慧 · AI赋能 · 命理参考",
    uploadFacePhoto: "上传面相/手相照片（可选）",
    uploadFaceHint: "AI将自动分析面部/掌纹特征",
    faceDescription: "AI 面容/掌纹描述:",
  },

  // ---- Dashboard ----
  dashboard: {
    title: "数据大盘",
    subtitle: "全局洞察 · 趋势追踪 · 综合分析",
    profiles: "画像",
    conversations: "对话",
    messages: "消息",
    analysisCoverage: "分析覆盖",
    avgMsgPerConvo: "均消息/对话",
    divination: "玄学",
    chatSessions: "咨询会话",
    feedbackRate: "反馈好评率",
    activityTimeline: "活动时间线",
    eqGrowth: "EQ成长曲线",
    moduleRadar: "模块使用雷达",
    sentimentDist: "情绪分布",
    heatmap: "活动热力图",
    noDataHint: "开始对话分析和创建人物画像后，数据将在此展示",
    generateInsight: "生成AI洞察",
    generating: "生成中...",
    personUnit: "人",
    convUnit: "段",
    msgUnit: "条",
    timesUnit: "次",
    fromAnalysis: "来自对话分析",
    shadowBand: "阴影区域 = 滚动±1σ置信带",
    scatterHint: "散点大小 ∝ 当日活动频次",
    convoLabel: "对话",
    mysticLabel: "玄学",
    statisticalInsight: "统计洞察",
    coverageRate: "分析覆盖率",
    convosAnalyzed: "段对话已分析",
    sentimentCI: "情绪均值 95% CI",
    sigPositive: "✓ 显著积极倾向 (CI > 0)",
    sigNegative: "⚠ 显著消极倾向 (CI < 0)",
    sigNeutral: "○ 无显著倾向 (CI 跨越0)",
    eqAvg: "EQ均分",
    assessments: "次评估",
    dataSummary: "数据摘要",
    relNetwork: "关系网络",
    aiMemory: "AI记忆",
    dataSpan: "数据跨度",
    dayUnit: "天",
    dailyActivity: "日均活动",
    topDivination: "最常用玄学",
    topProfiles: "最活跃人物",
    noProfiles: "暂无画像",
    recentTrend: "近期活动折线",
    convoTrend: "对话趋势折线",
    dayGranularity: "日",
    weekGranularity: "周",
    totalVsAnalyzed: "总对话 vs 已分析",
    totalConvos: "总对话",
    analyzed: "已分析",
    noTrend: "暂无趋势数据",
    dimDetail: "维度分布详情",
    boxPlotTitle: "Box Plot · 四分位分布",
    sentimentHint: "每段对话平均对方情绪值 (−1=消极, +1=积极)",
    heatmapHint: "近16周每日活动频次",
    heatmapDayLabels: ["日", "", "二", "", "四", "", "六"],
    less: "少",
    more: "多",
    aiInsightTitle: "AI 数据洞察",
    generateReport: "生成洞察报告",
    analyzing: "分析中…",
    aiInsightDesc: "基于当前数据大盘统计快照，由LLM生成专业数据解读",
    clickGenerate: "点击「生成洞察报告」获取AI数据解读",
    noContent: "未生成内容，请重试。",
    insightFailed: "洞察生成失败",
    moduleUsageHint: "各模块使用占比雷达图",
    usagePercent: "使用占比",
    percentLabel: "占比 %",
    positive: "积极",
    neutral: "中性",
    negative: "消极",
    sentimentValue: "情绪值",
    convoIndex: "对话序号",
    convoN: "对话",
    avgLabel: "均值",
    activityCount: "次活动",
    exportPDF: "导出为PDF报告",
    exportJSON: "导出原始数据JSON",
    noEQData: "完成对话分析后显示",
  },

  // ---- MBTI ----
  mbti: {
    title: "MBTI 检测",
    subtitle: "快速人格类型测试",
  },

  // ---- Planning ----
  planning: {
    title: "规划制定",
    subtitle: "AI辅助的生活与工作规划",
  },

  // ---- Drill ----
  drill: {
    title: "模拟演练",
    subtitle: "场景模拟 · 策略演练 · 即时反馈",
  },

  // ---- Profiles ----
  profiles: {
    title: "人物画像",
    subtitle: "关系网络 · 行为模式 · 深度画像",
  },

  // ---- Toast Messages ----
  toast: {
    apiSuccess: "API连接成功",
    apiSuccessMsg: "已成功连接到LLM服务",
    apiFail: "API连接失败",
    networkError: "网络错误",
    exportSuccess: "导出成功",
    copySuccess: "已复制到剪贴板",
  },

  // ---- Data Privacy ----
  privacy: {
    title: "隐私与数据安全",
    encryption: "数据加密",
    autoDelete: "自动删除",
    anonymize: "匿名化导出",
    purgeAll: "清除所有个人数据",
  },
} as const;

/** Recursively widen a const object from literal types to runtime types */
type DeepMutableString<T> = {
  -readonly [K in keyof T]: T[K] extends readonly (infer _)[]
    ? string[]
    : T[K] extends string
    ? string
    : T[K] extends object
    ? DeepMutableString<T[K]>
    : T[K];
};

export type TranslationKeys = DeepMutableString<typeof zh>;
export default zh;
