import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import Blanket, { BLANKET_HEIGHTS, BLANKET_PLACEMENTS, BLANKET_SPANS, BLANKET_WIDTHS } from './Blanket';
import PatternModal from '../PatternModal';

/**
 * Blanket is the full-screen layer a modal (and later a drawer) is placed in:
 * the blanket fill, the pads and the layer order. Its fill, pads and layers
 * are CSS; this file holds the structure and the shared size names.
 */
describe('Blanket', () => {
    it('names the widths and heights a layer inside it can take', () => {
        expect(BLANKET_WIDTHS).toEqual(['sm', 'md', 'lg']);
        expect(BLANKET_HEIGHTS).toEqual(['hug', 'fill']);
        expect(BLANKET_SPANS).toEqual({ sm: 6, md: 8, lg: 10 });
        expect(BLANKET_PLACEMENTS).toEqual(['center', 'start', 'end']);
    });

    it('centers by default, with no placement class', () => {
        render(<Blanket data-testid="blanket">x</Blanket>);
        expect(screen.getByTestId('blanket').className).toBe('plus-pattern-blanket');
    });

    it('holds its layer at an edge for placement start or end', () => {
        const { rerender } = render(<Blanket data-testid="blanket" placement="end">x</Blanket>);
        expect(screen.getByTestId('blanket')).toHaveClass('plus-pattern-blanket-placement-end');
        rerender(<Blanket data-testid="blanket" placement="start">x</Blanket>);
        expect(screen.getByTestId('blanket')).toHaveClass('plus-pattern-blanket-placement-start');
        expect(screen.getByTestId('blanket')).not.toHaveClass('plus-pattern-blanket-placement-end');
    });

    it('is fixed over the page by default, holding its child', () => {
        render(
            <Blanket data-testid="blanket">
                <PatternModal title="Move session">Body</PatternModal>
            </Blanket>,
        );
        const blanket = screen.getByTestId('blanket');
        expect(blanket).toHaveClass('plus-pattern-blanket');
        expect(blanket).not.toHaveClass('plus-pattern-blanket-inline');
        expect(blanket).toContainElement(screen.getByRole('dialog', { name: 'Move session' }));
    });

    it('draws in the page flow at a stand-in screen size when inline', () => {
        render(<Blanket data-testid="blanket" inline screenWidth={1024} screenHeight={520}>x</Blanket>);
        const blanket = screen.getByTestId('blanket');
        expect(blanket).toHaveClass('plus-pattern-blanket-inline');
        expect(blanket.style.getPropertyValue('--plus-overlay-screen')).toBe('1024px');
        expect(blanket.style.getPropertyValue('--plus-overlay-screen-height')).toBe('520px');
    });

    it('covers its parent instead of the screen when contained, for the overlay Panel', () => {
        render(<Blanket data-testid="blanket" contained aria-hidden="true" />);
        const blanket = screen.getByTestId('blanket');
        expect(blanket).toHaveClass('plus-pattern-blanket', 'plus-pattern-blanket-contained');
        expect(blanket).not.toHaveClass('plus-pattern-blanket-inline');
    });

    it('ignores the stand-in screen size when it is not inline', () => {
        render(<Blanket data-testid="blanket" screenWidth={1024}>x</Blanket>);
        expect(screen.getByTestId('blanket').style.getPropertyValue('--plus-overlay-screen')).toBe('');
    });

    it('calls onBlanketClick for a click on the blanket, not on the modal', () => {
        const onBlanketClick = vi.fn();
        render(
            <Blanket data-testid="blanket" onBlanketClick={onBlanketClick}>
                <PatternModal title="Move session">Body</PatternModal>
            </Blanket>,
        );
        fireEvent.click(screen.getByRole('dialog'));
        expect(onBlanketClick).not.toHaveBeenCalled();
        fireEvent.click(screen.getByTestId('blanket'));
        expect(onBlanketClick).toHaveBeenCalledTimes(1);
    });
});
