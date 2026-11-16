import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Button from '@/components/forms-and-inputs/Button';
import { FooterActions } from './FooterActions';

describe('FooterActions 4-track placement (r5)', () => {
    it('places 1 button in the right half (tracks 3-4) with shouldFitContainer', () => {
        render(
            <FooterActions>
                <Button text="Got it" appearance="primary" />
            </FooterActions>
        );
        const btn = screen.getByRole('button', { name: 'Got it' });
        expect(btn).toHaveAttribute('data-footer-track', '3-4');
        expect(btn).toHaveClass('plus-footer-actions__track-3-4', 'plus-btn--fit-container');
    });

    it('places 1 button across all 4 tracks when narrow', () => {
        render(
            <FooterActions narrow>
                <Button text="Got it" appearance="primary" />
            </FooterActions>
        );
        const btn = screen.getByRole('button', { name: 'Got it' });
        expect(btn).toHaveAttribute('data-footer-track', '1-4');
        expect(btn).toHaveClass('plus-footer-actions__track-1-4', 'plus-btn--fit-container');
    });

    it('splits 2 buttons 50/50 across tracks 1-2 and 3-4', () => {
        render(
            <FooterActions>
                <Button text="Discard" />
                <Button text="Save" appearance="primary" />
            </FooterActions>
        );
        const discard = screen.getByRole('button', { name: 'Discard' });
        const save = screen.getByRole('button', { name: 'Save' });
        expect(discard).toHaveAttribute('data-footer-track', '1-2');
        expect(discard).toHaveClass('plus-footer-actions__track-1-2', 'plus-btn--fit-container');
        expect(save).toHaveAttribute('data-footer-track', '3-4');
        expect(save).toHaveClass('plus-footer-actions__track-3-4', 'plus-btn--fit-container');
    });

    it('places 3 buttons in tracks 2, 3 and 4', () => {
        render(
            <FooterActions>
                <Button text="Discard" />
                <Button text="Save draft" />
                <Button text="Schedule" appearance="primary" />
            </FooterActions>
        );
        expect(screen.getByRole('button', { name: 'Discard' })).toHaveAttribute('data-footer-track', '2');
        expect(screen.getByRole('button', { name: 'Save draft' })).toHaveAttribute('data-footer-track', '3');
        expect(screen.getByRole('button', { name: 'Schedule' })).toHaveAttribute('data-footer-track', '4');
    });

    it('hugs a text/ghost button on the left and places filled buttons in tracks 3 and 4', () => {
        render(
            <FooterActions>
                <Button text="Skip" appearance="subtle" />
                <Button text="Save draft" />
                <Button text="Schedule" appearance="primary" />
            </FooterActions>
        );
        const skip = screen.getByRole('button', { name: 'Skip' });
        const draft = screen.getByRole('button', { name: 'Save draft' });
        const schedule = screen.getByRole('button', { name: 'Schedule' });
        expect(skip).toHaveAttribute('data-footer-track', 'leading');
        expect(skip).toHaveClass('plus-footer-actions__leading');
        expect(skip).not.toHaveClass('plus-btn--fit-container');
        expect(draft).toHaveAttribute('data-footer-track', '3');
        expect(schedule).toHaveAttribute('data-footer-track', '4');
    });

    it('splits destructive actions 50/50 with safer secondary left and danger primary right', () => {
        render(
            <FooterActions>
                <Button text="Archive instead" />
                <Button text="Delete note" appearance="danger" />
            </FooterActions>
        );
        const safer = screen.getByRole('button', { name: 'Archive instead' });
        const danger = screen.getByRole('button', { name: 'Delete note' });
        expect(safer).toHaveAttribute('data-footer-track', '1-2');
        expect(danger).toHaveAttribute('data-footer-track', '3-4');
        expect(danger).toHaveClass('plus-btn--danger');
    });
});
