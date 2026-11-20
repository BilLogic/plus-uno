import React from 'react';
import { join } from 'node:path';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectTypeCardAnchors } from '@/storybook-docs/lib/type-card-anchors.jsx';
import { InboxInSidebar } from '@/storybook-docs/lib/inbox-demo.jsx';

vi.mock('@storybook/addon-docs/blocks', () => import('@/storybook-docs/lib/addon-docs-blocks-mock.jsx'));

describe('InboxInSidebar (Patterns › Notifications)', () => {
    it('opens a 360px (--inbox-width) Inbox Panel beside the Sidebar with header actions, Unread/All tabs and day groups', async () => {
        const user = userEvent.setup();
        render(<InboxInSidebar />);

        const inbox = screen.getByRole('complementary', { name: 'Inbox' });
        expect(inbox).toBeInTheDocument();
        expect(inbox).toHaveClass('plus-panel-overlay--start');

        // Header controls: Mark all as read, settings, close
        expect(within(inbox).getByRole('button', { name: 'Mark all as read' })).toBeInTheDocument();
        expect(within(inbox).getByRole('button', { name: /settings/i })).toBeInTheDocument();
        expect(within(inbox).getByRole('button', { name: 'Close' })).toBeInTheDocument();

        // Tabs: Unread (with count) and All
        const unreadTab = within(inbox).getByRole('tab', { name: /Unread/i });
        const allTab = within(inbox).getByRole('tab', { name: 'All' });
        expect(unreadTab).toHaveAttribute('aria-selected', 'true');
        expect(unreadTab).toHaveTextContent('3');

        // Grouped by day inside Unread
        expect(within(inbox).getByRole('heading', { name: 'Today' })).toBeInTheDocument();
        expect(within(inbox).getByRole('heading', { name: 'Yesterday' })).toBeInTheDocument();

        const unreadLinks = within(inbox).getAllByRole('link');
        expect(unreadLinks).toHaveLength(3);
        for (const link of unreadLinks) {
            expect(link).toHaveAccessibleName(/unread/i);
        }

        // Switching to All includes read items too
        await user.click(allTab);
        expect(allTab).toHaveAttribute('aria-selected', 'true');
        expect(within(inbox).getAllByRole('link').length).toBeGreaterThan(3);
    });

    it('marks one or all as read and shows EmptyState "You are all caught up." when Unread is empty', async () => {
        const user = userEvent.setup();
        render(<InboxInSidebar />);

        const inbox = screen.getByRole('complementary', { name: 'Inbox' });
        const markReadButtons = within(inbox).getAllByRole('button', { name: 'Mark as read' });
        expect(markReadButtons).toHaveLength(3);

        // Mark one item as read
        await user.click(markReadButtons[0]);
        expect(within(inbox).getByRole('tab', { name: /Unread/i })).toHaveTextContent('2');
        expect(within(inbox).getAllByRole('link')).toHaveLength(2);

        // Mark all as read -> EmptyState "You are all caught up."
        await user.click(within(inbox).getByRole('button', { name: 'Mark all as read' }));
        expect(within(inbox).getByRole('heading', { name: 'You are all caught up.' })).toBeInTheDocument();
        expect(within(inbox).queryAllByRole('link')).toHaveLength(0);

        // All tab still shows every notification as read
        await user.click(within(inbox).getByRole('tab', { name: 'All' }));
        const allLinks = within(inbox).getAllByRole('link');
        expect(allLinks.length).toBeGreaterThan(0);
        for (const link of allLinks) {
            expect(link).not.toHaveAccessibleName(/unread/i);
        }
    });

    it('closes on Escape and outside click, restores focus to the bell, and reopens', async () => {
        const user = userEvent.setup();
        render(<InboxInSidebar />);

        const inbox = screen.getByRole('complementary', { name: 'Inbox' });
        const inboxTrigger = screen.getByRole('button', { name: /^Inbox, 3 unread/ });
        expect(screen.queryByRole('button', { name: 'Inbox' }), 'no Inbox row in the nav').toBeNull();

        // Focus inside Inbox, then press Escape -> closes and restores focus to the bell
        within(inbox).getByRole('tab', { name: /Unread/i }).focus();
        await user.keyboard('{Escape}');
        expect(screen.queryByRole('complementary', { name: 'Inbox' })).toBeNull();
        expect(inboxTrigger).toHaveFocus();

        // Reopens from the bell
        await user.click(inboxTrigger);
        expect(screen.getByRole('complementary', { name: 'Inbox' })).toBeInTheDocument();

        // Closes on outside click (the page behind has no blanket)
        await user.click(screen.getByRole('heading', { name: 'Sessions' }));
        expect(screen.queryByRole('complementary', { name: 'Inbox' })).toBeNull();
    });

    it('links every TypeCard anchor to a unique ComponentExample heading id in Notifications.mdx', () => {
        expectTypeCardAnchors(join(__dirname, 'Notifications.mdx'), 7);
    });
});
