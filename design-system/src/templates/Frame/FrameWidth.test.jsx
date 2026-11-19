import PropTypes from 'prop-types';
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

    it('takes only default, full and reading: the old `content` is retired', () => {
        const check = (width) => PropTypes.checkPropTypes({ width: Frame.propTypes.width }, { width }, 'prop', 'Frame');
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        check('full');
        expect(error).not.toHaveBeenCalled();
        check('content');
        expect(error).toHaveBeenCalledTimes(1);
    });

    it('lifts the content cap for full width in the stylesheet', async () => {
        const { readFileSync } = await import('node:fs');
        const { join } = await import('node:path');
        const scss = readFileSync(join(__dirname, 'Frame.scss'), 'utf8');
        expect(scss).toMatch(/\.plus-frame__content--full\s*\{\s*max-width:\s*none;/);
    });
});
