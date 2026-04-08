// ============================================================
// API Route: /api/strategy — Conversation Strategy Planner
// ============================================================

import { NextRequest } from "next/server";
import { callLLM } from "@/lib/api-client";
import { extractJSON } from "@/lib/extract-json";

const STRATEGY_SYSTEM_PROMPT = `你是 Social Intelligence OS 的策略规划引擎——一个顶级的谈判策略顾问。你为用户即将到来的重要对话制定完整的策略方案。

你的策略必须：
1. 【基于画像】如果有对方的画像数据，利用每一个已知维度来定制策略
2. 【多步博弈】不只考虑第一步，而是规划多步棋——如果对方这样反应，用户如何应对
3. 【心理学原理】融入实用的心理学和谈判学原理（锚定效应、互惠原则、BATNA等）
4. 【具体可执行】每个建议都要具体到用词级别，不说空话
5. 【风险意识】识别可能出错的场景并提供预案

【关键输出规则】
1. 你的回复必须是且仅是一个合法的JSON对象。
2. 禁止在JSON前后添加任何文字、解释、markdown代码块标记或其他内容。
3. 不要使用\`\`\`json或\`\`\`包裹。直接输出{开头，}结尾。
4. JSON中的字符串值使用中文。
5. 确保所有JSON字段名使用英文驼峰命名。`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { objective, context, profileInfo } = body;

    if (!objective || typeof objective !== "string") {
      return Response.json(
        { error: "objective field is required" },
        { status: 400 }
      );
    }

    let userPrompt = `请为以下即将到来的对话制定完整的策略方案。

## 核心目标
${objective}`;

    if (context) {
      userPrompt += `\n\n## 背景情况\n${context}`;
    }

    if (profileInfo) {
      userPrompt += `\n\n## 对方画像数据\n${profileInfo}`;
    }

    userPrompt += `\n\n## 输出要求
直接输出JSON（不要包裹在代码块中）：
{
  "objective": "用一句话重新表述核心目标",
  "estimatedDifficulty": "低/中/高/极高",
  "successProbability": 65,
  "openingMoves": [
    "开场策略1——具体到用什么话开头",
    "开场策略2——备选开场方式"
  ],
  "keyPoints": [
    {
      "topic": "需要讨论的关键议题",
      "approach": "主攻策略——具体的措辞和论证方式",
      "fallback": "如果主攻受阻的备选方案",
      "expectedResistance": "预期对方的反对理由和应对方式"
    }
  ],
  "riskMitigation": ["风险1及对策", "风险2及对策"],
  "batna": "如果谈判失败，你的最佳替代方案是什么",
  "redLines": ["绝不能让步的底线1", "底线2"],
  "psychologicalTactics": ["可以使用的心理策略1", "策略2"]
}`;

    const raw = await callLLM({
      system: STRATEGY_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
      maxTokens: 6000,
    });

    const { data: strategy, error: parseError } = extractJSON(raw);

    if (!strategy || parseError) {
      console.error("Strategy JSON parse error:", parseError);
      return Response.json(
        { error: `策略生成解析失败: ${parseError}` },
        { status: 500 }
      );
    }

    return Response.json(strategy);
  } catch (error: unknown) {
    console.error("Strategy error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
