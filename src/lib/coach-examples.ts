// ============================================================
// Coach Tab — Categorized Example Scenarios
// ============================================================

export interface CoachExample {
  id: string;
  label: string;
  description: string;
  goal: string;
  messages: { role: "self" | "other"; content: string }[];
}

export interface CoachExampleCategory {
  id: string;
  label: string;
  icon: string;
  examples: CoachExample[];
}

export const COACH_EXAMPLE_CATEGORIES: CoachExampleCategory[] = [
  // ============================================================
  // 1. 专业场景 — 需要特定专业知识
  // ============================================================
  {
    id: "professional",
    label: "专业场景",
    icon: "⚖️",
    examples: [
      {
        id: "coach-lawyer-fee",
        label: "与律师谈代理费",
        description: "委托律师打官司，讨论收费方案和胜算",
        goal: "争取风险代理（先打后付），降低前期支出",
        messages: [
          { role: "other", content: "张先生您好，我看了您发过来的材料，这个案子有一定复杂性。" },
          { role: "self", content: "李律师好，我想了解一下代理费怎么收？" },
          { role: "other", content: "这类案件我们一般收固定费用，前期10万，加上诉讼费和保全费另计。" },
          { role: "self", content: "10万有点高，我现在资金周转比较紧。能不能做风险代理？赢了再按比例分？" },
          { role: "other", content: "风险代理我们也做，但要看案件标的和胜率。您这个案子标的多少？" },
          { role: "self", content: "标的大概180万。" },
          { role: "other", content: "180万的话，风险代理我们一般要收回款的25%-30%。而且需要您先支付3万元的基础费用。" },
        ],
      },
      {
        id: "coach-doctor-treatment",
        label: "与医生讨论治疗方案",
        description: "家属与医生沟通手术方案选择和风险",
        goal: "充分了解各方案利弊，做出最优决策",
        messages: [
          { role: "other", content: "检查结果出来了，确诊是胆囊结石，直径1.2厘米，伴有慢性炎症。" },
          { role: "self", content: "医生，必须手术吗？有没有保守治疗的方案？" },
          { role: "other", content: "保守治疗可以控制症状，但结石不会消失，而且反复发炎会增加胆囊癌风险。我建议还是手术切除。" },
          { role: "self", content: "手术的话是微创还是开腹？大概多久能恢复？" },
          { role: "other", content: "现在基本都做腹腔镜微创，住院三天左右，恢复期两周。但您父亲有糖尿病，术后感染风险稍高，需要术前把血糖控制好。" },
          { role: "self", content: "那血糖控制到什么水平才能做手术？另外手术费用大概多少？" },
        ],
      },
      {
        id: "coach-teacher-conference",
        label: "与班主任沟通孩子问题",
        description: "孩子成绩下滑被叫家长，需要与老师有效沟通",
        goal: "了解真实情况，争取老师更多关注和帮助",
        messages: [
          { role: "other", content: "小明妈妈，感谢您来。小明这学期成绩下滑比较明显，数学从90分掉到了65分。" },
          { role: "self", content: "老师好，我也注意到了。在家写作业倒是挺认真的，不知道是不是学习方法有问题？" },
          { role: "other", content: "课堂表现来看，他上课注意力不太集中，经常走神。而且下课后跟几个同学玩手机游戏比较多。" },
          { role: "self", content: "手机的事我确实管得不够严格...老师您觉得现在最大的问题是什么？" },
          { role: "other", content: "我观察下来，基础知识没问题，主要是上课不认真导致新知识没跟上。另外他最近跟班上几个成绩不太好的同学走得很近。" },
        ],
      },
      {
        id: "coach-civil-servant-report",
        label: "向领导汇报敏感事项",
        description: "公务员向分管领导汇报群众投诉问题",
        goal: "如实汇报又不引火烧身，推动问题解决",
        messages: [
          { role: "self", content: "张局，有件事想跟您汇报一下。昨天12345热线转过来一个投诉，关于咱们辖区XX路的违建问题。" },
          { role: "other", content: "什么情况？之前不是处理过了吗？" },
          { role: "self", content: "是的，上次下过整改通知，但对方只拆了一部分。这次投诉的是隔壁商户，说违建挡了他的通风采光。" },
          { role: "other", content: "这个投诉人是什么背景？上次的事情不是已经结案了吗？" },
          { role: "self", content: "投诉人是普通商户，但他说如果不处理就要向市里反映。上次确实是结案了，但标准执行得不够严格。" },
          { role: "other", content: "嗯...这个事情要是闹到市里就麻烦了。你有什么想法？" },
        ],
      },
    ],
  },

  // ============================================================
  // 2. 高情商场景 — 需要极强人际技巧
  // ============================================================
  {
    id: "high-eq",
    label: "高情商场景",
    icon: "💝",
    examples: [
      {
        id: "coach-dating-advance",
        label: "约会推进关系",
        description: "追求阶段，试探对方心意并推进关系",
        goal: "自然地表达好感，试探对方态度，争取下次约会",
        messages: [
          { role: "self", content: "上次推荐的那家餐厅真的很好吃，谢谢你" },
          { role: "other", content: "哈哈好吃就好～我也很久没去了" },
          { role: "self", content: "那下次一起去啊，我请你" },
          { role: "other", content: "再说吧 最近挺忙的" },
          { role: "self", content: "好，不着急。对了你上次说想学烘焙来着？" },
          { role: "other", content: "对啊 一直想学但没找到好的地方" },
        ],
      },
      {
        id: "coach-meet-parents",
        label: "第一次见家长",
        description: "女友带你去见她父母，饭局上的对话",
        goal: "给对方父母留下好印象，展示诚意和靠谱",
        messages: [
          { role: "other", content: "小王啊，听说你是做互联网的？现在这行不是在裁员吗？" },
          { role: "self", content: "叔叔好，确实这两年行业在调整期。我目前在一家上市公司做产品经理，团队比较稳定。" },
          { role: "other", content: "收入还可以吧？买房了没有？" },
          { role: "self", content: "目前年收入还可以，已经攒了首付，准备今年看看合适的房子。" },
          { role: "other", content: "嗯，你们年轻人压力大。小丽在家是被宠大的，从小没吃过什么苦。" },
        ],
      },
      {
        id: "coach-boss-report",
        label: "向老板汇报坏消息",
        description: "项目出了问题需要如实向老板汇报",
        goal: "坦诚汇报问题同时展示解决方案，不引起恐慌",
        messages: [
          { role: "self", content: "王总，关于XX项目有个情况需要跟您汇报。" },
          { role: "other", content: "说。" },
          { role: "self", content: "原定本月底交付的第一阶段，可能需要延期两周。主要原因是第三方接口对接出了一些技术问题。" },
          { role: "other", content: "延期两周？客户那边怎么交代？上次开会不是说没问题的吗？" },
          { role: "self", content: "是的，开会时第三方承诺的接口文档后来变更了两次，导致我们要重新适配。我已经安排团队加班赶进度了。" },
          { role: "other", content: "加班就能解决？这种事你应该早点说！" },
        ],
      },
      {
        id: "coach-business-dinner",
        label: "商务宴请客户",
        description: "重要客户第一次赴宴，需要通过饭局拉近关系",
        goal: "让客户感到舒适和被重视，为后续合作铺路",
        messages: [
          { role: "self", content: "刘总，这边请坐。今天特意订了您上次提到喜欢的粤菜，不知道口味合不合适？" },
          { role: "other", content: "客气了客气了，这家店环境不错嘛。" },
          { role: "self", content: "这家是朋友推荐的，说他们的招牌脆皮烧鹅特别好。刘总您平时喝什么酒？" },
          { role: "other", content: "随意就好，不用太破费。对了，你们那个方案我还在看，有几个点想讨论一下。" },
          { role: "self", content: "好的好的，方案的事不着急，咱们今天先好好吃饭。刘总平时爱好什么？上次听您提到喜欢钓鱼？" },
        ],
      },
      {
        id: "coach-reject-friend-loan",
        label: "婉拒朋友借大额钱",
        description: "好朋友开口借20万，需要得体拒绝但不伤感情",
        goal: "明确拒绝但保持友谊，不让自己陷入为难",
        messages: [
          { role: "other", content: "兄弟，有件事想跟你商量一下。最近手头实在紧，想跟你借20万周转一下，三个月就还。" },
          { role: "self", content: "怎么了？是遇到什么困难了吗？" },
          { role: "other", content: "唉，之前投了个项目亏了不少，现在还有一笔贷款下个月到期，不然要上征信了。" },
          { role: "self", content: "这个情况确实挺急的...20万对我来说也不是小数目啊。" },
          { role: "other", content: "我知道，但你在咱们朋友里面条件算好的了，我实在没办法才找你。绝对按时还。" },
        ],
      },
    ],
  },

  // ============================================================
  // 3. 商务谈判 — 开拓市场与合作
  // ============================================================
  {
    id: "business",
    label: "商务谈判",
    icon: "💼",
    examples: [
      {
        id: "coach-sales-pitch",
        label: "首次拜访潜在客户",
        description: "冷启动拜访大客户，对方态度冷淡",
        goal: "获得对方的兴趣和后续面谈机会",
        messages: [
          { role: "self", content: "赵总好，我是XX科技的小李，主要做企业数字化解决方案的。" },
          { role: "other", content: "嗯，你说。我时间不多。" },
          { role: "self", content: "了解，我简短说。我们注意到贵公司今年在扩展线上业务，我们刚好帮同行业的XX公司做了类似的项目，效率提升了40%。" },
          { role: "other", content: "XX公司啊...他们的情况跟我们不一样。而且我们已经有供应商了。" },
          { role: "self", content: "理解，每家情况确实不同。不过我们有一个免费的业务诊断服务，不需要任何承诺，只是帮您看看现有流程有没有优化空间。" },
          { role: "other", content: "免费？一般说免费的后面都不简单吧。" },
        ],
      },
      {
        id: "coach-partnership-negotiate",
        label: "合作伙伴利润分成谈判",
        description: "与渠道商谈新一年的合作条款和分成比例",
        goal: "在保持合作关系的同时优化分成结构",
        messages: [
          { role: "other", content: "老周，今年的合作协议该续了。说实话，去年给我们的返点太低了，今年得调一下。" },
          { role: "self", content: "陈总，去年的量确实不错，辛苦你们团队了。具体想调到多少？" },
          { role: "other", content: "市场上同类产品给渠道的返点都在15-20%，你们去年才给我们12%。至少要到18%。" },
          { role: "self", content: "18%的话我们的利润空间就很薄了。不过我理解你们的诉求。这样吧，我们换个思路——能不能按量阶梯？" },
          { role: "other", content: "什么意思？" },
        ],
      },
      {
        id: "coach-investor-meeting",
        label: "投资人首次面谈",
        description: "创业者与天使投资人第一次深度交流",
        goal: "获得投资人认可，推进到尽调阶段",
        messages: [
          { role: "other", content: "你们的方向我看了，AI+教育赛道。说实话这个赛道已经很卷了，你们的壁垒在哪？" },
          { role: "self", content: "赛道确实热，但我们切的是一个被忽略的细分——个性化口语陪练。现有产品90%在做阅读和写作，口语几乎没人做好。" },
          { role: "other", content: "为什么没人做好？是技术原因还是需求不够大？" },
          { role: "self", content: "技术原因为主。口语评估需要实时语音处理+细粒度发音纠错，以前的模型做不好。我们团队核心成员来自讯飞和Google TTS团队，在这个点上有两年的技术积累。" },
          { role: "other", content: "嗯，技术背景不错。但你们现在有用户数据吗？产品上线多久了？" },
        ],
      },
    ],
  },

  // ============================================================
  // 4. 职场高阶 — 复杂的职场人际
  // ============================================================
  {
    id: "workplace",
    label: "职场高阶",
    icon: "🏢",
    examples: [
      {
        id: "coach-skip-level",
        label: "越级汇报后的善后",
        description: "因紧急事件越级汇报后，直属领导不满",
        goal: "修复与直属领导的关系，解释行为的合理性",
        messages: [
          { role: "other", content: "小张，你昨天直接去找王副总汇报的事，你觉得合适吗？" },
          { role: "self", content: "陈经理，这件事确实应该先跟您说。昨天情况比较紧急，客户那边限两小时答复，我找您的时候您正好在开会..." },
          { role: "other", content: "你可以等我开完会嘛。你知道王副总现在怎么看我吗？他会觉得我对下面的事情不掌握。" },
          { role: "self", content: "这是我考虑不周，给您造成了被动。不过汇报的时候我有跟王副总说这个事您一直在跟进的。" },
          { role: "other", content: "以后类似的事情怎么处理，你想清楚了吗？" },
        ],
      },
      {
        id: "coach-peer-conflict",
        label: "跨部门资源争夺",
        description: "你和另一个部门经理都需要同一个技术团队的支持",
        goal: "优先获得技术资源，同时不得罪对方",
        messages: [
          { role: "other", content: "我听说你也在跟技术部要人？我们的618大促项目已经排上了，人力不够的话上线要延期。" },
          { role: "self", content: "是的，我们的客户系统升级也很紧急，上线日期是董事会定的。" },
          { role: "other", content: "那你说怎么办？技术部就那么多人，总得有个先后。" },
          { role: "self", content: "要不我们一起找技术总监聊聊？看看能不能把两个项目的需求拆分一下，技术侧分批支持。" },
          { role: "other", content: "分批的话我的项目就得延期了啊，这个锅谁来背？" },
        ],
      },
      {
        id: "coach-salary-negotiate",
        label: "收到Offer后谈薪",
        description: "拿到心仪公司的offer但薪资低于预期",
        goal: "在不丢掉offer的前提下争取到更好的薪资包",
        messages: [
          { role: "other", content: "恭喜你通过了所有面试轮次，我们很希望你能加入。Offer的具体内容是月薪35K，年终2个月，试用期6个月。" },
          { role: "self", content: "非常感谢，我也很期待加入团队。不过关于薪资想跟您沟通一下，35K跟我目前的收入相比没有太大提升。" },
          { role: "other", content: "理解。你目前的薪资是多少？你的期望是？" },
          { role: "self", content: "我目前综合年收入在55万左右。考虑到职业发展，期望能到月薪42K。" },
          { role: "other", content: "42K确实超出了这个岗位的预算范围。我们最多能到38K，再高要特批了。" },
        ],
      },
    ],
  },
  // ============================================================
  // 5. 创业融资 — 投资人与创业者场景
  // ============================================================
  {
    id: "startup",
    label: "创业融资",
    icon: "🚀",
    examples: [
      {
        id: "coach-pitch-vc",
        label: "向VC做路演Pitch",
        description: "在投资机构的路演会上做5分钟Pitch后的Q&A环节",
        goal: "回答好投资人的刁钻问题，获得后续会议邀请",
        messages: [
          { role: "other", content: "你的产品DAU才3万，你们凭什么要1亿估值？你的同行DAU 50万估值才8000万。" },
          { role: "self", content: "DAU确实还在早期，但我们的用户质量不一样。我们的付费转化率12%，ARPU值是行业平均的4倍，LTV/CAC比达到5.8。" },
          { role: "other", content: "这些数据看起来好看，但样本量太小，有统计显著性吗？万一是早期种子用户的偏差呢？" },
          { role: "self", content: "好问题。我们做过对照分析，新用户和种子用户的付费行为差异不超过15%。而且最近三个月的自然增长用户转化率是持续上升的。" },
          { role: "other", content: "行，数据先放一边。你们的技术壁垒到底是什么？如果大厂来做同样的事，你怎么活？" },
        ],
      },
      {
        id: "coach-angel-negotiate",
        label: "天使轮估值谈判",
        description: "与天使投资人谈具体投资条款和估值",
        goal: "在3000万以上估值完成天使轮，不接受对赌条款",
        messages: [
          { role: "other", content: "产品和团队我都认可，说说你期望的估值吧。" },
          { role: "self", content: "我们期望天使轮投前估值4000万，融资500万，出让11%左右的股权。" },
          { role: "other", content: "4000万太高了。你们还没有收入，产品刚上线两个月。我觉得2000万投前比较合理。" },
          { role: "self", content: "2000万低估了团队的价值。我们CTO在这个领域有8年经验和3项核心专利，光专利的独家授权费就值这个数。" },
          { role: "other", content: "专利归专利，商业化是另一回事。这样，我可以接受2500万投前，但要加一个业绩对赌——12个月内月营收不到30万的话，估值下调到1500万。" },
          { role: "self", content: "对赌条款我们比较难接受，这会严重影响团队士气和后续融资..." },
        ],
      },
      {
        id: "coach-cofounder-equity",
        label: "合伙人股权分配谈判",
        description: "三个联合创始人谈股权分配方案",
        goal: "达成公平且有利于公司发展的股权结构",
        messages: [
          { role: "other", content: "股权这个事必须今天谈清楚。我负责技术是核心，我觉得我至少应该拿40%。" },
          { role: "self", content: "老王，技术重要我认可。但公司不只是技术，市场、融资、运营都是核心。我作为CEO负责战略和融资，贡献不比技术少。" },
          { role: "other", content: "那你说怎么分？你拿多少？" },
          { role: "self", content: "我的建议是我40%、你35%、老李25%。我多5%不是因为我贡献更大，而是CEO需要在投票权上有一定优势，这样决策不会僵局。" },
          { role: "other", content: "我不同意。凭什么你比我多？要不我们三个人平分？" },
        ],
      },
    ],
  },

  // ============================================================
  // 6. 危机沟通 — 紧急高压场景
  // ============================================================
  {
    id: "crisis",
    label: "危机沟通",
    icon: "🔥",
    examples: [
      {
        id: "coach-crisis-media",
        label: "面对媒体追问",
        description: "公司出了负面事件，记者追问你的回应",
        goal: "控制信息传播，不说错话，传达公司立场",
        messages: [
          { role: "other", content: "请问贵公司产品导致用户数据泄露的事是真的吗？我们已经收到多名用户的投诉。" },
          { role: "self", content: "感谢您的关注。我们已经注意到网上的讨论，技术团队正在进行全面排查。" },
          { role: "other", content: "也就是说你们承认有安全漏洞了？受影响的用户有多少？" },
          { role: "self", content: "目前调查还在进行中，我们不想在结果出来之前发布不准确的信息。但用户数据安全是我们的第一优先级。" },
          { role: "other", content: "可是用户现在很恐慌，你们不觉得应该先给一个明确的说法吗？至少告诉大家要不要改密码？" },
        ],
      },
      {
        id: "coach-crisis-client-angry",
        label: "大客户威胁终止合作",
        description: "最大的客户对交付质量非常不满，威胁要换供应商",
        goal: "稳住客户情绪，保住合同，争取补救机会",
        messages: [
          { role: "other", content: "你们这次的交付简直是灾难！系统上线第一天就崩了三次，我们的业务线全部受影响！" },
          { role: "self", content: "王总，非常抱歉给您造成了这么大的困扰。我们的CTO已经带队在现场处理了。" },
          { role: "other", content: "处理有什么用？损失谁来赔？我们今天一天的订单损失就是200多万！我已经让法务在看合同了。" },
          { role: "self", content: "损失的事情我们一定会按照合同条款承担责任。但现在最重要的是先恢复您的业务。我想确认一下，目前系统是否已经稳定了？" },
          { role: "other", content: "稳定了，但谁知道明天会不会又出问题？说实话我已经在接触你们的竞争对手了。" },
        ],
      },
      {
        id: "coach-crisis-layoff",
        label: "裁员面谈",
        description: "作为管理者需要裁掉一个表现尚可的下属",
        goal: "完成公司指派的裁员任务，同时尽量减少对方的伤害",
        messages: [
          { role: "self", content: "小刘，今天找你聊一件比较重要的事情。" },
          { role: "other", content: "什么事？是关于我的绩效吗？上个季度我的KPI都完成了啊。" },
          { role: "self", content: "你的工作表现没有问题。但公司最近在做战略调整，我们部门需要缩减编制..." },
          { role: "other", content: "等等...你是说要裁我？为什么是我？我来了两年了，一直兢兢业业的！" },
          { role: "self", content: "我理解你的感受，这对我来说也是一个很难的决定。公司给的补偿方案是N+1..." },
          { role: "other", content: "N+1？我看到其他公司裁员都是N+3。就这么把人打发了？" },
        ],
      },
    ],
  },
  // ============================================================
  // 7. 日常生活 — 常见生活谈判与沟通
  // ============================================================
  {
    id: "daily-life",
    label: "日常生活",
    icon: "🏠",
    examples: [
      {
        id: "coach-return-product",
        label: "退换商品遭拒",
        description: "买的电子产品有瑕疵，店家不认要求退货",
        goal: "成功退货或换新，至少获得维修/补偿方案",
        messages: [
          { role: "self", content: "你好，我上周在你们这买的耳机，右耳有杂音，想退货。" },
          { role: "other", content: "先生，电子产品过了7天就不能退了，只能送修。" },
          { role: "self", content: "可是我买了才5天就出问题了，当时就应该退的，只是这几天出差没来。" },
          { role: "other", content: "但我们的退货期限是按购买日期算的，这个是规定。" },
          { role: "self", content: "你们卖的产品有质量问题，难道不应该承担责任吗？我可以出示购买凭证。" },
          { role: "other", content: "这样吧，我帮您申请一下售后，但退货确实不太好办。" },
        ],
      },
      {
        id: "coach-rental-negotiate",
        label: "续租谈涨租",
        description: "房东要涨20%房租，你想争取合理涨幅",
        goal: "控制涨幅在10%以内，最好争取不涨",
        messages: [
          { role: "other", content: "小李，合同下个月到期了，新合同的房租要调整一下，涨到4200。" },
          { role: "self", content: "张姐，现在是3500吧，一下涨700有点多了。附近同户型的也就3800左右。" },
          { role: "other", content: "那是老房子，我这个装修才两年，家电都是新的。而且物业费涨了，我也有成本。" },
          { role: "self", content: "我在这住了两年了，一直爱惜房子，从没拖过租金。换一个租客您还要空置期和中介费。" },
          { role: "other", content: "那倒是。你说多少合适？" },
          { role: "self", content: "3700怎么样？涨了200我可以接受，而且我可以一次付半年。" },
        ],
      },
      {
        id: "coach-car-repair-dispute",
        label: "4S店维修扯皮",
        description: "车刚过保修期就出大问题，4S店不愿免费修",
        goal: "争取到免费或大幅优惠的维修方案",
        messages: [
          { role: "self", content: "我的车变速箱异响，买了才两年半，应该不会这么快坏吧？" },
          { role: "other", content: "检测结果是变速箱阀体需要更换，费用大概1.2万。您的车过保了，只能自费。" },
          { role: "self", content: "过保才一个月！两年多的车变速箱就坏了，这是质量问题吧？" },
          { role: "other", content: "保修期是按合同来的，过了就是过了。我们也是按规定办事。" },
          { role: "self", content: "你们这款车的变速箱投诉在车质网上排前三，这是已知的通病了。我看到其他4S店对这个问题做了延保处理。" },
          { role: "other", content: "这个我要向厂家申请一下，不确定能不能批。" },
        ],
      },
    ],
  },

  // ============================================================
  // 8. 教育沟通 — 校园场景教练
  // ============================================================
  {
    id: "education",
    label: "教育场景",
    icon: "🎓",
    examples: [
      {
        id: "coach-exam-appeal",
        label: "对考试成绩申诉",
        description: "认为阅卷有误，需要向教务处申请复核",
        goal: "成功启动成绩复核流程，争取改分",
        messages: [
          { role: "self", content: "老师您好，我想申请一下上周期末考试的成绩复核。" },
          { role: "other", content: "复核需要有具体理由的，你觉得哪道题有问题？" },
          { role: "self", content: "论述题第三题，我写了满满两页，但只给了3分（满分15分）。我对照了标准答案，要点都覆盖了。" },
          { role: "other", content: "论述题的评分有一定主观性，不同老师可能有不同标准。" },
          { role: "self", content: "我理解。但其他同学写了类似的要点拿了11分，差距太大了。我这里有我和同学的答题照片做对比。" },
          { role: "other", content: "嗯，你把材料整理好交上来，我转给教研室主任看看。" },
        ],
      },
      {
        id: "coach-intern-conflict",
        label: "实习期与带教老师冲突",
        description: "实习期间被带教老师布置超量工作还不给好评",
        goal: "改善与带教老师的关系，保住实习评价",
        messages: [
          { role: "other", content: "小周，这几份报告你今天做完，另外明天的PPT你也顺便做了。" },
          { role: "self", content: "李姐，今天手上已经有三份报告了，再加这些可能做不完。" },
          { role: "other", content: "实习就是学东西的，多做一点怎么了？我当年实习比你忙十倍。" },
          { role: "self", content: "我很愿意学习，也一直在认真完成每项任务。只是想确认一下优先级，哪个最急？" },
          { role: "other", content: "都急。做不完就加班嘛，年轻人别这么计较。" },
        ],
      },
      {
        id: "coach-scholarship-appeal",
        label: "奖学金评定申诉",
        description: "综合测评排名第一但奖学金给了别人，需要向辅导员申诉",
        goal: "争取到应得的奖学金名额，或至少获得合理解释",
        messages: [
          { role: "self", content: "李老师，我想问一下今年国奖名额的事。我综测排名年级第一，但名单上没有我。" },
          { role: "other", content: "这个是评审委员会的决定，综测成绩只是参考因素之一。" },
          { role: "self", content: "那请问还参考了哪些因素？评审标准能公开吗？" },
          { role: "other", content: "主要还看科研成果、社会实践这些。你的论文发表数量不如排第二的同学。" },
          { role: "self", content: "可是评审细则里并没有论文数量这一项。而且我有两个省级竞赛获奖，这个应该也算科研成果吧？" },
          { role: "other", content: "嗯...你把你的材料重新整理一份给我，我帮你反映一下。" },
        ],
      },
    ],
  },
];

export function getAllCoachExamples(): CoachExample[] {
  return COACH_EXAMPLE_CATEGORIES.flatMap((c) => c.examples);
}
