import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HEROES } from './hero-registry.jsx';

const IDS = ['overview', 'when-to-play', 'with-motion', 'sounds', 'settings-and-accessibility'].map((n) => `foundations-sound-${n}`);
const ACCENT = 'var(--ds-background-brand-bold)';
const paints = (root) =>
    [...root.querySelectorAll('[fill],[stroke]')].flatMap((el) => [el.getAttribute('fill'), el.getAttribute('stroke')]).filter((v) => v && v !== 'none');
const draw = (id) => render(React.createElement(HEROES[id].Hero)).container;

describe('Sound heroes', () => {
    it.each(IDS)('%s has a drawing and a one-sentence description', (id) => {
        expect(HEROES[id]?.Hero).toBeTypeOf('function');
        expect(HEROES[id].description).toMatch(/^[A-Z].*\.$/);
    });

    it.each(IDS)('%s draws no text and paints only through tokens', (id) => {
        const c = draw(id);
        expect(c.querySelector('text')).toBeNull();
        expect(c.textContent).toBe('');
        for (const v of paints(c)) expect(/^var\(--ds-[a-z-]+\)$/.test(v), v).toBe(true);
    });

    it.each(IDS)('%s puts the brand accent on its subject', (id) => {
        expect(paints(draw(id))).toContain(ACCENT);
    });

    it('Overview is three waveforms, the chime accented', () => {
        const c = draw('foundations-sound-overview');
        const waves = c.querySelectorAll('[data-shape="waveform"]');
        expect(waves).toHaveLength(3);
        expect([...waves].filter((w) => w.querySelector(`[fill="${ACCENT}"]`))).toHaveLength(1);
    });

    it('When to play is a run of events where only a few make a sound', () => {
        const c = draw('foundations-sound-when-to-play');
        const sounding = c.querySelectorAll('[data-event="sound"]');
        const silent = c.querySelectorAll('[data-event="silent"]');
        expect(sounding.length).toBeGreaterThan(0);
        expect(silent.length).toBeGreaterThan(sounding.length);
        expect(c.querySelectorAll('[data-shape="waveform"]')).toHaveLength(sounding.length);
    });

    it('With motion has the motion track above the sound track, and one tick where they meet', () => {
        const c = draw('foundations-sound-with-motion');
        const trail = c.querySelector('[data-shape="spring-trail"]');
        const wave = c.querySelector('[data-shape="waveform"]');
        const rect = (el) => el.querySelector('rect');
        expect(+rect(trail).getAttribute('y')).toBeLessThan(+rect(wave).getAttribute('y'));
        const sync = [...c.querySelectorAll('[data-sync] circle')];
        expect(sync).toHaveLength(2);
        expect(sync[0].getAttribute('cx')).toBe(sync[1].getAttribute('cx'));
        // the sound's first bar starts at the tick
        expect(Math.abs(+rect(wave).getAttribute('x') - +sync[0].getAttribute('cx'))).toBeLessThan(2);
    });

    it('Sounds lists four sounds with exactly one playing', () => {
        const c = draw('foundations-sound-sounds');
        expect(c.querySelectorAll('[data-sound]')).toHaveLength(4);
        expect(c.querySelectorAll('[data-sound="playing"]')).toHaveLength(1);
    });

    it('Settings shows the switch off and a quiet waveform', () => {
        const c = draw('foundations-sound-settings-and-accessibility');
        expect(c.querySelector('[data-switch="off"]')).not.toBeNull();
        expect(c.querySelector('[data-shape="waveform"]').parentElement.getAttribute('opacity')).toBe('0.5');
    });
});
