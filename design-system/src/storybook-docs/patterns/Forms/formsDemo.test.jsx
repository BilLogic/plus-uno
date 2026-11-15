import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { FIVE_QUESTION_STEPS, QuestionStep, SettingsPage } from './formsDemo.jsx';

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

describe('QuestionStep (Forms › In steps)', () => {
    it('renders ProgressIndicator dots, a heading, one line, tiles, Back and Continue under five steps', () => {
        render(<QuestionStep />);

        expect(screen.queryByRole('navigation', { name: 'Main' })).toBeNull();
        expect(screen.queryByRole('navigation', { name: 'Steps' })).toBeNull();

        const progress = screen.getByRole('group', { name: 'Setup progress' });
        const dots = [...progress.children];
        expect(dots).toHaveLength(3);
        expect(dots[0]).toHaveAttribute('aria-current', 'step');
        expect(within(progress).queryAllByRole('button')).toHaveLength(0);

        expect(screen.getByRole('heading', { level: 1, name: 'How would you like to tutor?' })).toBeInTheDocument();
        expect(screen.getByText('Pick the session format you want to start with. You can change this later.')).toBeInTheDocument();

        const group = screen.getByRole('radiogroup', { name: 'How would you like to tutor?' });
        expect(within(group).getAllByRole('radio')).toHaveLength(3);

        const back = screen.getByRole('button', { name: 'Back' });
        const next = screen.getByRole('button', { name: 'Continue' });
        expect(back).toBeDisabled();
        expect(next).not.toBeDisabled();
    });

    it('keeps Continue enabled, validates on press for both radio and checkbox tile steps, and preserves answers on Back', async () => {
        const user = userEvent.setup();
        render(<QuestionStep />);

        const continueBtn = screen.getByRole('button', { name: 'Continue' });
        expect(continueBtn).not.toBeDisabled();

        // Unanswered radio step: Continue stays enabled and announces the error.
        await user.click(continueBtn);
        expect(continueBtn).not.toBeDisabled();
        expect(screen.getByRole('alert')).toHaveTextContent('Choose a tutoring format to continue.');
        expect(screen.getByRole('heading', { level: 1, name: 'How would you like to tutor?' })).toBeInTheDocument();

        const oneOnOne = screen.getByRole('radio', { name: 'One-on-one' });
        expect(document.activeElement).toBe(oneOnOne);

        // Answering clears the error; Continue advances to step 2 (CheckboxGroup tiles).
        await user.click(oneOnOne);
        expect(screen.queryByRole('alert')).toBeNull();
        await user.click(continueBtn);

        const progress = screen.getByRole('group', { name: 'Setup progress' });
        expect(progress.children[1]).toHaveAttribute('aria-current', 'step');
        expect(screen.getByRole('heading', { level: 1, name: 'Which subjects can you tutor?' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Back' })).not.toBeDisabled();

        // Unanswered checkbox step: Continue stays enabled and validates on press.
        await user.click(screen.getByRole('button', { name: 'Continue' }));
        expect(screen.getByRole('button', { name: 'Continue' })).not.toBeDisabled();
        expect(screen.getByRole('alert')).toHaveTextContent('Select at least one subject to continue.');

        const algebra = screen.getByRole('checkbox', { name: 'Algebra' });
        await user.click(algebra);
        expect(screen.queryByRole('alert')).toBeNull();

        // Stepping back preserves step 1's answer; stepping forward again preserves step 2's answer.
        await user.click(screen.getByRole('button', { name: 'Back' }));
        expect(screen.getByRole('heading', { level: 1, name: 'How would you like to tutor?' })).toBeInTheDocument();
        expect(screen.getByRole('radio', { name: 'One-on-one' })).toHaveAttribute('aria-checked', 'true');

        await user.click(screen.getByRole('button', { name: 'Continue' }));
        expect(screen.getByRole('checkbox', { name: 'Algebra' })).toBeChecked();

        // Advance to final step.
        await user.click(screen.getByRole('button', { name: 'Continue' }));
        expect(progress.children[2]).toHaveAttribute('aria-current', 'step');
        expect(screen.getByRole('heading', { level: 1, name: 'When are you free to tutor?' })).toBeInTheDocument();
    });

    it('switches from ProgressIndicator dots to the left step list at five or more steps', async () => {
        const user = userEvent.setup();
        render(<QuestionStep steps={FIVE_QUESTION_STEPS} />);

        expect(screen.queryByRole('group', { name: 'Setup progress' })).toBeNull();
        const tracker = screen.getByRole('navigation', { name: 'Steps' });
        expect(tracker).toBeInTheDocument();
        expect(within(tracker).getByText('Format')).toBeInTheDocument();
        expect(within(tracker).getByText('Review')).toBeInTheDocument();

        await user.click(screen.getByRole('radio', { name: 'One-on-one' }));
        await user.click(screen.getByRole('button', { name: 'Continue' }));
        expect(screen.getByRole('heading', { level: 1, name: 'Which subjects can you tutor?' })).toBeInTheDocument();

        await user.click(within(tracker).getByRole('button', { name: /Format/ }));
        expect(screen.getByRole('heading', { level: 1, name: 'How would you like to tutor?' })).toBeInTheDocument();
    });
});
