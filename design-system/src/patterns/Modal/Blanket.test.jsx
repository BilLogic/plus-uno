import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Blanket from './Blanket';

describe('Blanket', () => {
    it('starts its exit when show drops, in the portaled mode as well as inline', () => {
        const { container, rerender } = render(<Blanket show><p>Inside</p></Blanket>);
        const blanket = container.querySelector('.plus-pattern-blanket');
        expect(blanket).not.toHaveAttribute('data-ending-style');
        expect(blanket).not.toHaveAttribute('inert');

        rerender(<Blanket show={false}><p>Inside</p></Blanket>);
        expect(container.querySelector('.plus-pattern-blanket')).toHaveAttribute('data-ending-style');
        expect(container.querySelector('.plus-pattern-blanket')).toHaveAttribute('inert');
        expect(container.querySelector('.plus-pattern-blanket')).toHaveAttribute('aria-hidden', 'true');
    });
});
