import React from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MotionDemo } from './motion.jsx';
import { Frame } from './primitives.jsx';
import { Trail } from './primitives-motion.jsx';
import { travel } from './trails.js';

/**
 * A motion demo screen draws one chrome: either the Frame's browser bar, with
 * the content below it, or a plain Frame the content fills from the top.
 */
const draw = (props) => render(<svg><Frame x={8} y={6} w={144} h={88} {...props} /></svg>).container;

describe('Frame chrome', () => {
    it('draws the browser dots, title bar and rule by default', () => {
        const svg = draw({});
        expect(svg.querySelectorAll('circle')).toHaveLength(3);
        expect(svg.querySelectorAll('rect').length).toBeGreaterThan(1);
    });

    it('draws only the plate when chrome is off', () => {
        const svg = draw({ chrome: false });
        expect(svg.querySelectorAll('circle')).toHaveLength(0);
        expect(svg.querySelectorAll('rect')).toHaveLength(1);
    });
});

describe('Motion demo tiles', () => {
    const dir = __dirname;
    const src = (f) => readFileSync(join(dir, f), 'utf8');

    it('tiles that draw into the top band sit on a plain Frame', () => {
        for (const f of ['motion-principles.jsx', 'principle-loops.jsx']) {
            const frames = src(f).match(/<Frame [^>]*\/>/g) ?? [];
            expect(frames.length).toBeGreaterThan(0);
            for (const tag of frames) expect(tag).toContain('chrome={false}');
        }
    });

    it('warns in dev when a scene trail lacks a dashed landing ghost', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const base = {
            title: 'Tile',
            caption: 'Caption.',
            viewBox: '0 0 160 100',
            initial: { x: 0 },
            landing: { x: 1 },
            draw: () => null,
            play: async () => {},
        };
        render(<MotionDemo title="Ghost check" reduced scenes={[{ ...base, id: 'bare', arrows: [[[10, 10], [40, 10]]] }]} />);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('Motion scene "bare": every trail must carry a dashed landing ghost.'));
        warn.mockClear();
        render(<MotionDemo title="Ghost ok" reduced scenes={[{ ...base, id: 'ghosted', arrows: [travel({ x: 34, y: 4, w: 12, h: 12 }, -30, 0)] }]} />);
        expect(warn).not.toHaveBeenCalled();
        warn.mockRestore();
    });

    it('renders a stationary dashed ghost when a trail has empty points', () => {
        const svg = render(<svg><Trail points={[]} ghost={{ x: 88, y: 22, w: 56, h: 48 }} accent /></svg>).container;
        expect(svg.querySelector('[data-ghost]')).not.toBeNull();
        expect(svg.querySelector('polyline')).toBeNull();
        expect(svg.querySelector('polygon')).toBeNull();
    });

    it('renders reduced stills at landing immediately and fades in place on replay without spatial travel', async () => {
        const seenX = [];
        const scene = {
            id: 'slide',
            title: 'Slide',
            caption: 'Moves across.',
            viewBox: '0 0 160 100',
            initial: { x: 0 },
            landing: { x: 100 },
            arrows: [travel({ x: 110, y: 40, w: 20, h: 20 }, -100, 0)],
            draw: ({ x }) => {
                seenX.push(x);
                return <rect x={10 + x} y={40} width={20} height={20} fill="var(--ds-background-brand-bold)" />;
            },
            play: async (ctx) => {
                await ctx.spring('x', 100, 'spatial.default');
            },
        };
        const { container, getByRole } = render(<MotionDemo title="Reduced check" reduced fastForward={8} scenes={[scene]} />);
        const root = container.querySelector('[data-motion-demo]');
        const tile = container.querySelector('[data-tile="slide"]');
        expect(JSON.parse(tile.dataset.state)).toMatchObject({ x: 100 });
        await waitFor(() => expect(root.dataset.phase).toBe('still'));

        seenX.length = 0;
        fireEvent.click(getByRole('button', { name: /play this demo once/i }));
        await waitFor(() => expect(['arrows', 'playing']).toContain(root.dataset.phase));
        await waitFor(() => expect(root.dataset.phase).toBe('still'), { timeout: 5000 });
        expect(seenX.every((x) => x === 0 || x === 100)).toBe(true);
    });
});
