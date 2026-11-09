import React from 'react';
import { expect } from 'storybook/test';

import { Button, IconButton } from '@/components';
import { iconClass } from './icon';

/**
 * The icon API: a Font Awesome Free glyph drawn from a name. There is no Icon
 * component of its own: a component that shows an icon takes its name
 * (`icon`, `iconBefore`, `iconAfter`), and anything else draws
 * `<i className={iconClass(name)} aria-hidden="true" />`. `iconClass` picks
 * regular where Free has it and solid where it does not.
 *
 * THE TEST SEAM IS THIS FILE. Each play reads the class the glyph renders
 * with, which is the whole contract of `iconClass`.
 */

export default {
    title: 'Components/Images and icons/Icon',
    tags: ['!dev', '!autodocs'],
    argTypes: {
        name: { control: 'text', table: { category: 'Content' } },
        size: { control: 'select', options: ['--icon-sm', '--icon-md', '--icon-lg'], table: { category: 'Design' } },
        color: {
            control: 'select',
            options: ['--ds-icon', '--ds-icon-subtle', '--ds-icon-subtlest', '--ds-icon-brand', '--ds-icon-success', '--ds-icon-warning', '--ds-icon-danger', '--ds-icon-information'],
            table: { category: 'Design' },
        },
    },
    args: { name: 'calendar-days', size: '--icon-md', color: '--ds-icon-subtle' },
};

const code = { font: 'var(--code)', color: 'var(--ds-text-subtle)' };
const col = { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--stack-sm)' };

/** A glyph from its name, at a size token and in a color token. */
const Glyph = ({ name, size = '--icon-md', color = '--ds-icon-subtle' }) => (
    <i
        className={iconClass(name)}
        aria-hidden="true"
        style={{ fontSize: `var(${size})`, width: `var(${size})`, height: `var(${size})`, lineHeight: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: `var(${color})` }}
    />
);

/** A name draws regular where Free has it, and solid where it does not. */
export const Overview = {
    render: () => (
        <div style={{ display: 'flex', gap: 'var(--page-stack-md)', flexWrap: 'wrap' }}>
            {['calendar-days', 'bell', 'gear', 'fa-brands fa-slack'].map((name) => (
                <div key={name} style={col}>
                    <Glyph name={name} size="--icon-lg" color="--ds-icon" />
                    <span style={code}>{iconClass(name)}</span>
                </div>
            ))}
        </div>
    ),
    play: async ({ canvasElement }) => {
        const glyphs = canvasElement.querySelectorAll('i');
        await expect(glyphs[0].className).toBe('fa-regular fa-calendar-days');
        await expect(glyphs[2].className).toBe('fa-solid fa-gear');
        await expect(glyphs[3].className, 'a family passed in is kept').toBe('fa-brands fa-slack');
        for (const glyph of glyphs) await expect(glyph.getAttribute('aria-hidden')).toBe('true');
    },
};

/** The three sizes: 12, 16 (the default) and 24. */
export const Sizes = {
    render: () => (
        <div style={{ display: 'flex', gap: 'var(--page-stack-md)', alignItems: 'flex-end' }}>
            {['--icon-sm', '--icon-md', '--icon-lg'].map((size) => (
                <div key={size} style={col}>
                    <Glyph name="folder" size={size} color="--ds-icon" />
                    <span style={code}>{size}</span>
                </div>
            ))}
        </div>
    ),
};

/** A component takes the name and draws the glyph itself. */
export const InAComponent = {
    render: () => (
        <div style={{ display: 'flex', gap: 'var(--inline-lg)', alignItems: 'center' }}>
            <Button iconBefore="calendar-days" text="Schedule" />
            <IconButton icon="bell" label="Notifications" />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const glyphs = canvasElement.querySelectorAll('i');
        await expect(glyphs[0].className).toBe('fa-regular fa-calendar-days');
        await expect(glyphs[1].className).toBe('fa-regular fa-bell');
    },
};

/** The playground: a name, a size and a color. */
export const Interactive = {
    render: ({ name, size, color }) => <Glyph name={name} size={size} color={color} />,
};
