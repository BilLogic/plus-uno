import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { px, tokenColor } from '@/storybook-docs/lib/style-probes.js';
import { withForcedPseudo } from '@/storybook-docs/lib/force-pseudo.js';
import { Avatar, AVATAR_SIZES } from '@/components';
import AvatarGroup from './AvatarGroup';

/**
 * `AvatarGroup`: a row of avatars that overlap, with the rest behind a `+n`.
 *
 * THE TEST SEAM IS THIS FILE. Story `play:` functions run by `check:storybook`
 * in a real browser, and assert what a person could observe: how many avatars
 * the group puts on the row, the overlap between neighbors, who is behind
 * `+n`, and that the group's size and shape win over each avatar's own.
 */

export default {
    title: 'Components/Images and icons/Avatar group',
    component: AvatarGroup,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'A row of avatars that overlap, with the rest folded into a `+n`. '
                    + 'Past `max`, the remaining people go into a menu reached by name.',
            },
        },
    },
};

const row = { display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center' };

const box = (el) => {
    const r = el.getBoundingClientRect();
    return { width: Math.round(r.width), height: Math.round(r.height) };
};

const PEOPLE = ['Jane Park', 'Jamal Reed', 'Ana Silva', 'Wei Chen', 'Sam Ortiz', 'Priya Nair', 'Tom Hale'];

/* ----------------------------------------------------------------- group */

export const Group = (args) => (
    <AvatarGroup label="Session attendees" {...args}>
        {PEOPLE.map((name) => <Avatar key={name} name={name} />)}
    </AvatarGroup>
);
Group.args = { max: 5, size: 32 };

/**
 * `max` counts the `+n` in, so 7 people with a max of 5 show four avatars and
 * `+3`. The avatars overlap by a quarter. `+3` opens the three left out, by
 * name, and Escape closes it again.
 */
Group.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('group', { name: 'Session attendees' });
    await expect(within(group).getAllByRole('img')).toHaveLength(4);

    const [first, second] = within(group).getAllByRole('img');
    const a = first.getBoundingClientRect();
    const b = second.getBoundingClientRect();
    await expect(Math.round(a.right - b.left), 'overlap is a quarter').toBe(8);

    const more = canvas.getByRole('button', { name: '+3, 3 more people' });
    await expect(more).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(more);
    await waitFor(() => expect(more).toHaveAttribute('aria-expanded', 'true'));
    for (const name of PEOPLE.slice(4)) {
        await expect(await within(document.body).findByText(name)).toBeVisible();
    }
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(more).toHaveAttribute('aria-expanded', 'false'));
};

export const GroupFits = () => (
    <AvatarGroup label="Few" max={5}>
        {PEOPLE.slice(0, 3).map((name) => <Avatar key={name} name={name} />)}
    </AvatarGroup>
);

/** Within `max` there is no `+n`. */
GroupFits.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('button')).toBeNull();
    await expect(canvas.getAllByRole('img')).toHaveLength(3);
};

/* ---------------------------------------------------------------- sizes */

export const Sizes = () => (
    <div style={row}>
        {AVATAR_SIZES.map((size) => (
            <AvatarGroup key={size} label={`Size ${size}`} size={size} max={3} data-testid={`group-${size}`}>
                {PEOPLE.slice(0, 2).map((name) => <Avatar key={name} name={name} />)}
            </AvatarGroup>
        ))}
    </div>
);

/** The group's `size` sets every avatar in the row, at the same eight sizes as `Avatar`. */
Sizes.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const size of AVATAR_SIZES) {
        const group = canvas.getByTestId(`group-${size}`);
        for (const img of within(group).getAllByRole('img')) {
            await expect(box(img), `size ${size}`).toEqual({ width: size, height: size });
        }
    }
};

/* --------------------------------------------------------------- shapes */

export const GroupSizeAndShape = () => (
    <AvatarGroup label="Agents" size={24} shape="square" max={3}>
        {PEOPLE.slice(0, 4).map((name) => <Avatar key={name} name={name} size={40} />)}
    </AvatarGroup>
);

/** The group's size and shape win over each avatar's own. */
GroupSizeAndShape.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const img of canvas.getAllByRole('img')) {
        await expect(box(img)).toEqual({ width: 24, height: 24 });
    }
    await expect(box(canvas.getByRole('button'))).toEqual({ width: 24, height: 24 });
};

/* ------------------------------------------------------------ playground */

export const Interactive = (args) => (
    <AvatarGroup {...args}>
        {PEOPLE.map((name) => <Avatar key={name} name={name} />)}
    </AvatarGroup>
);
Interactive.args = {
    label: 'Session attendees',
    max: 5,
    size: 32,
    shape: 'circle',
};
Interactive.argTypes = {
    size: { control: 'select', options: AVATAR_SIZES },
    shape: { control: 'select', options: ['circle', 'square'] },
};

/* ------------------------------------------------------- one per state */

/** The `+n` is the only part of the group that is a control. */
const overflowRow = () => (
    <AvatarGroup label="Session attendees" max={3}>
        {PEOPLE.map((name) => <Avatar key={name} name={name} />)}
    </AvatarGroup>
);

const overflowOf = (canvasElement) => within(canvasElement).getByRole('button', { name: /more people$/ });

export const Rest = {
    render: overflowRow,
    play: async ({ canvasElement }) => {
        const more = overflowOf(canvasElement);
        await expect(getComputedStyle(more).backgroundColor).toBe(tokenColor(canvasElement, '--ds-background-accent-gray-subtler'));
        await expect(more).toHaveAttribute('aria-expanded', 'false');
    },
};

export const Hovered = {
    render: overflowRow,
    play: async ({ canvasElement }) => {
        const more = overflowOf(canvasElement);
        more.style.transition = 'none';
        const fill = withForcedPseudo(more, ':hover', () => getComputedStyle(more).backgroundColor);
        await expect(fill).toBe(tokenColor(canvasElement, '--ds-background-accent-gray-subtle'));
    },
};

export const Pressed = {
    render: overflowRow,
    play: async ({ canvasElement }) => {
        const more = overflowOf(canvasElement);
        await userEvent.click(more);
        await waitFor(() => expect(more).toHaveAttribute('aria-expanded', 'true'));
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(more).toHaveAttribute('aria-expanded', 'false'));
    },
};

export const Focused = {
    render: overflowRow,
    play: async ({ canvasElement }) => {
        const more = overflowOf(canvasElement);
        more.style.transition = 'none';
        more.focus({ focusVisible: true });
        await waitFor(() => expect(getComputedStyle(more).outlineStyle).toBe('solid'));
        const style = getComputedStyle(more);
        await expect(px(style.outlineWidth)).toBe(2);
        await expect(style.outlineColor).toBe(tokenColor(canvasElement, '--ds-border-focused'));
        more.blur();
    },
};

export const Disabled = {
    render: () => (
        <AvatarGroup label="Session attendees" max={5}>
            {PEOPLE.slice(0, 3).map((name) => <Avatar key={name} name={name} />)}
        </AvatarGroup>
    ),
    play: async ({ canvasElement }) => {
        // Nothing to fold, so no `+n` control exists; the group is only pictures.
        await expect(within(canvasElement).queryByRole('button')).toBeNull();
    },
};
