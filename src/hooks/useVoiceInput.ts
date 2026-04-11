"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export interface VoiceInputState {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  confidence: number;
  error: string | null;
  isSupported: boolean;
  // Speech metrics for emotion hints
  speechDuration: number; // seconds
  pauseCount: number;
  wordCount: number;
  wordsPerMinute: number;
}

export interface UseVoiceInputReturn extends VoiceInputState {
  startListening: (lang?: string) => void;
  stopListening: () => void;
  resetTranscript: () => void;
  appendTranscript: (text: string) => void;
}

/**
 * Hook for Web Speech API voice input with speech metrics tracking.
 * Provides real-time transcription and basic speech pattern analysis.
 */
export function useVoiceInput(): UseVoiceInputReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [speechDuration, setSpeechDuration] = useState(0);
  const [pauseCount, setPauseCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [wordsPerMinute, setWordsPerMinute] = useState(0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);
  const lastSpeechTimeRef = useRef<number>(0);
  const pauseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isSupported = typeof window !== "undefined" && !!(
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition // eslint-disable-line @typescript-eslint/no-explicit-any
  );

  const startListening = useCallback((lang: string = "zh-CN") => {
    if (!isSupported) {
      setError("您的浏览器不支持语音识别，请使用 Chrome 或 Edge");
      return;
    }

    setError(null);
    setInterimTranscript("");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();

    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    startTimeRef.current = Date.now();
    lastSpeechTimeRef.current = Date.now();
    setPauseCount(0);

    // Track pauses (silence > 1.5s between speech events)
    pauseTimerRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - startTimeRef.current) / 1000;
      setSpeechDuration(elapsed);
    }, 500);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const now = Date.now();
      // Detect pause: if more than 1.5s since last speech event
      if (now - lastSpeechTimeRef.current > 1500 && lastSpeechTimeRef.current !== startTimeRef.current) {
        setPauseCount((prev) => prev + 1);
      }
      lastSpeechTimeRef.current = now;

      let finalText = "";
      let interimText = "";
      let maxConfidence = 0;

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
          maxConfidence = Math.max(maxConfidence, result[0].confidence);
        } else {
          interimText += result[0].transcript;
        }
      }

      if (finalText) {
        setTranscript((prev) => {
          const updated = prev + finalText;
          // Calculate word count and WPM
          const words = updated.replace(/[\s]+/g, " ").trim().length; // For Chinese, count characters
          setWordCount(words);
          const duration = (Date.now() - startTimeRef.current) / 60000; // minutes
          if (duration > 0) {
            setWordsPerMinute(Math.round(words / duration));
          }
          return updated;
        });
        setConfidence(maxConfidence);
      }
      setInterimTranscript(interimText);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      const errorMessages: Record<string, string> = {
        "not-allowed": "麦克风权限被拒绝，请在浏览器设置中允许麦克风访问",
        "no-speech": "未检测到语音，请确保麦克风正常工作",
        "audio-capture": "无法捕获音频，请检查麦克风连接",
        "network": "网络错误，语音识别需要网络连接",
        "aborted": "",
      };
      const msg = errorMessages[event.error] || `语音识别错误: ${event.error}`;
      if (msg) setError(msg);
      setIsListening(false);
      if (pauseTimerRef.current) clearInterval(pauseTimerRef.current);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
      if (pauseTimerRef.current) clearInterval(pauseTimerRef.current);
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setSpeechDuration(elapsed);
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch (err) {
      setError("启动语音识别失败");
      console.error("Speech recognition start error:", err);
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    if (pauseTimerRef.current) clearInterval(pauseTimerRef.current);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
    setConfidence(0);
    setSpeechDuration(0);
    setPauseCount(0);
    setWordCount(0);
    setWordsPerMinute(0);
    setError(null);
  }, []);

  const appendTranscript = useCallback((text: string) => {
    setTranscript((prev) => prev + text);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (pauseTimerRef.current) {
        clearInterval(pauseTimerRef.current);
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    confidence,
    error,
    isSupported,
    speechDuration,
    pauseCount,
    wordCount,
    wordsPerMinute,
    startListening,
    stopListening,
    resetTranscript,
    appendTranscript,
  };
}
