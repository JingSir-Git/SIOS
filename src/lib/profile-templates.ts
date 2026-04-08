// ============================================================
// Preset Profile Templates — Common Social Relationships
// ============================================================
// Each template provides a starting point for building a profile.
// Dimension values represent the *archetype* for that relationship
// type — individual variance is expected and will be refined through
// actual conversation analysis.
// ============================================================

export interface ProfileTemplate {
  id: string;
  label: string;
  description: string;
  category: string;
  tags: string[];
  dimensions: {
    assertiveness: number;
    cooperativeness: number;
    decisionSpeed: number;
    emotionalStability: number;
    openness: number;
    empathy: number;
    riskTolerance: number;
    formalityLevel: number;
  };
  communicationStyle: {
    overallType: string;
    strengths: string[];
    weaknesses: string[];
    triggerPoints: string[];
    preferredTopics: string[];
  };
  patterns: {
    responseSpeed: string;
    conflictStyle: string;
    decisionStyle: string;
  };
}

export interface TemplateCategory {
  id: string;
  label: string;
  icon: string;
  templates: ProfileTemplate[];
}

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  // ============================================================
  // 职场关系
  // ============================================================
  {
    id: "workplace",
    label: "职场关系",
    icon: "💼",
    templates: [
      {
        id: "boss",
        label: "上司 / 领导",
        description: "管理层级中的直属上级，掌握绩效评估和资源分配权",
        category: "workplace",
        tags: ["上级"],
        dimensions: {
          assertiveness: 72,
          cooperativeness: 55,
          decisionSpeed: 65,
          emotionalStability: 68,
          openness: 50,
          empathy: 45,
          riskTolerance: 55,
          formalityLevel: 70,
        },
        communicationStyle: {
          overallType: "目标导向型管理者",
          strengths: ["决策果断", "全局思维", "结果导向"],
          weaknesses: ["可能忽视下属感受", "沟通有时偏单向"],
          triggerPoints: ["工作延期", "缺乏主动汇报", "推诿责任"],
          preferredTopics: ["项目进展", "团队效率", "业务指标"],
        },
        patterns: {
          responseSpeed: "工作时间回复较快",
          conflictStyle: "直接指出问题",
          decisionStyle: "独立拍板或少量征询",
        },
      },
      {
        id: "colleague",
        label: "同事",
        description: "平级合作伙伴，日常工作中频繁互动",
        category: "workplace",
        tags: ["同事"],
        dimensions: {
          assertiveness: 50,
          cooperativeness: 65,
          decisionSpeed: 50,
          emotionalStability: 58,
          openness: 60,
          empathy: 55,
          riskTolerance: 45,
          formalityLevel: 40,
        },
        communicationStyle: {
          overallType: "合作型沟通者",
          strengths: ["团队协作", "信息共享", "灵活变通"],
          weaknesses: ["边界感可能模糊", "责任划分不清"],
          triggerPoints: ["抢功劳", "甩锅", "不配合"],
          preferredTopics: ["工作分工", "项目进度", "公司动态"],
        },
        patterns: {
          responseSpeed: "工作时间正常回复",
          conflictStyle: "委婉表达异议",
          decisionStyle: "倾向协商一致",
        },
      },
      {
        id: "subordinate",
        label: "下属",
        description: "直接管理的团队成员",
        category: "workplace",
        tags: ["下属"],
        dimensions: {
          assertiveness: 35,
          cooperativeness: 70,
          decisionSpeed: 40,
          emotionalStability: 55,
          openness: 60,
          empathy: 50,
          riskTolerance: 35,
          formalityLevel: 55,
        },
        communicationStyle: {
          overallType: "执行型配合者",
          strengths: ["执行力强", "配合度高", "主动汇报"],
          weaknesses: ["可能缺乏主动性", "过度依赖指令"],
          triggerPoints: ["被质疑能力", "不被重视", "不公平对待"],
          preferredTopics: ["任务优先级", "工作方法", "个人成长"],
        },
        patterns: {
          responseSpeed: "回复较快",
          conflictStyle: "倾向服从或间接表达",
          decisionStyle: "等待指示",
        },
      },
      {
        id: "hr",
        label: "HR / 人事",
        description: "公司人力资源部门对接人",
        category: "workplace",
        tags: ["同事"],
        dimensions: {
          assertiveness: 50,
          cooperativeness: 65,
          decisionSpeed: 50,
          emotionalStability: 70,
          openness: 55,
          empathy: 60,
          riskTolerance: 30,
          formalityLevel: 65,
        },
        communicationStyle: {
          overallType: "制度导向型沟通者",
          strengths: ["专业规范", "善于调解", "信息对称意识强"],
          weaknesses: ["可能过于程式化", "立场偏公司"],
          triggerPoints: ["违反规章制度", "不配合流程"],
          preferredTopics: ["制度政策", "薪酬福利", "职业发展"],
        },
        patterns: {
          responseSpeed: "正常工作时间回复",
          conflictStyle: "制度框架内调解",
          decisionStyle: "需上级审批",
        },
      },
    ],
  },

  // ============================================================
  // 学术关系
  // ============================================================
  {
    id: "academic",
    label: "学术关系",
    icon: "🎓",
    templates: [
      {
        id: "teacher",
        label: "导师 / 老师",
        description: "学术指导者，影响科研方向和学业进展",
        category: "academic",
        tags: ["上级"],
        dimensions: {
          assertiveness: 65,
          cooperativeness: 55,
          decisionSpeed: 55,
          emotionalStability: 65,
          openness: 70,
          empathy: 50,
          riskTolerance: 45,
          formalityLevel: 60,
        },
        communicationStyle: {
          overallType: "学术引导型",
          strengths: ["知识渊博", "逻辑严谨", "善于提问引导"],
          weaknesses: ["要求可能较高", "反馈有时偏严厉"],
          triggerPoints: ["学术不诚信", "缺乏进展", "不认真对待"],
          preferredTopics: ["研究进展", "方法论", "学术前沿"],
        },
        patterns: {
          responseSpeed: "可能延迟回复",
          conflictStyle: "以权威指导为主",
          decisionStyle: "基于学术判断",
        },
      },
      {
        id: "senior-student",
        label: "师兄 / 师姐",
        description: "同实验室或同专业的高年级同学",
        category: "academic",
        tags: ["朋友"],
        dimensions: {
          assertiveness: 45,
          cooperativeness: 70,
          decisionSpeed: 50,
          emotionalStability: 55,
          openness: 65,
          empathy: 65,
          riskTolerance: 50,
          formalityLevel: 30,
        },
        communicationStyle: {
          overallType: "经验分享型",
          strengths: ["乐于分享经验", "理解学弟学妹处境", "实战经验丰富"],
          weaknesses: ["建议可能有局限性", "忙时顾不上"],
          triggerPoints: ["不尊重", "伸手党不思考"],
          preferredTopics: ["科研技巧", "导师相处", "求职经验"],
        },
        patterns: {
          responseSpeed: "空闲时回复",
          conflictStyle: "友好建议",
          decisionStyle: "分享经验供参考",
        },
      },
      {
        id: "junior-student",
        label: "师弟 / 师妹",
        description: "同实验室或同专业的低年级同学",
        category: "academic",
        tags: ["朋友"],
        dimensions: {
          assertiveness: 30,
          cooperativeness: 72,
          decisionSpeed: 40,
          emotionalStability: 48,
          openness: 70,
          empathy: 55,
          riskTolerance: 40,
          formalityLevel: 35,
        },
        communicationStyle: {
          overallType: "求教型学习者",
          strengths: ["虚心好学", "配合度高", "积极主动"],
          weaknesses: ["经验不足", "可能过于依赖"],
          triggerPoints: ["被嘲笑", "得不到回应"],
          preferredTopics: ["学习方法", "入门指导", "生活适应"],
        },
        patterns: {
          responseSpeed: "回复很快",
          conflictStyle: "倾向顺从",
          decisionStyle: "需要指导",
        },
      },
    ],
  },

  // ============================================================
  // 商务关系
  // ============================================================
  {
    id: "business",
    label: "商务关系",
    icon: "🤝",
    templates: [
      {
        id: "client",
        label: "客户",
        description: "需要维护的商业合作对象",
        category: "business",
        tags: ["客户"],
        dimensions: {
          assertiveness: 60,
          cooperativeness: 50,
          decisionSpeed: 50,
          emotionalStability: 60,
          openness: 45,
          empathy: 40,
          riskTolerance: 40,
          formalityLevel: 65,
        },
        communicationStyle: {
          overallType: "价值评估型决策者",
          strengths: ["需求明确", "注重投资回报"],
          weaknesses: ["可能砍价激烈", "决策周期长"],
          triggerPoints: ["交付延期", "质量不达标", "被忽悠"],
          preferredTopics: ["价格", "交付", "质量", "售后"],
        },
        patterns: {
          responseSpeed: "视重要程度而定",
          conflictStyle: "以利益为导向协商",
          decisionStyle: "内部审批流程",
        },
      },
      {
        id: "investor",
        label: "投资人",
        description: "潜在或已有的资金方",
        category: "business",
        tags: ["合作伙伴"],
        dimensions: {
          assertiveness: 70,
          cooperativeness: 50,
          decisionSpeed: 60,
          emotionalStability: 72,
          openness: 65,
          empathy: 40,
          riskTolerance: 65,
          formalityLevel: 60,
        },
        communicationStyle: {
          overallType: "数据驱动型评估者",
          strengths: ["洞察力强", "格局大", "资源丰富"],
          weaknesses: ["可能过于理性", "关注短期回报"],
          triggerPoints: ["数据造假", "团队不稳定", "市场判断失误"],
          preferredTopics: ["数据指标", "商业模式", "团队背景", "竞争格局"],
        },
        patterns: {
          responseSpeed: "忙碌时延迟",
          conflictStyle: "数据说话",
          decisionStyle: "尽调后决策",
        },
      },
      {
        id: "business-partner",
        label: "合作伙伴",
        description: "战略合作方或联合项目伙伴",
        category: "business",
        tags: ["合作伙伴"],
        dimensions: {
          assertiveness: 55,
          cooperativeness: 65,
          decisionSpeed: 50,
          emotionalStability: 60,
          openness: 60,
          empathy: 50,
          riskTolerance: 50,
          formalityLevel: 55,
        },
        communicationStyle: {
          overallType: "共赢型谈判者",
          strengths: ["寻求共赢", "资源互补", "长期思维"],
          weaknesses: ["利益分配可能有分歧", "决策流程复杂"],
          triggerPoints: ["单方面违约", "利益不均", "信息不透明"],
          preferredTopics: ["合作模式", "利益分配", "风险分担"],
        },
        patterns: {
          responseSpeed: "正常回复",
          conflictStyle: "协商解决",
          decisionStyle: "双方协商",
        },
      },
    ],
  },

  // ============================================================
  // 生活关系
  // ============================================================
  {
    id: "life",
    label: "生活关系",
    icon: "💬",
    templates: [
      {
        id: "close-friend",
        label: "好友 / 闺蜜",
        description: "亲密朋友，无话不谈",
        category: "life",
        tags: ["朋友"],
        dimensions: {
          assertiveness: 45,
          cooperativeness: 75,
          decisionSpeed: 55,
          emotionalStability: 50,
          openness: 80,
          empathy: 75,
          riskTolerance: 55,
          formalityLevel: 15,
        },
        communicationStyle: {
          overallType: "高亲密度自由型",
          strengths: ["真诚直接", "情感支持", "互相理解"],
          weaknesses: ["可能过于随意", "边界感弱"],
          triggerPoints: ["背叛信任", "关键时刻缺席", "区别对待"],
          preferredTopics: ["生活琐事", "情感", "吐槽", "八卦"],
        },
        patterns: {
          responseSpeed: "随时回复",
          conflictStyle: "直接表达但会快速和好",
          decisionStyle: "感性决策",
        },
      },
      {
        id: "friend",
        label: "普通朋友",
        description: "关系不错但有一定边界感的朋友",
        category: "life",
        tags: ["朋友"],
        dimensions: {
          assertiveness: 45,
          cooperativeness: 60,
          decisionSpeed: 50,
          emotionalStability: 55,
          openness: 55,
          empathy: 55,
          riskTolerance: 45,
          formalityLevel: 30,
        },
        communicationStyle: {
          overallType: "礼貌随和型",
          strengths: ["尊重边界", "适度关心"],
          weaknesses: ["深层沟通不足", "关系可能停留表面"],
          triggerPoints: ["过度打探隐私", "频繁麻烦"],
          preferredTopics: ["兴趣爱好", "近况分享", "活动邀约"],
        },
        patterns: {
          responseSpeed: "正常回复",
          conflictStyle: "避免冲突",
          decisionStyle: "随大流",
        },
      },
      {
        id: "family-parent",
        label: "父母 / 长辈",
        description: "家庭中的至亲长辈",
        category: "life",
        tags: ["家人"],
        dimensions: {
          assertiveness: 60,
          cooperativeness: 65,
          decisionSpeed: 45,
          emotionalStability: 55,
          openness: 35,
          empathy: 70,
          riskTolerance: 25,
          formalityLevel: 20,
        },
        communicationStyle: {
          overallType: "关怀型保护者",
          strengths: ["无条件关爱", "生活经验丰富", "情感深厚"],
          weaknesses: ["可能过度担忧", "观念可能保守", "唠叨"],
          triggerPoints: ["不报平安", "身体出问题", "花钱大手大脚"],
          preferredTopics: ["健康", "吃饭", "工作", "感情状况"],
        },
        patterns: {
          responseSpeed: "看到就回",
          conflictStyle: "碎碎念式关心",
          decisionStyle: "经验主义",
        },
      },
      {
        id: "family-cousin",
        label: "表亲 / 堂亲",
        description: "关系亲近的同辈亲戚",
        category: "life",
        tags: ["家人"],
        dimensions: {
          assertiveness: 45,
          cooperativeness: 60,
          decisionSpeed: 50,
          emotionalStability: 55,
          openness: 55,
          empathy: 55,
          riskTolerance: 45,
          formalityLevel: 25,
        },
        communicationStyle: {
          overallType: "亲情纽带型",
          strengths: ["共同成长记忆", "家庭归属感"],
          weaknesses: ["可能有攀比心理", "联系频率低"],
          triggerPoints: ["被比较", "被催婚催育"],
          preferredTopics: ["近况更新", "家庭聚会", "童年回忆"],
        },
        patterns: {
          responseSpeed: "不固定",
          conflictStyle: "尽量避免",
          decisionStyle: "各自为主",
        },
      },
      {
        id: "roommate",
        label: "室友",
        description: "合租或宿舍室友",
        category: "life",
        tags: ["朋友"],
        dimensions: {
          assertiveness: 40,
          cooperativeness: 65,
          decisionSpeed: 50,
          emotionalStability: 52,
          openness: 55,
          empathy: 50,
          riskTolerance: 40,
          formalityLevel: 20,
        },
        communicationStyle: {
          overallType: "生活协调型",
          strengths: ["日常协作", "互相照应"],
          weaknesses: ["生活习惯差异", "空间摩擦"],
          triggerPoints: ["不讲卫生", "噪音", "不分摊费用"],
          preferredTopics: ["生活分工", "费用分摊", "日常琐事"],
        },
        patterns: {
          responseSpeed: "随时回复",
          conflictStyle: "能忍则忍 / 被动抗议",
          decisionStyle: "协商分工",
        },
      },
    ],
  },

  // ============================================================
  // 服务关系
  // ============================================================
  {
    id: "service",
    label: "服务关系",
    icon: "🏢",
    templates: [
      {
        id: "doctor",
        label: "医生",
        description: "就医问诊的医疗专业人员",
        category: "service",
        tags: ["其他"],
        dimensions: {
          assertiveness: 60,
          cooperativeness: 60,
          decisionSpeed: 65,
          emotionalStability: 75,
          openness: 50,
          empathy: 55,
          riskTolerance: 30,
          formalityLevel: 65,
        },
        communicationStyle: {
          overallType: "专业权威型",
          strengths: ["专业知识", "诊断能力", "经验丰富"],
          weaknesses: ["时间有限沟通简短", "可能过于技术化"],
          triggerPoints: ["不遵医嘱", "自行诊断", "质疑专业"],
          preferredTopics: ["症状描述", "治疗方案", "注意事项"],
        },
        patterns: {
          responseSpeed: "繁忙时较慢",
          conflictStyle: "专业解释",
          decisionStyle: "基于医学判断",
        },
      },
      {
        id: "lawyer",
        label: "律师",
        description: "法律咨询或代理律师",
        category: "service",
        tags: ["其他"],
        dimensions: {
          assertiveness: 65,
          cooperativeness: 55,
          decisionSpeed: 55,
          emotionalStability: 70,
          openness: 45,
          empathy: 45,
          riskTolerance: 35,
          formalityLevel: 75,
        },
        communicationStyle: {
          overallType: "逻辑严谨型",
          strengths: ["法律专业", "逻辑清晰", "证据意识强"],
          weaknesses: ["可能过于冷静客观", "费用敏感"],
          triggerPoints: ["隐瞒关键事实", "不配合取证"],
          preferredTopics: ["法律条款", "证据收集", "胜算分析"],
        },
        patterns: {
          responseSpeed: "工作时间回复",
          conflictStyle: "法律框架内解决",
          decisionStyle: "基于法律判断",
        },
      },
      {
        id: "landlord",
        label: "房东",
        description: "租房关系中的房屋所有者",
        category: "service",
        tags: ["其他"],
        dimensions: {
          assertiveness: 58,
          cooperativeness: 45,
          decisionSpeed: 50,
          emotionalStability: 55,
          openness: 35,
          empathy: 35,
          riskTolerance: 30,
          formalityLevel: 40,
        },
        communicationStyle: {
          overallType: "利益保护型",
          strengths: ["产权明确", "合同意识"],
          weaknesses: ["可能过于计较", "维修响应慢"],
          triggerPoints: ["拖欠房租", "损坏房屋", "违反合同"],
          preferredTopics: ["租金", "房屋维护", "合同条款"],
        },
        patterns: {
          responseSpeed: "不固定",
          conflictStyle: "以合同为准",
          decisionStyle: "利益最大化",
        },
      },
      {
        id: "interviewer",
        label: "面试官",
        description: "求职过程中的面试评估者",
        category: "service",
        tags: ["其他"],
        dimensions: {
          assertiveness: 60,
          cooperativeness: 55,
          decisionSpeed: 55,
          emotionalStability: 68,
          openness: 60,
          empathy: 45,
          riskTolerance: 40,
          formalityLevel: 65,
        },
        communicationStyle: {
          overallType: "评估筛选型",
          strengths: ["结构化提问", "快速判断", "经验丰富"],
          weaknesses: ["可能有刻板印象", "时间有限"],
          triggerPoints: ["简历造假", "态度敷衍", "缺乏准备"],
          preferredTopics: ["项目经历", "技术能力", "职业规划"],
        },
        patterns: {
          responseSpeed: "面试后统一反馈",
          conflictStyle: "追问验证",
          decisionStyle: "综合评估",
        },
      },
    ],
  },

  // ============================================================
  // 亲密关系
  // ============================================================
  {
    id: "romantic",
    label: "亲密关系",
    icon: "❤️",
    templates: [
      {
        id: "partner",
        label: "恋人 / 伴侣",
        description: "正在交往中的另一半",
        category: "romantic",
        tags: ["恋人"],
        dimensions: {
          assertiveness: 50,
          cooperativeness: 72,
          decisionSpeed: 50,
          emotionalStability: 48,
          openness: 75,
          empathy: 70,
          riskTolerance: 55,
          formalityLevel: 10,
        },
        communicationStyle: {
          overallType: "亲密依附型",
          strengths: ["情感表达丰富", "高度信任", "愿意妥协"],
          weaknesses: ["情绪波动大", "容易感情用事", "可能过度依赖"],
          triggerPoints: ["被忽视", "不忠", "冷暴力", "重要日子忘记"],
          preferredTopics: ["日常分享", "未来规划", "情感需求", "共同兴趣"],
        },
        patterns: {
          responseSpeed: "秒回或期待秒回",
          conflictStyle: "情绪化表达但渴望和解",
          decisionStyle: "希望共同决定",
        },
      },
      {
        id: "spouse",
        label: "配偶",
        description: "已婚的另一半，共同生活的伴侣",
        category: "romantic",
        tags: ["家人"],
        dimensions: {
          assertiveness: 55,
          cooperativeness: 68,
          decisionSpeed: 52,
          emotionalStability: 55,
          openness: 60,
          empathy: 65,
          riskTolerance: 40,
          formalityLevel: 8,
        },
        communicationStyle: {
          overallType: "生活共建型",
          strengths: ["深度了解", "责任感强", "默契配合"],
          weaknesses: ["可能陷入琐事争执", "沟通可能变得敷衍", "习惯性忽视"],
          triggerPoints: ["家务分配不均", "财务分歧", "教育理念冲突", "缺乏尊重"],
          preferredTopics: ["家庭事务", "孩子教育", "财务规划", "生活质量"],
        },
        patterns: {
          responseSpeed: "随时可达",
          conflictStyle: "可能冷战也可能直接争论",
          decisionStyle: "大事协商小事各管",
        },
      },
      {
        id: "ex",
        label: "前任",
        description: "已分手/离婚的前伴侣",
        category: "romantic",
        tags: ["其他"],
        dimensions: {
          assertiveness: 50,
          cooperativeness: 35,
          decisionSpeed: 55,
          emotionalStability: 42,
          openness: 30,
          empathy: 35,
          riskTolerance: 40,
          formalityLevel: 45,
        },
        communicationStyle: {
          overallType: "边界模糊型",
          strengths: ["了解你的过去", "可能保持礼貌"],
          weaknesses: ["旧情绪容易被触发", "沟通目的不明", "可能带有怨气"],
          triggerPoints: ["提及分手原因", "新恋情", "共同社交圈尴尬"],
          preferredTopics: ["事务性沟通", "共同财产", "共同朋友"],
        },
        patterns: {
          responseSpeed: "不固定，视关系状态",
          conflictStyle: "防御性或回避",
          decisionStyle: "各自独立",
        },
      },
      {
        id: "crush",
        label: "暧昧对象",
        description: "正在试探/发展中的潜在恋爱对象",
        category: "romantic",
        tags: ["其他"],
        dimensions: {
          assertiveness: 42,
          cooperativeness: 68,
          decisionSpeed: 35,
          emotionalStability: 45,
          openness: 65,
          empathy: 60,
          riskTolerance: 50,
          formalityLevel: 25,
        },
        communicationStyle: {
          overallType: "试探进取型",
          strengths: ["主动制造话题", "关注对方兴趣", "展现最好一面"],
          weaknesses: ["过度解读信号", "可能不够真实", "患得患失"],
          triggerPoints: ["已读不回", "态度突然冷淡", "发现有竞争者"],
          preferredTopics: ["兴趣爱好", "生活日常", "未来愿景"],
        },
        patterns: {
          responseSpeed: "刻意控制节奏或秒回",
          conflictStyle: "极力避免冲突",
          decisionStyle: "跟随对方节奏",
        },
      },
    ],
  },

  // ============================================================
  // 家庭扩展
  // ============================================================
  {
    id: "family",
    label: "家庭成员",
    icon: "👨‍👩‍👧‍👦",
    templates: [
      {
        id: "sibling",
        label: "兄弟姐妹",
        description: "亲兄弟姐妹，从小一起成长",
        category: "family",
        tags: ["家人"],
        dimensions: {
          assertiveness: 50,
          cooperativeness: 62,
          decisionSpeed: 50,
          emotionalStability: 52,
          openness: 65,
          empathy: 60,
          riskTolerance: 50,
          formalityLevel: 10,
        },
        communicationStyle: {
          overallType: "亲情直白型",
          strengths: ["无需伪装", "共同成长记忆", "深层理解"],
          weaknesses: ["说话可能太直", "童年竞争阴影", "容易翻旧账"],
          triggerPoints: ["父母偏心", "被比较", "不帮忙却指手画脚"],
          preferredTopics: ["家庭事务", "父母健康", "各自近况", "童年回忆"],
        },
        patterns: {
          responseSpeed: "不固定但紧急事必回",
          conflictStyle: "吵完就好",
          decisionStyle: "各自独立但大事商量",
        },
      },
      {
        id: "in-law",
        label: "公婆 / 岳父母",
        description: "配偶的父母，需要维护的长辈关系",
        category: "family",
        tags: ["家人"],
        dimensions: {
          assertiveness: 55,
          cooperativeness: 50,
          decisionSpeed: 45,
          emotionalStability: 52,
          openness: 30,
          empathy: 45,
          riskTolerance: 20,
          formalityLevel: 50,
        },
        communicationStyle: {
          overallType: "审视关怀型",
          strengths: ["对家庭有责任心", "生活经验丰富"],
          weaknesses: ["可能有控制欲", "代际观念冲突", "边界感弱"],
          triggerPoints: ["觉得子女受委屈", "不被尊重", "教育理念不同"],
          preferredTopics: ["家庭和谐", "孙辈教育", "节日安排", "健康养生"],
        },
        patterns: {
          responseSpeed: "看到就回",
          conflictStyle: "通过配偶间接表达",
          decisionStyle: "传统经验为主",
        },
      },
      {
        id: "child",
        label: "子女（青少年）",
        description: "正在成长中的孩子，青春期阶段",
        category: "family",
        tags: ["家人"],
        dimensions: {
          assertiveness: 45,
          cooperativeness: 40,
          decisionSpeed: 55,
          emotionalStability: 38,
          openness: 60,
          empathy: 45,
          riskTolerance: 65,
          formalityLevel: 8,
        },
        communicationStyle: {
          overallType: "独立探索型",
          strengths: ["思维活跃", "信息获取能力强", "创造力丰富"],
          weaknesses: ["情绪不稳", "叛逆抗拒", "沟通意愿低"],
          triggerPoints: ["被说教", "被控制", "不被信任", "拿别人家孩子比较"],
          preferredTopics: ["兴趣爱好", "朋友圈", "电子产品", "自由空间"],
        },
        patterns: {
          responseSpeed: "看心情",
          conflictStyle: "沉默或激烈反驳",
          decisionStyle: "渴望自主",
        },
      },
      {
        id: "grandparent",
        label: "祖父母 / 外祖父母",
        description: "年迈的祖辈长者",
        category: "family",
        tags: ["家人"],
        dimensions: {
          assertiveness: 40,
          cooperativeness: 70,
          decisionSpeed: 35,
          emotionalStability: 58,
          openness: 25,
          empathy: 75,
          riskTolerance: 15,
          formalityLevel: 15,
        },
        communicationStyle: {
          overallType: "慈爱守护型",
          strengths: ["无条件包容", "人生智慧", "情感温暖"],
          weaknesses: ["跟不上时代", "健忘", "过度溺爱"],
          triggerPoints: ["不来看望", "嫌弃唠叨", "不吃东西"],
          preferredTopics: ["身体健康", "吃饭没", "什么时候回家", "往事回忆"],
        },
        patterns: {
          responseSpeed: "不太会用手机",
          conflictStyle: "不跟晚辈计较",
          decisionStyle: "依赖子女决定",
        },
      },
    ],
  },

  // ============================================================
  // 社交 / 网络关系
  // ============================================================
  {
    id: "social",
    label: "社交网络",
    icon: "🌐",
    templates: [
      {
        id: "online-friend",
        label: "网友",
        description: "通过线上认识、未线下深交的朋友",
        category: "social",
        tags: ["朋友"],
        dimensions: {
          assertiveness: 45,
          cooperativeness: 55,
          decisionSpeed: 50,
          emotionalStability: 52,
          openness: 68,
          empathy: 50,
          riskTolerance: 55,
          formalityLevel: 20,
        },
        communicationStyle: {
          overallType: "虚拟社交型",
          strengths: ["兴趣高度匹配", "无社会压力", "表达更自由"],
          weaknesses: ["了解片面", "信任基础薄弱", "可能人设与真实不符"],
          triggerPoints: ["暴露隐私", "借钱", "突然消失"],
          preferredTopics: ["共同兴趣", "网络热点", "游戏/追剧", "情感倾诉"],
        },
        patterns: {
          responseSpeed: "在线时秒回",
          conflictStyle: "拉黑或冷处理",
          decisionStyle: "各自独立",
        },
      },
      {
        id: "community-leader",
        label: "社群群主 / KOL",
        description: "线上社群的管理者或意见领袖",
        category: "social",
        tags: ["其他"],
        dimensions: {
          assertiveness: 65,
          cooperativeness: 58,
          decisionSpeed: 60,
          emotionalStability: 62,
          openness: 70,
          empathy: 50,
          riskTolerance: 55,
          formalityLevel: 35,
        },
        communicationStyle: {
          overallType: "影响力驱动型",
          strengths: ["话题引导力", "资源整合", "个人品牌意识强"],
          weaknesses: ["可能自我中心", "商业化倾向", "精力有限"],
          triggerPoints: ["质疑权威", "捣乱群秩序", "白嫖"],
          preferredTopics: ["行业见解", "资源分享", "社群活动"],
        },
        patterns: {
          responseSpeed: "选择性回复",
          conflictStyle: "权威管理",
          decisionStyle: "独立决策",
        },
      },
      {
        id: "neighbor",
        label: "邻居",
        description: "住所附近的邻里关系",
        category: "social",
        tags: ["其他"],
        dimensions: {
          assertiveness: 42,
          cooperativeness: 55,
          decisionSpeed: 45,
          emotionalStability: 58,
          openness: 35,
          empathy: 45,
          riskTolerance: 25,
          formalityLevel: 40,
        },
        communicationStyle: {
          overallType: "维持距离型",
          strengths: ["互相帮忙", "守望相助"],
          weaknesses: ["了解有限", "可能产生噪音/停车等摩擦"],
          triggerPoints: ["噪音扰民", "公共区域占用", "宠物问题"],
          preferredTopics: ["物业通知", "快递代收", "小区事务"],
        },
        patterns: {
          responseSpeed: "见面时沟通",
          conflictStyle: "能忍则忍或找物业",
          decisionStyle: "各管各的",
        },
      },
    ],
  },
];

/** Flatten all templates into a single array */
export function getAllTemplates(): ProfileTemplate[] {
  return TEMPLATE_CATEGORIES.flatMap((cat) => cat.templates);
}

/** Get template by id */
export function getTemplateById(id: string): ProfileTemplate | undefined {
  return getAllTemplates().find((t) => t.id === id);
}
