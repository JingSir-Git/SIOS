/**
 * Export Report — generates a styled HTML report and opens browser print dialog.
 * Supports: Profile report, Dashboard report, Comparison report.
 * Uses window.print() → "Save as PDF" for zero-dependency PDF generation.
 */

import type { PersonProfile, ConversationSession, ProfileMemoryEntry, EQScoreEntry } from "./types";
import { DIMENSION_LABELS, DIMENSION_KEYS, type DimensionKey } from "./types";

// ---- Shared styles ----

const BASE_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans SC', sans-serif;
    color: #1a1a1a;
    background: #fff;
    font-size: 12px;
    line-height: 1.6;
    padding: 20mm 15mm;
  }
  h1 { font-size: 22px; margin-bottom: 4px; color: #1a1a1a; }
  h2 { font-size: 16px; margin: 20px 0 8px; color: #333; border-bottom: 1px solid #e5e5e5; padding-bottom: 4px; }
  h3 { font-size: 13px; margin: 12px 0 6px; color: #555; }
  .subtitle { font-size: 11px; color: #888; margin-bottom: 16px; }
  .header { text-align: center; margin-bottom: 24px; }
  .header .brand { font-size: 10px; color: #8b5cf6; letter-spacing: 2px; margin-bottom: 4px; }
  .section { margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0; }
  th, td { padding: 6px 8px; text-align: left; border: 1px solid #e5e5e5; font-size: 11px; }
  th { background: #f5f5f5; font-weight: 600; color: #444; }
  .dim-bar { display: inline-block; height: 8px; border-radius: 4px; background: #8b5cf6; }
  .dim-track { display: inline-block; height: 8px; border-radius: 4px; background: #e5e5e5; width: 80px; position: relative; }
  .tag { display: inline-block; padding: 1px 6px; border-radius: 3px; background: #f3f0ff; color: #7c3aed; font-size: 10px; margin-right: 4px; }
  .alert-box { padding: 8px 12px; border-radius: 6px; margin-bottom: 8px; font-size: 11px; }
  .alert-warning { background: #fffbeb; border: 1px solid #fbbf24; color: #92400e; }
  .alert-info { background: #eff6ff; border: 1px solid #60a5fa; color: #1e40af; }
  .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 12px 0; }
  .stat-card { text-align: center; padding: 10px; border: 1px solid #e5e5e5; border-radius: 8px; }
  .stat-card .value { font-size: 20px; font-weight: 700; color: #1a1a1a; }
  .stat-card .label { font-size: 9px; color: #888; margin-top: 2px; }
  .footer { text-align: center; margin-top: 30px; padding-top: 12px; border-top: 1px solid #e5e5e5; font-size: 9px; color: #aaa; }
  @media print {
    body { padding: 10mm; }
    .no-print { display: none; }
  }
`;

function openPrintWindow(title: string, body: string) {
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>${BASE_CSS}</style>
</head>
<body>
${body}
<div class="footer">
  SIOS — Social Intelligence OS · 生成时间 ${new Date().toLocaleString("zh-CN")}
</div>
</body>
</html>`;

  const w = window.open("", "_blank");
  if (!w) {
    alert("请允许弹出窗口以导出报告");
    return;
  }
  w.document.write(html);
  w.document.close();
  // Small delay to let styles render
  setTimeout(() => w.print(), 600);
}

// ---- Profile Report ----

export function exportProfileReport(
  profile: PersonProfile,
  linkedConversations: ConversationSession[],
  memories: ProfileMemoryEntry[],
) {
  const dims = DIMENSION_KEYS.map((key) => {
    const d = profile.dimensions[key];
    return {
      label: DIMENSION_LABELS[key].zh,
      value: d?.value ?? 50,
      confidence: d?.confidence ?? 0,
    };
  });

  const profileMems = memories.filter((m) => m.profileId === profile.id && !m.archived);

  const body = `
    <div class="header">
      <div class="brand">SIOS · SOCIAL INTELLIGENCE OS</div>
      <h1>${profile.name} — 人物分析报告</h1>
      <div class="subtitle">
        创建于 ${new Date(profile.createdAt).toLocaleDateString("zh-CN")}
        · 更新于 ${new Date(profile.updatedAt).toLocaleDateString("zh-CN")}
        · ${linkedConversations.length} 次对话
        · ${profile.totalMessages} 条消息
      </div>
    </div>

    ${profile.tags && profile.tags.length > 0 ? `
      <div class="section">
        <h2>标签</h2>
        ${profile.tags.map((t) => `<span class="tag">${t}</span>`).join("")}
      </div>
    ` : ""}

    ${profile.notes ? `
      <div class="section">
        <h2>备注</h2>
        <p style="font-size: 11px; color: #555;">${profile.notes}</p>
      </div>
    ` : ""}

    <div class="section">
      <h2>八维心理画像</h2>
      <table>
        <thead>
          <tr><th>维度</th><th>数值</th><th>可视化</th><th>置信度</th></tr>
        </thead>
        <tbody>
          ${dims.map((d) => `
            <tr>
              <td>${d.label}</td>
              <td style="font-weight: 600;">${d.value}</td>
              <td>
                <span class="dim-track">
                  <span class="dim-bar" style="width: ${d.value * 0.8}px;"></span>
                </span>
              </td>
              <td>${d.confidence}%</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>

    ${profile.communicationStyle ? `
      <div class="section">
        <h2>沟通风格</h2>
        <p style="font-size: 11px;"><strong>类型：</strong>${profile.communicationStyle.overallType || "—"}</p>
        <p style="font-size: 11px;"><strong>优势：</strong>${profile.communicationStyle.strengths?.join("、") || "—"}</p>
        <p style="font-size: 11px;"><strong>弱点：</strong>${profile.communicationStyle.weaknesses?.join("、") || "—"}</p>
      </div>
    ` : ""}

    ${profileMems.length > 0 ? `
      <div class="section">
        <h2>AI 记忆（${profileMems.length}条）</h2>
        <table>
          <thead><tr><th>类别</th><th>内容</th><th>重要性</th><th>日期</th></tr></thead>
          <tbody>
            ${profileMems.sort((a, b) => b.importance - a.importance).slice(0, 20).map((m) => `
              <tr>
                <td>${m.category}</td>
                <td style="max-width: 300px;">${m.content}</td>
                <td>★${"★".repeat(m.importance - 1)}</td>
                <td>${new Date(m.createdAt).toLocaleDateString("zh-CN")}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        ${profileMems.length > 20 ? `<p style="font-size: 10px; color: #999;">仅展示前20条，共 ${profileMems.length} 条记忆。</p>` : ""}
      </div>
    ` : ""}

    ${linkedConversations.length > 0 ? `
      <div class="section">
        <h2>关联对话记录</h2>
        <table>
          <thead><tr><th>标题</th><th>时间</th><th>消息数</th><th>已分析</th></tr></thead>
          <tbody>
            ${linkedConversations.slice(0, 15).map((c) => `
              <tr>
                <td>${c.title || "无标题"}</td>
                <td>${new Date(c.createdAt).toLocaleDateString("zh-CN")}</td>
                <td>${c.messages.length}</td>
                <td>${c.analysis ? "✓" : "—"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    ` : ""}
  `;

  openPrintWindow(`${profile.name} — SIOS人物分析报告`, body);
}

// ---- Dashboard Report ----

export function exportDashboardReport(
  profiles: PersonProfile[],
  conversations: ConversationSession[],
  eqScores: EQScoreEntry[],
  memories: ProfileMemoryEntry[],
  alertsHtml: string,
) {
  const totalMessages = conversations.reduce((s, c) => s + c.messages.length, 0);
  const analyzed = conversations.filter((c) => c.analysis).length;
  const avgEQ = eqScores.length > 0
    ? Math.round(eqScores.reduce((s, e) => s + e.overallScore, 0) / eqScores.length)
    : 0;

  const body = `
    <div class="header">
      <div class="brand">SIOS · SOCIAL INTELLIGENCE OS</div>
      <h1>数据大盘报告</h1>
      <div class="subtitle">生成时间：${new Date().toLocaleString("zh-CN")}</div>
    </div>

    <div class="stat-grid">
      <div class="stat-card">
        <div class="value">${profiles.length}</div>
        <div class="label">人物画像</div>
      </div>
      <div class="stat-card">
        <div class="value">${conversations.length}</div>
        <div class="label">对话总数</div>
      </div>
      <div class="stat-card">
        <div class="value">${analyzed}</div>
        <div class="label">已分析</div>
      </div>
      <div class="stat-card">
        <div class="value">${avgEQ || "—"}</div>
        <div class="label">平均EQ</div>
      </div>
    </div>

    <div class="section">
      <h2>消息统计</h2>
      <p style="font-size: 11px;">
        共 ${totalMessages} 条消息，${analyzed} 次分析（覆盖率 ${conversations.length ? Math.round(analyzed / conversations.length * 100) : 0}%），
        AI记忆 ${memories.filter((m) => !m.archived).length} 条。
      </p>
    </div>

    ${alertsHtml ? `
      <div class="section">
        <h2>趋势预警</h2>
        ${alertsHtml}
      </div>
    ` : ""}

    ${profiles.length > 0 ? `
      <div class="section">
        <h2>人物画像总览</h2>
        <table>
          <thead><tr><th>姓名</th><th>标签</th><th>对话数</th><th>互动次数</th><th>更新日期</th></tr></thead>
          <tbody>
            ${profiles.map((p) => {
              const convCount = conversations.filter(
                (c) => c.linkedProfileId === p.id || c.title?.includes(p.name)
              ).length;
              return `
                <tr>
                  <td style="font-weight: 600;">${p.name}</td>
                  <td>${(p.tags || []).map((t) => `<span class="tag">${t}</span>`).join("") || "—"}</td>
                  <td>${convCount}</td>
                  <td>${p.totalMessages}</td>
                  <td>${new Date(p.updatedAt).toLocaleDateString("zh-CN")}</td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    ` : ""}

    ${eqScores.length > 0 ? `
      <div class="section">
        <h2>EQ成长记录</h2>
        <table>
          <thead><tr><th>日期</th><th>综合得分</th><th>共情准确</th><th>表达精准</th><th>时机把控</th><th>策略有效</th><th>关系维护</th></tr></thead>
          <tbody>
            ${[...eqScores].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10).map((e) => `
              <tr>
                <td>${new Date(e.createdAt).toLocaleDateString("zh-CN")}</td>
                <td style="font-weight: 600;">${e.overallScore}</td>
                <td>${e.dimensionScores.empathyAccuracy}</td>
                <td>${e.dimensionScores.expressionPrecision}</td>
                <td>${e.dimensionScores.timingControl}</td>
                <td>${e.dimensionScores.strategyEffectiveness}</td>
                <td>${e.dimensionScores.relationshipMaintenance}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    ` : ""}
  `;

  openPrintWindow("SIOS — 数据大盘报告", body);
}

// ---- Chat Session Report (Legal / Psychology / Divination) ----

interface ChatExportMessage {
  role: "user" | "advisor" | "counselor" | "assistant";
  content: string;
}

const CHAT_CSS = `
  .msg { margin-bottom: 12px; }
  .msg-user { margin-left: 20%; }
  .msg-user .bubble { background: #f3f0ff; border: 1px solid #e9e3ff; border-radius: 12px 12px 4px 12px; padding: 10px 14px; }
  .msg-ai .bubble { background: #f8f9fa; border: 1px solid #e5e5e5; border-radius: 12px 12px 12px 4px; padding: 10px 14px; }
  .msg .role { font-size: 9px; color: #888; margin-bottom: 2px; }
  .msg .text { font-size: 11px; color: #333; line-height: 1.7; white-space: pre-wrap; }
  .disclaimer { background: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 8px 12px; font-size: 10px; color: #856404; margin-bottom: 16px; }
`;

export function exportChatSessionReport({
  title,
  subtitle,
  messages,
  disclaimer,
  metadata,
}: {
  title: string;
  subtitle: string;
  messages: ChatExportMessage[];
  disclaimer?: string;
  metadata?: Record<string, string>;
}) {
  const metaHtml = metadata
    ? `<div class="section"><table>${Object.entries(metadata).map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join("")}</table></div>`
    : "";

  const disclaimerHtml = disclaimer
    ? `<div class="disclaimer">⚠️ ${disclaimer}</div>`
    : "";

  const messagesHtml = messages.map((m) => {
    const isUser = m.role === "user";
    return `
      <div class="msg ${isUser ? "msg-user" : "msg-ai"}">
        <div class="role">${isUser ? "用户" : title.includes("法律") ? "法律顾问" : title.includes("心理") ? "心理顾问" : "AI"}</div>
        <div class="bubble"><div class="text">${escapeHtml(m.content)}</div></div>
      </div>
    `;
  }).join("");

  const body = `
    <style>${CHAT_CSS}</style>
    <div class="header">
      <div class="brand">SIOS · SOCIAL INTELLIGENCE OS</div>
      <h1>${title}</h1>
      <div class="subtitle">${subtitle}</div>
    </div>
    ${disclaimerHtml}
    ${metaHtml}
    <div class="section">
      <h2>对话记录</h2>
      ${messagesHtml}
    </div>
  `;

  openPrintWindow(`SIOS — ${title}`, body);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
}

// ---- Divination Record Report ----

export function exportDivinationReport(records: { category: string; categoryLabel: string; question: string; answer: string; ritualResult?: string; createdAt: string }[]) {
  const recordsHtml = records.map((r) => `
    <div class="section" style="page-break-inside: avoid;">
      <h3>${r.categoryLabel} · ${new Date(r.createdAt).toLocaleDateString("zh-CN")}</h3>
      ${r.ritualResult ? `<p style="font-size: 10px; color: #7c3aed; margin-bottom: 4px;">🎯 ${escapeHtml(r.ritualResult)}</p>` : ""}
      <p style="font-size: 11px; color: #333; margin-bottom: 6px;"><strong>问:</strong> ${escapeHtml(r.question)}</p>
      <div style="font-size: 11px; color: #555; line-height: 1.7; white-space: pre-wrap; border-left: 3px solid #e9e3ff; padding-left: 12px;">${escapeHtml(r.answer)}</div>
    </div>
  `).join('<hr style="border: none; border-top: 1px solid #eee; margin: 12px 0;">');

  const body = `
    <div class="header">
      <div class="brand">SIOS · SOCIAL INTELLIGENCE OS</div>
      <h1>风水玄学 — 占卜记录报告</h1>
      <div class="subtitle">共 ${records.length} 条记录 · 导出于 ${new Date().toLocaleDateString("zh-CN")}</div>
    </div>
    <div class="disclaimer">⚠️ 占卜结果仅供参考，不构成任何决策依据。</div>
    ${recordsHtml}
  `;

  openPrintWindow("SIOS — 占卜记录报告", body);
}
