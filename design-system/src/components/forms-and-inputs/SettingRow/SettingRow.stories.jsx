import React, { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { settleAnimations } from '@/storybook-docs/lib/overlay-motion-plays';
import { px, probe, tokenColor, tokenLength } from '@/storybook-docs/lib/style-probes.js';
import { emulateReducedMotion } from '@/storybook-docs/lib/test-viewport.js';
import { Button, Flag, FlagGroup, Select, StatusTag, Toggle } from '@/components';
import SettingRow from './SettingRow';

const LEAD_TIME_OPTIONS = [
    { value: '15m', label: '15 minutes before' },
    { value: '1h', label: '1 hour before' },
    { value: '24h', label: '24 hours before' },
];

const containerStyle = {
    maxWidth: 'var(--card-min-width-lg)',
    width: '100%',
};

const groupHeadingStyle = {
    margin: '0 0 var(--stack-sm)',
    font: 'var(--heading-small)',
    color: 'var(--ds-text)',
};

export default {
    title: 'Components/Forms and inputs/Setting row',
    component: SettingRow,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'A setting row puts a setting’s name and one-line description at the start and its control at the end, dividing rows under a group heading with no card per row.',
            },
        },
    },
    argTypes: {
        control: { control: false, table: { category: 'Content' } },
        status: { control: false, table: { category: 'Content' } },
        style: { table: { disable: true } },
        className: { control: false, table: { disable: true, category: 'Development' } },
        id: { control: false, table: { disable: true, category: 'Development' } },
        testId: { control: false, table: { disable: true, category: 'Development' } },
        label: {
            control: 'text',
            table: { category: 'Content' },
        },
        description: {
            control: 'text',
            table: { category: 'Content' },
        },
        error: {
            control: 'text',
            table: { category: 'Validation' },
        },
        isDisabled: {
            control: 'boolean',
            table: { category: 'Behavior' },
        },
        isReadOnly: {
            control: 'boolean',
            table: { category: 'Behavior' },
        },
    },
};

const OverviewExample = () => {
    const [reminders, setReminders] = useState(true);
    const [leadTime, setLeadTime] = useState('1h');
    const [connected, setConnected] = useState(true);

    return (
        <div style={containerStyle}>
            <h3 style={groupHeadingStyle}>Notifications and calendar</h3>
            <div>
                <SettingRow
                    id="overview-reminders"
                    label="Session reminders"
                    description="Send an email before each scheduled tutoring session."
                    control={(
                        <Toggle
                            isChecked={reminders}
                            onChange={(e) => setReminders(e.target.checked)}
                        />
                    )}
                />
                <SettingRow
                    id="overview-lead-time"
                    label="Reminder lead time"
                    description="How far ahead we send your session reminder email."
                    control={(
                        <Select
                            spacing="compact"
                            isSearchable={false}
                            options={LEAD_TIME_OPTIONS}
                            value={leadTime}
                            onChange={setLeadTime}
                        />
                    )}
                />
                <SettingRow
                    id="overview-calendar"
                    label="Google Calendar"
                    description="Sync upcoming tutoring sessions to your calendar."
                    status={(
                        <StatusTag appearance={connected ? 'success' : 'default'}>
                            {connected ? 'Connected' : 'Not connected'}
                        </StatusTag>
                    )}
                    control={(
                        <Button
                            appearance="default"
                            spacing="compact"
                            onClick={() => setConnected((prev) => !prev)}
                        >
                            {connected ? 'Disconnect' : 'Connect'}
                        </Button>
                    )}
                />
            </div>
        </div>
    );
};

export const Overview = {
    render: () => <OverviewExample />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const rows = canvasElement.querySelectorAll('.plus-setting-row');
        await expect(rows).toHaveLength(3);

        const padY = tokenLength(rows[0], '--setting-row-pad-y');
        await expect(padY, '--setting-row-pad-y resolves to 12px').toBe(12);
        await expect(px(getComputedStyle(rows[0]).paddingTop)).toBe(padY);
        await expect(px(getComputedStyle(rows[0]).paddingBottom)).toBe(padY);

        // First row has no top border; subsequent rows divide with a 1px line.
        await expect(px(getComputedStyle(rows[0]).borderTopWidth)).toBe(0);
        await expect(px(getComputedStyle(rows[1]).borderTopWidth)).toBe(1);
        await expect(px(getComputedStyle(rows[2]).borderTopWidth)).toBe(1);

        // Control sits at the end, top-aligned to the label row.
        const labelRow = rows[0].querySelector('.plus-setting-row__label-row');
        const endSlot = rows[0].querySelector('.plus-setting-row__end');
        await expect(endSlot.getBoundingClientRect().top).toBeCloseTo(labelRow.getBoundingClientRect().top, 0);

        await expect(canvas.getByRole('switch', { name: 'Session reminders' })).toHaveAttribute('aria-checked', 'true');
        await expect(canvas.getByRole('combobox', { name: 'Reminder lead time' })).toBeInTheDocument();
        await expect(canvas.getByRole('button', { name: 'Disconnect Google Calendar' })).toBeInTheDocument();
    },
};

export const ToggleControl = {
    name: 'Control: Toggle',
    render: () => (
        <div style={containerStyle}>
            <SettingRow
                id="toggle-setting"
                label="Session reminders"
                description="Send an email before each scheduled tutoring session."
                control={<Toggle defaultChecked />}
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const toggle = canvas.getByRole('switch', { name: 'Session reminders' });
        await expect(canvasElement.querySelector('label'), 'Toggle carries no duplicate label').toBeNull();
        await expect(toggle).toHaveAttribute('aria-checked', 'true');
        await userEvent.click(toggle);
        await expect(toggle).toHaveAttribute('aria-checked', 'false');
    },
};

const SelectControlExample = () => {
    const [leadTime, setLeadTime] = useState('1h');
    return (
        <div style={containerStyle}>
            <SettingRow
                id="select-setting"
                label="Reminder lead time"
                description="How far ahead we send your session reminder email."
                control={(
                    <Select
                        spacing="compact"
                        isSearchable={false}
                        options={LEAD_TIME_OPTIONS}
                        value={leadTime}
                        onChange={setLeadTime}
                    />
                )}
            />
        </div>
    );
};

export const SelectControl = {
    name: 'Control: Compact Select',
    render: () => <SelectControlExample />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const combobox = canvas.getByRole('combobox', { name: 'Reminder lead time' });
        await expect(combobox).toBeInTheDocument();
        await expect(combobox).toHaveTextContent('1 hour before');
    },
};

const ConnectionRowExample = () => {
    const [connected, setConnected] = useState(true);
    return (
        <div style={containerStyle}>
            <SettingRow
                id="connection-setting"
                label="Google Calendar"
                description="Sync upcoming tutoring sessions to your calendar."
                status={(
                    <StatusTag appearance={connected ? 'success' : 'default'}>
                        {connected ? 'Connected' : 'Not connected'}
                    </StatusTag>
                )}
                control={(
                    <Button
                        appearance="default"
                        spacing="compact"
                        onClick={() => setConnected((prev) => !prev)}
                    >
                        {connected ? 'Disconnect' : 'Connect'}
                    </Button>
                )}
            />
        </div>
    );
};

export const ConnectionRow = {
    name: 'Control: Button with status',
    render: () => <ConnectionRowExample />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const label = canvas.getByText('Google Calendar');
        const status = canvas.getByText('Connected');
        const endSlot = canvasElement.querySelector('.plus-setting-row__end');
        const button = canvas.getByRole('button', { name: 'Disconnect Google Calendar' });

        await expect(endSlot.contains(status), 'status never sits in the control slot').toBe(false);
        await expect(status.getBoundingClientRect().left).toBeGreaterThanOrEqual(label.getBoundingClientRect().right - 1);
        await expect(button.getBoundingClientRect().left).toBeGreaterThan(status.getBoundingClientRect().right);

        await userEvent.click(button);
        await expect(canvas.getByText('Not connected')).toBeInTheDocument();
        await expect(canvas.getByRole('button', { name: 'Connect Google Calendar' })).toBeInTheDocument();
    },
};

export const Rest = {
    name: 'State: Rest',
    render: () => (
        <div style={containerStyle}>
            <SettingRow
                label="Weekly digest"
                description="Receive a Monday summary of completed sessions."
                control={<Toggle defaultChecked={false} />}
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const label = canvasElement.querySelector('.plus-setting-row__label');
        const description = canvasElement.querySelector('.plus-setting-row__description');
        await expect(getComputedStyle(label).fontWeight).toBe('500');
        await expect(getComputedStyle(description).color).toBe(tokenColor(canvasElement, '--ds-text-subtle'));
        await expect(canvas.getByRole('switch', { name: 'Weekly digest' })).toHaveAttribute('aria-checked', 'false');
    },
};

export const Saving = {
    name: 'State: Saving',
    render: () => (
        <div style={containerStyle}>
            <SettingRow
                label="Auto-record sessions"
                description="Start cloud recording automatically when a video session opens."
                control={<Toggle isChecked isLoading />}
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const toggle = canvas.getByRole('switch', { name: 'Auto-record sessions' });
        await expect(toggle).toHaveAttribute('aria-busy', 'true');
        await expect(canvas.getByRole('status')).toHaveTextContent('Saving');
    },
};

const SavedExample = () => {
    const [checked, setChecked] = useState(false);
    const [digest, setDigest] = useState(true);
    const [flagTitle, setFlagTitle] = useState(null);

    const handleChange = (name, setter) => (e) => {
        const next = e.target.checked;
        setter(next);
        setFlagTitle(`${name} turned ${next ? 'on' : 'off'}`);
    };

    return (
        <div style={{ ...containerStyle, position: 'relative' }}>
            <SettingRow
                label="Session reminders"
                description="Send an email before each scheduled tutoring session."
                control={<Toggle isChecked={checked} onChange={handleChange('Session reminders', setChecked)} />}
            />
            <SettingRow
                label="Weekly digest"
                description="Receive a Monday summary of completed sessions."
                control={<Toggle isChecked={digest} onChange={handleChange('Weekly digest', setDigest)} />}
            />
            {flagTitle && (
                <FlagGroup containerPosition="absolute">
                    <Flag
                        appearance="success"
                        title={flagTitle}
                        show={Boolean(flagTitle)}
                        onDismiss={() => setFlagTitle(null)}
                    />
                </FlagGroup>
            )}
        </div>
    );
};

export const Saved = {
    name: 'State: Saved (Flag confirms)',
    render: () => <SavedExample />,
    play: async ({ canvasElement }) => {
        await settleAnimations(canvasElement);
        const canvas = within(canvasElement);
        const toggle = canvas.getByRole('switch', { name: 'Session reminders' });
        await expect(toggle).toHaveAttribute('aria-checked', 'false');
        await userEvent.click(toggle);
        await expect(toggle).toHaveAttribute('aria-checked', 'true');
        await expect(await canvas.findByText('Session reminders turned on')).toBeInTheDocument();
    },
};

export const ErrorState = {
    name: 'State: Error',
    render: () => (
        <div style={containerStyle}>
            <SettingRow
                label="SMS alerts"
                description="Text me when a student cancels within two hours of a session."
                error="Could not save SMS alerts. Check your connection and try again."
                control={<Toggle isChecked={false} onChange={() => {}} />}
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const description = canvas.getByText('Text me when a student cancels within two hours of a session.');
        const alert = canvas.getByRole('alert');
        const toggle = canvas.getByRole('switch', { name: 'SMS alerts' });

        await expect(alert).toHaveTextContent('Could not save SMS alerts. Check your connection and try again.');
        await expect(alert.getBoundingClientRect().top).toBeGreaterThanOrEqual(description.getBoundingClientRect().bottom - 1);
        await expect(getComputedStyle(alert).color).toBe(tokenColor(canvasElement, '--ds-text-danger'));
        await expect(toggle).toHaveAttribute('aria-invalid', 'true');
    },
};

export const DisabledWithReason = {
    name: 'State: Disabled with a reason',
    render: () => (
        <div style={containerStyle}>
            <SettingRow
                label="Calendar invites"
                description="Connect Google Calendar above to send invites automatically."
                isDisabled
                control={<Toggle isChecked={false} onChange={() => {}} />}
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const label = canvasElement.querySelector('.plus-setting-row__label');
        const description = canvasElement.querySelector('.plus-setting-row__description');
        const toggle = canvas.getByRole('switch', { name: 'Calendar invites' });

        await expect(toggle).toHaveAttribute('data-disabled', '');
        await expect(getComputedStyle(label).color).toBe(tokenColor(canvasElement, '--ds-text-disabled'));
        await expect(getComputedStyle(description).color, 'reason stays at full subtle contrast').toBe(
            tokenColor(canvasElement, '--ds-text-subtle')
        );
    },
};

export const ReadOnly = {
    name: 'State: Read-only',
    render: () => (
        <div style={containerStyle}>
            <SettingRow
                label="Background check reminders"
                description="Managed by your program supervisor; required for active tutors."
                isReadOnly
                control={<Toggle defaultChecked />}
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const toggle = canvas.getByRole('switch', { name: 'Background check reminders' });
        await expect(toggle).toHaveAttribute('aria-readonly', 'true');
        await expect(toggle).toHaveAttribute('aria-checked', 'true');
        await userEvent.click(toggle);
        await expect(toggle).toHaveAttribute('aria-checked', 'true');
    },
};

export const Motion = {
    render: () => (
        <div style={containerStyle}>
            <SettingRow
                label="Session reminders"
                description="Send an email before each scheduled tutoring session."
                control={<Toggle defaultChecked={false} />}
            />
        </div>
    ),
    beforeEach: async () => async () => { await emulateReducedMotion(null); },
    play: async ({ canvasElement }) => {
        const row = canvasElement.querySelector('.plus-setting-row');
        await expect(getComputedStyle(row).transitionTimingFunction).toBe(
            probe(row, 'transitionTimingFunction', 'var(--ds-motion-appearance-fast)')
        );
        const toggle = within(canvasElement).getByRole('switch', { name: 'Session reminders' });
        await userEvent.click(toggle);
        await expect(toggle).toHaveAttribute('aria-checked', 'true');
        if (!(await emulateReducedMotion('reduce'))) return;
        await expect(parseFloat(getComputedStyle(row).transitionDuration)).toBe(0);
    },
};

export const Interactive = {
    args: {
        label: 'Session reminders',
        description: 'Send an email before each scheduled tutoring session.',
        error: '',
        isDisabled: false,
        isReadOnly: false,
    },
    render: (args) => (
        <div style={containerStyle}>
            <SettingRow
                {...args}
                error={args.error || undefined}
                control={<Toggle defaultChecked />}
            />
        </div>
    ),
};
