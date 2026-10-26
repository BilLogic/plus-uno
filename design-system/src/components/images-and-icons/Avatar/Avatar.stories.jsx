import React from 'react';
import { expect, within } from 'storybook/test';

import { UserAvatar } from '@/components';
import { DoDontGrid } from '@/storybook-docs/ds-docs-layout.jsx';

/**
 * `UserAvatar` is the Avatar of the design system: the signed-in person as an
 * initial pill, a name, an optional role and an optional notification counter.
 *
 * THE TEST SEAM IS THIS FILE. Story `play:` functions run by `check:storybook`
 * in a real browser and assert what a person can observe: the rendered height,
 * the text, and what assistive technology is told.
 */

export default {
    title: 'Components/Images and icons/Avatar',
    component: UserAvatar,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'The signed-in person: an initial pill, the name and an optional notification counter.',
            },
        },
    },
    argTypes: {
        firstChar: { control: 'text', description: 'The initial: the first letter of the name beside it.' },
        name: { control: 'text', description: 'The full name. A long name truncates and keeps its full text as a tooltip.' },
        counter: { control: 'boolean', description: 'Shows the notification counter.' },
        counterValue: { control: 'number', description: 'The number in the counter.' },
        size: { control: 'inline-radio', options: ['md', 'lg'], description: 'md is 32 high, for the topbar. lg is padded, for table rows.' },
        type: { control: 'inline-radio', options: ['regular tutor', 'lead tutor', 'admin'], description: 'lead tutor adds a "Lead" status. The other types add none.' },
        state: { control: 'inline-radio', options: ['enabled', 'hover'], description: 'hover shows the hovered fill.' },
        id: { control: false, table: { disable: true } },
        className: { control: false, table: { disable: true } },
        onClick: { control: false, table: { disable: true } },
    },
};

const row = { display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center' };

/* ------------------------------------------------------------------ sizes */

export const Sizes = () => (
    <div style={row}>
        <UserAvatar size="md" name="Jane Park" firstChar="J" />
        <UserAvatar size="lg" name="Jane Park" firstChar="J" />
    </div>
);

export const TopbarSize = () => <UserAvatar size="md" name="Jane Park" firstChar="J" />;

/** The md avatar is exactly one item high: 32, the height of the topbar. */
TopbarSize.play = async ({ canvasElement }) => {
    const avatar = within(canvasElement).getByText('Jane Park').closest('.plus-user-avatar');
    await expect(Math.round(avatar.getBoundingClientRect().height)).toBe(32);
};

/* ---------------------------------------------------------------- content */

export const Content = () => (
    <div style={row}>
        <UserAvatar name="Jane Park" firstChar="J" counter={false} />
        <UserAvatar name="Jane Park" firstChar="J" counter counterValue={2} />
    </div>
);

export const Roles = () => (
    <div style={row}>
        <UserAvatar name="Jane Park" firstChar="J" type="regular tutor" counter={false} />
        <UserAvatar name="Jane Park" firstChar="J" type="lead tutor" counter={false} />
        <UserAvatar name="Jane Park" firstChar="J" type="admin" counter={false} />
    </div>
);

/** A lead tutor shows the "Lead" status. A regular tutor and an admin show none. */
Roles.play = async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByText('Lead')).toHaveLength(1);
};

export const LongName = () => (
    <div style={{ maxWidth: '240px' }}>
        <UserAvatar size="md" name="Alexandria Montgomery-Featherstonehaugh" firstChar="A" counter={false} />
    </div>
);

/** A long name truncates and keeps its full text as a tooltip. */
LongName.play = async ({ canvasElement }) => {
    const name = within(canvasElement).getByText('Alexandria Montgomery-Featherstonehaugh');
    await expect(name).toHaveAttribute('title', 'Alexandria Montgomery-Featherstonehaugh');
    await expect(getComputedStyle(name).textOverflow).toBe('ellipsis');
};

/* ----------------------------------------------------------------- states */

export const States = () => (
    <div style={row}>
        <UserAvatar name="Jane Park" firstChar="J" state="enabled" />
        <UserAvatar name="Jane Park" firstChar="J" state="hover" onClick={() => {}} />
    </div>
);

/* --------------------------------------------------------- accessibility */

export const Decorative = () => <UserAvatar name="Jane Park" firstChar="J" counter={false} />;

/** The initial pill is hidden from assistive technology. The name is the text. */
Decorative.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('J').closest('[aria-hidden="true"]')).not.toBeNull();
    await expect(canvas.getByText('Jane Park')).toBeVisible();
};

/* ------------------------------------------------------------- do / don't */

const stack = { display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' };

export const DoDont = () => (
    <DoDontGrid
        pairs={[
            {
                doExample: (
                    <div style={stack}>
                        <UserAvatar size="md" firstChar="J" name="Jane Park" counter={false} />
                        <UserAvatar size="md" firstChar="J" name="Jamal Reed" counter={false} />
                    </div>
                ),
                doCaption: 'Each initial with the name it stands for.',
                dontExample: (
                    <div style={stack}>
                        <UserAvatar size="md" firstChar="J" name="" counter={false} />
                        <UserAvatar size="md" firstChar="J" name="" counter={false} />
                    </div>
                ),
                dontCaption: 'Two bare initials that could be anyone named J.',
            },
            {
                doExample: <UserAvatar size="md" firstChar="J" name="Jane Park" counter={false} />,
                doCaption: 'An Avatar for a tutor.',
                dontExample: <UserAvatar size="md" firstChar="L" name="Lincoln High School" counter={false} />,
                dontCaption: 'An Avatar standing in for a school. Frame its logo or crest in a Tile instead.',
            },
            {
                doExample: <UserAvatar size="md" firstChar="J" name="Jane Park" counter counterValue={2} />,
                doCaption: 'A count of unread notifications.',
                dontExample: (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <UserAvatar size="md" firstChar="J" name="Jane Park" counter={false} />
                        <span
                            style={{
                                padding: '0 var(--element-pad-x-sm)',
                                borderRadius: 'var(--element-radius-full)',
                                background: 'var(--color-danger-state-08)',
                                color: 'var(--color-danger-text)',
                                font: 'var(--body-small)',
                            }}
                        >
                            Lead
                        </span>
                    </div>
                ),
                dontCaption: 'The counter used as a role label. A role belongs in a Status beside the name.',
            },
        ]}
    />
);

/* -------------------------------------------------------------- playground */

export const Interactive = (args) => <UserAvatar {...args} />;
Interactive.args = {
    firstChar: 'J',
    name: 'Jane Park',
    counter: true,
    counterValue: 2,
    size: 'md',
    type: 'regular tutor',
    state: 'enabled',
};
