"use client";

// ============================================================
// SectionedMarkdown — Renders markdown split by ## headings
// into beautiful colored panel cards
// ============================================================

import { useMemo } from "react";
import {
  Scale,
  BookOpen,
  Shield,
  AlertTriangle,
  Lightbulb,
  FileText,
  Gavel,
  Target,
  TrendingUp,
  HelpCircle,
  Star,
  Compass,
  Sparkles,
  Eye,
  Heart,
  Brain,
  Zap,
  CheckCircle,
  Info,
  type LucideIcon,
} from "lucide-react";
import MarkdownRenderer from "./MarkdownRenderer";

interface Section {
  heading: string;
  content: string;
}

// Map heading keywords to icon + color
const SECTION_STYLES: { keywords: string[]; icon: LucideIcon; borderColor: string; iconColor: string; bgColor: string; headingColor: string }[] = [
  { keywords: ["法律依据", "法律条文", "法条", "法规", "法律分析"], icon: Scale, borderColor: "border-blue-500/25", iconColor: "text-blue-400", bgColor: "bg-blue-500/5", headingColor: "text-blue-300" },
  { keywords: ["实操", "操作", "步骤", "维权", "流程", "行动", "具体做法", "如何"], icon: Target, borderColor: "border-emerald-500/25", iconColor: "text-emerald-400", bgColor: "bg-emerald-500/5", headingColor: "text-emerald-300" },
  { keywords: ["风险", "注意", "警告", "提醒", "特别注意"], icon: AlertTriangle, borderColor: "border-amber-500/25", iconColor: "text-amber-400", bgColor: "bg-amber-500/5", headingColor: "text-amber-300" },
  { keywords: ["费用", "成本", "赔偿", "金额", "计算"], icon: TrendingUp, borderColor: "border-cyan-500/25", iconColor: "text-cyan-400", bgColor: "bg-cyan-500/5", headingColor: "text-cyan-300" },
  { keywords: ["替代", "方案", "选择", "路径", "建议", "策略", "对策"], icon: Lightbulb, borderColor: "border-violet-500/25", iconColor: "text-violet-400", bgColor: "bg-violet-500/5", headingColor: "text-violet-300" },
  { keywords: ["证据", "材料", "收集", "准备"], icon: FileText, borderColor: "border-indigo-500/25", iconColor: "text-indigo-400", bgColor: "bg-indigo-500/5", headingColor: "text-indigo-300" },
  { keywords: ["免责", "声明", "disclaimer", "说明"], icon: Shield, borderColor: "border-zinc-500/25", iconColor: "text-zinc-500", bgColor: "bg-zinc-500/5", headingColor: "text-zinc-400" },
  { keywords: ["总结", "结论", "小结", "综合", "概述"], icon: CheckCircle, borderColor: "border-emerald-500/25", iconColor: "text-emerald-400", bgColor: "bg-emerald-500/5", headingColor: "text-emerald-300" },
  { keywords: ["判决", "裁判", "判例", "案例"], icon: Gavel, borderColor: "border-orange-500/25", iconColor: "text-orange-400", bgColor: "bg-orange-500/5", headingColor: "text-orange-300" },
  { keywords: ["问题", "追问", "进一步"], icon: HelpCircle, borderColor: "border-rose-500/25", iconColor: "text-rose-400", bgColor: "bg-rose-500/5", headingColor: "text-rose-300" },
  // Divination-specific
  { keywords: ["卦象", "卦辞", "爻辞", "解卦", "卦意", "卦名"], icon: Compass, borderColor: "border-amber-500/25", iconColor: "text-amber-400", bgColor: "bg-amber-500/5", headingColor: "text-amber-300" },
  { keywords: ["运势", "吉凶", "结果", "预测"], icon: Star, borderColor: "border-yellow-500/25", iconColor: "text-yellow-400", bgColor: "bg-yellow-500/5", headingColor: "text-yellow-300" },
  { keywords: ["面相", "手相", "痣相", "五官", "面部"], icon: Eye, borderColor: "border-pink-500/25", iconColor: "text-pink-400", bgColor: "bg-pink-500/5", headingColor: "text-pink-300" },
  { keywords: ["姻缘", "感情", "桃花", "情感", "婚姻"], icon: Heart, borderColor: "border-rose-500/25", iconColor: "text-rose-400", bgColor: "bg-rose-500/5", headingColor: "text-rose-300" },
  { keywords: ["事业", "财运", "职场", "财"], icon: TrendingUp, borderColor: "border-emerald-500/25", iconColor: "text-emerald-400", bgColor: "bg-emerald-500/5", headingColor: "text-emerald-300" },
  { keywords: ["健康", "身体", "养生"], icon: Zap, borderColor: "border-green-500/25", iconColor: "text-green-400", bgColor: "bg-green-500/5", headingColor: "text-green-300" },
  { keywords: ["化解", "调整", "改善", "破解", "趋吉避凶"], icon: Sparkles, borderColor: "border-violet-500/25", iconColor: "text-violet-400", bgColor: "bg-violet-500/5", headingColor: "text-violet-300" },
  { keywords: ["深层", "心理", "潜意识", "内在", "解读"], icon: Brain, borderColor: "border-fuchsia-500/25", iconColor: "text-fuchsia-400", bgColor: "bg-fuchsia-500/5", headingColor: "text-fuchsia-300" },
  { keywords: ["分析", "详解", "解析"], icon: BookOpen, borderColor: "border-sky-500/25", iconColor: "text-sky-400", bgColor: "bg-sky-500/5", headingColor: "text-sky-300" },
];

const DEFAULT_STYLE = { icon: Info, borderColor: "border-zinc-700/40", iconColor: "text-zinc-400", bgColor: "bg-zinc-800/20", headingColor: "text-zinc-300" };

function getStyleForHeading(heading: string) {
  const lower = heading.toLowerCase();
  for (const style of SECTION_STYLES) {
    if (style.keywords.some((kw) => lower.includes(kw))) {
      return style;
    }
  }
  return DEFAULT_STYLE;
}

/** Split markdown by ## headings into sections. Leading content without a heading goes into a preamble. */
function parseSections(content: string): { preamble: string; sections: Section[] } {
  const lines = content.split("\n");
  let preamble = "";
  const sections: Section[] = [];
  let currentHeading = "";
  let currentLines: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,3}\s+(.+)/);
    if (headingMatch) {
      // Save previous section
      if (currentHeading) {
        sections.push({ heading: currentHeading, content: currentLines.join("\n").trim() });
      } else if (currentLines.length > 0) {
        preamble = currentLines.join("\n").trim();
      }
      currentHeading = headingMatch[1].trim();
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  // Final section
  if (currentHeading) {
    sections.push({ heading: currentHeading, content: currentLines.join("\n").trim() });
  } else if (currentLines.length > 0 && !preamble) {
    preamble = currentLines.join("\n").trim();
  }

  return { preamble, sections };
}

interface SectionedMarkdownProps {
  content: string;
  /** Minimum number of sections to activate panel mode; below this, use plain markdown */
  minSections?: number;
  className?: string;
}

export default function SectionedMarkdown({ content, minSections = 2, className = "" }: SectionedMarkdownProps) {
  const { preamble, sections } = useMemo(() => parseSections(content), [content]);

  // Fall back to plain markdown if not enough sections
  if (sections.length < minSections) {
    return <MarkdownRenderer content={content} className={className} />;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Preamble (text before first heading) */}
      {preamble && (
        <div className="text-xs text-zinc-300 leading-relaxed">
          <MarkdownRenderer content={preamble} />
        </div>
      )}

      {/* Section panels */}
      {sections.map((section, i) => {
        const style = getStyleForHeading(section.heading);
        const Icon = style.icon;
        return (
          <div
            key={i}
            className={`rounded-lg border ${style.borderColor} ${style.bgColor} overflow-hidden animate-in fade-in-0 slide-in-from-bottom-1 duration-200`}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-center gap-2 px-3.5 py-2">
              <Icon className={`h-3.5 w-3.5 ${style.iconColor} shrink-0`} />
              <span className={`text-[11px] font-semibold ${style.headingColor} tracking-wide`}>
                {section.heading}
              </span>
            </div>
            {section.content && (
              <div className="px-3.5 pb-3 -mt-0.5">
                <MarkdownRenderer content={section.content} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
