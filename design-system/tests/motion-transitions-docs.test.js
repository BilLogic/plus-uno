import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const STYLES = join(__dirname, '..', 'src', 'styles');

describe('MotionTransitions docs embeds (ADR-049)', () => {
    const mdx = readFileSync(join(STYLES, 'MotionTransitions.mdx'), 'utf8');
    const stories = readFileSync(join(STYLES, 'MotionTransitions.stories.jsx'), 'utf8');

    it('embeds only kit demos from TransitionStories on every Canvas', () => {
        const canvases = [...mdx.matchAll(/<Canvas\s+of=\{([^}]+)\}/g)].map((m) => m[1].trim());
        expect(canvases.length).toBeGreaterThan(0);
        for (const ref of canvases) {
            expect(ref).toMatch(/^TransitionStories\.[A-Za-z0-9_]+$/);
        }
    });

    it('embeds every kit MotionDemo and tree story defined in MotionTransitions.stories.jsx', () => {
        const embedded = new Set(
            [...mdx.matchAll(/<Canvas\s+of=\{TransitionStories\.([A-Za-z0-9_]+)\}/g)].map((m) => m[1]),
        );
        const kitExports = [
            ...stories.matchAll(/^export const ([A-Za-z0-9_]+)\s*=\s*story\(/gm),
            ...stories.matchAll(/^export const ([A-Za-z0-9_]+Demo)\s*=/gm),
        ].map((m) => m[1]);

        expect(kitExports.length).toBeGreaterThanOrEqual(27);
        for (const name of kitExports) {
            expect(embedded, `TransitionStories.${name} should be embedded in MotionTransitions.mdx`).toContain(name);
        }
    });
});
