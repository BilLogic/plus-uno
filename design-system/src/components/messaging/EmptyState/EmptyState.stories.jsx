import React from 'react';
import { expectNoStateChange, expectNotAControl } from '@/storybook-docs/lib/label-states.js';
import { tokenColor as stateTokenColor } from '@/storybook-docs/lib/style-probes.js';
import { expect, within } from 'storybook/test';

import { inEveryColorModeOf } from '@/storybook-docs/lib/color-modes.js';
import { px } from '@/storybook-docs/lib/style-probes.js';
import { Button, Illustration, Table } from '@/components';
import EmptyState from './EmptyState';

/**
 * `EmptyState` -- what a view shows when it has nothing to show yet.
 *
 * THE TEST SEAM IS THIS FILE. Story `play:` functions run by `check:storybook`
 * in a real browser. The component is asserted as what a person gets: the
 * heading with its level, the actions in order, the decorative picture hidden
 * from assistive technology, the heading typeface per spacing, and the text and
 * icon colors resolved from tokens in every color mode.
 */

export default {
    title: 'Components/Messaging/Empty state',
    component: EmptyState,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'A picture, a short header, one line on what goes here, and the action that fills the view. '
                    + 'Default spacing for a view or panel, compact for a table body or a card.',
            },
        },
    },
    argTypes: {
        header: { control: 'text' },
        description: { control: 'text' },
        icon: { control: 'text' },
        spacing: { control: 'inline-radio', options: ['default', 'compact'] },
        image: { control: false },
        primaryAction: { control: false },
        secondaryAction: { control: false },
        className: { control: false },
    },
};

const primary = <Button text="Add student" appearance="primary" />;
const secondary = <Button text="Import a list" />;

/* ------------------------------------------------------------------ default */

export const Overview = () => (
    <EmptyState
        image={<Illustration character="relationships" size={160} />}
        header="No students yet"
        description="Add a student to start planning sessions and tracking progress."
        primaryAction={primary}
        secondaryAction={secondary}
    />
);

/**
 * The header is a heading in Noto Serif at 20, the description sits under it in
 * the subtle ink, the two actions follow in order, and the character is hidden
 * from assistive technology. Text and header ink resolve from tokens in every mode.
 */
Overview.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const heading = canvas.getByRole('heading', { name: 'No students yet' });
    await expect(getComputedStyle(heading).fontFamily, 'serif at 20').toMatch(/Noto Serif/);
    await expect(px(getComputedStyle(heading).fontSize), 'size 20').toBe(20);
    const buttons = canvas.getAllByRole('button').map((b) => b.textContent.trim());
    await expect(buttons, 'primary first, then secondary').toEqual(['Add student', 'Import a list']);
    await expect(canvasElement.querySelector('.plus-empty-state__image').getAttribute('aria-hidden'), 'picture is decorative').toBe('true');
    const description = canvas.getByText(/Add a student to start/);
    await inEveryColorModeOf(canvasElement, async (mode, token) => {
        await expect(getComputedStyle(heading).color, `header, ${mode}`).toBe(token('--ds-text'));
        await expect(getComputedStyle(description).color, `description, ${mode}`).toBe(token('--ds-text-subtle'));
    });
};

/* --------------------------------------------------------------------- icon */

export const WithIcon = () => (
    <EmptyState
        icon="calendar-plus"
        header="No sessions this week"
        description="Schedule a session and it will show up here."
        primaryAction={<Button text="Schedule a session" appearance="primary" />}
    />
);

/** With no image, the Font Awesome icon stands in, decorative and in the subtle icon ink in every mode. */
WithIcon.play = async ({ canvasElement }) => {
    const icon = canvasElement.querySelector('.plus-empty-state__icon');
    await expect(icon.classList.contains('fa-calendar-plus'), 'the named icon').toBe(true);
    await expect(icon.getAttribute('aria-hidden'), 'decorative').toBe('true');
    await inEveryColorModeOf(canvasElement, async (mode, token) => {
        await expect(getComputedStyle(icon).color, `icon, ${mode}`).toBe(token('--ds-icon-subtle'));
    });
};

/* --------------------------------------------------------------------- size */

/** Default spacing: Compact's content at the view size, Heading/medium 20. */
export const Default = () => (
    <EmptyState
        icon="user-group"
        header="No students yet"
        description="Add a student to see them here."
        primaryAction={<Button text="Add student" appearance="primary" />}
    />
);

Default.play = async ({ canvasElement }) => {
    const heading = within(canvasElement).getByRole('heading', { name: 'No students yet' });
    await expect(px(getComputedStyle(heading).fontSize), 'size 20').toBe(20);
};

export const Compact = () => (
    <EmptyState
        spacing="compact"
        icon="user-group"
        header="No students yet"
        description="Add a student to see them here."
        primaryAction={<Button text="Add student" appearance="primary" spacing="compact" />}
    />
);

/** Compact drops the header to Heading/small 16 in the sans family. */
Compact.play = async ({ canvasElement }) => {
    const heading = within(canvasElement).getByRole('heading', { name: 'No students yet' });
    await expect(px(getComputedStyle(heading).fontSize), 'size 16').toBe(16);
    await expect(getComputedStyle(heading).fontFamily, 'sans below 20').toMatch(/Noto Sans/);
};

/* ------------------------------------------------------------------ in a table */

export const InATable = () => (
    <Table
        headers={['Student', 'Grade', 'Sessions']}
        rows={[]}
        emptyState={(
            <EmptyState
                spacing="compact"
                icon="user-group"
                header="No students yet"
                description="Add a student to see them here."
                primaryAction={<Button text="Add student" appearance="primary" spacing="compact" />}
            />
        )}
    />
);

/** The Table keeps its header row and the EmptyState takes the body, so the message is one row spanning every column. */
InATable.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('columnheader', { name: 'Student' }), 'header stays').toBeVisible();
    await expect(canvas.getByRole('heading', { name: 'No students yet' }), 'message in the body').toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Add student' })).toBeVisible();
};

/* --------------------------------------------------------------- playground */

export const Interactive = (args) => <EmptyState {...args} />;
Interactive.args = {
    header: 'No students yet',
    description: 'Add a student to start planning sessions.',
    icon: 'user-group',
    spacing: 'default',
};

/* ------------------------------------------------------------------- states */

const emptyRoot = (canvasElement) => canvasElement.querySelector('.plus-empty-state');
const StateEmpty = () => (
    <EmptyState header="No students yet" description="Add a student to start planning sessions." icon="user-group" />
);

/** Rest: the header and the description on their text tokens. */
export const Rest = {
    render: () => <StateEmpty />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('heading', { name: 'No students yet' })).toBeVisible();
        await expect(canvas.getByText('Add a student to start planning sessions.')).toBeVisible();
        await expect(getComputedStyle(canvas.getByRole('heading', { name: 'No students yet' })).color).toBe(stateTokenColor(canvasElement, '--ds-text'));
        await expect(getComputedStyle(canvas.getByText('Add a student to start planning sessions.')).color).toBe(stateTokenColor(canvasElement, '--ds-text-subtle'));
        await expect(emptyRoot(canvasElement).querySelector('.plus-empty-state__icon')).toHaveAttribute('aria-hidden', 'true');
    },
};

/** Hovered: the message is not a control, so nothing changes under a pointer. */
export const Hovered = {
    render: () => <StateEmpty />,
    play: async ({ canvasElement }) => {
        await expectNoStateChange(emptyRoot(canvasElement), ':hover', 'empty state');
    },
};

/** Pressed: no pressed layer. */
export const Pressed = {
    render: () => <StateEmpty />,
    play: async ({ canvasElement }) => {
        await expectNoStateChange(emptyRoot(canvasElement), ':active', 'empty state');
    },
};

/** Focused: without actions there is nothing to focus; the actions are Buttons and carry their own ring. */
export const Focused = {
    render: () => <StateEmpty />,
    play: async ({ canvasElement }) => {
        await expectNotAControl(emptyRoot(canvasElement), 'empty state');
    },
};
