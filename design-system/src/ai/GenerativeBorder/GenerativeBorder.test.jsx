import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import GenerativeBorder from '.';

describe('GenerativeBorder', () => {
    it('renders the children with no ring while idle', () => {
        const { container } = render(
            <GenerativeBorder>
                <p>Draft</p>
            </GenerativeBorder>,
        );
        expect(screen.getByText('Draft')).toBeInTheDocument();
        expect(container.querySelector('.plus-generative-border__ring')).toBeNull();
        expect(container.firstChild).toHaveAttribute('aria-busy', 'false');
    });

    it('shows a decorative ring and marks the wrapper busy while active', () => {
        const { container } = render(
            <GenerativeBorder active>
                <p>Draft</p>
            </GenerativeBorder>,
        );
        const ring = container.querySelector('.plus-generative-border__ring');
        expect(ring).toHaveAttribute('aria-hidden', 'true');
        expect(container.firstChild).toHaveAttribute('aria-busy', 'true');
    });

    it('flips aria-busy as active changes', () => {
        const { container, rerender } = render(<GenerativeBorder active>x</GenerativeBorder>);
        rerender(<GenerativeBorder>x</GenerativeBorder>);
        expect(container.firstChild).toHaveAttribute('aria-busy', 'false');
        expect(container.querySelector('.plus-generative-border__ring')).toBeNull();
    });

    it('follows the named radius token and falls back to the card radius', () => {
        const { container, rerender } = render(<GenerativeBorder radius="element">x</GenerativeBorder>);
        expect(container.firstChild.style.getPropertyValue('--generative-border-radius')).toBe('var(--size-element-radius-md)');
        rerender(<GenerativeBorder radius="huge">x</GenerativeBorder>);
        expect(container.firstChild.style.getPropertyValue('--generative-border-radius')).toBe('var(--card-radius)');
    });

    it('passes className and other props to the wrapper', () => {
        const { container } = render(<GenerativeBorder className="mine" data-testid="gb">x</GenerativeBorder>);
        expect(container.firstChild).toHaveClass('plus-generative-border', 'mine');
        expect(screen.getByTestId('gb')).toBe(container.firstChild);
    });
});
