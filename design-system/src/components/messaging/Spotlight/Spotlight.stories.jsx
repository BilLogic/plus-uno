import React, { useState } from 'react';
import { expectHovered, expectPressed, expectFocusRing } from '@/storybook-docs/lib/button-states.js';
import { DoDontPair } from '@/storybook-docs/ds-docs-layout.jsx';
import { tokenColor } from '@/storybook-docs/lib/style-probes.js';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { withForcedPseudo } from '@/storybook-docs/lib/force-pseudo.js';
import { Button, Spotlight, SPOTLIGHT_PLACEMENTS, SpotlightAction, SpotlightProvider, SpotlightTarget } from '@/components';
import {
    FeatureHeadlineDo,
    FeatureHeadlineDont,
    SecondaryLinkDo,
    SecondaryLinkDont,
    StepCountTourDo,
    StepCountTourDont,
} from '@/storybook-docs/lib/spotlight-cases';

export default {
    title: 'Components/Messaging/Spotlight',
    component: Spotlight,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        placement: { control: 'select', options: SPOTLIGHT_PLACEMENTS, table: { category: 'Layout' } },
        headline: { control: 'text', table: { category: 'Content' } },
        children: { control: 'text', table: { category: 'Content' } },
        stepCount: { control: 'text', table: { category: 'Content' } },
        dismissible: { control: 'boolean', table: { category: 'Behavior' } },
        target: { table: { disable: true } },
        media: { table: { disable: true } },
        primaryAction: { table: { disable: true } },
        secondaryAction: { table: { disable: true } },
        onDismiss: { table: { disable: true } },
        isOpen: { table: { disable: true } },
        className: { table: { disable: true } },
        primaryActionText: { name: 'Primary action (demo)', control: 'text', table: { category: 'Demo' } },
        secondaryActionText: { name: 'Secondary action (demo)', control: 'text', table: { category: 'Demo' } },
    },
};

// The callout is a portal, so it sits outside the canvas flow. The target is centered
// and the canvas is tall enough for the callout below it, so it never spills onto the prose.
const calloutCanvas = {
    display: 'flex',
    justifyContent: 'center',
    padding: 'var(--space-400)',
    minHeight: 'var(--size-2500)',
};
const calloutCanvasTall = { ...calloutCanvas, minHeight: 'var(--size-3000)' };

export const Basic = () => (
    <SpotlightProvider>
        <div style={calloutCanvas}>
            <SpotlightTarget>
                <Button id="spotlight-target-basic" text="Create" />
            </SpotlightTarget>
            <Spotlight
                headline="Create a new board"
                stepCount="1 of 3"
                primaryAction={<SpotlightAction appearance="primary">Next</SpotlightAction>}
                secondaryAction={<SpotlightAction appearance="secondary">Skip</SpotlightAction>}
            >
                Start a new board from here.
            </Spotlight>
        </div>
    </SpotlightProvider>
);

Basic.play = async () => {
    // Base UI's Popover.Portal renders into document.body, outside canvasElement.
    const headline = document.querySelector('.plus-spotlight-headline');
    await expect(headline).toHaveTextContent('Create a new board');
    const dismiss = document.querySelector('.plus-spotlight-dismiss-button');
    await expect(dismiss).toBeTruthy();
    await expect(getComputedStyle(document.querySelector('.plus-spotlight')).borderTopLeftRadius, 'Spotlight radius is 12').toBe('12px');
};

export const WithMedia = () => (
    <SpotlightProvider>
        <div style={calloutCanvasTall}>
            <SpotlightTarget><Button text="Target" /></SpotlightTarget>
            <Spotlight
                headline="See it in action"
                media={<img src="https://placehold.co/295x135" alt="" />}
                primaryAction={<SpotlightAction appearance="primary">Got it</SpotlightAction>}
            >
                A short preview of the feature.
            </Spotlight>
        </div>
    </SpotlightProvider>
);

export const LinkAction = () => (
    <SpotlightProvider>
        <div style={calloutCanvas}>
            <SpotlightTarget><Button text="Target" /></SpotlightTarget>
            <Spotlight
                headline="Read more"
                primaryAction={<SpotlightAction appearance="primary" href="https://example.com">Learn more</SpotlightAction>}
                id="spotlight-link-action"
            >
                This action links out instead of calling a handler.
            </Spotlight>
        </div>
    </SpotlightProvider>
);

LinkAction.play = async () => {
    const action = document.querySelector('.plus-spotlight-action--primary');
    await expect(action.tagName).toBe('A');
};

export function Dismissible() {
    const [isOpen, setIsOpen] = useState(true);
    return (
        <SpotlightProvider>
            <div style={calloutCanvas}>
                <SpotlightTarget><Button text="Target" /></SpotlightTarget>
                {isOpen && (
                    <Spotlight headline="Dismiss me" onDismiss={() => setIsOpen(false)}>
                        Click the X to close this.
                    </Spotlight>
                )}
            </div>
        </SpotlightProvider>
    );
}

/* ----------------------------------------------------- one action per story */

/** A SpotlightAction on the callout's brand bold ground, without opening a popup. */
const actionStory = (appearance, label) => ({
    render: () => (
        <div style={{ display: 'inline-flex', padding: 'var(--space-150)', borderRadius: 'var(--radius-xxl)', background: 'var(--ds-background-brand-bold)' }}>
            <SpotlightAction appearance={appearance}>{label}</SpotlightAction>
        </div>
    ),
    play: async ({ canvasElement }) => {
        await expect(canvasElement.querySelector('.plus-spotlight-action')).toHaveClass(`plus-spotlight-action--${appearance}`);
        // A real Button: it takes Button's own 6 corners, no override.
        await expect(getComputedStyle(canvasElement.querySelector('.plus-spotlight-action')).borderTopLeftRadius).toBe('6px');
    },
});

export const PrimaryAction = actionStory('primary', 'Next');
export const SecondaryAction = actionStory('secondary', 'Skip');

/* --------------------------------------------------------------- playground */

/**
 * Interactive playground. The actions are SpotlightAction nodes, which a docs
 * control cannot author, so their labels are demo args in the Demo category.
 */
export const Interactive = {
    args: {
        placement: 'bottom',
        headline: 'Playground: create a new board',
        children: 'Start a new board from here.',
        stepCount: '1 of 3',
        dismissible: true,
        primaryActionText: 'Next',
        secondaryActionText: 'Skip',
    },
    render: ({ primaryActionText, secondaryActionText, ...args }) => (
        <SpotlightProvider>
            <div style={calloutCanvas}>
                <SpotlightTarget><Button text="Create" /></SpotlightTarget>
                <Spotlight
                    {...args}
                    primaryAction={<SpotlightAction appearance="primary">{primaryActionText}</SpotlightAction>}
                    secondaryAction={secondaryActionText ? <SpotlightAction appearance="secondary">{secondaryActionText}</SpotlightAction> : undefined}
                />
            </div>
        </SpotlightProvider>
    ),
};

/* ------------------------------------------------------------------- states */

const StateSpotlight = ({ headline }) => (
    <SpotlightProvider>
        <div style={calloutCanvas}>
            <SpotlightTarget><Button text="Create" /></SpotlightTarget>
            <Spotlight
                headline={headline}
                stepCount="1 of 3"
                primaryAction={<SpotlightAction appearance="primary">Next</SpotlightAction>}
                secondaryAction={<SpotlightAction appearance="secondary">Skip</SpotlightAction>}
            >
                Start a new board from here.
            </Spotlight>
        </div>
    </SpotlightProvider>
);
// Base UI's Popover.Portal renders into document.body, outside canvasElement, and
// every story on a docs page portals its own popup, so each story names its popup
// by a headline of its own.
/**
 * The open spotlight, once it holds the focus it takes on opening. Base UI
 * queues that focus on the next animation frame; a play that focuses
 * something before the frame runs can have it moved a moment later.
 */
const popupFor = async (headline) => {
    await waitFor(() => expect([...document.querySelectorAll('.plus-spotlight')].find((el) => el.textContent.includes(headline))).toBeTruthy());
    const popup = [...document.querySelectorAll('.plus-spotlight')].find((el) => el.textContent.includes(headline));
    await waitFor(() => expect(popup.contains(document.activeElement)).toBe(true));
    return popup;
};
const HOVERED = '--ds-interaction-inverse-hovered';
const PRESSED = '--ds-interaction-inverse-pressed';
const groundUnderPseudo = (el, pseudo) => {
    el.style.transition = 'none';
    return withForcedPseudo(el, pseudo, () => getComputedStyle(el).backgroundColor);
};

/** Rest: the popup on the brand bold ground, headline in the inverse text token. */
export const Rest = {
    render: () => <StateSpotlight headline="Rest: create a new board" />,
    play: async () => {
        const popup = await popupFor('Rest: create a new board');
        await expect(getComputedStyle(popup).backgroundColor).toBe(tokenColor(popup, '--ds-background-brand-bold'));
        await expect(popup.querySelector('.plus-spotlight-headline')).toHaveTextContent('Rest: create a new board');
    },
};

/** Hovered: the dismiss button takes the inverse hovered layer. */
export const Hovered = {
    render: () => <StateSpotlight headline="Hovered: create a new board" />,
    play: async () => {
        const dismiss = (await popupFor('Hovered: create a new board')).querySelector('.plus-spotlight-dismiss-button');
        await expect(groundUnderPseudo(dismiss, ':hover')).toBe(tokenColor(dismiss, HOVERED));
    },
};

/** Pressed: the dismiss button takes the inverse pressed layer. */
export const Pressed = {
    render: () => <StateSpotlight headline="Pressed: create a new board" />,
    play: async () => {
        const dismiss = (await popupFor('Pressed: create a new board')).querySelector('.plus-spotlight-dismiss-button');
        await expect(groundUnderPseudo(dismiss, ':active')).toBe(tokenColor(dismiss, PRESSED));
    },
};

/** Focused: the ring on the dark ground is the inverse focus token, 2px wide. */
export const Focused = {
    render: () => <StateSpotlight headline="Focused: create a new board" />,
    play: async () => {
        const dismiss = (await popupFor('Focused: create a new board')).querySelector('.plus-spotlight-dismiss-button');
        dismiss.focus({ focusVisible: true });
        const style = getComputedStyle(dismiss);
        await expect(style.outlineStyle).toBe('solid');
        await expect(parseFloat(style.outlineWidth)).toBe(2);
        await expect(style.outlineColor).toBe(tokenColor(dismiss, '--ds-border-focused-inverse'));
        dismiss.blur();
    },
};

/** Live DoDontPair spotlights stay bounded inside their wells, carry no inert wrappers, do not steal focus or scroll on load, and dismiss and reopen across every pair. */
export const BestPracticesLive = {
    parameters: { docs: { disable: true } },
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-stack-lg)' }}>
            <DoDontPair
                doExample={<FeatureHeadlineDo />}
                doCaption="Short headline, one-sentence body."
                dontExample={<FeatureHeadlineDont />}
                dontCaption="A greeting and a paragraph."
            />
            <DoDontPair
                doExample={<StepCountTourDo />}
                doCaption="Step count in a multi-step tour."
                dontExample={<StepCountTourDont />}
                dontCaption="Step count on a single tip."
            />
            <DoDontPair
                doExample={<SecondaryLinkDo />}
                doCaption="Secondary action as a link."
                dontExample={<SecondaryLinkDont />}
                dontCaption="Two competing buttons."
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const doc = canvasElement.ownerDocument;
        const win = doc.defaultView;
        await expect(canvasElement.querySelector('[inert]')).toBeNull();

        const cards = canvasElement.querySelectorAll('figure.sb-ds-dodont-card');
        await expect(cards).toHaveLength(6);

        // All 6 spotlights start open at rest, bounded in their wells, without stealing focus or scrolling.
        await waitFor(() => expect(within(cards[0]).getByText('Find sessions here')).toBeVisible());
        await waitFor(() => expect(within(cards[1]).getByText('Welcome!')).toBeVisible());
        await waitFor(() => expect(within(cards[2]).getByText('1 of 3')).toBeVisible());
        await waitFor(() => expect(within(cards[3]).getByText('1 of 1')).toBeVisible());
        const learnMoreLink = await within(cards[4]).findByRole('link', { name: 'Learn more' });
        await expect(learnMoreLink).toHaveAttribute('href', '#spotlight-tour-details');
        await expect(getComputedStyle(learnMoreLink).textDecorationLine).toContain('underline');
        await expect(await within(cards[5]).findByRole('button', { name: 'Learn more' })).toBeVisible();

        await expect(canvasElement.contains(doc.activeElement)).toBe(false);
        await expect(win.scrollY).toBe(0);

        for (const card of cards) {
            const well = card.querySelector('.sb-ds-dodont-card__well');
            const spotlight = card.querySelector('.plus-spotlight');
            await waitFor(() => expect(spotlight.getBoundingClientRect().bottom).toBeLessThanOrEqual(well.getBoundingClientRect().bottom + 1));
        }

        // Pair 1 (cards 0 and 1): dismiss card 0 via Got it while card 1 stays open, then reopen card 0 via Calendar.
        const gotIt0 = within(cards[0]).getByRole('button', { name: 'Got it' });
        gotIt0.focus();
        await expect(gotIt0).toHaveFocus();
        await userEvent.click(gotIt0);
        await waitFor(() => expect(within(cards[0]).queryByText('Find sessions here')).toBeNull());
        await expect(within(cards[1]).getByText('Welcome!')).toBeVisible();
        await userEvent.click(within(cards[0]).getByRole('button', { name: 'Calendar' }));
        await waitFor(() => expect(within(cards[0]).getByText('Find sessions here')).toBeVisible());

        // Pair 2 (cards 2 and 3): dismiss card 2 via Dismiss button while card 3 stays open, then reopen card 2.
        await userEvent.click(within(cards[2]).getByRole('button', { name: 'Dismiss' }));
        await waitFor(() => expect(within(cards[2]).queryByText('1 of 3')).toBeNull());
        await expect(within(cards[3]).getByText('1 of 1')).toBeVisible();
        await userEvent.click(within(cards[2]).getByRole('button', { name: 'Calendar' }));
        await waitFor(() => expect(within(cards[2]).getByText('1 of 3')).toBeVisible());

        // Pair 3 (cards 4 and 5): keyboard focus on link, dismiss with Escape while card 5 stays open, then reopen.
        learnMoreLink.focus();
        await expect(learnMoreLink).toHaveFocus();
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(within(cards[4]).queryByRole('link', { name: 'Learn more' })).toBeNull());
        await expect(within(cards[5]).getByRole('button', { name: 'Learn more' })).toBeVisible();
        await userEvent.click(within(cards[4]).getByRole('button', { name: 'Calendar' }));
        await waitFor(() => expect(within(cards[4]).getByRole('link', { name: 'Learn more' })).toBeVisible());
    },
};
