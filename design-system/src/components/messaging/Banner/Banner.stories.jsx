import React from 'react';
import { expectNoStateChange, expectNotAControl } from '@/storybook-docs/lib/label-states.js';
import { tokenColor as stateTokenColor } from '@/storybook-docs/lib/style-probes.js';
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
        icon: { control: 'text', table: { category: 'Content' } },
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

/** One appearance per story, for the docs page's Appearance section. */
const appearanceStory = (appearance, children) => ({
    render: () => <Banner appearance={appearance}>{children}</Banner>,
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).getByRole('status')).toHaveClass(`plus-banner--${appearance}`);
    },
});

export const Warning = appearanceStory('warning', 'Scheduled maintenance begins at 9:00 PM EST.');
export const Danger = appearanceStory('danger', 'Session recordings are unavailable. We are working on a fix.');
export const Announcement = appearanceStory('announcement', 'The new schedule view is here.');

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

/* ------------------------------------------------------------------- states */

const bannerRoot = (canvasElement) => within(canvasElement).getByRole('status');
const StateBanner = () => <Banner appearance="warning">Scheduled maintenance begins at 9:00 PM EST.</Banner>;

/** Rest: the warning ground and text from their role tokens. */
export const Rest = {
    render: () => <StateBanner />,
    play: async ({ canvasElement }) => {
        const banner = bannerRoot(canvasElement);
        await expect(getComputedStyle(banner).backgroundColor).toBe(stateTokenColor(canvasElement, '--ds-background-warning'));
        await expect(getComputedStyle(banner).color).toBe(stateTokenColor(canvasElement, '--ds-text-warning'));
    },
};

/** Hovered: a banner is not a control, so a pointer over it changes nothing. */
export const Hovered = {
    render: () => <StateBanner />,
    play: async ({ canvasElement }) => {
        await expectNoStateChange(bannerRoot(canvasElement), ':hover', 'banner');
    },
};

/** Pressed: no pressed layer either. */
export const Pressed = {
    render: () => <StateBanner />,
    play: async ({ canvasElement }) => {
        await expectNoStateChange(bannerRoot(canvasElement), ':active', 'banner');
    },
};

/** Focused: Tab skips it; a link inside takes its own focus. */
export const Focused = {
    render: () => <StateBanner />,
    play: async ({ canvasElement }) => {
        await expectNotAControl(bannerRoot(canvasElement), 'banner');
    },
};
