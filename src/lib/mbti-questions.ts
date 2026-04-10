// ============================================================
// MBTI Quick Test — 24 Questions (6 per dimension pair)
// ============================================================
// Each question maps to one of the four MBTI dimension pairs:
//   E/I (Extraversion / Introversion)
//   S/N (Sensing / iNtuition)
//   T/F (Thinking / Feeling)
//   J/P (Judging / Perceiving)
//
// Each answer choice has a weight toward one pole.
// The test is intentionally lightweight — results are
// indicative, not diagnostic.
// ============================================================

export interface MBTIQuestion {
  id: number;
  dimension: "EI" | "SN" | "TF" | "JP";
  text: string;
  optionA: { label: string; pole: string; weight: number };
  optionB: { label: string; pole: string; weight: number };
}

export interface MBTIResult {
  type: string; // e.g. "INTJ"
  scores: {
    E: number; I: number;
    S: number; N: number;
    T: number; F: number;
    J: number; P: number;
  };
  percentages: {
    EI: { label: string; value: number };
    SN: { label: string; value: number };
    TF: { label: string; value: number };
    JP: { label: string; value: number };
  };
}

export const MBTI_TYPE_DESCRIPTIONS: Record<string, { label: string; nickname: string; description: string }> = {
  INTJ: { label: "INTJ", nickname: "策略家", description: "独立、有远见的战略思想家，善于将复杂的想法转化为可执行的计划" },
  INTP: { label: "INTP", nickname: "逻辑学家", description: "创新的思考者，对知识充满渴望，擅长分析和理论构建" },
  ENTJ: { label: "ENTJ", nickname: "指挥官", description: "果断的领导者，善于组织和推动目标实现，天生的战略家" },
  ENTP: { label: "ENTP", nickname: "辩论家", description: "聪明好辩的创新者，喜欢挑战现状和探索新可能性" },
  INFJ: { label: "INFJ", nickname: "提倡者", description: "安静而有洞察力的理想主义者，致力于帮助他人实现潜力" },
  INFP: { label: "INFP", nickname: "调停者", description: "富有想象力的理想主义者，内心充满热情和对美好事物的追求" },
  ENFJ: { label: "ENFJ", nickname: "主人公", description: "富有魅力的领导者，善于激励他人并推动积极变化" },
  ENFP: { label: "ENFP", nickname: "竞选者", description: "热情洋溢的创意者，善于发现可能性并激励他人" },
  ISTJ: { label: "ISTJ", nickname: "物流师", description: "可靠而务实的执行者，重视传统和秩序，是值得信赖的支柱" },
  ISFJ: { label: "ISFJ", nickname: "守卫者", description: "温暖而尽责的保护者，默默关心他人并维护和谐" },
  ESTJ: { label: "ESTJ", nickname: "总经理", description: "高效的组织者和管理者，重视秩序、规则和责任" },
  ESFJ: { label: "ESFJ", nickname: "执政官", description: "热心的合作者，善于照顾他人需求并营造和谐氛围" },
  ISTP: { label: "ISTP", nickname: "鉴赏家", description: "灵活而务实的问题解决者，喜欢动手探索事物的运作原理" },
  ISFP: { label: "ISFP", nickname: "探险家", description: "温和而敏感的艺术家，珍视个人自由和审美体验" },
  ESTP: { label: "ESTP", nickname: "企业家", description: "精力充沛的行动派，善于抓住机遇并快速适应变化" },
  ESFP: { label: "ESFP", nickname: "表演者", description: "热情奔放的表演者，善于营造欢乐氛围并享受当下" },
};

export const MBTI_QUESTIONS: MBTIQuestion[] = [
  // ============================================================
  // E/I 维度 — 能量来源（6题）
  // ============================================================
  {
    id: 1,
    dimension: "EI",
    text: "工作了一整天之后，你更倾向于？",
    optionA: { label: "约朋友出去聚餐或活动，和人待在一起让我充电", pole: "E", weight: 1 },
    optionB: { label: "回家独处或安静地做自己的事，独处让我恢复能量", pole: "I", weight: 1 },
  },
  {
    id: 2,
    dimension: "EI",
    text: "在团队讨论中，你通常会？",
    optionA: { label: "积极发言，边说边整理想法", pole: "E", weight: 1 },
    optionB: { label: "先在心里想清楚，然后再表达观点", pole: "I", weight: 1 },
  },
  {
    id: 3,
    dimension: "EI",
    text: "你在社交场合中？",
    optionA: { label: "很容易跟不认识的人聊起来，喜欢认识新朋友", pole: "E", weight: 1 },
    optionB: { label: "更喜欢跟几个熟悉的朋友深度交流", pole: "I", weight: 1 },
  },
  {
    id: 4,
    dimension: "EI",
    text: "你处理问题的方式更倾向于？",
    optionA: { label: "找人讨论，在交流中找到答案", pole: "E", weight: 1 },
    optionB: { label: "自己先独立思考，想清楚再跟别人说", pole: "I", weight: 1 },
  },
  {
    id: 5,
    dimension: "EI",
    text: "周末的理想状态是？",
    optionA: { label: "参加各种活动、聚会，日程排满才充实", pole: "E", weight: 1 },
    optionB: { label: "在家看书、追剧或做手工，享受安静的时光", pole: "I", weight: 1 },
  },
  {
    id: 6,
    dimension: "EI",
    text: "你的朋友圈是？",
    optionA: { label: "很广，认识很多人，虽然深交的不多", pole: "E", weight: 1 },
    optionB: { label: "比较小，但每一个都是深度信任的关系", pole: "I", weight: 1 },
  },

  // ============================================================
  // S/N 维度 — 信息处理（6题）
  // ============================================================
  {
    id: 7,
    dimension: "SN",
    text: "学习新技能时，你更喜欢？",
    optionA: { label: "按照步骤一步步来，注重实际操作和细节", pole: "S", weight: 1 },
    optionB: { label: "先理解整体框架和原理，细节后面再补", pole: "N", weight: 1 },
  },
  {
    id: 8,
    dimension: "SN",
    text: "你在描述一件事情时，通常会？",
    optionA: { label: "用具体的事实和细节来说明", pole: "S", weight: 1 },
    optionB: { label: "用类比和隐喻来传达核心意思", pole: "N", weight: 1 },
  },
  {
    id: 9,
    dimension: "SN",
    text: "面对一个新项目，你首先关注的是？",
    optionA: { label: "现有的数据、资源和可行性", pole: "S", weight: 1 },
    optionB: { label: "未来的可能性和创新的方向", pole: "N", weight: 1 },
  },
  {
    id: 10,
    dimension: "SN",
    text: "你更信任哪种信息？",
    optionA: { label: "亲身经历和眼见为实的证据", pole: "S", weight: 1 },
    optionB: { label: "直觉和对趋势的预感", pole: "N", weight: 1 },
  },
  {
    id: 11,
    dimension: "SN",
    text: "阅读一篇文章时，你更关注？",
    optionA: { label: "具体的事实、数据和案例", pole: "S", weight: 1 },
    optionB: { label: "文章背后的深层含义和启示", pole: "N", weight: 1 },
  },
  {
    id: 12,
    dimension: "SN",
    text: "你觉得自己更像是？",
    optionA: { label: "脚踏实地的实践者，关注当下能做什么", pole: "S", weight: 1 },
    optionB: { label: "天马行空的空想家，总在想未来会怎样", pole: "N", weight: 1 },
  },

  // ============================================================
  // T/F 维度 — 决策方式（6题）
  // ============================================================
  {
    id: 13,
    dimension: "TF",
    text: "做一个困难的决定时，你更看重？",
    optionA: { label: "逻辑分析和客观利弊，理性地权衡", pole: "T", weight: 1 },
    optionB: { label: "对相关人员的影响和自己的价值观", pole: "F", weight: 1 },
  },
  {
    id: 14,
    dimension: "TF",
    text: "朋友跟你吐槽工作不顺心时，你更倾向于？",
    optionA: { label: "帮他分析问题出在哪里，给出解决建议", pole: "T", weight: 1 },
    optionB: { label: "先认同他的感受，陪他聊聊，让他感觉被理解", pole: "F", weight: 1 },
  },
  {
    id: 15,
    dimension: "TF",
    text: "你觉得一个好的决策应该是？",
    optionA: { label: "公平、一致，基于规则和原则", pole: "T", weight: 1 },
    optionB: { label: "有温度、灵活，考虑到每个人的具体情况", pole: "F", weight: 1 },
  },
  {
    id: 16,
    dimension: "TF",
    text: "别人批评你的工作时，你的第一反应是？",
    optionA: { label: "客观评估批评是否合理，合理就改", pole: "T", weight: 1 },
    optionB: { label: "会觉得有点受伤，需要消化一下情绪", pole: "F", weight: 1 },
  },
  {
    id: 17,
    dimension: "TF",
    text: "在争论中，你更容易被什么说服？",
    optionA: { label: "严密的逻辑推理和数据支撑", pole: "T", weight: 1 },
    optionB: { label: "真诚的个人经历分享和情感共鸣", pole: "F", weight: 1 },
  },
  {
    id: 18,
    dimension: "TF",
    text: "你认为「直言不讳」是？",
    optionA: { label: "一种诚实和效率的表现，值得尊重", pole: "T", weight: 1 },
    optionB: { label: "需要看场合和对象，不能不顾别人感受", pole: "F", weight: 1 },
  },

  // ============================================================
  // J/P 维度 — 生活方式（6题）
  // ============================================================
  {
    id: 19,
    dimension: "JP",
    text: "你更喜欢哪种工作方式？",
    optionA: { label: "提前制定计划，按计划一步步执行", pole: "J", weight: 1 },
    optionB: { label: "保持灵活，根据情况随时调整", pole: "P", weight: 1 },
  },
  {
    id: 20,
    dimension: "JP",
    text: "deadline对你来说意味着？",
    optionA: { label: "必须遵守的红线，提前完成才安心", pole: "J", weight: 1 },
    optionB: { label: "一个参考时间点，最后时刻效率最高", pole: "P", weight: 1 },
  },
  {
    id: 21,
    dimension: "JP",
    text: "你的桌面/房间通常是？",
    optionA: { label: "整洁有序，东西都有固定位置", pole: "J", weight: 1 },
    optionB: { label: "比较随意，但我知道什么东西在哪", pole: "P", weight: 1 },
  },
  {
    id: 22,
    dimension: "JP",
    text: "旅行时你更喜欢？",
    optionA: { label: "提前规划好行程、酒店和景点", pole: "J", weight: 1 },
    optionB: { label: "大方向定了就行，到了再随机探索", pole: "P", weight: 1 },
  },
  {
    id: 23,
    dimension: "JP",
    text: "做决定时，你更倾向于？",
    optionA: { label: "尽快做出决定，确定了就安心", pole: "J", weight: 1 },
    optionB: { label: "保留选项，直到不得不做决定的最后时刻", pole: "P", weight: 1 },
  },
  {
    id: 24,
    dimension: "JP",
    text: "你对「变化」的态度是？",
    optionA: { label: "计划赶不上变化让我不舒服，更喜欢稳定可预期", pole: "J", weight: 1 },
    optionB: { label: "变化带来新的可能性，让生活更有趣", pole: "P", weight: 1 },
  },
];

// ============================================================
// Standard Mode — Additional 24 questions (total 48)
// ============================================================

export const MBTI_STANDARD_QUESTIONS: MBTIQuestion[] = [
  // E/I 维度 — 深层能量模式（6题）
  { id: 101, dimension: "EI", text: "在一个项目中，你更喜欢什么角色？",
    optionA: { label: "协调各方、组织讨论、推动进展", pole: "E", weight: 1 },
    optionB: { label: "独立负责一个模块，深入研究", pole: "I", weight: 1 } },
  { id: 102, dimension: "EI", text: "遇到开心的事情，你的第一反应是？",
    optionA: { label: "马上想找人分享", pole: "E", weight: 1 },
    optionB: { label: "先自己品味一下这种快乐", pole: "I", weight: 1 } },
  { id: 103, dimension: "EI", text: "你在学习新技能时更倾向于？",
    optionA: { label: "参加工作坊或学习小组，边讨论边学", pole: "E", weight: 1 },
    optionB: { label: "找到好的教程，自己慢慢钻研", pole: "I", weight: 1 } },
  { id: 104, dimension: "EI", text: "你如何描述自己的社交电量？",
    optionA: { label: "和人交流让我充电，独处久了反而焦虑", pole: "E", weight: 1 },
    optionB: { label: "社交虽然愉快但会消耗能量，独处才能恢复", pole: "I", weight: 1 } },
  { id: 105, dimension: "EI", text: "在会议中你通常会？",
    optionA: { label: "积极发言，边说边想，观点在讨论中成形", pole: "E", weight: 1 },
    optionB: { label: "先倾听和思考，等想清楚了再发言", pole: "I", weight: 1 } },
  { id: 106, dimension: "EI", text: "周末你更享受？",
    optionA: { label: "和不同的朋友约各种活动", pole: "E", weight: 1 },
    optionB: { label: "和一两个亲密的人或独自度过", pole: "I", weight: 1 } },

  // S/N 维度 — 深层认知偏好（6题）
  { id: 107, dimension: "SN", text: "别人向你描述一个商业计划时，你最先关注？",
    optionA: { label: "具体的数据、市场规模、执行步骤", pole: "S", weight: 1 },
    optionB: { label: "整体愿景、创新点、未来可能性", pole: "N", weight: 1 } },
  { id: 108, dimension: "SN", text: "你在写邮件/消息时更倾向于？",
    optionA: { label: "具体、简洁、直奔主题", pole: "S", weight: 1 },
    optionB: { label: "先说背景和思路，再说具体要求", pole: "N", weight: 1 } },
  { id: 109, dimension: "SN", text: "面对一个复杂问题，你的思考方式更接近？",
    optionA: { label: "从已知事实出发，逐步推导结论", pole: "S", weight: 1 },
    optionB: { label: "先形成整体直觉，再寻找证据验证", pole: "N", weight: 1 } },
  { id: 110, dimension: "SN", text: "你更欣赏哪种同事？",
    optionA: { label: "脚踏实地、注重细节、执行力强", pole: "S", weight: 1 },
    optionB: { label: "有远见、善于创新、能看到大局", pole: "N", weight: 1 } },
  { id: 111, dimension: "SN", text: "阅读时你更享受？",
    optionA: { label: "实用型书籍，学到可以直接应用的知识", pole: "S", weight: 1 },
    optionB: { label: "思想型书籍，拓展认知边界和思维方式", pole: "N", weight: 1 } },
  { id: 112, dimension: "SN", text: "你的记忆方式更接近？",
    optionA: { label: "记住具体的细节、数字、场景", pole: "S", weight: 1 },
    optionB: { label: "记住整体的感觉、联想和意义", pole: "N", weight: 1 } },

  // T/F 维度 — 深层决策偏好（6题）
  { id: 113, dimension: "TF", text: "朋友做了一个你认为错误的决定，你会？",
    optionA: { label: "直接指出问题，给出理性分析", pole: "T", weight: 1 },
    optionB: { label: "先表达理解，再委婉提出不同看法", pole: "F", weight: 1 } },
  { id: 114, dimension: "TF", text: "评价一个团队成员的表现时，你更看重？",
    optionA: { label: "客观的工作成果和效率指标", pole: "T", weight: 1 },
    optionB: { label: "团队协作态度和对同事的影响", pole: "F", weight: 1 } },
  { id: 115, dimension: "TF", text: "做一个重大决定时（如换工作），你主要依据？",
    optionA: { label: "薪酬、发展空间、行业前景等客观因素", pole: "T", weight: 1 },
    optionB: { label: "是否喜欢团队氛围、是否有意义感", pole: "F", weight: 1 } },
  { id: 116, dimension: "TF", text: "看到一条新闻引发热议，你的第一反应是？",
    optionA: { label: "分析事件的逻辑链和各方立场", pole: "T", weight: 1 },
    optionB: { label: "感受当事人的处境和情绪", pole: "F", weight: 1 } },
  { id: 117, dimension: "TF", text: "在谈判中你更擅长？",
    optionA: { label: "用数据和逻辑说服对方", pole: "T", weight: 1 },
    optionB: { label: "建立信任和情感连接来推进", pole: "F", weight: 1 } },
  { id: 118, dimension: "TF", text: "别人说你「太理性了」或「太感性了」，你更常听到哪个？",
    optionA: { label: "太理性/太冷静/不近人情", pole: "T", weight: 1 },
    optionB: { label: "太感性/太在意别人/心软", pole: "F", weight: 1 } },

  // J/P 维度 — 深层生活管理（6题）
  { id: 119, dimension: "JP", text: "你的待办清单通常是？",
    optionA: { label: "详细的、按优先级排列的、每天检查", pole: "J", weight: 1 },
    optionB: { label: "松散的、经常变化的、或者根本没有", pole: "P", weight: 1 } },
  { id: 120, dimension: "JP", text: "面对一个新项目，你更倾向于？",
    optionA: { label: "先规划整体框架和时间线，然后开始执行", pole: "J", weight: 1 },
    optionB: { label: "先开始尝试，在过程中逐渐形成方案", pole: "P", weight: 1 } },
  { id: 121, dimension: "JP", text: "你对「即兴」的态度是？",
    optionA: { label: "让我不太舒服，我喜欢有准备", pole: "J", weight: 1 },
    optionB: { label: "很享受，临场发挥往往有惊喜", pole: "P", weight: 1 } },
  { id: 122, dimension: "JP", text: "在购物时你更倾向于？",
    optionA: { label: "有明确的购物清单，买完就走", pole: "J", weight: 1 },
    optionB: { label: "逛着看，发现喜欢的就买", pole: "P", weight: 1 } },
  { id: 123, dimension: "JP", text: "你怎么处理未完成的事情？",
    optionA: { label: "如鲠在喉，必须尽快完成才能放松", pole: "J", weight: 1 },
    optionB: { label: "可以暂时搁置，等灵感或时机到了再说", pole: "P", weight: 1 } },
  { id: 124, dimension: "JP", text: "你的理想假期是？",
    optionA: { label: "提前详细规划的充实行程", pole: "J", weight: 1 },
    optionB: { label: "只定好大方向，走到哪算哪", pole: "P", weight: 1 } },
];

// ============================================================
// Full Mode — Additional 45 questions (total 93)
// ============================================================

export const MBTI_FULL_QUESTIONS: MBTIQuestion[] = [
  // E/I 维度 — 极深层（9题）
  { id: 201, dimension: "EI", text: "你更容易在什么情况下产生好的想法？",
    optionA: { label: "和别人头脑风暴、讨论碰撞时", pole: "E", weight: 1 },
    optionB: { label: "独自散步、洗澡或安静沉思时", pole: "I", weight: 1 } },
  { id: 202, dimension: "EI", text: "当你在人群中突然感到不舒服时，你会？",
    optionA: { label: "找熟悉的人聊天来缓解", pole: "E", weight: 1 },
    optionB: { label: "找一个角落或借口暂时离开", pole: "I", weight: 1 } },
  { id: 203, dimension: "EI", text: "你的朋友圈发布频率和风格更接近？",
    optionA: { label: "经常分享生活，喜欢互动和评论", pole: "E", weight: 1 },
    optionB: { label: "很少发，偶尔发也比较含蓄", pole: "I", weight: 1 } },
  { id: 204, dimension: "EI", text: "别人第一次见你的评价通常是？",
    optionA: { label: "开朗、健谈、有感染力", pole: "E", weight: 1 },
    optionB: { label: "安静、深沉、不太好接近", pole: "I", weight: 1 } },
  { id: 205, dimension: "EI", text: "当你需要做一个重要演讲时？",
    optionA: { label: "虽然紧张但也有期待感，享受舞台感觉", pole: "E", weight: 1 },
    optionB: { label: "主要感到压力，更希望用书面方式表达", pole: "I", weight: 1 } },
  { id: 206, dimension: "EI", text: "你在微信群里通常是？",
    optionA: { label: "活跃分子，经常发言互动", pole: "E", weight: 1 },
    optionB: { label: "潜水者，只看不怎么说话", pole: "I", weight: 1 } },
  { id: 207, dimension: "EI", text: "理想的工作环境是？",
    optionA: { label: "开放式办公，随时可以和同事交流", pole: "E", weight: 1 },
    optionB: { label: "独立的安静空间，需要时再交流", pole: "I", weight: 1 } },
  { id: 208, dimension: "EI", text: "你处理矛盾的方式更接近？",
    optionA: { label: "直接沟通，当面说清楚", pole: "E", weight: 1 },
    optionB: { label: "先自己想清楚，可能通过文字表达", pole: "I", weight: 1 } },
  { id: 209, dimension: "EI", text: "下班后你更想？",
    optionA: { label: "和朋友吃饭聊天放松", pole: "E", weight: 1 },
    optionB: { label: "回家安静地做自己的事", pole: "I", weight: 1 } },

  // S/N 维度 — 极深层（9题）
  { id: 210, dimension: "SN", text: "你在观察一幅画时更注意？",
    optionA: { label: "色彩、构图、技法等具体细节", pole: "S", weight: 1 },
    optionB: { label: "整体氛围、象征意义、引发的联想", pole: "N", weight: 1 } },
  { id: 211, dimension: "SN", text: "你更信赖哪种方式做判断？",
    optionA: { label: "亲身经历和已证实的事实", pole: "S", weight: 1 },
    optionB: { label: "直觉和理论推演", pole: "N", weight: 1 } },
  { id: 212, dimension: "SN", text: "你给别人指路时会？",
    optionA: { label: "说具体的距离、标志物和转弯方向", pole: "S", weight: 1 },
    optionB: { label: "画一个大概的示意图，说个大方向", pole: "N", weight: 1 } },
  { id: 213, dimension: "SN", text: "你在听别人说话时更容易注意到？",
    optionA: { label: "具体的数据和事实是否准确", pole: "S", weight: 1 },
    optionB: { label: "言外之意和深层含义", pole: "N", weight: 1 } },
  { id: 214, dimension: "SN", text: "你学一门新技能时更喜欢？",
    optionA: { label: "按照说明书一步步操作", pole: "S", weight: 1 },
    optionB: { label: "先了解原理，然后自己摸索", pole: "N", weight: 1 } },
  { id: 215, dimension: "SN", text: "你对未来的态度更接近？",
    optionA: { label: "基于现状做合理预测和规划", pole: "S", weight: 1 },
    optionB: { label: "想象各种可能性，寻找突破口", pole: "N", weight: 1 } },
  { id: 216, dimension: "SN", text: "你更享受哪类对话？",
    optionA: { label: "分享具体的经历和有用的信息", pole: "S", weight: 1 },
    optionB: { label: "探讨概念、假设和哲学问题", pole: "N", weight: 1 } },
  { id: 217, dimension: "SN", text: "你如何描述一个人？",
    optionA: { label: "外貌特征、穿着、说话方式等具体信息", pole: "S", weight: 1 },
    optionB: { label: "性格特点、给人的感觉、像什么类型", pole: "N", weight: 1 } },
  { id: 218, dimension: "SN", text: "你在做PPT时更注重？",
    optionA: { label: "准确的数据、清晰的逻辑、完整的信息", pole: "S", weight: 1 },
    optionB: { label: "有冲击力的概念、引人深思的洞察", pole: "N", weight: 1 } },

  // T/F 维度 — 极深层（9题）
  { id: 219, dimension: "TF", text: "当你需要批评下属时，你会？",
    optionA: { label: "直接指出问题，明确改进要求", pole: "T", weight: 1 },
    optionB: { label: "先肯定优点，再婉转提出建议", pole: "F", weight: 1 } },
  { id: 220, dimension: "TF", text: "你更难以忍受哪种情况？",
    optionA: { label: "逻辑混乱、效率低下、不够专业", pole: "T", weight: 1 },
    optionB: { label: "冷漠无情、不顾他人感受、缺乏同理心", pole: "F", weight: 1 } },
  { id: 221, dimension: "TF", text: "如果朋友因为分手很伤心来找你，你会？",
    optionA: { label: "帮他分析原因，想出解决方案或下一步计划", pole: "T", weight: 1 },
    optionB: { label: "陪他倾诉，先让他把情绪释放出来", pole: "F", weight: 1 } },
  { id: 222, dimension: "TF", text: "你在面试候选人时最看重？",
    optionA: { label: "能力匹配度、逻辑思维、专业水平", pole: "T", weight: 1 },
    optionB: { label: "价值观是否契合、团队融入度、人品", pole: "F", weight: 1 } },
  { id: 223, dimension: "TF", text: "你觉得一个好的领导最重要的品质是？",
    optionA: { label: "战略眼光和决策能力", pole: "T", weight: 1 },
    optionB: { label: "凝聚人心和激发潜力", pole: "F", weight: 1 } },
  { id: 224, dimension: "TF", text: "当公正和仁慈产生冲突时，你更倾向？",
    optionA: { label: "坚持公正，规则面前人人平等", pole: "T", weight: 1 },
    optionB: { label: "考虑具体情况，适当通融", pole: "F", weight: 1 } },
  { id: 225, dimension: "TF", text: "你在写工作邮件时的风格？",
    optionA: { label: "简洁直接，聚焦事实和行动项", pole: "T", weight: 1 },
    optionB: { label: "注意措辞温度，会加上问候和感谢", pole: "F", weight: 1 } },
  { id: 226, dimension: "TF", text: "你在争论中更容易被什么说服？",
    optionA: { label: "严密的逻辑和有力的证据", pole: "T", weight: 1 },
    optionB: { label: "真诚的表达和动人的故事", pole: "F", weight: 1 } },
  { id: 227, dimension: "TF", text: "你更认同哪句话？",
    optionA: { label: "真相比感受更重要", pole: "T", weight: 1 },
    optionB: { label: "方式比内容更重要", pole: "F", weight: 1 } },

  // J/P 维度 — 极深层（9题）
  { id: 228, dimension: "JP", text: "你的冰箱和厨房通常是？",
    optionA: { label: "分类清楚、定期整理、知道每样东西的位置", pole: "J", weight: 1 },
    optionB: { label: "比较随意，可能有过期的东西", pole: "P", weight: 1 } },
  { id: 229, dimension: "JP", text: "你怎么对待规则和流程？",
    optionA: { label: "尊重规则，它们存在自有道理", pole: "J", weight: 1 },
    optionB: { label: "规则是参考，不合理的可以灵活变通", pole: "P", weight: 1 } },
  { id: 230, dimension: "JP", text: "你更喜欢哪种类型的项目？",
    optionA: { label: "有明确交付标准和时间节点的", pole: "J", weight: 1 },
    optionB: { label: "开放式的、可以自由探索的", pole: "P", weight: 1 } },
  { id: 231, dimension: "JP", text: "收到一个好消息后，你会？",
    optionA: { label: "很快开始规划下一步行动", pole: "J", weight: 1 },
    optionB: { label: "先享受这个好消息带来的喜悦", pole: "P", weight: 1 } },
  { id: 232, dimension: "JP", text: "你的手机相册是？",
    optionA: { label: "按类别/时间整理的相册", pole: "J", weight: 1 },
    optionB: { label: "全部堆在一起，需要时才翻", pole: "P", weight: 1 } },
  { id: 233, dimension: "JP", text: "一天的结束时你更倾向？",
    optionA: { label: "回顾今天完成的事情，列明天的计划", pole: "J", weight: 1 },
    optionB: { label: "随意放松，明天的事明天再说", pole: "P", weight: 1 } },
  { id: 234, dimension: "JP", text: "你觉得什么最让你有安全感？",
    optionA: { label: "清晰的计划和可预见的未来", pole: "J", weight: 1 },
    optionB: { label: "拥有灵活选择的自由", pole: "P", weight: 1 } },
  { id: 235, dimension: "JP", text: "开会时你更喜欢？",
    optionA: { label: "有明确议程，按计划推进，准时结束", pole: "J", weight: 1 },
    optionB: { label: "灵活讨论，有价值的话题可以深入展开", pole: "P", weight: 1 } },
  { id: 236, dimension: "JP", text: "你对「多任务并行」的态度？",
    optionA: { label: "不太喜欢，更愿意一件一件有序完成", pole: "J", weight: 1 },
    optionB: { label: "很自然，同时处理几件事更有活力", pole: "P", weight: 1 } },
];

// ============================================================
// Test Mode Configuration
// ============================================================

export type MBTITestMode = "quick" | "standard" | "full";

export const MBTI_TEST_MODES: { id: MBTITestMode; label: string; sublabel: string; questionCount: number; timeEstimate: string }[] = [
  { id: "quick", label: "快速模式", sublabel: "适合时间紧张", questionCount: 24, timeEstimate: "3分钟" },
  { id: "standard", label: "标准模式", sublabel: "推荐", questionCount: 48, timeEstimate: "8分钟" },
  { id: "full", label: "完整模式", sublabel: "最精准", questionCount: 93, timeEstimate: "15分钟" },
];

export function getQuestionsForMode(mode: MBTITestMode): MBTIQuestion[] {
  switch (mode) {
    case "quick":
      return MBTI_QUESTIONS;
    case "standard":
      return [...MBTI_QUESTIONS, ...MBTI_STANDARD_QUESTIONS];
    case "full":
      return [...MBTI_QUESTIONS, ...MBTI_STANDARD_QUESTIONS, ...MBTI_FULL_QUESTIONS];
  }
}

// ============================================================
// Detailed Type Reports
// ============================================================

export interface MBTIDetailedReport {
  nickname: string;
  description: string;
  cognitiveStack: string[];
  strengths: string[];
  weaknesses: string[];
  communicationStyle: string;
  conflictStyle: string;
  idealEnvironment: string;
  stressResponse: string;
  growthAdvice: string[];
  famousExamples: string[];
  // ---- Enhanced fields ----
  loveLanguage: string;
  decisionMakingStyle: string;
  socialIntelligence: string;
  careerSuggestions: string[];
  compatibleTypes: string[];
  challengingTypes: string[];
  hiddenDepth: string;
  motivationDriver: string;
  blindSpotWarning: string;
}

export const MBTI_DETAILED_REPORTS: Record<string, MBTIDetailedReport> = {
  INTJ: {
    nickname: "策略家",
    description: "独立、有远见的战略思想家，善于将复杂的想法转化为可执行的计划。你的头脑像一台精密的战略计算机，总在寻找最优解。",
    cognitiveStack: ["主导: Ni（内倾直觉）— 深度洞察与远见", "辅助: Te（外倾思考）— 系统化执行", "第三: Fi（内倾情感）— 内在价值判断", "劣势: Se（外倾感觉）— 当下感知"],
    strengths: ["战略规划能力卓越", "独立思考，不随波逐流", "高标准和高执行力", "善于在复杂系统中找到规律"],
    weaknesses: ["可能显得过于冷漠和苛刻", "不擅长处理他人的情绪需求", "过度追求完美可能导致拖延", "在社交场合可能显得格格不入"],
    communicationStyle: "简洁直接、重逻辑和结构，不喜欢闲聊和冗余信息。更喜欢深度对话而非社交寒暄。",
    conflictStyle: "倾向于用逻辑和证据说服对方，面对无理取闹会选择冷处理。不怕冲突但不会刻意挑起。",
    idealEnvironment: "独立自主、有挑战性的工作环境，重视能力而非资历，有清晰的目标和衡量标准。",
    stressResponse: "压力下可能变得过度控制、苛刻或退缩到自己的世界。极端时可能沉溺于感官刺激（Se grip）。",
    growthAdvice: ["学习更好地表达情感和关心", "允许不完美，接受「足够好」也是好的", "在决策中适当考虑他人感受", "培养耐心，不是所有人都能像你一样快速理解复杂概念"],
    famousExamples: ["伊隆·马斯克", "马克·扎克伯格", "尼古拉·特斯拉", "克里斯托弗·诺兰"],
    loveLanguage: "用行动证明爱，为伴侣制定详细计划和方案来解决问题。期望对方尊重你的独立空间和智识深度。不擅长甜言蜜语，但会用长远规划表达承诺。",
    decisionMakingStyle: "系统性分析型——收集数据、建立框架、评估长期后果。决策速度快但谨慎，一旦决定很少动摇。可能忽略决策对他人情感的影响。",
    socialIntelligence: "能精准读懂他人的真实意图和隐藏动机，但可能不知道（或不在意）如何做出恰当的情感回应。在一对一深度交流中表现远强于群体社交。",
    careerSuggestions: ["战略咨询顾问", "系统架构师", "投资分析师", "科学研究员", "创业公司CEO", "产品战略总监"],
    compatibleTypes: ["ENFP", "ENTP", "INFJ", "ENTJ"],
    challengingTypes: ["ESFP", "ESFJ", "ISFP"],
    hiddenDepth: "表面冷静的INTJ内心其实有着强烈的理想主义和对世界的深层关怀。他们的「冷漠」往往是因为把情感能量集中在了真正重要的少数人和事上。当INTJ真正信任你时，你会看到一个极度忠诚、深情且富有幽默感的灵魂。",
    motivationDriver: "追求掌控和卓越——不是为了权力本身，而是因为相信自己能看到更优的解决方案。内心深处渴望让世界变得更合理、更高效。",
    blindSpotWarning: "你最大的盲点是「效率至上」的思维方式——不是所有问题都需要最优解，有时候过程本身比结果更重要。你可能会因为过度优化而错过生活中那些「低效但美好」的时刻。",
  },
  INTP: {
    nickname: "逻辑学家",
    description: "创新的思考者，对知识充满渴望，擅长分析和理论构建。你的大脑是一个永不停歇的理论实验室。",
    cognitiveStack: ["主导: Ti（内倾思考）— 深度逻辑分析", "辅助: Ne（外倾直觉）— 可能性探索", "第三: Si（内倾感觉）— 经验对比", "劣势: Fe（外倾情感）— 社交协调"],
    strengths: ["逻辑分析能力极强", "创新思维和发散联想", "对知识有无穷的好奇心", "善于发现系统中的漏洞"],
    weaknesses: ["可能过于理论化，脱离实际", "社交互动中可能显得笨拙", "难以坚持执行长期计划", "可能忽视他人的情感需求"],
    communicationStyle: "精确且注重逻辑，喜欢深度探讨，可能会纠正他人的逻辑错误。容易陷入长篇大论。",
    conflictStyle: "用逻辑分析来处理冲突，可能会质疑对方论点的逻辑基础。避免情绪化对抗。",
    idealEnvironment: "自由宽松、鼓励创新的环境，有足够的时间深入思考，不需要大量社交应酬。",
    stressResponse: "压力下可能变得过度批判、退缩或突然情绪爆发（Fe grip）。",
    growthAdvice: ["学会将想法转化为行动", "培养情感表达能力", "关注实际执行而非仅停留在理论", "建立规律的生活习惯"],
    famousExamples: ["爱因斯坦", "比尔·盖茨", "亚里士多德", "拉里·佩奇"],
    loveLanguage: "通过分享知识和有趣的想法来表达爱意。需要大量独处空间，但当真正投入时会为伴侣构建精密的理论来解决关系问题。",
    decisionMakingStyle: "内在逻辑框架型——先建立理论模型，再验证是否符合逻辑一致性。可能花大量时间分析但迟迟不行动。",
    socialIntelligence: "善于理解复杂的人际关系动态，但往往是从理论层面理解而非情感层面。可能会「知道」该怎么做但做不出来。",
    careerSuggestions: ["软件工程师", "数据科学家", "大学教授", "哲学研究者", "独立游戏设计师", "技术架构师"],
    compatibleTypes: ["ENTJ", "ENFJ", "INFJ", "INTJ"],
    challengingTypes: ["ESFJ", "ESTJ", "ISFJ"],
    hiddenDepth: "看似漫不经心的INTP实际上对世界有着深刻的好奇和关怀。他们的「不在乎」表象下是一个不断追问「为什么」的灵魂。当他们愿意和你分享自己的理论体系时，说明你已经进入了他们极度私密的内心世界。",
    motivationDriver: "对真理的纯粹追求——不是为了实用，而是因为「理解本身」就是最大的奖赏。讨厌不一致和不合逻辑。",
    blindSpotWarning: "你最大的盲点是低估了情感在决策和人际中的实际作用。你可能觉得「逻辑正确就够了」，但人际关系中，被理解的感觉比被分析更重要。",
  },
  ENTJ: {
    nickname: "指挥官", description: "果断的领导者，善于组织和推动目标实现。",
    cognitiveStack: ["主导: Te — 系统化组织", "辅助: Ni — 战略远见", "第三: Se — 行动执行", "劣势: Fi — 内在情感"],
    strengths: ["天生的领导力", "高效的目标执行", "战略规划出色", "善于激励团队"],
    weaknesses: ["可能过于强势", "容易忽视他人感受", "有时不够耐心", "可能独断专行"],
    communicationStyle: "直接、有力、结果导向，善于在会议中主导讨论和推动决策。",
    conflictStyle: "直面冲突，用权威和逻辑压制对方，追求快速解决。",
    idealEnvironment: "有挑战性的领导角色，明确的目标体系，能发挥决策权的环境。",
    stressResponse: "压力下可能过度控制或变得异常情绪化。",
    growthAdvice: ["学会倾听和示弱", "重视过程而非只看结果", "给他人更多发挥空间", "关注内在情感世界"],
    famousExamples: ["史蒂夫·乔布斯", "拿破仑", "马云", "撒切尔夫人"],
    loveLanguage: "用实际行动和未来规划表达爱意，为伴侣创造最优条件。可能把关系当项目管理，需学会浪漫和柔软。",
    decisionMakingStyle: "快速果断型——收集关键信息后迅速决策，注重效率和结果。相信自己的判断力，很少犹豫不决。",
    socialIntelligence: "天生理解权力动态和组织政治，善于在群体中建立影响力。但可能忽视不在权力等式中的人的感受。",
    careerSuggestions: ["企业CEO", "管理咨询", "投资银行", "律所合伙人", "创业者", "军事指挥官"],
    compatibleTypes: ["INTP", "INFP", "ISTP", "ENFP"],
    challengingTypes: ["ISFP", "INFP", "ISFJ"],
    hiddenDepth: "ENTJ的强势外表下隐藏着一个极度忠诚且愿意为重要的人付出一切的灵魂。他们的「控制欲」本质上是对混乱的恐惧和对保护所爱之人的深层驱动。",
    motivationDriver: "对卓越和影响力的追求——相信自己能改变现状，让事情变得更好。无法忍受低效和平庸。",
    blindSpotWarning: "你最大的盲点是把「有效」等同于「正确」。有时候最有效的做法并不是最人性化的做法，而人际关系中，被尊重的感觉比被管理更重要。",
  },
  ENTP: {
    nickname: "辩论家", description: "聪明好辩的创新者，喜欢挑战现状和探索新可能性。",
    cognitiveStack: ["主导: Ne — 可能性探索", "辅助: Ti — 逻辑分析", "第三: Fe — 社交魅力", "劣势: Si — 细节和常规"],
    strengths: ["创新思维极强", "辩论和说服能力出众", "适应力强", "善于发现机遇"],
    weaknesses: ["容易三分钟热度", "可能忽视他人感受", "不擅长细节执行", "有时过于挑衅"],
    communicationStyle: "机智幽默、善于辩论，喜欢从不同角度挑战观点。",
    conflictStyle: "享受智力对抗，善于找到对方逻辑漏洞。",
    idealEnvironment: "创业或创新型环境，有新挑战、不重复、能发挥创意。",
    stressResponse: "压力下可能变得偏执或过度沉溺于日常细节。",
    growthAdvice: ["学会坚持和深入", "将创意转化为可执行方案", "培养同理心", "关注细节和收尾"],
    famousExamples: ["本杰明·富兰克林", "马克·吐温", "罗伯特·唐尼Jr", "奥巴马"],
    loveLanguage: "通过智力刺激和新奇体验表达爱。喜欢和伴侣辩论、探索新事物。可能把调侃当作亲密的方式，需注意对方是否能接受。",
    decisionMakingStyle: "发散探索型——考虑所有可能性后才做决定，过程中不断质疑和修改。可能因为看到太多选项而延迟决策。",
    socialIntelligence: "极其善于读懂社交场合的潜规则并利用魅力影响他人。但有时会为了智力刺激而忽略社交分寸。",
    careerSuggestions: ["创业者", "产品经理", "律师", "咨询顾问", "记者", "风险投资人"],
    compatibleTypes: ["INTJ", "INFJ", "ENTJ", "INTP"],
    challengingTypes: ["ISFJ", "ISTJ", "ESFJ"],
    hiddenDepth: "ENTP的「不认真」表象下是一个对世界充满好奇和热忱的灵魂。他们挑战你不是因为不尊重你，而是因为他们相信通过辩论可以找到更好的答案。",
    motivationDriver: "对新可能性的探索——世界上永远有更好的方案没被发现。无法忍受思维的停滞和教条。",
    blindSpotWarning: "你最大的盲点是把「有趣」看得比「有用」更重要。你可能花大量精力探索新想法，却很少把它们变成现实。完成一件事比开始十件事更有价值。",
  },
  INFJ: {
    nickname: "提倡者", description: "安静而有洞察力的理想主义者，致力于帮助他人实现潜力。",
    cognitiveStack: ["主导: Ni — 深度洞察", "辅助: Fe — 关怀协调", "第三: Ti — 内在逻辑", "劣势: Se — 当下体验"],
    strengths: ["极强的洞察力和共情能力", "富有远见和使命感", "善于理解他人动机", "坚持原则"],
    weaknesses: ["过于理想化", "容易耗尽情感能量", "对批评敏感", "可能回避冲突"],
    communicationStyle: "温和而有深度，善于一对一深入交流，不喜欢肤浅的社交。",
    conflictStyle: "先回避后调解，倾向于寻求双赢方案。",
    idealEnvironment: "有意义的工作，能帮助他人成长，重视深度关系。",
    stressResponse: "压力下可能过度沉溺于感官刺激或变得过度批判。",
    growthAdvice: ["学会设定情感边界", "接受不完美的现实", "发展逻辑决策能力", "关注当下而非只看远方"],
    famousExamples: ["甘地", "马丁·路德·金", "列夫·托尔斯泰", "尼尔森·曼德拉"],
    loveLanguage: "通过深度理解和精神共鸣表达爱。为伴侣创造有意义的体验，在意灵魂层面的连接而非表面形式。",
    decisionMakingStyle: "直觉先导型——先有强烈的直觉判断，再用逻辑验证。决策常常看似突然但实际经过长时间潜意识加工。",
    socialIntelligence: "天生的人心读取器——能感知他人未说出口的情绪和需求。但可能因为过度共情而承受过多情感负担。",
    careerSuggestions: ["心理咨询师", "作家", "教育工作者", "非营利组织领导", "UX研究员", "人力资源发展"],
    compatibleTypes: ["ENFP", "ENTP", "INTJ", "INFP"],
    challengingTypes: ["ESTP", "ESFP", "ESTJ"],
    hiddenDepth: "INFJ是最矛盾的人格类型——他们渴望被理解却又害怕被看透。表面的温和下是钢铁般的意志，一旦触及核心价值观，他们会展现出令人惊讶的坚定。",
    motivationDriver: "对意义的追求——做的每件事都必须有更深层的目的。无法忍受浮于表面的生活和关系。",
    blindSpotWarning: "你最大的盲点是「救世主情结」——你可能会把帮助他人变成自我牺牲，忘记了你自己也需要被关心。学会说「这不是我的责任」是成长的关键一步。",
  },
  INFP: {
    nickname: "调停者", description: "富有想象力的理想主义者，内心充满热情和对美好事物的追求。",
    cognitiveStack: ["主导: Fi — 内在价值", "辅助: Ne — 可能性", "第三: Si — 记忆", "劣势: Te — 外在组织"],
    strengths: ["深度的价值观和真诚", "创造力和想象力丰富", "强烈的同理心", "善于理解人性"],
    weaknesses: ["可能过于理想化", "在现实执行上有困难", "对批评过于敏感", "决策犹豫不决"],
    communicationStyle: "真诚而富有诗意，喜欢深度话题，避免表面化交流。",
    conflictStyle: "强烈回避冲突，但触及核心价值观时会异常坚定。",
    idealEnvironment: "能表达创意、有意义感、尊重个性的环境。",
    stressResponse: "压力下可能变得过度批判或沉溺于细节。",
    growthAdvice: ["培养行动力和执行力", "学会接受建设性批评", "在理想和现实间找到平衡", "发展组织和规划能力"],
    famousExamples: ["莎士比亚", "托尔金", "威廉·华兹华斯", "海伦·凯勒"],
    loveLanguage: "用文字、创意和深层理解表达爱。渴望灵魂伴侣式的连接，对关系有很高的理想化期待。需要学会接受真实而非完美的关系。",
    decisionMakingStyle: "价值导向型——决策基于内心的价值观和直觉感受。可能在理性分析和情感判断之间挣扎，导致犹豫不决。",
    socialIntelligence: "对他人的情感有极其敏锐的感知力，但可能因为过度敏感而误读中性信号为负面信号。在亲密关系中表现远强于社交场合。",
    careerSuggestions: ["作家/编剧", "心理咨询师", "平面设计师", "社会工作者", "音乐家", "独立创作者"],
    compatibleTypes: ["ENFJ", "ENTJ", "INFJ", "ENFP"],
    challengingTypes: ["ESTJ", "ESTP", "ISTJ"],
    hiddenDepth: "INFP看似柔弱但拥有所有人格类型中最坚韧的内核——当核心价值观受到威胁时，他们会展现出不可思议的勇气。他们的「逃避」不是懦弱，而是在等待值得全力以赴的时刻。",
    motivationDriver: "对真善美的追求——相信世界可以更好，每个人都值得被理解。无法忍受虚伪和不公正。",
    blindSpotWarning: "你最大的盲点是把「理想」和「现实」对立。你可能因为现实不够完美而选择逃避，但真正的成长来自于在不完美的世界中创造美好。行动比完美的想法更有价值。",
  },
  ENFJ: {
    nickname: "主人公", description: "富有魅力的领导者，善于激励他人并推动积极变化。",
    cognitiveStack: ["主导: Fe — 社交协调", "辅助: Ni — 远见", "第三: Se — 行动", "劣势: Ti — 内在逻辑"],
    strengths: ["卓越的人际影响力", "善于激励和凝聚团队", "同理心极强", "有远见和使命感"],
    weaknesses: ["可能过度取悦他人", "忽视自身需求", "对批评敏感", "可能控制欲过强"],
    communicationStyle: "温暖而有感染力，善于在群体中营造积极氛围。",
    conflictStyle: "善于调解，但可能过度迁就。",
    idealEnvironment: "团队领导角色，能帮助他人成长和发展。",
    stressResponse: "压力下可能过度分析或变得过于批判。",
    growthAdvice: ["学会关注自身需求", "接受不是所有人都需要你的帮助", "培养客观分析能力", "允许他人自己解决问题"],
    famousExamples: ["奥普拉", "巴拉克·奥巴马", "马丁·路德·金", "孔子"],
    loveLanguage: "通过无微不至的关心和对伴侣潜力的激发来表达爱。会主动为关系创造深度和意义，但需注意不要把「帮助」变成「改造」。",
    decisionMakingStyle: "共识驱动型——在做重大决定前会考虑对所有相关人的影响。善于在价值观和现实之间找到平衡点。",
    socialIntelligence: "社交智商天花板——能在任何场合营造积极氛围，让每个人都感到被重视。但可能因为过度关注他人而忽略了自己的真实感受。",
    careerSuggestions: ["培训师/教练", "人力资源总监", "心理治疗师", "非营利组织领导", "教育管理者", "公关总监"],
    compatibleTypes: ["INFP", "INTP", "ISFP", "INFJ"],
    challengingTypes: ["ISTP", "ESTP", "ISTJ"],
    hiddenDepth: "ENFJ温暖的外表下是一个有着强烈使命感的灵魂。他们的「热情」不是表演，而是真正相信每个人都可以变得更好。但他们很少让人看到自己脆弱的一面。",
    motivationDriver: "帮助他人成长和实现潜力——看到自己的影响力产生积极改变是最大的满足感。无法忍受看到有人被埋没或不公平对待。",
    blindSpotWarning: "你最大的盲点是把「被需要」等同于「被爱」。你可能通过不断帮助他人来获得价值感，但这可能让你失去自我。学会独处和照顾自己，不需要拯救任何人你也值得被爱。",
  },
  ENFP: {
    nickname: "竞选者", description: "热情洋溢的创意者，善于发现可能性并激励他人。",
    cognitiveStack: ["主导: Ne — 可能性", "辅助: Fi — 价值观", "第三: Te — 组织", "劣势: Si — 细节"],
    strengths: ["创造力和热情", "善于鼓舞他人", "适应力极强", "人际关系广泛"],
    weaknesses: ["难以集中精力", "容易三分钟热度", "不擅长细节", "可能过于理想化"],
    communicationStyle: "热情、发散、富有感染力，善于讲故事和制造共鸣。",
    conflictStyle: "倾向于正面沟通但情绪化，追求和解。",
    idealEnvironment: "创意自由、人际丰富、有新鲜感的环境。",
    stressResponse: "压力下可能变得过度沉溺于细节或身体不适。",
    growthAdvice: ["培养专注力和完成度", "建立规律的习惯", "学会筛选优先级", "将热情转化为持续的行动"],
    famousExamples: ["罗宾·威廉姆斯", "威尔·史密斯", "马克·吐温", "罗伯特·唐尼Jr"],
    loveLanguage: "用热情、惊喜和深层情感连接表达爱。渴望和伴侣一起探索世界和内心。可能在新鲜感消退后需要有意识地维护关系深度。",
    decisionMakingStyle: "直觉加价值观型——先跟着感觉走，再用价值观检验。决策过程充满热情但可能缺乏系统性，容易被新想法分散。",
    socialIntelligence: "天生的连接者——能在不同人群间建立桥梁，让陌生人迅速感到亲切。但可能因为太「活跃」而让内向者感到压力。",
    careerSuggestions: ["创意总监", "品牌策划", "记者/主持人", "创业者", "培训讲师", "社区运营"],
    compatibleTypes: ["INTJ", "INFJ", "ENTJ", "INTP"],
    challengingTypes: ["ISTJ", "ESTJ", "ISFJ"],
    hiddenDepth: "ENFP的阳光外表下其实有着很深的内在世界。他们不仅仅是「有趣的人」，更是对人性和意义有深刻思考的灵魂。当他们安静下来时，你会发现一个令人惊讶的深度。",
    motivationDriver: "对可能性和真实连接的追求——相信生活应该是一场有意义的冒险。无法忍受被束缚和失去自由。",
    blindSpotWarning: "你最大的盲点是「广度优于深度」的倾向。你可能认识一百个人但没有几个真正亲密的关系，开始十个项目但完成不了两个。学会选择并坚持，深度带来的满足感远超广度。",
  },
  ISTJ: {
    nickname: "物流师", description: "可靠而务实的执行者，重视传统和秩序。",
    cognitiveStack: ["主导: Si — 经验记忆", "辅助: Te — 系统执行", "第三: Fi — 内在价值", "劣势: Ne — 可能性"],
    strengths: ["极度可靠和负责", "注重细节和准确性", "强大的执行力", "尊重传统和规则"],
    weaknesses: ["可能过于刻板", "不擅长应对变化", "情感表达不足", "可能抗拒创新"],
    communicationStyle: "精确、务实、简洁，重视事实和数据。",
    conflictStyle: "引用规则和先例来解决问题。",
    idealEnvironment: "结构清晰、规则明确、稳定有序的环境。",
    stressResponse: "压力下可能变得过度焦虑或灾难化思维。",
    growthAdvice: ["学会拥抱变化", "培养灵活性", "尝试新的可能性", "学会表达情感"],
    famousExamples: ["沃伦·巴菲特", "安格拉·默克尔", "乔治·华盛顿"],
    loveLanguage: "通过可靠的行动和长期承诺表达爱。不擅长浪漫的言辞，但会默默为伴侣做很多实际的事情。需要学会偶尔的惊喜和口头表达。",
    decisionMakingStyle: "经验数据型——基于过往经验和已验证的方法做决策。不喜欢冒险和不确定性，偏好有先例可循的方案。",
    socialIntelligence: "在熟悉的社交环境中表现稳定可靠，是朋友圈中的「定海神针」。但在新环境中可能显得保守和拘谨。",
    careerSuggestions: ["会计师/审计师", "项目经理", "军事/警务人员", "质量管理", "法律顾问", "供应链管理"],
    compatibleTypes: ["ESFP", "ESTP", "ISFJ", "ESTJ"],
    challengingTypes: ["ENFP", "ENTP", "INFP"],
    hiddenDepth: "ISTJ的「无聊」外表下是一个有着极度忠诚和深沉爱意的灵魂。他们不说「我爱你」，但会用二十年如一日的陪伴来证明。他们的可靠不是缺乏激情，而是最持久的承诺形式。",
    motivationDriver: "对秩序和责任的坚守——相信做正确的事、遵守承诺是社会运转的基石。无法忍受不负责任和混乱。",
    blindSpotWarning: "你最大的盲点是把「确定性」等同于「安全」。世界在不断变化，过度依赖经验和规则可能让你错过重要的创新机会。有时候，冒一次险比永远安全更值得。",
  },
  ISFJ: {
    nickname: "守卫者", description: "温暖而尽责的保护者，默默关心他人。",
    cognitiveStack: ["主导: Si — 经验", "辅助: Fe — 关怀", "第三: Ti — 分析", "劣势: Ne — 直觉"],
    strengths: ["极度忠诚和关怀", "注重细节", "可靠的支持者", "善于维护和谐"],
    weaknesses: ["可能过度牺牲自我", "抗拒变化", "不善于拒绝", "过于关注他人评价"],
    communicationStyle: "温和、耐心、善于倾听，注重实际帮助。",
    conflictStyle: "强烈回避冲突，优先维护和谐。",
    idealEnvironment: "稳定、和谐、能帮助他人的环境。",
    stressResponse: "压力下可能灾难化思维或情绪崩溃。",
    growthAdvice: ["学会说不", "关注自身需求", "接受变化", "表达自己的真实想法"],
    famousExamples: ["特蕾莎修女", "英国女王伊丽莎白二世"],
    loveLanguage: "通过无微不至的关心和照顾来表达爱。会记住伴侣的所有偏好和重要日期，用行动而非言语证明自己的在乎。",
    decisionMakingStyle: "关怀优先型——考虑决策对身边人的影响后再做选择。倾向于保守和安全的选项，不喜欢改变现状。",
    socialIntelligence: "在亲密关系中极其敏感和体贴，能注意到别人忽略的小细节。但在大型社交场合可能感到不自在。",
    careerSuggestions: ["护士/医疗工作者", "教师", "行政管理", "社会工作者", "图书馆员", "室内设计师"],
    compatibleTypes: ["ESTP", "ESFP", "ISTJ", "ESFJ"],
    challengingTypes: ["ENTP", "ENFP", "INTJ"],
    hiddenDepth: "ISFJ的温柔外表下有着惊人的韧性。他们默默承受的远比任何人知道的多，但很少抱怨。他们的「顺从」不是软弱，而是一种深思熟虑的选择——为了保护重要的人和关系。",
    motivationDriver: "对所爱之人的保护和照顾——在幕后默默付出是他们表达爱的方式。无法忍受看到亲近的人受苦或被忽视。",
    blindSpotWarning: "你最大的盲点是「自我牺牲」——你可能把所有人的需求放在自己前面，直到精疲力竭。记住：照顾好自己不是自私，而是你能持续关爱他人的前提。",
  },
  ESTJ: {
    nickname: "总经理", description: "高效的组织者和管理者。",
    cognitiveStack: ["主导: Te — 组织", "辅助: Si — 经验", "第三: Ne — 直觉", "劣势: Fi — 内在情感"],
    strengths: ["组织能力出色", "决断力强", "责任感强", "重视效率"],
    weaknesses: ["可能过于专断", "不够灵活", "忽视情感", "过于看重规则"],
    communicationStyle: "直接、务实、指令式。",
    conflictStyle: "直面问题，用权威解决。",
    idealEnvironment: "管理角色，有明确的层级和规则。",
    stressResponse: "压力下可能情绪失控或过度敏感。",
    growthAdvice: ["学会倾听不同意见", "关注他人感受", "培养灵活性", "接受不确定性"],
    famousExamples: ["亨利·福特", "希拉里·克林顿"],
    loveLanguage: "通过提供稳定的生活保障和明确的承诺表达爱。可能把关心表现为「管理」和「安排」，需学会柔性表达情感。",
    decisionMakingStyle: "效率优先型——快速分析利弊，选择最有效的方案执行。相信经验和数据，不喜欢模糊不清的选项。",
    socialIntelligence: "在组织和管理场景中如鱼得水，善于建立秩序和权威。但在需要情感细腻的场合可能显得粗糙。",
    careerSuggestions: ["企业管理者", "军队指挥官", "法官", "财务总监", "学校校长", "政府官员"],
    compatibleTypes: ["ISFP", "ISTP", "ISTJ", "ESFJ"],
    challengingTypes: ["INFP", "ENFP", "INFJ"],
    hiddenDepth: "ESTJ的严厉外表下其实有着对秩序和公平的深层热爱。他们「管太多」不是因为控制欲，而是因为他们真心相信规则和结构能保护每一个人。",
    motivationDriver: "对秩序和效率的追求——相信正确的系统和流程能解决大多数问题。无法忍受混乱、低效和不守规矩。",
    blindSpotWarning: "你最大的盲点是认为「对的方式只有一种」。你的高标准和强执行力是优势，但如果不学会尊重不同的做事方式，可能会疏远那些同样优秀但风格不同的人。",
  },
  ESFJ: {
    nickname: "执政官", description: "热心的合作者，善于照顾他人。",
    cognitiveStack: ["主导: Fe — 协调", "辅助: Si — 经验", "第三: Ne — 直觉", "劣势: Ti — 逻辑"],
    strengths: ["社交能力极强", "善于照顾他人", "可靠尽责", "营造和谐氛围"],
    weaknesses: ["过于在意他人评价", "可能牺牲自我", "抗拒变化", "决策可能缺乏客观性"],
    communicationStyle: "热情、关怀、善于营造氛围。",
    conflictStyle: "尽力调和，维护团队和谐。",
    idealEnvironment: "团队协作、关系密切的环境。",
    stressResponse: "压力下可能过度分析或变得尖刻。",
    growthAdvice: ["培养独立判断力", "学会接受批评", "关注自身需求", "发展逻辑分析能力"],
    famousExamples: ["泰勒·斯威夫特", "威廉王子"],
    loveLanguage: "通过精心准备的惊喜、贴心的照顾和社交活动来表达爱。非常重视节日和纪念日，期望伴侣同样重视这些仪式感。",
    decisionMakingStyle: "社会认同型——会参考他人意见和社会规范来做决策。重视和谐与一致，可能为了避免冲突而妥协。",
    socialIntelligence: "社交场合的天然主人——能让每个人都感到舒适和被欢迎。有着敏锐的社交雷达，能迅速察觉氛围变化。",
    careerSuggestions: ["活动策划", "公关专员", "护士", "客户服务经理", "教师", "酒店管理"],
    compatibleTypes: ["ISTP", "ISFP", "ISTJ", "ISFJ"],
    challengingTypes: ["INTP", "INTJ", "ENTP"],
    hiddenDepth: "ESFJ的「社牛」形象背后是一个渴望被真正理解和接纳的灵魂。他们照顾每个人，却很少有人问他们是否还好。他们的「讨好」其实是一种深层的连接渴望。",
    motivationDriver: "创造和谐的人际关系和社交环境——相信社区的力量和人与人之间的连接。无法忍受被排斥和孤立。",
    blindSpotWarning: "你最大的盲点是把「被喜欢」等同于「有价值」。你可能为了维护和谐而压抑自己的真实想法。记住：真正的和谐建立在真诚的基础上，偶尔的不同意见不会毁掉一段关系。",
  },
  ISTP: {
    nickname: "鉴赏家", description: "灵活而务实的问题解决者。",
    cognitiveStack: ["主导: Ti — 分析", "辅助: Se — 体验", "第三: Ni — 直觉", "劣势: Fe — 社交"],
    strengths: ["动手能力强", "冷静沉着", "灵活应变", "善于解决实际问题"],
    weaknesses: ["情感表达不足", "可能过于冒险", "不擅长长期规划", "社交中可能显得冷淡"],
    communicationStyle: "简洁、实际、行动导向。",
    conflictStyle: "冷静分析，必要时直接行动。",
    idealEnvironment: "自由灵活、有实际挑战的环境。",
    stressResponse: "压力下可能情绪爆发或过度沉溺于社交。",
    growthAdvice: ["学会表达情感", "培养长期规划习惯", "重视人际关系", "学会预见后果"],
    famousExamples: ["迈克尔·乔丹", "布鲁斯·李"],
    loveLanguage: "通过一起做事、分享技能和默默陪伴来表达爱。不擅长言语表达但会用实际行动为伴侣解决问题。需要大量个人空间。",
    decisionMakingStyle: "即时分析型——快速评估当前情况，做出最实际的选择。不喜欢过度计划，更相信随机应变。",
    socialIntelligence: "在小圈子中是可靠的「酷人」，但不善于（也不在意）大范围社交。用技能和能力赢得尊重而非社交魅力。",
    careerSuggestions: ["工程师", "飞行员", "外科医生", "数据分析师", "技术专家", "运动员"],
    compatibleTypes: ["ESFJ", "ESTJ", "ENTJ", "ENFJ"],
    challengingTypes: ["ENFJ", "INFJ", "ENFP"],
    hiddenDepth: "ISTP的冷酷外表下是一个对世界充满好奇的探索者。他们的「沉默」不是无话可说，而是在用全部注意力观察和理解周围的一切。当他们开口时，往往一针见血。",
    motivationDriver: "对技能精通和自由的追求——享受理解事物运作方式并亲手解决问题的过程。无法忍受被束缚和无聊。",
    blindSpotWarning: "你最大的盲点是低估了情感连接的重要性。你可能觉得「做了」就等于「表达了」，但亲近的人需要听到你的关心，而不只是看到你修好了漏水的水龙头。",
  },
  ISFP: {
    nickname: "探险家", description: "温和而敏感的艺术家。",
    cognitiveStack: ["主导: Fi — 价值观", "辅助: Se — 体验", "第三: Ni — 直觉", "劣势: Te — 组织"],
    strengths: ["审美敏感度高", "真诚而忠于自我", "适应力强", "善于享受当下"],
    weaknesses: ["决策困难", "回避冲突", "组织能力不足", "对批评敏感"],
    communicationStyle: "温和、含蓄、更喜欢用行动表达。",
    conflictStyle: "强烈回避，退缩或顺从。",
    idealEnvironment: "自由、美感、能表达个性的环境。",
    stressResponse: "压力下可能变得过度批判或控制。",
    growthAdvice: ["培养主动表达能力", "发展组织规划技能", "学会面对冲突", "将创意转化为成果"],
    famousExamples: ["鲍勃·迪伦", "迈克尔·杰克逊", "碧昂丝"],
    loveLanguage: "通过创造美好的共同体验、送手工礼物和安静的陪伴来表达爱。渴望被真正看见和接纳，而不是被要求改变。",
    decisionMakingStyle: "感觉驱动型——跟随内心的感觉和价值观做选择。不喜欢被催促，需要时间感受什么是「对的」。",
    socialIntelligence: "敏感地感知环境中的情绪和美感，但可能因为过于内向而不善于主动社交。在艺术和创意领域更能找到同类。",
    careerSuggestions: ["艺术家/画家", "摄影师", "厨师", "花艺师", "时装设计师", "兽医"],
    compatibleTypes: ["ENFJ", "ESFJ", "ENTJ", "ESTJ"],
    challengingTypes: ["ENTJ", "ESTJ", "INTJ"],
    hiddenDepth: "ISFP安静的外表下是一个对美和真实有着极致追求的灵魂。他们不说大话，但他们创造的东西会无声地震撼你。他们的「随和」不是没有主见，而是选择用作品而非语言说话。",
    motivationDriver: "对真实和美的追求——渴望在生活中创造和体验美好。无法忍受虚假和丑陋。",
    blindSpotWarning: "你最大的盲点是「被动等待」——你可能等待完美的时机、完美的人、完美的灵感，但有时候你需要主动出击。世界不会自动把机会送到你面前，你需要为自己的才华争取舞台。",
  },
  ESTP: {
    nickname: "企业家", description: "精力充沛的行动派。",
    cognitiveStack: ["主导: Se — 行动", "辅助: Ti — 分析", "第三: Fe — 社交", "劣势: Ni — 远见"],
    strengths: ["行动力极强", "善于抓住机遇", "适应力一流", "社交魅力十足"],
    weaknesses: ["缺乏长远规划", "容易冲动", "不擅长深度反思", "可能忽视他人感受"],
    communicationStyle: "直接、幽默、充满活力。",
    conflictStyle: "直面问题，快速解决。",
    idealEnvironment: "快节奏、有挑战、不受过多约束。",
    stressResponse: "压力下可能过度沉思或变得偏执。",
    growthAdvice: ["培养长远视野", "学会深度反思", "三思而后行", "重视承诺和规划"],
    famousExamples: ["唐纳德·特朗普", "厄内斯特·海明威"],
    loveLanguage: "通过刺激的冒险体验、直接的身体接触和慷慨的物质给予来表达爱。喜欢活在当下的关系，可能需要学会为关系投入长期承诺。",
    decisionMakingStyle: "行动优先型——先做再想，相信实践中的调整比完美的计划更有效。决策快速但可能缺乏深思熟虑。",
    socialIntelligence: "天生的社交磁铁——能在任何场合成为焦点，用幽默和魅力征服他人。但可能在深层情感对话中显得不知所措。",
    careerSuggestions: ["销售总监", "创业者", "运动员/教练", "消防员/急救人员", "股票交易员", "餐饮业老板"],
    compatibleTypes: ["ISFJ", "ISTJ", "ESFJ", "ISTP"],
    challengingTypes: ["INFJ", "INFP", "INTJ"],
    hiddenDepth: "ESTP的「大大咧咧」背后其实有着敏锐的观察力和快速的分析能力。他们不是不思考，而是思考的速度快到看起来像没在想。他们的冒险精神来自于对生活的热爱，而非鲁莽。",
    motivationDriver: "对刺激和自由的追求——活在当下，抓住每一个机会。无法忍受无聊和被束缚。",
    blindSpotWarning: "你最大的盲点是「此刻至上」——你可能因为追求当下的刺激而忽略长期后果。你的冒险精神是优势，但如果不学会为未来布局，你可能会发现即使赢了很多场战斗，却输了整场战争。",
  },
  ESFP: {
    nickname: "表演者", description: "热情奔放的表演者，善于营造欢乐氛围。",
    cognitiveStack: ["主导: Se — 体验", "辅助: Fi — 价值观", "第三: Te — 组织", "劣势: Ni — 远见"],
    strengths: ["极具感染力", "善于享受生活", "社交能力强", "适应力出色"],
    weaknesses: ["难以长期坚持", "逃避深度问题", "冲动消费或行动", "不擅长规划"],
    communicationStyle: "热情、生动、善于制造气氛。",
    conflictStyle: "转移注意力或用幽默化解。",
    idealEnvironment: "充满活力、变化多样的环境。",
    stressResponse: "压力下可能过度悲观或沉溺于负面想法。",
    growthAdvice: ["培养深度思考习惯", "学会延迟满足", "关注长期目标", "接受不愉快的现实"],
    famousExamples: ["玛丽莲·梦露", "艾尔顿·约翰", "阿黛尔"],
    loveLanguage: "通过一起玩乐、创造快乐回忆和直接的情感表达来传递爱。是所有类型中最擅长制造浪漫和惊喜的，但可能在关系进入平淡期后感到不安。",
    decisionMakingStyle: "感受驱动型——跟着感觉和当下的能量做决定。决策快速且充满热情，但可能缺乏长期考量。",
    socialIntelligence: "所有类型中最具有社交感染力——能让任何聚会变得有趣。天生理解娱乐和表演的艺术，善于调动他人情绪。",
    careerSuggestions: ["演员/表演者", "活动策划人", "旅行博主", "健身教练", "儿童教育", "时尚买手"],
    compatibleTypes: ["ISTJ", "ISFJ", "INTJ", "ISTP"],
    challengingTypes: ["INTJ", "INFJ", "INTP"],
    hiddenDepth: "ESFP的欢乐表面下其实有着丰富的内在情感世界。他们用欢笑掩盖的，可能是对被真正理解的渴望。当ESFP在你面前安静下来，分享真实的感受时，那是最珍贵的信任。",
    motivationDriver: "对快乐和真实体验的追求——相信人生苦短，应该尽情享受每一刻。无法忍受压抑和虚伪。",
    blindSpotWarning: "你最大的盲点是「快乐至上」——你可能用快乐来逃避需要面对的困难问题。真正的成长有时来自于不舒适的对话和不愉快的决定。学会面对阴影，你的阳光才更有力量。",
  },
};

/** Calculate MBTI result from user answers */
export function calculateMBTI(
  answers: Record<number, "A" | "B">,
  questions?: MBTIQuestion[]
): MBTIResult {
  const qs = questions || MBTI_QUESTIONS;
  const scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };

  for (const q of qs) {
    const answer = answers[q.id];
    if (!answer) continue;
    const option = answer === "A" ? q.optionA : q.optionB;
    scores[option.pole as keyof typeof scores] += option.weight;
  }

  const type =
    (scores.E >= scores.I ? "E" : "I") +
    (scores.S >= scores.N ? "S" : "N") +
    (scores.T >= scores.F ? "T" : "F") +
    (scores.J >= scores.P ? "J" : "P");

  const pct = (a: number, b: number) =>
    a + b === 0 ? 50 : Math.round((a / (a + b)) * 100);

  return {
    type,
    scores,
    percentages: {
      EI: {
        label: scores.E >= scores.I ? "外向 E" : "内向 I",
        value: scores.E >= scores.I ? pct(scores.E, scores.I) : pct(scores.I, scores.E),
      },
      SN: {
        label: scores.S >= scores.N ? "实感 S" : "直觉 N",
        value: scores.S >= scores.N ? pct(scores.S, scores.N) : pct(scores.N, scores.S),
      },
      TF: {
        label: scores.T >= scores.F ? "思考 T" : "情感 F",
        value: scores.T >= scores.F ? pct(scores.T, scores.F) : pct(scores.F, scores.T),
      },
      JP: {
        label: scores.J >= scores.P ? "判断 J" : "知觉 P",
        value: scores.J >= scores.P ? pct(scores.J, scores.P) : pct(scores.P, scores.J),
      },
    },
  };
}

/** All 16 types for the selector */
export const ALL_MBTI_TYPES = Object.keys(MBTI_TYPE_DESCRIPTIONS);
