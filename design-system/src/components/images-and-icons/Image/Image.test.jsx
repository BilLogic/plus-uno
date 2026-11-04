import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Image from './Image';

describe('Image', () => {
    it('renders a plain img when no srcDark is given', () => {
        render(<Image src="/a.png" alt="A" />);
        const img = screen.getByAltText('A');
        expect(img.tagName).toBe('IMG');
        expect(img).toHaveAttribute('src', '/a.png');
    });

    it('defaults alt to empty, marking the image decorative', () => {
        render(<Image src="/a.png" testId="deco" />);
        expect(screen.getByTestId('deco')).toHaveAttribute('alt', '');
    });

    it('wraps in a <picture> with a dark source when srcDark is given', () => {
        const { container } = render(<Image src="/a.png" srcDark="/a-dark.png" alt="A" />);
        const picture = container.querySelector('picture');
        expect(picture).toBeTruthy();
        expect(picture.querySelector('source')).toHaveAttribute('srcset', '/a-dark.png');
    });
});
