import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Modal from './Modal';

const panel = () => screen.getByTestId('modal');

describe('Modal width by column count', () => {
    it('is 6 columns by default', () => {
        render(<Modal show renderAs="inline" title="T" data-testid="modal" />);
        expect(panel()).toHaveClass('plus-modal-width-6-col');
    });

    it.each(['8-col', '10-col'])('draws %s from the screen grid', (width) => {
        render(<Modal show renderAs="inline" title="T" width={width} data-testid="modal" />);
        expect(panel()).toHaveClass(`plus-modal-width-${width}`);
        expect(panel().style.width).toBe('');
    });

    it('treats the old sm / md / lg names as unsafe lengths, not grid widths', () => {
        render(<Modal show renderAs="inline" title="T" width="md" data-testid="modal" />);
        expect(panel().className).not.toMatch(/plus-modal-width-/);
        expect(panel().style.width).toBe('');
    });

    it('still takes a fixed pixel width', () => {
        render(<Modal show renderAs="inline" title="T" width={480} data-testid="modal" />);
        expect(panel().style.width).toBe('480px');
    });
});

describe('Modal sizing props', () => {
    it('ignores paddingSize, gapSize and radiusSize: they are gone', () => {
        render(<Modal show renderAs="inline" title="T" paddingSize="lg" gapSize="lg" radiusSize="lg" data-testid="modal" />);
        expect(panel().className).not.toMatch(/plus-modal-(pad|gap|radius)-/);
    });
});
