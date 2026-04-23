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
  // Audio level (0-1) for waveform visualization
  audioLevel: number;
}

export interface UseVoiceInputReturn extends VoiceInputState {
  startListening: (lang?: string) => void;
  stopListening: () => void;
  resetTranscript: () => void;
  appendTranscript: (text: string) => void;
}

/**
 * Hook for Web Speech API voice input with:
 * - Auto-restart on silence / unexpected stop (keeps listening until user explicitly stops)
 * - Real-time audio level metering via Web Audio API for waveform visualization
 * - Speech metrics tracking (duration, pauses, WPM)
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
  const [audioLevel, setAudioLevel] = useState(0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);
  const lastSpeechTimeRef = useRef<number>(0);
  const pauseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Auto-restart control
  const wantListeningRef = useRef(false);
  const langRef = useRef("zh-CN");
  const restartCountRef = useRef(0);
  const maxRestartsRef = useRef(200); // allow many auto-restarts (long sessions)
  // Accumulated transcript from previous recognition sessions (auto-restart loses resultIndex)
  const accumulatedRef = useRef("");
  // Audio metering
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);

  const isSupported = typeof window !== "undefined" && !!(
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition // eslint-disable-line @typescript-eslint/no-explicit-any
  );

  // ---- Audio level metering via Web Audio API ----
  const startAudioMeter = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        // RMS of frequency bins → normalized 0-1
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i] * dataArray[i];
        const rms = Math.sqrt(sum / dataArray.length) / 255;
        setAudioLevel(rms);
        animFrameRef.current = requestAnimationFrame(tick);
      };
      animFrameRef.current = requestAnimationFrame(tick);
    } catch {
      // Microphone access denied or unavailable — metering disabled but recognition may still work
    }
  }, []);

  const stopAudioMeter = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = 0;
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  // ---- Core recognition launcher (called on start and auto-restart) ----
  const launchRecognition = useCallback(() => {
    if (!isSupported) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();

    recognition.lang = langRef.current;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const now = Date.now();
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
        // Accumulate across auto-restarts
        accumulatedRef.current += finalText;
        const updated = accumulatedRef.current;
        setTranscript(updated);
        const chars = updated.replace(/[\s]+/g, "").length;
        setWordCount(chars);
        const durationMin = (Date.now() - startTimeRef.current) / 60000;
        if (durationMin > 0) setWordsPerMinute(Math.round(chars / durationMin));
        setConfidence(maxConfidence);
      }
      setInterimTranscript(interimText);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      // "no-speech" and "aborted" are recoverable — just let onend auto-restart
      const fatalErrors = ["not-allowed", "audio-capture", "service-not-allowed"];
      if (fatalErrors.includes(event.error)) {
        const errorMessages: Record<string, string> = {
          "not-allowed": "麦克风权限被拒绝，请在浏览器设置中允许麦克风访问",
          "audio-capture": "无法捕获音频，请检查麦克风连接",
          "service-not-allowed": "语音识别服务不可用",
        };
        setError(errorMessages[event.error] || `语音识别错误: ${event.error}`);
        wantListeningRef.current = false; // stop auto-restart
      } else if (event.error === "network") {
        setError("网络错误，语音识别需要网络连接（HTTPS）");
        wantListeningRef.current = false;
      }
      // For "no-speech", "aborted" etc. — let onend handle restart
    };

    recognition.onend = () => {
      setInterimTranscript("");
      // Auto-restart if user hasn't explicitly stopped
      if (wantListeningRef.current && restartCountRef.current < maxRestartsRef.current) {
        restartCountRef.current++;
        // Small delay to avoid rapid restart loops
        setTimeout(() => {
          if (wantListeningRef.current) {
            try {
              launchRecognition();
            } catch {
              wantListeningRef.current = false;
              setIsListening(false);
            }
          }
        }, 100);
      } else {
        setIsListening(false);
        if (pauseTimerRef.current) clearInterval(pauseTimerRef.current);
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setSpeechDuration(elapsed);
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch {
      wantListeningRef.current = false;
      setIsListening(false);
    }
  }, [isSupported]);

  const startListening = useCallback((lang: string = "zh-CN") => {
    if (!isSupported) {
      setError("您的浏览器不支持语音识别，请使用 Chrome 或 Edge");
      return;
    }

    // Stop any existing session
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }

    setError(null);
    setInterimTranscript("");
    langRef.current = lang;
    wantListeningRef.current = true;
    restartCountRef.current = 0;
    accumulatedRef.current = transcript; // keep existing transcript if appending

    startTimeRef.current = Date.now();
    lastSpeechTimeRef.current = Date.now();
    setPauseCount(0);

    // Duration timer
    if (pauseTimerRef.current) clearInterval(pauseTimerRef.current);
    pauseTimerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setSpeechDuration(elapsed);
    }, 300);

    // Start audio level metering
    startAudioMeter();

    // Launch the recognition engine
    setIsListening(true);
    launchRecognition();
  }, [isSupported, transcript, launchRecognition, startAudioMeter]);

  const stopListening = useCallback(() => {
    wantListeningRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript("");
    if (pauseTimerRef.current) { clearInterval(pauseTimerRef.current); pauseTimerRef.current = null; }
    stopAudioMeter();
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    if (startTimeRef.current > 0) setSpeechDuration(elapsed);
  }, [stopAudioMeter]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
    setConfidence(0);
    setSpeechDuration(0);
    setPauseCount(0);
    setWordCount(0);
    setWordsPerMinute(0);
    setError(null);
    accumulatedRef.current = "";
  }, []);

  const appendTranscript = useCallback((text: string) => {
    setTranscript((prev) => prev + text);
    accumulatedRef.current += text;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      wantListeningRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch { /* ignore */ }
      }
      if (pauseTimerRef.current) clearInterval(pauseTimerRef.current);
      stopAudioMeter();
    };
  }, [stopAudioMeter]);

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
    audioLevel,
    startListening,
    stopListening,
    resetTranscript,
    appendTranscript,
  };
}
