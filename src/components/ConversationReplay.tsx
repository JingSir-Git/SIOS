"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  FastForward,
  X,
  Zap,
  Heart,
  AlertTriangle,
  Lightbulb,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConversationSession, KeyMoment, EmotionPoint } from "@/lib/types";

interface Props {
  conversation: ConversationSession;
  onClose: () => void;
}

type PlaybackSpeed = 1 | 1.5 | 2 | 3;

export default function ConversationReplay({ conversation, onClose }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const analysis = conversation.analysis;
  const rawText = conversation.rawText || "";

  // Parse raw text into message lines
  const messageLines = rawText
    .split("\n")
    .filter((l) => l.trim())
    .map((line, idx) => {
      const match = line.trim().match(/^(?:\[.*?\]\s*)?(.{1,15}?)[：:]\s*(.+)$/);
      return {
        index: idx,
        sender: match ? match[1].trim() : "未知",
        content: match ? match[2].trim() : line.trim(),
        raw: line.trim(),
      };
    });

  // Visible messages up to current index
  const visibleMessages = messageLines.slice(0, currentIndex + 1);

  // Get key moments at current index
  const keyMomentsAtIndex = analysis?.keyMoments?.filter(
    (km: KeyMoment) => km.messageIndex <= currentIndex && km.messageIndex >= currentIndex - 1
  ) || [];

  // Get emotion at current index
  const currentEmotion = analysis?.emotionCurve?.reduce(
    (closest: EmotionPoint | null, ep: EmotionPoint) => {
      if (ep.messageIndex > currentIndex) return closest;
      if (!closest || ep.messageIndex > closest.messageIndex) return ep;
      return closest;
    },
    null
  );

  // Get all key moment indices for timeline markers
  const keyMomentIndices = new Set(
    analysis?.keyMoments?.map((km: KeyMoment) => km.messageIndex) || []
  );

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentIndex]);

  // Playback timer
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= messageLines.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 2000 / speed);
      intervalRef.current = interval;
      return () => clearInterval(interval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [isPlaying, speed, messageLines.length]);

  const togglePlay = useCallback(() => {
    if (currentIndex >= messageLines.length - 1) {
      setCurrentIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((prev) => !prev);
    }
  }, [currentIndex, messageLines.length]);

  const stepForward = useCallback(() => {
    setIsPlaying(false);
    setCurrentIndex((prev) => Math.min(prev + 1, messageLines.length - 1));
  }, [messageLines.length]);

  const stepBack = useCallback(() => {
    setIsPlaying(false);
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const restart = useCallback(() => {
    setIsPlaying(false);
    setCurrentIndex(0);
  }, []);

  const cycleSpeed = useCallback(() => {
    setSpeed((prev) => {
      const speeds: PlaybackSpeed[] = [1, 1.5, 2, 3];
      const idx = speeds.indexOf(prev);
      return speeds[(idx + 1) % speeds.length];
    });
  }, []);

  // Determine self sender
  const selfNames = new Set(["我", "自己", "me"]);
  const getSenderStyle = (sender: string) => {
    if (selfNames.has(sender)) {
      return "bg-violet-500/15 border-violet-500/30 text-violet-100 ml-auto";
    }
    return "bg-zinc-800/80 border-zinc-700/50 text-zinc-200";
  };

  const getSenderDotColor = (sender: string) => {
    if (selfNames.has(sender)) return "bg-violet-400";
    // Hash-based color for different participants
    const colors = ["bg-cyan-400", "bg-amber-400", "bg-emerald-400", "bg-pink-400", "bg-blue-400"];
    let hash = 0;
    for (let i = 0; i < sender.length; i++) hash = sender.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const getEmotionColor = (value: number) => {
    if (value > 0.3) return "text-emerald-400";
    if (value < -0.3) return "text-red-400";
    return "text-zinc-400";
  };

  const getEmotionLabel = (value: number) => {
    if (value > 0.6) return "非常积极";
    if (value > 0.3) return "积极";
    if (value > 0) return "略积极";
    if (value === 0) return "中性";
    if (value > -0.3) return "略消极";
    if (value > -0.6) return "消极";
    return "非常消极";
  };

  if (messageLines.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-6 text-center">
        <MessageSquare className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
        <p className="text-xs text-zinc-500">此对话无原始文本可用于回放</p>
        <button onClick={onClose} className="mt-3 text-xs text-violet-400 hover:text-violet-300">
          关闭
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 backdrop-blur-sm overflow-hidden flex flex-col max-h-[80vh]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3 bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-violet-400" />
          <span className="text-sm font-medium text-zinc-200">对话回放</span>
          <span className="text-[10px] text-zinc-500">
            {conversation.title}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Timeline Progress Bar */}
      <div className="px-4 pt-3 pb-1">
        <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden">
          {/* Progress fill */}
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-600 to-violet-400 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / messageLines.length) * 100}%` }}
          />
          {/* Key moment markers */}
          {Array.from(keyMomentIndices).map((idx) => (
            <button
              key={idx}
              onClick={() => { setIsPlaying(false); setCurrentIndex(idx as number); }}
              className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-400 border border-amber-500 hover:scale-150 transition-transform z-10"
              style={{ left: `${(((idx as number) + 0.5) / messageLines.length) * 100}%` }}
              title="关键时刻"
            />
          ))}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-zinc-600">{currentIndex + 1} / {messageLines.length}</span>
          {currentEmotion && (
            <span className={cn("text-[9px]", getEmotionColor(currentEmotion.selfEmotion))}>
              情绪: {getEmotionLabel(currentEmotion.selfEmotion)} ({currentEmotion.label})
            </span>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 min-h-[200px] max-h-[400px]">
        {visibleMessages.map((msg, i) => {
          const isSelf = selfNames.has(msg.sender);
          const isLatest = i === visibleMessages.length - 1;
          const hasKeyMoment = keyMomentIndices.has(msg.index);
          const keyMoment = analysis?.keyMoments?.find(
            (km: KeyMoment) => km.messageIndex === msg.index
          );

          return (
            <div key={msg.index} className={cn("space-y-1", isLatest && "animate-in fade-in-0 slide-in-from-bottom-2 duration-300")}>
              {/* Key moment annotation */}
              {hasKeyMoment && showAnnotations && keyMoment && (
                <div className={cn(
                  "flex items-start gap-2 rounded-lg px-3 py-2 text-[10px] border animate-in fade-in-0 duration-500",
                  keyMoment.impact === "positive"
                    ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-300"
                    : keyMoment.impact === "negative"
                    ? "bg-red-500/5 border-red-500/20 text-red-300"
                    : "bg-amber-500/5 border-amber-500/20 text-amber-300"
                )}>
                  <Zap className="h-3 w-3 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">关键时刻: </span>
                    {keyMoment.description}
                    {keyMoment.significance && (
                      <span className="text-zinc-500 ml-1">— {keyMoment.significance}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Message bubble */}
              <div className={cn(
                "flex items-start gap-2 max-w-[85%]",
                isSelf ? "ml-auto flex-row-reverse" : ""
              )}>
                <div className={cn("w-1.5 h-1.5 rounded-full mt-2 shrink-0", getSenderDotColor(msg.sender))} />
                <div className={cn(
                  "rounded-xl border px-3 py-2",
                  getSenderStyle(msg.sender),
                  isLatest && "ring-1 ring-violet-500/30"
                )}>
                  <div className="text-[9px] text-zinc-500 mb-0.5 font-medium">{msg.sender}</div>
                  <p className="text-xs leading-relaxed">{msg.content}</p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Annotation Panel (current insights) */}
      {showAnnotations && analysis && currentIndex > 0 && (
        <div className="border-t border-zinc-800 px-4 py-2 bg-zinc-900/70">
          <div className="flex items-center gap-3 text-[10px]">
            {currentEmotion && (
              <div className="flex items-center gap-1">
                <Heart className={cn("h-3 w-3", getEmotionColor(currentEmotion.selfEmotion))} />
                <span className="text-zinc-500">我:</span>
                <span className={getEmotionColor(currentEmotion.selfEmotion)}>
                  {Math.round(currentEmotion.selfEmotion * 100)}%
                </span>
                <span className="text-zinc-700 mx-1">|</span>
                <span className="text-zinc-500">对方:</span>
                <span className={getEmotionColor(currentEmotion.otherEmotion)}>
                  {Math.round(currentEmotion.otherEmotion * 100)}%
                </span>
              </div>
            )}
            {keyMomentsAtIndex.length > 0 && (
              <div className="flex items-center gap-1 text-amber-400">
                <AlertTriangle className="h-3 w-3" />
                <span>{keyMomentsAtIndex.length} 个关键点</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Playback Controls */}
      <div className="border-t border-zinc-800 px-4 py-3 bg-zinc-800/30 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={restart}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
            title="重新开始"
          >
            <SkipBack className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={stepBack}
            disabled={currentIndex === 0}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700 transition-colors disabled:opacity-30"
            title="上一条"
          >
            <SkipBack className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={togglePlay}
            className={cn(
              "p-2 rounded-xl transition-colors",
              isPlaying
                ? "bg-violet-600 text-white hover:bg-violet-500"
                : "bg-zinc-700 text-zinc-200 hover:bg-zinc-600"
            )}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button
            onClick={stepForward}
            disabled={currentIndex >= messageLines.length - 1}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700 transition-colors disabled:opacity-30"
            title="下一条"
          >
            <SkipForward className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={cycleSpeed}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700 transition-colors"
            title="播放速度"
          >
            <FastForward className="h-3 w-3" />
            {speed}x
          </button>
          <button
            onClick={() => setShowAnnotations(!showAnnotations)}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] border transition-colors",
              showAnnotations
                ? "bg-violet-500/10 border-violet-500/30 text-violet-300"
                : "bg-zinc-800 border-zinc-700 text-zinc-500"
            )}
          >
            <Lightbulb className="h-3 w-3" />
            注释
          </button>
        </div>
      </div>
    </div>
  );
}
