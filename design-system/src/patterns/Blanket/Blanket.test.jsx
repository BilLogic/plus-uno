import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import Blanket, { BLANKET_HEIGHTS, BLANKET_SPANS, BLANKET_WIDTHS } from './Blanket';
import PatternModal from '../PatternModal';

/**
 * Blanket is the full-screen layer a modal is placed in:
 * the blanket fill, the pads and the layer order. Its fill, pads and layers
 * are CSS; this file holds the structure and the shared size names.
 */
describe('Blanket', () => {
    it('names the widths and heights a layer inside it can take', () => {
        expect(BLANKET_WIDTHS).toEqual(['sm', 'md', 'lg']);
        expect(BLANKET_HEIGHTS).toEqual(['hug', 'fill']);
        expect(BLANKET_SPANS).toEqual({ sm: 6, md: 8, lg: 10 });
    });

    it('draws one class, with no placement', () => {
        render(<Blanket data-testid="blanket">x</Blanket>);
        expect(screen.getByTestId('blanket').className).toBe('plus-pattern-blanket');
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
