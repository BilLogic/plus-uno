import React from 'react';
import { expect, within } from 'storybook/test';

import { CountTag, IconButton } from '@/components';
import SidebarTab from './SidebarTab';

/**
 * `SidebarTab` — one row of the Navigation system: a 32 row with a 16 icon
 * and a label that truncates, plus a description, a trailing slot and
 * controls on hover.
 *
 * THE TEST SEAM IS THIS FILE. Each play reads what a screen reader meets: the
 * row's role, its name and whether it is the current page.
 */

export default {
    title: 'Components/Navigation/Navigation system/Sidebar tab',
    component: SidebarTab,
    tags: ['!dev', '!autodocs'],
    decorators: [(Story) => <div style={{ width: 'var(--frame-sidebar-width)' }}><Story /></div>],
    argTypes: {
        text: { control: 'text', table: { category: 'Content' } },
        icon: { control: 'text', table: { category: 'Content' } },
        description: { control: 'text', table: { category: 'Content' } },
        state: { control: 'select', options: ['enabled', 'selected', 'disabled'], table: { category: 'Design' } },
        leadingVisual: { control: 'boolean', table: { category: 'Design' } },
        href: { control: 'text', table: { category: 'Development' } },
        external: { control: 'boolean', table: { category: 'Development' } },
        trailingVisual: { table: { disable: true } },
        elemAfter: { table: { disable: true } },
        actionsOnHover: { table: { disable: true } },
        onClick: { table: { disable: true } },
        id: { table: { disable: true } },
        className: { table: { disable: true } },
        style: { table: { disable: true } },
    },
    args: { text: 'Sessions', icon: 'calendar', state: 'enabled' },
};

/** A row with its icon and label. */
export const Overview = {
    args: { onClick: () => {} },
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).getByRole('button', { name: 'Sessions' })).toBeTruthy();
    },
};

/** The selected row says so with `aria-current="page"`, not with its fill alone. */
export const Selected = {
    args: { state: 'selected', onClick: () => {} },
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).getByRole('button', { name: 'Sessions' }).getAttribute('aria-current')).toBe('page');
    },
};

/** A disabled row takes no tab stop. */
export const Disabled = { args: { state: 'disabled', onClick: () => {} } };

/** A second line in Body/small; the row grows past 32 to hold it. */
export const WithDescription = { args: { text: 'Lin Chen', icon: 'user', description: 'Grade 7 · Math', onClick: () => {} } };

/** A count in the trailing slot. */
export const WithCount = {
    args: { text: 'Compliance', icon: 'flag', onClick: () => {} },
    render: (args) => <SidebarTab {...args} elemAfter={<CountTag value={3} label="3 open flags" />} />,
};

/** Controls shown on hover and focus, beside the row rather than inside it. */
export const WithActions = {
    args: { text: 'Mon 4:00 PM · Lin', icon: 'calendar', onClick: () => {} },
    render: (args) => <SidebarTab {...args} actionsOnHover={<IconButton appearance="subtle" spacing="compact" icon="xmark" label="Close tab" />} />,
};

/** `href` makes the row a link; `external` opens it in a new tab and says so. */
export const ExternalLink = {
    args: { text: 'Slack', icon: 'fa-brands fa-slack', href: 'https://slack.com/', external: true },
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).getByRole('link', { name: /Slack.*opens in a new tab/ })).toBeTruthy();
    },
};

/** The playground. */
export const Interactive = { args: { onClick: () => {} } };
