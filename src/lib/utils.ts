// ============================================================
// Utility functions
// ============================================================

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHour = Math.floor(diffMs / 3_600_000);
  const diffDay = Math.floor(diffMs / 86_400_000);

  // Show relative time for recent dates
  if (diffMin < 1) return "刚刚";
  if (diffMin < 60) return `${diffMin}分钟前`;
  if (diffHour < 24) return `${diffHour}小时前`;
  if (diffDay < 2) return "昨天 " + date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  if (diffDay < 7) return `${diffDay}天前`;

  // Beyond a week, show full date
  const sameYear = date.getFullYear() === now.getFullYear();
  if (sameYear) {
    return date.toLocaleDateString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len) + "...";
}

export function getConfidenceColor(confidence: number): string {
  if (confidence >= 70) return "text-emerald-400";
  if (confidence >= 40) return "text-amber-400";
  return "text-zinc-500";
}

export function getConfidenceLabel(confidence: number): string {
  if (confidence >= 80) return "高置信";
  if (confidence >= 60) return "中高置信";
  if (confidence >= 40) return "中置信";
  if (confidence >= 20) return "低置信";
  return "信息不足";
}

export function getEmotionColor(value: number): string {
  if (value > 0.5) return "#22c55e";
  if (value > 0.2) return "#86efac";
  if (value > -0.2) return "#fbbf24";
  if (value > -0.5) return "#fb923c";
  return "#ef4444";
}

export function getTipTypeColor(type: string): string {
  switch (type) {
    case "opportunity": return "border-emerald-500/50 bg-emerald-500/10 text-emerald-300";
    case "warning": return "border-amber-500/50 bg-amber-500/10 text-amber-300";
    case "insight": return "border-blue-500/50 bg-blue-500/10 text-blue-300";
    case "suggestion": return "border-violet-500/50 bg-violet-500/10 text-violet-300";
    default: return "border-zinc-500/50 bg-zinc-500/10 text-zinc-300";
  }
}

export function getTipTypeIcon(type: string): string {
  switch (type) {
    case "opportunity": return "🎯";
    case "warning": return "⚠️";
    case "insight": return "💡";
    case "suggestion": return "💬";
    default: return "📌";
  }
}
