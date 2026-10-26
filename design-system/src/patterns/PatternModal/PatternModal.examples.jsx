import React from 'react';
import PatternModal from '@/patterns/PatternModal';
import { Button, Input } from '@/components';

/**
 * Live compositions for the Modal page's do and don't pairs. Each is a real
 * PatternModal, held to the width of its card instead of the screen's.
 */
const fit = { width: '100%', maxWidth: 384 };

/** Keeps the docs page heading styles off the Modal title: the docs fence canvases by the docs-story class. */
const Plain = ({ children }) => <div className="docs-story sb-unstyled" style={{ width: '100%' }}>{children}</div>;

const actions = (primary) => (
    <>
        <Button text="Cancel" style="secondary" fill="outline" size="small" onClick={() => {}} />
        <Button text={primary} style="primary" fill="filled" size="small" onClick={() => {}} />
    </>
);

const stack = (gap, children) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>{children}</div>
);

const field = (label, placeholder) => <Input label={label} placeholder={placeholder} size="small" />;

/** The actions sit in the footer slot, apart from the fields. */
export const FooterActions = () => (
    <Plain>
    <PatternModal title="Rename session" style={fit} onClose={() => {}} footer={actions('Save')}>
        {field('Session name', 'Algebra I review')}
    </PatternModal>
    </Plain>
);

/** The buttons sit in the body with the fields, and the footer is off. */
export const ButtonsInBody = () => (
    <Plain>
    <PatternModal title="Rename session" style={fit} onClose={() => {}}>
        {stack('var(--modal-stack-md)', (
            <>
                {field('Session name', 'Algebra I review')}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--modal-inline-sm)' }}>
                    {actions('Save')}
                </div>
            </>
        ))}
    </PatternModal>
    </Plain>
);

/** Two groups: stack-md inside a group, stack-lg between groups. */
export const GroupedFields = () => (
    <Plain>
    <PatternModal title="Create session" style={fit} onClose={() => {}} footer={actions('Create')}>
        {stack('var(--modal-stack-lg)', (
            <>
                {stack('var(--modal-stack-md)', (
                    <>
                        {field('School', 'Select a school')}
                        {field('Teacher', 'Select a teacher')}
                    </>
                ))}
                {stack('var(--modal-stack-md)', (
                    <>
                        {field('Session date', 'Tuesday, June 3')}
                        {field('Session time', '11:00 am')}
                    </>
                ))}
            </>
        ))}
    </PatternModal>
    </Plain>
);

/** Four fields at one gap read as one long list. */
export const UngroupedFields = () => (
    <Plain>
    <PatternModal title="Create session" style={fit} onClose={() => {}} footer={actions('Create')}>
        {stack('var(--modal-stack-md)', (
            <>
                {field('School', 'Select a school')}
                {field('Teacher', 'Select a teacher')}
                {field('Session date', 'Tuesday, June 3')}
                {field('Session time', '11:00 am')}
            </>
        ))}
    </PatternModal>
    </Plain>
);

const line = (text) => <p style={{ margin: 0, font: 'var(--body-default)' }}>{text}</p>;

/** Views of one session, opened in any order. */
export const TabsForViews = () => (
    <Plain>
    <PatternModal
        title="Session settings"
        style={fit}
        onClose={() => {}}
        footer={actions('Save')}
        tabs={[
            { key: 'details', label: 'Details', content: line('Tutor Ana Ruiz · Thursday, 4:30–5:15 PM') },
            { key: 'students', label: 'Students', content: line('Twelve students') },
            { key: 'notes', label: 'Notes', content: line('Reviewed factoring.') },
        ]}
    />
    </Plain>
);

/** Numbered tabs fake a sequence. */
export const TabsAsSteps = () => (
    <Plain>
    <PatternModal
        title="Add a student"
        style={fit}
        onClose={() => {}}
        footer={(
            <>
                <Button text="Back" style="secondary" fill="outline" size="small" onClick={() => {}} />
                <Button text="Next" style="primary" fill="filled" size="small" onClick={() => {}} />
            </>
        )}
        tabs={[
            { key: 'student', label: '1. Student', content: field('Student name', 'Maya Patel') },
            { key: 'schedule', label: '2. Schedule', content: line('Pick a time.') },
            { key: 'confirm', label: '3. Confirm', content: line('Review and add.') },
        ]}
    />
    </Plain>
);

/** Three short labels that fit on one line. */
export const FewLabels = () => (
    <Plain>
    <PatternModal
        title="Tutor profile"
        style={fit}
        onClose={() => {}}
        footer={<Button text="Close" style="secondary" fill="outline" size="small" onClick={() => {}} />}
        tabs={[
            { key: 'overview', label: 'Overview', content: line('24 sessions this term · 96% attendance') },
            { key: 'sessions', label: 'Sessions', content: line('Session list') },
            { key: 'notes', label: 'Notes', content: line('Notes') },
        ]}
    />
    </Plain>
);

/** Six long labels run past the modal's width. */
export const CrowdedLabels = () => (
    <Plain>
    <PatternModal
        title="Tutor profile"
        style={fit}
        onClose={() => {}}
        footer={<Button text="Close" style="secondary" fill="outline" size="small" onClick={() => {}} />}
        tabs={[
            { key: 'overview', label: 'Overview', content: line('24 sessions this term · 96% attendance') },
            { key: 'upcoming', label: 'Upcoming sessions', content: line('Upcoming') },
            { key: 'past', label: 'Past sessions', content: line('Past') },
            { key: 'training', label: 'Training progress', content: line('Training') },
            { key: 'notes', label: 'Notes', content: line('Notes') },
            { key: 'settings', label: 'Settings', content: line('Settings') },
        ]}
    />
    </Plain>
);
