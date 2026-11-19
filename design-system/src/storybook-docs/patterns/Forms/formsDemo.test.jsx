import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectTypeCardAnchors } from '@/storybook-docs/lib/type-card-anchors.jsx';
import { SettingsPage } from './formsDemo.jsx';

vi.mock('@storybook/addon-docs/blocks', () => import('@/storybook-docs/lib/addon-docs-blocks-mock.jsx'));

describe('SettingsPage (Forms › Settings page)', () => {
    it('groups SettingRows under section headings with Toggle, compact Select, and Button + StatusTag controls', () => {
        render(<SettingsPage />);

        expect(screen.getByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 2, name: 'Notifications' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 2, name: 'Connected accounts' })).toBeInTheDocument();

        // Instant settings take effect on change and need no Save button.
        expect(screen.queryByRole('button', { name: /^Save/i })).toBeNull();

        // Controls are named by their SettingRow labels via aria-labelledby.
        expect(screen.getByRole('switch', { name: 'Session reminders' })).toHaveAttribute('aria-checked', 'true');
        expect(screen.getByRole('combobox', { name: 'Reminder lead time' })).toBeInTheDocument();
        expect(screen.getByText('Connected')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Disconnect Google Calendar' })).toBeInTheDocument();
    });

    it('saves a Toggle immediately on flip and confirms with a Flag', async () => {
        const user = userEvent.setup();
        render(<SettingsPage />);

        const reminders = screen.getByRole('switch', { name: 'Session reminders' });
        expect(reminders).toHaveAttribute('aria-checked', 'true');

        await user.click(reminders);
        expect(reminders).toHaveAttribute('aria-checked', 'false');
        expect(await screen.findByText('Session reminders turned off')).toBeInTheDocument();
    });

    it('disconnects and reconnects a connected account row with StatusTag beside the label', async () => {
        const user = userEvent.setup();
        render(<SettingsPage />);

        const disconnect = screen.getByRole('button', { name: 'Disconnect Google Calendar' });
        await user.click(disconnect);

        expect(screen.getByText('Not connected')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Connect Google Calendar' })).toBeInTheDocument();
    });
});

describe('Forms live cases and TypeCard links', () => {
    it('links every TypeCard anchor to a unique ComponentExample heading id in Forms.mdx', () => {
        expectTypeCardAnchors(join(__dirname, 'Forms.mdx'), 4);
    });
});
