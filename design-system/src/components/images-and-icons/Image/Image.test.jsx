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

    it('renders a light and a dark img when srcDark is given, so CSS can follow the app color mode', () => {
        const { container } = render(<Image src="/a.png" srcDark="/a-dark.png" alt="A" />);
        expect(container.querySelector('picture')).toBeNull();
        const light = container.querySelector('.plus-image--light');
        const dark = container.querySelector('.plus-image--dark');
        expect(light).toHaveAttribute('src', '/a.png');
        expect(light).toHaveAttribute('alt', 'A');
        expect(dark).toHaveAttribute('src', '/a-dark.png');
        expect(dark).toHaveAttribute('alt', 'A');
    });

    it('defaults fit to container', () => {
        render(<Image src="/a.png" testId="i" />);
        expect(screen.getByTestId('i')).toHaveClass('plus-image--container');
    });

    it('fit natural keeps the natural size', () => {
        render(<Image src="/a.png" testId="i" fit="natural" />);
        expect(screen.getByTestId('i')).toHaveClass('plus-image--natural');
    });

    it('still honors the deprecated size alias for one release', () => {
        render(
            <>
                <Image src="/a.png" testId="fixed" size="fixed" />
                <Image src="/a.png" testId="fluid" size="fluid" />
            </>,
        );
        expect(screen.getByTestId('fixed')).toHaveClass('plus-image--natural');
        expect(screen.getByTestId('fluid')).toHaveClass('plus-image--container');
    });

    it('lets fit win over the deprecated size', () => {
        render(<Image src="/a.png" testId="i" fit="container" size="fixed" />);
        expect(screen.getByTestId('i')).toHaveClass('plus-image--container');
    });
});
