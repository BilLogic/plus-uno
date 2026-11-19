import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Frame from './Frame.jsx';

const contentOf = (container) => container.querySelector('.plus-frame__content');

describe('Frame width', () => {
    afterEach(() => vi.restoreAllMocks());

    it.each(['default', 'full', 'reading'])('width="%s" sets that content type', (width) => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const { container } = render(<Frame width={width}><p>Body</p></Frame>);
        expect(contentOf(container)).toHaveClass(`plus-frame__content--${width}`);
        expect(warn).not.toHaveBeenCalled();
    });

    it('is default when width is not given', () => {
        const { container } = render(<Frame><p>Body</p></Frame>);
        expect(contentOf(container)).toHaveClass('plus-frame__content--default');
    });

    it('accepts the old width="content" as default and warns once', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const { container, rerender } = render(<Frame width="content"><p>Body</p></Frame>);
        rerender(<Frame width="content"><p>Body</p></Frame>);
        expect(contentOf(container)).toHaveClass('plus-frame__content--default');
        expect(contentOf(container)).not.toHaveClass('plus-frame__content--content');
        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn.mock.calls[0][0]).toMatch(/width="content".*default/);
    });

    it('lifts the content cap for full width in the stylesheet', async () => {
        const { readFileSync } = await import('node:fs');
        const { join } = await import('node:path');
        const scss = readFileSync(join(__dirname, 'Frame.scss'), 'utf8');
        expect(scss).toMatch(/\.plus-frame__content--full\s*\{\s*max-width:\s*none;/);
    });
});
