import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Blanket from './Blanket';

describe('Blanket', () => {
    it('starts its exit when show drops in the portaled mode, without going inert', () => {
        const { container, rerender } = render(<Blanket show><p>Inside</p></Blanket>);
        const blanket = container.querySelector('.plus-pattern-blanket');
        expect(blanket).not.toHaveAttribute('data-ending-style');

        rerender(<Blanket show={false}><p>Inside</p></Blanket>);
        expect(container.querySelector('.plus-pattern-blanket')).toHaveAttribute('data-ending-style');
        // The portaled Blanket holds the focused Dialog: inert would drop focus before Base UI returns it.
        expect(container.querySelector('.plus-pattern-blanket')).not.toHaveAttribute('inert');
    });

    it('goes inert as well as ending when inline', () => {
        const { container, rerender } = render(<Blanket inline show><p>Inside</p></Blanket>);
        rerender(<Blanket inline show={false}><p>Inside</p></Blanket>);
        const blanket = container.querySelector('.plus-pattern-blanket');
        expect(blanket).toHaveAttribute('data-ending-style');
        expect(blanket).toHaveAttribute('inert');
    });
});
