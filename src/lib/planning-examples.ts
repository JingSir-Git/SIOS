// ============================================================
// Planning Preset Scenarios — Multi-Scale Life & Work Planner
// ============================================================

export interface PlanningExample {
  id: string;
  label: string;
  description: string;
  category: string;
  domain: string;
  timeScale: string;
  objective: string;
  context: string;
  constraints?: string;
  preferences?: string;
}

export interface PlanningExampleCategory {
  id: string;
  label: string;
  icon: string;
  examples: PlanningExample[];
}

export const PLANNING_EXAMPLE_CATEGORIES: PlanningExampleCategory[] = [
  // ============================================================
  // 日常事务
  // ============================================================
  {
    id: "daily",
    label: "日常事务",
    icon: "📋",
    examples: [
      {
        id: "plan-daily-move",
        label: "搬家行程规划",
        description: "一天之内完成跨城搬家的详细安排",
        category: "daily",
        domain: "daily",
        timeScale: "hours",
        objective: "在一天之内从北京朝阳区搬到海淀区的新租房，所有物品安全转移并基本归位",
        context: "目前住在朝阳区一居室，新房在海淀区两居室。物品不算多，大件有一张床、一个衣柜、一个书桌、两个书架。小件大概15个箱子。新房距离旧房开车约40分钟。已经预约了搬家公司明天早上8点到。需要在当天完成水电燃气的过户手续。",
        constraints: "搬家公司只到下午5点，新房物业要求搬家走货梯且需提前报备",
      },
      {
        id: "plan-daily-event",
        label: "公司年会策划",
        description: "两周内策划一场200人规模的公司年会",
        category: "daily",
        domain: "daily",
        timeScale: "weeks",
        objective: "策划并执行一场200人规模的公司年会，预算8万元以内，包含晚宴、节目表演和抽奖环节",
        context: "公司约200人，年会定在三周后的周六晚上。老板希望今年有创意，不要千篇一律的吃饭+抽奖。去年的年会反馈一般，主要是节目太无聊、互动太少。公司有一个10人的行政团队可以协助。",
        constraints: "预算8万元（含场地、餐饮、设备、奖品），不能占用工作日排练",
        preferences: "老板偏好科技感、年轻化的风格，不喜欢传统的领导讲话环节过长",
      },
      {
        id: "plan-daily-trip",
        label: "家庭旅行规划",
        description: "规划一次五天四晚的家庭出游",
        category: "daily",
        domain: "daily",
        timeScale: "days",
        objective: "规划一次五天四晚的云南大理-丽江家庭旅行，让全家人都玩得开心",
        context: "一家四口出行，夫妻两人+一个8岁儿子+一个65岁母亲。从上海出发，预算1.5万元（不含机票）。母亲腿脚不太好，不能走太多山路。儿子喜欢户外活动和动物。计划五一假期出行。",
        constraints: "母亲不能爬山、儿子需要有趣味性、五一期间景点可能拥挤需要提前预订",
        preferences: "偏好自然风光和文化体验，不喜欢购物团式行程，希望每天行程不要太赶",
      },
    ],
  },

  // ============================================================
  // 学习成长
  // ============================================================
  {
    id: "study",
    label: "学习成长",
    icon: "📚",
    examples: [
      {
        id: "plan-study-thesis",
        label: "硕士论文计划",
        description: "从选题到答辩的完整论文写作计划",
        category: "study",
        domain: "study",
        timeScale: "months",
        objective: "在6个月内完成硕士毕业论文的选题、研究、撰写和答辩，确保论文质量达到良好以上",
        context: "计算机科学专业研二学生，研究方向是自然语言处理。导师比较忙，平均每两周见一次面。目前有一个初步的研究想法（基于大模型的对话情感分析），但还没有具体的实验设计。需要在6月底完成答辩。手上还有一门课的课程项目需要在下个月完成。",
        constraints: "导师每两周才有一次面谈时间，实验室GPU资源需要排队，下个月有课程项目要交",
        preferences: "希望论文能发一篇会议论文，不仅仅是完成毕业要求",
      },
      {
        id: "plan-study-skill",
        label: "全栈开发自学",
        description: "零基础到能独立开发全栈应用的学习路径",
        category: "study",
        domain: "study",
        timeScale: "months",
        objective: "在4个月内从编程零基础成长到能独立开发和部署一个完整的全栈Web应用",
        context: "28岁，目前做市场营销工作。有基本的计算机使用能力但完全不会编程。每天晚上能抽出2-3小时学习，周末可以全天学习。学习目标是转行做前端开发或全栈开发。已经在B站看了几个入门视频但没有系统学习过。",
        constraints: "每天只有2-3小时学习时间，没有编程基础，4个月后希望开始投简历",
        preferences: "偏好看视频+动手实践的学习方式，不喜欢纯看文档",
      },
      {
        id: "plan-study-exam",
        label: "考研冲刺计划",
        description: "最后三个月的考研复习冲刺安排",
        category: "study",
        domain: "study",
        timeScale: "months",
        objective: "在考研最后三个月内系统冲刺，目标总分380+，考入目标院校（985计算机专业）",
        context: "大四学生，考研目标是某985大学计算机专业。目前复习进度：数学已过完基础+强化阶段，正确率约70%；英语阅读正确率约65%，作文还没开始准备；专业课（数据结构+操作系统）过了一遍教材但做题不熟练；政治还没开始看。距离考试还有90天。每天可用学习时间约12小时。",
        constraints: "时间只剩90天，政治还没开始，专业课做题不熟练",
        preferences: "数学和专业课是强项，英语和政治相对薄弱，希望扬长补短",
      },
    ],
  },

  // ============================================================
  // 职业发展
  // ============================================================
  {
    id: "career",
    label: "职业发展",
    icon: "🚀",
    examples: [
      {
        id: "plan-career-switch",
        label: "转行规划",
        description: "从传统行业转型到互联网行业的完整路径",
        category: "career",
        domain: "career",
        timeScale: "months",
        objective: "在6个月内从传统制造业项目经理成功转型为互联网产品经理，拿到月薪不低于2万的offer",
        context: "32岁，在一家制造业公司做了5年项目经理，管理过20人团队，有PMP证书。对互联网产品很感兴趣，平时自己会研究各种APP的产品设计。但没有互联网行业经验，也没有产品经理相关证书。目前月薪1.5万，有一定存款可以支持3个月脱产学习。家里有房贷每月5000。",
        constraints: "房贷压力意味着最多脱产3个月，32岁年龄在互联网行业不算年轻",
        preferences: "倾向于ToB产品方向（与之前项目管理经验更匹配），不排斥降薪20%以内",
      },
      {
        id: "plan-career-promotion",
        label: "晋升路线图",
        description: "从高级工程师到技术总监的三年晋升计划",
        category: "career",
        domain: "career",
        timeScale: "years",
        objective: "在三年内从高级工程师晋升到技术总监，管理50+人的技术团队",
        context: "29岁，在一家B轮互联网公司做高级后端工程师（P6），工作4年。技术能力强，在团队内口碑好。公司在快速发展，未来一年预计扩张到300人。直属领导（技术VP）对我评价不错。目前带了一个3人小组，有一些管理经验但不多。公司的晋升路径是P6→P7(技术专家/小组长)→P8(部门经理)→P9(技术总监)。",
        constraints: "P7竞争激烈（有5个P6），管理经验不足，技术深度还需提升",
        preferences: "倾向于管理+技术双通道发展，不想纯做管理脱离技术",
      },
      {
        id: "plan-career-freelance",
        label: "自由职业过渡",
        description: "从全职工作过渡到自由职业/独立开发者",
        category: "career",
        domain: "career",
        timeScale: "years",
        objective: "在一年内建立稳定的自由职业收入来源，月收入不低于目前工资的80%（即2万元），然后安全离职",
        context: "30岁全栈开发者，在一家公司月薪2.5万。有一些独立开发的经验，在GitHub上有一个2k star的开源项目。有一个周末做的小产品月收入约3000元。有一些海外客户资源。存款约30万。已婚，配偶收入稳定月薪1.5万。",
        constraints: "不能影响当前全职工作、需要保证稳定收入过渡、配偶对风险比较谨慎",
        preferences: "倾向做SaaS产品而非接外包，希望建立被动收入而非用时间换钱",
      },
    ],
  },

  // ============================================================
  // 商业创业
  // ============================================================
  {
    id: "business",
    label: "商业创业",
    icon: "💰",
    examples: [
      {
        id: "plan-biz-startup",
        label: "创业从0到1",
        description: "从想法到MVP上线到找投资的完整创业路径",
        category: "business",
        domain: "business",
        timeScale: "months",
        objective: "在6个月内完成AI产品的MVP开发和验证，获得首批100个付费用户，并开始接触天使投资人",
        context: "两人团队（一个全栈开发+一个运营），想做一个基于AI的社交沟通辅助工具。已经有了产品原型和技术方案。目前是兼职状态，两人都还在上班。启动资金10万元（两人各出5万）。目标用户群是职场人士和销售团队。市场上有几个竞品但没有一个做得特别好的。",
        constraints: "兼职创业时间有限、启动资金只有10万、团队只有两人",
        preferences: "倾向先做一个精准的细分市场（如B2B销售人员），而非做大而全的产品",
      },
      {
        id: "plan-biz-funding",
        label: "融资路线规划",
        description: "创业公司从种子轮到A轮的融资策略",
        category: "business",
        domain: "business",
        timeScale: "years",
        objective: "在18个月内完成种子轮+Pre-A+A轮融资，总融资额不低于3000万，公司估值达到1.5亿",
        context: "AI SaaS创业公司，产品已上线3个月。团队8人（4技术+2运营+1销售+1CEO）。月活用户5000，月营收8万，月增长率20%。已完成一笔100万的天使投资。核心技术有一定壁垒（自研模型+专有数据集）。CEO有大厂背景（前BAT P8），CTO有AI领域的顶会论文。目前现金流只能撑4个月。",
        constraints: "现金流紧张只能撑4个月、团队人少需要融资后扩张、行业竞争加剧",
        preferences: "倾向找有产业背景的投资人（而非纯财务投资），希望保留创始团队60%以上股份",
      },
      {
        id: "plan-biz-expansion",
        label: "业务出海规划",
        description: "国内成熟产品拓展海外市场",
        category: "business",
        domain: "business",
        timeScale: "years",
        objective: "在一年内将国内SaaS产品成功出海到东南亚市场，实现海外月营收50万元",
        context: "公司做企业级协作工具，国内已有5000+付费企业客户，ARR 3000万。技术团队30人。产品支持中英文。东南亚市场有几个本地竞品但产品力不强。公司在新加坡注册了子公司。有一个当地的合作伙伴（渠道商）愿意帮忙推广。团队里有两个会说英语和马来语的同事。",
        constraints: "对海外市场不够了解、本地化需要投入、支付和合规问题、时差管理",
        preferences: "优先切入新加坡和马来西亚市场，采用合作伙伴+线上获客的混合模式",
      },
    ],
  },

  // ============================================================
  // 项目管理
  // ============================================================
  {
    id: "project",
    label: "项目管理",
    icon: "⚙️",
    examples: [
      {
        id: "plan-proj-app",
        label: "APP开发项目",
        description: "从需求到上线的完整APP开发项目管理",
        category: "project",
        domain: "project",
        timeScale: "months",
        objective: "在3个月内完成一款社交类APP的设计、开发、测试和上线，首月用户量达到1万",
        context: "一个5人开发团队（2前端+2后端+1设计师），加一个产品经理。产品定位是熟人社交+兴趣匹配。技术栈确定使用React Native+Node.js+PostgreSQL。已经完成了产品需求文档和原型设计。需要同时发布iOS和Android版本。公司给了3个月时间和50万预算。",
        constraints: "3个月硬性deadline、需要同时开发双平台、团队没有APP上架经验",
        preferences: "采用两周一迭代的敏捷开发模式，优先保证核心功能（注册登录、匹配、聊天）",
      },
      {
        id: "plan-proj-migrate",
        label: "系统迁移方案",
        description: "将传统系统迁移到云原生架构",
        category: "project",
        domain: "project",
        timeScale: "months",
        objective: "在6个月内将公司核心业务系统从传统单体架构迁移到云原生微服务架构，实现零停机切换",
        context: "公司的核心ERP系统运行了8年，基于Java单体架构，日均处理10万笔订单。系统稳定但扩展性差，每次发版需要停机2小时。团队有15个开发人员，其中5个有微服务经验。已经选定阿里云作为云服务商。老系统有200多个API接口、50多张数据库表。业务不能中断。",
        constraints: "业务不能中断（零停机要求）、老系统文档不全、部分代码已无人维护、迁移期间还要支持新需求",
        preferences: "采用渐进式迁移策略（绞杀者模式），先迁移边缘服务再迁移核心服务",
      },
    ],
  },

  // ============================================================
  // 政务与公共决策
  // ============================================================
  {
    id: "government",
    label: "政务决策",
    icon: "🏛️",
    examples: [
      {
        id: "plan-gov-digital",
        label: "数字化转型方案",
        description: "地方政府政务服务数字化转型三年规划",
        category: "government",
        domain: "government",
        timeScale: "years",
        objective: "用三年时间实现全区政务服务'最多跑一次'，线上办理率从30%提升到90%，群众满意度达95%以上",
        context: "某区级政府，辖区人口80万。目前有一个基础的政务网站但功能简单，大部分业务还需要线下跑腿。区内有28个部门、150+项行政审批事项。IT预算每年约500万。已有一个5人的信息化科室。省里要求两年内完成基本的数字化改造。区长非常重视这项工作。",
        constraints: "预算有限、部门间数据不互通、部分干部对数字化抵触、群众年龄层跨度大",
        preferences: "优先推进高频事项（如社保、户籍、营业执照），采用分批上线策略",
      },
      {
        id: "plan-gov-rural",
        label: "乡村振兴实施方案",
        description: "制定一个乡镇的乡村振兴五年实施方案",
        category: "government",
        domain: "government",
        timeScale: "years",
        objective: "五年内实现乡镇人均收入翻一番，建成2个特色产业基地，村容村貌显著改善，人口外流趋势逆转",
        context: "某山区乡镇，下辖12个行政村，常住人口1.2万人（户籍人口2万，大量外出务工）。主要产业是传统农业（水稻+茶叶），年人均收入约1.5万元。交通条件一般，距离县城40分钟车程。有一定的旅游资源（古村落+山水风光）但未开发。近年来年轻人外流严重，留守老人儿童问题突出。",
        constraints: "财政收入有限、人才匮乏、基础设施落后、群众观念保守",
        preferences: "发挥茶叶和旅游两大优势，走'茶旅融合'路线，引入社会资本",
      },
    ],
  },

  // ============================================================
  // 人生规划
  // ============================================================
  {
    id: "life",
    label: "人生规划",
    icon: "🌟",
    examples: [
      {
        id: "plan-life-immigration",
        label: "移民规划",
        description: "技术移民到加拿大的完整准备路径",
        category: "life",
        domain: "life",
        timeScale: "years",
        objective: "在两年内通过加拿大联邦技术移民（EE）获得永久居民身份",
        context: "30岁，软件工程师，硕士学历，工作经验6年。英语水平中等（雅思预估6.5）。已婚，配偶是教师，有一个2岁的孩子。目前在国内一线城市工作，年收入约50万。没有海外工作或学习经验。对加拿大的温哥华或多伦多感兴趣。存款约200万。",
        constraints: "雅思需要提高到8777（CLB9）才有竞争力、配偶英语较弱、有幼儿需要照顾",
        preferences: "倾向联邦EE快速通道，如CRS分数不够考虑省提名PNP加分",
      },
      {
        id: "plan-life-retirement",
        label: "提前退休计划",
        description: "规划40岁实现财务自由提前退休",
        category: "life",
        domain: "life",
        timeScale: "years",
        objective: "在40岁（8年后）实现财务自由，被动收入覆盖家庭月支出2万元，可选择性工作",
        context: "32岁，互联网公司技术总监，年收入80万（税后约55万）。已婚，一个孩子，配偶年收入20万。有一套房产（市值400万，无贷款），存款+理财约150万，股票约30万。每月家庭支出约2万（含孩子教育）。父母有退休金，不需要赡养。对投资理财有基本了解但没有系统学习过。",
        constraints: "需要同时兼顾孩子教育金、不确定的医疗支出、通货膨胀",
        preferences: "偏好稳健投资风格，不追求高风险高回报，希望通过多元化收入实现",
      },
      {
        id: "plan-life-health",
        label: "健康管理计划",
        description: "亚健康状态的全方位健康改善计划",
        category: "life",
        domain: "life",
        timeScale: "months",
        objective: "在6个月内从亚健康状态恢复到健康状态：体重减15斤、体检指标全部正常、精力明显提升",
        context: "35岁男性程序员，身高175cm体重85kg（超重）。最近体检发现轻度脂肪肝、甘油三酯偏高、颈椎轻度退变。久坐办公，每天工作10+小时，基本不运动。饮食不规律，经常外卖和夜宵。睡眠质量差，经常凌晨1点才睡。工作压力大，偶尔焦虑失眠。",
        constraints: "工作忙碌时间有限、公司没有健身房、饮食环境（同事都点外卖）不利于改善",
        preferences: "不喜欢跑步，可以接受游泳和力量训练。希望计划不要太极端，能持续执行",
      },
    ],
  },
];

/** Get all planning examples as flat array */
export function getAllPlanningExamples(): PlanningExample[] {
  return PLANNING_EXAMPLE_CATEGORIES.flatMap((cat) => cat.examples);
}
