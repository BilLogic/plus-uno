import React, { useState } from 'react';
import { expectHovered, expectPressed, expectFocusRing } from '@/storybook-docs/lib/button-states.js';
import { tokenColor } from '@/storybook-docs/lib/style-probes.js';
import { expect, waitFor } from 'storybook/test';
import { withForcedPseudo } from '@/storybook-docs/lib/force-pseudo.js';
import Button from '@/components/forms-and-inputs/Button';
import Spotlight, { SpotlightAction, SpotlightProvider, SpotlightTarget } from '@/components/messaging/Spotlight';

export default {
    title: 'Components/Messaging/Spotlight',
    component: Spotlight,
    tags: ['!dev', '!autodocs'],
};

export const Basic = () => (
    <SpotlightProvider>
        <div style={{ padding: 'var(--space-400)' }}>
            <SpotlightTarget>
                <Button id="spotlight-target-basic" text="Create" />
            </SpotlightTarget>
            <Spotlight
                headline="Create a new board"
                stepCount="1 of 3"
                primaryAction={<SpotlightAction appearance="primary">Next</SpotlightAction>}
                secondaryAction={<SpotlightAction appearance="secondary">Skip</SpotlightAction>}
            >
                Click here whenever you want to start something new.
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
};

export const WithMedia = () => (
    <SpotlightProvider>
        <div style={{ padding: 'var(--space-400)' }}>
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
        <div style={{ padding: 'var(--space-400)' }}>
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
            <div style={{ padding: 'var(--space-400)' }}>
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

/* ------------------------------------------------------------------- states */

const StateSpotlight = ({ headline }) => (
    <SpotlightProvider>
        <div style={{ padding: 'var(--space-400)' }}>
            <SpotlightTarget><Button text="Create" /></SpotlightTarget>
            <Spotlight
                headline={headline}
                stepCount="1 of 3"
                primaryAction={<SpotlightAction appearance="primary">Next</SpotlightAction>}
                secondaryAction={<SpotlightAction appearance="secondary">Skip</SpotlightAction>}
            >
                Click here whenever you want to start something new.
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
