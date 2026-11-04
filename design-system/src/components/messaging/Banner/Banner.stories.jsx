import React from 'react';
import { expect, within } from 'storybook/test';
import Banner, { BANNER_APPEARANCES } from './Banner';

const stack = { display: 'flex', flexDirection: 'column', gap: '16px' };
const title = (name) => name.charAt(0).toUpperCase() + name.slice(1);

export default {
    title: 'Components/Messaging/Banner',
    component: Banner,
    /** Hide CSF stories from the sidebar; docs live on Banner.mdx (Canvas still embeds them). */
    tags: ['!dev', '!autodocs', 'new'],
    parameters: {
        changelog: [
            { date: '2026-11-03', kind: 'added', summary: 'Banner: a prominent top-of-page message. `appearance` (warning, danger, announcement), `icon`.' },
        ],
        docs: { toc: { title: 'On this page' } },
    },
    argTypes: {
        appearance: { control: 'select', options: BANNER_APPEARANCES, table: { category: 'Design' } },
        icon: { control: 'text', description: 'Font Awesome Free solid glyph name, a node, or `false` to remove it', table: { category: 'Content' } },
        children: { control: 'text', table: { category: 'Content' } },
    },
    args: { appearance: 'warning', children: 'Scheduled maintenance begins at 9:00 PM EST.' },
};

export const Overview = {
    render: (args) => <Banner {...args} />,
    play: async ({ canvasElement }) => {
        const banner = within(canvasElement).getByRole('status');
        await expect(banner).toHaveClass('plus-banner--warning');
        await expect(banner.querySelector('.plus-banner-icon')).not.toBeNull();
    },
};

export const Appearances = {
    render: () => (
        <div style={stack}>
            {BANNER_APPEARANCES.map((appearance) => (
                <Banner key={appearance} appearance={appearance}>
                    {title(appearance)} banner message.
                </Banner>
            ))}
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getAllByRole('status')).toHaveLength(BANNER_APPEARANCES.length);
        await expect(canvas.getByText('Announcement banner message.').closest('.plus-banner').querySelector('.plus-banner-icon')).toBeNull();
    },
};

export const WithoutIcon = {
    render: () => <Banner appearance="warning" icon={false}>No icon on this one.</Banner>,
    play: async ({ canvasElement }) => {
        const banner = within(canvasElement).getByRole('status');
        await expect(banner.querySelector('.plus-banner-icon')).toBeNull();
    },
};

export const Interactive = {
    render: (args) => <Banner {...args} />,
};
