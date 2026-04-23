"use client";

import { useCallback, useEffect, useRef } from "react";
import { Mic, MicOff, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVoiceInput } from "@/hooks/useVoiceInput";

interface VoiceInputButtonProps {
  /** Callback when transcription text is available (final + interim) */
  onTranscript: (text: string) => void;
  /** Callback when recording stops with full transcript */
  onComplete?: (fullTranscript: string, metrics: {
    duration: number;
    pauseCount: number;
    wordsPerMinute: number;
    confidence: number;
  }) => void;
  /** Real-time callback: fires on every interim result so parent can show live text */
  onInterim?: (text: string) => void;
  /** Language for speech recognition */
  lang?: string;
  /** Additional class for the button container */
  className?: string;
  /** Show compact version (icon only) */
  compact?: boolean;
}

/**
 * Reusable voice input button with real-time transcription preview.
 * Uses Web Speech API for voice-to-text conversion with auto-restart.
 * Features:
 * - Continuous listening with auto-restart on silence
 * - Real-time audio level waveform visualization
 * - Live interim transcript preview
 * - Speech metrics (duration, pauses, WPM)
 */
export default function VoiceInputButton({
  onTranscript,
  onComplete,
  onInterim,
  lang = "zh-CN",
  className,
  compact = false,
}: VoiceInputButtonProps) {
  const {
    isListening,
    transcript,
    interimTranscript,
    confidence,
    error,
    isSupported,
    speechDuration,
    pauseCount,
    wordsPerMinute,
    audioLevel,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceInput();

  // Canvas ref for waveform visualization
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioLevelHistoryRef = useRef<number[]>([]);

  // Stream interim transcripts to parent in real time
  useEffect(() => {
    if (isListening && onInterim && (transcript || interimTranscript)) {
      onInterim(transcript + interimTranscript);
    }
  }, [isListening, transcript, interimTranscript, onInterim]);

  // Draw waveform visualization
  useEffect(() => {
    if (!isListening || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Push new audio level to history
    const history = audioLevelHistoryRef.current;
    history.push(audioLevel);
    if (history.length > 60) history.shift(); // keep last ~60 frames

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Draw bars
    const barCount = history.length;
    const barWidth = Math.max(2, w / 60);
    const gap = 1;

    for (let i = 0; i < barCount; i++) {
      const level = history[i];
      const barHeight = Math.max(2, level * h * 0.9);
      const x = (i / 60) * w;
      const y = (h - barHeight) / 2;

      // Gradient from violet to red based on level
      const intensity = Math.min(1, level * 3);
      const r = Math.round(139 + intensity * 116); // violet → red
      const g = Math.round(92 - intensity * 92);
      const b = Math.round(246 - intensity * 146);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.6 + intensity * 0.4})`;
      ctx.fillRect(x, y, barWidth - gap, barHeight);
    }
  }, [audioLevel, isListening]);

  // Clear waveform history when stopping
  useEffect(() => {
    if (!isListening) {
      audioLevelHistoryRef.current = [];
    }
  }, [isListening]);

  const handleToggle = useCallback(() => {
    if (isListening) {
      stopListening();
      if (transcript && onComplete) {
        onComplete(transcript, {
          duration: speechDuration,
          pauseCount,
          wordsPerMinute,
          confidence,
        });
      }
      if (transcript) {
        onTranscript(transcript);
      }
      resetTranscript();
    } else {
      resetTranscript();
      startListening(lang);
    }
  }, [isListening, transcript, speechDuration, pauseCount, wordsPerMinute, confidence, lang, onTranscript, onComplete, startListening, stopListening, resetTranscript]);

  if (!isSupported) {
    return null;
  }

  return (
    <div className={cn("relative", className)}>
      {/* Main button */}
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          "flex items-center gap-2 rounded-lg transition-all font-medium",
          compact ? "p-2" : "px-3 py-2 text-xs",
          isListening
            ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
            : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-zinc-200 hover:border-zinc-600"
        )}
        title={isListening ? "停止录音（点击结束并填入文本）" : "语音输入（持续录音直到手动停止）"}
      >
        {isListening ? (
          <>
            <Square className="h-3.5 w-3.5 fill-current animate-pulse" />
            {!compact && (
              <span className="tabular-nums">
                {Math.floor(speechDuration)}s
              </span>
            )}
          </>
        ) : (
          <>
            <Mic className="h-3.5 w-3.5" />
            {!compact && <span>语音</span>}
          </>
        )}
      </button>

      {/* Live preview panel (shown while listening) */}
      {isListening && (
        <div className="absolute bottom-full left-0 mb-2 min-w-[260px] max-w-[380px] rounded-xl border border-red-500/20 bg-zinc-900/95 backdrop-blur-sm shadow-2xl z-50 overflow-hidden">
          {/* Waveform visualization */}
          <div className="px-3 pt-2">
            <canvas
              ref={canvasRef}
              width={320}
              height={32}
              className="w-full h-8 rounded"
            />
          </div>

          {/* Status bar */}
          <div className="flex items-center gap-2 px-3 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-[9px] text-red-300 font-medium">持续录音中 · 自动识别语音</span>
            <span className="text-[8px] text-zinc-600 ml-auto tabular-nums">
              {Math.floor(speechDuration)}s
            </span>
          </div>

          {/* Transcript preview */}
          {(transcript || interimTranscript) && (
            <div className="px-3 pb-2">
              <div className="max-h-24 overflow-y-auto rounded-lg bg-zinc-800/50 p-2">
                <p className="text-[11px] text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {transcript}
                  {interimTranscript && (
                    <span className="text-violet-400/70">{interimTranscript}</span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Metrics */}
          <div className="flex items-center gap-3 px-3 pb-2 border-t border-zinc-800/50 pt-1.5">
            {confidence > 0 && (
              <span className="text-[8px] text-zinc-600">置信度 {Math.round(confidence * 100)}%</span>
            )}
            {pauseCount > 0 && (
              <span className="text-[8px] text-zinc-600">{pauseCount}次停顿</span>
            )}
            {wordsPerMinute > 0 && (
              <span className="text-[8px] text-zinc-600">{wordsPerMinute}字/分</span>
            )}
            <span className="text-[8px] text-zinc-700 ml-auto">点击■停止</span>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && !isListening && (
        <div className="absolute bottom-full left-0 mb-2 min-w-[200px] rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-[10px] text-red-300 z-10">
          <MicOff className="h-3 w-3 inline-block mr-1" />
          {error}
        </div>
      )}
    </div>
  );
}
