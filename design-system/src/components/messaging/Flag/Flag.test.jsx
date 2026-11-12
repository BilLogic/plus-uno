import { useState } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Flag, FlagGroup, FLAG_AUTO_CLOSE_MS, FLAG_APPEARANCES } from './Flag';
import { resetSound, unlockAudio } from '@/sound/play';
import { scoreFor } from '@/sound/score';
import { setSoundEnabled } from '@/sound/settings';
import { soundStartFor, springT90 } from '@/sound/timing';

/**
 * How long a flag stays. Success and information close themselves after 8 seconds;
 * warning and error stay until the person dismisses them, because they ask
 * for something to be done.
 */
describe('Flag timing', () => {
    beforeEach(() => { vi.useFakeTimers(); });
    afterEach(() => { vi.useRealTimers(); });

    it('waits 8 seconds', () => {
        expect(FLAG_AUTO_CLOSE_MS).toBe(8000);
    });

    it.each(['normal', 'success', 'information'])('closes a %s flag after 8 seconds, not before', (appearance) => {
        const onClose = vi.fn();
        render(<Flag appearance={appearance} title="Saved" show onDismiss={onClose}>Done.</Flag>);
        act(() => { vi.advanceTimersByTime(FLAG_AUTO_CLOSE_MS - 1); });
        expect(onClose).not.toHaveBeenCalled();
        act(() => { vi.advanceTimersByTime(1); });
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it.each(['warning', 'error'])('keeps a %s flag open until it is dismissed', (appearance) => {
        const onClose = vi.fn();
        render(<Flag appearance={appearance} title="Upload failed" show onDismiss={onClose}>Try again.</Flag>);
        act(() => { vi.advanceTimersByTime(60000); });
        expect(onClose).not.toHaveBeenCalled();
    });

    it('lets a caller override the timing', () => {
        const onClose = vi.fn();
        render(<Flag appearance="error" title="Gone" show onDismiss={onClose} autohide delay={3000}>x</Flag>);
        act(() => { vi.advanceTimersByTime(3000); });
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});

describe('Flag visibility', () => {
    it('renders nothing when show is false', () => {
        render(<Flag title="Saved" show={false} onDismiss={() => {}}>Done.</Flag>);
        expect(screen.queryByText('Done.')).not.toBeInTheDocument();
    });

    it('shows by default even without an explicit show prop', () => {
        render(<Flag title="Saved" onDismiss={() => {}}>Done.</Flag>);
        expect(screen.getByText('Done.')).toBeInTheDocument();
    });
});

describe('Flag appearance', () => {
    it('offers the five appearances', () => {
        expect(FLAG_APPEARANCES).toEqual(['normal', 'information', 'warning', 'error', 'success']);
    });

    it.each(FLAG_APPEARANCES)('marks a %s flag with its appearance', (appearance) => {
        render(<Flag appearance={appearance} title="T" autohide={false} data-testid="flag" />);
        expect(screen.getByTestId('flag')).toHaveClass(`plus-flag--${appearance}`);
    });

    it('is normal by default', () => {
        render(<Flag title="T" autohide={false} data-testid="flag" />);
        expect(screen.getByTestId('flag')).toHaveClass('plus-flag--normal');
    });

    it('speaks assertively only for warning and error', () => {
        const { rerender } = render(<Flag appearance="error" title="T" autohide={false} data-testid="flag" />);
        expect(screen.getByTestId('flag')).toHaveAttribute('role', 'alert');
        rerender(<Flag appearance="success" title="T" autohide={false} data-testid="flag" />);
        expect(screen.getByTestId('flag')).toHaveAttribute('role', 'status');
    });

    it('expands to the bold fill', () => {
        render(<Flag appearance="success" bold title="T" autohide={false} data-testid="flag" />);
        expect(screen.getByTestId('flag')).toHaveClass('plus-flag--bold');
    });

    it('needs only a title: the description is optional', () => {
        render(<Flag title="Saved" autohide={false} />);
        expect(screen.getByText('Saved')).toBeInTheDocument();
    });
});

describe('Flag actions and dismiss', () => {
    it('draws actions in order and calls their handlers', () => {
        const first = vi.fn();
        render(
            <Flag title="Upload failed" autohide={false} actions={[{ text: 'Retry', onClick: first }, { text: 'Details', href: '/details' }]}>
                Try again.
            </Flag>,
        );
        fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
        expect(first).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('link', { name: 'Details' })).toHaveAttribute('href', '/details');
    });

    it('labels the dismiss control "Dismiss" and calls onDismiss', () => {
        const onDismiss = vi.fn();
        render(<Flag title="T" autohide={false} onDismiss={onDismiss} />);
        fireEvent.click(screen.getByRole('button', { name: 'Dismiss flag' }));
        expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('has no dismiss control when dismissible is false', () => {
        render(<Flag title="T" autohide={false} dismissible={false} />);
        expect(screen.queryByRole('button', { name: 'Dismiss flag' })).not.toBeInTheDocument();
    });
});

describe('Flag expand on bold', () => {
    it('starts a bold flag collapsed and expands to the description and actions', () => {
        render(<Flag appearance="error" bold title="T" autohide={false} actions={[{ text: 'Retry' }]}>Details here.</Flag>);
        const toggle = screen.getByRole('button', { name: 'Expand' });
        expect(toggle).toHaveAttribute('aria-expanded', 'false');
        expect(screen.queryByText('Details here.')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
        fireEvent.click(toggle);
        expect(screen.getByRole('button', { name: 'Collapse' })).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByText('Details here.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    });

    it('can start expanded', () => {
        render(<Flag appearance="error" bold defaultExpanded title="T" autohide={false}>Details here.</Flag>);
        expect(screen.getByText('Details here.')).toBeInTheDocument();
    });

    it('has no toggle on a flag that is not bold', () => {
        render(<Flag title="T" autohide={false}>Details here.</Flag>);
        expect(screen.queryByRole('button', { name: 'Expand' })).not.toBeInTheDocument();
        expect(screen.getByText('Details here.')).toBeInTheDocument();
    });
});

describe('FlagGroup', () => {
    it('sits bottom-start by default', () => {
        render(<FlagGroup data-testid="flags"><span>flag</span></FlagGroup>);
        const group = screen.getByTestId('flags');
        expect(group).toHaveAttribute('data-position', 'bottom-start');
        expect(group).toHaveAttribute('data-container-position', 'fixed');
    });

    it('takes a logical position as given', () => {
        render(<FlagGroup data-testid="flags" position="top-end"><span>flag</span></FlagGroup>);
        expect(screen.getByTestId('flags')).toHaveAttribute('data-position', 'top-end');
    });
});

describe('Flag exit', () => {
    afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

    const Controlled = ({ delay }) => {
        const [shown, setShown] = useState(true);
        return <Flag title="Saved" show={shown} delay={delay} onDismiss={() => setShown(false)}>Done.</Flag>;
    };
    const flagEl = () => screen.getByText('Saved').closest('.plus-flag');

    it('flies out when it times out, then is gone', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        render(<Controlled delay={1000} />);
        act(() => { vi.advanceTimersByTime(1000); });
        expect(flagEl()).toHaveAttribute('data-leaving', 'timeout');
        fireEvent.animationEnd(flagEl());
        await waitFor(() => expect(screen.queryByText('Saved')).toBeNull());
    });

    it('fades in place when closed by hand, then is gone', async () => {
        render(<Controlled />);
        fireEvent.click(screen.getByRole('button', { name: 'Dismiss flag' }));
        expect(flagEl()).toHaveAttribute('data-leaving', 'hand');
        fireEvent.animationEnd(flagEl());
        await waitFor(() => expect(screen.queryByText('Saved')).toBeNull());
    });

    it('under reduced motion it is still there right after the trigger, then gone after the fade', async () => {
        vi.stubGlobal('matchMedia', (query) => ({ matches: query.includes('reduce'), addEventListener() {}, removeEventListener() {} }));
        render(<Controlled />);
        fireEvent.click(screen.getByRole('button', { name: 'Dismiss flag' }));
        expect(screen.getByText('Saved')).toBeInTheDocument();
        fireEvent.animationEnd(flagEl());
        await waitFor(() => expect(screen.queryByText('Saved')).toBeNull());
    });
});

/** A stand-in for Web Audio that records every node it starts, as in the sound runtime's tests. */
function fakeAudioContext() {
    const made = [];
    const starts = [];
    const param = (value = 0) => ({ value, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() });
    const node = (extra = {}) => ({ connect: vi.fn(), start: vi.fn((t) => starts.push(t)), stop: vi.fn(), ...extra });
    class FakeAudioContext {
        constructor() {
            this.currentTime = 1;
            this.sampleRate = 8000;
            this.state = 'running';
            this.destination = node();
            made.push(this);
        }
        resume() { return Promise.resolve(); }
        close() { this.state = 'closed'; }
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
    return { FakeAudioContext, made, starts };
}

/**
 * Flag's enter plays Notify as it lands (its motion registry row): the sound
 * starts at the `spatial.default` spring's 90% time minus Notify's pickup.
 * The tests read what is scheduled, never audio frames.
 */
describe('Flag sound', () => {
    let audio;
    const originalMatchMedia = window.matchMedia;
    const reducedMotion = (matches) => {
        window.matchMedia = vi.fn().mockReturnValue({ matches, addEventListener: vi.fn(), removeEventListener: vi.fn() });
    };
    /** Seconds from now to the earliest node the flag scheduled: the sound's start. */
    const scheduledStart = () => Math.min(...audio.starts) - audio.made[0].currentTime;

    beforeEach(() => {
        resetSound();
        window.localStorage.clear();
        audio = fakeAudioContext();
        window.AudioContext = audio.FakeAudioContext;
        unlockAudio();
        audio.starts.length = 0; // the unlock's silent sample is not the flag's sound
    });
    afterEach(() => {
        resetSound();
        delete window.AudioContext;
        window.matchMedia = originalMatchMedia;
    });

    it('starts Notify at the spatial.default 90% time minus the pickup, within 10 ms', () => {
        reducedMotion(false);
        render(<Flag title="Saved" />);
        const expected = springT90('spatial.default') - scoreFor('notify').pickup;
        expect(expected).toBeCloseTo(soundStartFor('spatial.default', 'notify'), 6);
        expect(Math.abs(scheduledStart() - expected)).toBeLessThan(0.01);
        // The landing note sounds on the 90% time itself.
        expect(audio.starts.length).toBeGreaterThan(0);
    });

    it('plays once, on enter, not on a re-render', () => {
        reducedMotion(false);
        const { rerender } = render(<Flag title="Saved" />);
        const count = audio.starts.length;
        rerender(<Flag title="Saved again" />);
        expect(audio.starts).toHaveLength(count);
    });

    it('with the setting off, schedules nothing', () => {
        reducedMotion(false);
        setSoundEnabled(false);
        render(<Flag title="Saved" />);
        expect(audio.starts).toHaveLength(0);
    });

    it('with sound={false}, schedules nothing: the app decides when a flag is quiet', () => {
        reducedMotion(false);
        render(<Flag title="Saved" sound={false} />);
        expect(audio.starts).toHaveLength(0);
    });

    it('under reduced motion still plays, landing with the reduced spring', () => {
        reducedMotion(true);
        render(<Flag title="Saved" />);
        const expected = soundStartFor('spatial.default', 'notify', { mode: 'reduced' });
        expect(Math.abs(scheduledStart() - expected)).toBeLessThan(0.01);
    });

    it('an error flag plays Error; the other appearances play Notify', () => {
        reducedMotion(false);
        const toneCount = (token) => scoreFor(token).events.length;
        render(<Flag title="Failed" appearance="error" />);
        expect(audio.starts).toHaveLength(toneCount('error'));
        audio.starts.length = 0;
        render(<Flag title="Saved" appearance="success" />);
        expect(audio.starts).toHaveLength(toneCount('notify'));
        expect(toneCount('error')).not.toBe(toneCount('notify'));
    });

    it('the sound prop names a token', () => {
        reducedMotion(false);
        render(<Flag title="Prompt" sound="prompt" />);
        expect(audio.starts.length).toBe(scoreFor('prompt').events.length);
    });

    it('marks the surface with the reduced value the sound and the enter share', () => {
        reducedMotion(false);
        const flagEl = () => screen.getByText('Saved').closest('.plus-flag');
        const { rerender } = render(<Flag title="Saved" reducedMotion />);
        expect(flagEl()).toHaveAttribute('data-reduced', 'true');
        rerender(<FlagGroup reducedMotion><Flag title="Saved" /></FlagGroup>);
        expect(flagEl()).toHaveAttribute('data-reduced', 'true');
    });

    it('a hidden flag plays nothing', () => {
        reducedMotion(false);
        render(<Flag title="Saved" show={false} />);
        expect(audio.starts).toHaveLength(0);
    });
});
