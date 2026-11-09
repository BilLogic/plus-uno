import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Icon from '.';

const glyph = (container) => container.querySelector('i');

describe('Icon', () => {
    it('draws regular where Font Awesome Free has a regular weight, and solid where it does not', () => {
        const { container, rerender } = render(<Icon name="calendar-days" />);
        expect(glyph(container)).toHaveClass('fa-regular', 'fa-calendar-days');
        rerender(<Icon name="gear" />);
        expect(glyph(container)).toHaveClass('fa-solid', 'fa-gear');
    });

    it('keeps a family passed in with the name', () => {
        const { container } = render(<Icon name="fa-brands fa-slack" />);
        expect(glyph(container)).toHaveClass('fa-brands', 'fa-slack');
        expect(glyph(container)).not.toHaveClass('fa-regular');
    });

    it('is hidden from assistive technology without a label', () => {
        const { container } = render(<Icon name="bell" />);
        expect(glyph(container)).toHaveAttribute('aria-hidden', 'true');
        expect(glyph(container)).not.toHaveAttribute('role');
    });

    it('is an image named by its label', () => {
        render(<Icon name="bell" label="Notifications" />);
        expect(screen.getByRole('img', { name: 'Notifications' })).not.toHaveAttribute('aria-hidden');
    });

    it('keeps its own accessibility when a caller passes contradicting attributes', () => {
        const { container } = render(<Icon name="bell" label="Bell" aria-hidden="true" role="presentation" />);
        expect(glyph(container)).toHaveAttribute('role', 'img');
        expect(glyph(container)).not.toHaveAttribute('aria-hidden');
    });

    it('leaves size and color to its surroundings unless given', () => {
        const { container } = render(<Icon name="bell" />);
        expect(glyph(container).className).not.toMatch(/plus-icon--(size|color)/);
    });

    it('draws at a token size', () => {
        [12, 16, 24].forEach((size) => {
            const { container, unmount } = render(<Icon name="bell" size={size} />);
            expect(glyph(container)).toHaveClass(`plus-icon--size-${size}`);
            unmount();
        });
    });

    it('draws in an icon color role', () => {
        const { container } = render(<Icon name="bell" color="danger" />);
        expect(glyph(container)).toHaveClass('plus-icon--color-danger');
    });

    it('passes className, style and other props to the glyph', () => {
        const { container } = render(<Icon name="bell" className="mine" style={{ opacity: 0.5 }} data-testid="x" />);
        expect(glyph(container)).toHaveClass('plus-icon', 'mine');
        expect(glyph(container)).toHaveStyle({ opacity: '0.5' });
        expect(glyph(container)).toHaveAttribute('data-testid', 'x');
    });

    it('draws nothing without a name', () => {
        const { container } = render(<Icon />);
        expect(container.firstChild).toBeNull();
    });
});
