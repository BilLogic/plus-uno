import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Button from '@/components/forms-and-inputs/Button';
import LinkButton from '@/components/forms-and-inputs/LinkButton';
import * as FooterActionsModule from './FooterActions';
import { FooterActions } from './FooterActions';

describe('FooterActions non-layout behavior', () => {
    it('does not export footerTracks from production module or accept a manual narrow prop', () => {
        expect(FooterActionsModule.footerTracks).toBeUndefined();
        expect(FooterActions.propTypes?.narrow).toBeUndefined();
        expect(FooterActions.propTypes?.leadingAction).toBeDefined();
    });

    it('clones filled buttons with spacious spacing and shouldFitContainer, and preserves click handlers', async () => {
        const user = userEvent.setup();
        const onDiscard = vi.fn();
        const onSave = vi.fn();
        render(
            <FooterActions>
                <Button text="Discard" onClick={onDiscard} />
                <Button text="Save" appearance="primary" onClick={onSave} />
            </FooterActions>
        );
        const discard = screen.getByRole('button', { name: 'Discard' });
        const save = screen.getByRole('button', { name: 'Save' });
        expect(discard).toHaveClass('plus-btn--spacious', 'plus-btn--fit-container');
        expect(save).toHaveClass('plus-btn--spacious', 'plus-btn--fit-container');
        await user.click(discard);
        await user.click(save);
        expect(onDiscard).toHaveBeenCalledTimes(1);
        expect(onSave).toHaveBeenCalledTimes(1);
    });

    it('detects leading actions by role (subtle, link, danger leading, or leadingAction slot) and keeps them hugging content', () => {
        const { rerender } = render(
            <FooterActions leadingAction={<Button text="Delete session" appearance="danger" />}>
                <Button text="Discard" />
                <Button text="Save" appearance="primary" />
            </FooterActions>
        );
        expect(screen.getByRole('button', { name: 'Delete session' })).not.toHaveClass('plus-btn--fit-container');
        expect(screen.getByRole('button', { name: 'Discard' })).toHaveClass('plus-btn--fit-container');
        expect(screen.getByRole('button', { name: 'Save' })).toHaveClass('plus-btn--fit-container');

        rerender(
            <FooterActions>
                <LinkButton text="Learn more" href="https://plus.org" appearance="subtle" />
                <Button text="Got it" appearance="primary" />
            </FooterActions>
        );
        expect(screen.getByRole('link', { name: 'Learn more' })).not.toHaveClass('plus-btn--fit-container');
        expect(screen.getByRole('button', { name: 'Got it' })).toHaveClass('plus-btn--fit-container');

        rerender(
            <FooterActions>
                <Button text="Delete session" appearance="danger" />
                <Button text="Discard" />
                <Button text="Save" appearance="primary" />
            </FooterActions>
        );
        expect(screen.getByRole('button', { name: 'Delete session' })).not.toHaveClass('plus-btn--fit-container');
        expect(screen.getByRole('button', { name: 'Discard' })).toHaveClass('plus-btn--fit-container');
        expect(screen.getByRole('button', { name: 'Save' })).toHaveClass('plus-btn--fit-container');
    });

    it('renders all 4 buttons when a leading text button pairs with 3 filled buttons', () => {
        render(
            <FooterActions>
                <Button text="Skip" appearance="subtle" />
                <Button text="Discard" />
                <Button text="Save draft" />
                <Button text="Schedule" appearance="primary" />
            </FooterActions>
        );
        expect(screen.getByRole('button', { name: 'Skip' })).not.toHaveClass('plus-btn--fit-container');
        expect(screen.getByRole('button', { name: 'Discard' })).toHaveClass('plus-btn--fit-container');
        expect(screen.getByRole('button', { name: 'Save draft' })).toHaveClass('plus-btn--fit-container');
        expect(screen.getByRole('button', { name: 'Schedule' })).toHaveClass('plus-btn--fit-container');
    });

    it('warns in dev when a 4th filled button is passed and does not silently drop it', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        try {
            render(
                <FooterActions>
                    <Button text="One" />
                    <Button text="Two" />
                    <Button text="Three" />
                    <Button text="Four" appearance="primary" />
                </FooterActions>
            );
            expect(warn).toHaveBeenCalledWith(expect.stringMatching(/FooterActions/));
            expect(screen.getByRole('button', { name: 'One' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Two' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Three' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Four' })).toBeInTheDocument();
        } finally {
            warn.mockRestore();
        }
    });
});
