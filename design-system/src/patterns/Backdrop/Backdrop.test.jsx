import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import Backdrop, { BACKDROP_HEIGHTS, BACKDROP_PLACEMENTS, BACKDROP_SPANS, BACKDROP_WIDTHS } from './Backdrop';
import PatternModal from '../PatternModal';

/**
 * Backdrop is the full-screen layer a modal (and later a drawer) is placed in:
 * the backdrop fill, the pads and the layer order. Its fill, pads and layers
 * are CSS; this file holds the structure and the shared size names.
 */
describe('Backdrop', () => {
    it('names the widths and heights a layer inside it can take', () => {
        expect(BACKDROP_WIDTHS).toEqual(['sm', 'md', 'lg']);
        expect(BACKDROP_HEIGHTS).toEqual(['hug', 'fill']);
        expect(BACKDROP_SPANS).toEqual({ sm: 6, md: 8, lg: 10 });
        expect(BACKDROP_PLACEMENTS).toEqual(['center', 'start', 'end']);
    });

    it('centers by default, with no placement class', () => {
        render(<Backdrop data-testid="backdrop">x</Backdrop>);
        expect(screen.getByTestId('backdrop').className).toBe('plus-pattern-backdrop');
    });

    it('holds its layer at an edge for placement start or end', () => {
        const { rerender } = render(<Backdrop data-testid="backdrop" placement="end">x</Backdrop>);
        expect(screen.getByTestId('backdrop')).toHaveClass('plus-pattern-backdrop-placement-end');
        rerender(<Backdrop data-testid="backdrop" placement="start">x</Backdrop>);
        expect(screen.getByTestId('backdrop')).toHaveClass('plus-pattern-backdrop-placement-start');
        expect(screen.getByTestId('backdrop')).not.toHaveClass('plus-pattern-backdrop-placement-end');
    });

    it('is fixed over the page by default, holding its child', () => {
        render(
            <Backdrop data-testid="backdrop">
                <PatternModal title="Move session">Body</PatternModal>
            </Backdrop>,
        );
        const backdrop = screen.getByTestId('backdrop');
        expect(backdrop).toHaveClass('plus-pattern-backdrop');
        expect(backdrop).not.toHaveClass('plus-pattern-backdrop-inline');
        expect(backdrop).toContainElement(screen.getByRole('dialog', { name: 'Move session' }));
    });

    it('draws in the page flow at a stand-in screen size when inline', () => {
        render(<Backdrop data-testid="backdrop" inline screenWidth={1024} screenHeight={520}>x</Backdrop>);
        const backdrop = screen.getByTestId('backdrop');
        expect(backdrop).toHaveClass('plus-pattern-backdrop-inline');
        expect(backdrop.style.getPropertyValue('--plus-overlay-screen')).toBe('1024px');
        expect(backdrop.style.getPropertyValue('--plus-overlay-screen-height')).toBe('520px');
    });

    it('covers its parent instead of the screen when contained, for the overlay Panel', () => {
        render(<Backdrop data-testid="backdrop" contained aria-hidden="true" />);
        const backdrop = screen.getByTestId('backdrop');
        expect(backdrop).toHaveClass('plus-pattern-backdrop', 'plus-pattern-backdrop-contained');
        expect(backdrop).not.toHaveClass('plus-pattern-backdrop-inline');
    });

    it('ignores the stand-in screen size when it is not inline', () => {
        render(<Backdrop data-testid="backdrop" screenWidth={1024}>x</Backdrop>);
        expect(screen.getByTestId('backdrop').style.getPropertyValue('--plus-overlay-screen')).toBe('');
    });

    it('calls onBackdropClick for a click on the backdrop, not on the modal', () => {
        const onBackdropClick = vi.fn();
        render(
            <Backdrop data-testid="backdrop" onBackdropClick={onBackdropClick}>
                <PatternModal title="Move session">Body</PatternModal>
            </Backdrop>,
        );
        fireEvent.click(screen.getByRole('dialog'));
        expect(onBackdropClick).not.toHaveBeenCalled();
        fireEvent.click(screen.getByTestId('backdrop'));
        expect(onBackdropClick).toHaveBeenCalledTimes(1);
    });
});
