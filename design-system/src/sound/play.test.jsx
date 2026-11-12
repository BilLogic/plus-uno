import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { playSound, resetSound, unlockAudio } from './play';
import { scoreFor } from './score';
import { SOUND_SPEC } from './spec.generated';
import { SOUND_STORAGE_KEY, isSoundEnabled, setSoundEnabled } from './settings';
import { SoundProvider, useSound } from './SoundProvider';

/** A stand-in for Web Audio that records what gets scheduled. */
function fakeAudioContext() {
  const made = [];
  const param = (value = 0) => ({ value, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() });
  const node = (extra = {}) => ({ connect: vi.fn(), start: vi.fn(), stop: vi.fn(), ...extra });
  class FakeAudioContext {
    constructor() {
      this.currentTime = 1;
      this.sampleRate = 8000;
      this.state = 'running';
      this.destination = node();
      made.push(this);
    }
    resume() { this.state = 'running'; return Promise.resolve(); }
    createGain() { return node({ gain: param(1) }); }
    createOscillator() { return node({ type: 'sine', frequency: param() }); }
    createBiquadFilter() { return node({ type: 'lowpass', frequency: param(), Q: param() }); }
    createBufferSource() { return node({ buffer: null }); }
    createConvolver() { return node({ buffer: null }); }
    createDynamicsCompressor() {
      return node({ threshold: param(), knee: param(), ratio: param(), attack: param(), release: param() });
    }
    createBuffer(channels, length) {
      const data = Array.from({ length: channels }, () => new Float32Array(length));
      return { getChannelData: (ch) => data[ch] };
    }
  }
  return { FakeAudioContext, made };
}

function reducedMotion(matches) {
  window.matchMedia = vi.fn().mockReturnValue({ matches, addEventListener: vi.fn(), removeEventListener: vi.fn() });
}

let audio;
beforeEach(() => {
  resetSound();
  window.localStorage.clear();
  audio = fakeAudioContext();
  window.AudioContext = audio.FakeAudioContext;
});
afterEach(() => {
  resetSound();
  delete window.AudioContext;
});

describe('playSound', () => {
  it('schedules every tone of the score, starting on the pickup at `at` seconds from now', () => {
    unlockAudio();
    const [ctx] = audio.made;
    const oscillators = [];
    const create = ctx.createOscillator.bind(ctx);
    ctx.createOscillator = () => { const o = create(); oscillators.push(o); return o; };
    expect(playSound('notify', { at: 0.12 })).toBe(true);
    const tones = scoreFor('notify').events.filter((e) => e.kind === 'tone');
    expect(oscillators).toHaveLength(tones.length);
    const firstStart = Math.min(...oscillators.map((o) => o.start.mock.calls[0][0]));
    expect(firstStart).toBeCloseTo(ctx.currentTime + 0.12 + scoreFor('notify').pickup, 6);
  });

  it('plays under reduced motion: reduced motion never mutes sound', () => {
    reducedMotion(true);
    unlockAudio();
    expect(playSound('done.step')).toBe(true);
  });

  it('with the setting off, plays nothing and throws nothing', () => {
    setSoundEnabled(false);
    expect(() => playSound('notify')).not.toThrow();
    expect(playSound('notify')).toBe(false);
    expect(audio.made).toHaveLength(0);
  });

  it('without Web Audio, plays nothing and throws nothing', () => {
    delete window.AudioContext;
    expect(() => unlockAudio()).not.toThrow();
    expect(playSound('notify')).toBe(false);
  });

  it('waits for the first gesture: before audio is unlocked, nothing plays', () => {
    expect(playSound('notify')).toBe(false);
    expect(audio.made).toHaveLength(0);
  });

  it('plays a token once per burst: a repeat inside the burst window is dropped, one after it plays again', () => {
    unlockAudio();
    const [ctx] = audio.made;
    const nodes = [];
    const create = ctx.createOscillator.bind(ctx);
    ctx.createOscillator = () => { const n = create(); nodes.push(n); return n; };
    const burst = SOUND_SPEC.burst;
    expect(burst).toBe(2);
    expect([playSound('roster'), (ctx.currentTime += 0.5, playSound('roster')), (ctx.currentTime += 1, playSound('roster'))]).toEqual([true, false, false]);
    expect(nodes).toHaveLength(scoreFor('roster').events.filter((e) => e.kind === 'tone').length);
    ctx.currentTime += burst;
    expect(playSound('roster')).toBe(true);
    expect(nodes).toHaveLength(2 * scoreFor('roster').events.filter((e) => e.kind === 'tone').length);
  });

  it('a different token inside the window still plays', () => {
    unlockAudio();
    expect(playSound('roster')).toBe(true);
    expect(playSound('notify')).toBe(true);
  });

  it('throws on a name that is not a sound token', () => {
    unlockAudio();
    expect(() => playSound('chime')).toThrow(/chime/);
  });
});

describe('the setting', () => {
  it('defaults on and persists', () => {
    expect(isSoundEnabled()).toBe(true);
    setSoundEnabled(false);
    expect(window.localStorage.getItem(SOUND_STORAGE_KEY)).toBe('off');
    resetSound();
    expect(isSoundEnabled()).toBe(false);
  });

  it('survives storage that throws', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    resetSound();
    expect(isSoundEnabled()).toBe(true);
    expect(() => setSoundEnabled(false)).not.toThrow();
    expect(isSoundEnabled()).toBe(false);
    spy.mockRestore();
    set.mockRestore();
  });
});

function SoundToggle() {
  const { enabled, setEnabled, play } = useSound();
  return (
    <>
      <button type="button" onClick={() => setEnabled(!enabled)}>{enabled ? 'Sound on' : 'Sound off'}</button>
      <button type="button" onClick={() => play('notify')}>Play</button>
    </>
  );
}

describe('SoundProvider and useSound', () => {
  it('unlocks audio on the first gesture, and the switch turns all sound off', async () => {
    const user = userEvent.setup();
    render(<SoundProvider><SoundToggle /></SoundProvider>);
    expect(audio.made).toHaveLength(0);
    await user.click(screen.getByRole('button', { name: 'Play' }));
    expect(audio.made).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'Sound on' }));
    expect(screen.getByRole('button', { name: 'Sound off' })).toBeInTheDocument();
    expect(isSoundEnabled()).toBe(false);
    const ctx = audio.made[0];
    const spy = vi.spyOn(ctx, 'createOscillator');
    await user.click(screen.getByRole('button', { name: 'Play' }));
    expect(spy).not.toHaveBeenCalled();
  });

  it('reflects a change made outside React', () => {
    render(<SoundProvider><SoundToggle /></SoundProvider>);
    act(() => setSoundEnabled(false));
    expect(screen.getByRole('button', { name: 'Sound off' })).toBeInTheDocument();
  });
});
