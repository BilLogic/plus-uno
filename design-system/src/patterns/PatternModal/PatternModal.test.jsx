import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import PatternModal from './PatternModal';

/**
 * PatternModal takes Figma's sizing: `width` sm · md · lg from the screen grid
 * and `height` hug · fill. The old `padding`, `gap` and `maxHeight` props keep
 * drawing as they did and say once, in development, that they are deprecated.
 *
 * The widths themselves are CSS, held to Figma's numbers in
 * scripts/frame-layer-tokens.test.mjs and measured in the stories.
 */
const dialog = () => screen.getByRole('dialog');

describe('PatternModal sizing', () => {
    let warn;
    beforeEach(() => {
        warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });
    afterEach(() => {
        warn.mockRestore();
    });

    it('defaults to width sm and height hug, with the Figma pad and stack', () => {
        render(<PatternModal title="Move session">Body</PatternModal>);
        const el = dialog();
        expect(el).toHaveClass('plus-pattern-modal-width-sm', 'plus-pattern-modal-height-hug');
        expect(el.className).not.toMatch(/plus-pattern-modal-(pad|gap)-/);
        expect(warn).not.toHaveBeenCalled();
    });

    it.each(['sm', 'md', 'lg'])('takes width %s', (width) => {
        render(<PatternModal title="Move session" width={width}>Body</PatternModal>);
        expect(dialog()).toHaveClass(`plus-pattern-modal-width-${width}`);
    });

    it.each(['hug', 'fill'])('takes height %s', (height) => {
        render(<PatternModal title="Move session" height={height}>Body</PatternModal>);
        expect(dialog()).toHaveClass(`plus-pattern-modal-height-${height}`);
    });

    it('makes a fill body a tab stop, since it can scroll', () => {
        render(<PatternModal title="Settings" height="fill">Body</PatternModal>);
        expect(dialog().querySelector('.plus-pattern-modal-body')).toHaveAttribute('tabindex', '0');
    });

    it('keeps the old padding and gap classes for callers that pass them', () => {
        render(<PatternModal title="Old" padding="lg" gap="sm">Body</PatternModal>);
        expect(dialog()).toHaveClass('plus-pattern-modal-pad-lg', 'plus-pattern-modal-gap-sm');
    });

    it('keeps maxHeight as an inline cap with a scrollable body', () => {
        render(<PatternModal title="Old" maxHeight={320}>Body</PatternModal>);
        expect(dialog()).toHaveStyle({ maxHeight: '320px' });
        expect(dialog().querySelector('.plus-pattern-modal-body')).toHaveAttribute('tabindex', '0');
    });
});

describe('PatternModal deprecation warnings', () => {
    it('warns once per deprecated prop, however many modals pass it', async () => {
        vi.resetModules();
        const { default: Fresh } = await import('./PatternModal');
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        render(
            <>
                <Fresh title="One" padding="md" maxHeight={200}>Body</Fresh>
                <Fresh title="Two" padding="sm" gap="lg">Body</Fresh>
            </>,
        );
        const messages = warn.mock.calls.map(([message]) => message);
        expect(messages.filter((m) => m.includes('padding'))).toHaveLength(1);
        expect(messages.filter((m) => m.includes('gap'))).toHaveLength(1);
        expect(messages.filter((m) => m.includes('maxHeight'))).toHaveLength(1);
        expect(messages.every((m) => m.startsWith('[PatternModal]'))).toBe(true);
        warn.mockRestore();
    });
});
