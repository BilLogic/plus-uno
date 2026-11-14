import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { InboxInSidebar } from './notificationsDemo.jsx';

describe('InboxInSidebar (Patterns › Notifications)', () => {
    it('opens a 360px (--inbox-width) Inbox Panel beside the Sidebar with header actions, Unread/All tabs and day groups', async () => {
        const user = userEvent.setup();
        render(<InboxInSidebar />);

        const inbox = screen.getByRole('region', { name: 'Inbox' });
        expect(inbox).toBeInTheDocument();
        expect(inbox.style.width).toBe('var(--inbox-width)');

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

        const inbox = screen.getByRole('region', { name: 'Inbox' });
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

    it('closes on Escape and outside click, restores focus to the Sidebar trigger, and reopens', async () => {
        const user = userEvent.setup();
        render(<InboxInSidebar />);

        const inbox = screen.getByRole('region', { name: 'Inbox' });
        const nav = screen.getByRole('navigation', { name: 'Main' });
        const inboxTrigger = within(nav).getByRole('button', { name: /Inbox/i });

        // Focus inside Inbox, then press Escape -> closes and restores focus to Sidebar Inbox button
        within(inbox).getByRole('tab', { name: /Unread/i }).focus();
        await user.keyboard('{Escape}');
        expect(screen.queryByRole('region', { name: 'Inbox' })).toBeNull();
        expect(inboxTrigger).toHaveFocus();

        // Reopens from the Sidebar Inbox button
        await user.click(inboxTrigger);
        expect(screen.getByRole('region', { name: 'Inbox' })).toBeInTheDocument();

        // Closes on outside click (the page behind has no backdrop)
        await user.click(screen.getByRole('heading', { name: 'Sessions' }));
        expect(screen.queryByRole('region', { name: 'Inbox' })).toBeNull();
    });
});
