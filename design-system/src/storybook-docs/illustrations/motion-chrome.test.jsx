import React from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MotionDemo } from './motion.jsx';
import { Frame } from './primitives.jsx';
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
});
