import React from 'react';
import { expectHovered, expectPressed, expectFocusRing } from '@/storybook-docs/lib/button-states.js';
import { DoDontPair } from '@/storybook-docs/ds-docs-layout.jsx';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import InlineMessage, { INLINE_MESSAGE_APPEARANCES } from './InlineMessage';
import {
    OnePerFieldDo,
    OnePerFieldDont,
    ShortLineDo,
    ShortLineDont,
    TintMeaningDo,
    TintMeaningDont,
    fieldRow,
} from '@/storybook-docs/lib/inline-message-cases';
/** The popup is a portal; `within(canvasElement)` cannot see it. */
const documentOf = (canvasElement) => within(canvasElement.ownerDocument.body);

const row = { display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' };
const title = (name) => name.charAt(0).toUpperCase() + name.slice(1);

export default {
    title: 'Components/Messaging/Inline message',
    component: InlineMessage,
    /** Hide CSF stories from the sidebar; docs live on InlineMessage.mdx (Canvas still embeds them). */
    tags: ['!dev', '!autodocs', 'new'],
    parameters: {
        docs: { toc: { title: 'On this page' } },
    },
    argTypes: {
        appearance: {
            control: 'select',
            options: INLINE_MESSAGE_APPEARANCES,
            description: "The trigger's icon and tint.",
            table: { category: 'Design', defaultValue: { summary: "'info'" } },
        },
        label: {
            control: 'text',
            description: "The trigger icon's accessible name and tooltip. Required: it is the only visible part before the popup opens.",
            table: { category: 'Content' },
        },
        title: {
            control: 'text',
            description: 'Bolded first line of the popup.',
            table: { category: 'Content' },
        },
        secondaryText: {
            control: 'text',
            description: 'A second line, when the title alone does not say enough.',
            table: { category: 'Content' },
        },
        placement: {
            control: 'select',
            options: ['auto', 'top', 'bottom', 'left', 'right', 'top-start', 'top-end', 'bottom-start', 'bottom-end', 'right-start', 'right-end', 'left-start', 'left-end'],
            description: 'Where the popup opens relative to the trigger.',
            table: { category: 'Layout', defaultValue: { summary: "'bottom-start'" } },
        },
        defaultOpen: {
            control: 'boolean',
            description: 'Whether the message popup starts open.',
            table: { category: 'Behavior', defaultValue: { summary: 'false' } },
        },
        children: {
            control: 'text',
            description: "The popup's body content.",
            table: { category: 'Content' },
        },
    },
    args: {
        appearance: 'info',
        label: 'More information',
        title: 'Why this matters',
        defaultOpen: false,
        children: 'Sessions are scored on the rubric agreed at intake.',
    },
};

export const Overview = {
    render: (args) => <InlineMessage {...args} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const trigger = canvas.getByRole('button', { name: 'More information' });
        const doc = documentOf(canvasElement);
        await userEvent.click(trigger);
        await waitFor(() => expect(doc.getByText('Why this matters')).toBeTruthy());
        await expect(doc.getByText('Sessions are scored on the rubric agreed at intake.')).toBeTruthy();
    },
};

export const Appearances = {
    render: () => (
        <div style={row}>
            {INLINE_MESSAGE_APPEARANCES.map((appearance) => (
                <InlineMessage
                    key={appearance}
                    appearance={appearance}
                    label={`${title(appearance)} info`}
                    title={`${title(appearance)} message`}
                >
                    An example {appearance} message.
                </InlineMessage>
            ))}
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getAllByRole('button')).toHaveLength(INLINE_MESSAGE_APPEARANCES.length);
    },
};

/** One appearance per story, for the docs page's Appearance section. */
const appearanceStory = (appearance, label, heading, message) => ({
    render: () => <InlineMessage appearance={appearance} label={label} title={heading}>{message}</InlineMessage>,
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).getByRole('button', { name: label })).toBeVisible();
    },
});

export const Info = appearanceStory('info', 'What this score means', 'Why this matters', 'Sessions are scored on the rubric agreed at intake.');
export const Warning = appearanceStory('warning', 'Before you leave this page', 'Changes are not saved', 'Save your notes before you leave.');
export const Danger = appearanceStory('danger', 'Why this file was rejected', 'File too large', 'The file was larger than 10 MB. Try a smaller one.');
export const Success = appearanceStory('success', 'Upload status', 'Upload complete', 'The file is attached to the session.');

export const WithSecondaryText = {
    render: () => (
        <InlineMessage label="More information" title="Name already in use" secondaryText="Try another one.">
            Account names must be unique across the organization.
        </InlineMessage>
    ),
    play: async ({ canvasElement }) => {
        const trigger = within(canvasElement).getByRole('button', { name: 'More information' });
        const doc = documentOf(canvasElement);
        await userEvent.click(trigger);
        await waitFor(() => expect(doc.getByText('Try another one.')).toBeTruthy());
    },
};

export const Interactive = {
    render: (args) => <InlineMessage {...args} />,
};

/* ------------------------------------------------------------------- states */

const StateTrigger = () => <InlineMessage appearance="info" label="More information" title="Why this matters">Sessions are scored on the rubric agreed at intake.</InlineMessage>;
const triggerOf = (canvasElement) => within(canvasElement).getByRole('button', { name: 'More information' });

/** Rest: an icon trigger named by `label`, with its popup closed. */
export const Rest = {
    render: () => <StateTrigger />,
    play: async ({ canvasElement }) => {
        const trigger = triggerOf(canvasElement);
        await expect(trigger).toBeVisible();
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    },
};

/** Hovered: the trigger takes the subtle button's hovered ground. */
export const Hovered = {
    render: () => <StateTrigger />,
    play: async ({ canvasElement }) => {
        await expectHovered(canvasElement, triggerOf(canvasElement), 'subtle', 'inline message trigger');
    },
};

/** Pressed: the subtle button's pressed ground. */
export const Pressed = {
    render: () => <StateTrigger />,
    play: async ({ canvasElement }) => {
        await expectPressed(canvasElement, triggerOf(canvasElement), 'subtle', 'inline message trigger');
    },
};

/** Focused: the 2px ring, 2px off the trigger; Enter opens the popup. */
export const Focused = {
    render: () => <StateTrigger />,
    play: async ({ canvasElement }) => {
        const trigger = triggerOf(canvasElement);
        await expectFocusRing(canvasElement, trigger, 'inline message trigger');
        trigger.focus();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(documentOf(canvasElement).getByText('Why this matters')).toBeTruthy());
    },
};

/** Live DoDontPair inline messages stay bounded in their wells, have no inert wrappers, do not steal focus or scroll on load, and open, navigate by keyboard, and dismiss across every pair. */
export const BestPracticesLive = {
    parameters: { docs: { disable: true } },
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-stack-lg)' }}>
            <DoDontPair
                doExample={<TintMeaningDo />}
                doCaption="Info for a neutral note."
                dontExample={<TintMeaningDont />}
                dontCaption="Danger for a neutral note."
            />
            <DoDontPair
                doExample={<ShortLineDo />}
                doCaption="One short sentence."
                dontExample={<ShortLineDont />}
                dontCaption="A paragraph beside a field."
            />
            <DoDontPair
                doExample={<OnePerFieldDo />}
                doCaption="A single message."
                dontExample={<OnePerFieldDont />}
                dontCaption="An info note and a warning together."
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const doc = canvasElement.ownerDocument;
        const win = doc.defaultView;
        await expect(canvasElement.querySelector('[inert]')).toBeNull();

        const cards = canvasElement.querySelectorAll('figure.sb-ds-dodont-card');
        await expect(cards).toHaveLength(6);

        // Pairs 1 and 2 start open at rest, bounded in their wells, without stealing focus or scrolling.
        for (const idx of [0, 1]) {
            await waitFor(() => expect(within(cards[idx]).getByText('Heads up')).toBeVisible());
        }
        for (const idx of [2, 3]) {
            await waitFor(() => expect(within(cards[idx]).getByText('Limited availability')).toBeVisible());
        }
        await expect(canvasElement.contains(doc.activeElement)).toBe(false);
        await expect(win.scrollY).toBe(0);

        for (const idx of [0, 1, 2, 3]) {
            const well = cards[idx].querySelector('.sb-ds-dodont-card__well');
            const popup = cards[idx].querySelector('.plus-popup');
            await waitFor(() => expect(popup.getBoundingClientRect().bottom).toBeLessThanOrEqual(well.getBoundingClientRect().bottom + 1));
        }

        const assertWellFullSizeAndBounded = async (card) => {
            const cardRect = card.getBoundingClientRect();
            const well = card.querySelector('.sb-ds-dodont-card__well');
            await expect(well.scrollWidth).toBeLessThanOrEqual(well.clientWidth + 1);
            for (const el of [well, ...well.querySelectorAll('*')]) {
                await expect(['1', 'normal']).toContain(win.getComputedStyle(el).zoom);
                if (el.hasAttribute('data-base-ui-focus-guard')) continue;
                const rect = el.getBoundingClientRect();
                if (rect.width > 0) {
                    await expect(rect.left).toBeGreaterThanOrEqual(cardRect.left - 1);
                    await expect(rect.right).toBeLessThanOrEqual(cardRect.right + 1);
                }
            }
        };

        for (const card of cards) {
            await assertWellFullSizeAndBounded(card);
        }

        // Pair 1 (cards 0 and 1): focus trigger, dismiss with Escape, reopen with Enter, while card 1 stays open.
        const pair1DoTrigger = within(cards[0]).getByRole('button', { name: 'About this setting' });
        pair1DoTrigger.focus();
        await expect(pair1DoTrigger).toHaveFocus();
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(within(cards[0]).queryByText('Heads up')).toBeNull());
        await expect(within(cards[1]).getByText('Heads up')).toBeVisible();
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(within(cards[0]).getByText('Heads up')).toBeVisible());

        // Pair 2 (cards 2 and 3): dismiss card 2 by clicking trigger and reopen, while card 3 stays open.
        const pair2DoTrigger = within(cards[2]).getByRole('button', { name: 'About availability' });
        await userEvent.click(pair2DoTrigger);
        await waitFor(() => expect(within(cards[2]).queryByText('Limited availability')).toBeNull());
        await waitFor(() => expect(within(cards[3]).getByText('Limited availability')).toBeVisible());
        await userEvent.click(pair2DoTrigger);
        await waitFor(() => expect(within(cards[2]).getByText('Limited availability')).toBeVisible());

        // Pair 3 (cards 4 and 5): single message vs two messages on one field; open by click, bounded in well, dismiss with Escape.
        await expect(within(cards[4]).getAllByRole('button')).toHaveLength(1);
        await expect(within(cards[5]).getAllByRole('button')).toHaveLength(2);
        const pair3Trigger = within(cards[4]).getByRole('button', { name: 'About session length' });
        await userEvent.click(pair3Trigger);
        await waitFor(() => expect(within(cards[4]).getByText('Heads up')).toBeVisible());
        await waitFor(() => expect(
            cards[4].querySelector('.plus-popup').getBoundingClientRect().bottom,
        ).toBeLessThanOrEqual(cards[4].querySelector('.sb-ds-dodont-card__well').getBoundingClientRect().bottom + 1));
        await assertWellFullSizeAndBounded(cards[4]);
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(within(cards[4]).queryByText('Heads up')).toBeNull());
    },
};
