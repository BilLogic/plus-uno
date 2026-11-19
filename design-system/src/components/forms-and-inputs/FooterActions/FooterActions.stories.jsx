import React from 'react';
import { expect, within } from 'storybook/test';
import { Button, FooterActions, LinkButton } from '@/components';
import {
    PanelBody,
    PanelCloseAction,
    PanelContainer,
    PanelFooter,
    PanelHeader,
} from '@/templates';
import { footerTracks } from '@/storybook-docs/lib/full-bleed-footer.jsx';
import { tokenColor, tokenLength } from '@/storybook-docs/lib/style-probes.js';

const stageStyle = {
    inlineSize: '560px',
    maxInlineSize: '100%',
    padding: 'var(--modal-pad)',
    background: 'var(--ds-surface-overlay)',
    border: 'var(--border-width-default) solid var(--ds-border)',
    borderRadius: 'var(--radius-lg)',
    boxSizing: 'border-box',
};

const rect = (el) => el.getBoundingClientRect();

export default {
    title: 'Components/Forms and inputs/Button/Footer actions',
    component: FooterActions,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: { toc: { title: 'On this page' } },
    },
    argTypes: {
        leadingAction: { table: { disable: true, category: 'Content' } },
        children: { table: { disable: true, category: 'Content' } },
        className: { control: false, table: { disable: true, category: 'Development' } },
        style: { control: false, table: { disable: true, category: 'Development' } },
    },
};

/** 1 button: sits in the right half (tracks 3–4) at spacious (48) height. */
export const OneButton = {
    render: () => (
        <div style={stageStyle}>
            <FooterActions>
                <Button text="Got it" appearance="primary" />
            </FooterActions>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const footer = canvasElement.querySelector('[data-probe="footer"]');
        const tracks = footerTracks(footer);
        const button = within(footer).getByRole('button', { name: 'Got it' });
        await expect(rect(button).height, 'spacious 48 button height').toBeCloseTo(tokenLength(footer, '--control-xl'), 0);
        await expect(rect(button).left, 'starts on track 3').toBeCloseTo(tracks.span(3, 4).left, 0);
        await expect(rect(button).right, 'ends on track 4').toBeCloseTo(tracks.span(3, 4).right, 0);
    },
};

/** 2 buttons: 50/50 split across tracks 1–2 and 3–4, soft-fill secondary left and primary right. */
export const TwoButtons = {
    render: () => (
        <div style={stageStyle}>
            <FooterActions>
                <Button text="Discard" />
                <Button text="Save" appearance="primary" />
            </FooterActions>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const footer = canvasElement.querySelector('[data-probe="footer"]');
        const tracks = footerTracks(footer);
        const discard = within(footer).getByRole('button', { name: 'Discard' });
        const save = within(footer).getByRole('button', { name: 'Save' });
        await expect(rect(discard).height, 'spacious 48 button height').toBeCloseTo(tokenLength(footer, '--control-xl'), 0);
        await expect(getComputedStyle(discard).backgroundColor, 'soft-fill neutral secondary').toBe(
            tokenColor(footer, '--ds-background-neutral')
        );
        await expect(rect(discard).left, 'secondary starts on track 1').toBeCloseTo(tracks.span(1, 2).left, 0);
        await expect(rect(discard).right, 'secondary ends on track 2').toBeCloseTo(tracks.span(1, 2).right, 0);
        await expect(rect(save).left, 'primary starts on track 3').toBeCloseTo(tracks.span(3, 4).left, 0);
        await expect(rect(save).right, 'primary ends on track 4').toBeCloseTo(tracks.span(3, 4).right, 0);
    },
};

/** 3 buttons: one quarter each in tracks 2, 3 and 4; only the rightmost is primary. */
export const ThreeButtons = {
    render: () => (
        <div style={stageStyle}>
            <FooterActions>
                <Button text="Discard" />
                <Button text="Save draft" />
                <Button text="Schedule" appearance="primary" />
            </FooterActions>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const footer = canvasElement.querySelector('[data-probe="footer"]');
        const tracks = footerTracks(footer);
        const discard = within(footer).getByRole('button', { name: 'Discard' });
        const draft = within(footer).getByRole('button', { name: 'Save draft' });
        const schedule = within(footer).getByRole('button', { name: 'Schedule' });
        await expect(rect(discard).left, 'first button in track 2').toBeCloseTo(tracks.track(2).left, 0);
        await expect(rect(discard).right, 'first button in track 2').toBeCloseTo(tracks.track(2).right, 0);
        await expect(rect(draft).left, 'second button in track 3').toBeCloseTo(tracks.track(3).left, 0);
        await expect(rect(draft).right, 'second button in track 3').toBeCloseTo(tracks.track(3).right, 0);
        await expect(rect(schedule).left, 'third button in track 4').toBeCloseTo(tracks.track(4).left, 0);
        await expect(rect(schedule).right, 'third button in track 4').toBeCloseTo(tracks.track(4).right, 0);
    },
};

/** "Not now" is a secondary button: `default`, in the left half beside the primary. */
export const DeclineInLeftHalf = {
    render: () => (
        <div style={stageStyle}>
            <FooterActions>
                <Button text="Not now" />
                <Button text="Turn on reminders" appearance="primary" />
            </FooterActions>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const footer = canvasElement.querySelector('[data-probe="footer"]');
        const tracks = footerTracks(footer);
        const notNow = within(footer).getByRole('button', { name: 'Not now' });
        const turnOn = within(footer).getByRole('button', { name: 'Turn on reminders' });
        await expect(notNow, 'declining is a default secondary, not subtle').toHaveClass('plus-btn--default');
        await expect(notNow, 'secondary fills its track').toHaveClass('plus-btn--fit-container');
        await expect(rect(notNow).left, 'secondary starts at track 1').toBeCloseTo(tracks.track(1).left, 0);
        await expect(rect(notNow).right, 'secondary ends at track 2').toBeCloseTo(tracks.track(2).right, 0);
        await expect(rect(turnOn).left, 'primary starts at track 3').toBeCloseTo(tracks.track(3).left, 0);
    },
};

/** A subtle first child takes a track like any other action; it does not hug the left edge. */
export const SubtleFillsTrack = {
    render: () => (
        <div style={stageStyle}>
            <FooterActions>
                <Button text="Not now" appearance="subtle" />
                <Button text="Save" appearance="primary" />
            </FooterActions>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const footer = canvasElement.querySelector('[data-probe="footer"]');
        const tracks = footerTracks(footer);
        const notNow = within(footer).getByRole('button', { name: 'Not now' });
        await expect(notNow, 'subtle fills its track').toHaveClass('plus-btn--fit-container');
        await expect(rect(notNow).left, 'starts at track 1').toBeCloseTo(tracks.track(1).left, 0);
        await expect(rect(notNow).right, 'ends at track 2').toBeCloseTo(tracks.track(2).right, 0);
    },
};

/** A link that leaves the task hugs the left content edge while filled actions take tracks 3 and 4. */
export const LinkLeft = {
    render: () => (
        <div style={stageStyle}>
            <FooterActions>
                <LinkButton text="View guidelines" href="#guidelines" />
                <Button text="Save draft" />
                <Button text="Schedule" appearance="primary" />
            </FooterActions>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const footer = canvasElement.querySelector('[data-probe="footer"]');
        const tracks = footerTracks(footer);
        const guidelines = within(footer).getByRole('link', { name: 'View guidelines' });
        const draft = within(footer).getByRole('button', { name: 'Save draft' });
        const schedule = within(footer).getByRole('button', { name: 'Schedule' });
        await expect(rect(guidelines).left, 'hugs left content edge').toBeCloseTo(tracks.box.left, 0);
        await expect(rect(guidelines).width, 'hugs label instead of filling tracks 1-2').toBeLessThan(tracks.span(1, 2).width);
        await expect(rect(draft).left, 'secondary in track 3').toBeCloseTo(tracks.track(3).left, 0);
        await expect(rect(draft).right, 'secondary in track 3').toBeCloseTo(tracks.track(3).right, 0);
        await expect(rect(schedule).left, 'primary in track 4').toBeCloseTo(tracks.track(4).left, 0);
        await expect(rect(schedule).right, 'primary in track 4').toBeCloseTo(tracks.track(4).right, 0);
    },
};

/** A `danger` "Delete session" action hugs the left edge in danger text ink while filled buttons sit in tracks 3 and 4. */
export const DangerLeft = {
    render: () => (
        <div style={stageStyle}>
            <FooterActions leadingAction={<Button text="Delete session" appearance="danger" />}>
                <Button text="Discard" />
                <Button text="Save" appearance="primary" />
            </FooterActions>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const footer = canvasElement.querySelector('[data-probe="footer"]');
        const tracks = footerTracks(footer);
        const del = within(footer).getByRole('button', { name: 'Delete session' });
        const discard = within(footer).getByRole('button', { name: 'Discard' });
        const save = within(footer).getByRole('button', { name: 'Save' });
        await expect(rect(del).left, 'danger text button hugs left content edge').toBeCloseTo(tracks.box.left, 0);
        await expect(rect(del).width, 'danger text button hugs its label').toBeLessThan(tracks.span(1, 2).width);
        await expect(getComputedStyle(del).backgroundColor, 'ghost background at rest').toBe('rgba(0, 0, 0, 0)');
        await expect(getComputedStyle(del).color, 'danger text ink').toBe(tokenColor(footer, '--ds-text-danger'));
        await expect(rect(discard).left, 'secondary in track 3').toBeCloseTo(tracks.track(3).left, 0);
        await expect(rect(discard).right, 'secondary in track 3').toBeCloseTo(tracks.track(3).right, 0);
        await expect(rect(save).left, 'primary in track 4').toBeCloseTo(tracks.track(4).left, 0);
        await expect(rect(save).right, 'primary in track 4').toBeCloseTo(tracks.track(4).right, 0);
    },
};

/** Edge case: a leading action plus 3 filled buttons places the leading action in track 1 and the 3 filled buttons in tracks 2, 3 and 4. */
export const LeadingWithThreeFilled = {
    render: () => (
        <div style={stageStyle}>
            <FooterActions>
                <Button text="Delete draft" appearance="danger" />
                <Button text="Discard" />
                <Button text="Save draft" />
                <Button text="Schedule" appearance="primary" />
            </FooterActions>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const footer = canvasElement.querySelector('[data-probe="footer"]');
        const tracks = footerTracks(footer);
        const deleteDraft = within(footer).getByRole('button', { name: 'Delete draft' });
        const discard = within(footer).getByRole('button', { name: 'Discard' });
        const draft = within(footer).getByRole('button', { name: 'Save draft' });
        const schedule = within(footer).getByRole('button', { name: 'Schedule' });
        await expect(rect(deleteDraft).left, 'leading action starts at track 1 left').toBeCloseTo(tracks.track(1).left, 0);
        await expect(rect(deleteDraft).right, 'leading action stays within track 1').toBeLessThanOrEqual(tracks.track(1).right);
        await expect(rect(discard).left, 'first filled button in track 2').toBeCloseTo(tracks.track(2).left, 0);
        await expect(rect(discard).right, 'first filled button in track 2').toBeCloseTo(tracks.track(2).right, 0);
        await expect(rect(draft).left, 'second filled button in track 3').toBeCloseTo(tracks.track(3).left, 0);
        await expect(rect(draft).right, 'second filled button in track 3').toBeCloseTo(tracks.track(3).right, 0);
        await expect(rect(schedule).left, 'third filled button in track 4').toBeCloseTo(tracks.track(4).left, 0);
        await expect(rect(schedule).right, 'third filled button in track 4').toBeCloseTo(tracks.track(4).right, 0);
    },
};

/** Destructive split: safer alternative secondary on the left (tracks 1–2) and danger primary on the right (tracks 3–4). */
export const DestructiveSplit = {
    render: () => (
        <div style={stageStyle}>
            <FooterActions>
                <Button text="Archive instead" />
                <Button text="Delete note" appearance="danger" />
            </FooterActions>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const footer = canvasElement.querySelector('[data-probe="footer"]');
        const tracks = footerTracks(footer);
        const safer = within(footer).getByRole('button', { name: 'Archive instead' });
        const danger = within(footer).getByRole('button', { name: 'Delete note' });
        await expect(rect(safer).left, 'safer alternative starts on track 1').toBeCloseTo(tracks.span(1, 2).left, 0);
        await expect(rect(safer).right, 'safer alternative ends on track 2').toBeCloseTo(tracks.span(1, 2).right, 0);
        await expect(rect(danger).left, 'danger primary starts on track 3').toBeCloseTo(tracks.span(3, 4).left, 0);
        await expect(rect(danger).right, 'danger primary ends on track 4').toBeCloseTo(tracks.span(3, 4).right, 0);
    },
};

/** Steps footer: Back and Next split 50/50 across tracks 1–2 and 3–4. */
export const Steps = {
    render: () => (
        <div style={stageStyle}>
            <FooterActions>
                <Button text="Back" />
                <Button text="Next" appearance="primary" />
            </FooterActions>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const footer = canvasElement.querySelector('[data-probe="footer"]');
        const tracks = footerTracks(footer);
        const back = within(footer).getByRole('button', { name: 'Back' });
        const next = within(footer).getByRole('button', { name: 'Next' });
        await expect(rect(back).left, 'Back starts on track 1').toBeCloseTo(tracks.span(1, 2).left, 0);
        await expect(rect(back).right, 'Back ends on track 2').toBeCloseTo(tracks.span(1, 2).right, 0);
        await expect(rect(next).left, 'Next starts on track 3').toBeCloseTo(tracks.span(3, 4).left, 0);
        await expect(rect(next).right, 'Next ends on track 4').toBeCloseTo(tracks.span(3, 4).right, 0);
    },
};

/** Narrow Panel (400): measured by `@container (max-width: 400px)` with no prop, so a single action fills tracks 1–4 and two actions split 50/50. */
export const NarrowPanel = {
    render: () => (
        <div style={{ display: 'flex', gap: 'var(--inline-3xl)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <PanelContainer width="var(--panel-width-default)">
                <PanelHeader title="Session moved" actions={<PanelCloseAction />} />
                <PanelBody>Thursday’s session with Ana is now at 4:30 PM.</PanelBody>
                <PanelFooter>
                    <FooterActions data-probe="footer-single">
                        <Button text="Got it" appearance="primary" />
                    </FooterActions>
                </PanelFooter>
            </PanelContainer>
            <PanelContainer width="var(--panel-width-default)">
                <PanelHeader title="Edit session" actions={<PanelCloseAction />} />
                <PanelBody>Update the session time or notes.</PanelBody>
                <PanelFooter>
                    <FooterActions data-probe="footer-pair">
                        <Button text="Discard" />
                        <Button text="Save" appearance="primary" />
                    </FooterActions>
                </PanelFooter>
            </PanelContainer>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const singleFooter = canvasElement.querySelector('[data-probe="footer-single"]');
        const singleTracks = footerTracks(singleFooter);
        const gotIt = within(singleFooter).getByRole('button', { name: 'Got it' });
        await expect(rect(gotIt).left, 'single action in 400 Panel starts on track 1').toBeCloseTo(
            singleTracks.span(1, 4).left,
            0
        );
        await expect(rect(gotIt).right, 'single action in 400 Panel ends on track 4').toBeCloseTo(
            singleTracks.span(1, 4).right,
            0
        );

        const pairFooter = canvasElement.querySelector('[data-probe="footer-pair"]');
        const pairTracks = footerTracks(pairFooter);
        const discard = within(pairFooter).getByRole('button', { name: 'Discard' });
        const save = within(pairFooter).getByRole('button', { name: 'Save' });
        await expect(rect(discard).left, 'Discard starts on track 1').toBeCloseTo(pairTracks.span(1, 2).left, 0);
        await expect(rect(discard).right, 'Discard ends on track 2').toBeCloseTo(pairTracks.span(1, 2).right, 0);
        await expect(rect(save).left, 'Save starts on track 3').toBeCloseTo(pairTracks.span(3, 4).left, 0);
        await expect(rect(save).right, 'Save ends on track 4').toBeCloseTo(pairTracks.span(3, 4).right, 0);
    },
};

export const Interactive = {
    render: (args) => (
        <div style={stageStyle}>
            <FooterActions {...args}>
                <Button text="Discard" />
                <Button text="Save" appearance="primary" />
            </FooterActions>
        </div>
    ),
};
