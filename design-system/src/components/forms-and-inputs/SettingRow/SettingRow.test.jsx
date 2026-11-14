import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Button from '../Button';
import Select from '../Select';
import Toggle from '../Toggle';
import StatusTag from '../../labels/StatusTag';
import SettingRow from './SettingRow';

const LEAD_TIMES = [
    { value: '15m', label: '15 minutes before' },
    { value: '1h', label: '1 hour before' },
    { value: '24h', label: '24 hours before' },
];

describe('SettingRow', () => {
    it('names a Toggle control (with no own label) through aria-labelledby and flips on click', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();

        render(
            <SettingRow
                id="session-reminders"
                label="Session reminders"
                description="Send an email before each scheduled tutoring session."
                control={<Toggle defaultChecked onChange={onChange} />}
            />
        );

        const row = document.getElementById('session-reminders');
        expect(row).not.toBeNull();

        const toggle = screen.getByRole('switch', { name: 'Session reminders' });
        expect(toggle).toHaveAttribute('aria-checked', 'true');
        expect(toggle).toHaveAttribute('aria-labelledby', 'session-reminders-label');
        expect(document.getElementById('session-reminders-label')).toHaveTextContent('Session reminders');

        // Toggle inside SettingRow renders no duplicate <label> of its own.
        expect(row.querySelector('label')).toBeNull();

        await user.click(toggle);
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(toggle).toHaveAttribute('aria-checked', 'false');
    });

    it('names a compact Select control through aria-labelledby', () => {
        render(
            <SettingRow
                label="Reminder lead time"
                description="How far ahead we send session reminders."
                control={(
                    <Select
                        spacing="compact"
                        isSearchable={false}
                        options={LEAD_TIMES}
                        value="1h"
                        onChange={() => {}}
                    />
                )}
            />
        );

        const combobox = screen.getByRole('combobox', { name: 'Reminder lead time' });
        expect(combobox).toBeInTheDocument();
        const labelledBy = combobox.getAttribute('aria-labelledby');
        expect(labelledBy).toBeTruthy();
        expect(document.getElementById(labelledBy)).toHaveTextContent('Reminder lead time');
    });

    it('wires aria-labelledby on a Button control while keeping the button action text accessible', async () => {
        const user = userEvent.setup();
        const onDisconnect = vi.fn();

        render(
            <SettingRow
                id="google-calendar"
                label="Google Calendar"
                description="Sync upcoming tutoring sessions to your calendar."
                status={<StatusTag appearance="success">Connected</StatusTag>}
                control={<Button appearance="default" spacing="compact" onClick={onDisconnect}>Disconnect</Button>}
            />
        );

        const button = screen.getByRole('button', { name: 'Disconnect Google Calendar' });
        expect(button.getAttribute('aria-labelledby')).toContain('google-calendar-label');

        await user.click(button);
        expect(onDisconnect).toHaveBeenCalledTimes(1);
    });

    it('places label and description at the start before the control in DOM order', () => {
        render(
            <SettingRow
                label="Weekly digest"
                description="Receive a Monday summary of student progress."
                control={<Toggle defaultChecked />}
            />
        );

        const label = screen.getByText('Weekly digest');
        const description = screen.getByText('Receive a Monday summary of student progress.');
        const toggle = screen.getByRole('switch', { name: 'Weekly digest' });

        expect(label.compareDocumentPosition(description) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(description.compareDocumentPosition(toggle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('renders status beside the label and never inside the control slot', () => {
        render(
            <SettingRow
                label="Zoom"
                description="Create meeting links automatically for video sessions."
                status={<StatusTag appearance="success">Connected</StatusTag>}
                control={<Button spacing="compact">Disconnect</Button>}
            />
        );

        const labelEl = screen.getByText('Zoom');
        const statusEl = screen.getByText('Connected');
        const button = screen.getByRole('button', { name: /Disconnect/ });

        expect(labelEl.parentElement).toContainElement(statusEl);
        expect(labelEl.parentElement).not.toContainElement(button);
        expect(button.parentElement).not.toContainElement(statusEl);
        expect(labelEl.compareDocumentPosition(statusEl) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(statusEl.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('does not include status text in a Toggle accessible name', () => {
        render(
            <SettingRow
                label="AI session notes"
                description="Draft a summary after each recorded session."
                status={<StatusTag appearance="discovery">New</StatusTag>}
                control={<Toggle defaultChecked />}
            />
        );

        expect(screen.getByRole('switch', { name: 'AI session notes' })).toBeInTheDocument();
    });

    it('renders an inline error message under the description and marks the control invalid', () => {
        render(
            <SettingRow
                label="SMS alerts"
                description="Text me when a student cancels within two hours."
                error="Could not save SMS alerts. Check your connection and try again."
                control={<Toggle isChecked={false} onChange={() => {}} />}
            />
        );

        const description = screen.getByText('Text me when a student cancels within two hours.');
        const alert = screen.getByRole('alert');
        const toggle = screen.getByRole('switch', { name: 'SMS alerts' });

        expect(alert).toHaveTextContent('Could not save SMS alerts. Check your connection and try again.');
        expect(description.compareDocumentPosition(alert) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(alert.compareDocumentPosition(toggle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(toggle).toHaveAttribute('aria-invalid', 'true');
        expect(toggle.getAttribute('aria-describedby')).toContain(alert.id);
    });

    it('supports saving, disabled with a reason, and read-only states', async () => {
        const user = userEvent.setup();
        const onReadOnlyChange = vi.fn();

        const { rerender } = render(
            <SettingRow
                label="Auto-record sessions"
                description="Start cloud recording when a video room opens."
                control={<Toggle isChecked isLoading onChange={onReadOnlyChange} />}
            />
        );

        const savingToggle = screen.getByRole('switch', { name: 'Auto-record sessions' });
        expect(savingToggle).toHaveAttribute('aria-busy', 'true');
        expect(screen.getByRole('status')).toHaveTextContent('Saving');
        await user.click(savingToggle);
        expect(onReadOnlyChange).not.toHaveBeenCalled();

        rerender(
            <SettingRow
                label="Calendar invites"
                description="Connect Google Calendar above to send invites automatically."
                isDisabled
                control={<Toggle isChecked={false} onChange={onReadOnlyChange} />}
            />
        );

        const disabledToggle = screen.getByRole('switch', { name: 'Calendar invites' });
        expect(disabledToggle).toHaveAttribute('data-disabled', '');
        expect(screen.getByText('Connect Google Calendar above to send invites automatically.')).toBeInTheDocument();

        rerender(
            <SettingRow
                label="Background check reminders"
                description="Managed by your program supervisor; required for active tutors."
                isReadOnly
                control={<Toggle defaultChecked onChange={onReadOnlyChange} />}
            />
        );

        const readOnlyToggle = screen.getByRole('switch', { name: 'Background check reminders' });
        expect(readOnlyToggle).toHaveAttribute('aria-readonly', 'true');
        await user.click(readOnlyToggle);
        expect(onReadOnlyChange).not.toHaveBeenCalled();
    });
});
