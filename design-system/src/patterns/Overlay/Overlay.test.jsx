import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import Overlay, { OVERLAY_HEIGHTS, OVERLAY_PLACEMENTS, OVERLAY_SPANS, OVERLAY_WIDTHS } from './Overlay';
import PatternModal from '../PatternModal';

/**
 * Overlay is the full-screen layer a modal (and later a drawer) is placed in:
 * the scrim, the pads and the layer order. Its fill, pads and layers are CSS;
 * this file holds the structure and the shared size names.
 */
describe('Overlay', () => {
    it('names the widths and heights a layer inside it can take', () => {
        expect(OVERLAY_WIDTHS).toEqual(['sm', 'md', 'lg']);
        expect(OVERLAY_HEIGHTS).toEqual(['hug', 'fill']);
        expect(OVERLAY_SPANS).toEqual({ sm: 6, md: 8, lg: 10 });
        expect(OVERLAY_PLACEMENTS).toEqual(['center', 'start', 'end']);
    });

    it('centers by default, with no placement class', () => {
        render(<Overlay data-testid="overlay">x</Overlay>);
        expect(screen.getByTestId('overlay').className).toBe('plus-pattern-overlay');
    });

    it('holds its layer at an edge for placement start or end', () => {
        const { rerender } = render(<Overlay data-testid="overlay" placement="end">x</Overlay>);
        expect(screen.getByTestId('overlay')).toHaveClass('plus-pattern-overlay-placement-end');
        rerender(<Overlay data-testid="overlay" placement="start">x</Overlay>);
        expect(screen.getByTestId('overlay')).toHaveClass('plus-pattern-overlay-placement-start');
        expect(screen.getByTestId('overlay')).not.toHaveClass('plus-pattern-overlay-placement-end');
    });

    it('is fixed over the page by default, holding its child', () => {
        render(
            <Overlay data-testid="overlay">
                <PatternModal title="Move session">Body</PatternModal>
            </Overlay>,
        );
        const overlay = screen.getByTestId('overlay');
        expect(overlay).toHaveClass('plus-pattern-overlay');
        expect(overlay).not.toHaveClass('plus-pattern-overlay-inline');
        expect(overlay).toContainElement(screen.getByRole('dialog', { name: 'Move session' }));
    });

    it('draws in the page flow at a stand-in screen size when inline', () => {
        render(<Overlay data-testid="overlay" inline screenWidth={1024} screenHeight={520}>x</Overlay>);
        const overlay = screen.getByTestId('overlay');
        expect(overlay).toHaveClass('plus-pattern-overlay-inline');
        expect(overlay.style.getPropertyValue('--plus-overlay-screen')).toBe('1024px');
        expect(overlay.style.getPropertyValue('--plus-overlay-screen-height')).toBe('520px');
    });

    it('ignores the stand-in screen size when it is not inline', () => {
        render(<Overlay data-testid="overlay" screenWidth={1024}>x</Overlay>);
        expect(screen.getByTestId('overlay').style.getPropertyValue('--plus-overlay-screen')).toBe('');
    });

    it('calls onScrimClick for a click on the scrim, not on the modal', () => {
        const onScrimClick = vi.fn();
        render(
            <Overlay data-testid="overlay" onScrimClick={onScrimClick}>
                <PatternModal title="Move session">Body</PatternModal>
            </Overlay>,
        );
        fireEvent.click(screen.getByRole('dialog'));
        expect(onScrimClick).not.toHaveBeenCalled();
        fireEvent.click(screen.getByTestId('overlay'));
        expect(onScrimClick).toHaveBeenCalledTimes(1);
    });
});
