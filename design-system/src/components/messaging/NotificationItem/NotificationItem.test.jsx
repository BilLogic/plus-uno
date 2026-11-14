import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Avatar from '../../images-and-icons/Avatar';
import Tile from '../../images-and-icons/Tile';
import NotificationItem from './NotificationItem';

describe('NotificationItem', () => {
    it('renders the row as a single link with person Avatar or system Tile actor', () => {
        const { rerender } = render(
            <NotificationItem
                actor={<Avatar name="Ana Ruiz" size={32} />}
                title="Ana Ruiz moved Thursday's session"
                meta="Sessions · 2m"
                unread
                href="/sessions/thu-430"
                onMarkRead={() => {}}
            />
        );

        const links = screen.getAllByRole('link');
        expect(links).toHaveLength(1);
        expect(links[0]).toHaveAttribute('href', '/sessions/thu-430');
        // Avatar name is not repeated before the title's own "Ana Ruiz ...".
        expect(links[0]).not.toHaveAccessibleName(/^Ana Ruiz\s+Ana Ruiz/i);

        rerender(
            <NotificationItem
                actor={<Tile icon="calendar-check" size={32} />}
                title="Friday notes reminder"
                meta="Compliance · 1h"
                href="/compliance"
            />
        );

        const systemLinks = screen.getAllByRole('link');
        expect(systemLinks).toHaveLength(1);
        expect(systemLinks[0]).toHaveAttribute('href', '/compliance');
        expect(systemLinks[0]).toHaveAccessibleName(/Friday notes reminder.*Compliance · 1h/);
    });

    it('announces unread on the row link only while unread is true', () => {
        const { rerender } = render(
            <NotificationItem
                actor={<Avatar name="Ben Okafor" size={32} />}
                title="Ben Okafor mentioned you"
                meta="Notes · 1h"
                unread
                href="/notes/14"
            />
        );

        const link = screen.getByRole('link');
        expect(link).toHaveAccessibleName(/unread/i);
        expect(screen.getByText('Unread')).toBeInTheDocument();

        rerender(
            <NotificationItem
                actor={<Avatar name="Ben Okafor" size={32} />}
                title="Ben Okafor mentioned you"
                meta="Notes · 1h"
                unread={false}
                href="/notes/14"
            />
        );

        expect(screen.getByRole('link')).not.toHaveAccessibleName(/unread/i);
        expect(screen.queryByText('Unread')).toBeNull();
    });

    it('fires onMarkRead without activating the row link, and omits Mark as read once read', async () => {
        const user = userEvent.setup();
        const onMarkRead = vi.fn();
        const onLinkClick = vi.fn((event) => event.preventDefault());

        const { rerender } = render(
            <NotificationItem
                actor={<Avatar name="Ana Ruiz" size={32} />}
                title="Ana Ruiz moved Thursday's session"
                meta="Sessions · 2m"
                unread
                href="/sessions/thu-430"
                onClick={onLinkClick}
                onMarkRead={onMarkRead}
            />
        );

        const link = screen.getByRole('link');
        await user.hover(link);

        const markReadButton = screen.getByRole('button', { name: 'Mark as read' });
        expect(link.contains(markReadButton)).toBe(false);

        await user.click(markReadButton);
        expect(onMarkRead).toHaveBeenCalledTimes(1);
        expect(onLinkClick).not.toHaveBeenCalled();

        rerender(
            <NotificationItem
                actor={<Avatar name="Ana Ruiz" size={32} />}
                title="Ana Ruiz moved Thursday's session"
                meta="Sessions · 2m"
                unread={false}
                href="/sessions/thu-430"
                onClick={onLinkClick}
                onMarkRead={onMarkRead}
            />
        );

        expect(screen.queryByRole('button', { name: 'Mark as read' })).toBeNull();
    });

    it('supports keyboard focus from the row link to Mark as read', async () => {
        const user = userEvent.setup();
        const onMarkRead = vi.fn();

        render(
            <NotificationItem
                actor={<Avatar name="Chloe Tran" size={32} />}
                title="Chloe Tran confirmed Friday"
                meta="Sessions · Yesterday"
                unread
                href="/sessions/fri-330"
                onMarkRead={onMarkRead}
            />
        );

        const link = screen.getByRole('link');
        const markReadButton = screen.getByRole('button', { name: 'Mark as read' });

        await user.tab();
        expect(link).toHaveFocus();

        await user.tab();
        expect(markReadButton).toHaveFocus();

        await user.keyboard('{Enter}');
        expect(onMarkRead).toHaveBeenCalledTimes(1);
    });
});
