import React from 'react';
import { expectHovered, expectPressed, expectFocusRing } from '@/storybook-docs/lib/button-states.js';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import InlineMessage, { INLINE_MESSAGE_APPEARANCES } from './InlineMessage';

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
        changelog: [
            { date: '2026-11-03', kind: 'added', summary: 'Inline message: an icon trigger that opens a Popup. `appearance` (info, warning, danger, success), `label`, `title`, `secondaryText`, `placement`.' },
        ],
        docs: { toc: { title: 'On this page' } },
    },
    argTypes: {
        appearance: { control: 'select', options: INLINE_MESSAGE_APPEARANCES, table: { category: 'Design' } },
        label: { control: 'text', description: 'Accessible name and tooltip of the trigger', table: { category: 'Content' } },
        title: { control: 'text', table: { category: 'Content' } },
        secondaryText: { control: 'text', table: { category: 'Content' } },
        placement: { control: 'select', options: ['top', 'bottom', 'left', 'right', 'top-start', 'top-end', 'bottom-start', 'bottom-end'], table: { category: 'Layout' } },
        children: { control: 'text', table: { category: 'Content' } },
    },
    args: {
        appearance: 'info',
        label: 'More information',
        title: 'Why this matters',
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
