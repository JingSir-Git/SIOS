"use client";

import { useCallback } from "react";
import { Mic, MicOff, Loader2, Square } from "lucide-react";
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
  /** Language for speech recognition */
  lang?: string;
  /** Additional class for the button container */
  className?: string;
  /** Show compact version (icon only) */
  compact?: boolean;
}

/**
 * Reusable voice input button with real-time transcription preview.
 * Uses Web Speech API for voice-to-text conversion.
 */
export default function VoiceInputButton({
  onTranscript,
  onComplete,
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
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceInput();

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
    return null; // Don't render on unsupported browsers
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
            ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 animate-pulse"
            : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-zinc-200 hover:border-zinc-600"
        )}
        title={isListening ? "停止录音" : "语音输入"}
      >
        {isListening ? (
          <>
            <Square className="h-3.5 w-3.5 fill-current" />
            {!compact && (
              <span>
                录音中 {speechDuration > 0 ? `${Math.floor(speechDuration)}s` : ""}
              </span>
            )}
          </>
        ) : (
          <>
            <Mic className="h-3.5 w-3.5" />
            {!compact && <span>语音输入</span>}
          </>
        )}
      </button>

      {/* Live preview tooltip (shown while listening) */}
      {isListening && (transcript || interimTranscript) && (
        <div className="absolute bottom-full left-0 right-0 mb-2 min-w-[200px] max-w-[320px] rounded-lg border border-zinc-700 bg-zinc-900 p-3 shadow-xl z-10">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Loader2 className="h-3 w-3 text-red-400 animate-spin" />
            <span className="text-[9px] text-red-300 font-medium">实时转写中...</span>
            {confidence > 0 && (
              <span className="text-[8px] text-zinc-600 ml-auto">
                置信度 {Math.round(confidence * 100)}%
              </span>
            )}
          </div>
          <p className="text-[11px] text-zinc-300 leading-relaxed">
            {transcript}
            {interimTranscript && (
              <span className="text-zinc-500 italic">{interimTranscript}</span>
            )}
          </p>
          {speechDuration > 3 && (
            <div className="flex items-center gap-3 mt-2 pt-1.5 border-t border-zinc-800">
              <span className="text-[8px] text-zinc-600">{Math.floor(speechDuration)}秒</span>
              <span className="text-[8px] text-zinc-600">{pauseCount}次停顿</span>
              {wordsPerMinute > 0 && (
                <span className="text-[8px] text-zinc-600">{wordsPerMinute}字/分</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="absolute bottom-full left-0 mb-2 min-w-[200px] rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-[10px] text-red-300 z-10">
          <MicOff className="h-3 w-3 inline-block mr-1" />
          {error}
        </div>
      )}
    </div>
  );
}
