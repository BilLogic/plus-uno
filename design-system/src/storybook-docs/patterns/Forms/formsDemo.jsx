import React, { useState } from 'react';

import {
    Button,
    Fieldset,
    Flag,
    FlagGroup,
    RadioGroup,
    Select,
    SettingRow,
    StatusTag,
    TextField,
    Toggle,
} from '@/components';
import { Frame, Section } from '@/templates';
import { stepItems } from '@/storybook-docs/lib/multi-step-task.jsx';

/** A form in steps: four or fewer run across the top; five or more go down a rail 256 wide. */
const STEPS_ACROSS_MAX = 4;
const STEPS_RAIL = 256; // docs-literal
import { InAppFrame } from '@/storybook-docs/lib/template-demo.jsx';
import { BrowserWindow } from '@/storybook-docs/lib/template-page.jsx';
import { FormFields, FILLED } from './formHosts.jsx';

/**
 * The Forms pattern's examples. The four hosts, the blocked submit, the server
 * refusal, the sending button and leaving with edits are the host demos
 * (formHosts.jsx), which the Modal and Panel pages reuse.
 * What is new here: required and optional marks, help in a caption and bound
 * inputs.
 *
 *   Marks          the fields with their minority marker and their captions
 *   BoundInputs    a control that cannot be wrong, in place of a free one
 */

/** The width a picture lays out at, in px: docs geometry. */
export const STAGE = 1024; // docs-literal

/** The fields as the person meets them: Student and Site are required, Notes says it is optional. */
export const Marks = () => {
    const [values, setValues] = useState(FILLED);
    return (
        <div style={{ padding: 'var(--page-pad)', maxInlineSize: 'calc(var(--card-min-width-lg))' }}>
            <FormFields values={values} onChange={setValues} />
        </div>
    );
};

const GRADES = ['Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'];

/** Up to five choices are a radio group that starts unanswered; six or more are a select. */
export const BoundInputs = () => {
    const [format, setFormat] = useState(null);
    const [grade, setGrade] = useState(null);
    return (
        <div style={{ padding: 'var(--page-pad)', maxInlineSize: 'calc(var(--card-min-width-lg))' }}>
            <Fieldset legend="Session">
                <RadioGroup legend="Format" isRequired options={['In person', 'Video', 'Phone']} value={format} onChange={setFormat} />
                <Select label="Grade" isRequired options={GRADES.map((g) => ({ value: g, label: g }))} value={grade} onChange={setGrade} />
                <TextField label="Notes" labelMarker="optional" value="" onChange={() => {}} />
            </Fieldset>
        </div>
    );
};

const pairStack = { display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)', width: '100%' };

/** Do: two required fields stay unmarked; the lone optional field carries `(optional)`. */
export const MinorityMarked = () => (
    <div style={pairStack}>
        <TextField label="Student" isRequired defaultValue="Ana Ruiz" />
        <TextField label="Site" isRequired defaultValue="Lincoln Middle" />
        <TextField label="Notes" labelMarker="optional" placeholder="Anything we should know?" />
    </div>
);

/** Don't: marking the majority case repeats `(required)` on nearly every label. */
export const MajorityMarked = () => (
    <div style={pairStack}>
        <TextField label="Student" isRequired labelMarker="required" defaultValue="Ana Ruiz" />
        <TextField label="Site" isRequired labelMarker="required" defaultValue="Lincoln Middle" />
        <TextField label="Notes" labelMarker="optional" placeholder="Anything we should know?" />
    </div>
);

/** Do: standing help stays in the caption under the field, still visible after typing. */
export const HelpInCaptionCase = () => (
    <div style={pairStack}>
        <TextField
            label="School email"
            defaultValue="ana.ruiz@lincoln.edu"
            caption="Shared with your site supervisor."
        />
    </div>
);

/** Don't: help placed only in an info tooltip beside the label disappears on touch and while typing. */
export const HelpInTooltipCase = () => (
    <div style={pairStack}>
        <TextField
            label="School email"
            defaultValue="ana.ruiz@lincoln.edu"
            info="Shared with your site supervisor."
        />
    </div>
);

/** Window height for the settings page example: docs geometry, in px. */
export const SETTINGS_PAGE_HEIGHT = 560; // docs-literal

const REMINDER_LEAD_OPTIONS = [
    { value: '15m', label: '15 minutes before' },
    { value: '1h', label: '1 hour before' },
    { value: '24h', label: '24 hours before' },
];

/**
 * Instant settings on a page: grouped SettingRows under section headings, with
 * no card per row and no page Save button. Flipping a Toggle or choosing an
 * option applies at once and confirms with a Flag; connection rows put their
 * StatusTag beside the label and the action Button at the end.
 */
export const SettingsPage = () => {
    const [reminders, setReminders] = useState(true);
    const [leadTime, setLeadTime] = useState('1h');
    const [digest, setDigest] = useState(false);
    const [calendarConnected, setCalendarConnected] = useState(true);
    const [savedTitle, setSavedTitle] = useState(null);

    const handleToggle = (settingName, next, setter) => {
        setter(next);
        setSavedTitle(`${settingName} turned ${next ? 'on' : 'off'}`);
    };

    const handleLeadTimeChange = (next) => {
        setLeadTime(next);
        setSavedTitle('Reminder lead time saved');
    };

    const handleCalendarToggle = () => {
        const next = !calendarConnected;
        setCalendarConnected(next);
        setSavedTitle(next ? 'Google Calendar connected' : 'Google Calendar disconnected');
    };

    return (
        <div style={{ position: 'relative', blockSize: '100%' }}>
            <InAppFrame height="100%" activeTabId="home" panelStorageKey={null}>
                <Section level="page" title="Settings" layout="subsections">
                    <Section title="Notifications">
                        <div>
                            <SettingRow
                                id="setting-session-reminders"
                                label="Session reminders"
                                description="Send an email before each scheduled tutoring session."
                                control={(
                                    <Toggle
                                        isChecked={reminders}
                                        onChange={(e) => handleToggle('Session reminders', e.target.checked, setReminders)}
                                    />
                                )}
                            />
                            <SettingRow
                                id="setting-reminder-lead-time"
                                label="Reminder lead time"
                                description={
                                    reminders
                                        ? 'How far ahead we send your session reminder email.'
                                        : 'Turn on session reminders above to choose a lead time.'
                                }
                                isDisabled={!reminders}
                                control={(
                                    <Select
                                        spacing="compact"
                                        isSearchable={false}
                                        options={REMINDER_LEAD_OPTIONS}
                                        value={leadTime}
                                        onChange={handleLeadTimeChange}
                                    />
                                )}
                            />
                            <SettingRow
                                id="setting-weekly-digest"
                                label="Weekly digest"
                                description="Receive a Monday summary of completed sessions."
                                control={(
                                    <Toggle
                                        isChecked={digest}
                                        onChange={(e) => handleToggle('Weekly digest', e.target.checked, setDigest)}
                                    />
                                )}
                            />
                        </div>
                    </Section>
                    <Section title="Connected accounts">
                        <div>
                            <SettingRow
                                id="setting-google-calendar"
                                label="Google Calendar"
                                description="Sync upcoming tutoring sessions to your calendar."
                                status={(
                                    <StatusTag appearance={calendarConnected ? 'success' : 'default'}>
                                        {calendarConnected ? 'Connected' : 'Not connected'}
                                    </StatusTag>
                                )}
                                control={(
                                    <Button
                                        appearance="default"
                                        spacing="compact"
                                        onClick={handleCalendarToggle}
                                    >
                                        {calendarConnected ? 'Disconnect' : 'Connect'}
                                    </Button>
                                )}
                            />
                        </div>
                    </Section>
                </Section>
            </InAppFrame>
            {savedTitle && (
                <FlagGroup containerPosition="absolute">
                    <Flag
                        appearance="success"
                        title={savedTitle}
                        show={Boolean(savedTitle)}
                        onDismiss={() => setSavedTitle(null)}
                    />
                </FlagGroup>
            )}
        </div>
    );
};

/** The settings page framed in its browser window for the Forms pattern page. */
export const SettingsPageInWindow = ({ address = 'app.plus.org/settings', height = SETTINGS_PAGE_HEIGHT }) => (
    <BrowserWindow address={address} height={height}>
        <SettingsPage />
    </BrowserWindow>
);
