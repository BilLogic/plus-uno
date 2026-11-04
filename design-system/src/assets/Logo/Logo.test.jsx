/**
 * `Logo` — pixel sizes, `appearance`, and the `wordmark` flag.
 */
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Logo from './Logo';

describe('Logo', () => {
    it('defaults to the 132 step, colored, mark only', () => {
        const { container } = render(<Logo />);
        const root = container.firstChild;
        expect(root).toHaveClass('plus-logo--132');
        expect(root).toHaveClass('plus-logo--colored');
        expect(root).not.toHaveClass('plus-logo--with-wordmark');
        expect(root.querySelector('.plus-logo__text')).toBeNull();
    });

    it.each([60, 96, 132, 192, 224])('draws the %i step', (size) => {
        const { container } = render(<Logo size={size} />);
        expect(container.firstChild).toHaveClass(`plus-logo--${size}`);
    });

    it('takes appearance rather than style', () => {
        const { container } = render(<Logo appearance="outlined" />);
        expect(container.firstChild).toHaveClass('plus-logo--outlined');
    });

    it('shows the wordmark', () => {
        const { container } = render(<Logo wordmark />);
        expect(container.firstChild).toHaveClass('plus-logo--with-wordmark');
        expect(container.querySelector('.plus-logo__text')).not.toBeNull();
    });

    it('does not pass a stray style string through to the DOM', () => {
        const { container } = render(<Logo appearance="filled" />);
        expect(container.firstChild.getAttribute('style')).toBeNull();
    });
});
