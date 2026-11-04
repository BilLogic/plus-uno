/**
 * `Tooltip` draws one tooltip: no `size` prop, no size class.
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Tooltip from './Tooltip';

describe('Tooltip', () => {
    it('draws one tooltip with no size class or attribute', () => {
        render(
            <Tooltip text="Saved" show>
                <button type="button">Save</button>
            </Tooltip>,
        );
        const tip = screen.getByRole('tooltip');
        expect(tip).toHaveClass('plus-tooltip');
        expect(tip.className).not.toMatch(/plus-tooltip-/);
        expect(tip).not.toHaveAttribute('data-tooltip-size');
    });

    it('declares no size prop', () => {
        expect(Tooltip.propTypes.size).toBeUndefined();
    });
});
