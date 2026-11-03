import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import GenerativeBorder, { GENERATIVE_BORDER_RADII } from '.';

const ringOf = (container) => container.querySelector('.plus-generative-border__ring');

describe('GenerativeBorder', () => {
    it('renders the children with no ring while idle', () => {
        const { container } = render(
            <GenerativeBorder>
                <p>Draft</p>
            </GenerativeBorder>,
        );
        expect(screen.getByText('Draft')).toBeInTheDocument();
        expect(ringOf(container)).toBeNull();
        expect(container.firstChild.childNodes).toHaveLength(1);
        expect(container.firstChild).toHaveAttribute('aria-busy', 'false');
    });

    it('shows a decorative ring and marks the wrapper busy while active', () => {
        const { container } = render(
            <GenerativeBorder isActive>
                <p>Draft</p>
            </GenerativeBorder>,
        );
        expect(ringOf(container)).toHaveAttribute('aria-hidden', 'true');
        expect(container.firstChild).toHaveAttribute('aria-busy', 'true');
    });

    it('flips the ring and aria-busy as isActive changes', () => {
        const { container, rerender } = render(<GenerativeBorder isActive>x</GenerativeBorder>);
        expect(ringOf(container)).not.toBeNull();
        rerender(<GenerativeBorder>x</GenerativeBorder>);
        expect(ringOf(container)).toBeNull();
        expect(container.firstChild).toHaveAttribute('aria-busy', 'false');
    });

    it('follows the named radius token and falls back to radius-100', () => {
        const { container, rerender } = render(<GenerativeBorder radius="radius-050">x</GenerativeBorder>);
        expect(container.firstChild.style.getPropertyValue('--generative-border-radius')).toBe('var(--radius-050)');
        rerender(<GenerativeBorder radius="huge">x</GenerativeBorder>);
        expect(container.firstChild.style.getPropertyValue('--generative-border-radius')).toBe('var(--radius-100)');
        expect(GENERATIVE_BORDER_RADII).toContain('radius-full');
    });

    it('passes className, style and other props to the wrapper', () => {
        const { container } = render(
            <GenerativeBorder className="mine" style={{ maxWidth: 200 }} data-testid="gb">x</GenerativeBorder>,
        );
        expect(container.firstChild).toHaveClass('plus-generative-border', 'mine');
        expect(container.firstChild.style.maxWidth).toBe('200px');
        expect(screen.getByTestId('gb')).toBe(container.firstChild);
    });

    it('keeps its own aria-busy when a caller passes one', () => {
        const { container, rerender } = render(<GenerativeBorder aria-busy="true">x</GenerativeBorder>);
        expect(container.firstChild).toHaveAttribute('aria-busy', 'false');
        rerender(<GenerativeBorder isActive aria-busy="false">x</GenerativeBorder>);
        expect(container.firstChild).toHaveAttribute('aria-busy', 'true');
    });
});
