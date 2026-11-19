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

    it('detects leading actions by role (link, danger first of two or more, or leadingAction slot) and keeps them hugging content', () => {
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
                <LinkButton text="Learn more" href="https://plus.org" />
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

    it('lays a subtle first child out as an ordinary filled track', () => {
        render(
            <FooterActions>
                <Button text="Not now" appearance="subtle" />
                <Button text="Save" appearance="primary" />
            </FooterActions>
        );
        expect(screen.getByRole('button', { name: 'Not now' })).toHaveClass('plus-btn--fit-container');
        expect(screen.getByRole('button', { name: 'Not now' })).not.toHaveClass('plus-footer-actions__leading');
    });

    it('renders all 4 buttons when a leading action pairs with 3 filled buttons', () => {
        render(
            <FooterActions>
                <Button text="Delete draft" appearance="danger" />
                <Button text="Discard" />
                <Button text="Save draft" />
                <Button text="Schedule" appearance="primary" />
            </FooterActions>
        );
        expect(screen.getByRole('button', { name: 'Delete draft' })).not.toHaveClass('plus-btn--fit-container');
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

    it('draws a leading danger action as a danger-link, whether it is the first child or the leadingAction', () => {
        const { rerender } = render(
            <FooterActions leadingAction={<Button text="Delete session" appearance="danger" />}>
                <Button text="Discard" />
                <Button text="Save" appearance="primary" />
            </FooterActions>
        );
        expect(screen.getByRole('button', { name: 'Delete session' })).toHaveClass('plus-btn--danger-link');
        expect(screen.getByRole('button', { name: 'Delete session' })).not.toHaveClass('plus-btn--danger');

        rerender(
            <FooterActions>
                <Button text="Delete draft" appearance="danger" />
                <Button text="Save" appearance="primary" />
            </FooterActions>
        );
        expect(screen.getByRole('button', { name: 'Delete draft' })).toHaveClass('plus-btn--danger-link');
        expect(screen.getByRole('button', { name: 'Save' })).toHaveClass('plus-btn--primary');
    });

    it('draws any other leading action as a link, and treats a link appearance as leading', () => {
        const { rerender } = render(
            <FooterActions leadingAction={<LinkButton text="Save and exit" href="#exit" appearance="subtle" />}>
                <Button text="Next" appearance="primary" />
            </FooterActions>
        );
        expect(screen.getByRole('link', { name: 'Save and exit' })).toHaveClass('plus-btn--link');
        expect(screen.getByRole('link', { name: 'Save and exit' })).not.toHaveClass('plus-btn--subtle');

        rerender(
            <FooterActions>
                <Button text="Open profile" appearance="link" />
                <Button text="Close" appearance="primary" />
            </FooterActions>
        );
        expect(screen.getByRole('button', { name: 'Open profile' })).toHaveClass('plus-btn--link', 'plus-footer-actions__leading');
        expect(screen.getByRole('button', { name: 'Close' })).toHaveClass('plus-btn--primary', 'plus-btn--fit-container');
    });
});
