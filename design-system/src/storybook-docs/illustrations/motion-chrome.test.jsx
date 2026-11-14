import React from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Frame } from './primitives.jsx';

/**
 * A motion demo screen draws one chrome: either the Frame's browser bar, with
 * the content below it, or a plain Frame the content fills from the top.
 */
const draw = (props) => render(<svg><Frame x={8} y={6} w={144} h={88} {...props} /></svg>).container;

describe('Frame chrome', () => {
    it('draws the browser dots, title bar and rule by default', () => {
        const svg = draw({});
        expect(svg.querySelectorAll('circle')).toHaveLength(3);
    });

    it('draws only the plate when chrome is off', () => {
        const svg = draw({ chrome: false });
        expect(svg.querySelectorAll('circle')).toHaveLength(0);
        expect(svg.querySelectorAll('line, path').length).toBe(0);
    });
});

describe('Motion demo tiles', () => {
    const dir = __dirname;
    const src = (f) => readFileSync(join(dir, f), 'utf8');

    it('principle tiles that draw into the top band use a plain Frame', () => {
        for (const f of ['motion-principles.jsx', 'principle-loops.jsx']) {
            expect(src(f)).not.toMatch(/<Frame [^>]*h=\{88\} \/>/);
        }
    });
});
