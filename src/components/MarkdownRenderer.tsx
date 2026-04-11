"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className = "" }: Props) {
  return (
    <div className={`markdown-body ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-base font-bold text-zinc-100 mb-3 mt-4 first:mt-0 border-b border-zinc-700/50 pb-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm font-bold text-zinc-200 mb-2 mt-4 first:mt-0 flex items-center gap-1.5">
              <span className="w-1 h-4 rounded-full bg-violet-500 shrink-0" />
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs font-semibold text-zinc-300 mb-1.5 mt-3 first:mt-0">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-xs font-medium text-zinc-400 mb-1 mt-2">{children}</h4>
          ),
          p: ({ children }) => (
            <p className="text-xs text-zinc-300 leading-relaxed mb-2 last:mb-0">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-zinc-100">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="text-violet-300 not-italic font-medium">{children}</em>
          ),
          ul: ({ children }) => (
            <ul className="space-y-1 mb-2 ml-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="space-y-1 mb-2 ml-1 list-decimal list-inside">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-xs text-zinc-300 leading-relaxed flex items-start gap-1.5">
              <span className="text-violet-500 mt-1 shrink-0">•</span>
              <span>{children}</span>
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-amber-500/50 bg-amber-500/5 rounded-r-lg pl-3 pr-2 py-2 my-2 text-xs text-amber-200/80 italic">
              {children}
            </blockquote>
          ),
          code: ({ children, className: codeClassName }) => {
            const isBlock = codeClassName?.includes("language-");
            if (isBlock) {
              return (
                <pre className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 my-2 overflow-x-auto">
                  <code className="text-[11px] font-mono text-emerald-300 leading-relaxed">{children}</code>
                </pre>
              );
            }
            return (
              <code className="bg-zinc-800 border border-zinc-700 rounded px-1 py-0.5 text-[11px] font-mono text-amber-300">
                {children}
              </code>
            );
          },
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 rounded-lg border border-zinc-700">
              <table className="w-full text-xs">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-zinc-800/80 border-b border-zinc-700">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-zinc-800">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-zinc-800/30 transition-colors">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-left text-[10px] font-semibold text-zinc-300 uppercase tracking-wider">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-xs text-zinc-300">{children}</td>
          ),
          hr: () => (
            <hr className="border-zinc-700/50 my-3" />
          ),
          a: ({ children, href }) => (
            <a href={href} className="text-violet-400 hover:text-violet-300 underline underline-offset-2" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
