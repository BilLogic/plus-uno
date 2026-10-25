import React, { useState } from 'react';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { probe, px, tokenColor, tokenLength } from '@/storybook-docs/lib/style-probes.js';
import { Button, Count, Status } from '@/components';
import SidebarTab from '@/components/navigation/SidebarTab';

export default {
    title: 'Components/Navigation/Sidebar tab',
    component: SidebarTab,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
        state: {
            control: { type: 'select' },
            options: ['enabled', 'selected', 'disabled'],
            table: { category: 'Behavior' }
        },
        icon: { control: 'text', table: { category: 'Content' } },
        text: { control: 'text', table: { category: 'Content' } },
        leadingVisual: { control: 'boolean', table: { category: 'Content' } },
        trailingVisual: { control: 'boolean', table: { category: 'Content' } },
        description: { control: 'text', table: { category: 'Content' } },
        elemAfter: { control: false, table: { category: 'Content' } },
        actionsOnHover: { control: false, table: { category: 'Content' } },
        href: { control: 'text', table: { category: 'Behavior' } },
        external: { control: 'boolean', table: { category: 'Behavior' } },
        id: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        className: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
    },
    // Add gap to decorator for better spacing in list
    decorators: [
        (Story) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <Story />
            </div>
        )
    ]
};

const sidebarSurface = {
    display: 'inline-flex',
    backgroundColor: 'var(--ds-surface-sunken)',
    padding: '12px',
    borderRadius: '12px',
    border: '1px solid var(--ds-border)',
};

export const InSidebar = () => {
    const [selected, setSelected] = useState('dashboard');
    const items = [
        { id: 'dashboard', text: 'Dashboard', icon: 'home' },
        { id: 'reports', text: 'Reports', icon: 'chart-bar' },
        { id: 'settings', text: 'Settings', icon: 'cog' },
    ];
    return (
        <div style={sidebarSurface}>
            <nav
                aria-label="Example sidebar navigation"
                style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-pad-x-sm, 4px)', width: '100%' }}
            >
                {items.map((item) => (
                    <SidebarTab
                        key={item.id}
                        text={item.text}
                        icon={item.icon}
                        state={selected === item.id ? 'selected' : 'enabled'}
                        onClick={() => setSelected(item.id)}
                    />
                ))}
            </nav>
        </div>
    );
};
InSidebar.parameters = {
    docs: {
        disable: true
    }
};
/** Each row is the 32 item height, pads 12 at the sides, and draws a 16 icon. */
InSidebar.play = async ({ canvasElement }) => {
    const rows = within(canvasElement).getAllByRole('button');
    for (const row of rows) {
        const style = getComputedStyle(row);
        await expect(row.getBoundingClientRect().height, 'row height').toBeCloseTo(tokenLength(canvasElement, '--item-height-md'), 0);
        await expect(px(style.paddingLeft), 'pad-x').toBeCloseTo(tokenLength(canvasElement, '--element-pad-x-md'), 0);
        await expect(px(style.borderTopLeftRadius), 'radius').toBeCloseTo(tokenLength(canvasElement, '--element-radius-item-md'), 0);
        const icon = row.querySelector('i');
        await expect(icon.parentElement.getBoundingClientRect().width, 'icon box').toBeCloseTo(tokenLength(canvasElement, '--icon-md'), 0);
        await expect(px(getComputedStyle(icon).fontSize), 'icon size').toBeCloseTo(tokenLength(canvasElement, '--icon-md'), 0);
    }
};

export const Default = {
    args: {
        text: 'Dashboard',
        icon: 'home',
        state: 'enabled',
    },
    parameters: {
        docs: {
            disable: true
        }
    }
};

export const Overview = {
    ...Default,
    parameters: {
        docs: {
            source: { language: 'jsx', code: webAppSourceSnippets.sidebarTab }
        }
    }
};

export const Selected = {
    args: {
        text: 'Dashboard',
        icon: 'home',
        state: 'selected',
    },
    /** The selected row says which page you are on, not only how it looks. */
    play: async ({ canvasElement }) => {
        const row = within(canvasElement).getByRole('button', { name: 'Dashboard' });
        await expect(row).toHaveAttribute('aria-current', 'page');
    },
};

export const Hover = {
    args: {
        text: 'Reports',
        icon: 'chart-bar',
        state: 'hover',
    },
};

export const Disabled = {
    args: {
        text: 'Settings',
        icon: 'cog',
        state: 'disabled',
    },
};

export const NoIcon = {
    args: {
        text: 'Log Out',
        leadingVisual: false,
    },
};

export const WithTrailingIcon = {
    args: {
        text: 'External Link',
        icon: 'external-link-alt',
        trailingVisual: true,
    },
};

export const Interactive = {
    args: {
        text: 'Dashboard',
        icon: 'home',
        state: 'enabled',
        leadingVisual: true,
        trailingVisual: false,
    },
    render: (args) => <SidebarTab {...args} />,
};

/* ------------------------------------------------------------- slots and behavior */

/** A row that fits the 240 sidebar's 224 content width. */
const sidebarWidth = { width: 'calc(var(--layout-width-sidebar) - 2 * var(--surface-container-pad))' };

/** Tabbing onto a row draws the 2px focused ring, 2px outside the row. */
export const KeyboardFocus = {
    args: { text: 'Reports', icon: 'chart-bar' },
    parameters: { docs: { disable: true } },
    play: async ({ canvasElement }) => {
        const row = within(canvasElement).getByRole('button', { name: 'Reports' });
        await userEvent.tab();
        await expect(document.activeElement).toBe(row);
        await waitFor(() => expect(getComputedStyle(row).outlineStyle).toBe('solid'));
        await expect(px(getComputedStyle(row).outlineWidth), 'ring width').toBe(2);
        await expect(getComputedStyle(row).outlineColor, 'ring color').toBe(tokenColor(canvasElement, '--ds-border-focused'));
        await expect(px(getComputedStyle(row).outlineOffset), 'ring offset, outside the row').toBe(2);
    },
};

/** A label longer than the row ends in an ellipsis; the row stays 32. */
export const LongLabel = {
    render: () => (
        <div style={sidebarWidth}>
            <SidebarTab text="Session reflections and post-session feedback for every student" icon="clipboard" />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const row = within(canvasElement).getByRole('button');
        const label = row.querySelector('.plus-sidebar-tab__label');
        await expect(row.getBoundingClientRect().height, 'row height').toBeCloseTo(tokenLength(canvasElement, '--item-height-md'), 0);
        await expect(getComputedStyle(label).textOverflow).toBe('ellipsis');
        await expect(label.scrollWidth, 'the label overflows and is clipped').toBeGreaterThan(label.clientWidth);
    },
};

/** An optional second line under the label, in Body small. */
export const WithDescription = {
    render: () => (
        <div style={sidebarWidth}>
            <SidebarTab text="Sessions" icon="calendar-alt" description="3 upcoming this week" />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const row = within(canvasElement).getByRole('button', { name: /Sessions/ });
        const description = within(row).getByText('3 upcoming this week');
        await expect(description).toHaveClass('plus-sidebar-tab__description');
        await expect(getComputedStyle(description).font, 'Body small').toBe(probe(canvasElement, 'font', 'var(--body-small)'));
        // 2 + 20 + 16 + 2: the Figma row's min height 32 grows to 40.
        await expect(row.getBoundingClientRect().height, 'grows to 40').toBeCloseTo(
            2 * tokenLength(canvasElement, '--element-pad-y-sm') + tokenLength(canvasElement, '--line-height-125') + tokenLength(canvasElement, '--line-height-100'), 0,
        );
    },
};

/** `elemAfter` holds a count, a badge or a status at the end of the row. */
export const WithElemAfter = {
    render: () => (
        <div style={{ ...sidebarWidth, display: 'flex', flexDirection: 'column', gap: 'var(--element-stack-sm)' }}>
            <SidebarTab text="Sessions" icon="calendar-alt" elemAfter={<Count value={3} label="3 upcoming" />} />
            <SidebarTab text="Students" icon="user-graduate" elemAfter={<Status style="success">Live</Status>} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const rows = within(canvasElement).getAllByRole('button');
        for (const row of rows) {
            await expect(row.getBoundingClientRect().height, 'row height').toBeCloseTo(tokenLength(canvasElement, '--item-height-md'), 0);
            await expect(row.querySelector('.plus-sidebar-tab__after'), 'the slot renders').not.toBeNull();
        }
        await expect(within(rows[1]).getByText('Live')).toBeInTheDocument();
    },
};

const onRowClick = fn();
const onMore = fn();

/**
 * `actionsOnHover` shows on hover and while the row has focus. The actions are
 * the row's siblings, not its children, so a button never nests in a button
 * and pressing an action does not open the row.
 */
export const WithActionsOnHover = {
    render: () => (
        <div style={sidebarWidth}>
            <SidebarTab
                text="Sessions"
                icon="calendar-alt"
                onClick={onRowClick}
                elemAfter={<Count value={3} label="3 upcoming" />}
                actionsOnHover={<Button style="default" fill="ghost" size="small" leadingVisual="ellipsis" aria-label="More actions for Sessions" onClick={onMore} />}
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        onRowClick.mockClear();
        onMore.mockClear();
        const canvas = within(canvasElement);
        const row = canvas.getByRole('button', { name: /^Sessions/ });
        const actions = canvasElement.querySelector('.plus-sidebar-tab__actions');
        await expect(row.contains(actions), 'actions sit beside the row, not inside it').toBe(false);
        // At rest means no pointer over the item: the runner's real pointer can
        // be left wherever the last story put it.
        if (!actions.parentElement.matches(':hover')) {
            await expect(getComputedStyle(actions).visibility, 'hidden at rest').toBe('hidden');
        }

        await userEvent.tab();
        await expect(document.activeElement).toBe(row);
        await waitFor(() => expect(getComputedStyle(actions).visibility, 'shown while the row has focus').toBe('visible'));

        await userEvent.tab();
        const more = canvas.getByRole('button', { name: 'More actions for Sessions' });
        await expect(document.activeElement).toBe(more);
        await userEvent.click(more);
        await expect(onMore).toHaveBeenCalledTimes(1);
        await expect(onRowClick).not.toHaveBeenCalled();
    },
};

/** An external destination is a link that opens a new tab, and says so. */
export const ExternalLink = {
    render: () => (
        <div style={sidebarWidth}>
            <SidebarTab text="Slack" icon="arrow-up-right-from-square" href="https://slack.com/" external />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const link = within(canvasElement).getByRole('link', { name: /Slack/ });
        await expect(link).toHaveAttribute('href', 'https://slack.com/');
        await expect(link).toHaveAttribute('target', '_blank');
        await expect(link.getAttribute('rel')).toContain('noopener');
        await expect(link).toHaveAccessibleName(/opens in a new tab/i);
        await expect(link.getBoundingClientRect().height, 'row height').toBeCloseTo(tokenLength(canvasElement, '--item-height-md'), 0);
    },
};

/** A disabled row is announced, takes no tab stop and ignores a press. */
export const DisabledIsInert = {
    render: () => <SidebarTab text="Settings" icon="cog" state="disabled" onClick={onRowClick} />,
    parameters: { docs: { disable: true } },
    play: async ({ canvasElement }) => {
        onRowClick.mockClear();
        const row = within(canvasElement).getByRole('button', { name: 'Settings' });
        await expect(row).toHaveAttribute('aria-disabled', 'true');
        await expect(row).toHaveAttribute('tabindex', '-1');
        await userEvent.click(row);
        await expect(onRowClick).not.toHaveBeenCalled();
    },
};
