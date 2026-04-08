// ============================================================
// API Route: /api/planning — Multi-Scale Life & Work Planner
// ============================================================

import { NextRequest } from "next/server";
import { callLLM } from "@/lib/api-client";
import { extractJSON } from "@/lib/extract-json";

const PLANNING_SYSTEM_PROMPT = `你是 Social Intelligence OS 的规划制定引擎——一个顶级的战略规划顾问。你帮助用户制定从日常事务到长期战略的各类计划。

你的规划必须：
1. 【目标导向】每个阶段都有清晰可衡量的目标和关键指标
2. 【时间精确】根据时间尺度给出合理的时间节点和里程碑
3. 【风险前瞻】识别每个阶段可能遇到的障碍并提供应对方案
4. 【资源明确】列出需要的关键资源（人、财、时间、技能、人脉）
5. 【可执行性】每一步都具体到可立即行动的粒度
6. 【弹性设计】包含应急预案和调整机制
7. 【依赖管理】明确任务间的前后依赖关系
8. 【用户友好】用通俗易懂的语言，避免空泛套话

时间尺度适配规则：
- hours（几小时）：精确到分钟级别的行动清单
- days（几天）：按天拆分，每天有明确任务
- weeks（几周）：按周规划，每周有里程碑
- months（几月）：按月/阶段规划，有阶段性成果
- years（几年）：按季度/年度规划，有长期愿景和阶段目标

【关键输出规则】
1. 你的回复必须是且仅是一个合法的JSON对象。
2. 禁止在JSON前后添加任何文字、解释、markdown代码块标记或其他内容。
3. 不要使用\`\`\`json或\`\`\`包裹。直接输出{开头，}结尾。
4. JSON中的字符串值使用中文。
5. 确保所有JSON字段名使用英文驼峰命名。`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { objective, context, domain, timeScale, constraints, preferences } = body;

    if (!objective || typeof objective !== "string") {
      return Response.json(
        { error: "objective field is required" },
        { status: 400 }
      );
    }

    const domainLabels: Record<string, string> = {
      daily: "日常事务",
      study: "学习计划",
      career: "职业发展",
      business: "商业创业",
      project: "项目管理",
      government: "政务决策",
      life: "人生规划",
    };

    const timeScaleLabels: Record<string, string> = {
      hours: "几小时内",
      days: "几天内",
      weeks: "几周内",
      months: "几个月内",
      years: "几年内",
    };

    let userPrompt = `请为以下目标制定一份详细的行动规划。

## 核心目标
${objective}

## 规划领域
${domainLabels[domain] || domain || "通用"}

## 时间尺度
${timeScaleLabels[timeScale] || timeScale || "根据目标自动判断"}`;

    if (context) {
      userPrompt += `\n\n## 当前情况与背景\n${context}`;
    }

    if (constraints) {
      userPrompt += `\n\n## 约束条件\n${constraints}`;
    }

    if (preferences) {
      userPrompt += `\n\n## 用户偏好与倾向\n${preferences}`;
    }

    userPrompt += `\n\n## 输出要求
直接输出JSON（不要包裹在代码块中）：
{
  "title": "规划方案标题",
  "domain": "${domain || "daily"}",
  "timeScale": "${timeScale || "weeks"}",
  "totalDuration": "整体所需时间",
  "overallObjective": "用一句话概括核心目标",
  "currentSituation": "对用户当前情况的分析总结",
  "phases": [
    {
      "name": "阶段名称",
      "timeRange": "时间范围，如'第1-2周'",
      "objective": "本阶段目标",
      "milestones": [
        {
          "id": "m1",
          "title": "里程碑标题",
          "description": "具体描述和行动步骤",
          "deadline": "完成时间",
          "dependencies": [],
          "priority": "critical|high|medium|low",
          "status": "pending"
        }
      ],
      "risks": ["本阶段可能遇到的风险"],
      "keyMetrics": ["衡量本阶段成功的指标"]
    }
  ],
  "resourceRequirements": ["需要的资源1", "需要的资源2"],
  "riskMitigation": ["风险1及对策", "风险2及对策"],
  "successCriteria": ["成功标准1", "成功标准2"],
  "contingencyPlan": "如果主计划受阻的应急方案",
  "dailyHabits": ["每天需要坚持的小习惯1", "小习惯2"],
  "reviewSchedule": "建议的复盘频率和方式"
}

注意：
- phases 数组中至少包含2个阶段
- 每个阶段至少包含2个里程碑
- 里程碑的 dependencies 引用其他里程碑的 id
- priority 只能是 "critical"、"high"、"medium"、"low" 之一`;

    const raw = await callLLM({
      system: PLANNING_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
      maxTokens: 10000,
    });

    const { data: plan, error: parseError } = extractJSON(raw);

    if (!plan || parseError) {
      console.error("Planning JSON parse error:", parseError);
      return Response.json(
        { error: `规划生成解析失败: ${parseError}` },
        { status: 500 }
      );
    }

    return Response.json(plan);
  } catch (error: unknown) {
    console.error("Planning error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
