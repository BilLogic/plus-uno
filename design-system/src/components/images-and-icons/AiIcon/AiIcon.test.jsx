import React from 'react';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AiIcon, { AI_ICON_NAMES, AI_ICON_SIZES } from '.';

describe('AiIcon', () => {
    afterEach(() => vi.restoreAllMocks());

    it('is hidden from assistive technology without a label', () => {
        const { container } = render(<AiIcon name="ask" />);
        const svg = container.querySelector('svg');
        expect(svg).toHaveAttribute('aria-hidden', 'true');
        expect(svg).not.toHaveAttribute('role');
        expect(svg).not.toHaveAttribute('aria-label');
    });

    it('is an image with the name when given a label', () => {
        render(<AiIcon name="summarize" label="Summarize" />);
        const icon = screen.getByRole('img', { name: 'Summarize' });
        expect(icon).not.toHaveAttribute('aria-hidden');
    });

    it('keeps its own accessibility attributes when a caller passes others', () => {
        const { container, rerender } = render(<AiIcon label="Plan" aria-hidden="true" role="presentation" />);
        expect(container.querySelector('svg')).toHaveAttribute('role', 'img');
        expect(container.querySelector('svg')).not.toHaveAttribute('aria-hidden');
        rerender(<AiIcon role="img" aria-label="x" />);
        expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });

    it('fills with currentColor', () => {
        const { container } = render(<AiIcon name="suggest" size={24} />);
        const svg = container.querySelector('svg');
        expect(svg).toHaveAttribute('fill', 'currentColor');
        expect(svg.querySelectorAll('[fill]:not(svg)')).toHaveLength(0);
    });

    it("cuts plan's calendar with the even-odd rule", () => {
        const { container } = render(<AiIcon name="plan" />);
        container.querySelectorAll('path').forEach((path) => expect(path).toHaveAttribute('fill-rule', 'evenodd'));
    });

    it('draws every name at every size it has, as a square of that size', () => {
        AI_ICON_NAMES.forEach((name) => {
            expect(AI_ICON_SIZES[name]).toContain(16);
            AI_ICON_SIZES[name].forEach((size) => {
                const { container, unmount } = render(<AiIcon name={name} size={size} />);
                const svg = container.querySelector('svg');
                expect(svg).toHaveAttribute('width', String(size));
                expect(svg).toHaveAttribute('height', String(size));
                expect(svg.getAttribute('viewBox').split(' ').slice(2)).toEqual([String(size), String(size)]);
                expect(svg.querySelectorAll('path').length).toBeGreaterThan(0);
                unmount();
            });
        });
    });

    it('offers 12 only for generate and stop-generating', () => {
        const with12 = AI_ICON_NAMES.filter((name) => AI_ICON_SIZES[name].includes(12));
        expect(with12).toEqual(['generate', 'stop-generating']);
    });

    it('draws a size an icon lacks at 16 and warns', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const { container } = render(<AiIcon name="plan" size={12} />);
        expect(container.querySelector('svg')).toHaveAttribute('width', '16');
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('"plan" has no 12px size'));
    });

    it('draws nothing for an unknown name', () => {
        const { container } = render(<AiIcon name="nope" />);
        expect(container.firstChild).toBeNull();
    });

    it('passes className and other props to the svg', () => {
        const { container } = render(<AiIcon className="mine" data-testid="icon" />);
        expect(container.firstChild).toHaveClass('plus-ai-icon', 'mine');
        expect(screen.getByTestId('icon')).toBe(container.firstChild);
    });
});
