// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { compileString } from 'sass';
import { fileURLToPath } from 'node:url';

const loadPaths = [fileURLToPath(new URL('.', import.meta.url))];
const row = (spacing) => compileString(`@use 'row-spacing'; .row { @include row-spacing.size('${spacing}'); }`, { loadPaths }).css;
const rowLayout = () => compileString(`@use 'row-spacing'; .row { @include row-spacing.row; }`, { loadPaths }).css;

describe('row spacing interface', () => {
    it.each([['default', 'md'], ['compact', 'sm'], ['spacious', 'lg']])('%s owns the height and vertical padding without capping content', (spacing, step) => {
        const css = row(spacing);
        expect(css).toContain(`min-height: var(--control-${step})`);
        expect(css).toContain(`padding-block: var(--pad-y-${step})`);
        expect(css).not.toMatch(/(?:^|[;{])\s*(?:height|max-height|padding-inline):/);
    });
    it('shares row layout, padding, gap, radius and typography', () => {
        const css = rowLayout();
        expect(css).toContain('gap: var(--inline-md)');
        expect(css).toContain('padding-inline: var(--pad-x-md)');
        expect(css).toContain('border-radius: var(--radius-control-md)');
        expect(css).toContain('font: var(--body-default)');
    });
    it('rejects an unknown spacing at compilation', () => {
        expect(() => row('cozy')).toThrow(/Unknown row spacing/);
    });
});
