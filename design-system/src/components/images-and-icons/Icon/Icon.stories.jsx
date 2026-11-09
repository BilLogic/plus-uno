import React from 'react';
import { expect, within } from 'storybook/test';

import { inEveryColorModeOf } from '@/storybook-docs/lib/color-modes.js';
import { px, tokenLength } from '@/storybook-docs/lib/style-probes.js';
import { Button, IconButton } from '@/components';
import Icon, { ICON_COLORS, ICON_SIZES } from './Icon';

/**
 * `Icon` -- one Font Awesome Free glyph, drawn from its name.
 *
 * THE TEST SEAM IS THIS FILE. Story `play:` functions run by `check:storybook`
 * in a real browser: the family a name resolves to, the box each size draws,
 * each color role resolved to its token in every color mode, the accessible
 * name, and a component drawing its string icon through Icon.
 */

export default {
    title: 'Components/Images and icons/Icon',
    component: Icon,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'One Font Awesome Free glyph at an icon size token and in an icon color role, named for assistive technology or hidden as decoration.',
            },
        },
    },
    argTypes: {
        name: { control: 'text', table: { category: 'Content' } },
        label: { control: 'text', table: { category: 'Content' } },
        size: { control: 'inline-radio', options: [undefined, ...ICON_SIZES], table: { category: 'Design' } },
        color: { control: 'select', options: [undefined, ...ICON_COLORS], table: { category: 'Design' } },
        className: { control: false },
        style: { control: false },
    },
};

const row = { display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 'var(--grid-gutter)' };
const cell = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--inline-sm)' };
const caption = { font: 'var(--body-small)', color: 'var(--ds-text-subtle)' };

const SIZE_TOKEN = { 12: '--icon-sm', 16: '--icon-md', 24: '--icon-lg' };
const colorToken = (role) => (role === 'default' ? '--ds-icon' : `--ds-icon-${role}`);

/* ------------------------------------------------------------------ names */

const NAMES = ['calendar-days', 'bell', 'gear', 'fa-brands fa-slack'];

export const Names = () => (
    <div style={row}>
        {NAMES.map((name) => (
            <div key={name} style={cell}>
                <Icon name={name} size={24} color="default" data-name={name} />
                <span style={caption}>{name}</span>
            </div>
        ))}
    </div>
);

/** A name draws regular where Free has it and solid where it does not; a family passed in is kept. */
Names.play = async ({ canvasElement }) => {
    const glyphs = canvasElement.querySelectorAll('i');
    await expect(glyphs[0]).toHaveClass('fa-regular', 'fa-calendar-days');
    await expect(glyphs[2]).toHaveClass('fa-solid', 'fa-gear');
    await expect(glyphs[3], 'a family passed in is kept').toHaveClass('fa-brands', 'fa-slack');
};

/* ------------------------------------------------------------------ sizes */

export const Sizes = () => (
    <div style={row}>
        {ICON_SIZES.map((size) => (
            <div key={size} style={cell}>
                <Icon name="folder" size={size} color="default" data-size={size} />
                <span style={caption}>{size} · {SIZE_TOKEN[size]}</span>
            </div>
        ))}
    </div>
);

/** Each size is a square box of its icon size token. */
Sizes.play = async ({ canvasElement }) => {
    for (const glyph of canvasElement.querySelectorAll('i')) {
        const want = tokenLength(canvasElement, SIZE_TOKEN[glyph.dataset.size]);
        await expect(px(getComputedStyle(glyph).width), `${glyph.dataset.size} width`).toBe(want);
        await expect(px(getComputedStyle(glyph).height), `${glyph.dataset.size} height`).toBe(want);
        await expect(px(getComputedStyle(glyph).fontSize), `${glyph.dataset.size} glyph`).toBe(want);
    }
};

/* ----------------------------------------------------------------- colors */

/** The inverse roles sit on the bold ground they are made for. */
const INVERSE_GROUND = {
    inverse: ['--ds-background-neutral-bold', '--ds-text-inverse'],
    'warning-inverse': ['--ds-background-warning-bold', '--ds-text-warning-inverse'],
};

export const Colors = () => (
    <div style={{ ...row, alignItems: 'flex-start' }}>
        {ICON_COLORS.map((role) => {
            const [ground, text] = INVERSE_GROUND[role] ?? [];
            return (
                <div
                    key={role}
                    style={{
                        ...cell,
                        padding: 'var(--pad-y-sm) var(--pad-x-sm)',
                        borderRadius: 'var(--radius-sm)',
                        background: ground ? `var(${ground})` : undefined,
                    }}
                >
                    <Icon name="star" size={24} color={role} data-role={role} />
                    <span style={{ ...caption, color: text ? `var(${text})` : caption.color }}>{role}</span>
                </div>
            );
        })}
    </div>
);

/** Every role draws its icon color token, in light and dark and both contrasts. */
Colors.play = async ({ canvasElement }) => {
    await inEveryColorModeOf(canvasElement, async (mode, token) => {
        for (const glyph of canvasElement.querySelectorAll('i')) {
            await expect(getComputedStyle(glyph).color, `${glyph.dataset.role}, ${mode}`).toBe(token(colorToken(glyph.dataset.role)));
        }
    });
};

/* ---------------------------------------------------------- inherits */

export const Inherited = () => (
    <span data-testid="text" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--inline-sm)', font: 'var(--body-large)', color: 'var(--ds-text-danger)' }}>
        <Icon name="circle-exclamation" data-testid="glyph" />
        Payment failed
    </span>
);

/** Without a color the glyph takes the color around it; without a size it is the small icon size, unless the component around it sets one. */
Inherited.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const text = getComputedStyle(canvas.getByTestId('text'));
    const glyph = getComputedStyle(canvas.getByTestId('glyph'));
    await expect(glyph.color).toBe(text.color);
    await expect(px(glyph.fontSize)).toBe(tokenLength(canvasElement, '--icon-sm'));
};

/* --------------------------------------------------------- accessibility */

export const Labeled = () => (
    <div style={row}>
        <Icon name="circle-check" size={16} color="success" label="Approved" />
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--inline-sm)', font: 'var(--body-default)', color: 'var(--ds-text)' }}>
            <Icon name="calendar-days" size={16} color="subtle" data-testid="decorative" />
            Tuesday, 4 pm
        </span>
    </div>
);

/** With `label` the icon is an image with that name; beside visible words it is hidden. */
Labeled.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('img', { name: 'Approved' })).toBeInTheDocument();
    const decorative = canvas.getByTestId('decorative');
    await expect(decorative.getAttribute('aria-hidden')).toBe('true');
    await expect(decorative.getAttribute('role')).toBeNull();
};

/* ------------------------------------------------------- in a component */

export const InAComponent = () => (
    <div style={{ display: 'flex', gap: 'var(--inline-lg)', alignItems: 'center' }}>
        <Button iconBefore="calendar-days" text="Schedule" />
        <IconButton icon="bell" label="Notifications" />
    </div>
);

/** A component given an icon name draws it through Icon. */
InAComponent.play = async ({ canvasElement }) => {
    const glyphs = canvasElement.querySelectorAll('i.plus-icon');
    await expect(glyphs).toHaveLength(2);
    await expect(glyphs[0]).toHaveClass('fa-regular', 'fa-calendar-days');
    await expect(glyphs[1]).toHaveClass('fa-regular', 'fa-bell');
};

/* ------------------------------------------------------------ playground */

export const Interactive = (args) => <Icon {...args} />;
Interactive.args = { name: 'calendar-days', size: 24, color: 'default' };

/** The controls drive `name`, `size`, `color` and `label`. */
Interactive.play = async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('i.plus-icon')).not.toBeNull();
};

/** An icon is a picture, not a control: its one state is at rest. */
export const Rest = () => <Icon name="bell" size={16} color="default" label="Notifications" />;

Rest.play = async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('img', { name: 'Notifications' })).not.toHaveAttribute('tabindex');
};
