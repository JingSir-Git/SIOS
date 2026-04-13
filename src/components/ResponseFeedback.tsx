"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown, MessageSquare, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import type { FeedbackModule, FeedbackRating } from "@/lib/types";

interface ResponseFeedbackProps {
  /** Unique ID of the AI response message */
  messageId: string;
  /** Which module this feedback belongs to */
  module: FeedbackModule;
  /** Truncated snippet of the AI response for context */
  responseSnippet?: string;
  /** Compact mode — smaller buttons, inline */
  compact?: boolean;
  /** Custom className */
  className?: string;
}

export default function ResponseFeedback({
  messageId,
  module,
  responseSnippet,
  compact = false,
  className,
}: ResponseFeedbackProps) {
  const { addResponseFeedback, responseFeedback } = useAppStore();
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Check if already rated
  const existing = responseFeedback.find(
    (f) => f.messageId === messageId
  );
  const currentRating = existing?.rating || null;

  const handleRate = (rating: FeedbackRating) => {
    if (submitted || currentRating) return;

    addResponseFeedback({
      id: `fb_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      module,
      messageId,
      rating,
      responseSnippet: responseSnippet?.slice(0, 200),
      createdAt: new Date().toISOString(),
    });

    if (rating === "down") {
      setShowComment(true);
    } else {
      setSubmitted(true);
    }
  };

  const handleSubmitComment = () => {
    if (!comment.trim()) {
      setShowComment(false);
      setSubmitted(true);
      return;
    }

    // Update the latest feedback entry with comment
    const latest = useAppStore.getState().responseFeedback.find(
      (f) => f.messageId === messageId
    );
    if (latest) {
      // Re-add with comment (store doesn't have update, so we just add)
      addResponseFeedback({
        ...latest,
        id: latest.id + "_c",
        comment: comment.trim(),
      });
    }

    setShowComment(false);
    setSubmitted(true);
  };

  if (submitted || currentRating) {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <div className="flex items-center gap-1 text-[9px] text-zinc-600">
          {currentRating === "up" || (!currentRating && submitted) ? (
            <>
              <ThumbsUp className="h-3 w-3 text-emerald-500/60" />
              <span className="text-emerald-500/60">感谢反馈</span>
            </>
          ) : (
            <>
              <ThumbsDown className="h-3 w-3 text-orange-400/60" />
              <span className="text-orange-400/60">已收到反馈</span>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <div className={cn(
        "flex items-center gap-1",
        compact ? "gap-0.5" : "gap-1"
      )}>
        <button
          onClick={() => handleRate("up")}
          className={cn(
            "group flex items-center justify-center rounded-md border transition-all",
            compact ? "w-6 h-6" : "w-7 h-7",
            "border-transparent hover:border-emerald-500/30 hover:bg-emerald-500/10"
          )}
          title="这个回答很好"
        >
          <ThumbsUp className={cn(
            "text-zinc-600 group-hover:text-emerald-400 transition-colors",
            compact ? "h-3 w-3" : "h-3.5 w-3.5"
          )} />
        </button>
        <button
          onClick={() => handleRate("down")}
          className={cn(
            "group flex items-center justify-center rounded-md border transition-all",
            compact ? "w-6 h-6" : "w-7 h-7",
            "border-transparent hover:border-orange-500/30 hover:bg-orange-500/10"
          )}
          title="这个回答需要改进"
        >
          <ThumbsDown className={cn(
            "text-zinc-600 group-hover:text-orange-400 transition-colors",
            compact ? "h-3 w-3" : "h-3.5 w-3.5"
          )} />
        </button>
      </div>

      {/* Comment input (shown after thumbs down) */}
      {showComment && (
        <div className="absolute bottom-full mb-2 left-0 z-10 w-64 rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl p-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
              <MessageSquare className="h-3 w-3" />
              <span>哪里可以改进？（可选）</span>
            </div>
            <button
              onClick={() => { setShowComment(false); setSubmitted(true); }}
              className="text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="例如：回答不够准确、缺少关键信息、分析太笼统..."
            rows={2}
            className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-2.5 py-1.5 text-[10px] text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 resize-none"
            autoFocus
          />
          <div className="flex justify-end mt-1.5">
            <button
              onClick={handleSubmitComment}
              className="flex items-center gap-1 rounded-md bg-violet-500/20 border border-violet-500/30 px-2.5 py-1 text-[9px] text-violet-300 hover:bg-violet-500/30 transition-colors"
            >
              <Check className="h-2.5 w-2.5" />
              提交
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
