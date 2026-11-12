/**
 * Plays a sound token in the browser with Web Audio (ADR-043), ported from the
 * Sound Lab's Detent `playCue` path: the token's score (`score.js`) scheduled
 * on one shared AudioContext, dry and into a short room, through the Lab's
 * output stage. No audio files, no packages.
 *
 * Browsers only let a page start audio inside a user gesture, so the context
 * is made on the first one (`unlockAudio`, installed by `SoundProvider`).
 * Until then, with the setting off, or without Web Audio, `playSound` plays
 * nothing and throws nothing.
 */
import { ENVELOPE, scoreFor } from './score';
import { forgetSoundSetting, isSoundEnabled } from './settings';
import { SOUND_SPEC } from './spec.generated';

// The shortest lead a sound is scheduled with, so its first notch is not clipped.
const MIN_LEAD = 0.005;
const GESTURES = ['pointerdown', 'keydown', 'touchend'];

let engine = null;
// When each token last played, on the audio clock: a burst sounds once.
const lastPlayed = new Map();

const contextClass = () => (typeof window === 'undefined' ? undefined : window.AudioContext ?? window.webkitAudioContext);

function noise(ctx, seconds) {
  const buffer = ctx.createBuffer(1, Math.round(ctx.sampleRate * seconds), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function impulse(ctx, { seconds, decay }) {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** decay;
  }
  return buffer;
}

function createEngine(AudioContextClass) {
  const { output, material } = SOUND_SPEC;
  try {
    // iPhone and iPad: play through the silent switch, like media playback.
    if (navigator.audioSession) navigator.audioSession.type = 'playback';
  } catch {
    // Older Safari has no audio session; the switch then applies.
  }
  const ctx = new AudioContextClass();
  const master = ctx.createGain();
  master.gain.value = output.gain;
  const compressor = ctx.createDynamicsCompressor();
  Object.entries(output.compressor).forEach(([param, value]) => {
    compressor[param].value = value;
  });
  master.connect(compressor);
  compressor.connect(ctx.destination);

  const dry = ctx.createGain();
  dry.connect(master);
  const send = ctx.createGain();
  send.gain.value = material.room;
  const room = ctx.createConvolver();
  room.buffer = impulse(ctx, output.reverb);
  const wet = ctx.createGain();
  wet.gain.value = material.wet;
  send.connect(room);
  room.connect(wet);
  wet.connect(master);

  return { ctx, dry, send, noise: noise(ctx, SOUND_SPEC.noiseSeconds) };
}

/** iOS unlocks a context by playing one silent sample inside the gesture. */
function playSilence(ctx) {
  const source = ctx.createBufferSource();
  source.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
  source.connect(ctx.destination);
  source.start(0);
}

/**
 * Makes and resumes the shared AudioContext. Call it inside a user gesture;
 * `SoundProvider` does, on the first one. With the setting off it waits.
 * @returns {boolean} whether audio is ready
 */
export function unlockAudio() {
  const AudioContextClass = contextClass();
  if (!AudioContextClass || !isSoundEnabled()) return false;
  try {
    if (!engine) {
      engine = createEngine(AudioContextClass);
      playSilence(engine.ctx);
    }
    if (engine.ctx.state === 'suspended') engine.ctx.resume();
    return true;
  } catch {
    engine = null;
    return false;
  }
}

/**
 * Unlocks audio on the first pointer, key or touch gesture on `target`.
 * @returns {() => void} removes the listeners
 */
export function installAudioUnlock(target = typeof window === 'undefined' ? undefined : window) {
  if (!target) return () => {};
  const remove = () => GESTURES.forEach((type) => target.removeEventListener(type, onGesture, true));
  function onGesture() {
    if (unlockAudio()) remove();
  }
  GESTURES.forEach((type) => target.addEventListener(type, onGesture, true));
  return remove;
}

function scheduleTone({ ctx, dry, send }, e, start) {
  const s = start + e.at;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(e.hz, s);
  if (e.toHz) {
    osc.frequency.setValueAtTime(e.hz, s + ENVELOPE.glideHold);
    osc.frequency.exponentialRampToValueAtTime(e.toHz, s + e.glide);
  }
  gain.gain.setValueAtTime(ENVELOPE.floor, s);
  gain.gain.exponentialRampToValueAtTime(e.peak, s + e.attack);
  gain.gain.exponentialRampToValueAtTime(ENVELOPE.floor, s + e.end);
  osc.connect(gain);
  gain.connect(dry);
  gain.connect(send);
  osc.start(s);
  osc.stop(s + e.end + ENVELOPE.toneTail);
}

function scheduleKnock({ ctx, dry, send, noise: buffer }, e, start) {
  const s = start + e.at;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const band = ctx.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = e.hz;
  band.Q.value = e.q;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(ENVELOPE.floor, s);
  gain.gain.exponentialRampToValueAtTime(e.peak, s + ENVELOPE.knockRise);
  gain.gain.exponentialRampToValueAtTime(ENVELOPE.floor, s + e.decay);
  source.connect(band);
  band.connect(gain);
  gain.connect(dry);
  gain.connect(send);
  source.start(s);
  source.stop(s + e.decay + ENVELOPE.knockTail);
}

/**
 * Plays a sound token. Its pickup starts `at` seconds from now, so its first
 * note lands one pickup later; pass `soundStartFor(...)` to land it with its
 * motion. Reduced motion does not mute it; only the setting does.
 * A token that plays again inside the plan's burst window is dropped, so a burst of
 * the same sound plays once.
 * @param {string} token a sound token without the `sound.` prefix, e.g. `notify`
 * @param {{at?: number}} [options]
 * @returns {boolean} whether it was scheduled
 */
export function playSound(token, { at = 0 } = {}) {
  if (!isSoundEnabled()) return false;
  const score = scoreFor(token);
  if (!engine || engine.ctx.state === 'closed') return false;
  const now = engine.ctx.currentTime;
  if (now - (lastPlayed.get(token) ?? -Infinity) < SOUND_SPEC.burst) return false;
  try {
    if (engine.ctx.state === 'suspended') engine.ctx.resume();
    const start = engine.ctx.currentTime + Math.max(MIN_LEAD, at);
    score.events.forEach((e) => (e.kind === 'tone' ? scheduleTone(engine, e, start) : scheduleKnock(engine, e, start)));
    lastPlayed.set(token, now);
    return true;
  } catch {
    return false;
  }
}

/** Drops the shared context and the in-memory setting. For tests. */
export function resetSound() {
  try {
    engine?.ctx.close?.();
  } catch {
    // Already closed.
  }
  engine = null;
  lastPlayed.clear();
  forgetSoundSetting();
}
