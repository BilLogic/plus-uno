import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectTypeCardAnchors } from '@/storybook-docs/lib/type-card-anchors.jsx';
import { ErrorInSecondDialog, ErrorOnField, HelpInCaptionCase, HelpInTooltipCase, SettingsPage } from './formsDemo.jsx';

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
    it('HelpInCaptionCase renders visible standing help in the caption while HelpInTooltipCase puts it in an info button', async () => {
        const user = userEvent.setup();
        const { unmount } = render(<HelpInCaptionCase />);
        const captionInput = screen.getByRole('textbox', { name: 'School email' });
        const caption = screen.getByText('Shared with your site supervisor.');
        expect(captionInput.getAttribute('aria-describedby')).toContain(caption.id);
        await user.clear(captionInput);
        await user.type(captionInput, 'marcus.lee@lincoln.edu');
        expect(captionInput).toHaveValue('marcus.lee@lincoln.edu');
        unmount();

        render(<HelpInTooltipCase />);
        const tooltipInput = screen.getByRole('textbox', { name: 'School email' });
        expect(tooltipInput).toHaveValue('ana.ruiz@lincoln.edu');
        await user.clear(tooltipInput);
        await user.type(tooltipInput, 'sofia.ramirez@lincoln.edu');
        expect(tooltipInput).toHaveValue('sofia.ramirez@lincoln.edu');
        const infoBtn = screen.getByRole('button', { name: 'About School email' });
        infoBtn.focus();
        expect(infoBtn).toHaveFocus();
        expect(screen.queryByText('Shared with your site supervisor.')).toBeNull();
    });

    it('links every TypeCard anchor to a unique ComponentExample heading id in Forms.mdx', () => {
        expectTypeCardAnchors(join(__dirname, 'Forms.mdx'), 4);
    });
});

describe('Forms error placement examples', () => {
    it('ErrorOnField explains the field inside one dialog; ErrorInSecondDialog opens a second and leaves the field bare', () => {
        const onField = render(<ErrorOnField />);
        expect(screen.getAllByRole('dialog')).toHaveLength(1);
        expect(screen.getByText('Enter the student’s name')).toBeInTheDocument();
        onField.unmount();
        render(<ErrorInSecondDialog />);
        expect(screen.getAllByRole('dialog')).toHaveLength(2);
        expect(screen.queryByText('Enter the student’s name')).toBeNull();
    });
});
