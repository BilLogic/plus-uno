import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { px, tokenColor } from '@/storybook-docs/lib/style-probes.js';
import { inEveryColorMode } from '@/storybook-docs/lib/color-modes.js';
import Avatar, { AVATAR_SIZES, AVATAR_STATUSES, initialsOf } from './Avatar';
import AvatarGroup from './AvatarGroup';

/**
 * `Avatar` and `AvatarGroup`: a person or an agent as a picture, initials or icon.
 *
 * THE TEST SEAM IS THIS FILE. Story `play:` functions run by `check:storybook`
 * in a real browser, and assert what a person could observe: the rendered
 * size and shape, what shows when a picture is missing or fails, the name a
 * screen reader gets, how many avatars the group puts on the row and who is
 * behind `+n`. Never a class name. Avatars are found by `data-testid`, since a
 * decorative one is hidden from the accessibility tree and has no role.
 */

export default {
    title: 'Components/Images and icons/Avatar',
    component: Avatar,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'A person or an agent as a picture, initials or an icon, from 16 to 128, '
                    + 'with an optional presence dot. AvatarGroup overlaps a row of them and folds the rest into `+n`.',
            },
        },
    },
};

const row = { display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' };

const box = (el) => {
    const r = el.getBoundingClientRect();
    return { width: Math.round(r.width), height: Math.round(r.height) };
};

/** A landscape picture, 3:2, so a stretched image would show as a wrong aspect. */
const PHOTO = 'data:image/svg+xml;utf8,'
    + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">'
        + '<rect width="300" height="200" fill="#6b8f71"/><circle cx="150" cy="100" r="60" fill="#f2c14e"/></svg>',
    );

/* ------------------------------------------------------------- initials */

export const Initials = () => (
    <div style={{ display: 'grid', gap: '4px' }}>
        <span data-testid="initials-two"><Avatar name="Jane Park" /></span>
        <span data-testid="initials-three"><Avatar name="Mary Ann Smith" /></span>
        <span data-testid="initials-one"><Avatar name="Plato" /></span>
        <span data-testid="initials-small"><Avatar name="Jane Park" size={16} /></span>
        <span data-testid="initials-override"><Avatar name="Jane Park" initials="AI" /></span>
    </div>
);

/** Initials are the first and last words' first letters; a 16 or 20 keeps one. */
Initials.play = async ({ canvasElement }) => {
    const text = (id) => within(canvasElement).getByTestId(id).textContent;
    await expect(text('initials-two')).toBe('JP');
    await expect(text('initials-three')).toBe('MS');
    await expect(text('initials-one')).toBe('P');
    await expect(text('initials-small')).toBe('J');
    await expect(text('initials-override')).toBe('AI');
    await expect(initialsOf('  ')).toBe('');
};

/* ---------------------------------------------------------------- sizes */

export const Sizes = () => (
    <div style={row}>
        {AVATAR_SIZES.map((size) => (
            <Avatar key={size} size={size} name="Jane Park" data-testid={`avatar-${size}`} />
        ))}
    </div>
);

/** Every size is a square box; a circle rounds fully. 16 to 48 are the Media sizes. */
Sizes.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const size of AVATAR_SIZES) {
        const el = canvas.getByTestId(`avatar-${size}`);
        await expect(box(el), `size ${size}`).toEqual({ width: size, height: size });
        await expect(px(getComputedStyle(el).borderTopLeftRadius), `size ${size} rounds`).toBeGreaterThanOrEqual(size / 2);
    }
};

export const DefaultSize = () => <Avatar name="Jane Park" data-testid="avatar" />;

DefaultSize.play = async ({ canvasElement }) => {
    await expect(box(within(canvasElement).getByTestId('avatar'))).toEqual({ width: 32, height: 32 });
};

/* --------------------------------------------------------------- shapes */

export const Shapes = () => (
    <div style={row}>
        <Avatar size={40} name="Jane Park" data-testid="circle" />
        <Avatar size={40} shape="square" icon="robot" label="Study bot" data-testid="square" />
    </div>
);

/** A square (a team or an agent) takes a quarter of its size as its radius. */
Shapes.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(px(getComputedStyle(canvas.getByTestId('square')).borderTopLeftRadius)).toBe(10);
    await expect(px(getComputedStyle(canvas.getByTestId('circle')).borderTopLeftRadius)).toBeGreaterThanOrEqual(20);
};

/* ---------------------------------------------------------------- fallbacks */

export const Fallbacks = () => (
    <div style={row}>
        <Avatar size={40} src={PHOTO} name="Jane Park" data-testid="photo" />
        <Avatar size={40} src="data:image/png;base64,broken" name="Jane Park" data-testid="broken" />
        <Avatar size={40} icon="robot" label="Study bot" data-testid="icon" />
        <Avatar size={40} label="Someone" data-testid="bare" />
    </div>
);

/**
 * The picture covers the frame when it loads. When it fails, the initials
 * show; with no name, the icon; with neither, a plain person glyph.
 */
Fallbacks.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const photo = canvas.getByTestId('photo');
    await expect(photo.querySelector('img')).not.toBeNull();
    await expect(getComputedStyle(photo.querySelector('img')).objectFit).toBe('cover');

    const broken = canvas.getByTestId('broken');
    await waitFor(() => expect(broken.querySelector('img')).toBeNull());
    await expect(broken.textContent).toBe('JP');

    await expect(canvas.getByTestId('icon').querySelector('i.fa-robot')).not.toBeNull();
    await expect(canvas.getByTestId('bare').querySelector('i.fa-user')).not.toBeNull();
};

/* ---------------------------------------------------------------- colors */

export const Colors = () => (
    <div style={row}>
        <Avatar name="Jane Park" color="blue" data-testid="blue" />
        <Avatar name="Jane Park" color="green" data-testid="green" />
        <Avatar name="Jane Park" color="gray" data-testid="gray" />
    </div>
);

/** The ground and ink follow the Tag color set, in every color mode. */
Colors.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await inEveryColorMode(async (mode) => {
        for (const c of ['blue', 'green', 'gray']) {
            const el = canvas.getByTestId(c);
            await expect(getComputedStyle(el).backgroundColor, `${mode} ${c} ground`)
                .toBe(tokenColor(canvasElement, `--ds-background-accent-${c}-subtler`));
            await expect(getComputedStyle(el).color, `${mode} ${c} ink`)
                .toBe(tokenColor(canvasElement, `--ds-text-accent-${c}`));
        }
    });
};

/* ---------------------------------------------------------------- status */

const STATUS_TOKEN = {
    online: '--ds-background-success-bold',
    away: '--ds-background-warning-bold',
    busy: '--ds-background-danger-bold',
    offline: '--ds-background-neutral-bold',
};

export const Status = () => (
    <div style={row}>
        {AVATAR_STATUSES.map((status) => (
            <Avatar key={status} size={40} name="Jane Park" status={status} data-testid={`status-${status}`} />
        ))}
    </div>
);

/** The dot is a quarter of the avatar, colored by its status, and named in the avatar's name. */
Status.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await inEveryColorMode(async (mode) => {
        for (const status of AVATAR_STATUSES) {
            const el = canvas.getByTestId(`status-${status}`);
            const dot = el.querySelector('[data-status]');
            await expect(box(dot), `${mode} ${status} size`).toEqual({ width: 10, height: 10 });
            await expect(getComputedStyle(dot).backgroundColor, `${mode} ${status}`)
                .toBe(tokenColor(canvasElement, STATUS_TOKEN[status]));
            await expect(el).toHaveAccessibleName(`Jane Park, ${status}`);
        }
    });
};

/* ---------------------------------------------------------------- naming */

export const Naming = () => (
    <div style={row}>
        <Avatar name="Jane Park" data-testid="named" />
        <Avatar initials="AI" data-testid="anonymous" />
        <Avatar name="Jane Park" label="Jane Park, lead tutor" data-testid="labeled" />
    </div>
);

/** A name makes it one image with that name; with none it is decorative and hidden. */
Naming.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('named')).toHaveAccessibleName('Jane Park');
    await expect(canvas.getByTestId('named')).toHaveAttribute('role', 'img');
    await expect(canvas.getByTestId('anonymous')).toHaveAttribute('aria-hidden', 'true');
    await expect(canvas.getByTestId('labeled')).toHaveAccessibleName('Jane Park, lead tutor');
};

/* ----------------------------------------------------------------- group */

const PEOPLE = ['Jane Park', 'Jamal Reed', 'Ana Silva', 'Wei Chen', 'Sam Ortiz', 'Priya Nair', 'Tom Hale'];

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
    await expect(more).toHaveAttribute('aria-expanded', 'true');
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

export const GroupSizeAndShape = () => (
    <AvatarGroup label="Agents" size={24} shape="square" max={3}>
        {PEOPLE.slice(0, 4).map((name) => <Avatar key={name} name={name} size={48} />)}
    </AvatarGroup>
);

/** The group's size and shape win over each avatar's own. */
GroupSizeAndShape.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const img of canvas.getAllByRole('img')) {
        await expect(box(img)).toEqual({ width: 24, height: 24 });
        await expect(px(getComputedStyle(img).borderTopLeftRadius)).toBe(6);
    }
    await expect(box(canvas.getByRole('button'))).toEqual({ width: 24, height: 24 });
};

/* ------------------------------------------------------------ playground */

export const Interactive = (args) => <Avatar {...args} />;
Interactive.args = {
    name: 'Jane Park',
    size: 40,
    shape: 'circle',
    color: 'blue',
};
Interactive.argTypes = {
    size: { control: 'select', options: AVATAR_SIZES },
    status: { control: 'select', options: [undefined, ...AVATAR_STATUSES] },
};
