// ============================================================
// Sound Effects — Web Audio API Synthesized Sounds
// ============================================================
// No external audio files needed. All sounds are generated
// procedurally using the Web Audio API.

let audioCtx: AudioContext | null = null;
let muted = false;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

export function setMuted(m: boolean) { muted = m; }
export function isMuted() { return muted; }

/** Metallic coin collision sound */
export function playCoinSound() {
  if (muted) return;
  const ctx = getCtx();
  if (!ctx) return;

  const now = ctx.currentTime;
  // High-frequency metallic ping
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(2800 + Math.random() * 600, now);
  osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.2);

  // Secondary low thud
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(200 + Math.random() * 100, now);
  osc2.frequency.exponentialRampToValueAtTime(80, now + 0.1);
  gain2.gain.setValueAtTime(0.06, now);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  osc2.connect(gain2).connect(ctx.destination);
  osc2.start(now);
  osc2.stop(now + 0.12);
}

/** Card flip / page turn sound */
export function playCardFlipSound() {
  if (muted) return;
  const ctx = getCtx();
  if (!ctx) return;

  const now = ctx.currentTime;
  // White noise burst (paper sound)
  const bufferSize = ctx.sampleRate * 0.08;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 3000;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.06, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start(now);
}

/** Mystical reveal chime */
export function playRevealSound() {
  if (muted) return;
  const ctx = getCtx();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 major triad

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, now + i * 0.12);
    gain.gain.linearRampToValueAtTime(0.06, now + i * 0.12 + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.6);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + i * 0.12);
    osc.stop(now + i * 0.12 + 0.6);
  });
}

/** Subtle click for UI interactions */
export function playClickSound() {
  if (muted) return;
  const ctx = getCtx();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = 1000;
  gain.gain.setValueAtTime(0.04, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.05);
}
