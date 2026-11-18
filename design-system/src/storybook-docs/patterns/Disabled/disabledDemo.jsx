import React, { useState } from 'react';

import { Button, ButtonItem, IconButton, RadioGroup, SectionMessage, Select, Sidebar, TextField } from '@/components';
import { DocsOverlayBoundary } from '@/storybook-docs/lib/docs-overlay-boundary.jsx';
import { LiveMenu } from '@/storybook-docs/lib/dropdown-menu-cases.jsx';

/**
 * The Disabled pattern's examples, drawn with the real Button, TextField,
 * Select, RadioGroup, SectionMessage, DropdownMenu and Sidebar. Each
 * picture starts in the state its heading names, and stays interactive: none
 * carries a reason in a tooltip; the reason is visible text where the cause is.
 *
 *   Explains            an action that stays enabled and says what is missing
 *   DisabledWithReason  a disabled field, the caption its reason
 *   WaitsOnField        a Select that waits on another field, its caption the reason
 *   OptionCannotApply   a radio option whose description line is the reason
 *   BlocksAction        a warning SectionMessage above fields that cannot be used yet
 *   SelfEvident         Back on step one and a Danger button until the name matches
 *   Sending             the one time a button disables, Cancel still live
 *   HiddenForRole       a menu with no Delete: left out for this role
 *   LockedToolkitDemo   a Sidebar with Toolkit locked during onboarding
 */

/** The width the card pictures lay out at, so their words stay legible at card size. Docs geometry, in px. */
export const CARD_STAGE = 600; // docs-literal

const noop = () => {};
const pad = { padding: 'var(--page-pad)', boxSizing: 'border-box' };
const column = { ...pad, display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)', maxInlineSize: 'var(--card-min-width-lg)' };
const buttons = { display: 'flex', gap: 'var(--inline-md)' };

export const SCHOOLS = [
    { value: 'lincoln', label: 'Lincoln Middle School' },
    { value: 'roosevelt', label: 'Roosevelt Elementary' },
];

/** An action stays enabled: the field it needs is marked and the button still presses. */
export const Explains = () => {
    const [student, setStudent] = useState('');
    const [marked, setMarked] = useState(true);
    const [saved, setSaved] = useState(false);
    const missing = marked && student.trim().length === 0;

    return (
        <div style={column}>
            <TextField
                label="Student"
                isRequired
                value={student}
                onChange={(e) => {
                    setStudent(e.target.value);
                    setSaved(false);
                }}
                isInvalid={missing}
                errorMessage="Enter the student's name."
                successMessage={saved ? 'Session saved.' : undefined}
            />
            <div style={buttons}>
                <Button
                    text="Save session"
                    appearance="primary"
                    onClick={() => {
                        if (student.trim().length === 0) {
                            setMarked(true);
                            setSaved(false);
                        } else {
                            setMarked(false);
                            setSaved(true);
                        }
                    }}
                />
                <Button
                    text="Cancel"
                    appearance="subtle"
                    onClick={() => {
                        setStudent('');
                        setMarked(true);
                        setSaved(false);
                    }}
                />
            </div>
        </div>
    );
};

/** A disabled field with its reason as the caption, visible text that keeps full contrast. */
export const DisabledWithReason = () => (
    <div style={column}>
        <TextField label="Time" value="" onChange={noop} isDisabled caption="Choose a date first." />
    </div>
);

const GROUPS = [
    { value: 'algebra-b', label: 'Algebra B · Tue 4:00 PM' },
    { value: 'geometry-a', label: 'Geometry A · Thu 4:30 PM' },
];

const TIMES = [
    { value: '4pm', label: '4:00 PM' },
    { value: '430pm', label: '4:30 PM' },
];

/** A field that waits on another on this screen: faded, out of the tab order, the caption says what to do. */
export const WaitsOnField = ({ school: initialSchool = null }) => {
    const [school, setSchool] = useState(initialSchool);
    const [group, setGroup] = useState(null);
    return (
        <DocsOverlayBoundary fit={false} containHeight>
            <div style={column}>
                <Select label="School" options={SCHOOLS} value={school} onChange={setSchool} />
                <Select
                    label="Group"
                    options={GROUPS}
                    value={group}
                    onChange={setGroup}
                    dependsOn={{ value: school, label: 'a school' }}
                />
            </div>
        </DocsOverlayBoundary>
    );
};

/** An option that cannot apply: its description line carries the reason and the rest of the list is live. */
export const OptionCannotApply = () => {
    const [slot, setSlot] = useState(null);
    return (
        <div style={column}>
            <RadioGroup
                legend="Time slot"
                value={slot}
                onChange={setSlot}
                options={[
                    { value: '3', label: '3:00 PM' },
                    { value: '4', label: '4:00 PM', isDisabled: true, description: 'Ms. Ortiz has a session then.' },
                    { value: '5', label: '5:00 PM' },
                ]}
            />
        </div>
    );
};

/** A prerequisite that blocks several items: a warning above says how to turn them on. */
export const BlocksAction = () => {
    const [hasSchool, setHasSchool] = useState(false);
    const [group, setGroup] = useState(null);
    const [time, setTime] = useState(null);
    const resetSchool = () => {
        setHasSchool(false);
        setGroup(null);
        setTime(null);
    };
    return (
        <DocsOverlayBoundary fit={false} containHeight>
            <div style={column}>
                {hasSchool ? (
                    <SectionMessage
                        appearance="success"
                        title="School added"
                        dismissible={false}
                        actions={[{ text: 'Remove school', onClick: resetSchool }]}
                    >
                        Group and Time are ready to schedule.
                    </SectionMessage>
                ) : (
                    <SectionMessage
                        appearance="warning"
                        title="No school yet"
                        dismissible={false}
                        actions={[{ text: 'Add school', onClick: () => setHasSchool(true) }]}
                    >
                        Add a school to this group to schedule sessions.
                    </SectionMessage>
                )}
                <Select
                    label="Group"
                    options={GROUPS}
                    value={group}
                    onChange={setGroup}
                    isDisabled={!hasSchool}
                    caption={hasSchool ? undefined : 'Needs a school first.'}
                />
                <Select
                    label="Time"
                    options={TIMES}
                    value={time}
                    onChange={setTime}
                    isDisabled={!hasSchool}
                    caption={hasSchool ? undefined : 'Needs a school first.'}
                />
            </div>
        </DocsOverlayBoundary>
    );
};

/** Self-evident cases need no reason beyond what is on screen: Back on step one, Danger until the name matches. */
export const SelfEvident = () => {
    const [step, setStep] = useState(0);
    const [confirm, setConfirm] = useState('Lincoln');
    return (
        <div style={column}>
            <div style={buttons}>
                <Button text="Back" appearance="subtle" isDisabled={step === 0} onClick={() => setStep(0)} />
                <Button text="Next" appearance="primary" onClick={() => setStep(1)} />
            </div>
            <TextField
                label="Type the school name to confirm"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                caption="Type Lincoln Middle School."
            />
            <div style={buttons}>
                <Button
                    text="Remove school"
                    appearance="danger"
                    isDisabled={confirm !== 'Lincoln Middle School'}
                    onClick={noop}
                />
            </div>
        </div>
    );
};

/** Sending: the one time a button disables. The label swaps for a spinner at the same width; Cancel stays live. */
export const Sending = () => {
    const [sending, setSending] = useState(true);
    return (
        <div style={column}>
            <div style={buttons}>
                <Button
                    text="Save session"
                    appearance="primary"
                    isLoading={sending}
                    onClick={() => setSending(true)}
                />
                <Button text="Cancel" appearance="subtle" onClick={() => setSending(false)} />
            </div>
        </div>
    );
};

/** What a role can never use is left out: this tutor's row menu has Edit and Remove from group, and no Delete school. */
export const HiddenForRole = () => (
    <div style={pad}>
        <LiveMenu
            minWidth="var(--menu-group-min-width)"
            trigger={<IconButton icon="ellipsis" label="More" appearance="subtle" onClick={noop} />}
        >
            <ButtonItem onClick={noop}>Edit</ButtonItem>
            <ButtonItem onClick={noop}>Remove from group</ButtonItem>
        </LiveMenu>
    </div>
);

const LOCKED_SIDEBAR_GROUPS = [
    { id: 'home', items: [{ id: 'home', text: 'Home', icon: 'house' }] },
    {
        id: 'training',
        title: 'Training',
        items: [
            { id: 'lessons', text: 'Lessons', icon: 'lightbulb', training: 'lessons' },
            { id: 'onboarding', text: 'Onboarding', icon: 'compass', training: 'modules' },
        ],
    },
    {
        id: 'toolkit',
        title: 'Toolkit',
        lockedDuringOnboarding: true,
        items: [
            { id: 'sessions', text: 'Sessions', icon: 'calendar' },
            { id: 'students', text: 'Students', icon: 'user' },
        ],
    },
];

/** The Toolkit during onboarding: its rows stay visible and locked in the live Sidebar. */
export const LockedToolkitDemo = () => {
    const [activeId, setActiveId] = useState('onboarding');
    return (
        <DocsOverlayBoundary fit={false} containHeight>
            <div style={pad}>
                {/* Sidebar.examples.jsx defines `Box` unexported, so mirror its docked Frame sidebar wrapper here. */}
                <div className="plus-frame__sidebar plus-frame__sidebar--docked not-prose sb-unstyled">
                    <Sidebar
                        label="Toolkit during onboarding"
                        storageKey={null}
                        onToggle={noop}
                        groups={LOCKED_SIDEBAR_GROUPS}
                        modulesLeft={3}
                        activeId={activeId}
                        onSelect={setActiveId}
                        onHome={() => setActiveId('home')}
                    />
                </div>
            </div>
        </DocsOverlayBoundary>
    );
};
