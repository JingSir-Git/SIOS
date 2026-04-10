"use client";

// ============================================================
// StreamingIndicator — Shows LLM "thinking" animation during streaming
// ============================================================

import { useEffect, useRef, useState } from "react";

interface StreamingIndicatorProps {
  /** Accumulated raw text from the LLM stream */
  text: string;
  /** Label shown above the animation */
  label?: string;
  /** Whether to show the text content (some routes output JSON which isn't helpful to show) */
  showText?: boolean;
  /** Optional abort handler */
  onAbort?: () => void;
}

export default function StreamingIndicator({
  text,
  label = "AI 正在思考中...",
  showText = false,
  onAbort,
}: StreamingIndicatorProps) {
  const textRef = useRef<HTMLDivElement>(null);
  const [dots, setDots] = useState("");

  // Animate dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll text
  useEffect(() => {
    if (textRef.current) {
      textRef.current.scrollTop = textRef.current.scrollHeight;
    }
  }, [text]);

  const charCount = text.length;

  return (
    <div className="flex flex-col items-center gap-4 py-8 animate-in fade-in duration-300">
      {/* Pulsing brain animation */}
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
          <span className="text-3xl animate-pulse">🧠</span>
        </div>
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 animate-ping opacity-30" />
      </div>

      {/* Label */}
      <div className="text-center">
        <p className="text-sm font-medium text-zinc-300">
          {label}{dots}
        </p>
        {charCount > 0 && (
          <p className="text-xs text-zinc-500 mt-1">
            已生成 {charCount.toLocaleString()} 字符
          </p>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-48 h-1 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-300"
          style={{
            width: "100%",
            animation: "shimmer 1.5s ease-in-out infinite",
          }}
        />
      </div>

      {/* Optional streaming text preview */}
      {showText && text.length > 0 && (
        <div
          ref={textRef}
          className="w-full max-w-2xl max-h-32 overflow-y-auto rounded-lg bg-zinc-900/50 border border-zinc-800 p-3 text-xs text-zinc-500 font-mono whitespace-pre-wrap break-all"
        >
          {text.slice(-500)}
        </div>
      )}

      {/* Abort button */}
      {onAbort && (
        <button
          onClick={onAbort}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-3 py-1 rounded border border-zinc-800 hover:border-zinc-600"
        >
          取消生成
        </button>
      )}

      <style jsx>{`
        @keyframes shimmer {
          0% { opacity: 0.5; transform: translateX(-100%); }
          50% { opacity: 1; transform: translateX(0); }
          100% { opacity: 0.5; transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
